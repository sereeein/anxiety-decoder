// app/not-found.tsx
import Image from 'next/image';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-6">
      <Image
        src="/illustrations/06-not-found.png"
        alt="一只黑色小猫望着天上的云"
        width={400}
        height={400}
        className="cat-soft-mask w-48 md:w-56 h-auto"
      />
      <p className="font-handwriting-cn text-2xl text-[var(--text)]">
        这里没有内容。
      </p>
      <a
        href="/"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
      >
        回到首页
      </a>
    </main>
  );
}
