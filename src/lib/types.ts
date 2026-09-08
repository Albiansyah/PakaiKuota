// Shared Supabase type helpers to work around SSR type inference issues
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']

export type UserRow = Tables['users']['Row']
export type TransactionRow = Tables['transactions']['Row']
export type ModelRow = Tables['models']['Row']
export type ApiKeyRow = Tables['api_keys']['Row']
export type AuditLogRow = Tables['admin_audit_logs']['Row']
export type TokenPackageRow = Tables['token_packages']['Row']
export type UsageLogRow = Tables['usage_logs']['Row']

// Generic insert/update types
export type InsertResult<T> = { data: T[] | null; error: Error | null }
export type UpdateResult = { error: Error | null }

// Helper to create typed Supabase client
export async function getDb() {
  const supabase = await createClient()
  return supabase
}