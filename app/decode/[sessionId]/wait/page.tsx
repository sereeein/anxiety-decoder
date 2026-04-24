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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/companion`, { method: 'POST' });
        if (!res.ok) return;
        const data = (await res.json()) as { copy: string };
        if (!cancelled) setCopy(data.copy);
      } catch {
        // fall back to default copy
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
