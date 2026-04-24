# Anxiety Decoder · Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans for the cookbook tasks. The framework tasks (visual polish, benchmark tuning, cold-start outreach) require human creative judgment — dispatch subagents only for the well-specified sub-steps inside them.

**Goal:** Turn the Phase 3 product from "functionally complete MVP" into "demo-ready / portfolio-ready / first-cohort-launchable" product (spec §15 Phase 4). This covers: visual polish, AI prompt iteration based on real-user benchmark samples, error-state UI, Landing A/B copy variants, demo-seeding ("示例焦虑" one-click fill), `/privacy` page, Vercel production deploy with a real domain, a standalone PRD document for the portfolio, and the first-cohort cold-start execution (spec §19).

**Architecture:** Two task streams —
- **Cookbook stream** (deterministic, TDD-style): error UI, `/privacy` page, example-anxiety seed, Vercel config, PRD document outline, benchmark-sample infrastructure
- **Framework stream** (iterative, human-in-loop): visual polish (color / type / motion), AI prompt tuning (what the benchmark infrastructure enables, not the tuning itself), verification-email wording polish, cold-start Tier 1/2/3 execution

Phase 4 **does not add new user-facing features**. Everything builds on Phases 1-3's bones.

**Tech Stack:** same as Plans 1-3. No new dependencies except:
- `framer-motion` (optional, for polish animations — recommended but defer to the visual-polish framework task)
- Vercel account (for deploy)

**Spec reference:** §15 Phase 4, §17 (open questions to close), §18.2.4 (Landing privacy commitment + /privacy page), §19 (cold-start plan)

**Prior plans:** Plans 1, 2, 3

---

## Pre-flight Checklist

- [ ] Plan 3 tagged `phase-3-complete`; 3 E2E tests all green; 25+ Vitest tests passing
- [ ] You have a domain you intend to use (optional for dev, required for production-quality demo). If none, Vercel's `*.vercel.app` subdomain works.
- [ ] A curated set of 5-8 real worry dumps from Phase 1-3 manual testing. Save them somewhere — they become the benchmark dataset in Task 5.
- [ ] A list of 10-15 names for Tier 1 seed outreach (spec §19.3). If you haven't made one yet, make it now — this is the single most leverage-able part of Phase 4.

---

## Stream A: Cookbook Tasks (Tasks 1-10)

These are fully specified. Each has TDD/verification steps and can be executed by a subagent or inline.

---

### Task 1: Error-state UI — LLM failure recovery

**Files:**
- Modify: `app/page.tsx`, `app/decode/[sessionId]/page.tsx`, `app/decode/[sessionId]/result/page.tsx`

The decode and conversation pages currently use a flat error string. Consolidate into a reusable component that shows friendly copy + a retry button. Spec §9 says: "LLM timeout / error: retry once with exponential backoff, then show «AI 走神了» friendly error with retry button".

- [ ] **Step 1: Create `components/RetryError/index.tsx`**

```tsx
// components/RetryError/index.tsx
'use client';

interface RetryErrorProps {
  message: string;
  onRetry: () => void;
  busy: boolean;
}

export default function RetryError({ message, onRetry, busy }: RetryErrorProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3 items-start">
      <p className="text-sm text-stone-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {busy ? '重试中…' : '再试一次'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `lib/retry.ts`**

```ts
// lib/retry.ts
export async function retryOnce<T>(
  fn: () => Promise<T>,
  delayMs = 600,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    await new Promise((r) => setTimeout(r, delayMs));
    return fn();
  }
}
```

- [ ] **Step 3: Wire into `app/page.tsx` submit flow**

In the landing page, replace the inline `setError('AI 走神了，再来一次？')` + plain `<p>` with `<RetryError>` that re-invokes the submit handler. Use `retryOnce` inside `handleSubmit` to auto-retry once before surfacing the error UI. Same pattern in `app/decode/[sessionId]/page.tsx` for `handleSend` and in `app/decode/[sessionId]/result/page.tsx` for `handleLaunch`.

- [ ] **Step 4: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add components/RetryError lib/retry.ts app/page.tsx \
      app/decode/[sessionId]/page.tsx app/decode/[sessionId]/result/page.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(ux): RetryError component + auto-retry on LLM failure"
```

---

### Task 2: Empty-state + 404 UI

**Files:**
- Create: `app/not-found.tsx`
- Modify: `app/history/page.tsx` (empty-state copy already exists — polish)

- [ ] **Step 1: Create `app/not-found.tsx`**

```tsx
// app/not-found.tsx
export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 gap-6">
      <p className="text-6xl text-stone-300">404</p>
      <p className="text-stone-700">这里没有内容。</p>
      <a href="/" className="text-sm text-stone-500 underline">
        回到首页
      </a>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/not-found.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(ux): 404 page"
```

---

### Task 3: Example-anxiety one-click fill (demo seed)

**Files:**
- Modify: `components/WorryInput/index.tsx`

Spec §13 risk: "面试官 demo 不愿写真担心 — 准备 2-3 条'示例焦虑'一键填充". Interview demos need a low-friction first input.

- [ ] **Step 1: Define the seed in `data/exampleAnxieties.ts`**

```ts
// data/exampleAnxieties.ts
export const exampleAnxieties: readonly string[] = [
  '我应该改简历但是已经拖了一周。每次打开 Word 看一眼就关掉，担心投了被拒，也担心不投窗口期过了。',
  '明天导师要见我讨论开题。文献综述只写了一半，PPT 还没动，联系两个老师的邮件也没发，一想到就想躲起来。',
  '要不要投这家公司的暑期实习？投的话怕被拒心态崩；不投又觉得同期的同学都在推进。现在进度零。',
] as const;
```

- [ ] **Step 2: Modify `components/WorryInput/index.tsx`**

Just below the textarea's closing tag, add a "例子" chip row that populates the textarea:

```tsx
import { exampleAnxieties } from '@/data/exampleAnxieties';

// ...inside component, above the submit row:
<div className="flex gap-2 items-center">
  <span className="text-xs text-stone-500">没思路？试试：</span>
  {exampleAnxieties.map((ex, i) => (
    <button
      type="button"
      key={i}
      onClick={() => setText(ex)}
      className="text-xs text-stone-600 underline hover:text-stone-800"
      disabled={busy}
    >
      例 {i + 1}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add data/exampleAnxieties.ts components/WorryInput/index.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(ux): 3 example anxieties for demo one-click fill"
```

---

### Task 4: `/privacy` detailed page

**Files:**
- Create: `app/privacy/page.tsx`

Spec §18.2.4 Landing privacy commitment already exists in-app. This task writes the "read more" landing target.

- [ ] **Step 1: Create `app/privacy/page.tsx`**

Content (render as long-form, no login needed):

```tsx
// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10">
      <article className="mx-auto max-w-2xl prose prose-stone text-stone-700">
        <h1 className="text-2xl font-medium text-stone-800">隐私说明</h1>
        <p className="text-xs text-stone-500 mb-6">最后更新：2026-04-25</p>

        <h2 className="text-lg text-stone-800 mt-6 mb-2">我存什么</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>你写下的担心原文（30 天后自动删除）</li>
          <li>AI 从原文里提取的分类结果（长期保留，这是你的证据库）</li>
          <li>你回来以后的 emoji 反馈 + 一句话（长期保留）</li>
          <li>如果你留了邮箱：邮箱本身，用来发事后验证提醒</li>
        </ul>

        <h2 className="text-lg text-stone-800 mt-6 mb-2">我不存什么</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>你的身份 —— 没有账号，只有浏览器指纹（换设备就是新身份）</li>
          <li>你的输入草稿 —— 只在你本机浏览器里，不会发到服务器</li>
          <li>任何第三方分析 / 追踪工具</li>
        </ul>

        <h2 className="text-lg text-stone-800 mt-6 mb-2">AI 厂商</h2>
        <p>
          解码过程调用 Anthropic Claude API。Anthropic 的默认政策是{' '}
          <a href="https://privacy.anthropic.com/en/articles/7996868-is-my-data-used-for-model-training" className="underline">不用 API 数据训练模型</a>
          。除 Anthropic 外，没有其他 AI 供应商接触你的担心内容。
        </p>

        <h2 className="text-lg text-stone-800 mt-6 mb-2">你怎么管理</h2>
        <p>
          任何时候打开 <a href="/settings/data" className="underline">数据管理页</a>，可以查看当前浏览器存了什么、导出所有数据、或一键删除。删除不可撤销。
        </p>

        <h2 className="text-lg text-stone-800 mt-6 mb-2">如果你想联系我</h2>
        <p>关于隐私的任何问题，邮件到 wuyifei0208@gmail.com。</p>

        <a href="/" className="block mt-10 text-sm text-stone-500 underline">← 回到首页</a>
      </article>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/privacy/page.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(app): /privacy page per §18.2.4"
```

---

### Task 5: Prompt benchmark dataset infrastructure

**Files:**
- Create: `tests/prompts/benchmarks/` directory
- Create: `tests/prompts/benchmarks/samples.json`
- Create: `tests/prompts/run-benchmarks.mjs` (Node script, not Vitest)

Spec §14: "AI 管线的端到端样本测试 —— 5~8 个真实担心样本覆盖启动/救援 × 清晰/模糊 × 长/短；每次 prompt 改动做一次回归（人眼 diff，不做自动断言，因为 LLM 输出漂移让断言脆）。"

This task builds the infrastructure. The actual prompt tuning happens in Stream B Framework Task F1.

- [ ] **Step 1: Create `tests/prompts/benchmarks/samples.json`**

Seed it with the 5-8 real dumps you saved during Phases 1-3 manual testing. If you don't have saved samples, synthesize them to fit the matrix below. Required coverage:

```json
[
  {
    "id": "01-starting-clear-short",
    "label": "启动状态 / 任务清晰 / 短",
    "dump": "今天想写申请文书但一直没开始"
  },
  {
    "id": "02-starting-clear-long",
    "label": "启动状态 / 任务清晰 / 长",
    "dump": "<paste a real ~80 char dump>"
  },
  {
    "id": "03-starting-fuzzy-short",
    "label": "启动状态 / 任务模糊 / 短",
    "dump": "想干点什么又不知道该干什么，就是烦"
  },
  {
    "id": "04-rescue-clear-short",
    "label": "救援状态 / 任务清晰 / 短",
    "dump": "简历已经拖了一周，今天又过去了"
  },
  {
    "id": "05-rescue-clear-long",
    "label": "救援状态 / 任务清晰 / 长",
    "dump": "<paste a real ~120 char dump>"
  },
  {
    "id": "06-rescue-fuzzy-long",
    "label": "救援状态 / 任务模糊 / 长",
    "dump": "<paste a real fuzzy dump>"
  },
  {
    "id": "07-emotion-only",
    "label": "纯情绪无任务（应触发 needMoreInfo）",
    "dump": "就是特别烦，什么都不想动，好累好累"
  },
  {
    "id": "08-task-only",
    "label": "纯任务无担心（AI 应追问担心点）",
    "dump": "我要改简历"
  }
]
```

- [ ] **Step 2: Create `tests/prompts/run-benchmarks.mjs`**

```js
// tests/prompts/run-benchmarks.mjs
// Runs the current prompt pipeline against benchmark samples.
// Writes timestamped output markdown for human-eye diff across prompt versions.
//
// Usage:
//   node tests/prompts/run-benchmarks.mjs
//   Output: tests/prompts/benchmarks/runs/YYYY-MM-DD-HHMM.md

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// We need to run inside the project so the Anthropic SDK / env vars work.
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '../..'));

// Load env from .env.local (simple loader, no dotenv dep).
const envText = readFileSync('.env.local', 'utf8');
for (const line of envText.split('\n')) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const [k, ...v] = line.split('=');
  process.env[k.trim()] = v.join('=').trim();
}

// Import the engine using dynamic import so env is loaded first.
const { callDetectAndAskFirst, callClassifyAndCompose } = await import(
  '../../lib/core/decodeEngine.ts'
);

const samples = JSON.parse(
  readFileSync('tests/prompts/benchmarks/samples.json', 'utf8'),
);

const runsDir = 'tests/prompts/benchmarks/runs';
if (!existsSync(runsDir)) mkdirSync(runsDir, { recursive: true });

const now = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const outPath = `${runsDir}/${now}.md`;

const lines = [`# Benchmark run · ${now}`, ''];
for (const s of samples) {
  console.log(`Running ${s.id}...`);
  try {
    const { state, question } = await callDetectAndAskFirst(s.dump);
    // For classification, fake a minimal conversation with just the dump + one reply.
    const convo = [
      { role: 'user', content: s.dump },
      { role: 'assistant', content: question },
      { role: 'user', content: '[benchmark: assume user gave a reasonable follow-up reply]' },
    ];
    const { worries, primary_action, headline } = await callClassifyAndCompose(
      state,
      convo,
    );

    lines.push(`## ${s.id} · ${s.label}`);
    lines.push('');
    lines.push('**Dump:** ' + s.dump);
    lines.push('');
    lines.push('- **state:** `' + state + '`');
    lines.push('- **question:** ' + question);
    lines.push('- **headline:** ' + headline);
    lines.push('- **primary_action:** ' + primary_action);
    lines.push('- **worries:**');
    for (const w of worries) {
      lines.push(`  - [${w.category}] ${w.content}`);
    }
    lines.push('');
  } catch (e) {
    lines.push(`## ${s.id} ❌`);
    lines.push('Error: ' + String(e));
    lines.push('');
  }
}

writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Wrote ' + outPath);
```

Note: this requires Node 20+ and TSX. If direct `.ts` import fails, add `npm install -D tsx` and run with `npx tsx tests/prompts/run-benchmarks.mjs` (change script extension to `.ts` accordingly).

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add tests/prompts
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "test(prompts): benchmark infrastructure (8 samples + regression runner)"
```

**This task is the INFRASTRUCTURE. Running the actual tuning is Stream B Task F1.**

---

### Task 6: Vercel deploy configuration

**Files:**
- Modify: `vercel.json` (already created in Plan 2 Task 18; extend)
- Create: `.vercelignore`

- [ ] **Step 1: Extend `vercel.json`**

Add production regions + function timeout configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-verification-emails",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/purge-old-raw",
      "schedule": "0 4 * * *"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

- [ ] **Step 2: Create `.vercelignore`**

```
supabase/
docs/
tests/
*.md
.env.local*
```

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add vercel.json .vercelignore
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "chore: Vercel production config (function timeout + ignore list)"
```

- [ ] **Step 4: USER — link project + deploy**

```bash
cd "/Users/evette/Documents/简历/Anxiety_decoder"
npx vercel login
npx vercel link
```

Follow prompts. Then set production env vars (copy from `.env.local`):

```bash
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add RESEND_API_KEY production
npx vercel env add CRON_SECRET production
npx vercel env add APP_URL production    # set to your production domain
```

Deploy:

```bash
npx vercel --prod
```

Verify at the URL printed. Run `/api/health` against the prod domain.

---

### Task 7: Header + footer navigation polish

**Files:**
- Create: `components/AppNav/index.tsx`
- Modify: landing, history, settings pages to use it

Currently different pages have different nav links scattered. Consolidate.

- [ ] **Step 1: Create `components/AppNav/index.tsx`**

```tsx
// components/AppNav/index.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-4 right-4 flex gap-3 text-xs text-stone-500">
      {pathname !== '/' && (
        <Link href="/" className="underline hover:text-stone-700">
          首页
        </Link>
      )}
      {pathname !== '/history' && (
        <Link href="/history" className="underline hover:text-stone-700">
          过往
        </Link>
      )}
      {pathname !== '/settings/data' && (
        <Link href="/settings/data" className="underline hover:text-stone-700">
          数据
        </Link>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Mount in `app/layout.tsx`**

```tsx
// app/layout.tsx (add import + include in body)
import AppNav from '@/components/AppNav';

// Inside <body>, before {children}:
<AppNav />
```

Remove the one-off `<a href="/history">` link from the landing page and return page (added in Plan 3 Task 16) — now redundant.

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add components/AppNav app/layout.tsx app/page.tsx \
      app/decode/[sessionId]/return/page.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(components): AppNav in root layout"
```

---

### Task 8: PRD packaging (portfolio document)

**Files:**
- Create: `docs/PRD.md`

Spec §16 lists 9 narrative points. This task writes a standalone PRD document readable without context — the artifact you send to recruiters.

- [ ] **Step 1: Write `docs/PRD.md`**

Outline (fill in each section from the main spec at `docs/superpowers/specs/2026-04-25-anxiety-decoder-design.md`):

```markdown
# 焦虑解码器 · Product Requirements Document

*Standalone PRD for portfolio use. For full design rationale, see `docs/superpowers/specs/2026-04-25-anxiety-decoder-design.md`.*

## 1. 问题与洞察

（cross-reference spec §1.2）
**核心洞察**：70% 的任务回避，其背后什么具体的事情都没有。

## 2. 目标用户

学生 / 研究生 / 申请者。**为什么不是所有焦虑型用户**：this user segment has task-based procrastination at high frequency and low oversight.

## 3. 竞品与差异化

- vs 待办类（Todoist）
- vs 冥想/CBT（Headspace / Woebot）
- vs 日记/番茄（Daylio / Forest）

定位：**生产力工具，服务焦虑型使用者** — not therapy, not journaling.

## 4. 核心体验设计

（cross-reference spec §3）
- 单次解码闭环
- 长期价值循环
- 落地仪式（Opening Ritual）

## 5. 9 个关键设计决策

（expand each of the 9 items in spec §16 into ~150 words）

## 6. 指标体系

- 北极星：正向完成率（MVP） → 邮箱留存率（成熟期）
- 为什么分阶段：不让错的阶段用错指标优化错事情

## 7. MVP 范围 + 已砍掉的事

（cross-reference spec §10 + §11）

## 8. 架构与工程成熟度

- AI 管线从 6 次演化到 3 次关键路径调用 —— 延迟驱动的架构演化故事
- Web-first + iOS 预留
- 隐私作为第三支柱

## 9. 风险与验证

（spec §13 + §12.3 数据命题证伪条件）

## 10. 冷启动计划

（spec §19 summary）

## Live demo

[Production URL]

## 项目仓库

[GitHub URL]
```

- [ ] **Step 2: Fill in each section** (use the spec as source — don't invent new content)

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add docs/PRD.md
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "docs: standalone PRD for portfolio submission"
```

---

### Task 9: Landing copy A/B test setup

**Files:**
- Modify: `app/page.tsx`
- Create: `lib/landingCopy.ts`

Spec §17: "Landing 页初版文案的 A 版 / B 版内容 —— 留给 Phase 4". For now, prepare a simple hash-based split on fingerprint (50/50), log which variant served, and analyze after cold-start cohort runs through.

- [ ] **Step 1: Create `lib/landingCopy.ts`**

```ts
// lib/landingCopy.ts
export interface LandingCopy {
  variant: 'A' | 'B';
  headline: string;
  subheadline: string;
  placeholder: string;
  privacyLine: string;
}

export const COPY_A: LandingCopy = {
  variant: 'A',
  headline: '你现在在回避什么？',
  subheadline: '',
  placeholder: '把你现在脑子里所有担心倒出来。乱写也行，没关系。',
  privacyLine: '你写的东西只用来帮你解码这一次。原文 30 天后自动删除。',
};

export const COPY_B: LandingCopy = {
  variant: 'B',
  headline: '脑子里的担心，大多数其实是雾。',
  subheadline: '把它们倒出来，看看剩多少。',
  placeholder: '你现在想干什么、怕什么、躲什么 —— 一次写完。',
  privacyLine: '写的这段 30 天后会自动从服务器删掉。',
};

/**
 * Deterministic A/B bucket based on fingerprint.
 * Same fingerprint → same variant across visits.
 */
export function pickCopy(fingerprint: string): LandingCopy {
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = (hash << 5) - hash + fingerprint.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2 === 0 ? COPY_A : COPY_B;
}
```

- [ ] **Step 2: Use it in `app/page.tsx`**

```tsx
import { pickCopy, type LandingCopy } from '@/lib/landingCopy';

// inside component
const [copy, setCopy] = useState<LandingCopy | null>(null);
useEffect(() => {
  setCopy(pickCopy(getOrCreateFingerprint()));
}, []);

// in JSX, replace hard-coded "你现在在回避什么？" with copy.headline, etc.
```

You'll also need to plumb `copy.placeholder` and `copy.privacyLine` into `WorryInput` (pass as props, add optional props with defaults).

- [ ] **Step 3: Log variant on session creation**

For analysis, pass the served variant in POST /api/sessions body. Extend the route to accept + record it (optional MVP: just send it; don't store for now — store in a Phase 5 analytics table). For Phase 4, logging to the console + a simple fire-and-forget telemetry endpoint is enough.

- [ ] **Step 4: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add lib/landingCopy.ts app/page.tsx components/WorryInput/index.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(ux): Landing A/B copy variants with deterministic fingerprint bucket"
```

---

### Task 10: Final E2E sweep

**Files:**
- Modify: existing E2E specs

- [ ] **Step 1: Update E2E specs to use new placeholder text**

If Task 9's COPY_B variant is served to the Playwright browser, the existing specs' selectors (`'把你现在脑子里所有担心倒出来'`) break. Option 1: seed a fixed fingerprint in the Playwright browser to force COPY_A. Option 2: use a more robust selector.

Simplest: add `await page.addInitScript(() => localStorage.setItem('anxiety_decoder_fp', '00000000-0000-0000-0000-000000000000'))` at the top of each spec. Given our hash, 0000...0 → pick COPY_A.

- [ ] **Step 2: Run full E2E suite**

```bash
npm run test:e2e
```

Expected: 3 tests pass (decode-flow, verify-flow, history-flow).

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add tests/e2e
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "test(e2e): pin fingerprint to force COPY_A during tests"
```

---

## Stream B: Framework Tasks (F1-F4)

These are **NOT step-by-step TDD tasks**. They are iterative work that produces judgment-driven output. Each has:
- Goal
- Success criterion
- Checklist of specific sub-steps
- Exit condition

Dispatch subagents ONLY for the well-specified sub-steps (e.g., "write 3 versions of verification email copy for review" is dispatchable; "decide which version wins" is not).

---

### Framework Task F1: Prompt tuning loop

**Goal:** Based on benchmark runs from Task 5, iterate on the 4 prompts until outputs stop improving on the 8 samples.

**Success criterion (subjective):** For each benchmark sample, the output passes the "show to 3 friends" test — do they read the `primary_action` as something they'd actually do in 5 minutes? Is the classification correct? Is the tone right?

**Checklist:**

- [ ] Run `node tests/prompts/run-benchmarks.mjs`. Save the output markdown as v1.
- [ ] Read through all 8 outputs carefully. For each, note:
  - Is the `state` classification correct?
  - Is every worry assigned the right category? (look for AI-hallucinated "real" items when the user was vague → should be "fog")
  - Is `primary_action` ≤ 30 chars and actually doable in 5 minutes?
  - Is `headline` ≤ 15 chars and warm?
  - Are any禁用 words present? ("焦虑", "治愈", "放松", "加油", "其实你...", "你应该")
- [ ] Edit `/lib/prompts/*.ts` to fix observed issues. Common edits:
  - Add specific禁用 words to the禁用 list
  - Strengthen the "有疑义归 fog" principle with a concrete example in the prompt
  - Add a negative example for `primary_action` (e.g., "不接受：写一个月的论文计划")
- [ ] Re-run benchmark, save as v2. Diff against v1 in your editor (side-by-side markdown).
- [ ] Iterate 2-3 rounds. Stop when each round's changes are mostly style-neutral.
- [ ] Commit each version of the prompts with a message like `refactor(prompts): tune classifyAndCompose — fewer false-positive real classifications` and the benchmark run markdown as evidence.

**Exit condition:** All 8 samples pass the "show to friends" subjective test. You feel the outputs are "good enough for first cohort use".

---

### Framework Task F2: Visual polish

**Goal:** From the current functional-but-flat stone+emerald+amber palette, produce a visual identity that feels distinct, warm, and credible.

**Success criterion (subjective):** You can screenshot the result page and post it on Xiaohongshu without embarrassment. The card invites screenshotting / sharing.

**Checklist (not sequential — iterate):**

- [ ] Pick a type system: current is default sans-serif. Consider: Noto Sans SC + a character feature font for the card headline (e.g., Noto Serif SC) — gives the card gravitas without heaviness. Document choice in `app/layout.tsx`.
- [ ] Pick a more distinct color. Current stone-50 is fine background, but consider warmer/cooler accents for the three buckets. Key constraint: the real bucket must feel most present; catastrophic muted-amber; fog almost-invisible grey.
- [ ] Add motion polish (install `framer-motion`):
  - Opening ritual fade: currently CSS transition, upgrade to spring animation
  - Decode card reveal: currently instant render. Add a staggered reveal (headline → real bucket → catastrophic → fog) over ~400ms. This is the "仪式感" moment.
  - Chip reclassify: when user moves a worry, animate the transition (fade out in old bucket, fade in new bucket)
- [ ] Revisit the `/card/[id]` layout for screenshot aesthetics. Current is functional; polish padding, add a subtle watermark/footer ("from 焦虑解码器"), ensure screenshot PNG is 1200×1200 or similar share-friendly aspect.
- [ ] Rerun all E2E tests after each polish pass to ensure selectors still work.

**Dispatchable sub-steps:**
- "Install framer-motion and add a staggered reveal to DecodeCard" is a concrete subagent task.
- "Choose a color palette" is NOT — it requires human taste.

**Exit condition:** You're willing to put the URL on your resume.

---

### Framework Task F3: Verification email copy polish

**Goal:** Spec §17 + §13 flag verification email wording as a HIGH risk: "措辞写不好会重新激活焦虑". Current Call 5 prompt produces acceptable but untested output.

**Success criterion (subjective):** 3 real people (friends who fit the target user profile) read the email and say "I'd click" rather than "this made me anxious".

**Checklist:**

- [ ] Write 3 distinct variants of the verification email body (not just opener — the whole email). Variants might differ in:
  - Framing: "curious check-in" vs "evidence invitation" vs "friendly reminder"
  - Length: 1 sentence vs 3 sentences vs paragraph
  - Tone: matter-of-fact vs gentle
- [ ] Send each variant (via `resend.emails.send` directly from a test script, not via the live cron) to your own email
- [ ] Have 3 friends read all 3. Ask them: "If you got this email about a thing you were worried about 3 days ago, which one are you most likely to click?"
- [ ] Pick the winner. Update Call 5 prompt (`lib/prompts/verificationEmail.ts`) to match the winning variant's style.
- [ ] Update the HTML template in `app/api/cron/send-verification-emails/route.ts` to match.

**Dispatchable sub-step:**
- "Write 3 versions of a 2-sentence gentle email opener about a 3-day-old catastrophic worry, with different tones" → subagent can draft candidates.

**Exit condition:** Committed verified-human-reviewed wording in the production prompt + template.

---

### Framework Task F4: Cold start Tier 1/2/3 execution

**Goal:** Execute spec §19's outreach plan. Hit the quantitative targets:
- 20-30 real users (not you, not repeat devices)
- 50-80 total decodes
- ≥5 with 2+ decodes (value signal)
- ≥6 opt-in emails (secondary metric)
- ≥3 responded verifications

**Success criterion:** All 5 numbers hit within 4 weeks of production deploy.

**Checklist:**

**Week 0 (pre-launch prep, BEFORE Task 6 deploy):**
- [ ] Finalize list of 10-15 Tier 1 contacts (spec §19.3): friends you know have anxiety/procrastination issues. Your call.
- [ ] Draft the Tier 1 DM template. Keep it 2 sentences: "Made a thing for when you can't start. 30 seconds to try. [URL]". Don't pitch. Don't explain.
- [ ] Draft the Tier 2 post (Xiaohongshu / 即刻). Lead with the insight, not the product. Example structure: observation → personal story → one-line tool link.
- [ ] Decide Tier 3 scope: 即刻 is more tolerant than 知乎; r/procrastination is best international audience. Pick 1-2 places, don't spam everywhere.

**Week 1 (production deploy day):**
- [ ] Deploy via Task 6.
- [ ] Send DM to 10-15 Tier 1 contacts. Wait 48h.

**Weeks 2-3:**
- [ ] Post Tier 2 content. Measure click-through in first 24h.
- [ ] If Tier 2 underperforms, post a second variant with different framing.

**Week 3 (only if Tier 1+2 < 20 users):**
- [ ] Tier 3 post. Expect noisy responses — filter for the actual target user (students / applicants).

**Week 4 (review):**
- [ ] Pull numbers from Supabase: count sessions, count opt-in emails, count responded verifications.
- [ ] Hit targets? → write a cold-start retrospective in `docs/COLD_START.md`.
- [ ] Missed targets? → identify which funnel step is the blocker (spec §19.4 漏斗). The answer drives what to fix first: if the first-sentence-submit rate is low, polish Landing more; if retention is the issue, polish the core experience more.

**Ethical guardrails (spec §19.5):**
- Don't reverse-lookup friend contents in the DB. Ever.
- Don't pressure Tier 1 for feedback.
- If a Tier 1 contact reports the product made them feel WORSE, stop their invitation, fix the issue, and don't reach out again until fixed.

**This task is NOT subagent-dispatchable.** It's the human-driven distribution work.

---

## Self-Review Checklist

- [ ] **§15 Phase 4 任务清单** — Tasks 1, 2, 3, 4, 5, 6, 8, 9, 10 cover error UI / 404 / example-seed / privacy / benchmark infrastructure / Vercel / PRD / Landing A/B / E2E. F1, F2, F3 cover prompt tuning / visual / email copy. F4 covers cold start.
- [ ] **§17 open questions all closed:**
  - 解码卡视觉 → F2
  - Landing 文案 A/B → Task 9
  - 手动修正分类交互形式 → closed in Plan 1 (dropdown menu)
  - 事后验证邮件模板 → F3
  - 落地仪式短句库扩充 → leave as F-minor (add 20 more quotes if desired; out of scope for Phase 4 "core" polish)
- [ ] **§18.2.4 /privacy page** — Task 4
- [ ] **§19 cold start** — F4 with all 5 quantitative targets spelled out

---

## Completion

When Phase 4 is done, tag:

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette tag phase-4-complete
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette tag v1.0
```

At this point the product is:
- Deployed to a public URL
- Has 20+ real users who completed the loop
- Has a polished PRD in `docs/PRD.md`
- Has evidence data accumulated for the core product thesis

**Next phases (post-Phase-4, out of scope for these plans):**
- Phase 5: Iterate based on cold-start feedback (pick whichever funnel step lost the most users and fix)
- Phase 6: If northern-star data is strong, upgrade email retention to primary north star and start working on commit-device-based long-term features
- Phase 7: iOS client (the `/lib/core` + `/lib/prompts` architecture was designed for this)
