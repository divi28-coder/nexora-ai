// In-memory limiter (single instance only). Use Redis for multi-instance deployments.
const hits = new Map<string, number[]>();
export function limited(key: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now(); const arr = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(key, arr); return arr.length > max;
}
