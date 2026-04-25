// app/settings/data/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getOrCreateFingerprint, FINGERPRINT_KEY } from '@/lib/fingerprint';

export default function DataCockpitPage() {
  const [sessionCount, setSessionCount] = useState<number | null>(null);
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
    <main className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="font-handwriting-cn text-3xl md:text-4xl text-[var(--text)]">
            数据管理
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            我们存了什么、存多久、为什么存 —— 这里全部透明。
          </p>
        </header>

        <section className="rounded-2xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-6 flex flex-col gap-3">
          <h2 className="font-handwriting-cn text-xl text-[var(--text)]">
            当前浏览器存储
          </h2>
          <dl className="text-sm text-[var(--text)] space-y-1">
            <div>
              <dt className="inline text-[var(--text-muted)]">解码次数：</dt>
              <dd className="inline">{sessionCount ?? '…'}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--text-muted)]">fingerprint：</dt>
              <dd className="inline font-mono text-xs break-all">
                {typeof window !== 'undefined'
                  ? localStorage.getItem(FINGERPRINT_KEY) ?? ''
                  : ''}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-6 flex flex-col gap-4">
          <h2 className="font-handwriting-cn text-xl text-[var(--text)]">
            导出 / 删除
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={busy}
              className="rounded-full bg-white border-2 border-[var(--input-border)] hover:border-[var(--input-border-focus)] px-5 py-2 text-sm text-[var(--text)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              导出我的全部数据（JSON）
            </button>
            <button
              type="button"
              onClick={handlePurge}
              disabled={busy}
              className="rounded-full bg-[var(--bucket-catastrophic)] text-white px-5 py-2 text-sm hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              删除我的全部数据
            </button>
          </div>
          {status && <p className="text-xs text-[var(--text-muted)]">{status}</p>}
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          另：原文会在 30 天后被自动清空（衍生的分类数据保留）。详见{' '}
          <a
            href="/privacy"
            className="underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] hover:text-[var(--text)] transition-colors duration-150"
          >
            隐私说明
          </a>
          。
        </p>

        <a
          href="/"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150 self-start"
        >
          ← 回到首页
        </a>
      </div>
    </main>
  );
}
