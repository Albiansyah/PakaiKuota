"use client"

import { useEffect, useRef, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"

type RealtimeStatus = "connecting" | "connected" | "disconnected"

/**
 * Subscribe ke table finance-relevant.
 * Setiap perubahan → panggil `onUpdate()` dengan debounce 500ms.
 * 
 * Cleanup otomatis saat unmount.
 */
export function useFinanceRealtime(onUpdate: () => void) {
  const { supabase } = useSupabase()
  const [status, setStatus] = useState<RealtimeStatus>("connecting")
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onUpdateRef = useRef(onUpdate)

  // Update ref kalau callback berubah
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    const channel = supabase
      .channel("finance-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => trigger()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_ledger" },
        () => trigger()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_usage_logs" },
        () => trigger()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => trigger()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_expenses" },
        () => trigger()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "owner_withdrawals" },
        () => trigger()
      )

    function trigger() {
      setLastEventAt(new Date())
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onUpdateRef.current()
      }, 500)
    }

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") setStatus("connected")
      else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
        setStatus("disconnected")
      } else if (s === "CLOSED") {
        setStatus("disconnected")
      }
    })

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return { status, lastEventAt }
}