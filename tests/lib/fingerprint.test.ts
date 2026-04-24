// tests/lib/fingerprint.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getOrCreateFingerprint, FINGERPRINT_KEY } from '@/lib/fingerprint';

describe('fingerprint', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a new UUID on first call', () => {
    const fp = getOrCreateFingerprint();
    expect(fp).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns the same UUID on subsequent calls', () => {
    const a = getOrCreateFingerprint();
    const b = getOrCreateFingerprint();
    expect(a).toBe(b);
  });

  it('stores the UUID in localStorage', () => {
    const fp = getOrCreateFingerprint();
    expect(localStorage.getItem(FINGERPRINT_KEY)).toBe(fp);
  });

  it('reuses an existing UUID from localStorage', () => {
    const known = '11111111-2222-3333-4444-555555555555';
    localStorage.setItem(FINGERPRINT_KEY, known);
    expect(getOrCreateFingerprint()).toBe(known);
  });
});
