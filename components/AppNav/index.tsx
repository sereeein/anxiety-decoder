// components/AppNav/index.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppNav() {
  const pathname = usePathname();
  const links: { href: string; label: string }[] = [];
  if (pathname !== '/') links.push({ href: '/', label: '首页' });
  if (pathname !== '/history') links.push({ href: '/history', label: '过往' });
  if (pathname !== '/settings/data') links.push({ href: '/settings/data', label: '数据' });

  return (
    <nav className="font-handwriting-cn fixed top-4 right-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
      {links.map((link, i) => (
        <span key={link.href} className="flex items-center gap-2">
          <Link
            href={link.href}
            className="hover:text-[var(--text)] transition-colors duration-150"
          >
            {link.label}
          </Link>
          {i < links.length - 1 && (
            <span aria-hidden="true" className="text-[var(--input-border)]">·</span>
          )}
        </span>
      ))}
    </nav>
  );
}
