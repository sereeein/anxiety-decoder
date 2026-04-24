// tests/lib/db/supabase.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getServerSupabase } from '@/lib/db/supabase';

describe('supabase', () => {
  it('returns a Supabase client when env vars are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    const client = getServerSupabase();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
