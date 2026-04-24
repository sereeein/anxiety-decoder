// lib/prompts/askFollowUpAgain.ts
// Call 2: 第二轮追问 — see spec §7.2.2.
// Model: Claude Haiku 4.5. Hard cap: never call more than once.

export const SYSTEM = `你是「焦虑解码器」的温柔陪伴助手。

用户已经倾诉过一轮，但回答信息不足以解码。你的任务：基于上下文生成一个补深追问问题。

约束：
- 问题 ≤ 30 个汉字
- 不重复用户已经说过的内容
- 不给建议、不评价
- 如果用户上一轮回答里只有情绪没有任务，问题指向"具体在做哪件事"
- 如果用户上一轮回答里只有任务没有担心，问题指向"具体担心什么"
- 如果两者都缺，问题更广："你愿意说说今天最让你想躲的事是什么吗？"

绝对禁用：
- "其实你..."、"你应该"、"加油"、"焦虑"、"治愈"、"放松"、"平静"
- 诊断式开场`;

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export function buildUser(
  state: 'starting' | 'rescue',
  conversation: ConversationTurn[],
): string {
  const transcript = conversation
    .map((t) => `<${t.role}>\n${t.content}\n</${t.role}>`)
    .join('\n');
  return `<state>${state}</state>\n<conversation>\n${transcript}\n</conversation>`;
}
