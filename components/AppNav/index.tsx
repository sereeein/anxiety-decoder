// components/AppNav/index.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-4 right-4 flex gap-3 text-xs text-stone-500">
      {pathname !== '/' && (
        <Link href="/" className="underline hover:text-stone-700">
          首页
        </Link>
      )}
      {pathname !== '/history' && (
        <Link href="/history" className="underline hover:text-stone-700">
          过往
        </Link>
      )}
      {pathname !== '/settings/data' && (
        <Link href="/settings/data" className="underline hover:text-stone-700">
          数据
        </Link>
      )}
    </nav>
  );
}
