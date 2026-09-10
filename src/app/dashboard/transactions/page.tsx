"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Search,
  X,
} from "lucide-react";

type Transaction = {
  id: string;
  order_id: string;
  amount_rupiah: number;
  status: string;
  payment_method: string | null;
  payment_number: string | null;
  payment_fee: number | null;
  total_payment: number | null;
  expires_at: string | null;
  created_at: string;
};

const statuses = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "paid", label: "Dibayar" },
  { value: "credited", label: "Masuk" },
  { value: "expired", label: "Kedaluwarsa" },
  { value: "failed", label: "Gagal" },
];

const labels: Record<string, string> = {
  pending: "Menunggu pembayaran",
  paid: "Pembayaran diterima",
  credited: "Saldo masuk",
  expired: "Kedaluwarsa",
  failed: "Gagal",
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/transactions")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setState("error");
          return;
        }
        const data = (await response.json()) as {
          transactions: Transaction[];
        };
        if (active) {
          setTransactions(data.transactions);
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
    const credited = transactions.filter((t) => t.status === "credited");
    const pending = transactions.filter((t) => t.status === "pending");
    const failed = transactions.filter(
      (t) => t.status === "failed" || t.status === "expired"
    );
    return {
      total: transactions.length,
      creditedAmount: credited.reduce(
        (sum, t) => sum + Number(t.amount_rupiah ?? 0),
        0
      ),
      creditedCount: credited.length,
      pendingCount: pending.length,
      failedCount: failed.length,
    };
  }, [transactions]);

  const filtered = useMemo(() => {
    let list =
      filter === "all"
        ? transactions
        : transactions.filter((item) => item.status === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((item) =>
        item.order_id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, transactions, query]);

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
            Riwayat transaksi
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Pantau status pembayaran dan kapan saldo masuk ke akun kamu.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* ============ STATS ============ */}
        {state === "ready" && stats.total > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                Total transaksi
              </p>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                {stats.pendingCount} menunggu · {stats.failedCount} gagal
              </p>
            </div>
            <div className="pk-panel pk-inview p-5 sm:col-span-2">
              <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                Total saldo masuk
              </p>
              <p className="mt-3 font-mono text-2xl text-[color:var(--pk-accent)]">
                {rupiah(stats.creditedAmount)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Dari {stats.creditedCount} transaksi berhasil
              </p>
            </div>
          </section>
        )}

        {/* ============ FILTER BAR ============ */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="group"
            aria-label="Filter status transaksi"
            className="pk-scroll flex flex-wrap gap-1.5 overflow-x-auto rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] p-1"
          >
            {statuses.map((item) => {
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
            className="pk-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm"
          >
            Buat pembayaran
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* ============ SEARCH ============ */}
        {state === "ready" && transactions.length > 0 && (
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
              placeholder="Cari Order ID..."
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

        {/* ============ DETAIL PANEL ============ */}
        {selected && (
          <section
            aria-live="polite"
            className="pk-panel pk-featured pk-inview mt-6 overflow-hidden p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
                  Detail transaksi
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <h2 className="truncate font-mono text-base sm:text-lg">
                    {selected.order_id}
                  </h2>
                  <button
                    type="button"
                    onClick={() => copy(selected.order_id, "detail-order")}
                    aria-label="Salin Order ID"
                    className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2 text-[10px] font-medium transition-colors ${
                      copied === "detail-order"
                        ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                        : "border-[color:var(--pk-line-2)] text-[color:var(--pk-text-mute)] hover:text-[color:var(--pk-accent)]"
                    }`}
                  >
                    {copied === "detail-order" ? (
                      <Check size={11} />
                    ) : (
                      <Copy size={11} />
                    )}
                    {copied === "detail-order" ? "Tersalin" : "Salin"}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Tutup detail"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[color:var(--pk-text-mute)] transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-[color:var(--pk-line)] pt-6 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Nominal
                </dt>
                <dd className="mt-1.5 font-mono text-base text-[color:var(--pk-accent)]">
                  {rupiah(Number(selected.amount_rupiah))}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Metode
                </dt>
                <dd className="mt-1.5 font-mono text-sm text-[color:var(--pk-text)]">
                  {selected.payment_method ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Nomor pembayaran
                </dt>
                <dd className="mt-1.5 break-all font-mono text-sm text-[color:var(--pk-text)]">
                  {selected.payment_number ?? "—"}
                </dd>
              </div>
            </dl>

            {/* Progress steps */}
            <div className="mt-6 border-t border-[color:var(--pk-line)] pt-6">
              <p className="mb-4 text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                Progres
              </p>
              <ProgressSteps status={selected.status} />
            </div>

            {selected.status === "pending" && selected.expires_at && (
              <p className="mt-5 rounded-lg border border-[color:var(--pk-accent)]/30 bg-[color:var(--pk-accent)]/10 px-4 py-3 text-xs text-[color:var(--pk-accent-2)]">
                Bayar sebelum{" "}
                {new Date(selected.expires_at).toLocaleString("id-ID")}
              </p>
            )}
          </section>
        )}

        {/* ============ TABLE ============ */}
        <div className="pk-panel pk-inview mt-6 overflow-hidden">
          {state === "loading" && (
            <p className="p-8 text-sm text-[color:var(--pk-text-dim)]">
              Memuat riwayat transaksi...
            </p>
          )}

          {state === "error" && (
            <p role="alert" className="p-8 text-sm text-[#fca5a5]">
              Riwayat transaksi tidak bisa dimuat.
            </p>
          )}

          {state === "ready" && filtered.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-semibold">
                {transactions.length === 0
                  ? "Belum ada transaksi."
                  : "Tidak ada transaksi yang cocok."}
              </p>
              <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                {transactions.length === 0
                  ? "Buat pembayaran pertama kamu untuk mengisi saldo."
                  : "Coba ubah kata kunci atau filter status."}
              </p>
              {transactions.length === 0 && (
                <Link
                  href="/dashboard/topup"
                  className="pk-btn-primary mt-5 inline-flex min-h-10 items-center justify-center px-4 text-sm"
                >
                  Buat pembayaran
                </Link>
              )}
            </div>
          )}

          {state === "ready" && filtered.length > 0 && (
            <>
              <div className="pk-scroll overflow-x-auto">
                <table className="w-full min-w-[48rem] text-left text-sm">
                  <thead className="border-b border-[color:var(--pk-line)] text-[color:var(--pk-text-mute)]">
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
                        Dibuat
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const { date, time } = formatDate(item.created_at);
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-[color:var(--pk-line)] transition-colors last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4 font-mono text-[color:var(--pk-text-dim)]">
                            {query ? (
                              <Highlight text={item.order_id} query={query} />
                            ) : (
                              item.order_id
                            )}
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-[color:var(--pk-text)]">
                            {rupiah(Number(item.amount_rupiah))}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-5 py-4 text-xs text-[color:var(--pk-text-mute)]">
                            <div>{date}</div>
                            <div className="text-[10px] opacity-70">{time}</div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => setSelected(item)}
                              className="inline-flex min-h-9 items-center rounded-lg border border-[color:var(--pk-line-2)] px-3 text-xs font-medium text-[color:var(--pk-text-dim)] transition-colors hover:border-[color:var(--pk-accent)]/50 hover:text-[color:var(--pk-accent)]"
                            >
                              Lihat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[color:var(--pk-line)] px-5 py-3 text-xs text-[color:var(--pk-text-mute)]">
                Menampilkan {filtered.length} dari {transactions.length}{" "}
                transaksi
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; dot: string }> = {
    credited: { color: "text-[#6ee7b7]", dot: "bg-[#34d399]" },
    paid: { color: "text-[#6ee7b7]", dot: "bg-[#34d399]" },
    pending: {
      color: "text-[color:var(--pk-accent)]",
      dot: "bg-[color:var(--pk-accent)]",
    },
    expired: { color: "text-[#fca5a5]", dot: "bg-[#f87171]" },
    failed: { color: "text-[#fca5a5]", dot: "bg-[#f87171]" },
  };
  const cfg = map[status] ?? {
    color: "text-[color:var(--pk-text-dim)]",
    dot: "bg-[color:var(--pk-line-2)]",
  };
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {labels[status] ?? status}
    </span>
  );
}

function ProgressSteps({ status }: { status: string }) {
  const order = ["pending", "paid", "credited"];
  const current = order.indexOf(status);
  const isFailure = status === "expired" || status === "failed";

  const steps = [
    { id: "pending", label: "Pending" },
    { id: "paid", label: "Paid" },
    { id: "credited", label: "Credited" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((step, i) => {
        const idx = order.indexOf(step.id);
        const done = !isFailure && current >= idx;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                  done
                    ? "border-[#34d399] bg-[#34d399] text-[#0a1120] shadow-[0_0_16px_-4px_rgba(52,211,153,0.7)]"
                    : isFailure && idx === 0
                      ? "border-[#f87171] bg-[#f87171]/15 text-[#fca5a5]"
                      : "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-mute)]"
                }`}
              >
                {done ? <Check size={13} /> : i + 1}
              </span>
              <span
                className={`text-xs ${
                  done
                    ? "font-medium text-[color:var(--pk-text)]"
                    : "text-[color:var(--pk-text-mute)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`h-px w-6 transition-colors ${
                  !isFailure && current > idx
                    ? "bg-[#34d399]"
                    : "bg-[color:var(--pk-line-2)]"
                }`}
              />
            )}
          </div>
        );
      })}
      {isFailure && (
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-[#f87171]/30 bg-[#f87171]/10 px-2.5 py-1 text-[11px] font-medium text-[#fca5a5]">
          {status === "expired" ? "Kedaluwarsa" : "Gagal"}
        </span>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <mark className="rounded bg-[color:var(--pk-accent)]/25 px-0.5 text-[color:var(--pk-accent-2)]">
        {match}
      </mark>
      {after}
    </>
  );
}