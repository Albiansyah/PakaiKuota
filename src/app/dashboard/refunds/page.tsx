"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Refund = {
  id: string;
  amount_rupiah: number;
  reason: string;
  status: string;
  reviewed_at: string | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  requested: "Menunggu review",
  approved: "Disetujui",
  rejected: "Ditolak",
  refunded: "Saldo dikembalikan",
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [amount, setAmount] = useState(10000);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "err">("ok");

  async function load() {
    setState("loading");
    const response = await fetch("/api/refunds");
    if (!response.ok) {
      setState("error");
      return;
    }
    const data = (await response.json()) as { refunds: Refund[] };
    setRefunds(data.refunds);
    setState("ready");
  }

  useEffect(() => {
    let active = true;
    fetch("/api/refunds")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setState("error");
          return;
        }
        const data = (await response.json()) as { refunds: Refund[] };
        if (active) {
          setRefunds(data.refunds);
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
    const refunded = refunds.filter((r) => r.status === "refunded");
    const pending = refunds.filter((r) => r.status === "requested");
    const rejected = refunds.filter((r) => r.status === "rejected");
    return {
      total: refunds.length,
      refundedAmount: refunded.reduce(
        (sum, r) => sum + Number(r.amount_rupiah ?? 0),
        0
      ),
      pendingCount: pending.length,
      rejectedCount: rejected.length,
    };
  }, [refunds]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/refunds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount_rupiah: amount, reason }),
    });
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    setSubmitting(false);
    if (!response.ok) {
      setMessageType("err");
      setMessage(data?.error ?? "Pengajuan refund tidak bisa dibuat.");
      return;
    }
    setMessageType("ok");
    setMessage("Pengajuan refund tercatat dan menunggu review.");
    setReason("");
    await load();
  }

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <header className="border-b border-[color:var(--pk-line)] bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Keuangan
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Refund
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Ajukan pengembalian saldo untuk ditinjau admin. Status dan perubahan
            saldo tercatat.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* ============ STATS ============ */}
        {state === "ready" && stats.total > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                Total pengajuan
              </p>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                {stats.pendingCount} menunggu · {stats.rejectedCount} ditolak
              </p>
            </div>
            <div className="pk-panel pk-inview p-5 sm:col-span-2">
              <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                Total saldo dikembalikan
              </p>
              <p className="mt-3 font-mono text-2xl text-[#6ee7b7]">
                {rupiah(stats.refundedAmount)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Dari pengajuan yang disetujui admin
              </p>
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          {/* ============ FORM ============ */}
          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Ajukan refund</h2>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Isi nominal dan alasan pengajuan.
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 flex flex-1 flex-col gap-5">
              <label className="block text-sm font-medium">
                Nominal
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-[color:var(--pk-text-mute)]">
                    Rp
                  </span>
                  <input
                    required
                    min={1}
                    type="number"
                    value={amount}
                    onChange={(event) =>
                      setAmount(Number(event.target.value))
                    }
                    className="min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] pl-10 pr-3 font-mono text-base text-[color:var(--pk-text)] outline-none transition-colors focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                  />
                </div>
              </label>

              <label className="block text-sm font-medium">
                Alasan
                <textarea
                  required
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  placeholder="Ceritakan kenapa kamu mengajukan refund..."
                  className="mt-2 w-full resize-y rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 py-2.5 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
              </label>

              {message && (
                <p
                  role="status"
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    messageType === "ok"
                      ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]"
                      : "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="mt-auto border-t border-[color:var(--pk-line)] pt-5">
                <button
                  disabled={submitting}
                  className="pk-btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 text-sm disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? "Mengirim..." : "Ajukan refund"}
                </button>
              </div>
            </form>
          </section>

          {/* ============ INFO PANEL ============ */}
          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Cara kerja refund</h2>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Proses review oleh admin.
              </p>
            </div>

            <ol className="mt-6 flex-1 space-y-5 border-t border-[color:var(--pk-line)] pt-6">
              {[
                {
                  no: "01",
                  title: "Ajukan",
                  desc: "Isi nominal dan alasan. Pengajuan langsung tercatat.",
                },
                {
                  no: "02",
                  title: "Review",
                  desc: "Admin meninjau pengajuan dalam 1–3 hari kerja.",
                },
                {
                  no: "03",
                  title: "Keputusan",
                  desc: "Disetujui = saldo kembali. Ditolak = alasan dicantumkan.",
                },
              ].map((step) => (
                <li key={step.no} className="flex gap-4">
                  <span className="pk-step-no">{step.no}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--pk-text-dim)]">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-6 rounded-lg border border-[color:var(--pk-line)] bg-[#0b1626]/60 px-4 py-3 text-[11px] leading-5 text-[color:var(--pk-text-mute)]">
              Saldo hanya berubah setelah status berubah menjadi{" "}
              <span className="text-[#6ee7b7]">Saldo dikembalikan</span>.
            </p>
          </section>
        </div>

        {/* ============ HISTORY ============ */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">
                Riwayat pengajuan
              </h2>
              <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
                Status diambil dari catatan refund akun kamu.
              </p>
            </div>
            {state === "ready" && refunds.length > 0 && (
              <p className="text-xs text-[color:var(--pk-text-mute)]">
                {refunds.length} pengajuan
              </p>
            )}
          </div>

          <div className="pk-panel pk-inview mt-4 overflow-hidden">
            {state === "loading" && (
              <p className="p-8 text-sm text-[color:var(--pk-text-dim)]">
                Memuat pengajuan refund...
              </p>
            )}

            {state === "error" && (
              <p role="alert" className="p-8 text-sm text-[#fca5a5]">
                Pengajuan refund tidak bisa dimuat.
              </p>
            )}

            {state === "ready" && refunds.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-semibold">Belum ada pengajuan refund.</p>
                <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                  Pengajuan kamu akan muncul di sini setelah dikirim.
                </p>
              </div>
            )}

            {state === "ready" && refunds.length > 0 && (
              <div className="pk-scroll overflow-x-auto">
                <table className="w-full min-w-[48rem] text-left text-sm">
                  <thead className="border-b border-[color:var(--pk-line)] text-[color:var(--pk-text-mute)]">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Tanggal
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Nominal
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Alasan
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr
                        key={refund.id}
                        className="border-b border-[color:var(--pk-line)] transition-colors last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[color:var(--pk-text-mute)]">
                          <div>
                            {new Date(refund.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div className="text-[10px] opacity-70">
                            {new Date(refund.created_at).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-[color:var(--pk-text)]">
                          {rupiah(Number(refund.amount_rupiah))}
                        </td>
                        <td className="max-w-[24rem] px-5 py-4 text-[color:var(--pk-text-dim)]">
                          {refund.reason}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={refund.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; dot: string }> = {
    refunded: { color: "text-[#6ee7b7]", dot: "bg-[#34d399]" },
    approved: { color: "text-[#6ee7b7]", dot: "bg-[#34d399]" },
    requested: {
      color: "text-[color:var(--pk-accent)]",
      dot: "bg-[color:var(--pk-accent)]",
    },
    rejected: { color: "text-[#fca5a5]", dot: "bg-[#f87171]" },
  };
  const cfg = map[status] ?? {
    color: "text-[color:var(--pk-text-dim)]",
    dot: "bg-[color:var(--pk-line-2)]",
  };
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {statusLabels[status] ?? status}
    </span>
  );
}