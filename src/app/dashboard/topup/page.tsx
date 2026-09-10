"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Transaction = {
  id: string;
  order_id: string;
  amount_rupiah: number;
  status: string;
  payment_method: string | null;
  payment_number: string | null;
  total_payment: number | null;
  expires_at: string | null;
  created_at: string;
};

type Payment = {
  order_id: string;
  amount?: number;
  total_payment?: number;
  payment_method?: string;
  payment_number?: string;
  payment_url?: string;
  expired_at?: string;
};

const statusLabel: Record<string, string> = {
  pending: "Menunggu pembayaran",
  paid: "Pembayaran diterima",
  credited: "Saldo masuk",
  expired: "Kedaluwarsa",
  failed: "Gagal",
};

const presets = [10000, 25000, 50000, 100000, 250000, 500000];

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TopupPage() {
  const [amount, setAmount] = useState(10000);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const stats = useMemo(() => {
    const credited = transactions
      .filter((t) => t.status === "credited")
      .reduce((sum, t) => sum + Number(t.amount_rupiah ?? 0), 0);
    const pending = transactions.filter((t) => t.status === "pending").length;
    return { credited, pending, total: transactions.length };
  }, [transactions]);

  async function loadTransactions() {
    const response = await fetch("/api/transactions", { cache: "no-store" });
    if (!response.ok) throw new Error("Transaksi tidak bisa dimuat.");
    const data = (await response.json()) as { transactions: Transaction[] };
    setTransactions(data.transactions);
    setState("ready");
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      loadTransactions().catch(() => {
        if (active) setState("error");
      });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setPayment(null);
    try {
      const response = await fetch("/api/topups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount_rupiah: amount }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string; payment?: Payment }
        | null;
      if (!response.ok) {
        setMessage(data?.error ?? "Pembayaran tidak bisa dibuat.");
        return;
      }
      const created = data?.payment;
      setPayment(created ?? null);
      setMessage("Pembayaran dibuat. Selesaikan pembayaran sesuai detail di bawah.");
      if (created?.payment_url) {
        window.location.assign(created.payment_url);
      } else {
        setMessage("Payment URL Pakasir tidak tersedia.");
      }
    } catch {
      setMessage("Pembayaran tidak bisa dibuat. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

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
            Saldo
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Beli kuota
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Pilih nominal, pilih metode pembayaran, lalu selesaikan transaksi di
            Pakasir.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {payment && (
          <section
            aria-live="polite"
            className="pk-panel pk-featured pk-inview mb-8 overflow-hidden p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#34d399]/15 text-xs text-[#6ee7b7]">
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">
                  Pembayaran siap dilanjutkan
                </h2>
                <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
                  Selesaikan pembayaran sebelum kedaluwarsa.
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-4 border-t border-[color:var(--pk-line)] pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Order ID
                </dt>
                <dd className="mt-1.5 flex items-center gap-2">
                  <code className="truncate font-mono text-sm text-[color:var(--pk-text)]">
                    {payment.order_id}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(payment.order_id, "order")}
                    className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                      copied === "order"
                        ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                        : "border-[color:var(--pk-line-2)] text-[color:var(--pk-text-mute)] hover:text-[color:var(--pk-accent)]"
                    }`}
                  >
                    {copied === "order" ? "Tersalin" : "Salin"}
                  </button>
                </dd>
              </div>

              {payment.payment_number && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Nomor pembayaran
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-2">
                    <code className="truncate font-mono text-sm font-semibold text-[color:var(--pk-accent)]">
                      {payment.payment_number}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copy(payment.payment_number!, "number")
                      }
                      className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                        copied === "number"
                          ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                          : "border-[color:var(--pk-line-2)] text-[color:var(--pk-text-mute)] hover:text-[color:var(--pk-accent)]"
                      }`}
                    >
                      {copied === "number" ? "Tersalin" : "Salin"}
                    </button>
                  </dd>
                </div>
              )}
            </dl>

            {payment.payment_url && (
              <a
                href={payment.payment_url}
                target="_blank"
                rel="noreferrer"
                className="pk-btn-primary mt-5 inline-flex min-h-11 items-center justify-center px-5 text-sm"
              >
                Buka halaman pembayaran Pakasir →
              </a>
            )}
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Buat pembayaran</h2>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Pilih nominal lalu lanjutkan ke Pakasir.
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 flex flex-1 flex-col gap-6">
              <div>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => {
                    const active = amount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className={`min-h-9 rounded-lg border px-3 text-xs font-medium transition-all ${
                          active
                            ? "border-[color:var(--pk-accent)]/50 bg-gradient-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                            : "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-dim)] hover:border-[color:var(--pk-accent)]/40 hover:text-[color:var(--pk-accent)]"
                        }`}
                      >
                        {rupiah(preset)}
                      </button>
                    );
                  })}
                </div>

                <label className="mt-5 block text-sm font-medium">
                  Nominal
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-[color:var(--pk-text-mute)]">
                      Rp
                    </span>
                    <input
                      required
                      min={10000}
                      max={50000000}
                      step={1000}
                      type="number"
                      value={amount}
                      onChange={(event) => setAmount(Number(event.target.value))}
                      className="min-h-12 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] pl-10 pr-3 font-mono text-lg text-[color:var(--pk-text)] outline-none transition-colors focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                    />
                  </div>
                  <span className="mt-2 block text-xs text-[color:var(--pk-text-mute)]">
                    Minimal Rp 10.000 · Maksimal Rp 50.000.000
                  </span>
                </label>
              </div>

              {message && (
                <p
                  role="status"
                  className="rounded-lg border border-[color:var(--pk-accent)]/30 bg-[color:var(--pk-accent)]/10 px-4 py-3 text-sm text-[color:var(--pk-accent-2)]"
                >
                  {message}
                </p>
              )}

              <div className="mt-auto border-t border-[color:var(--pk-line)] pt-5">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-[color:var(--pk-text-mute)]">
                    Total dibayar
                  </span>
                  <span className="font-mono text-lg font-semibold text-[color:var(--pk-accent)]">
                    {rupiah(Number.isFinite(amount) ? amount : 0)}
                  </span>
                </div>
                <button
                  disabled={submitting}
                  className="pk-btn-primary inline-flex min-h-12 w-full items-center justify-center px-5 text-sm disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? "Membuat pembayaran..." : "Lanjutkan pembayaran"}
                </button>
              </div>
            </form>
          </section>

          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Pembayaran aktif</h2>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Detail muncul setelah form berhasil diproses.
              </p>
            </div>

            {payment ? (
              <div className="mt-6 flex flex-1 flex-col justify-between gap-6 border-t border-[color:var(--pk-line)] pt-6">
                <dl className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[color:var(--pk-text-mute)]">
                      Order ID
                    </dt>
                    <dd className="max-w-[16rem] truncate text-right font-mono text-[color:var(--pk-text)]">
                      {payment.order_id}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[color:var(--pk-text-mute)]">Metode</dt>
                    <dd className="text-right font-mono text-[color:var(--pk-text)]">
                      {payment.payment_method ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[color:var(--pk-text-mute)]">
                      Nomor pembayaran
                    </dt>
                    <dd className="max-w-[16rem] break-all text-right font-mono text-[color:var(--pk-text)]">
                      {payment.payment_number ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-[color:var(--pk-line)] pt-4">
                    <dt className="text-[color:var(--pk-text-mute)]">Total</dt>
                    <dd className="font-mono text-lg font-semibold text-[color:var(--pk-accent)]">
                      {payment.total_payment
                        ? rupiah(payment.total_payment)
                        : "Menunggu detail"}
                    </dd>
                  </div>
                </dl>

                {payment.payment_url && (
                  <a
                    href={payment.payment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="pk-btn-ghost inline-flex min-h-11 items-center justify-center px-5 text-sm font-medium"
                  >
                    Buka halaman pembayaran
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-6 flex flex-1 flex-col items-center justify-center border-t border-[color:var(--pk-line)] py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-mute)]">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </span>
                <p className="mt-4 text-sm font-medium">
                  Belum ada pembayaran aktif.
                </p>
                <p className="mt-1 max-w-xs text-xs text-[color:var(--pk-text-mute)]">
                  Buat pembayaran dari form di samping, detail akan muncul di
                  sini.
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
              <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
                Status berasal dari transaksi akun kamu.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[color:var(--pk-text-mute)]">
              <span>{stats.total} transaksi</span>
              {stats.pending > 0 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-[color:var(--pk-line-2)]" />
                  <span className="text-[color:var(--pk-accent)]">
                    {stats.pending} menunggu
                  </span>
                </>
              )}
              <span className="h-1 w-1 rounded-full bg-[color:var(--pk-line-2)]" />
              <span className="text-[#6ee7b7]">
                {rupiah(stats.credited)} masuk
              </span>
            </div>
          </div>

          <div className="pk-panel pk-inview mt-4 overflow-hidden">
            {state === "loading" && (
              <p className="p-6 text-sm text-[color:var(--pk-text-dim)]">
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
                <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                  Buat pembayaran pertama kamu dari form di atas.
                </p>
              </div>
            )}

            {state === "ready" && transactions.length > 0 && (
              <div className="pk-scroll overflow-x-auto">
                <table className="w-full min-w-[42rem] text-left text-sm">
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
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[color:var(--pk-line)] transition-colors last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4 font-mono text-[color:var(--pk-text-dim)]">
                          {item.order_id}
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-[color:var(--pk-text)]">
                          {rupiah(Number(item.amount_rupiah))}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4 text-xs text-[color:var(--pk-text-mute)]">
                          {new Date(item.created_at).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-[color:var(--pk-text-mute)]">
            Butuh bantuan?{" "}
            <Link
              href="/dashboard"
              className="text-[color:var(--pk-accent)] hover:underline"
            >
              Kembali ke ringkasan
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { color: string; dot: string; label: string }
  > = {
    credited: {
      color: "text-[#6ee7b7]",
      dot: "bg-[#34d399]",
      label: statusLabel.credited,
    },
    paid: {
      color: "text-[#6ee7b7]",
      dot: "bg-[#34d399]",
      label: statusLabel.paid,
    },
    pending: {
      color: "text-[color:var(--pk-accent)]",
      dot: "bg-[color:var(--pk-accent)]",
      label: statusLabel.pending,
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
  };

  const cfg = map[status] ?? {
    color: "text-[color:var(--pk-text-dim)]",
    dot: "bg-[color:var(--pk-line-2)]",
    label: status,
  };

  return (
    <span className={`inline-flex items-center gap-2 text-sm ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}