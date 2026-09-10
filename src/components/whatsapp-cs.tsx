"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, Headset, Loader2, Send, X } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"

const WHATSAPP_NUMBER = "6285184657474"

type Profile = {
  id: string
  email: string | null
  name: string | null
}

type UserRow = {
  id: string
  email: string | null
  name: string | null
}

export function WhatsAppCs() {
  const { supabase } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState("Umum")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Animasi mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300)
    return () => clearTimeout(t)
  }, [])

  // Ambil profile user
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!active || !user) return

        const { data } = await supabase
          .from("users")
          .select("id, email, name")
          .eq("id", user.id)
          .single<UserRow>()

        if (!active) return
        setProfile({
          id: user.id,
          email: data?.email ?? user.email ?? null,
          name: data?.name ?? null,
        })
      } catch {
        // ignore
      }
    })()
    return () => {
      active = false
    }
  }, [supabase])

  // Lock scroll + ESC saat modal open
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !sending) setOpen(false)
    }
    document.addEventListener("keydown", onEsc)
    setTimeout(() => textareaRef.current?.focus(), 100)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [open, sending])

  const buildWhatsAppUrl = useCallback(() => {
    const lines: string[] = [
      "Halo CS PakaiKuota,",
      "",
      `*Kategori:* ${category}`,
      "*Pesan:*",
      message.trim() || "-",
      "",
      "---",
      "*Data akun (otomatis):*",
    ]

    if (profile?.name) lines.push(`Nama: ${profile.name}`)
    if (profile?.email) lines.push(`Email: ${profile.email}`)
    if (profile?.id) lines.push(`User ID: ${profile.id}`)

    lines.push(
      "",
      `Dikirim: ${new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      })} WIB`
    )

    const text = lines.join("\n")
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
  }, [category, message, profile])

  function submit() {
    if (!message.trim()) {
      textareaRef.current?.focus()
      return
    }
    setSending(true)
    const url = buildWhatsAppUrl()
    window.open(url, "_blank", "noopener,noreferrer")
    setTimeout(() => {
      setSending(false)
      setOpen(false)
      setMessage("")
      setCategory("Umum")
    }, 400)
  }

  const categories = [
    "Umum",
    "Pembayaran",
    "Token tidak masuk",
    "Bug / Error",
    "Akun & Login",
    "Reseller",
    "Lainnya",
  ]

  return (
    <>
      {/* Trigger FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Hubungi customer service"
        className={`fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1F9E6E] px-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#187d58] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pk-accent) ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        } ${open ? "pointer-events-none opacity-0" : ""}`}
      >
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <Headset size={20} />
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#34d399]" />
          </span>
        </span>
        <span className="hidden sm:inline">Butuh bantuan?</span>
        <span className="sr-only sm:hidden">Butuh bantuan?</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cs-modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="pk-panel pk-menu-in relative w-full max-w-md overflow-hidden p-5 sm:p-6"
          >
            <button
              type="button"
              onClick={() => !sending && setOpen(false)}
              aria-label="Tutup"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#34d399]/40 bg-[#34d399]/10">
                <Headset size={20} className="text-[#6ee7b7]" />
              </span>
              <div>
                <h2
                  id="cs-modal-title"
                  className="text-base font-semibold text-(--pk-text)"
                >
                  Hubungi Customer Service
                </h2>
                <p className="mt-0.5 text-[11px] text-(--pk-text-mute)">
                  Balas cepat, 09.00–21.00 WIB
                </p>
              </div>
            </div>

            {/* Preview data akun */}
            <div className="mt-4 rounded-lg border border-(--pk-line-2) bg-[#0b1626]/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                Data akun yang ikut terkirim
              </p>
              <div className="mt-2 space-y-1 text-[11px]">
                <p className="flex items-center justify-between gap-2">
                  <span className="text-(--pk-text-mute)">Nama</span>
                  <span className="truncate font-mono text-(--pk-text-dim)">
                    {profile?.name ?? "—"}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span className="text-(--pk-text-mute)">Email</span>
                  <span className="truncate font-mono text-(--pk-text-dim)">
                    {profile?.email ?? "—"}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-2">
                  <span className="text-(--pk-text-mute)">User ID</span>
                  <span className="truncate font-mono text-(--pk-text-dim)">
                    {profile?.id ? `${profile.id.slice(0, 8)}…` : "—"}
                  </span>
                </p>
              </div>
            </div>

            {/* Kategori — custom select */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-(--pk-text)">
                Kategori
              </label>
              <div className="relative mt-1.5">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={sending}
                  className="w-full appearance-none rounded-xl border border-(--pk-line-2) bg-[#0b1626] py-2.5 pl-3.5 pr-10 text-sm text-(--pk-text) outline-none transition-colors focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-[#0b1626]">
                      {c}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                >
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            {/* Keluhan */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-(--pk-text)">
                Keluhan / pertanyaan
              </label>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                rows={4}
                maxLength={1000}
                placeholder="Ceritakan masalah atau pertanyaan Anda…"
                className="mt-1.5 w-full resize-none rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3 py-2.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-(--pk-text-mute)">
                <span>Wajib diisi minimal 1 karakter</span>
                <span className="font-mono">{message.length}/1000</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => !sending && setOpen(false)}
                disabled={sending}
                className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending || !message.trim()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#1F9E6E] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#187d58] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {sending ? "Membuka WhatsApp…" : "Kirim via WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}