"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Transaction = { id: string; order_id: string; amount_rupiah: number; status: string; payment_method: string | null; payment_number: string | null; total_payment: number | null; expires_at: string | null; created_at: string };
type Payment = { order_id: string; amount?: number; total_payment?: number; payment_method?: string; payment_number?: string; payment_url?: string; expired_at?: string };
const statusLabel: Record<string, string> = { pending: "Menunggu pembayaran", paid: "Pembayaran diterima", credited: "Saldo masuk", expired: "Kedaluwarsa", failed: "Gagal" };

function rupiah(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }

export default function TopupPage() {
  const [amount, setAmount] = useState(10000);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);

  async function loadTransactions() {
    const response = await fetch("/api/transactions", { cache: "no-store" });
    if (!response.ok) throw new Error("Transaksi tidak bisa dimuat.");
    const data = await response.json() as { transactions: Transaction[] };
    setTransactions(data.transactions);
    setState("ready");
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => { loadTransactions().catch(() => { if (active) setState("error"); }); }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true); setMessage(""); setPayment(null);
    try {
      const response = await fetch("/api/topups", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount_rupiah: amount }) });
      const data = await response.json().catch(() => null) as { error?: string; payment?: Payment } | null;
      if (!response.ok) { setMessage(data?.error ?? "Pembayaran tidak bisa dibuat."); return; }
      setMessage("Pembayaran dibuat. Selesaikan pembayaran sesuai detail di bawah.");
      const created = data?.payment;
      if (!created?.payment_url) {
        setMessage("Payment URL Pakasir tidak tersedia.");
        return;
      }
      window.location.assign(created.payment_url);
    } catch {
      setMessage("Pembayaran tidak bisa dibuat. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div><header className="border-b border-[#d9e0e8] bg-white px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-[#D97B2E]">Saldo</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Beli kuota</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#40536d]">Pilih nominal, pilih metode pembayaran, lalu selesaikan transaksi di Pakasir.</p></header><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{payment && <section className="mb-8 border border-[#1F9E6E] bg-[#effaf5] p-5" aria-live="polite"><h2 className="font-semibold text-[#176b4d]">Pembayaran siap dilanjutkan</h2><p className="mt-2 text-sm">Order: <span className="font-mono">{payment.order_id}</span></p>{payment.payment_number && <p className="mt-1 text-sm">Nomor pembayaran: <span className="font-mono font-semibold">{payment.payment_number}</span></p>}{payment.payment_url && <a href={payment.payment_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center bg-[#F0A93B] px-4 font-semibold text-[#122542]">Buka halaman pembayaran Pakasir</a>}</section>}<div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><section className="border border-[#d9e0e8] bg-white p-5 sm:p-6"><h2 className="font-semibold">Buat pembayaran</h2><form onSubmit={submit} className="mt-6 space-y-6"><label className="block text-sm font-medium">Nominal<input required min={10000} max={50000000} step={1000} type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="mt-2 min-h-12 w-full border border-[#b9c5d3] px-3 font-mono text-lg outline-none focus:border-[#122542] focus:ring-2 focus:ring-[#F0A93B]" /><span className="mt-2 block text-xs text-[#40536d]">Minimal Rp 10.000. Maksimal Rp 50.000.000.</span></label>{message && <p role="status" className="border-l-2 border-[#D97B2E] bg-[#fff4df] px-4 py-3 text-sm text-[#6d4b1c]">{message}</p>}<button disabled={submitting} className="min-h-12 w-full bg-[#F0A93B] px-5 font-semibold text-[#122542] hover:bg-[#f7bb5d] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#122542]">{submitting ? "Membuat pembayaran..." : `Lanjutkan dengan ${rupiah(amount)}`}</button></form></section><section className="border border-[#122542] bg-[#122542] p-6 text-white"><p className="text-sm text-[#F0A93B]">Status pembayaran aktif</p>{payment ? <div className="mt-5"><h2 className="text-2xl font-semibold">Selesaikan pembayaran</h2><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#b7c5d6]">Order ID</dt><dd className="font-mono text-right">{payment.order_id}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#b7c5d6]">Total</dt><dd className="font-mono text-right text-[#F0A93B]">{payment.total_payment ? rupiah(payment.total_payment) : "Menunggu detail"}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#b7c5d6]">Nomor pembayaran</dt><dd className="max-w-[14rem] break-all text-right font-mono">{payment.payment_number ?? "Menunggu detail"}</dd></div></dl></div> : <div className="mt-5"><h2 className="text-2xl font-semibold">Belum ada pembayaran aktif.</h2><p className="mt-3 text-sm leading-6 text-[#dbe4ef]">Detail pembayaran akan muncul setelah form berhasil diproses.</p></div>}</section></div><section className="mt-10"><div className="flex items-end justify-between"><div><h2 className="text-xl font-semibold">Riwayat transaksi</h2><p className="mt-1 text-sm text-[#40536d]">Status berasal dari transaksi akun kamu.</p></div><Link href="/dashboard" className="text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Kembali ke ringkasan</Link></div><div className="mt-4 overflow-x-auto border-y border-[#d9e0e8] bg-white">{state === "loading" && <p className="p-6 text-sm text-[#40536d]">Memuat transaksi...</p>}{state === "error" && <p role="alert" className="p-6 text-sm text-[#D64545]">Riwayat transaksi tidak bisa dimuat.</p>}{state === "ready" && transactions.length === 0 && <p className="p-8 text-sm text-[#40536d]">Belum ada transaksi. Buat pembayaran pertama kamu dari form di atas.</p>}{state === "ready" && transactions.length > 0 && <table className="w-full min-w-[42rem] text-left text-sm"><thead className="border-b border-[#d9e0e8] text-[#40536d]"><tr><th className="px-5 py-4 font-medium">Order ID</th><th className="px-5 py-4 text-right font-medium">Nominal</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 font-medium">Tanggal</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id} className="border-b border-[#eef1f5] last:border-0"><td className="px-5 py-4 font-mono">{item.order_id}</td><td className="px-5 py-4 text-right font-mono">{rupiah(item.amount_rupiah)}</td><td className={`px-5 py-4 ${item.status === "credited" ? "text-[#1F9E6E]" : item.status === "failed" || item.status === "expired" ? "text-[#D64545]" : "text-[#D97B2E]"}`}>{statusLabel[item.status] ?? item.status}</td><td className="px-5 py-4 text-[#40536d]">{new Date(item.created_at).toLocaleString("id-ID")}</td></tr>)}</tbody></table>}</div></section></div></div>;
}
