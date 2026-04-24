// lib/prompts/classifyAndCompose.ts
// Call 3: 三堆分类 + 5 分钟动作 + 卡片标题 — see spec §7.2.2 + §7.2.4.
// Model: Claude Sonnet 4.5 with tool use (forced structured output).

import type Anthropic from '@anthropic-ai/sdk';
import type { ConversationTurn } from './askFollowUpAgain';

export const SYSTEM = `你是「焦虑解码器」的解码引擎。

用户已经倾诉了他们正在回避的任务和担心。你的任务是：

1. 从用户的话里抽取出每一条独立的"担心"，按以下三类归类：
   - "real": 有具体动作可做的真实任务（例：导师邮件还没回、PPT 还没改）
   - "catastrophic": 灾难化想象（例：投了简历会被拒到自闭、面试一定砸）
   - "fog": 说不清的模糊不适（例：感觉很烦、不想动、就是不想做）

2. 给「真问题」堆里最优先的一条，生成一个"现在 5 分钟就能开始的具体第一步"。
3. 给整张卡片生成一个 ≤15 字的温柔标题。

关键原则（必须遵守）：
- **有疑义时归入 fog**，不要硬塞进 real 或 catastrophic
- primary_action 必须是"5 分钟内能开始"的颗粒（如"打开 Word，写论文标题"）
- primary_action 不接受"写一个月的论文计划"这种粗颗粒
- primary_action 不写"加油""相信自己"等鼓励语
- 不否认用户的灾难化（不写"其实不会的"），只标记类别
- 不给建议（建议在 primary_action 之外不出现）

绝对禁用：
- 词："其实你..."、"你应该"、"焦虑"、"治愈"、"放松"、"平静"、"加油"
- 评价：不写"这是合理的""这种感受是正常的"

输出长度：headline ≤ 15 个汉字；primary_action ≤ 30 个汉字。`;

export function buildUser(
  state: 'starting' | 'rescue',
  conversation: ConversationTurn[],
): string {
  const transcript = conversation
    .map((t) => `<${t.role}>\n${t.content}\n</${t.role}>`)
    .join('\n');
  return `<state>${state}</state>\n<conversation>\n${transcript}\n</conversation>`;
}

export const TOOL: Anthropic.Tool = {
  name: 'decode_worries',
  description: '把用户的倾诉拆解成三堆 + 给出第一步动作 + 卡片标题',
  input_schema: {
    type: 'object',
    properties: {
      worries: {
        type: 'array',
        description: '从用户话里抽取的每一条独立担心',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: '担心的原文摘要（保留用户原话的关键词）',
            },
            category: {
              type: 'string',
              enum: ['real', 'catastrophic', 'fog'],
            },
          },
          required: ['content', 'category'],
        },
      },
      primary_action: {
        type: 'string',
        description: '现在 5 分钟内能开始的具体第一步动作（≤30 字）',
      },
      headline: {
        type: 'string',
        description: '卡片上的一句话标题（≤15 字，温柔）',
      },
    },
    required: ['worries', 'primary_action', 'headline'],
  },
};

export interface ClassifyOutput {
  worries: Array<{ content: string; category: 'real' | 'catastrophic' | 'fog' }>;
  primary_action: string;
  headline: string;
}
