// tests/lib/db/verifications.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateToken, buildVerifyUrl } from '@/lib/db/verifications';

describe('verifications helpers', () => {
  it('generates a token at least 32 chars long', () => {
    const t = generateToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
  });

  it('each generated token is unique', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });

  it('builds a verify URL from app base + token', () => {
    const url = buildVerifyUrl('https://example.com', 'abc123');
    expect(url).toBe('https://example.com/verify/abc123');
  });

  it('handles trailing slash in APP_URL', () => {
    expect(buildVerifyUrl('https://example.com/', 'abc')).toBe(
      'https://example.com/verify/abc',
    );
  });
});
