import { prisma } from "./prisma";

/**
 * Postgres-backed rate limiter. A plain in-memory Map doesn't work on
 * serverless (each instance has its own memory, so limits reset per
 * cold start) — this uses an atomic upsert so concurrent instances share
 * one counter per key.
 *
 * @returns true if the request is allowed, false if the limit is exceeded.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitHit" (key, count, "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RateLimitHit"."resetAt" < ${now} THEN 1 ELSE "RateLimitHit".count + 1 END,
      "resetAt" = CASE WHEN "RateLimitHit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimitHit"."resetAt" END
    RETURNING count
  `;

  return rows[0].count <= limit;
}
