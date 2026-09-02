import { readFileSync } from 'fs'
import { join } from 'path'
import { getRedis } from './client'

let scriptSha: string | null = null

export async function loadSpendScript() {
  if (scriptSha) return scriptSha
  const redis = getRedis()
  const script = readFileSync(join(process.cwd(), 'src/lib/redis/spendLimit.lua'), 'utf8')
  scriptSha = (await redis.script('LOAD', script)) as string
  return scriptSha
}

export async function checkAndRecordSpend(userId: string, amount: number, windowSec: number, limit: number) {
  const redis = getRedis()
  const sha = await loadSpendScript()
  const key = `spend:${userId}:${windowSec === 3600 ? 'hourly' : 'daily'}`
  await redis.set(`${key}:limit`, limit)
  const result = (await redis.evalsha(sha, 1, key, amount, windowSec)) as number
  return result === 1
}
