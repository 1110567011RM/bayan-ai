type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      ok: true,
      remaining: Math.max(0, limit - 1),
      resetAt: now + windowMs,
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    ok: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}
