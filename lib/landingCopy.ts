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
