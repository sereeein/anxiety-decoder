// data/openingQuotes.ts
// Opening Ritual seed quotes (spec §3.4.4).
// Constraints: ≤20 Chinese characters, tool voice (not therapeutic),
// no forbidden words ("焦虑", "治愈", "放松", "你应该", etc).

export const openingQuotes: readonly string[] = [
  '不去想两个小时以后和五公里外的事',
  '你脑子里 90% 的事此刻都不需要解决',
  '现在不知道答案是允许的',
  '只决定接下来五分钟',
  '焦虑常常是脑子在做没人要求它做的工作',
  '想得越远，能动的越少',
  '把一件事做完不是仪式，开始才是',
  '你不需要先平静下来才能开始',
  '脑子比你以为的可信度低',
  '下一步比下个月更重要',
] as const;
