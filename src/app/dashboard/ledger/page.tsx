"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  Gift,
  RotateCcw,
  Search,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

type Entry = {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  description: string | null;
  created_at: string;
};

const types = [
  { value: "all", label: "Semua" },
  { value: "topup", label: "Topup" },
  { value: "usage", label: "Pemakaian" },
  { value: "refund", label: "Refund" },
  { value: "hold_release", label: "Pelepasan hold" },
  { value: "bonus", label: "Bonus" },
];

const labels: Record<string, string> = {
  topup: "Topup",
  usage: "Pemakaian API",
  refund: "Refund",
  hold_release: "Pelepasan hold",
  bonus: "Bonus",
  admin_adjustment: "Penyesuaian admin",
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function signedRupiah(value: number) {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${rupiah(Math.abs(value))}`;
}

const typeStyles: Record<
  string,
  { icon: typeof WalletCards; color: string; bg: string; border: string }
> = {
  topup: {
    icon: ArrowDownLeft,
    color: "text-[#6ee7b7]",
    bg: "bg-[#34d399]/10",
    border: "border-[#34d399]/30",
  },
  usage: {
    icon: ArrowUpRight,
    color: "text-[color:var(--pk-accent)]",
    bg: "bg-[color:var(--pk-accent)]/10",
    border: "border-[color:var(--pk-accent)]/30",
  },
  refund: {
    icon: RotateCcw,
    color: "text-[#60a5fa]",
    bg: "bg-[#60a5fa]/10",
    border: "border-[#60a5fa]/30",
  },
  hold_release: {
    icon: RotateCcw,
    color: "text-[#a78bfa]",
    bg: "bg-[#a78bfa]/10",
    border: "border-[#a78bfa]/30",
  },
  bonus: {
    icon: Gift,
    color: "text-[#f472b6]",
    bg: "bg-[#f472b6]/10",
    border: "border-[#f472b6]/30",
  },
  admin_adjustment: {
    icon: Sparkles,
    color: "text-[color:var(--pk-text-dim)]",
    bg: "bg-white/5",
    border: "border-[color:var(--pk-line-2)]",
  },
};

export default function LedgerPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/ledger")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setState("error");
          return;
        }
        const data = (await response.json()) as { entries: Entry[] };
        if (active) {
          setEntries(data.entries);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const inflow = entries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
    const outflow = entries
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount ?? 0)), 0);
    const latestBalance =
      entries.length > 0 ? entries[0].balance_after : 0;
    return {
      total: entries.length,
      inflow,
      outflow,
      latestBalance,
    };
  }, [entries]);

  const filtered = useMemo(() => {
    let list =
      filter === "all"
        ? entries
        : entries.filter((entry) => entry.type === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((entry) => {
        const desc = (entry.description ?? "").toLowerCase();
        return desc.includes(q);
      });
    }
    return list;
  }, [entries, filter, query]);

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <header className="border-b border-[color:var(--pk-line)] bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Keuangan
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Mutasi saldo
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Setiap perubahan saldo tercatat dengan saldo sebelum dan sesudah
            mutasi.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* ============ STATS ============ */}
        {state === "ready" && stats.total > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                Saldo terakhir
              </p>
              <p className="mt-3 font-mono text-2xl text-[color:var(--pk-accent)]">
                {rupiah(stats.latestBalance)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Dari {stats.total} mutasi tercatat
              </p>
            </div>
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                Total masuk
              </p>
              <p className="mt-3 font-mono text-2xl text-[#6ee7b7]">
                {rupiah(stats.inflow)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Topup, refund, bonus
              </p>
            </div>
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                Total keluar
              </p>
              <p className="mt-3 font-mono text-2xl text-[#fca5a5]">
                {rupiah(stats.outflow)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Pemakaian API
              </p>
            </div>
          </section>
        )}

        {/* ============ FILTER BAR ============ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter jenis mutasi"
            className="pk-scroll flex flex-wrap gap-1.5 overflow-x-auto rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] p-1"
          >
            {types.map((item) => {
              const active = filter === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  aria-pressed={active}
                  className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                      : "text-[color:var(--pk-text-dim)] hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <Link
            href="/dashboard/topup"
            className="pk-btn-primary inline-flex min-h-11 items-center justify-center px-5 text-sm"
          >
            Beli kuota
          </Link>
        </div>

        {/* ============ SEARCH ============ */}
        {state === "ready" && entries.length > 0 && (
          <div className="relative mt-4">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--pk-text-mute)]"
            >
              <Search size={15} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari keterangan mutasi..."
              className="min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] pl-10 pr-12 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[color:var(--pk-text-mute)] transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* ============ TABLE ============ */}
        <div className="pk-panel pk-inview mt-4 overflow-hidden">
          {state === "loading" && (
            <p className="p-8 text-sm text-[color:var(--pk-text-dim)]">
              Memuat mutasi saldo...
            </p>
          )}

          {state === "error" && (
            <p role="alert" className="p-8 text-sm text-[#fca5a5]">
              Mutasi saldo tidak bisa dimuat.
            </p>
          )}

          {state === "ready" && filtered.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-semibold">
                {entries.length === 0
                  ? "Belum ada mutasi saldo."
                  : "Tidak ada mutasi yang cocok."}
              </p>
              <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                {entries.length === 0
                  ? "Mutasi akan muncul setelah ada topup atau pemakaian API."
                  : "Coba ubah kata kunci atau filter jenis mutasi."}
              </p>
              {entries.length === 0 && (
                <Link
                  href="/dashboard/topup"
                  className="pk-btn-primary mt-5 inline-flex min-h-10 items-center justify-center px-4 text-sm"
                >
                  Beli kuota
                </Link>
              )}
              {entries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                  className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
                >
                  Reset filter
                </button>
              )}
            </div>
          )}

          {state === "ready" && filtered.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="pk-scroll hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[62rem] text-left text-sm">
                  <thead className="border-b border-[color:var(--pk-line)] text-[color:var(--pk-text-mute)]">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Waktu
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Jenis
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Keterangan
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Perubahan
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Sebelum
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Sesudah
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-[color:var(--pk-line)] transition-colors last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[color:var(--pk-text-mute)]">
                          <DateCell iso={entry.created_at} />
                        </td>
                        <td className="px-5 py-4">
                          <TypeBadge type={entry.type} />
                        </td>
                        <td className="max-w-[20rem] px-5 py-4 text-[color:var(--pk-text-dim)]">
                          {entry.description ?? (
                            <span className="text-[color:var(--pk-text-mute)]">
                              Tidak ada keterangan
                            </span>
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right font-mono font-medium ${
                            entry.amount >= 0
                              ? "text-[#6ee7b7]"
                              : "text-[#fca5a5]"
                          }`}
                        >
                          {signedRupiah(Number(entry.amount))}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-[color:var(--pk-text-mute)]">
                          {rupiah(Number(entry.balance_before))}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-semibold text-[color:var(--pk-text)]">
                          {rupiah(Number(entry.balance_after))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-[color:var(--pk-line)] lg:hidden">
                {filtered.map((entry) => (
                  <li key={entry.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <TypeBadge type={entry.type} />
                      <span
                        className={`font-mono text-sm font-medium ${
                          entry.amount >= 0
                            ? "text-[#6ee7b7]"
                            : "text-[#fca5a5]"
                        }`}
                      >
                        {signedRupiah(Number(entry.amount))}
                      </span>
                    </div>

                    {entry.description && (
                      <p className="mt-3 text-sm text-[color:var(--pk-text-dim)]">
                        {entry.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--pk-text-mute)]">
                      <DateCell iso={entry.created_at} compact />
                      <span className="font-mono">
                        {rupiah(Number(entry.balance_after))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[color:var(--pk-line)] px-5 py-3 text-xs text-[color:var(--pk-text-mute)]">
                Menampilkan {filtered.length} dari {entries.length} mutasi
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const style = typeStyles[type] ?? {
    icon: WalletCards,
    color: "text-[color:var(--pk-text-dim)]",
    bg: "bg-white/5",
    border: "border-[color:var(--pk-line-2)]",
  };
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${style.color} ${style.bg} ${style.border}`}
    >
      <Icon size={11} />
      {labels[type] ?? type}
    </span>
  );
}

function DateCell({ iso, compact = false }: { iso: string; compact?: boolean }) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (compact) {
    return (
      <span>
        {date} · {time}
      </span>
    );
  }
  return (
    <div>
      <div>{date}</div>
      <div className="text-[10px] opacity-70">{time}</div>
    </div>
  );
}