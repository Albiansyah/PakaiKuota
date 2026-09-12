"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  TOPUP_PACKAGES,
  TOPUP_MIN,
  TOPUP_MAX,
  TOPUP_STEP,
  formatRupiah as rupiah,
} from "@/lib/pricing-config"
import {
  Check,
  Clock,
  Download,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  X,
  ZoomIn,
} from "lucide-react"

type Transaction = {
  id: string
  order_id: string
  amount_rupiah: number
  status: string
  payment_method: string | null
  payment_number: string | null
  total_payment: number | null
  expires_at: string | null
  created_at: string
}

type Payment = {
  order_id: string
  amount: number
  status: string
  qris_url?: string
  merchant_name?: string
  merchant_id?: string | null
  instructions?: string
  payment_url?: string
}

type Provider = "gopay_qris" | "pakasir"

const WHATSAPP_CS_NUMBER = "6285184657474"

const statusLabel: Record<string, string> = {
  pending: "Menunggu pembayaran",
  awaiting_verification: "Menunggu verifikasi admin",
  credited: "Saldo masuk",
  success: "Berhasil",
  paid: "Pembayaran diterima",
  expired: "Kedaluwarsa",
  failed: "Gagal",
  refunded: "Di-refund",
  refund_requested: "Refund diminta",
}

function buildPaidConfirmationWhatsAppUrl(
  orderId: string,
  amount: number,
  merchantName: string = "PakaiKuota"
): string {
  const lines = [
    `Halo Admin ${merchantName},`,
    "",
    "Saya sudah melakukan pembayaran untuk topup saldo:",
    "",
    `*Order ID:* ${orderId}`,
    `*Nominal:* ${rupiah(amount)}`,
    "",
    "Bukti transfer saya lampirkan di chat ini.",
    "",
    "Mohon segera diverifikasi ya. Terima kasih 🙏",
  ]

  return `https://wa.me/${WHATSAPP_CS_NUMBER}?text=${encodeURIComponent(
    lines.join("\n")
  )}`
}

export default function TopupPage() {
  const [amount, setAmount] = useState(TOPUP_PACKAGES[0].amount)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(
    TOPUP_PACKAGES[0].id
  )
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [payment, setPayment] = useState<Payment | null>(null)
  const [provider, setProvider] = useState<Provider>("gopay_qris")
  const [copied, setCopied] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [qrisZoomOpen, setQrisZoomOpen] = useState(false)

  const stats = useMemo(() => {
    const credited = transactions
      .filter((t) => t.status === "credited" || t.status === "success")
      .reduce((sum, t) => sum + Number(t.amount_rupiah ?? 0), 0)
    const pending = transactions.filter(
      (t) => t.status === "pending" || t.status === "awaiting_verification"
    ).length
    return { credited, pending, total: transactions.length }
  }, [transactions])

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const pkgId = params.get("package")
    if (!pkgId) return
    const found = TOPUP_PACKAGES.find((p) => p.id === pkgId)
    if (found) {
      setAmount(found.amount)
      setSelectedPackage(found.id)
    }
  }, [])

  async function loadTransactions() {
    const response = await fetch("/api/transactions", { cache: "no-store" })
    if (!response.ok) throw new Error("Transaksi tidak bisa dimuat.")
    const data = (await response.json()) as { transactions: Transaction[] }
    setTransactions(data.transactions)
    setState("ready")
  }

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      loadTransactions().catch(() => {
        if (active) setState("error")
      })
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!qrisZoomOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setQrisZoomOpen(false)
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [qrisZoomOpen])

  function pickPackage(id: string, value: number) {
    setSelectedPackage(id)
    setAmount(value)
  }

  function onCustomAmount(value: number) {
    setAmount(value)
    const match = TOPUP_PACKAGES.find((p) => p.amount === value)
    setSelectedPackage(match?.id ?? null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setMessage("")
    setPayment(null)

    try {
      const response = await fetch("/api/topups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount_rupiah: amount }),
      })
      const data = (await response.json().catch(() => null)) as
        | {
            error?: string
            payment_provider?: Provider
            payment?: Payment
          }
        | null

      if (!response.ok) {
        setMessage(data?.error ?? "Pembayaran tidak bisa dibuat.")
        return
      }

      const created = data?.payment
      setProvider(data?.payment_provider ?? "gopay_qris")
      setPayment(created ?? null)

      if (data?.payment_provider === "pakasir" && created?.payment_url) {
        window.location.assign(created.payment_url)
        return
      }

      setMessage("Pembayaran dibuat. Scan QRIS di bawah untuk menyelesaikan.")
      void loadTransactions()
    } catch {
      setMessage("Pembayaran tidak bisa dibuat. Coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  async function claimPaid() {
    if (!payment?.order_id) return
    setVerifying(true)
    setMessage("")
    try {
      const response = await fetch(
        `/api/topups/${encodeURIComponent(payment.order_id)}/verify`,
        { method: "POST" }
      )
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; status?: string; message?: string; error?: string }
        | null

      if (!response.ok || !data?.ok) {
        setMessage(data?.error ?? "Gagal menandai pembayaran.")
        return
      }

      setMessage(
        data.message ?? "Pembayaran kamu sedang menunggu verifikasi admin."
      )
      setPayment((prev) =>
        prev ? { ...prev, status: "awaiting_verification" } : prev
      )
      void loadTransactions()
    } catch {
      setMessage("Gagal menandai pembayaran. Coba lagi.")
    } finally {
      setVerifying(false)
    }
  }

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
            Saldo
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Top Up Saldo
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-(--pk-text-dim)">
            Pilih nominal, scan QRIS, lalu klik &quot;Saya Sudah Bayar&quot;.
            Admin akan verifikasi dan saldo masuk.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {payment && provider === "gopay_qris" && (
          <section className="pk-panel pk-featured pk-inview mb-6 overflow-hidden p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--pk-accent)/15 text-xs text-(--pk-accent)">
                <QrCode size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">
                  {payment.status === "awaiting_verification"
                    ? "Menunggu verifikasi admin"
                    : "Scan QRIS untuk bayar"}
                </h2>
                <p className="mt-1 text-sm text-(--pk-text-dim)">
                  {payment.status === "awaiting_verification"
                    ? "Terima kasih. Admin akan segera verifikasi pembayaran kamu."
                    : payment.instructions}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 border-t border-(--pk-line) pt-5 lg:grid-cols-[280px_1fr]">
              <div className="mx-auto w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => setQrisZoomOpen(true)}
                  className="group relative block w-full overflow-hidden rounded-xl border-2 border-(--pk-accent)/30 bg-white p-3 transition-all hover:border-(--pk-accent)/60"
                >
                  {payment.qris_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={payment.qris_url}
                      alt="QRIS GoPay"
                      className="aspect-square w-full object-contain"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-xs text-neutral-500">
                      QRIS tidak tersedia
                    </div>
                  )}

                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <ZoomIn size={11} />
                    Klik untuk zoom
                  </span>
                </button>

                <p className="mt-2 text-center text-[11px] text-(--pk-text-mute)">
                  {payment.merchant_name ?? "PakaiKuota"}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-(--pk-text-mute)">
                    Nominal
                  </p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-(--pk-accent)">
                    {rupiah(payment.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-(--pk-text-mute)">
                    Order ID
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="truncate font-mono text-sm">
                      {payment.order_id}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(payment.order_id, "order")}
                      className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                        copied === "order"
                          ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                          : "border-(--pk-line-2) text-(--pk-text-mute) hover:text-(--pk-accent)"
                      }`}
                    >
                      {copied === "order" ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-3 text-[11px] leading-5 text-[#fcd34d]">
                  <strong>Catatan:</strong> Saldo akan masuk setelah admin
                  verifikasi pembayaran. Jangan refresh halaman ini sampai
                  verifikasi selesai.
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  {payment.status === "pending" ? (
                    <button
                      type="button"
                      onClick={claimPaid}
                      disabled={verifying}
                      className="pk-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm disabled:cursor-wait disabled:opacity-60"
                    >
                      {verifying ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      {verifying ? "Mengirim..." : "Saya Sudah Bayar"}
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-[#34d399]/30 bg-[#34d399]/10 px-4 py-3 text-sm text-[#6ee7b7]">
                      <ShieldCheck size={14} />
                      Menunggu verifikasi admin
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void loadTransactions()}
                    className="pk-btn-ghost inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-medium"
                  >
                    <RefreshCw size={13} />
                    Cek status
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {payment && provider === "gopay_qris" && (
          <section className="pk-panel pk-inview mb-6 p-4 sm:p-5">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#25D366]/40 bg-[#25D366]/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-[#6ee7b7]"
                  >
                    <path d="M12 2a9.9 9.9 0 0 0-8.54 14.9L2 22l5.27-1.38A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.3-.18-3.13.82.84-3.05-.2-.31A8 8 0 1 1 12 20Zm4.38-5.97c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.17-.7-.62-1.17-1.38-1.31-1.62-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-(--pk-text)">
                    Sudah bayar? Konfirmasi ke admin
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-(--pk-text-dim)">
                    Klik tombol ini untuk kirim konfirmasi ke admin via
                    WhatsApp. Lampirkan bukti transfer di chat agar
                    verifikasi lebih cepat.
                  </p>
                </div>
              </div>

              <a
                href={buildPaidConfirmationWhatsAppUrl(
                  payment.order_id,
                  payment.amount,
                  payment.merchant_name
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M12 2a9.9 9.9 0 0 0-8.54 14.9L2 22l5.27-1.38A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.3-.18-3.13.82.84-3.05-.2-.31A8 8 0 1 1 12 20Zm4.38-5.97c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.17-.7-.62-1.17-1.38-1.31-1.62-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
                </svg>
                Konfirmasi ke Admin
              </a>
            </div>
          </section>
        )}

        {payment && provider === "pakasir" && payment.payment_url && (
          <section className="pk-panel pk-featured mb-8 p-5 sm:p-6">
            <h2 className="text-base font-semibold">Pembayaran Pakasir</h2>
            <p className="mt-1 text-sm text-(--pk-text-dim)">
              Selesaikan pembayaran di halaman Pakasir.
            </p>
            <a
              href={payment.payment_url}
              target="_blank"
              rel="noreferrer"
              className="pk-btn-primary mt-4 inline-flex min-h-11 items-center justify-center px-5 text-sm"
            >
              Buka halaman Pakasir →
            </a>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Buat pembayaran</h2>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Pilih nominal lalu lanjutkan.
              </p>
            </div>

            <form
              onSubmit={submit}
              className="mt-6 flex flex-1 flex-col gap-6"
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  {TOPUP_PACKAGES.map((pkg) => {
                    const active = selectedPackage === pkg.id
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => pickPackage(pkg.id, pkg.amount)}
                        className={`min-h-9 rounded-lg border px-3 text-xs font-medium transition-all ${
                          active
                            ? "border-(--pk-accent)/50 bg-linear-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                            : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim) hover:border-(--pk-accent)/40 hover:text-(--pk-accent)"
                        }`}
                      >
                        {pkg.name} · {rupiah(pkg.amount)}
                      </button>
                    )
                  })}
                </div>

                <label className="mt-5 block text-sm font-medium">
                  Nominal
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-(--pk-text-mute)">
                      Rp
                    </span>
                    <input
                      required
                      min={TOPUP_MIN}
                      max={TOPUP_MAX}
                      step={TOPUP_STEP}
                      type="number"
                      value={amount}
                      onChange={(e) => onCustomAmount(Number(e.target.value))}
                      className="min-h-12 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-3 font-mono text-lg text-(--pk-text) outline-none transition-colors focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
                    />
                  </div>
                  <span className="mt-2 block text-xs text-(--pk-text-mute)">
                    Minimal {rupiah(TOPUP_MIN)} · Maksimal {rupiah(TOPUP_MAX)}
                  </span>
                </label>
              </div>

              {message && (
                <p
                  role="status"
                  className="rounded-lg border border-(--pk-accent)/30 bg-(--pk-accent)/10 px-4 py-3 text-sm text-(--pk-accent)"
                >
                  {message}
                </p>
              )}

              <div className="mt-auto border-t border-(--pk-line) pt-5">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-(--pk-text-mute)">Total dibayar</span>
                  <span className="font-mono text-lg font-semibold text-(--pk-accent)">
                    {rupiah(Number.isFinite(amount) ? amount : 0)}
                  </span>
                </div>
                <button
                  disabled={submitting}
                  className="pk-btn-primary inline-flex min-h-12 w-full items-center justify-center px-5 text-sm disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Membuat pembayaran...
                    </>
                  ) : (
                    "Lanjutkan pembayaran"
                  )}
                </button>
              </div>
            </form>
          </section>

          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Pembayaran aktif</h2>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Detail muncul setelah form berhasil diproses.
              </p>
            </div>

            {payment ? (
              <div className="mt-6 flex flex-1 flex-col justify-between gap-6 border-t border-(--pk-line) pt-6">
                <dl className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-(--pk-text-mute)">Order ID</dt>
                    <dd className="max-w-[16rem] truncate text-right font-mono">
                      {payment.order_id}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-(--pk-text-mute)">Provider</dt>
                    <dd className="text-right font-mono">
                      {provider === "gopay_qris" ? "GoPay QRIS" : "Pakasir"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-(--pk-line) pt-4">
                    <dt className="text-(--pk-text-mute)">Total</dt>
                    <dd className="font-mono text-lg font-semibold text-(--pk-accent)">
                      {rupiah(payment.amount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-(--pk-text-mute)">Status</dt>
                    <dd className="text-right">
                      <StatusBadge status={payment.status} />
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="mt-6 flex flex-1 flex-col items-center justify-center border-t border-(--pk-line) py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)">
                  <QrCode size={20} />
                </span>
                <p className="mt-4 text-sm font-medium">
                  Belum ada pembayaran aktif.
                </p>
                <p className="mt-1 max-w-xs text-xs text-(--pk-text-mute)">
                  Buat pembayaran dari form di samping.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">
                Riwayat transaksi
              </h2>
              <p className="mt-1 text-sm text-(--pk-text-dim)">
                Status berasal dari transaksi akun kamu.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-(--pk-text-mute)">
              <span>{stats.total} transaksi</span>
              {stats.pending > 0 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-(--pk-line-2)" />
                  <span className="text-(--pk-accent)">
                    {stats.pending} menunggu
                  </span>
                </>
              )}
              <span className="h-1 w-1 rounded-full bg-(--pk-line-2)" />
              <span className="text-[#6ee7b7]">
                {rupiah(stats.credited)} masuk
              </span>
            </div>
          </div>

          <div className="pk-panel pk-inview mt-4 overflow-hidden">
            {state === "loading" && (
              <p className="p-6 text-sm text-(--pk-text-dim)">
                Memuat transaksi...
              </p>
            )}

            {state === "error" && (
              <p role="alert" className="p-6 text-sm text-[#fca5a5]">
                Riwayat transaksi tidak bisa dimuat.
              </p>
            )}

            {state === "ready" && transactions.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-semibold">Belum ada transaksi.</p>
                <p className="mt-2 text-sm text-(--pk-text-dim)">
                  Buat pembayaran pertama kamu dari form di atas.
                </p>
              </div>
            )}

            {state === "ready" && transactions.length > 0 && (
              <div className="pk-scroll overflow-x-auto">
                <table className="w-full min-w-3xl text-left text-sm">
                  <thead className="border-b border-(--pk-line) text-(--pk-text-mute)">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Order ID
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Nominal
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-(--pk-line) transition-colors last:border-0 hover:bg-white/2"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-(--pk-text-dim)">
                          {item.order_id}
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-(--pk-text)">
                          {rupiah(Number(item.amount_rupiah))}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4 text-xs text-(--pk-text-mute)">
                          {new Date(item.created_at).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-(--pk-text-mute)">
            Butuh bantuan?{" "}
            <Link
              href="/dashboard"
              className="text-(--pk-accent) hover:underline"
            >
              Kembali ke ringkasan
            </Link>
          </p>
        </section>
      </div>

      {qrisZoomOpen && payment?.qris_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QRIS Zoom"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={() => setQrisZoomOpen(false)}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg"
          >
            <button
              type="button"
              onClick={() => setQrisZoomOpen(false)}
              aria-label="Tutup"
              className="absolute -top-12 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <X size={18} />
            </button>

            <div className="rounded-2xl bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.qris_url}
                alt="QRIS GoPay"
                className="aspect-square w-full object-contain"
              />

              <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Order ID</span>
                  <span className="font-mono text-xs font-medium text-neutral-900">
                    {payment.order_id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Nominal</span>
                  <span className="font-mono text-lg font-semibold text-neutral-900">
                    {rupiah(payment.amount)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href={payment.qris_url}
                  download={`QRIS-${payment.order_id}.jpeg`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
                >
                  <Download size={14} />
                  Download QRIS
                </a>
                <button
                  type="button"
                  onClick={() => setQrisZoomOpen(false)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { color: string; dot: string; label: string; icon?: React.ReactNode }
  > = {
    credited: {
      color: "text-[#6ee7b7]",
      dot: "bg-[#34d399]",
      label: statusLabel.credited,
    },
    success: {
      color: "text-[#6ee7b7]",
      dot: "bg-[#34d399]",
      label: statusLabel.success,
    },
    paid: {
      color: "text-[#6ee7b7]",
      dot: "bg-[#34d399]",
      label: statusLabel.paid,
    },
    pending: {
      color: "text-(--pk-accent)",
      dot: "bg-(--pk-accent)",
      label: statusLabel.pending,
    },
    awaiting_verification: {
      color: "text-[#fcd34d]",
      dot: "bg-[#fbbf24]",
      label: statusLabel.awaiting_verification,
      icon: <Clock size={11} />,
    },
    expired: {
      color: "text-[#fca5a5]",
      dot: "bg-[#f87171]",
      label: statusLabel.expired,
    },
    failed: {
      color: "text-[#fca5a5]",
      dot: "bg-[#f87171]",
      label: statusLabel.failed,
    },
  }

  const cfg = map[status] ?? {
    color: "text-(--pk-text-dim)",
    dot: "bg-(--pk-line-2)",
    label: status,
  }

  return (
    <span className={`inline-flex items-center gap-2 text-sm ${cfg.color}`}>
      {cfg.icon ?? <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  )
}