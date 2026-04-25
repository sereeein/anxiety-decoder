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
