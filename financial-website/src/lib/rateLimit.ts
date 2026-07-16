import "server-only";

interface Bucket {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

const globalForRateLimit = globalThis as unknown as { __loginAttempts?: Map<string, Bucket> };
const buckets = globalForRateLimit.__loginAttempts ?? new Map<string, Bucket>();
globalForRateLimit.__loginAttempts = buckets;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (bucket?.lockedUntil && bucket.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.lockedUntil - now) / 1000) };
  }

  if (!bucket || now - bucket.firstAttemptAt > WINDOW_MS) {
    return { allowed: true };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }

  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.firstAttemptAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  const count = bucket.count + 1;
  const updated: Bucket = { ...bucket, count };
  if (count >= MAX_ATTEMPTS) {
    updated.lockedUntil = now + LOCKOUT_MS;
  }
  buckets.set(key, updated);
}

export function clearAttempts(key: string): void {
  buckets.delete(key);
}

/** Test-only helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
