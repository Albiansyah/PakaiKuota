"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

type Transaction = {
  id: string;
  order_id: string;
  amount_rupiah: number;
  status: string;
  created_at: string;
  paid_at?: string;
};

const statusLabels: Record<string, string> = {
  success: "Berhasil",
  paid: "Dibayar",
  credited: "Saldo masuk",
  pending: "Menunggu",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  refunded: "Direfund",
};

const filters = [
  { value: "all", label: "Semua" },
  { value: "success", label: "Berhasil" },
  { value: "pending", label: "Menunggu" },
  { value: "failed", label: "Gagal" },
  { value: "refunded", label: "Direfund" },
];

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HistoryPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(false);
    try {
      const res = await fetch("/api/transactions", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { transactions?: Transaction[] };
      setTxns(data.transactions ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTransactions();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  const stats = useMemo(() => {
    const success = txns.filter(
      (t) => t.status === "success" || t.status === "credited"
    );
    const pending = txns.filter((t) => t.status === "pending");
    return {
      total: txns.length,
      successAmount: success.reduce(
        (sum, t) => sum + Number(t.amount_rupiah ?? 0),
        0
      ),
      successCount: success.length,
      pendingCount: pending.length,
    };
  }, [txns]);

  const filtered = useMemo(() => {
    let list =
      filter === "all"
        ? txns
        : txns.filter((t) => {
            if (filter === "success")
              return t.status === "success" || t.status === "credited";
            return t.status === filter;
          });
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => t.order_id.toLowerCase().includes(q));
    }
    return list;
  }, [txns, filter, query]);

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
            Keuangan
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Riwayat transaksi
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-(--pk-text-dim)">
            Riwayat top-up saldo dan pengajuan refund dari akun kamu.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {!loading && !error && stats.total > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                Total transaksi
              </p>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                {stats.pendingCount} menunggu
              </p>
            </div>
            <div className="pk-panel pk-inview p-5 sm:col-span-2">
              <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                Total saldo masuk
              </p>
              <p className="mt-3 font-mono text-2xl text-(--pk-accent)">
                {rupiah(stats.successAmount)}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Dari {stats.successCount} transaksi berhasil
              </p>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter status"
            className="pk-scroll flex flex-wrap gap-1.5 overflow-x-auto rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
          >
            {filters.map((item) => {
              const active = filter === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  aria-pressed={active}
                  className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all ${
                    active
                      ? "bg-linear-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                      : "text-(--pk-text-dim) hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void fetchTransactions(true)}
            disabled={refreshing}
            aria-label="Muat ulang"
            className="pk-btn-ghost inline-flex min-h-10 items-center gap-2 px-4 text-sm font-medium disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Memuat..." : "Muat ulang"}
          </button>
        </div>

        {!loading && !error && txns.length > 0 && (
          <div className="relative mt-4">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
            >
              <Search size={15} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Order ID..."
              className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-12 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-(--pk-text-mute) transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <div className="pk-panel pk-inview mt-4 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={24}
                className="animate-spin text-(--pk-text-mute)"
              />
            </div>
          )}

          {!loading && error && (
            <div className="p-8 text-center">
              <p className="text-sm text-[#fca5a5]">
                Riwayat transaksi tidak bisa dimuat.
              </p>
              <button
                type="button"
                onClick={() => void fetchTransactions()}
                className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!loading && !error && txns.length === 0 && (
            <div className="p-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)">
                <FileText size={22} />
              </span>
              <p className="mt-5 font-semibold">Belum ada transaksi</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Transaksi top-up kamu akan muncul di sini setelah dibuat.
              </p>
            </div>
          )}

          {!loading && !error && txns.length > 0 && filtered.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-semibold">Tidak ada transaksi yang cocok.</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Coba ubah kata kunci atau filter status.
              </p>
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
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              <div className="pk-scroll overflow-x-auto">
                <table className="w-full min-w-208 text-left text-sm">
                  <thead className="border-b border-(--pk-line) text-(--pk-text-mute)">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Tanggal
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Order ID
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Nominal
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((txn) => {
                      const d = new Date(txn.created_at);
                      const canRefund =
                        txn.status === "success" || txn.status === "credited";
                      return (
                        <tr
                          key={txn.id}
                          className="border-b border-(--pk-line) transition-colors last:border-0 hover:bg-white/2"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-(--pk-text-mute)">
                            <div>
                              {d.toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[10px] opacity-70">
                              {d.toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <code className="truncate font-mono text-xs text-(--pk-text-dim)">
                                {query ? (
                                  <Highlight
                                    text={txn.order_id}
                                    query={query}
                                  />
                                ) : (
                                  txn.order_id
                                )}
                              </code>
                              <button
                                type="button"
                                onClick={() =>
                                  copy(txn.order_id, `order-${txn.id}`)
                                }
                                aria-label="Salin Order ID"
                                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                  copied === `order-${txn.id}`
                                    ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                                    : "border-transparent text-(--pk-text-mute) hover:border-(--pk-line-2) hover:text-(--pk-accent)"
                                }`}
                              >
                                {copied === `order-${txn.id}` ? (
                                  <Check size={11} />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-(--pk-text)">
                            {rupiah(Number(txn.amount_rupiah))}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={txn.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            {canRefund ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="Lihat invoice"
                                  aria-label="Lihat invoice"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--pk-line-2) text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent)"
                                >
                                  <FileText size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRefundTarget(txn)}
                                  className="inline-flex min-h-9 items-center rounded-lg border border-[#f87171]/30 px-3 text-xs font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/10"
                                >
                                  Refund
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-(--pk-text-mute)">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-(--pk-line) px-5 py-3 text-xs text-(--pk-text-mute)">
                Menampilkan {filtered.length} dari {txns.length} transaksi
              </div>
            </>
          )}
        </div>
      </div>

      {refundTarget && (
        <RefundModal
          transaction={refundTarget}
          onClose={() => setRefundTarget(null)}
          onSuccess={() => {
            setRefundTarget(null);
            void fetchTransactions(true);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; dot: string }> = {
    success: { color: "text-[#6ee7b7]", dot: "bg-[#34d399]" },
    credited: { color: "text-[#6ee7b7]", dot: "bg-[#34d399]" },
    paid: { color: "text-[#6ee7b7]", dot: "bg-[#34d399]" },
    pending: {
      color: "text-(--pk-accent)",
      dot: "bg-(--pk-accent)",
    },
    refunded: { color: "text-[#60a5fa]", dot: "bg-[#60a5fa]" },
    expired: { color: "text-[#fca5a5]", dot: "bg-[#f87171]" },
    failed: { color: "text-[#fca5a5]", dot: "bg-[#f87171]" },
  };
  const cfg = map[status] ?? {
    color: "text-(--pk-text-dim)",
    dot: "bg-(--pk-line-2)",
  };
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {statusLabels[status] ?? status}
    </span>
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
      <mark className="rounded bg-(--pk-accent)/25 px-0.5 text-(--pk-accent-2)">
        {match}
      </mark>
      {after}
    </>
  );
}

function RefundModal({
  transaction,
  onClose,
  onSuccess,
}: {
  transaction: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onEsc);
    };
  }, [loading, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Alasan wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          reason,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        setError(data?.error ?? "Gagal mengajukan refund.");
        return;
      }
      onSuccess();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={() => !loading && onClose()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="pk-panel pk-menu-in relative w-full max-w-md overflow-hidden p-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-accent)/30 bg-(--pk-accent)/10">
          <AlertTriangle size={20} className="text-(--pk-accent)" />
        </div>

        <h2
          id="refund-title"
          className="mt-4 text-lg font-semibold text-(--pk-text)"
        >
          Ajukan refund?
        </h2>
        <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
          Pengajuan akan ditinjau admin. Saldo tidak langsung berubah.
        </p>

        <dl className="mt-4 space-y-2 rounded-xl border border-(--pk-line) bg-[#0b1626]/60 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-(--pk-text-mute)">Order ID</dt>
            <dd className="truncate font-mono text-xs text-(--pk-text)">
              {transaction.order_id}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-(--pk-text-mute)">Nominal</dt>
            <dd className="font-mono text-(--pk-accent)">
              {rupiah(Number(transaction.amount_rupiah))}
            </dd>
          </div>
        </dl>

        <form onSubmit={submit} className="mt-4 space-y-4">
          {error && (
            <p className="rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-3 py-2 text-xs text-[#fca5a5]">
              {error}
            </p>
          )}

          <label className="block text-xs font-medium">
            Alasan refund
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ceritakan kenapa kamu mengajukan refund..."
              className="mt-1.5 w-full resize-none rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 py-2.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="pk-btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {loading ? "Mengirim..." : "Ajukan refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}