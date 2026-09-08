import 'server-only';

import Redis from 'ioredis';

let redis: Redis | undefined;

function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is not configured');
    redis = new Redis(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false });
  }
  return redis;
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const client = getRedis();
  const redisKey = `ratelimit:${key}`;
  const count = await client.incr(redisKey);
  if (count === 1) await client.expire(redisKey, windowSeconds);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
