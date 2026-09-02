import IORedis from 'ioredis'

let client: IORedis | null = null

export function getRedis() {
  if (!client) {
    client = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    })
  }
  return client
}