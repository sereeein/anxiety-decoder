# Anxiety Decoder · Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the project foundation (Phase 0) and the complete core decoding loop (Phase 1) so that a stranger can open the URL → write a worry dump → see the three-bucket decoded card (with manual reclassification) → click the 5-minute action button → see the companion wait page → click "I'm back" → leave emoji + one-line feedback. Demo-ready end-to-end.

**Architecture:** Next.js 15 App Router (UI layer, future-iOS replaceable) + Supabase Postgres (data) + Anthropic Claude (Haiku 4.5 for fast/temperature-sensitive calls, Sonnet 4.5 for the high-stakes classification + action generation). Business logic lives in `/lib/core` with no UI/framework dependencies; prompts are isolated in `/lib/prompts`; API routes are thin shells over `/lib/core`. Identity is `crypto.randomUUID()` stored in localStorage — zero-friction, no accounts.

**Tech Stack:**
- Runtime: Node.js 20+ LTS, npm
- Framework: Next.js 15 (App Router) + TypeScript 5 strict mode
- Style: Tailwind CSS 4
- Database: Supabase (Postgres) via `@supabase/supabase-js`
- AI: `@anthropic-ai/sdk`
- Testing: Vitest (unit), Playwright (E2E), `@testing-library/react` (component)
- Lint: ESLint (Next.js config) + Prettier

**Spec reference:** `docs/superpowers/specs/2026-04-25-anxiety-decoder-design.md`

---

## Pre-flight Checklist

Before starting, the engineer must have:

- [ ] Node.js 20+ installed (`node --version` ≥ v20.0.0)
- [ ] npm 10+ (`npm --version`)
- [ ] git installed (`git --version`)
- [ ] An Anthropic API key (https://console.anthropic.com → Settings → API Keys)
- [ ] A Supabase account with a new empty project created (https://supabase.com/dashboard → New project)
  - Note the project URL: `https://<ref>.supabase.co`
  - Note the `anon` key and `service_role` key (Project Settings → API)
- [ ] Working directory: `/Users/evette/Documents/简历/Anxiety_decoder` (currently empty, not a git repo)

---

## File Structure Map

### Phase 0 (Foundation)

```
/Users/evette/Documents/简历/Anxiety_decoder/
├── .gitignore
├── .env.local              (ignored, holds secrets)
├── .env.local.example      (committed template)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs
├── README.md
├── /supabase
│   └── /migrations
│       └── 001_initial_schema.sql
├── /app
│   ├── layout.tsx           (root layout, font, base styles)
│   ├── page.tsx             (landing — placeholder in Phase 0)
│   ├── globals.css
│   └── /api
│       └── /health
│           └── route.ts     (GET /api/health for sanity check)
├── /lib
│   ├── /ai
│   │   └── claudeClient.ts  (wraps @anthropic-ai/sdk)
│   ├── /db
│   │   └── supabase.ts      (typed Supabase client)
│   └── /fingerprint.ts      (browser fingerprint = user id)
└── /tests
    └── /lib
        ├── /ai
        │   └── claudeClient.test.ts
        └── /fingerprint.test.ts
```

### Phase 1 (Core Decode Loop) — additions

```
├── /data
│   └── openingQuotes.ts             (10 seed quotes)
├── /lib
│   ├── /core
│   │   ├── quoteSelector.ts         (random + dedup)
│   │   └── decodeEngine.ts          (orchestrates Calls 1-4)
│   │   # NOTE: spec §7.3 also lists sessionService.ts + cardComposer.ts.
│   │   # For Phase 1 we keep that logic inline in API routes + DB layer
│   │   # to avoid premature abstraction. Promote to /lib/core when a second
│   │   # consumer (Phase 3 history page) needs the same logic.
│   ├── /prompts
│   │   ├── detectAndAskFirst.ts     (Call 1, Haiku)
│   │   ├── askFollowUpAgain.ts      (Call 2, Haiku)
│   │   ├── classifyAndCompose.ts    (Call 3, Sonnet tool use)
│   │   └── companionCopy.ts         (Call 4, Haiku)
│   ├── /rules
│   │   └── needMoreInfo.ts          (replaces former Call 3a)
│   └── /db
│       ├── users.ts
│       ├── sessions.ts
│       ├── worryItems.ts
│       └── returnFeedback.ts
├── /components
│   ├── OpeningRitual/index.tsx
│   ├── WorryInput/index.tsx
│   ├── ConversationTurn/index.tsx
│   ├── DecodeCard/index.tsx
│   ├── CategoryChip/index.tsx
│   └── CompanionWait/index.tsx
├── /app
│   ├── page.tsx                                 (landing — fully wired)
│   ├── /decode/[sessionId]
│   │   ├── page.tsx                             (conversation)
│   │   ├── /result/page.tsx                     (decoded card)
│   │   ├── /wait/page.tsx                       (companion)
│   │   └── /return/page.tsx                     (emoji feedback)
│   └── /api/sessions
│       ├── route.ts                             (POST create)
│       └── /[id]
│           ├── /turns/route.ts                  (POST add turn)
│           ├── /decode/route.ts                 (POST decode)
│           ├── /worries/[wid]/route.ts          (PATCH reclassify)
│           ├── /launch/route.ts                 (POST launched)
│           ├── /companion/route.ts              (POST → returns Call 4 copy)
│           ├── /return/route.ts                 (POST returned)
│           └── /feedback/route.ts               (POST feedback)
└── /tests
    ├── /lib
    │   ├── /core/quoteSelector.test.ts
    │   ├── /rules/needMoreInfo.test.ts
    │   └── /core/cardComposer.test.ts
    └── /e2e
        └── decode-flow.spec.ts                  (Playwright)
```

**Key boundaries:**
- `/lib/core/*` — pure business logic, no Next.js or browser APIs (iOS-portable)
- `/lib/prompts/*` — string builders only, no API calls (iOS-portable)
- `/lib/ai/*` — Anthropic SDK wrapped (replaceable per platform)
- `/lib/db/*` — Supabase access (replaceable per platform)
- `/app/api/*` — thin REST shells: validate → call `/lib/core` → return JSON
- `/components/*` — React only, web-specific

---

# Phase 0 · Foundation

## Task 1: Initialize git + Next.js project skeleton

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `README.md`

- [ ] **Step 1: Initialize git**

```bash
cd "/Users/evette/Documents/简历/Anxiety_decoder"
git init
```

Expected: `Initialized empty Git repository in ...`

- [ ] **Step 2: Run create-next-app with the exact configuration we want**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --eslint \
  --no-turbopack \
  --use-npm
```

When prompted "Would you like to use Turbopack?": choose **No** (keep it simple).
When prompted to override existing files (if `.gitignore` was missed): choose **Yes**.

Expected: directory now contains `package.json`, `app/`, `tsconfig.json`, `tailwind.config.ts`, `node_modules/`.

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Open http://localhost:3000 in browser. Expected: default Next.js welcome page renders. Stop the dev server with Ctrl+C.

- [ ] **Step 4: Commit baseline**

```bash
git add .
git commit -m "chore: initialize Next.js 15 project with TypeScript + Tailwind"
```

Expected: commit succeeds.

---

## Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install Supabase and Anthropic SDKs**

```bash
npm install @supabase/supabase-js @anthropic-ai/sdk
```

Expected: both packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Install dev dependencies (testing, types)**

```bash
npm install -D vitest @vitest/ui @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @playwright/test \
  @types/node
```

Expected: all packages added to `devDependencies`.

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install chromium
```

Expected: Chromium downloads (~150MB).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Supabase, Anthropic SDK, and testing toolchain"
```

---

## Task 3: Configure testing infrastructure (Vitest + Playwright)

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `tests/.gitkeep`
- Modify: `package.json` (add test scripts)

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 4: Add test scripts to `package.json`**

Open `package.json` and replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 5: Create `tests/.gitkeep`**

```bash
mkdir -p tests
touch tests/.gitkeep
```

- [ ] **Step 6: Smoke-test the testing setup**

Create a temporary file `tests/smoke.test.ts`:

```ts
// tests/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('can run a passing test', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: 1 test passes.

- [ ] **Step 7: Delete the smoke test, commit**

```bash
rm tests/smoke.test.ts
git add .
git commit -m "chore: configure Vitest and Playwright"
```

---

## Task 4: Create Supabase schema (migration file)

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

This task only writes the SQL file. The engineer will execute it manually in the Supabase dashboard in Step 4 below.

- [ ] **Step 1: Create the migrations directory**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Write `supabase/migrations/001_initial_schema.sql`**

```sql
-- 001_initial_schema.sql
-- Anxiety Decoder · Phase 0 + Phase 1 schema
-- See spec §5.1 for column-level rationale

-- Anonymous users: identified by browser fingerprint stored in localStorage.
-- Email is optional and added later via Phase 2.
create table anonymous_users (
  id          uuid primary key default gen_random_uuid(),
  fingerprint text unique not null,
  email       text,
  created_at  timestamptz not null default now()
);

-- A decode_session is one full use of the product.
create table decode_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references anonymous_users(id) on delete cascade,
  state          text check (state in ('starting', 'rescue')),
  initial_dump   text,
  conversation   jsonb not null default '[]'::jsonb,
  primary_action text,
  card_headline  text,
  status         text not null default 'draft'
                   check (status in ('draft', 'conversing', 'decoded', 'launched', 'returned', 'completed')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_decode_sessions_user_id on decode_sessions(user_id);
create index idx_decode_sessions_status on decode_sessions(status);

-- Each worry item is one piece of anxiety extracted by the AI.
create table worry_items (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references decode_sessions(id) on delete cascade,
  content             text not null,
  category            text not null check (category in ('real', 'catastrophic', 'fog')),
  display_order       int not null default 0,
  was_manually_edited boolean not null default false
);

create index idx_worry_items_session_id on worry_items(session_id);

-- Return-feedback is the second touch point.
create table return_feedback (
  session_id uuid primary key references decode_sessions(id) on delete cascade,
  emoji      text not null check (emoji in ('🙂', '😐', '😣')),
  one_liner  text,
  created_at timestamptz not null default now()
);

-- Updated_at trigger for decode_sessions
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_decode_sessions_updated
  before update on decode_sessions
  for each row execute function set_updated_at();
```

- [ ] **Step 3: Commit migration file**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat(db): initial schema for Phase 0+1"
```

- [ ] **Step 4: Apply schema in Supabase dashboard**

1. Go to https://supabase.com/dashboard → your project → SQL Editor → New query
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click "Run"
4. Verify in Table Editor that 4 tables exist: `anonymous_users`, `decode_sessions`, `worry_items`, `return_feedback`

Expected: all tables created without error.

---

## Task 5: Set up environment variables

**Files:**
- Create: `.env.local.example`, `.env.local`
- Modify: `.gitignore` (verify it ignores `.env.local`)

- [ ] **Step 1: Verify `.gitignore` already excludes `.env*`**

```bash
grep -E "\.env" .gitignore
```

Expected output: includes `.env*` line (Next.js default). If not, append:

```bash
echo ".env*" >> .gitignore
echo "!.env.local.example" >> .gitignore
```

- [ ] **Step 2: Create `.env.local.example`**

```bash
# .env.local.example
# Copy to .env.local and fill in real values. Never commit .env.local.

# --- Anthropic Claude ---
ANTHROPIC_API_KEY=sk-ant-xxx

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

Write this exactly to `.env.local.example` (no surrounding shell commands; it's a plain text file).

- [ ] **Step 3: Create `.env.local` with real values**

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and replace the `xxx` placeholders with the real keys from the pre-flight checklist (Anthropic console + Supabase project settings).

- [ ] **Step 4: Commit the example file**

```bash
git add .env.local.example .gitignore
git commit -m "chore: add env var template"
```

Verify `.env.local` is NOT staged: `git status` should not show it.

---

## Task 6: Build Claude client wrapper

**Files:**
- Create: `lib/ai/claudeClient.ts`
- Test: `tests/lib/ai/claudeClient.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/ai/claudeClient.test.ts`:

```ts
// tests/lib/ai/claudeClient.test.ts
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
```

- [ ] **Step 2: Run the test, watch it fail**

```bash
npm test -- claudeClient
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/ai/claudeClient.ts`**

```ts
// lib/ai/claudeClient.ts
import Anthropic from '@anthropic-ai/sdk';

export const MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001',
  SONNET: 'claude-sonnet-4-5',
} as const;

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Reset for tests
export function _resetClaudeClient(): void {
  client = null;
}
```

- [ ] **Step 4: Re-run the test, watch it pass**

```bash
npm test -- claudeClient
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/claudeClient.ts tests/lib/ai/claudeClient.test.ts
git commit -m "feat(ai): Claude client wrapper with Haiku + Sonnet model constants"
```

---

## Task 7: Build Supabase client wrapper

**Files:**
- Create: `lib/db/supabase.ts`
- Test: `tests/lib/db/supabase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/db/supabase.test.ts`:

```ts
// tests/lib/db/supabase.test.ts
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
```

- [ ] **Step 2: Run the test**

```bash
npm test -- supabase
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/db/supabase.ts`**

```ts
// lib/db/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service-role key.
 * Only call this from server-side code (API routes, server components).
 */
export function getServerSupabase(): SupabaseClient {
  if (!serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error('Supabase env vars (URL, SERVICE_ROLE_KEY) are not set');
    }
    serverClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}
```

- [ ] **Step 4: Run the test, watch it pass**

```bash
npm test -- supabase
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add lib/db/supabase.ts tests/lib/db/supabase.test.ts
git commit -m "feat(db): Supabase server client wrapper"
```

---

## Task 8: Build fingerprint logic

**Files:**
- Create: `lib/fingerprint.ts`
- Test: `tests/lib/fingerprint.test.ts`

The fingerprint is a UUID generated on first visit and stored in localStorage. It identifies the browser without requiring an account.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/fingerprint.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test**

```bash
npm test -- fingerprint
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/fingerprint.ts`**

```ts
// lib/fingerprint.ts
export const FINGERPRINT_KEY = 'anxiety_decoder_fp';

/**
 * Returns a stable UUID for this browser.
 * Generates a new one on first call, stored in localStorage.
 * Browser-only — call from client components.
 */
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
```

- [ ] **Step 4: Run the test, watch it pass**

```bash
npm test -- fingerprint
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/fingerprint.ts tests/lib/fingerprint.test.ts
git commit -m "feat: browser fingerprint via localStorage UUID"
```

---

## Task 9: Health-check API route + first deploy verification

**Files:**
- Create: `app/api/health/route.ts`
- Test: manual (curl) — Phase 0 ends here

- [ ] **Step 1: Implement health route**

Create `app/api/health/route.ts`:

```ts
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/supabase';
import { getClaudeClient, MODELS } from '@/lib/ai/claudeClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    supabase: 'unknown' as 'ok' | 'fail' | 'unknown',
    anthropic: 'unknown' as 'ok' | 'fail' | 'unknown',
  };

  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from('anonymous_users').select('id').limit(1);
    checks.supabase = error ? 'fail' : 'ok';
  } catch {
    checks.supabase = 'fail';
  }

  try {
    const client = getClaudeClient();
    // No API call — just verify client construction
    if (client && MODELS.HAIKU && MODELS.SONNET) checks.anthropic = 'ok';
  } catch {
    checks.anthropic = 'fail';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks },
    { status: allOk ? 200 : 503 },
  );
}
```

- [ ] **Step 2: Start dev server and verify**

```bash
npm run dev
```

In another terminal:
```bash
curl -s http://localhost:3000/api/health | python3 -m json.tool
```

Expected output:
```json
{
  "status": "ok",
  "checks": {
    "supabase": "ok",
    "anthropic": "ok"
  }
}
```

If `supabase: fail`, recheck `.env.local` and ensure schema was applied.
If `anthropic: fail`, recheck `ANTHROPIC_API_KEY`.

Stop the dev server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/api/health/route.ts
git commit -m "feat: /api/health route for sanity checking Supabase + Anthropic"
```

**Phase 0 acceptance**: `curl localhost:3000/api/health` returns `{"status":"ok"}`.

---

# Phase 1 · Core Decode Loop

## Task 10: Opening ritual quotes data

**Files:**
- Create: `data/openingQuotes.ts`

Static array of 10 anti-anxiety quotes (spec §3.4.4). Pure data file, no logic.

- [ ] **Step 1: Create `data/openingQuotes.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add data/openingQuotes.ts
git commit -m "feat(data): add 10 seed quotes for Opening Ritual"
```

---

## Task 11: Quote selector logic

**Files:**
- Create: `lib/core/quoteSelector.ts`
- Test: `tests/lib/core/quoteSelector.test.ts`

Pure function that picks a random quote, avoiding the last 3 shown (tracked via injected history). No localStorage access in `lib/core` — caller is responsible for persistence.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/core/quoteSelector.test.ts`:

```ts
// tests/lib/core/quoteSelector.test.ts
import { describe, it, expect } from 'vitest';
import { pickQuote } from '@/lib/core/quoteSelector';
import { openingQuotes } from '@/data/openingQuotes';

describe('pickQuote', () => {
  it('returns a quote from the bank', () => {
    const result = pickQuote([], () => 0);
    expect(result.quote).toBe(openingQuotes[0]);
    expect(result.index).toBe(0);
  });

  it('avoids the last N indices when possible', () => {
    const recent = [0, 1, 2];
    // rng returns 0.5 → index 5 in remaining {3,4,5,6,7,8,9}
    const result = pickQuote(recent, () => 0.5);
    expect(recent).not.toContain(result.index);
  });

  it('falls back to picking from full bank when recent excludes everything', () => {
    const allButOne = openingQuotes.map((_, i) => i);
    const result = pickQuote(allButOne.slice(0, openingQuotes.length - 1), () => 0);
    expect(result.index).toBe(openingQuotes.length - 1);
  });

  it('returns a valid quote even when recent is larger than the bank', () => {
    const huge = Array.from({ length: 100 }, (_, i) => i % openingQuotes.length);
    const result = pickQuote(huge, () => 0);
    expect(openingQuotes).toContain(result.quote);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npm test -- quoteSelector
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/core/quoteSelector.ts`**

```ts
// lib/core/quoteSelector.ts
import { openingQuotes } from '@/data/openingQuotes';

export interface PickedQuote {
  quote: string;
  index: number;
}

/**
 * Pick a random quote, avoiding the most recent indices when possible.
 * Pure function — caller persists `recent` (typically last 3 indices in localStorage).
 *
 * @param recent  Indices to avoid (e.g. last 3 displayed).
 * @param rng     Defaults to Math.random; injectable for tests.
 */
export function pickQuote(
  recent: readonly number[],
  rng: () => number = Math.random,
): PickedQuote {
  const all = openingQuotes.map((_, i) => i);
  const recentSet = new Set(recent);
  const candidates = all.filter((i) => !recentSet.has(i));
  // If recent excluded everything (shouldn't happen with bank ≥4 and recent ≤3),
  // fall back to the full bank to guarantee a result.
  const pool = candidates.length > 0 ? candidates : all;
  const index = pool[Math.floor(rng() * pool.length)];
  return { quote: openingQuotes[index], index };
}
```

- [ ] **Step 4: Run the test, watch it pass**

```bash
npm test -- quoteSelector
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/core/quoteSelector.ts tests/lib/core/quoteSelector.test.ts
git commit -m "feat(core): quote selector with anti-repeat and seedable RNG"
```

---

## Task 12: OpeningRitual component

**Files:**
- Create: `components/OpeningRitual/index.tsx`
- Create: `lib/quoteHistory.ts` (browser-side persistence helper)

The component shows a quote for 1.5s, fades for 0.5s, then calls `onComplete`. Click-anywhere-to-skip. Honors `prefers-reduced-motion`.

- [ ] **Step 1: Create `lib/quoteHistory.ts` (localStorage helper)**

```ts
// lib/quoteHistory.ts
const KEY = 'anxiety_decoder_quote_history';
const MAX = 3;

export function readQuoteHistory(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function pushQuoteHistory(index: number): void {
  if (typeof window === 'undefined') return;
  const current = readQuoteHistory();
  const next = [index, ...current.filter((n) => n !== index)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}
```

- [ ] **Step 2: Create `components/OpeningRitual/index.tsx`**

```tsx
// components/OpeningRitual/index.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { pickQuote } from '@/lib/core/quoteSelector';
import { pushQuoteHistory, readQuoteHistory } from '@/lib/quoteHistory';

interface OpeningRitualProps {
  onComplete: () => void;
}

const HOLD_MS = 1500;
const FADE_MS = 500;
const REDUCED_HOLD_MS = 1000;

export default function OpeningRitual({ onComplete }: OpeningRitualProps) {
  const [phase, setPhase] = useState<'hold' | 'fading'>('hold');

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  const picked = useMemo(() => {
    const recent = readQuoteHistory();
    const result = pickQuote(recent);
    pushQuoteHistory(result.index);
    return result;
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(onComplete, REDUCED_HOLD_MS);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase('fading'), HOLD_MS);
    const t2 = setTimeout(onComplete, HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete, reducedMotion]);

  return (
    <button
      type="button"
      aria-label="跳过"
      onClick={onComplete}
      className="fixed inset-0 flex items-center justify-center bg-stone-50 text-stone-700 cursor-default"
    >
      <p
        className={`max-w-md px-6 text-center text-2xl font-medium leading-relaxed transition-opacity ${
          reducedMotion
            ? 'opacity-100'
            : phase === 'hold'
            ? 'opacity-100 duration-700'
            : 'opacity-0 duration-500'
        }`}
      >
        {picked.quote}
      </p>
    </button>
  );
}
```

- [ ] **Step 3: Verify file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/OpeningRitual/index.tsx lib/quoteHistory.ts
git commit -m "feat(components): OpeningRitual with fade + reduced-motion + click-skip"
```

---

## Task 13: needMoreInfo rule

**Files:**
- Create: `lib/rules/needMoreInfo.ts`
- Test: `tests/lib/rules/needMoreInfo.test.ts`

Replaces former Call 3a (spec §7.2.3). Returns `true` if the user's reply is too thin to decode.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/rules/needMoreInfo.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test**

```bash
npm test -- needMoreInfo
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/rules/needMoreInfo.ts`**

```ts
// lib/rules/needMoreInfo.ts
// See spec §7.2.3 — replaces former Call 3a.

const MIN_CHARS = 50;
// Task verbs that anchor the reply to a concrete action.
const TASK_VERBS = [
  '写','改','投','联系','打','见','读','复习','准备','发','回','整理','约',
  '做','交','背','看','听','找','约定','开会','约个','跟进','沟通','申请',
  '面试','投递','汇报','约时间',
];
// Emotion-only filler that doesn't anchor a task.
const EMOTION_KEYWORDS = ['累','难受','烦','卷','焦虑','不想动','哭','崩','废'];

export function needMoreInfo(reply: string): boolean {
  const trimmed = reply.trim();
  if (trimmed.length < MIN_CHARS) return true;

  const hasTaskVerb = TASK_VERBS.some((v) => trimmed.includes(v));
  if (!hasTaskVerb) return true;

  // Pure emotion: every "feeling word" hits but no task verb either.
  // Already covered by the above, but keep this check explicit for readability.
  const emotionHits = EMOTION_KEYWORDS.reduce(
    (n, w) => n + (trimmed.includes(w) ? 1 : 0),
    0,
  );
  if (emotionHits >= 3 && !hasTaskVerb) return true;

  return false;
}
```

- [ ] **Step 4: Run the test, watch it pass**

```bash
npm test -- needMoreInfo
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/needMoreInfo.ts tests/lib/rules/needMoreInfo.test.ts
git commit -m "feat(rules): needMoreInfo heuristic (replaces Call 3a)"
```

---

## Task 14: Prompt — detectAndAskFirst (Call 1)

**Files:**
- Create: `lib/prompts/detectAndAskFirst.ts`

Builds the system + user prompt and the tool definition for Call 1. No API call yet — just the prompt artifacts.

- [ ] **Step 1: Create `lib/prompts/detectAndAskFirst.ts`**

```ts
// lib/prompts/detectAndAskFirst.ts
// Call 1: 状态识别 + 第一轮追问 — see spec §7.2.2.
// Model: Claude Haiku 4.5.

import type Anthropic from '@anthropic-ai/sdk';

export const SYSTEM = `你是「焦虑解码器」的温柔陪伴助手，服务焦虑型学生与申请者。

用户在打开你之前，正想做一件事但启动不了。你的任务有两个：

1. 从用户首次输入中识别状态：
   - "starting": 用户处于"知道要做但还没开始"的启动阶段
   - "rescue": 用户已经回避了一段时间（明确提到"拖了""一直没动""又过去了 X 小时/天"等信号）

2. 给出一个温柔、具体、能让用户继续往下倾诉的追问问题：
   - 启动状态：问题更像帮用户聚焦（"具体是哪一步让你卡住的？"）
   - 救援状态：问题更像松绑（"先不管为什么没开始 —— 你现在最想说的一句是什么？"）

绝对禁用：
- 词："其实你..."、"你应该"、"加油"、"焦虑"、"治愈"、"放松"、"平静"
- 诊断式开场："我看你..."、"听起来你..."
- 给建议（追问环节只追问，不给建议）

输出长度：question ≤ 30 个汉字。`;

export function buildUser(initialDump: string): string {
  return `<user_dump>\n${initialDump}\n</user_dump>`;
}

export const TOOL: Anthropic.Tool = {
  name: 'detect_state_and_ask',
  description: '识别用户状态并生成第一轮追问问题',
  input_schema: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        enum: ['starting', 'rescue'],
        description: '用户当前所处的状态',
      },
      question: {
        type: 'string',
        description: '给用户的第一轮追问问题，≤30 个汉字',
      },
    },
    required: ['state', 'question'],
  },
};

export interface DetectAndAskOutput {
  state: 'starting' | 'rescue';
  question: string;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/prompts/detectAndAskFirst.ts
git commit -m "feat(prompts): Call 1 — detectAndAskFirst (Haiku, tool use)"
```

---

## Task 15: Prompt — askFollowUpAgain (Call 2)

**Files:**
- Create: `lib/prompts/askFollowUpAgain.ts`

Called only when `needMoreInfo` returns true. Generates a second-round follow-up question, taking state + full conversation as input.

- [ ] **Step 1: Create `lib/prompts/askFollowUpAgain.ts`**

```ts
// lib/prompts/askFollowUpAgain.ts
// Call 2: 第二轮追问 — see spec §7.2.2.
// Model: Claude Haiku 4.5. Hard cap: never call more than once.

export const SYSTEM = `你是「焦虑解码器」的温柔陪伴助手。

用户已经倾诉过一轮，但回答信息不足以解码。你的任务：基于上下文生成一个补深追问问题。

约束：
- 问题 ≤ 30 个汉字
- 不重复用户已经说过的内容
- 不给建议、不评价
- 如果用户上一轮回答里只有情绪没有任务，问题指向"具体在做哪件事"
- 如果用户上一轮回答里只有任务没有担心，问题指向"具体担心什么"
- 如果两者都缺，问题更广："你愿意说说今天最让你想躲的事是什么吗？"

绝对禁用：
- "其实你..."、"你应该"、"加油"、"焦虑"、"治愈"、"放松"、"平静"
- 诊断式开场`;

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export function buildUser(
  state: 'starting' | 'rescue',
  conversation: ConversationTurn[],
): string {
  const transcript = conversation
    .map((t) => `<${t.role}>\n${t.content}\n</${t.role}>`)
    .join('\n');
  return `<state>${state}</state>\n<conversation>\n${transcript}\n</conversation>`;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/prompts/askFollowUpAgain.ts
git commit -m "feat(prompts): Call 2 — askFollowUpAgain (Haiku)"
```

---

## Task 16: Prompt — classifyAndCompose (Call 3)

**Files:**
- Create: `lib/prompts/classifyAndCompose.ts`

The most important prompt. Sonnet tool use that outputs `{worries, primary_action, headline}` in one shot. Spec §7.2.4 critical constraints: 5-min granularity action, gentle voice, fog as default for ambiguity.

- [ ] **Step 1: Create `lib/prompts/classifyAndCompose.ts`**

```ts
// lib/prompts/classifyAndCompose.ts
// Call 3: 三堆分类 + 5 分钟动作 + 卡片标题 — see spec §7.2.2 + §7.2.4.
// Model: Claude Sonnet 4.5 with tool use (forced structured output).

import type Anthropic from '@anthropic-ai/sdk';
import type { ConversationTurn } from './askFollowUpAgain';

export const SYSTEM = `你是「焦虑解码器」的解码引擎。

用户已经倾诉了他们正在回避的任务和担心。你的任务是：

1. 从用户的话里抽取出每一条独立的"担心"，按以下三类归类：
   - "real": 有具体动作可做的真实任务（例：导师邮件还没回、PPT 还没改）
   - "catastrophic": 灾难化想象（例：投了简历会被拒到自闭、面试一定砸）
   - "fog": 说不清的模糊不适（例：感觉很烦、不想动、就是不想做）

2. 给「真问题」堆里最优先的一条，生成一个"现在 5 分钟就能开始的具体第一步"。
3. 给整张卡片生成一个 ≤15 字的温柔标题。

关键原则（必须遵守）：
- **有疑义时归入 fog**，不要硬塞进 real 或 catastrophic
- primary_action 必须是"5 分钟内能开始"的颗粒（如"打开 Word，写论文标题"）
- primary_action 不接受"写一个月的论文计划"这种粗颗粒
- primary_action 不写"加油""相信自己"等鼓励语
- 不否认用户的灾难化（不写"其实不会的"），只标记类别
- 不给建议（建议在 primary_action 之外不出现）

绝对禁用：
- 词："其实你..."、"你应该"、"焦虑"、"治愈"、"放松"、"平静"、"加油"
- 评价：不写"这是合理的""这种感受是正常的"

输出长度：headline ≤ 15 个汉字；primary_action ≤ 30 个汉字。`;

export function buildUser(
  state: 'starting' | 'rescue',
  conversation: ConversationTurn[],
): string {
  const transcript = conversation
    .map((t) => `<${t.role}>\n${t.content}\n</${t.role}>`)
    .join('\n');
  return `<state>${state}</state>\n<conversation>\n${transcript}\n</conversation>`;
}

export const TOOL: Anthropic.Tool = {
  name: 'decode_worries',
  description: '把用户的倾诉拆解成三堆 + 给出第一步动作 + 卡片标题',
  input_schema: {
    type: 'object',
    properties: {
      worries: {
        type: 'array',
        description: '从用户话里抽取的每一条独立担心',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: '担心的原文摘要（保留用户原话的关键词）',
            },
            category: {
              type: 'string',
              enum: ['real', 'catastrophic', 'fog'],
            },
          },
          required: ['content', 'category'],
        },
      },
      primary_action: {
        type: 'string',
        description: '现在 5 分钟内能开始的具体第一步动作（≤30 字）',
      },
      headline: {
        type: 'string',
        description: '卡片上的一句话标题（≤15 字，温柔）',
      },
    },
    required: ['worries', 'primary_action', 'headline'],
  },
};

export interface ClassifyOutput {
  worries: Array<{ content: string; category: 'real' | 'catastrophic' | 'fog' }>;
  primary_action: string;
  headline: string;
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/prompts/classifyAndCompose.ts
git commit -m "feat(prompts): Call 3 — classifyAndCompose (Sonnet tool use)"
```

---

## Task 17: Prompt — companionCopy (Call 4)

**Files:**
- Create: `lib/prompts/companionCopy.ts`

Generates a short companion message for the wait page, personalized to the user's task. Triggered when the user clicks the "5-minute" button — not on critical decode path.

- [ ] **Step 1: Create `lib/prompts/companionCopy.ts`**

```ts
// lib/prompts/companionCopy.ts
// Call 4: 等候页陪伴文案 — see spec §7.2.2.
// Model: Claude Haiku 4.5. Triggered after user clicks "5-minute" button.

export const SYSTEM = `你是「焦虑解码器」的陪伴文案生成器。

用户刚刚点了"现在做 5 分钟"按钮，正要离开产品去做事。你的任务：写一句短陪伴语，让用户感到"有人在这里等"，但不施压。

约束：
- ≤ 25 个汉字
- 第一人称（"我"），第二人称（"你"），不用第三人称
- 暗含"你回来再说"的语气，不暗含"必须做完"
- 例子（仅供参考语气，不要重复）：
  - "去吧，我在这里等你回来。"
  - "别想我，先去做。"
  - "你回来的时候，我还在。"

绝对禁用：
- "加油"、"相信你"、"你能做到"、"焦虑"、"治愈"、"放松"
- 计时类表达："X 分钟后见"`;

export function buildUser(state: 'starting' | 'rescue', primaryAction: string): string {
  return `<state>${state}</state>\n<primary_action>${primaryAction}</primary_action>`;
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/prompts/companionCopy.ts
git commit -m "feat(prompts): Call 4 — companionCopy (Haiku)"
```

---

## Task 18: DB layer — users + sessions + worry_items + return_feedback

**Files:**
- Create: `lib/db/users.ts`, `lib/db/sessions.ts`, `lib/db/worryItems.ts`, `lib/db/returnFeedback.ts`

Thin typed wrappers over Supabase. Each file exports the CRUD functions needed by Phase 1.

- [ ] **Step 1: Create `lib/db/users.ts`**

```ts
// lib/db/users.ts
import { getServerSupabase } from './supabase';

export interface AnonymousUser {
  id: string;
  fingerprint: string;
  email: string | null;
  created_at: string;
}

export async function getOrCreateUserByFingerprint(
  fingerprint: string,
): Promise<AnonymousUser> {
  const sb = getServerSupabase();
  const { data: existing, error: selErr } = await sb
    .from('anonymous_users')
    .select('*')
    .eq('fingerprint', fingerprint)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as AnonymousUser;

  const { data: created, error: insErr } = await sb
    .from('anonymous_users')
    .insert({ fingerprint })
    .select('*')
    .single();
  if (insErr) throw insErr;
  return created as AnonymousUser;
}
```

- [ ] **Step 2: Create `lib/db/sessions.ts`**

```ts
// lib/db/sessions.ts
import { getServerSupabase } from './supabase';

export type SessionStatus =
  | 'draft'
  | 'conversing'
  | 'decoded'
  | 'launched'
  | 'returned'
  | 'completed';

export type SessionState = 'starting' | 'rescue';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

export interface DecodeSession {
  id: string;
  user_id: string;
  state: SessionState | null;
  initial_dump: string | null;
  conversation: ConversationMessage[];
  primary_action: string | null;
  card_headline: string | null;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export async function createSession(args: {
  userId: string;
  initialDump: string;
  state: SessionState;
  conversation: ConversationMessage[];
}): Promise<DecodeSession> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('decode_sessions')
    .insert({
      user_id: args.userId,
      state: args.state,
      initial_dump: args.initialDump,
      conversation: args.conversation,
      status: 'conversing',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as DecodeSession;
}

export async function getSession(id: string): Promise<DecodeSession | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('decode_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as DecodeSession | null;
}

export async function updateSessionConversation(
  id: string,
  conversation: ConversationMessage[],
): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('decode_sessions')
    .update({ conversation })
    .eq('id', id);
  if (error) throw error;
}

export async function markDecoded(args: {
  id: string;
  primaryAction: string;
  cardHeadline: string;
}): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('decode_sessions')
    .update({
      primary_action: args.primaryAction,
      card_headline: args.cardHeadline,
      status: 'decoded',
    })
    .eq('id', args.id);
  if (error) throw error;
}

export async function setStatus(id: string, status: SessionStatus): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb.from('decode_sessions').update({ status }).eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step 3: Create `lib/db/worryItems.ts`**

```ts
// lib/db/worryItems.ts
import { getServerSupabase } from './supabase';

export type WorryCategory = 'real' | 'catastrophic' | 'fog';

export interface WorryItem {
  id: string;
  session_id: string;
  content: string;
  category: WorryCategory;
  display_order: number;
  was_manually_edited: boolean;
}

export async function insertWorryItems(
  sessionId: string,
  items: Array<{ content: string; category: WorryCategory }>,
): Promise<WorryItem[]> {
  if (items.length === 0) return [];
  const sb = getServerSupabase();
  const rows = items.map((it, i) => ({
    session_id: sessionId,
    content: it.content,
    category: it.category,
    display_order: i,
  }));
  const { data, error } = await sb.from('worry_items').insert(rows).select('*');
  if (error) throw error;
  return data as WorryItem[];
}

export async function listBySession(sessionId: string): Promise<WorryItem[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('worry_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorryItem[];
}

export async function reclassifyWorry(args: {
  id: string;
  category: WorryCategory;
}): Promise<WorryItem> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('worry_items')
    .update({ category: args.category, was_manually_edited: true })
    .eq('id', args.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as WorryItem;
}
```

- [ ] **Step 4: Create `lib/db/returnFeedback.ts`**

```ts
// lib/db/returnFeedback.ts
import { getServerSupabase } from './supabase';

export type FeedbackEmoji = '🙂' | '😐' | '😣';

export interface ReturnFeedback {
  session_id: string;
  emoji: FeedbackEmoji;
  one_liner: string | null;
  created_at: string;
}

export async function saveReturnFeedback(args: {
  sessionId: string;
  emoji: FeedbackEmoji;
  oneLiner: string | null;
}): Promise<ReturnFeedback> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('return_feedback')
    .upsert({
      session_id: args.sessionId,
      emoji: args.emoji,
      one_liner: args.oneLiner,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ReturnFeedback;
}
```

- [ ] **Step 5: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/db/users.ts lib/db/sessions.ts lib/db/worryItems.ts lib/db/returnFeedback.ts
git commit -m "feat(db): typed access layer for users, sessions, worries, feedback"
```

---

## Task 19: Decode engine — orchestrate Calls 1, 2, 3, 4

**Files:**
- Create: `lib/core/decodeEngine.ts`
- Test: `tests/lib/core/decodeEngine.test.ts` (unit test for parseToolUse helpers; full LLM calls tested via E2E)

This file is the only place that knows how to talk to Claude. API routes call into here.

- [ ] **Step 1: Write failing test for the tool-output parser**

Create `tests/lib/core/decodeEngine.test.ts`:

```ts
// tests/lib/core/decodeEngine.test.ts
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
```

- [ ] **Step 2: Run the test, watch it fail**

```bash
npm test -- decodeEngine
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/core/decodeEngine.ts`**

```ts
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
```

- [ ] **Step 4: Run the test, watch it pass**

```bash
npm test -- decodeEngine
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/core/decodeEngine.ts tests/lib/core/decodeEngine.test.ts
git commit -m "feat(core): decodeEngine — single owner of Calls 1-4"
```

---

## Task 20: API — POST /api/sessions (create + Call 1)

**Files:**
- Create: `app/api/sessions/route.ts`

Request: `{ fingerprint: string, dump: string }`
Response: `{ sessionId, state, question }`

- [ ] **Step 1: Implement the route**

Create `app/api/sessions/route.ts`:

```ts
// app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { getOrCreateUserByFingerprint } from '@/lib/db/users';
import { createSession } from '@/lib/db/sessions';
import { callDetectAndAskFirst } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { fingerprint, dump } = body as { fingerprint?: string; dump?: string };
  if (!fingerprint || typeof fingerprint !== 'string') {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  if (!dump || typeof dump !== 'string' || dump.trim().length === 0) {
    return NextResponse.json({ error: 'dump required' }, { status: 400 });
  }

  const user = await getOrCreateUserByFingerprint(fingerprint);
  const { state, question } = await callDetectAndAskFirst(dump);

  const now = new Date().toISOString();
  const session = await createSession({
    userId: user.id,
    initialDump: dump,
    state,
    conversation: [
      { role: 'user', content: dump, ts: now },
      { role: 'assistant', content: question, ts: now },
    ],
  });

  return NextResponse.json({
    sessionId: session.id,
    state,
    question,
  });
}
```

- [ ] **Step 2: Manual smoke test**

Start dev server: `npm run dev`

In another terminal:
```bash
curl -s -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"fingerprint":"test-fp-1","dump":"我应该改简历但是已经拖了一周"}' \
  | python3 -m json.tool
```

Expected: response includes a real `sessionId`, `state` (likely "rescue" given "拖了一周"), and `question` (a Chinese question ≤30 chars).

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/api/sessions/route.ts
git commit -m "feat(api): POST /api/sessions — create session + Call 1"
```

---

## Task 21: API — POST /api/sessions/:id/turns (add user turn → Call 2 if needed)

**Files:**
- Create: `app/api/sessions/[id]/turns/route.ts`

Request: `{ reply: string }`
Response: either `{ done: false, question: string }` (need more) or `{ done: true }` (ready to decode).

- [ ] **Step 1: Implement the route**

Create `app/api/sessions/[id]/turns/route.ts`:

```ts
// app/api/sessions/[id]/turns/route.ts
import { NextResponse } from 'next/server';
import { getSession, updateSessionConversation } from '@/lib/db/sessions';
import { needMoreInfo } from '@/lib/rules/needMoreInfo';
import { callAskFollowUpAgain } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FOLLOWUPS = 2; // hard cap from spec §7.2.4

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { reply } = body as { reply?: string };
  if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
    return NextResponse.json({ error: 'reply required' }, { status: 400 });
  }

  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  if (!session.state) {
    return NextResponse.json({ error: 'session has no state' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const conversation = [...session.conversation, { role: 'user' as const, content: reply, ts: now }];

  // Count how many assistant follow-ups have been issued.
  const assistantTurns = conversation.filter((t) => t.role === 'assistant').length;

  // Decide: need more info? AND under the hard cap?
  if (needMoreInfo(reply) && assistantTurns < MAX_FOLLOWUPS) {
    const question = await callAskFollowUpAgain(session.state, conversation);
    conversation.push({ role: 'assistant', content: question, ts: new Date().toISOString() });
    await updateSessionConversation(id, conversation);
    return NextResponse.json({ done: false, question });
  }

  // Sufficient info OR hit the hard cap — ready to decode.
  await updateSessionConversation(id, conversation);
  return NextResponse.json({ done: true });
}
```

- [ ] **Step 2: Manual smoke test**

Start dev server. Use the `sessionId` from Task 20's smoke test (or run that again first):

```bash
SESSION_ID="<paste from Task 20>"
curl -s -X POST "http://localhost:3000/api/sessions/${SESSION_ID}/turns" \
  -H "Content-Type: application/json" \
  -d '{"reply":"我已经拖了一周，每次打开 Word 就关掉。具体担心简历里项目经历写得不够亮，怕投了被拒。"}' \
  | python3 -m json.tool
```

Expected: response is either `{"done": true}` or `{"done": false, "question": "..."}`.

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/api/sessions/[id]/turns/route.ts
git commit -m "feat(api): POST /api/sessions/:id/turns — add reply + Call 2 if needed"
```

---

## Task 22: API — POST /api/sessions/:id/decode (Call 3)

**Files:**
- Create: `app/api/sessions/[id]/decode/route.ts`

Request: empty
Response: `{ headline, primary_action, worries: [{id, content, category}] }`

- [ ] **Step 1: Implement the route**

Create `app/api/sessions/[id]/decode/route.ts`:

```ts
// app/api/sessions/[id]/decode/route.ts
import { NextResponse } from 'next/server';
import { getSession, markDecoded } from '@/lib/db/sessions';
import { insertWorryItems } from '@/lib/db/worryItems';
import { callClassifyAndCompose } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  if (!session.state) {
    return NextResponse.json({ error: 'session has no state' }, { status: 409 });
  }
  if (session.status !== 'conversing' && session.status !== 'draft') {
    return NextResponse.json({ error: `cannot decode in status ${session.status}` }, { status: 409 });
  }

  const out = await callClassifyAndCompose(session.state, session.conversation);

  await markDecoded({
    id,
    primaryAction: out.primary_action,
    cardHeadline: out.headline,
  });
  const inserted = await insertWorryItems(id, out.worries);

  return NextResponse.json({
    headline: out.headline,
    primary_action: out.primary_action,
    worries: inserted.map((w) => ({ id: w.id, content: w.content, category: w.category })),
  });
}
```

- [ ] **Step 2: Manual smoke test**

Reuse the `SESSION_ID` from Task 21:

```bash
curl -s -X POST "http://localhost:3000/api/sessions/${SESSION_ID}/decode" \
  | python3 -m json.tool
```

Expected: response with `headline`, `primary_action`, and a `worries` array of 1+ items with `category` ∈ {real, catastrophic, fog}.

- [ ] **Step 3: Commit**

```bash
git add app/api/sessions/[id]/decode/route.ts
git commit -m "feat(api): POST /api/sessions/:id/decode — Call 3 + persist worries"
```

---

## Task 23: API — PATCH /api/sessions/:id/worries/:wid (manual reclassify)

**Files:**
- Create: `app/api/sessions/[id]/worries/[wid]/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// app/api/sessions/[id]/worries/[wid]/route.ts
import { NextResponse } from 'next/server';
import { reclassifyWorry, type WorryCategory } from '@/lib/db/worryItems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: WorryCategory[] = ['real', 'catastrophic', 'fog'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; wid: string }> },
) {
  const { wid } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { category } = body as { category?: string };
  if (!category || !VALID.includes(category as WorryCategory)) {
    return NextResponse.json({ error: 'invalid category' }, { status: 400 });
  }

  const updated = await reclassifyWorry({
    id: wid,
    category: category as WorryCategory,
  });
  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    category: updated.category,
    was_manually_edited: updated.was_manually_edited,
  });
}
```

- [ ] **Step 2: Smoke test (reuse a worry id from Task 22's response)**

```bash
WORRY_ID="<paste from Task 22 worries[0].id>"
curl -s -X PATCH "http://localhost:3000/api/sessions/${SESSION_ID}/worries/${WORRY_ID}" \
  -H "Content-Type: application/json" \
  -d '{"category":"fog"}' \
  | python3 -m json.tool
```

Expected: response shows `category: "fog"` and `was_manually_edited: true`.

- [ ] **Step 3: Commit**

```bash
git add app/api/sessions/[id]/worries/[wid]/route.ts
git commit -m "feat(api): PATCH /api/sessions/:id/worries/:wid — manual reclassify"
```

---

## Task 24: API — POST /api/sessions/:id/launch + /return + /feedback

**Files:**
- Create: `app/api/sessions/[id]/launch/route.ts`
- Create: `app/api/sessions/[id]/return/route.ts`
- Create: `app/api/sessions/[id]/feedback/route.ts`

Three small POST routes. All three update session status; feedback also writes the `return_feedback` row.

- [ ] **Step 1: Create launch route**

```ts
// app/api/sessions/[id]/launch/route.ts
import { NextResponse } from 'next/server';
import { setStatus } from '@/lib/db/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await setStatus(id, 'launched');
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create return route**

```ts
// app/api/sessions/[id]/return/route.ts
import { NextResponse } from 'next/server';
import { setStatus } from '@/lib/db/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await setStatus(id, 'returned');
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create feedback route**

```ts
// app/api/sessions/[id]/feedback/route.ts
import { NextResponse } from 'next/server';
import { saveReturnFeedback, type FeedbackEmoji } from '@/lib/db/returnFeedback';
import { setStatus } from '@/lib/db/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: FeedbackEmoji[] = ['🙂', '😐', '😣'];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { emoji, oneLiner } = body as { emoji?: string; oneLiner?: string };
  if (!emoji || !VALID.includes(emoji as FeedbackEmoji)) {
    return NextResponse.json({ error: 'invalid emoji' }, { status: 400 });
  }
  const safeOneLiner =
    typeof oneLiner === 'string' && oneLiner.trim().length > 0 ? oneLiner.trim() : null;

  await saveReturnFeedback({
    sessionId: id,
    emoji: emoji as FeedbackEmoji,
    oneLiner: safeOneLiner,
  });
  await setStatus(id, 'completed');

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/sessions/[id]/launch app/api/sessions/[id]/return app/api/sessions/[id]/feedback
git commit -m "feat(api): launch + return + feedback routes"
```

---

## Task 25: API — POST /api/sessions/:id/companion (Call 4)

**Files:**
- Create: `app/api/sessions/[id]/companion/route.ts`

Triggered when the user clicks the "5-minute" button. Returns the companion copy synchronously (~1-2s wait is acceptable for that interaction).

- [ ] **Step 1: Implement the route**

```ts
// app/api/sessions/[id]/companion/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/db/sessions';
import { callCompanionCopy } from '@/lib/core/decodeEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  if (!session.state || !session.primary_action) {
    return NextResponse.json({ error: 'session not yet decoded' }, { status: 409 });
  }
  const copy = await callCompanionCopy(session.state, session.primary_action);
  return NextResponse.json({ copy });
}
```

- [ ] **Step 2: Smoke test**

```bash
curl -s -X POST "http://localhost:3000/api/sessions/${SESSION_ID}/companion" \
  | python3 -m json.tool
```

Expected: `{"copy": "去吧，我在这里..."}` or similar.

- [ ] **Step 3: Commit**

```bash
git add app/api/sessions/[id]/companion/route.ts
git commit -m "feat(api): POST /api/sessions/:id/companion — Call 4"
```

---

## Task 26: WorryInput component (landing input box)

**Files:**
- Create: `components/WorryInput/index.tsx`

Controlled textarea with autosave to localStorage (draft protection per spec §9). Submit on Enter+Cmd/Ctrl. Calls `onSubmit(text)` from parent.

- [ ] **Step 1: Create the component**

```tsx
// components/WorryInput/index.tsx
'use client';

import { useEffect, useState } from 'react';

const DRAFT_KEY = 'anxiety_decoder_draft';
const DEBOUNCE_MS = 2000;

interface WorryInputProps {
  onSubmit: (text: string) => void;
  busy: boolean;
}

export default function WorryInput({ onSubmit, busy }: WorryInputProps) {
  const [text, setText] = useState('');

  // Load draft on mount.
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) setText(draft);
  }, []);

  // Debounced save.
  useEffect(() => {
    const t = setTimeout(() => {
      if (text.length > 0) localStorage.setItem(DRAFT_KEY, text);
      else localStorage.removeItem(DRAFT_KEY);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    localStorage.removeItem(DRAFT_KEY);
    onSubmit(trimmed);
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
        }}
        placeholder="把你现在脑子里所有担心倒出来。乱写也行，没关系。"
        rows={6}
        disabled={busy}
        className="w-full rounded-md border border-stone-300 bg-white p-4 text-base leading-relaxed text-stone-800 outline-none focus:border-stone-500 disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-500">
          你写的东西只用来帮你解码这一次。原文 30 天后自动删除。
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy || text.trim().length === 0}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
        >
          {busy ? '解码中…' : '开始解码'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/WorryInput/index.tsx
git commit -m "feat(components): WorryInput with draft autosave + Cmd-Enter submit"
```

---

## Task 27: Landing page (wires OpeningRitual + WorryInput)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx` entirely**

```tsx
// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OpeningRitual from '@/components/OpeningRitual';
import WorryInput from '@/components/WorryInput';
import { getOrCreateFingerprint } from '@/lib/fingerprint';

export default function LandingPage() {
  const router = useRouter();
  const [ritualDone, setRitualDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (dump: string) => {
    setBusy(true);
    setError(null);
    try {
      const fingerprint = getOrCreateFingerprint();
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, dump }),
      });
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      const { sessionId } = (await res.json()) as { sessionId: string };
      router.push(`/decode/${sessionId}`);
    } catch (e) {
      setError('AI 走神了，再来一次？');
      setBusy(false);
    }
  };

  if (!ritualDone) {
    return <OpeningRitual onComplete={() => setRitualDone(true)} />;
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <h1 className="mb-4 text-stone-700 text-lg">你现在在回避什么？</h1>
        <WorryInput onSubmit={handleSubmit} busy={busy} />
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Manual sanity check**

```bash
npm run dev
```

Open http://localhost:3000 → quote appears for ~2s → fades to input form. Type something, click "开始解码", expect to land on `/decode/<id>` (404 page for now since we haven't built that route yet — that's expected).

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(app): wire landing — OpeningRitual + WorryInput + POST /api/sessions"
```

---

## Task 28: ConversationTurn component

**Files:**
- Create: `components/ConversationTurn/index.tsx`

Renders one bubble — either user or assistant. No streaming logic here (the conversation page renders the full text as it arrives via `fetch`).

- [ ] **Step 1: Create the component**

```tsx
// components/ConversationTurn/index.tsx

interface ConversationTurnProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ConversationTurn({ role, content }: ConversationTurnProps) {
  const isAssistant = role === 'assistant';
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAssistant
            ? 'bg-stone-100 text-stone-800'
            : 'bg-stone-800 text-stone-50'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ConversationTurn/index.tsx
git commit -m "feat(components): ConversationTurn bubble"
```

---

## Task 29: Conversation page

**Files:**
- Create: `app/decode/[sessionId]/page.tsx`

Loads the existing session, displays the conversation, lets user reply. On reply: POST `/turns`. If `done: false`, append assistant question to UI. If `done: true`, navigate to `/result`.

- [ ] **Step 1: Create the page**

```tsx
// app/decode/[sessionId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ConversationTurn from '@/components/ConversationTurn';

interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ConversationPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate the conversation from the server on mount.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        // Fallback: API not implemented yet; we'll show empty conversation.
        return;
      }
      const data = (await res.json()) as { conversation?: UIMessage[] };
      if (!cancelled && data.conversation) {
        setMessages(
          data.conversation.map((m) => ({ role: m.role, content: m.content })),
        );
      }
    }
    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleSend = async () => {
    const trimmed = reply.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setReply('');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: trimmed }),
      });
      if (!res.ok) throw new Error(`turns ${res.status}`);
      const data = (await res.json()) as
        | { done: false; question: string }
        | { done: true };
      if (data.done) {
        // Trigger decode and navigate to result.
        const decodeRes = await fetch(`/api/sessions/${sessionId}/decode`, {
          method: 'POST',
        });
        if (!decodeRes.ok) throw new Error(`decode ${decodeRes.status}`);
        router.push(`/decode/${sessionId}/result`);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.question }]);
        setBusy(false);
      }
    } catch {
      setError('AI 走神了，再来一次？');
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="mx-auto max-w-xl flex flex-col gap-3">
        {messages.map((m, i) => (
          <ConversationTurn key={i} role={m.role} content={m.content} />
        ))}
        <div className="mt-4 flex flex-col gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend();
            }}
            placeholder="继续说…"
            rows={3}
            disabled={busy}
            className="w-full rounded-md border border-stone-300 bg-white p-3 text-sm leading-relaxed outline-none focus:border-stone-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || reply.trim().length === 0}
            className="self-end rounded-md bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
          >
            {busy ? '处理中…' : '继续'}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add the GET /api/sessions/:id route to enable hydration**

Create `app/api/sessions/[id]/route.ts`:

```ts
// app/api/sessions/[id]/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/db/sessions';
import { listBySession } from '@/lib/db/worryItems';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  const worries = await listBySession(id);
  return NextResponse.json({
    id: session.id,
    state: session.state,
    status: session.status,
    conversation: session.conversation,
    primary_action: session.primary_action,
    card_headline: session.card_headline,
    worries: worries.map((w) => ({
      id: w.id,
      content: w.content,
      category: w.category,
      was_manually_edited: w.was_manually_edited,
    })),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/decode/[sessionId]/page.tsx app/api/sessions/[id]/route.ts
git commit -m "feat(app): conversation page + GET session for hydration"
```

---

## Task 30: CategoryChip component (manual reclassification)

**Files:**
- Create: `components/CategoryChip/index.tsx`

A chip per category. Click → opens a small menu of the other two categories → click one → calls `onReclassify(newCategory)`. Simple and accessible.

- [ ] **Step 1: Create the component**

```tsx
// components/CategoryChip/index.tsx
'use client';

import { useState } from 'react';
import type { WorryCategory } from '@/lib/db/worryItems';

const LABELS: Record<WorryCategory, string> = {
  real: '🟢 真问题',
  catastrophic: '🟡 灾难化',
  fog: '⚪ 雾',
};

interface CategoryChipProps {
  category: WorryCategory;
  onReclassify: (next: WorryCategory) => void;
}

export default function CategoryChip({ category, onReclassify }: CategoryChipProps) {
  const [open, setOpen] = useState(false);
  const others = (Object.keys(LABELS) as WorryCategory[]).filter((c) => c !== category);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 hover:border-stone-400"
      >
        {LABELS[category]}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 flex flex-col rounded-md border border-stone-200 bg-white shadow-sm">
          {others.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => {
                setOpen(false);
                onReclassify(c);
              }}
              className="px-3 py-1 text-left text-xs text-stone-700 hover:bg-stone-100"
            >
              移到 {LABELS[c]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CategoryChip/index.tsx
git commit -m "feat(components): CategoryChip with click-to-reclassify menu"
```

---

## Task 31: DecodeCard component

**Files:**
- Create: `components/DecodeCard/index.tsx`

The hero artifact. Renders headline + the three buckets. Real-bucket items get the most prominent styling. Each worry has a CategoryChip for reclassification.

- [ ] **Step 1: Create the component**

```tsx
// components/DecodeCard/index.tsx
'use client';

import CategoryChip from '@/components/CategoryChip';
import type { WorryCategory } from '@/lib/db/worryItems';

export interface DecodeCardWorry {
  id: string;
  content: string;
  category: WorryCategory;
}

interface DecodeCardProps {
  headline: string;
  primaryAction: string;
  worries: DecodeCardWorry[];
  onReclassify: (worryId: string, next: WorryCategory) => void;
  onLaunch: () => void;
  launchBusy: boolean;
}

export default function DecodeCard({
  headline,
  primaryAction,
  worries,
  onReclassify,
  onLaunch,
  launchBusy,
}: DecodeCardProps) {
  const real = worries.filter((w) => w.category === 'real');
  const catastrophic = worries.filter((w) => w.category === 'catastrophic');
  const fog = worries.filter((w) => w.category === 'fog');

  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm border border-stone-200 flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-medium text-stone-800 leading-snug">{headline}</h2>
      </header>

      {/* Real bucket — hero */}
      <section className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex flex-col gap-3">
        <h3 className="text-sm font-medium text-emerald-800">🟢 真正要做的</h3>
        <ul className="flex flex-col gap-2">
          {real.map((w) => (
            <li key={w.id} className="flex items-start gap-2 text-sm text-stone-800">
              <span className="flex-1">{w.content}</span>
              <CategoryChip
                category={w.category}
                onReclassify={(next) => onReclassify(w.id, next)}
              />
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded-lg bg-white border border-emerald-200 p-3">
          <p className="text-xs text-emerald-700 mb-1">现在 5 分钟内能做的：</p>
          <p className="text-sm text-stone-800">{primaryAction}</p>
        </div>
        <button
          type="button"
          onClick={onLaunch}
          disabled={launchBusy}
          className="self-start rounded-full bg-emerald-700 px-5 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {launchBusy ? '准备中…' : '现在做 5 分钟'}
        </button>
      </section>

      {/* Catastrophic bucket — small */}
      {catastrophic.length > 0 && (
        <section className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex flex-col gap-2">
          <h3 className="text-xs text-amber-800">🟡 灾难化想象（已记下，不在此刻处理）</h3>
          <ul className="flex flex-col gap-1">
            {catastrophic.map((w) => (
              <li key={w.id} className="flex items-start gap-2 text-xs text-stone-700">
                <span className="flex-1">{w.content}</span>
                <CategoryChip
                  category={w.category}
                  onReclassify={(next) => onReclassify(w.id, next)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Fog bucket — smallest */}
      {fog.length > 0 && (
        <section className="rounded-xl bg-stone-50 border border-stone-200 p-3 flex flex-col gap-2">
          <h3 className="text-xs text-stone-600">⚪ 说不清的雾（已存档）</h3>
          <ul className="flex flex-col gap-1">
            {fog.map((w) => (
              <li key={w.id} className="flex items-start gap-2 text-xs text-stone-600">
                <span className="flex-1">{w.content}</span>
                <CategoryChip
                  category={w.category}
                  onReclassify={(next) => onReclassify(w.id, next)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/DecodeCard/index.tsx
git commit -m "feat(components): DecodeCard — hero card with three buckets + manual reclassify"
```

---

## Task 32: Result page (decode card + launch)

**Files:**
- Create: `app/decode/[sessionId]/result/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/decode/[sessionId]/result/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DecodeCard, { type DecodeCardWorry } from '@/components/DecodeCard';
import type { WorryCategory } from '@/lib/db/worryItems';

interface SessionPayload {
  primary_action: string | null;
  card_headline: string | null;
  worries: DecodeCardWorry[];
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [launchBusy, setLaunchBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error(`session ${res.status}`);
        const payload = (await res.json()) as SessionPayload;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError('加载失败，刷新试试？');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleReclassify = async (worryId: string, next: WorryCategory) => {
    if (!data) return;
    // Optimistic update
    setData({
      ...data,
      worries: data.worries.map((w) => (w.id === worryId ? { ...w, category: next } : w)),
    });
    try {
      await fetch(`/api/sessions/${sessionId}/worries/${worryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: next }),
      });
    } catch {
      // ignore for MVP — next reload will reconcile
    }
  };

  const handleLaunch = async () => {
    setLaunchBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/launch`, { method: 'POST' });
      router.push(`/decode/${sessionId}/wait`);
    } catch {
      setError('AI 走神了，再来一次？');
      setLaunchBusy(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
        <p className="text-rose-600 text-sm">{error}</p>
      </main>
    );
  }
  if (!data || !data.card_headline || !data.primary_action) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
        <p className="text-stone-500 text-sm">解码中…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="mx-auto max-w-xl">
        <DecodeCard
          headline={data.card_headline}
          primaryAction={data.primary_action}
          worries={data.worries}
          onReclassify={handleReclassify}
          onLaunch={handleLaunch}
          launchBusy={launchBusy}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/decode/[sessionId]/result/page.tsx
git commit -m "feat(app): result page with DecodeCard + manual reclassify + launch"
```

---

## Task 33: CompanionWait component + wait page

**Files:**
- Create: `components/CompanionWait/index.tsx`
- Create: `app/decode/[sessionId]/wait/page.tsx`

- [ ] **Step 1: Create `components/CompanionWait/index.tsx`**

```tsx
// components/CompanionWait/index.tsx
'use client';

interface CompanionWaitProps {
  copy: string | null;
  onReturn: () => void;
  returnBusy: boolean;
}

export default function CompanionWait({ copy, onReturn, returnBusy }: CompanionWaitProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 px-6 bg-stone-50">
      <p className="max-w-md text-center text-2xl font-medium leading-relaxed text-stone-700">
        {copy ?? '去吧，我在这里等你回来。'}
      </p>
      <button
        type="button"
        onClick={onReturn}
        disabled={returnBusy}
        className="rounded-full bg-stone-800 px-6 py-3 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {returnBusy ? '…' : '我回来了'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create the wait page**

```tsx
// app/decode/[sessionId]/wait/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CompanionWait from '@/components/CompanionWait';

export default function WaitPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [copy, setCopy] = useState<string | null>(null);
  const [returnBusy, setReturnBusy] = useState(false);

  // Fetch companion copy in background.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/companion`, { method: 'POST' });
        if (!res.ok) return; // fall back to default copy
        const data = (await res.json()) as { copy: string };
        if (!cancelled) setCopy(data.copy);
      } catch {
        // fall back silently to default copy
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleReturn = async () => {
    setReturnBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/return`, { method: 'POST' });
      router.push(`/decode/${sessionId}/return`);
    } catch {
      setReturnBusy(false);
    }
  };

  return <CompanionWait copy={copy} onReturn={handleReturn} returnBusy={returnBusy} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/CompanionWait/index.tsx app/decode/[sessionId]/wait/page.tsx
git commit -m "feat(app): companion wait page (Call 4) + 'I'm back' button"
```

---

## Task 34: Return-feedback page (emoji + one-liner)

**Files:**
- Create: `app/decode/[sessionId]/return/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/decode/[sessionId]/return/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

const EMOJIS = ['🙂', '😐', '😣'] as const;

export default function ReturnPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [emoji, setEmoji] = useState<(typeof EMOJIS)[number] | null>(null);
  const [oneLiner, setOneLiner] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!emoji) return;
    setBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, oneLiner }),
      });
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-2xl text-stone-700">收到。</p>
        <a href="/" className="text-sm text-stone-500 underline">再来一次</a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <p className="text-stone-700 text-center text-lg">刚才怎么样？</p>
        <div className="flex justify-center gap-6">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-4xl transition ${emoji === e ? 'scale-125' : 'opacity-60 hover:opacity-100'}`}
              aria-label={e}
            >
              {e}
            </button>
          ))}
        </div>
        <textarea
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          placeholder="想说一句吗？（可选）"
          rows={2}
          className="w-full rounded-md border border-stone-300 bg-white p-3 text-sm outline-none focus:border-stone-500"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!emoji || busy}
          className="self-center rounded-full bg-stone-800 px-6 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
        >
          {busy ? '…' : '提交'}
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/decode/[sessionId]/return/page.tsx
git commit -m "feat(app): return-feedback page (emoji + one-liner)"
```

---

## Task 35: End-to-end Playwright test

**Files:**
- Create: `tests/e2e/decode-flow.spec.ts`

A single spec covering the happy path: landing → conversation → decode → result → wait → return → feedback. Uses real LLM calls (slow but proves the integration).

- [ ] **Step 1: Create the spec**

```ts
// tests/e2e/decode-flow.spec.ts
import { test, expect } from '@playwright/test';

test('full decode loop happy path', async ({ page }) => {
  test.setTimeout(60_000);

  // Skip the opening ritual by clicking through.
  await page.goto('/');
  await page.click('button[aria-label="跳过"]', { timeout: 5_000 }).catch(() => {
    // Already past ritual — fine.
  });

  // Landing input.
  const dump = '我应该改简历但是已经拖了一周，每次打开 Word 就关掉，担心投了被拒。';
  await page.getByPlaceholder('把你现在脑子里所有担心倒出来').fill(dump);
  await page.getByRole('button', { name: /开始解码/ }).click();

  // Conversation page — wait for the assistant question.
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+$/);
  await page.waitForSelector('div.bg-stone-100', { timeout: 30_000 });

  // Reply with enough info to trigger decode (avoid second follow-up).
  const reply =
    '具体担心简历里的项目经历不够亮，之前实习的项目只是数据分析，没有产品决策的故事。我想改但写不出来。';
  await page.getByPlaceholder('继续说…').fill(reply);
  await page.getByRole('button', { name: /继续/ }).click();

  // Should land on result.
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+\/result$/, { timeout: 30_000 });
  await expect(page.getByText(/真正要做的/)).toBeVisible({ timeout: 30_000 });

  // Click main action button.
  await page.getByRole('button', { name: /现在做 5 分钟/ }).click();
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+\/wait$/);

  // Click "I'm back".
  await page.getByRole('button', { name: /我回来了/ }).click();
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+\/return$/);

  // Pick emoji and submit.
  await page.locator('button[aria-label="🙂"]').click();
  await page.getByRole('button', { name: /提交/ }).click();
  await expect(page.getByText(/收到/)).toBeVisible();
});
```

- [ ] **Step 2: Run the test**

```bash
npm run test:e2e
```

Expected: 1 test passes (~30-60s — real LLM calls).

If it fails:
- Verify dev server starts (Playwright config starts it automatically)
- Verify `.env.local` has correct keys
- Check the error message; it usually points at the failing step

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/decode-flow.spec.ts
git commit -m "test(e2e): happy-path Playwright spec for full decode loop"
```

---

## Task 36: Phase 1 acceptance — manual end-to-end review

**No new files.** This task is a sanity walkthrough by the engineer (or the user) to confirm Phase 1's acceptance criteria from spec §15:

> 验收：陌生人打开 URL → 写一段 → 看到三堆卡片（可修改）→ 点主按钮 → 看到陪伴页 → 点回来 → 填反馈。全程可跑、无报错。关键路径（首句到看到解码卡）总等待 ≤ 12s，单次连续等待 ≤ 5s。

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Run through the flow with a stopwatch**

1. Open http://localhost:3000 in incognito (so localStorage is fresh).
2. Verify opening ritual shows a Chinese quote that fades after ~2s.
3. Verify input form appears with placeholder text and the privacy commitment line "你写的东西只用来帮你解码这一次。原文 30 天后自动删除。"
4. Type a real worry (≥ 50 chars with task + emotion). Click "开始解码".
5. **Time from click to seeing the assistant's first question** — record. Target: ≤ 5s.
6. Reply with sufficient detail. Click "继续".
7. **If a second question appears** (needMoreInfo triggered): reply again. Otherwise it should jump to result.
8. **Time from "继续" click to seeing the decoded card** — record. Target: ≤ 5s.
9. Verify the card shows: a headline, the green "真正要做的" bucket with at least one item + a `primary_action`, and (if applicable) yellow + grey buckets.
10. Click any chip → see "移到 ⚪ 雾" / etc. menu. Click one → verify the worry moves visually.
11. Click "现在做 5 分钟". Verify wait page shows a Chinese companion sentence.
12. Click "我回来了". Verify return page asks "刚才怎么样？" with three emojis.
13. Pick 🙂, optionally type one line, submit. Verify "收到。" message + "再来一次" link back to landing.

- [ ] **Step 3: Verify total critical-path latency**

Sum: step 5 + step 8 (and step 7's second-round time if it occurred). Target: ≤ 12s.

If exceeding 12s, check:
- Anthropic API latency (cold start vs warm)
- Are streams disabled by middleware?
- Network tab in DevTools for slow API endpoints

- [ ] **Step 4: Verify data persistence in Supabase**

In Supabase Dashboard → Table Editor:
1. `anonymous_users` should have a row with the fingerprint matching `localStorage.getItem('anxiety_decoder_fp')`
2. `decode_sessions` should show one row with `status: completed`
3. `worry_items` should have N rows tied to the session
4. `return_feedback` should have one row with `emoji: 🙂`

- [ ] **Step 5: Mark Phase 1 complete**

```bash
git tag phase-1-complete
git log --oneline | head -20
```

Expected: tag created, recent commits visible.

---

# Self-Review Checklist (run BEFORE handing off)

The plan author runs this against the spec. Mark each item:

- [ ] **§3.1 主流程图** — every node has at least one task implementing it
- [ ] **§3.4 落地仪式** — Tasks 10, 11, 12 cover quotes data + selector + component; Task 27 wires it into landing
- [ ] **§4.1 路由** — all Phase 1 routes (`/`, `/decode/:id`, `/decode/:id/result`, `/decode/:id/wait`, `/decode/:id/return`) have task coverage
- [ ] **§5.1 数据模型** — Task 4 schema matches spec; Task 18 typed wrappers cover users/sessions/worries/feedback
- [ ] **§6 API** — Phase 1 endpoints (POST sessions, POST turns, POST decode, PATCH worries, POST launch, POST return, POST feedback, POST companion, GET session) all have tasks
- [ ] **§7.2 AI 管线** — Calls 1-4 each have a prompt task (14, 15, 16, 17) + the engine wires them (Task 19). Call 5 (verification email) is Phase 2 — not in this plan.
- [ ] **§7.2.3 needMoreInfo 规则** — Task 13 implements + tests
- [ ] **§7.3 代码组织** — files match the structure in the File Structure Map section above
- [ ] **§8 设计原则** — single entry (Task 27 landing), 2-round cap (Task 21 enforces), 偏心第一堆 (Task 31 DecodeCard hero styling), manual reclassify (Tasks 23 + 30 + 31)
- [ ] **§10 MVP 必做清单** items 1-6 covered; items 7-11 are Phase 2-4 territory
- [ ] **§12 北极星埋点** — emoji feedback persists to `return_feedback` (Task 24, Task 34); the rate is computable from this table
- [ ] **§18 隐私承诺** — Landing shows the 30-day-delete note (Task 26 WorryInput, baked into the placeholder area); 30-day TTL Cron is Phase 2
- [ ] **§7.2.4 关键约束** — `state` flows to Calls 2/3/4 (Task 19); 追问 stream not implemented (Task 19 uses non-streaming for simplicity — acceptable for MVP, can upgrade in Phase 4)

**Spec gaps deferred (NOT in this plan, intentionally):**
- Phase 2: email opt-in, Verifications table, Resend integration, Vercel Cron, /verify/:token, station-internal verification reminder, 30-day TTL Cron
- Phase 3: /history, /card/:id, html-to-image export, EvidenceStats, /settings/data
- Phase 4: visual polish, AI prompt iteration, error states, /privacy page, cold start execution
- Streaming for Call 2 (deferred to Phase 4 polish)

---

# Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-25-phase-0-1-foundation-and-core-loop.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best when you want each task quality-checked before moving on.

**2. Inline Execution** — Execute tasks in this session using executing-plans. Batch execution with checkpoints for your review at phase boundaries.

**Which approach?**
