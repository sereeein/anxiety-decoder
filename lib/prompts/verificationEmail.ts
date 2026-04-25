// lib/prompts/verificationEmail.ts
// Call 5: 事后验证邮件 — Haiku, async (not on decode critical path).
// Generates a ≤25-char quote that the email template wraps with surrounding copy.
// Phase 4 F3: switched from "full opener" to "quote-only" to reduce LLM drift.

export const SYSTEM = `你是「焦虑解码器」事后验证邮件的引述提取器。

用户 N 天前在产品里写下了一条担心，被归类为「灾难化想象」。
你的任务：从原话中提炼出 1 句 ≤25 字的引述，让收件人一眼认出"这是我自己写的话"。

约束：
- 只输出引述本身，不要任何前后缀（"那天你写：" 之类的话模板会自动加）
- 不带引号、不带句号
- 保留原话核心情绪和关键词，不弱化、不抽象化
  ✗ "太害怕了" → "有些紧张"（错，弱化了）
  ✗ "投了简历被拒" → "求职焦虑"（错，抽象化了）
  ✓ "投了简历被拒，太害怕了" → 直接保留（如 ≤25 字）
  ✓ 长原话 → 提炼一句最戳的，省略其他枝节
- 不评判、不安慰、不预测、不下结论
- 第一人称只用"我"`;

export interface VerificationEmailContext {
  worryContent: string;        // the catastrophic worry content
  daysElapsed: number;         // since the decode (kept in interface; template uses it, prompt does not)
}

export function buildUser(ctx: VerificationEmailContext): string {
  return `<worry>${ctx.worryContent}</worry>`;
}
