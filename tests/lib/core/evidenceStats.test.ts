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
        { did_happen: null, responded_at: null },
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
