import 'server-only';

import { Redis } from '@upstash/redis';

let redis: Redis | undefined;

function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('Upstash Redis environment is not configured');
    redis = new Redis({ url, token });
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
