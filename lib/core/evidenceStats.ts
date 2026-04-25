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
