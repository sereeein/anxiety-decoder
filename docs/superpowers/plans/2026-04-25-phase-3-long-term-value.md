# Anxiety Decoder · Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Make the product's long-term value visible to the user (spec §3.2, §12.3, §15 Phase 3): history list of past cards, single-card detail page with screenshot export, evidence-stats panel that answers the product's core thesis ("在 30 次解码里，22 次灾难化想象没发生"), and a data-cockpit page where the user can view / export / delete their data (spec §18.2.3).

**Architecture:** Read-heavy. Three new user-facing pages (`/history`, `/card/[id]`, `/settings/data`), four new GET/DELETE API routes, one new component that renders aggregate stats computed from Phase 2's `verifications` table + Phase 1's `worry_items` + `return_feedback`. Screenshot export is pure client-side (`html-to-image`); no server OG rendering. **No changes to the core decode flow.**

**Tech Stack:** same as Plans 1-2, plus:
- `html-to-image` — client-side DOM → PNG

**Spec reference:** §3.2, §4.1 (routes `/history`, `/card/:id`), §6 (GET /sessions, GET /stats, DELETE /sessions/:id, /api/settings/*), §12 (正向完成率, emoji分布), §18.2.3 (数据驾驶舱), §19.4 漏斗埋点

**Prior plans:** Plan 1 (foundation + core loop), Plan 2 (verification loop)

---

## Pre-flight Checklist

- [ ] Plan 2 tagged `phase-2-complete`; `verify-flow.spec.ts` passes
- [ ] At least 3-5 test decode sessions exist in your dev Supabase, of which at least 2 have responded verifications (any mix of `did_happen` true/false). Seed manually via SQL if needed so EvidenceStats has real data to render against
- [ ] `html-to-image` npm package ready to install (Task 1)

---

## File Structure Additions

```
lib/
  db/
    sessions.ts                 (MODIFIED: listByFingerprint, deleteById, listAllForExport)
    users.ts                    (MODIFIED: purgeAllForFingerprint)
  core/
    evidenceStats.ts            (pure function: rows → stats)

app/
  api/
    sessions/route.ts           (MODIFIED: add GET for listing)
    sessions/[id]/route.ts      (MODIFIED: add DELETE)
    stats/route.ts              (GET, evidence panel data)
    settings/
      export/route.ts           (POST → download JSON)
      purge/route.ts            (POST → delete all for fingerprint)
  history/page.tsx
  card/[sessionId]/page.tsx     (public, read-only view of one card)
  settings/data/page.tsx        (data cockpit)

components/
  HistoryCard/index.tsx         (compact card in the history list)
  EvidenceStats/index.tsx       (the "22/30 灾难没发生" panel)
  ScreenshotButton/index.tsx    (html-to-image export)
  DecodeCard/index.tsx          (MODIFIED: accept `readOnly` prop to hide action button)
  app/page.tsx                  (MODIFIED: link to /history from landing)
  app/decode/[sessionId]/return/page.tsx   (MODIFIED: add "看看过往" link after feedback)

tests/
  lib/core/evidenceStats.test.ts
  e2e/history-flow.spec.ts
```

---

## Tasks

### Task 1: Install html-to-image

- [ ] **Step 1**

```bash
cd "/Users/evette/Documents/简历/Anxiety_decoder"
npm install html-to-image
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add package.json package-lock.json
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "chore: add html-to-image for client-side screenshot export"
```

---

### Task 2: Extend DB layer — sessions list + delete + export

**Files:**
- Modify: `lib/db/sessions.ts`

- [ ] **Step 1: Append**

Add these functions to `lib/db/sessions.ts`:

```ts
export interface SessionSummary {
  id: string;
  created_at: string;
  card_headline: string | null;
  primary_action: string | null;
  status: SessionStatus;
  real_count: number;
  catastrophic_count: number;
  fog_count: number;
  feedback_emoji: string | null;
}

export async function listSessionsByFingerprint(
  fingerprint: string,
): Promise<SessionSummary[]> {
  const sb = getServerSupabase();
  // One round-trip with embedded aggregation.
  const { data, error } = await sb
    .from('decode_sessions')
    .select(
      `id, created_at, card_headline, primary_action, status,
       anonymous_users!inner ( fingerprint ),
       worry_items ( category ),
       return_feedback ( emoji )`,
    )
    .eq('anonymous_users.fingerprint', fingerprint)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    created_at: string;
    card_headline: string | null;
    primary_action: string | null;
    status: SessionStatus;
    worry_items: Array<{ category: 'real' | 'catastrophic' | 'fog' }>;
    return_feedback: Array<{ emoji: string }> | { emoji: string } | null;
  }>).map((s) => {
    const fb = Array.isArray(s.return_feedback)
      ? s.return_feedback[0] ?? null
      : s.return_feedback;
    return {
      id: s.id,
      created_at: s.created_at,
      card_headline: s.card_headline,
      primary_action: s.primary_action,
      status: s.status,
      real_count: s.worry_items.filter((w) => w.category === 'real').length,
      catastrophic_count: s.worry_items.filter((w) => w.category === 'catastrophic').length,
      fog_count: s.worry_items.filter((w) => w.category === 'fog').length,
      feedback_emoji: fb?.emoji ?? null,
    };
  });
}

export async function deleteSession(id: string): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb.from('decode_sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function exportAllForFingerprint(fingerprint: string): Promise<unknown> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('decode_sessions')
    .select(
      `id, created_at, state, card_headline, primary_action, status,
       conversation,
       worry_items ( id, content, category, was_manually_edited ),
       return_feedback ( emoji, one_liner, created_at ),
       anonymous_users!inner ( fingerprint )`,
    )
    .eq('anonymous_users.fingerprint', fingerprint)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit && npm test
```

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add lib/db/sessions.ts
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(db): listSessionsByFingerprint + deleteSession + exportAll"
```

---

### Task 3: Extend DB layer — users.purgeAllForFingerprint

**Files:**
- Modify: `lib/db/users.ts`

- [ ] **Step 1: Append**

```ts
/**
 * Delete the anonymous_users row for this fingerprint.
 * ON DELETE CASCADE removes decode_sessions → worry_items → verifications → return_feedback.
 */
export async function purgeAllForFingerprint(fingerprint: string): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('anonymous_users')
    .delete()
    .eq('fingerprint', fingerprint);
  if (error) throw error;
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add lib/db/users.ts
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(db): purgeAllForFingerprint for /api/settings/purge"
```

---

### Task 4: Evidence stats pure function (TDD)

**Files:**
- Create: `lib/core/evidenceStats.ts`
- Test: `tests/lib/core/evidenceStats.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/lib/core/evidenceStats.test.ts
import { describe, it, expect } from 'vitest';
import { computeEvidenceStats } from '@/lib/core/evidenceStats';

describe('computeEvidenceStats', () => {
  it('returns zeros for an empty input', () => {
    const s = computeEvidenceStats({
      sessionsCount: 0,
      worries: [],
      verifications: [],
      feedbacks: [],
    });
    expect(s.sessions).toBe(0);
    expect(s.positiveRate).toBeNull();
    expect(s.catastrophicDidNotHappenRate).toBeNull();
  });

  it('computes positive cycle rate from feedback emojis', () => {
    const s = computeEvidenceStats({
      sessionsCount: 3,
      worries: [],
      verifications: [],
      feedbacks: [{ emoji: '🙂' }, { emoji: '🙂' }, { emoji: '😐' }],
    });
    expect(s.positiveRate).toBeCloseTo(2 / 3, 2);
  });

  it('computes catastrophic-did-not-happen rate from responded verifications only', () => {
    const s = computeEvidenceStats({
      sessionsCount: 1,
      worries: [],
      verifications: [
        { did_happen: false, responded_at: '2026-04-20' },
        { did_happen: false, responded_at: '2026-04-21' },
        { did_happen: true, responded_at: '2026-04-22' },
        { did_happen: null, responded_at: null },  // unanswered — ignored
      ],
      feedbacks: [],
    });
    expect(s.catastrophicRespondedCount).toBe(3);
    expect(s.catastrophicDidNotHappenRate).toBeCloseTo(2 / 3, 2);
  });

  it('counts manual reclassify rate from worries', () => {
    const s = computeEvidenceStats({
      sessionsCount: 2,
      worries: [
        { was_manually_edited: true },
        { was_manually_edited: false },
        { was_manually_edited: false },
        { was_manually_edited: false },
      ],
      verifications: [],
      feedbacks: [],
    });
    expect(s.manualEditRate).toBeCloseTo(1 / 4, 2);
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
npm test -- evidenceStats
```

- [ ] **Step 3: Implement**

```ts
// lib/core/evidenceStats.ts
// Pure aggregation of already-fetched rows into display stats.
// No DB calls here — caller passes already-fetched rows.

export interface EvidenceInput {
  sessionsCount: number;
  worries: Array<{ was_manually_edited: boolean }>;
  verifications: Array<{ did_happen: boolean | null; responded_at: string | null }>;
  feedbacks: Array<{ emoji: string }>;
}

export interface EvidenceStats {
  sessions: number;
  /** Positive cycle rate = 🙂 / total feedbacks. Null when no feedback exists. */
  positiveRate: number | null;
  /** Of responded verifications, fraction with did_happen=false. Null when none responded. */
  catastrophicDidNotHappenRate: number | null;
  catastrophicRespondedCount: number;
  /** Of all worries, fraction that were manually reclassified by the user. Null when no worries. */
  manualEditRate: number | null;
  emojiDistribution: Record<string, number>;
}

export function computeEvidenceStats(input: EvidenceInput): EvidenceStats {
  const total = input.feedbacks.length;
  const positive = input.feedbacks.filter((f) => f.emoji === '🙂').length;

  const responded = input.verifications.filter((v) => v.responded_at !== null);
  const didNotHappen = responded.filter((v) => v.did_happen === false).length;

  const edits = input.worries.filter((w) => w.was_manually_edited).length;

  const dist: Record<string, number> = {};
  for (const f of input.feedbacks) {
    dist[f.emoji] = (dist[f.emoji] ?? 0) + 1;
  }

  return {
    sessions: input.sessionsCount,
    positiveRate: total > 0 ? positive / total : null,
    catastrophicRespondedCount: responded.length,
    catastrophicDidNotHappenRate:
      responded.length > 0 ? didNotHappen / responded.length : null,
    manualEditRate: input.worries.length > 0 ? edits / input.worries.length : null,
    emojiDistribution: dist,
  };
}
```

- [ ] **Step 4: Test passes**

```bash
npm test -- evidenceStats
```

- [ ] **Step 5: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add lib/core/evidenceStats.ts tests/lib/core/evidenceStats.test.ts
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(core): evidenceStats pure aggregation + tests"
```

---

### Task 5: API — GET /api/sessions (list by fingerprint)

**Files:**
- Modify: `app/api/sessions/route.ts` (add GET next to existing POST)

- [ ] **Step 1: Add GET handler**

Open `app/api/sessions/route.ts`. Keep the existing `POST` handler. Add:

```ts
import { listSessionsByFingerprint } from '@/lib/db/sessions';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fingerprint = url.searchParams.get('fingerprint');
  if (!fingerprint) {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  const sessions = await listSessionsByFingerprint(fingerprint);
  return NextResponse.json({ sessions });
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/api/sessions/route.ts
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(api): GET /api/sessions — list history by fingerprint"
```

---

### Task 6: API — DELETE /api/sessions/:id

**Files:**
- Modify: `app/api/sessions/[id]/route.ts`

- [ ] **Step 1: Add DELETE handler**

Open `app/api/sessions/[id]/route.ts` (already has GET). Add:

```ts
import { deleteSession } from '@/lib/db/sessions';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteSession(id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/api/sessions/[id]/route.ts
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(api): DELETE /api/sessions/:id — user-initiated delete"
```

---

### Task 7: API — GET /api/stats (evidence panel data)

**Files:**
- Create: `app/api/stats/route.ts`

- [ ] **Step 1: Implement**

```ts
// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/db/supabase';
import { computeEvidenceStats } from '@/lib/core/evidenceStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fingerprint = url.searchParams.get('fingerprint');
  if (!fingerprint) {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  const sb = getServerSupabase();
  const { data: userRow, error: uErr } = await sb
    .from('anonymous_users')
    .select('id')
    .eq('fingerprint', fingerprint)
    .maybeSingle();
  if (uErr) throw uErr;
  if (!userRow) {
    return NextResponse.json({
      stats: {
        sessions: 0,
        positiveRate: null,
        catastrophicDidNotHappenRate: null,
        catastrophicRespondedCount: 0,
        manualEditRate: null,
        emojiDistribution: {},
      },
    });
  }
  const userId = (userRow as { id: string }).id;

  const [{ data: sessions }, { data: worries }, { data: verifications }, { data: feedbacks }] =
    await Promise.all([
      sb
        .from('decode_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      sb
        .from('worry_items')
        .select('was_manually_edited, decode_sessions!inner ( user_id )')
        .eq('decode_sessions.user_id', userId),
      sb
        .from('verifications')
        .select(
          'did_happen, responded_at, worry_items!inner ( decode_sessions!inner ( user_id ) )',
        )
        .eq('worry_items.decode_sessions.user_id', userId),
      sb
        .from('return_feedback')
        .select('emoji, decode_sessions!inner ( user_id )')
        .eq('decode_sessions.user_id', userId),
    ]);

  const stats = computeEvidenceStats({
    sessionsCount: (sessions ?? []).length,
    worries: (worries ?? []).map((w) => ({
      was_manually_edited: (w as { was_manually_edited: boolean }).was_manually_edited,
    })),
    verifications: (verifications ?? []).map((v) => ({
      did_happen: (v as { did_happen: boolean | null }).did_happen,
      responded_at: (v as { responded_at: string | null }).responded_at,
    })),
    feedbacks: (feedbacks ?? []).map((f) => ({
      emoji: (f as { emoji: string }).emoji,
    })),
  });

  return NextResponse.json({ stats });
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/api/stats/route.ts
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(api): GET /api/stats — evidence panel aggregates"
```

---

### Task 8: API — POST /api/settings/export + /api/settings/purge

**Files:**
- Create: `app/api/settings/export/route.ts`
- Create: `app/api/settings/purge/route.ts`

- [ ] **Step 1: export route**

```ts
// app/api/settings/export/route.ts
import { NextResponse } from 'next/server';
import { exportAllForFingerprint } from '@/lib/db/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { fingerprint } = body as { fingerprint?: string };
  if (!fingerprint) {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  const data = await exportAllForFingerprint(fingerprint);
  return NextResponse.json({ exported_at: new Date().toISOString(), data });
}
```

- [ ] **Step 2: purge route**

```ts
// app/api/settings/purge/route.ts
import { NextResponse } from 'next/server';
import { purgeAllForFingerprint } from '@/lib/db/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { fingerprint } = body as { fingerprint?: string };
  if (!fingerprint) {
    return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });
  }
  await purgeAllForFingerprint(fingerprint);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/api/settings
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(api): /api/settings export + purge routes"
```

---

### Task 9: Modify DecodeCard to support read-only mode

**Files:**
- Modify: `components/DecodeCard/index.tsx`

Add an optional `readOnly` prop. When true, hide the "现在做 5 分钟" button and the CategoryChip reclassify menu (just display labels, no dropdown).

- [ ] **Step 1: Patch**

Open `components/DecodeCard/index.tsx`. Add `readOnly?: boolean` to `DecodeCardProps`. Make `onReclassify` and `onLaunch` callbacks optional when `readOnly` is true. In the JSX:

```tsx
interface DecodeCardProps {
  headline: string;
  primaryAction: string;
  worries: DecodeCardWorry[];
  onReclassify?: (worryId: string, next: WorryCategory) => void;
  onLaunch?: () => void;
  launchBusy?: boolean;
  readOnly?: boolean;
}
```

In the render body, wrap the "现在做 5 分钟" button with `{!readOnly && (...)}`. For each worry item, replace `<CategoryChip ...>` with:

```tsx
{readOnly ? (
  <span className="rounded-full border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700">
    {w.category === 'real' ? '🟢 真问题' : w.category === 'catastrophic' ? '🟡 灾难化' : '⚪ 雾'}
  </span>
) : (
  <CategoryChip
    category={w.category}
    onReclassify={(next) => onReclassify?.(w.id, next)}
  />
)}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit && npm test
```

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add components/DecodeCard/index.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(components): DecodeCard readOnly mode for /card/:id view"
```

---

### Task 10: HistoryCard component

**Files:**
- Create: `components/HistoryCard/index.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/HistoryCard/index.tsx
'use client';

import Link from 'next/link';

interface HistoryCardProps {
  id: string;
  headline: string | null;
  primaryAction: string | null;
  createdAt: string;
  realCount: number;
  catastrophicCount: number;
  fogCount: number;
  feedbackEmoji: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryCard({
  id,
  headline,
  primaryAction,
  createdAt,
  realCount,
  catastrophicCount,
  fogCount,
  feedbackEmoji,
}: HistoryCardProps) {
  return (
    <Link
      href={`/card/${id}`}
      className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-400 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-medium text-stone-800 leading-snug">
          {headline ?? '（无标题）'}
        </h3>
        {feedbackEmoji && <span className="text-xl">{feedbackEmoji}</span>}
      </div>
      {primaryAction && (
        <p className="text-xs text-stone-500 mb-3">→ {primaryAction}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-stone-500">
        <span>{fmtDate(createdAt)}</span>
        <span>·</span>
        <span>🟢 {realCount}</span>
        <span>🟡 {catastrophicCount}</span>
        <span>⚪ {fogCount}</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add components/HistoryCard/index.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(components): HistoryCard compact list item"
```

---

### Task 11: EvidenceStats component

**Files:**
- Create: `components/EvidenceStats/index.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/EvidenceStats/index.tsx
'use client';

import { useEffect, useState } from 'react';
import { getOrCreateFingerprint } from '@/lib/fingerprint';
import type { EvidenceStats } from '@/lib/core/evidenceStats';

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default function EvidenceStatsPanel() {
  const [stats, setStats] = useState<EvidenceStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const fp = getOrCreateFingerprint();
      try {
        const res = await fetch(`/api/stats?fingerprint=${encodeURIComponent(fp)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { stats: EvidenceStats };
        if (!cancelled) setStats(data.stats);
      } catch {
        // silent
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;
  if (stats.sessions === 0) {
    return (
      <p className="text-sm text-stone-500">
        这里会慢慢积累你的证据 —— 解码一次以后再回来看。
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 flex flex-col gap-4">
      <h3 className="text-sm font-medium text-stone-700">你的证据累积</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-stone-500 mb-1">累计解码次数</p>
          <p className="text-2xl font-medium text-stone-800">{stats.sessions}</p>
        </div>
        {stats.catastrophicRespondedCount > 0 &&
          stats.catastrophicDidNotHappenRate !== null && (
            <div>
              <p className="text-xs text-stone-500 mb-1">灾难没发生的比例</p>
              <p className="text-2xl font-medium text-emerald-700">
                {pct(stats.catastrophicDidNotHappenRate)}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                （{stats.catastrophicRespondedCount} 条已回答）
              </p>
            </div>
          )}
        {stats.positiveRate !== null && (
          <div>
            <p className="text-xs text-stone-500 mb-1">🙂 反馈率</p>
            <p className="text-2xl font-medium text-stone-800">{pct(stats.positiveRate)}</p>
          </div>
        )}
        {stats.manualEditRate !== null && (
          <div>
            <p className="text-xs text-stone-500 mb-1">手动修正分类比例</p>
            <p className="text-2xl font-medium text-stone-800">{pct(stats.manualEditRate)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add components/EvidenceStats/index.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(components): EvidenceStats panel (catastrophic-did-not-happen rate)"
```

---

### Task 12: /history page

**Files:**
- Create: `app/history/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getOrCreateFingerprint } from '@/lib/fingerprint';
import HistoryCard from '@/components/HistoryCard';
import EvidenceStatsPanel from '@/components/EvidenceStats';

interface SessionRow {
  id: string;
  created_at: string;
  card_headline: string | null;
  primary_action: string | null;
  real_count: number;
  catastrophic_count: number;
  fog_count: number;
  feedback_emoji: string | null;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const fp = getOrCreateFingerprint();
      const res = await fetch(`/api/sessions?fingerprint=${encodeURIComponent(fp)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: SessionRow[] };
      if (!cancelled) setSessions(data.sessions);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="mx-auto max-w-xl flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-medium text-stone-800">过往的解码</h1>
          <a href="/" className="text-sm text-stone-500 underline">
            回到首页
          </a>
        </header>

        <EvidenceStatsPanel />

        {sessions === null && <p className="text-sm text-stone-500">加载中…</p>}
        {sessions !== null && sessions.length === 0 && (
          <p className="text-sm text-stone-500">
            还没有解码记录 —— 做完第一次就会出现在这里。
          </p>
        )}
        {sessions !== null && sessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <HistoryCard
                key={s.id}
                id={s.id}
                headline={s.card_headline}
                primaryAction={s.primary_action}
                createdAt={s.created_at}
                realCount={s.real_count}
                catastrophicCount={s.catastrophic_count}
                fogCount={s.fog_count}
                feedbackEmoji={s.feedback_emoji}
              />
            ))}
          </div>
        )}

        <footer className="mt-8 border-t border-stone-200 pt-4">
          <a href="/settings/data" className="text-xs text-stone-500 underline">
            数据管理 / 删除我的数据
          </a>
        </footer>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/history/page.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(app): /history page with HistoryCard list + EvidenceStats"
```

---

### Task 13: ScreenshotButton component

**Files:**
- Create: `components/ScreenshotButton/index.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/ScreenshotButton/index.tsx
'use client';

import { useRef } from 'react';
import { toPng } from 'html-to-image';

interface ScreenshotButtonProps {
  /** CSS selector pointing to the element to screenshot. */
  targetSelector: string;
  fileName?: string;
}

export default function ScreenshotButton({
  targetSelector,
  fileName = 'anxiety-decoder-card.png',
}: ScreenshotButtonProps) {
  const busy = useRef(false);

  const handleExport = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const node = document.querySelector(targetSelector) as HTMLElement | null;
      if (!node) return;
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: '#fafaf9',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      a.click();
    } finally {
      busy.current = false;
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs text-stone-700 hover:border-stone-400"
    >
      保存图片
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add components/ScreenshotButton/index.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(components): ScreenshotButton via html-to-image"
```

---

### Task 14: /card/[sessionId] public detail page

**Files:**
- Create: `app/card/[sessionId]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/card/[sessionId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DecodeCard, { type DecodeCardWorry } from '@/components/DecodeCard';
import ScreenshotButton from '@/components/ScreenshotButton';

interface SessionPayload {
  primary_action: string | null;
  card_headline: string | null;
  worries: DecodeCardWorry[];
}

export default function CardDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const payload = (await res.json()) as SessionPayload;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError('卡片不存在或已删除');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <p className="text-stone-500 text-sm">{error}</p>
      </main>
    );
  }
  if (!data || !data.card_headline || !data.primary_action) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <p className="text-stone-500 text-sm">加载中…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="mx-auto max-w-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <a href="/history" className="text-sm text-stone-500 underline">
            ← 过往的解码
          </a>
          <ScreenshotButton
            targetSelector="#decode-card-root"
            fileName={`anxiety-decoder-${sessionId}.png`}
          />
        </div>
        <div id="decode-card-root">
          <DecodeCard
            headline={data.card_headline}
            primaryAction={data.primary_action}
            worries={data.worries}
            readOnly
          />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/card/[sessionId]/page.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(app): /card/:id public detail page with screenshot export"
```

---

### Task 15: /settings/data cockpit page

**Files:**
- Create: `app/settings/data/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/settings/data/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getOrCreateFingerprint, FINGERPRINT_KEY } from '@/lib/fingerprint';

export default function DataCockpitPage() {
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const fp = getOrCreateFingerprint();
      const res = await fetch(`/api/sessions?fingerprint=${encodeURIComponent(fp)}`);
      if (res.ok) {
        const data = (await res.json()) as { sessions: unknown[] };
        if (!cancelled) setSessionCount(data.sessions.length);
      }
      // Email lookup: reuse /api/stats implicitly via a dedicated query — but we don't
      // have a user-email endpoint. For MVP cockpit, just show the count + purge/export.
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const fp = getOrCreateFingerprint();
      const res = await fetch('/api/settings/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anxiety-decoder-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('导出成功。');
    } catch {
      setStatus('导出失败');
    } finally {
      setBusy(false);
    }
  };

  const handlePurge = async () => {
    const ok = confirm('真的要删除所有数据吗？这一步不可撤销。');
    if (!ok) return;
    setBusy(true);
    setStatus(null);
    try {
      const fp = getOrCreateFingerprint();
      const res = await fetch('/api/settings/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      localStorage.removeItem(FINGERPRINT_KEY);
      localStorage.removeItem('anxiety_decoder_quote_history');
      localStorage.removeItem('anxiety_decoder_draft');
      setStatus('数据已全部删除。刷新页面会从头开始。');
      setSessionCount(0);
    } catch {
      setStatus('删除失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="mx-auto max-w-xl flex flex-col gap-6">
        <header>
          <h1 className="text-xl font-medium text-stone-800">数据管理</h1>
          <p className="text-xs text-stone-500 mt-2">
            我们存了什么、存多久、为什么存 —— 这里全部透明。
          </p>
        </header>

        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-medium text-stone-700 mb-2">当前浏览器存储</h2>
          <dl className="text-sm text-stone-700 space-y-1">
            <div>
              <dt className="inline text-stone-500">解码次数：</dt>
              <dd className="inline">{sessionCount ?? '…'}</dd>
            </div>
            <div>
              <dt className="inline text-stone-500">fingerprint：</dt>
              <dd className="inline font-mono text-xs">
                {typeof window !== 'undefined'
                  ? localStorage.getItem(FINGERPRINT_KEY) ?? ''
                  : ''}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-stone-700">导出 / 删除</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={busy}
              className="rounded-md bg-white border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-400 disabled:opacity-50"
            >
              导出我的全部数据（JSON）
            </button>
            <button
              type="button"
              onClick={handlePurge}
              disabled={busy}
              className="rounded-md bg-rose-700 px-4 py-2 text-sm text-white hover:bg-rose-600 disabled:opacity-50"
            >
              删除我的全部数据
            </button>
          </div>
          {status && <p className="text-xs text-stone-500">{status}</p>}
        </section>

        <p className="text-xs text-stone-500">
          另：原文会在 30 天后被自动清空（衍生的分类数据保留）。详见{' '}
          <a href="/privacy" className="underline">
            隐私说明
          </a>
          。
        </p>

        <a href="/" className="text-sm text-stone-500 underline self-start">
          ← 回到首页
        </a>
      </div>
    </main>
  );
}
```

Note: the `/privacy` page is Plan 4. For Plan 3 the link is harmless (404 is acceptable before Plan 4 runs).

- [ ] **Step 2: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/settings/data/page.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(app): /settings/data cockpit (view/export/purge)"
```

---

### Task 16: Wire history link into landing + post-decode return page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/decode/[sessionId]/return/page.tsx`

- [ ] **Step 1: Landing — add "看看过往" link in a corner**

In `app/page.tsx`, inside the main content block (after the ritual finishes), add a link:

```tsx
<a
  href="/history"
  className="fixed top-4 right-4 text-xs text-stone-500 hover:text-stone-700 underline"
>
  过往的解码 →
</a>
```

Place this inside the `<main>` that renders after `ritualDone`.

- [ ] **Step 2: Return page — add link after "收到。"**

In `app/decode/[sessionId]/return/page.tsx`, find the block that renders when `done === true`:

```tsx
if (done) {
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 gap-6">
      <p className="text-2xl text-stone-700">收到。</p>
      <div className="flex gap-3 text-sm text-stone-500">
        <a href="/" className="underline">再来一次</a>
        <span>·</span>
        <a href="/history" className="underline">看看过往</a>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add app/page.tsx app/decode/[sessionId]/return/page.tsx
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "feat(app): wire /history link from landing + return page"
```

---

### Task 17: E2E — history flow

**Files:**
- Create: `tests/e2e/history-flow.spec.ts`

- [ ] **Step 1: Implement**

```ts
// tests/e2e/history-flow.spec.ts
import { test, expect } from '@playwright/test';

test('history: navigate from landing → history → card detail', async ({ page }) => {
  test.setTimeout(90_000);

  // Run a full decode first to seed a session.
  await page.goto('/');
  await page.click('button[aria-label="跳过"]', { timeout: 5_000 }).catch(() => {});
  await page
    .getByPlaceholder('把你现在脑子里所有担心倒出来')
    .fill('今天应该写论文但又担心导师不满意，拖了一整个下午。');
  await page.getByRole('button', { name: /开始解码/ }).click();
  await page.waitForSelector('div.bg-stone-100', { timeout: 30_000 });
  await page
    .getByPlaceholder('继续说…')
    .fill(
      '具体担心是文献综述写得太浅，导师上次说过要更深入，我不知道怎么深入下去，一打开文件夹就想关掉。',
    );
  await page.getByRole('button', { name: /继续/ }).click();
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+\/result$/, { timeout: 45_000 });
  await page.getByRole('button', { name: /现在做 5 分钟/ }).click();
  await page.getByRole('button', { name: /我回来了/ }).click();
  await page.locator('button[aria-label="🙂"]').click();
  await page.getByRole('button', { name: /提交/ }).click();
  await expect(page.getByText(/收到/)).toBeVisible();

  // Click "看看过往" to hit /history.
  await page.getByRole('link', { name: /看看过往/ }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByText(/过往的解码/)).toBeVisible();

  // First HistoryCard should be clickable → /card/:id.
  const firstCard = page.locator('a[href^="/card/"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/\/card\/[0-9a-f-]+$/);
  await expect(page.getByRole('button', { name: /保存图片/ })).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
npm run test:e2e
```

Expected: 3 E2E tests pass (decode-flow + verify-flow + history-flow).

- [ ] **Step 3: Commit**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  add tests/e2e/history-flow.spec.ts
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette \
  commit -m "test(e2e): history → card detail navigation"
```

---

### Task 18: Phase 3 acceptance — manual (USER)

- [ ] **Step 1: Start dev server; run 2-3 decodes with mixed feedback**

Run a few decodes with different emoji reactions to populate data.

- [ ] **Step 2: In Supabase SQL, seed some responded verifications**

```sql
-- Fast-forward any unsent verifications
update verifications set scheduled_for = now() - interval '1 day' where sent_at is null;
-- Mark some as responded for evidence stats to populate
update verifications set
  responded_at = now(),
  did_happen = false
  where responded_at is null and did_happen is null
  limit 2;
```

- [ ] **Step 3: Open /history**

- Verify HistoryCard list shows all completed decodes with emoji, primary_action, and counts
- Verify EvidenceStats panel shows sessions count + "灾难没发生的比例" (should be 100% if you marked both as false) + 🙂 rate

- [ ] **Step 4: Click a card → /card/:id**

- Verify the card shows headline + buckets + primary_action
- Verify NO "现在做 5 分钟" button (readOnly)
- Verify NO chip-reclassify menu (readOnly)
- Click "保存图片" → PNG downloads to Downloads folder

- [ ] **Step 5: Open /settings/data**

- Verify session count matches /history count
- Click "导出我的全部数据" → JSON downloads
- Confirm JSON contains your decode sessions, worries, feedbacks

- [ ] **Step 6: Test purge (destructive!)**

In a second incognito browser (fresh fingerprint), run 1 decode. Then go to /settings/data → "删除我的全部数据" → confirm.
- Verify localStorage is cleared (DevTools → Application → Local Storage)
- Refresh page — should be a fresh first-time user
- Back in Supabase, check the anonymous_users row for that fingerprint is gone

- [ ] **Step 7: Tag**

```bash
git -c user.email=wuyifei0208@gmail.com -c user.name=Evette tag phase-3-complete
```

---

## Self-Review Checklist

- [ ] **§3.2 历史卡片一等公民** — Tasks 10-12 + landing link (Task 16) + return-page link (Task 16)
- [ ] **§12.1 北极星可观察** — EvidenceStats shows positive rate (Task 11), Task 4's pure function computes it
- [ ] **§12.3 emoji 分布 + 灾难没发生 占比** — both covered by EvidenceStats
- [ ] **§18.2.3 数据驾驶舱** — /settings/data (Task 15) covers view + export + delete
- [ ] **§6 Phase 3 endpoints** — GET /sessions (Task 5), GET /stats (Task 7), DELETE /sessions/:id (Task 6), POST /settings/export + /settings/purge (Task 8)
- [ ] **截图分享** — ScreenshotButton via html-to-image (Task 13), mounted on /card/:id (Task 14)
- [ ] **数据所有权** — purge deletes everything by fingerprint (Task 3) + clears localStorage (Task 15)

---

## Next: Generating Plan 4

After Phase 3 is tagged `phase-3-complete`, Plan 4 picks up the remaining pre-launch work: visual polish, AI prompt iteration, error-state UI, /privacy page, Vercel deploy, PRD packaging, cold-start execution. Plan 4 is deliberately split into **deterministic cookbook tasks** (error UI, /privacy, deploy, PRD outline) and **iteration frameworks** (visual polish checklist, benchmark-dataset prompt-tuning loop, cold-start outreach playbook). The latter cannot be fully cookbook-ified because they require creative judgment and real-world feedback.

To trigger Plan 4 generation, ask:

> 基于 `docs/superpowers/plans/2026-04-25-phase-4-polish-and-launch.md`，生成 Phase 4 的实现计划。参考 spec §15 Phase 4 + §19 冷启动 + §18.2.4 Landing 隐私承诺 + §17 开放问题（事后验证邮件措辞打磨、卡片视觉定稿、Landing A/B 文案）。

**Key dependency from Phases 1-3**:
- Phase 1 benchmarks: save 5-8 real user worry dumps you used during manual testing — they become the AI prompt regression dataset for Phase 4
- Phase 2 email templates: whatever rough Resend email format you have now is the starting point for Phase 4's 3-version email copy polish
- Phase 3 visual baseline: the current stone+emerald+amber palette + the card layout are the "before" — Phase 4 polish will iterate from this baseline

Plan 4 is already saved at `docs/superpowers/plans/2026-04-25-phase-4-polish-and-launch.md` (written alongside Plan 3).
