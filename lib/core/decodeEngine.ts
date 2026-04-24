// lib/core/decodeEngine.ts
// Single owner of all Claude calls (Calls 1, 2, 3, 4) for the core decode loop.
// API routes import from here; nothing else talks to /lib/ai directly.

import type Anthropic from '@anthropic-ai/sdk';
import { getClaudeClient, MODELS } from '@/lib/ai/claudeClient';
import * as detectAndAskFirst from '@/lib/prompts/detectAndAskFirst';
import * as askFollowUpAgain from '@/lib/prompts/askFollowUpAgain';
import * as classifyAndCompose from '@/lib/prompts/classifyAndCompose';
import * as companionCopy from '@/lib/prompts/companionCopy';
import type { ConversationTurn } from '@/lib/prompts/askFollowUpAgain';

const HAIKU_MAX_TOKENS = 256;
const SONNET_MAX_TOKENS = 1024;

/**
 * Extract the input object from a Claude tool_use response.
 * Throws if no tool_use block is present.
 */
export function extractToolInput<T = unknown>(
  message: Anthropic.Message,
): T {
  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  );
  if (!block) throw new Error('no tool_use block in Claude response');
  return block.input as T;
}

/** Call 1 — detect state + first follow-up question. */
export async function callDetectAndAskFirst(
  initialDump: string,
): Promise<detectAndAskFirst.DetectAndAskOutput> {
  const claude = getClaudeClient();
  const message = await claude.messages.create({
    model: MODELS.HAIKU,
    max_tokens: HAIKU_MAX_TOKENS,
    system: detectAndAskFirst.SYSTEM,
    tools: [detectAndAskFirst.TOOL],
    tool_choice: { type: 'tool', name: detectAndAskFirst.TOOL.name },
    messages: [{ role: 'user', content: detectAndAskFirst.buildUser(initialDump) }],
  });
  return extractToolInput<detectAndAskFirst.DetectAndAskOutput>(message);
}

/** Call 2 — second-round follow-up (only if needMoreInfo says so). */
export async function callAskFollowUpAgain(
  state: 'starting' | 'rescue',
  conversation: ConversationTurn[],
): Promise<string> {
  const claude = getClaudeClient();
  const message = await claude.messages.create({
    model: MODELS.HAIKU,
    max_tokens: HAIKU_MAX_TOKENS,
    system: askFollowUpAgain.SYSTEM,
    messages: [
      { role: 'user', content: askFollowUpAgain.buildUser(state, conversation) },
    ],
  });
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) throw new Error('Call 2 returned empty text');
  return text;
}

/** Call 3 — classify worries + generate primary_action + headline. */
export async function callClassifyAndCompose(
  state: 'starting' | 'rescue',
  conversation: ConversationTurn[],
): Promise<classifyAndCompose.ClassifyOutput> {
  const claude = getClaudeClient();
  const message = await claude.messages.create({
    model: MODELS.SONNET,
    max_tokens: SONNET_MAX_TOKENS,
    system: classifyAndCompose.SYSTEM,
    tools: [classifyAndCompose.TOOL],
    tool_choice: { type: 'tool', name: classifyAndCompose.TOOL.name },
    messages: [
      { role: 'user', content: classifyAndCompose.buildUser(state, conversation) },
    ],
  });
  return extractToolInput<classifyAndCompose.ClassifyOutput>(message);
}

/** Call 4 — companion copy for the wait page. */
export async function callCompanionCopy(
  state: 'starting' | 'rescue',
  primaryAction: string,
): Promise<string> {
  const claude = getClaudeClient();
  const message = await claude.messages.create({
    model: MODELS.HAIKU,
    max_tokens: HAIKU_MAX_TOKENS,
    system: companionCopy.SYSTEM,
    messages: [
      { role: 'user', content: companionCopy.buildUser(state, primaryAction) },
    ],
  });
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) throw new Error('Call 4 returned empty text');
  return text;
}
