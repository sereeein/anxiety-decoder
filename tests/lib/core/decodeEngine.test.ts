// tests/lib/core/decodeEngine.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { extractToolInput } from '@/lib/core/decodeEngine';

describe('extractToolInput', () => {
  it('returns the input from a tool_use block', () => {
    const message = {
      content: [
        { type: 'text', text: 'thinking...' },
        {
          type: 'tool_use',
          id: 'toolu_1',
          name: 'detect_state_and_ask',
          input: { state: 'starting', question: '具体哪一步卡住？' },
        },
      ],
    };
    expect(extractToolInput(message as never)).toEqual({
      state: 'starting',
      question: '具体哪一步卡住？',
    });
  });

  it('throws when no tool_use block is present', () => {
    const message = { content: [{ type: 'text', text: 'no tool' }] };
    expect(() => extractToolInput(message as never)).toThrow(/no tool_use/i);
  });
});
