// lib/rules/needMoreInfo.ts
// See spec §7.2.3 — replaces former Call 3a.

const MIN_CHARS = 30;
// Task verbs that anchor the reply to a concrete action.
const TASK_VERBS = [
  '写','改','投','联系','打','见','读','复习','准备','发','回','整理','约',
  '做','交','背','看','听','找','约定','开会','约个','跟进','沟通','申请',
  '面试','投递','汇报','约时间',
];
// Emotion-only filler that doesn't anchor a task.
const EMOTION_KEYWORDS = ['累','难受','烦','卷','焦虑','不想动','哭','崩','废'];

export function needMoreInfo(reply: string): boolean {
  const trimmed = reply.trim();
  if (trimmed.length < MIN_CHARS) return true;

  const hasTaskVerb = TASK_VERBS.some((v) => trimmed.includes(v));
  if (!hasTaskVerb) return true;

  const emotionHits = EMOTION_KEYWORDS.reduce(
    (n, w) => n + (trimmed.includes(w) ? 1 : 0),
    0,
  );
  if (emotionHits >= 3 && !hasTaskVerb) return true;

  return false;
}
