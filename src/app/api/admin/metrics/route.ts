import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const [users, transactions] = await Promise.all([
    context.admin.from('users').select('created_at').order('created_at', { ascending: false }).limit(200),
    context.admin.from('transactions').select('amount_rupiah, status, created_at').order('created_at', { ascending: false }).limit(200),
  ]);
  if (users.error || transactions.error) return NextResponse.json({ error: 'metrics_failed' }, { status: 500 });
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); return date; });
  const labels = days.map((date) => date.toISOString().slice(5, 10));
  const countByDay = (rows: { created_at: string }[]) => labels.map((label) => rows.filter((row) => row.created_at.slice(0, 10).slice(5) === label).length);
  return NextResponse.json({ labels, users: countByDay(users.data ?? []), transactions: countByDay(transactions.data ?? []), revenue: labels.map((label) => (transactions.data ?? []).filter((row) => row.created_at.slice(0, 10).slice(5) === label && row.status === 'credited').reduce((sum, row) => sum + Number(row.amount_rupiah), 0)) });
}
