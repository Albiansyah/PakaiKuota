"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"
import {
  TOPUP_PACKAGES,
  formatRupiah,
  formatUsd,
} from "@/lib/pricing-config"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react"

type Model = {
  id: string
  slug: string
  name: string
  group_name: string
  tier: string
  input_price_per_1k: number
  output_price_per_1k: number
  input_price_per_1m_usd: number
  output_price_per_1m_usd: number
}

export default function PricingPage() {
  const { t } = useLanguage()
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    fetch("/api/catalog")
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((data) => {
        if (!active) return
        setModels(data.models ?? [])
      })
      .catch(() => {
        if (!active) return
        setModels([])
        setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const groupedModels = useMemo(() => {
    return models.reduce<Record<string, Model[]>>((groups, model) => {
      const key = model.group_name || "Lainnya"
      ;(groups[key] ??= []).push(model)
      return groups
    }, {})
  }, [models])

  async function copyModel(slug: string) {
    try {
      await navigator.clipboard.writeText(slug)
      setCopied(slug)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
      </div>

      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-12 backdrop-blur-sm sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
          >
            <ArrowLeft size={13} />
            Kembali ke halaman utama
          </Link>

          <div className="mt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
              Saldo & harga
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Bayar sesuai pemakaian.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-(--pk-text-dim)">
              Beli saldo dalam Rupiah, pakai untuk GPT, Claude, dan GLM. Biaya
              dipotong otomatis dari saldo sesuai pemakaian token aktual.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <section className="pk-panel pk-inview mb-14 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-(--pk-accent)/30 bg-(--pk-accent)/10">
                <Wallet size={22} className="text-(--pk-accent)" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">
                  {t("pricing.payg")}
                </h3>
                <p className="mt-1 max-w-lg text-sm leading-6 text-(--pk-text-dim)">
                  {t("pricing.payg.desc")}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/topup"
              className="pk-btn-primary inline-flex min-h-11 items-center gap-2 px-5 text-sm"
            >
              {t("topup.title")}
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
              Top up saldo
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Pilih nominal saldo kamu.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-(--pk-text-dim)">
              Semua saldo dalam Rupiah. Bisa dipakai untuk semua model yang
              tersedia. Biaya per request dipotong sesuai pemakaian aktual.
            </p>
          </div>

          <div className="grid items-stretch gap-5 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOPUP_PACKAGES.map((pkg) => {
              const totalSaldo = pkg.amount + pkg.bonus

              return (
                <article
                  key={pkg.id}
                  className={`pk-panel relative flex h-full flex-col p-6 ${
                    pkg.featured ? "pk-featured" : ""
                  }`}
                >
                  {pkg.featured && (
                    <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-(--pk-accent)/40 bg-(--pk-accent)/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-(--pk-accent)">
                      <Sparkles size={10} />
                      Populer
                    </span>
                  )}

                  <h3 className="text-sm font-semibold uppercase tracking-widest text-(--pk-text-dim)">
                    {pkg.name}
                  </h3>

                  <div className="mt-4">
                    <p className="font-mono text-3xl font-semibold tracking-[-0.02em] text-(--pk-text)">
                      {formatRupiah(pkg.amount)}
                    </p>
                    {pkg.bonus > 0 && (
                      <p className="mt-1 text-xs text-[#6ee7b7]">
                        + Bonus {formatRupiah(pkg.bonus)}
                      </p>
                    )}
                  </div>

                  <p className="mt-4 min-h-10 text-sm leading-6 text-(--pk-text-dim)">
                    {pkg.detail}
                  </p>

                  <ul className="mt-5 space-y-2.5 text-sm">
                    <li className="flex items-start gap-2.5">
                      <Check
                        size={14}
                        className="mt-0.5 shrink-0 text-[#6ee7b7]"
                      />
                      <span className="text-(--pk-text-dim)">
                        Saldo {formatRupiah(totalSaldo)}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check
                        size={14}
                        className="mt-0.5 shrink-0 text-[#6ee7b7]"
                      />
                      <span className="text-(--pk-text-dim)">
                        Akses GPT, Claude, GLM
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check
                        size={14}
                        className="mt-0.5 shrink-0 text-[#6ee7b7]"
                      />
                      <span className="text-(--pk-text-dim)">
                        Bayar per pemakaian
                      </span>
                    </li>
                  </ul>

                  <div className="mt-auto pt-6">
                    <Link
                      href={`/dashboard/topup?package=${pkg.id}`}
                      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold ${
                        pkg.featured ? "pk-btn-primary" : "pk-btn-ghost"
                      }`}
                    >
                      Top Up Sekarang
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
              Katalog model
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Harga per 1 juta token.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-(--pk-text-dim)">
              Harga model dipatok dalam USD sesuai provider. Biaya dikonversi
              ke Rupiah dan dipotong dari saldo saat request diproses. Salin
              slug untuk dipakai di API.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2
                size={24}
                className="animate-spin text-(--pk-text-mute)"
              />
            </div>
          ) : error || Object.keys(groupedModels).length === 0 ? (
            <div className="pk-panel p-12 text-center">
              <p className="font-semibold">
                {error ? "Gagal memuat model" : "Belum ada model aktif"}
              </p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                {error
                  ? "Coba muat ulang halaman beberapa saat lagi."
                  : "Model akan tampil di sini setelah admin mengaktifkannya."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedModels).map(([group, items]) => (
                <section
                  key={group}
                  className="pk-panel pk-inview p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-(--pk-text)">
                      {group}
                    </h3>
                    <span className="font-mono text-[11px] text-(--pk-text-mute)">
                      {items.length} model
                    </span>
                  </div>

                  <ul className="mt-4 divide-y divide-(--pk-line)">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-(--pk-text)">
                            {item.name}
                          </p>
                          <code className="mt-0.5 block truncate font-mono text-[11px] text-(--pk-text-mute)">
                            {item.slug}
                          </code>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-(--pk-text-mute)">
                            <span>
                              in:{" "}
                              <span className="text-(--pk-text-dim)">
                                {formatUsd(item.input_price_per_1m_usd)}/1M
                              </span>
                            </span>
                            <span className="text-(--pk-line-2)">·</span>
                            <span>
                              out:{" "}
                              <span className="text-(--pk-text-dim)">
                                {formatUsd(item.output_price_per_1m_usd)}/1M
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.tier && (
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                                item.tier === "premium"
                                  ? "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)"
                                  : item.tier === "ultra"
                                    ? "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd]"
                                    : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
                              }`}
                            >
                              {item.tier}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => void copyModel(item.slug)}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-(--pk-line-2) bg-[#0b1626] px-2.5 text-[11px] font-medium text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent)"
                          >
                            {copied === item.slug ? (
                              <>
                                <Check size={12} />
                                Tersalin
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                Salin
                              </>
                            )}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>

        <section className="pk-panel pk-inview relative overflow-hidden p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(240,169,59,0.15),transparent)]"
          />

          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10">
                <Wallet size={22} className="text-(--pk-accent)" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                  Custom saldo
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
                  Butuh nominal saldo di luar pilihan di atas?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-(--pk-text-dim)">
                  Atur nominal top up sendiri langsung dari dashboard. Saldo
                  dalam Rupiah, bisa dipakai untuk semua model yang tersedia.
                </p>

                <ul className="mt-4 grid gap-2 text-sm text-(--pk-text-dim) sm:grid-cols-2">
                  <li className="flex items-start gap-2">
                    <Check
                      size={14}
                      className="mt-0.5 shrink-0 text-[#6ee7b7]"
                    />
                    <span>
                      Nominal{" "}
                      <strong className="text-(--pk-text)">fleksibel</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      size={14}
                      className="mt-0.5 shrink-0 text-[#6ee7b7]"
                    />
                    <span>
                      Bayar via{" "}
                      <strong className="text-(--pk-text)">QRIS</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      size={14}
                      className="mt-0.5 shrink-0 text-[#6ee7b7]"
                    />
                    <span>
                      Akses{" "}
                      <strong className="text-(--pk-text)">
                        GPT, Claude, GLM
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      size={14}
                      className="mt-0.5 shrink-0 text-[#6ee7b7]"
                    />
                    <span>
                      Biaya{" "}
                      <strong className="text-(--pk-text)">
                        per pemakaian
                      </strong>
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row lg:flex-col">
              <Link
                href="/dashboard/topup"
                className="pk-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm"
              >
                <Wallet size={14} />
                Top Up di Dashboard
              </Link>
              <Link
                href="/docs"
                className="pk-btn-ghost inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-medium"
              >
                Baca dokumentasi
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            href="/"
            className="pk-btn-ghost inline-flex min-h-11 items-center justify-center gap-2 px-6 text-sm font-medium"
          >
            <ArrowLeft size={14} />
            Kembali ke halaman utama
          </Link>
        </div>
      </div>
    </div>
  )
}