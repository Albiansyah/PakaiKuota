"use client";

import { FormEvent, useEffect, useState } from "react";

type Refund = { id: string; amount_rupiah: number; reason: string; status: string; reviewed_at: string | null; created_at: string };
const statusLabels: Record<string, string> = { requested: "Menunggu review", approved: "Disetujui", rejected: "Ditolak", refunded: "Saldo dikembalikan" };
function rupiah(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [amount, setAmount] = useState(10000);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setState("loading");
    const response = await fetch("/api/refunds");
    if (!response.ok) { setState("error"); return; }
    const data = await response.json() as { refunds: Refund[] };
    setRefunds(data.refunds); setState("ready");
  }
  useEffect(() => { let active = true; fetch("/api/refunds").then(async (response) => { if (!active) return; if (!response.ok) { setState("error"); return; } const data = await response.json() as { refunds: Refund[] }; if (active) { setRefunds(data.refunds); setState("ready"); } }).catch(() => { if (active) setState("error"); }); return () => { active = false; }; }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true); setMessage("");
    const response = await fetch("/api/refunds", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount_rupiah: amount, reason }) });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    setSubmitting(false);
    if (!response.ok) { setMessage(data?.error ?? "Pengajuan refund tidak bisa dibuat."); return; }
    setMessage("Pengajuan refund tercatat dan menunggu review."); setReason(""); await load();
  }

  return <div><header className="border-b border-[#d9e0e8] bg-white px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-[#D97B2E]">Keuangan</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Refund</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#40536d]">Ajukan pengembalian saldo untuk ditinjau admin. Status dan perubahan saldo tercatat.</p></header><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><section className="border border-[#d9e0e8] bg-white p-5 sm:p-6"><h2 className="font-semibold">Ajukan refund</h2><form onSubmit={submit} className="mt-5 grid gap-5 lg:grid-cols-[0.55fr_1fr_auto] lg:items-end"><label className="block text-sm font-medium">Nominal<input required min={1} type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="mt-2 min-h-11 w-full border border-[#b9c5d3] px-3 font-mono outline-none focus:border-[#122542] focus:ring-2 focus:ring-[#F0A93B]" /></label><label className="block text-sm font-medium">Alasan<textarea required value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full resize-y border border-[#b9c5d3] px-3 py-2 outline-none focus:border-[#122542] focus:ring-2 focus:ring-[#F0A93B]" /></label><button disabled={submitting} className="min-h-11 bg-[#F0A93B] px-5 font-semibold text-[#122542] hover:bg-[#f7bb5d] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[#122542]">{submitting ? "Mengirim..." : "Ajukan refund"}</button></form>{message && <p role="status" className="mt-4 border-l-2 border-[#D97B2E] bg-[#fff4df] px-4 py-3 text-sm text-[#6d4b1c]">{message}</p>}</section><section className="mt-10"><h2 className="text-xl font-semibold">Riwayat pengajuan</h2><div className="mt-4 overflow-x-auto border-y border-[#d9e0e8] bg-white">{state === "loading" && <p className="p-8 text-sm text-[#40536d]">Memuat pengajuan refund...</p>}{state === "error" && <p role="alert" className="p-8 text-sm text-[#D64545]">Pengajuan refund tidak bisa dimuat.</p>}{state === "ready" && refunds.length === 0 && <p className="p-8 text-sm text-[#40536d]">Belum ada pengajuan refund.</p>}{state === "ready" && refunds.length > 0 && <table className="w-full min-w-[48rem] text-left text-sm"><thead className="border-b border-[#d9e0e8] text-[#40536d]"><tr><th className="px-5 py-4 font-medium">Tanggal</th><th className="px-5 py-4 text-right font-medium">Nominal</th><th className="px-5 py-4 font-medium">Alasan</th><th className="px-5 py-4 font-medium">Status</th></tr></thead><tbody>{refunds.map((refund) => <tr key={refund.id} className="border-b border-[#eef1f5] last:border-0"><td className="whitespace-nowrap px-5 py-4 text-[#40536d]">{new Date(refund.created_at).toLocaleString("id-ID")}</td><td className="px-5 py-4 text-right font-mono">{rupiah(refund.amount_rupiah)}</td><td className="max-w-[24rem] px-5 py-4">{refund.reason}</td><td className={`px-5 py-4 ${refund.status === "refunded" ? "text-[#1F9E6E]" : refund.status === "rejected" ? "text-[#D64545]" : "text-[#D97B2E]"}`}>{statusLabels[refund.status] ?? refund.status}</td></tr>)}</tbody></table>}</div></section></div></div>;
}
