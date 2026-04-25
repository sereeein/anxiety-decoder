// app/not-found.tsx
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-6">
      <p className="font-handwriting-en text-7xl md:text-8xl text-[var(--input-border)]">
        404
      </p>
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
