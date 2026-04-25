// app/not-found.tsx
export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 gap-6">
      <p className="text-6xl text-stone-300">404</p>
      <p className="text-stone-700">这里没有内容。</p>
      <a href="/" className="text-sm text-stone-500 underline">
        回到首页
      </a>
    </main>
  );
}
