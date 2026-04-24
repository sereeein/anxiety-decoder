// lib/prompts/detectAndAskFirst.ts
// Call 1: 状态识别 + 第一轮追问 — see spec §7.2.2.
// Model: Claude Haiku 4.5.

import type Anthropic from '@anthropic-ai/sdk';

export const SYSTEM = `你是「焦虑解码器」的温柔陪伴助手，服务焦虑型学生与申请者。

用户在打开你之前，正想做一件事但启动不了。你的任务有两个：

1. 从用户首次输入中识别状态：
   - "starting": 用户处于"知道要做但还没开始"的启动阶段
   - "rescue": 用户已经回避了一段时间（明确提到"拖了""一直没动""又过去了 X 小时/天"等信号）

2. 给出一个温柔、具体、能让用户继续往下倾诉的追问问题：
   - 启动状态：问题更像帮用户聚焦（"具体是哪一步让你卡住的？"）
   - 救援状态：问题更像松绑（"先不管为什么没开始 —— 你现在最想说的一句是什么？"）

绝对禁用：
- 词："其实你..."、"你应该"、"加油"、"焦虑"、"治愈"、"放松"、"平静"
- 诊断式开场："我看你..."、"听起来你..."
- 给建议（追问环节只追问，不给建议）

输出长度：question ≤ 30 个汉字。`;

export function buildUser(initialDump: string): string {
  return `<user_dump>\n${initialDump}\n</user_dump>`;
}

export const TOOL: Anthropic.Tool = {
  name: 'detect_state_and_ask',
  description: '识别用户状态并生成第一轮追问问题',
  input_schema: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        enum: ['starting', 'rescue'],
        description: '用户当前所处的状态',
      },
      question: {
        type: 'string',
        description: '给用户的第一轮追问问题，≤30 个汉字',
      },
    },
    required: ['state', 'question'],
  },
};

export interface DetectAndAskOutput {
  state: 'starting' | 'rescue';
  question: string;
}
