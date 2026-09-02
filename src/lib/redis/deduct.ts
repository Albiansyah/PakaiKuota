import { readFileSync } from 'fs'
import { join } from 'path'
import { getRedis } from './client'

let scriptSha: string | null = null

export async function loadDeductScript() {
  if (scriptSha) return scriptSha
  const redis = getRedis()
  const script = readFileSync(join(process.cwd(), 'src/lib/redis/deductQuota.lua'), 'utf8')
  scriptSha = (await redis.script('LOAD', script)) as string
  return scriptSha
}

export async function deductQuota(userId: string, amount: number) {
  const redis = getRedis()
  const sha = await loadDeductScript()
  const key = `quota:${userId}`
  const result = (await redis.evalsha(sha, 1, key, amount)) as number
  return result === 1
}