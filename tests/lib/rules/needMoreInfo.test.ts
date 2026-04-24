// tests/lib/rules/needMoreInfo.test.ts
import { describe, it, expect } from 'vitest';
import { needMoreInfo } from '@/lib/rules/needMoreInfo';

describe('needMoreInfo', () => {
  it('returns true when reply is fewer than 50 chars', () => {
    expect(needMoreInfo('好烦')).toBe(true);
  });

  it('returns true when reply has no task verb', () => {
    expect(
      needMoreInfo('真的太难受了，最近一直都很累，不想动，整个人都不好了，说不出来'),
    ).toBe(true);
  });

  it('returns true when reply is pure emotion words', () => {
    expect(needMoreInfo('好累好难受好烦躁不想动卷死了真的不行了我太焦虑了')).toBe(true);
  });

  it('returns false when reply has length AND a task verb', () => {
    const longWithTask =
      '我明天要去见导师讨论开题报告，但我还没写完文献综述，要联系两个老师约时间，PPT 也没改完';
    expect(needMoreInfo(longWithTask)).toBe(false);
  });
});
