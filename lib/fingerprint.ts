// lib/fingerprint.ts
export const FINGERPRINT_KEY = 'anxiety_decoder_fp';

export function getOrCreateFingerprint(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateFingerprint must be called in the browser');
  }
  const existing = localStorage.getItem(FINGERPRINT_KEY);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  localStorage.setItem(FINGERPRINT_KEY, fresh);
  return fresh;
}
