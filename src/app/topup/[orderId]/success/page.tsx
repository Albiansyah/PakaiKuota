"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Transaction = { order_id: string; status: string; amount_rupiah: number };

export default function TopupSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    params.then(({ orderId }) => {
      const load = async () => {
        const response = await fetch(`/api/topups/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { transaction: Transaction };
        if (active) { setTransaction(data.transaction); setLoading(false); if (data.transaction.status === 'credited' || data.transaction.status === 'failed' || data.transaction.status === 'expired') { if (timer) clearInterval(timer); } }
      };
      load();
      timer = setInterval(async () => { await fetch(`/api/topups/${encodeURIComponent(orderId)}/verify`, { method: 'POST' }); await load(); }, 5000);
    });
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [params]);

  const status = transaction?.status;
  const verifyPayment = async () => {
    const { orderId } = await params;
    await fetch(`/api/topups/${encodeURIComponent(orderId)}/verify`, { method: 'POST' });
    const response = await fetch(`/api/topups/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
    if (response.ok) { const data = await response.json() as { transaction: Transaction }; setTransaction(data.transaction); setLoading(false); }
  };
  return <main className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8"><p className="text-sm font-semibold text-[#D97B2E]">Pembayaran</p><h1 className="mt-2 text-3xl font-semibold">{loading ? 'Memuat status...' : status === 'credited' ? 'Pembayaran berhasil' : status === 'expired' || status === 'failed' ? 'Pembayaran tidak berhasil' : 'Menunggu konfirmasi pembayaran'}</h1><p className="mt-4 text-[#40536d]">{status === 'credited' ? 'Saldo telah ditambahkan ke akun Anda.' : 'Status diambil dari backend dan diperbarui otomatis.'}</p><div className="mt-8 flex flex-wrap gap-3">{status === 'pending' && <button onClick={verifyPayment} className="min-h-11 bg-[#F0A93B] px-4 py-3 text-sm font-semibold text-[#122542]">Cek status pembayaran</button>}<Link href="/dashboard/transactions" className="min-h-11 bg-[#122542] px-4 py-3 text-sm font-semibold text-white">Lihat transaksi</Link><Link href="/dashboard" className="min-h-11 border border-[#b9c5d3] px-4 py-3 text-sm font-semibold">Dashboard</Link></div></main>;
}
