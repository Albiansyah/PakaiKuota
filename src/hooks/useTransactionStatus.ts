'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type TransactionStatusRow = { status: 'pending' | 'success' | 'failed' | 'expired' | 'refunded' }

export function useTransactionStatus(orderId: string | null) {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed' | 'expired' | 'refunded' | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!orderId) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('transactions')
        .select('status')
        .eq('order_id', orderId)
        .single() as { data: TransactionStatusRow | null }
      if (data?.status && data.status !== 'pending') {
        setStatus(data.status)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [orderId, supabase])

  return status
}
