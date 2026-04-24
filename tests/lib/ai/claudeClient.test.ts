// tests/lib/ai/claudeClient.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getClaudeClient, MODELS } from '@/lib/ai/claudeClient';

describe('claudeClient', () => {
  it('exports HAIKU and SONNET model identifiers', () => {
    expect(MODELS.HAIKU).toBe('claude-haiku-4-5-20251001');
    expect(MODELS.SONNET).toBe('claude-sonnet-4-5');
  });

  it('returns a singleton Anthropic instance', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const a = getClaudeClient();
    const b = getClaudeClient();
    expect(a).toBe(b);
  });
});
