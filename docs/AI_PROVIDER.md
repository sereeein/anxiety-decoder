# AI Provider · 当前结构与替换指南

回答两个问题：
1. **当前 AI 是不是只用 Claude？** —— 是。
2. **换 API 或模型时改哪些地方？** —— 看下方三种场景。

---

## 0. 一句话总览

**单一供应商：Anthropic Claude**。所有 5 次 LLM 调用都集中在 `lib/core/decodeEngine.ts`，通过 `lib/ai/claudeClient.ts` 单例使用 `@anthropic-ai/sdk`。模型 ID 也只在 `claudeClient.ts` 一个文件里写死。

**没有用** OpenAI / Gemini / DeepSeek / 文心 / Vercel AI Gateway 等其他任何供应商。Resend（邮件）是另一回事，跟 LLM 无关。

---

## 1. 当前 5 次 LLM 调用一览

全部在 `lib/core/decodeEngine.ts`，按 spec §8.2 的设计：

| Call | 函数 | 模型 | 输出形式 | 关键路径？|
|---|---|---|---|---|
| 1 | `callDetectAndAskFirst` | Haiku 4.5 | **Tool use 结构化** `{state, question}` | ✅ 是 |
| 2 | `callAskFollowUpAgain` | Haiku 4.5 | 纯文本 | 仅当 needMoreInfo 命中 |
| 3 | `callClassifyAndCompose` | **Sonnet 4.5** | **Tool use 结构化** `{worries, primary_action, headline}` | ✅ 是（核心解码）|
| 4 | `callCompanionCopy` | Haiku 4.5 | 纯文本 | 否（异步陪伴文案）|
| 5 | `callComposeVerificationEmail` | Haiku 4.5 | 纯文本 | 否（cron 异步邮件）|

**关键观察**：
- Call 1 和 Call 3 用了 Anthropic SDK 的 **tool use** 强制结构化输出（`tools: [...]` + `tool_choice: { type: 'tool', name: ... }`），保证 LLM 必返回特定 schema 的 JSON。**这一机制每家供应商语法不同**，是替换时最大的工作量。
- Call 2 / 4 / 5 是普通 text completion，没有 schema 约束，相对好替换。

---

## 2. 当前文件结构（涉及 LLM 的全部文件）

```
lib/ai/claudeClient.ts          ← 客户端单例 + 模型 ID 集中点（**模型替换的入口**）
lib/core/decodeEngine.ts        ← 5 次调用全部在这里（**SDK 替换的核心战场**）
lib/prompts/
  ├ detectAndAskFirst.ts        ← Call 1 prompt + TOOL 定义（用 Anthropic.Tool 类型）
  ├ askFollowUpAgain.ts         ← Call 2 prompt（纯 SYSTEM 字符串，无 SDK 依赖）
  ├ classifyAndCompose.ts       ← Call 3 prompt + TOOL 定义（用 Anthropic.Tool 类型）
  ├ companionCopy.ts            ← Call 4 prompt（纯 SYSTEM 字符串，无 SDK 依赖）
  └ verificationEmail.ts        ← Call 5 prompt（纯 SYSTEM 字符串，无 SDK 依赖）
app/api/health/route.ts         ← health check 里引用 anthropic（小改）
package.json                    ← @anthropic-ai/sdk 依赖
.env.local                      ← ANTHROPIC_API_KEY
Vercel env vars                 ← ANTHROPIC_API_KEY（生产）
```

**几个要点**：
- `lib/prompts/{askFollowUpAgain, companionCopy, verificationEmail}.ts` 是 **provider-agnostic** 的（只导出 SYSTEM 字符串和 `buildUser` 函数）—— **换供应商不用改**
- `lib/prompts/{detectAndAskFirst, classifyAndCompose}.ts` 引用了 `Anthropic.Tool` 类型 —— **换供应商需要把 TOOL 定义改成新供应商的等价 schema**

---

## 3. 三种替换场景

### 场景 A · 只换 Claude 内部模型（最快，~1 分钟）

**用例**：Claude 出新版本（如 Sonnet 4.6 → 4.7），或想把 Sonnet 降到 Haiku 省钱。

**改 1 个文件**：`lib/ai/claudeClient.ts`

```ts
export const MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001',     // ← 改这里
  SONNET: 'claude-sonnet-4-5',            // ← 或这里
} as const;
```

**验证**：
```bash
npm run dev   # 本地跑一次完整解码
# health check：curl http://localhost:3000/api/health
```

**注意**：
- 模型 ID 必须是 Anthropic 官方 ID（带或不带日期戳都行；带日期戳更稳定）
- 更换 SOnnet → Haiku 之类的"降级"会**显著降低分类质量**（Sonnet 是 Call 3 的重头戏，三堆分类质量直接挂钩）
- max_tokens 在 `decodeEngine.ts:14-15` 写死 256/1024，超大模型可能不够，按需调

---

### 场景 B · 换 Anthropic 兼容的供应商（中等，~30 分钟）

**用例**：想用 Vercel AI Gateway（统一鉴权 + 故障转移 + 观测）、或某些供应商提供 Anthropic 兼容的 endpoint。

**Vercel AI Gateway** 是目前最推荐的路径（GA since 2025-08）—— 它代理 Anthropic 等多家供应商，业务代码几乎不改，只换初始化参数。

**改 2 个文件**：

#### `lib/ai/claudeClient.ts`

```ts
import Anthropic from '@anthropic-ai/sdk';

export const MODELS = {
  HAIKU: 'anthropic/claude-haiku-4-5',    // ← 加 provider 前缀
  SONNET: 'anthropic/claude-sonnet-4-5',  // ← 同上
} as const;

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.AI_GATEWAY_API_KEY,         // ← 换 env 名
      baseURL: 'https://gateway.ai.vercel.com/v1',    // ← 加 baseURL
    });
  }
  return client;
}
```

#### `.env.local` 和 Vercel env vars

- 删 `ANTHROPIC_API_KEY`
- 加 `AI_GATEWAY_API_KEY`（在 Vercel dashboard → Storage → AI Gateway 拿）

**验证 + 部署**：
```bash
npm run dev          # 本地测全流程
npx vercel --prod    # 上线
```

**好处**：
- 自动故障转移：Anthropic 挂时可配 fallback 到其他供应商
- 统一 observability：在 Vercel dashboard 看每次调用的 latency / cost / token usage
- 零数据保留：default 不向供应商发用户内容做训练

**注意**：
- Tool use schema 不用动 —— Gateway 透传给底层 Anthropic，行为一致
- 计费走 Vercel 账单，不走 Anthropic 直接账单

---

### 场景 C · 换到完全不同的供应商（重构，~半天到一天）

**用例**：换到 OpenAI（GPT-4 / GPT-5）、Google Gemini、DeepSeek 原生、Qwen 等不兼容 Anthropic API 的供应商。

#### Step 1 · 评估能否承担

不同供应商在三件事上的差异**直接决定能不能用**：

| 能力 | Anthropic | OpenAI | Gemini | DeepSeek 原生 | 备注 |
|---|---|---|---|---|---|
| 强制结构化输出 | tool use | function calling / structured outputs | responseSchema | function calling | **Call 1/3 必需** |
| 中文质量 | 好 | 好 | 中等 | 优（专为中文优化）| 解码卡是中文 |
| 延迟（关键路径）| Haiku ~3s, Sonnet ~5s | gpt-4o-mini ~2s, gpt-4o ~4s | gemini-flash ~1.5s | ~3s | spec §8.2 要求 ≤12s 累计 |
| 成本（per session）| ~¥0.03-0.05 | ~¥0.04-0.08 | ~¥0.01-0.02 | ~¥0.005-0.015 | 按 5 次调用粗估 |

**最敏感的是 tool use / structured output**。如果新供应商不支持强制 JSON schema（即只能"祈祷"模型按格式返回），Call 1/3 的可靠性会暴跌，需要加 retry + JSON 校验补救层。

#### Step 2 · 改动清单

**(1) 替换 SDK** — 改 `package.json`

```bash
npm uninstall @anthropic-ai/sdk
npm install openai           # 或 @google/genai 或其他
```

**(2) 重写 `lib/ai/claudeClient.ts`** —— 改名 `lib/ai/llmClient.ts` 更准确

```ts
// 以 OpenAI 为例
import OpenAI from 'openai';

export const MODELS = {
  HAIKU: 'gpt-4o-mini',         // 替 Haiku 的轻调用
  SONNET: 'gpt-4o',             // 替 Sonnet 的核心调用
} as const;

let client: OpenAI | null = null;

export function getLlmClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}
```

**(3) 重写 `lib/core/decodeEngine.ts` 的 5 个 call 函数**

每个 Anthropic 调用：
```ts
const message = await claude.messages.create({
  model: MODELS.HAIKU,
  max_tokens: 256,
  system: SYSTEM_STRING,
  tools: [TOOL],
  tool_choice: { type: 'tool', name: TOOL.name },
  messages: [{ role: 'user', content: USER_STRING }],
});
return extractToolInput(message);
```

要改成（以 OpenAI function calling 为例）：
```ts
const completion = await llm.chat.completions.create({
  model: MODELS.HAIKU,
  max_tokens: 256,
  messages: [
    { role: 'system', content: SYSTEM_STRING },
    { role: 'user', content: USER_STRING },
  ],
  tools: [{ type: 'function', function: TOOL }],
  tool_choice: { type: 'function', function: { name: TOOL.name } },
});
const args = completion.choices[0].message.tool_calls?.[0]?.function.arguments;
return JSON.parse(args ?? '{}');
```

**5 个 call 函数都要改**，外加 `extractToolInput` helper 替换。

**(4) 重写 TOOL schema 定义** —— `lib/prompts/detectAndAskFirst.ts` 和 `classifyAndCompose.ts`

Anthropic 的 `Anthropic.Tool` schema：
```ts
export const TOOL: Anthropic.Tool = {
  name: 'detect_state_and_ask',
  description: '...',
  input_schema: { type: 'object', properties: {...}, required: [...] },
};
```

OpenAI 等价：
```ts
export const TOOL = {
  name: 'detect_state_and_ask',
  description: '...',
  parameters: { type: 'object', properties: {...}, required: [...] },  // ← input_schema → parameters
};
```

Gemini 用 `responseSchema` 完全不同的语法 —— 看官方 SDK 文档。

**(5) 改 `app/api/health/route.ts`** —— 把 `anthropic` 字段改成新供应商名

**(6) 改 env 变量**
- `.env.local` 和 Vercel 都换：`ANTHROPIC_API_KEY` → `OPENAI_API_KEY` / `GOOGLE_API_KEY` 等

**(7) 删除 `prompts/{askFollowUpAgain, companionCopy, verificationEmail}.ts` 里的 `Anthropic` import（如果有）** —— 实际目前这 3 个文件没引用 SDK 类型，可能不用改

**(8) 跑一遍 prompt benchmark 验证质量没退化**
```bash
node tests/prompts/run-benchmarks.mjs   # （需要先把 runner 里的 Anthropic 调用也换掉）
```

#### Step 3 · 验证清单

- [ ] `npm test` —— 25/25 通过（单测不调真 API）
- [ ] `npx next build` —— 干净
- [ ] 本地跑一次完整解码 —— Call 1/3 的结构化输出符合 schema
- [ ] `/api/health` 返回 ok
- [ ] benchmark v3 跟 v2 输出对比 —— 质量没退化（中文表达、分类准确性、primary_action 颗粒度）
- [ ] 部署到 Vercel staging（可选）—— 生产换之前先 staging 验证一周

---

## 4. 选型建议

### 短期（v1.0 → v1.1）

**保持 Anthropic 直连**。理由：
- 当前 spec §8.2 的关键路径延迟分析、§5.10 的 prompt 调优、benchmark dataset 都基于 Claude 行为校准，换供应商等于把这部分工作部分作废
- Phase 5 数据没出来之前，"换供应商"不是优先级 —— 先把"产品命题是否成立"验证清楚

### 中期（v1.x，有真实成本数据后）

**考虑 Vercel AI Gateway**（场景 B）。Trigger 条件之一：
- API 月费 > ¥100（值得加 observability + fallback）
- Anthropic 服务不稳定有过 1 次以上影响生产
- 想引入 fallback model（如主用 Claude，Anthropic 挂时降级到 GPT-4o）

### 长期（v2.0+，命题成立后规模化）

**多供应商混合**：低风险调用（Call 2/4/5）走廉价模型省钱（DeepSeek / gpt-4o-mini），核心 Call 3 仍用 Sonnet 保质量。架构上这要求：
- `decodeEngine.ts` 引入 provider 路由层
- 每个 call 函数支持 `provider` 参数
- 引入跨供应商的统一抽象（或直接用 Vercel AI Gateway 抹平）

**这条路的代价**：debug / 成本归因 / quality 监控复杂度都上一个台阶。建议 spec 里**不写**进 v1.0 范围，到真正需要时再做。

---

## 5. 检查清单（任意场景共用）

替换完成后必跑：

- [ ] `npm test` 25/25 ✅
- [ ] `npx next build` clean ✅
- [ ] `npm run dev` 本地走一次完整解码 ✅
- [ ] `curl http://localhost:3000/api/health` 返回 ok ✅
- [ ] 跑 prompt benchmark `npx tsx tests/prompts/run-benchmarks.mjs`，跟最近的 v2 对比 ✅
- [ ] `git diff` review 一遍，确认 5 个 call 的 schema 都改对了 ✅
- [ ] Vercel env vars 同步 ✅
- [ ] `npx vercel --prod` 部署 + 生产 smoke test（走一次解码 + 收一封 verification 邮件）✅

---

**最后**：如果将来你（或接手这个项目的人）只是想"试试别的模型有没有更好"，**不要直接动生产**。流程应该是：

1. 创建 feature branch（`feat/try-gpt-4o`）
2. 在 branch 上做替换
3. 跑 benchmark 对比
4. 用 Vercel preview deploy（自动）拿到一个临时 URL 真人测试
5. 满意再 merge → main → prod

这个流程在 [docs/superpowers/plans/](superpowers/plans/) 各 phase plan 末尾的 Self-Review Checklist 都有先例可参考。
