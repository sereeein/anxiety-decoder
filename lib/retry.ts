// lib/retry.ts
export async function retryOnce<T>(
  fn: () => Promise<T>,
  delayMs = 600,
): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, delayMs));
    return fn();
  }
}
