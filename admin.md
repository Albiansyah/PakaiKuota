# Fix: 405 di /api/admin/models, 500 di /api/admin/audit

**Gejala di console:**
- `api/admin/models` → 405 Method Not Allowed
- `api/admin/audit` → 500 Internal Server Error
- `page.tsx:78` → `SyntaxError: Unexpected end of JSON input` (akibat, bukan sebab — response body kosong karena 2 error di atas)

---

## Fix 1: Tambah `GET` di `src/app/api/admin/models/route.ts`

Route ini sekarang cuma punya `PATCH` (buat edit markup), gak ada `GET` buat nampilin list model — makanya request `GET` dari halaman admin kena 405. Di Next.js App Router, tiap HTTP method wajib di-export terpisah.

**Tambahkan (jangan hapus `PATCH` yang sudah ada):**

```typescript
export async function GET(request: Request) {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .order('tier', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ models: data })
}
```

---

## Fix 2: `src/app/api/admin/audit/route.ts` — Buang Nested-Select ke `transactions`

Root cause 500: query `GET` nyoba nested-select `transactions ( id, order_id, ... )` dari `admin_audit_logs`, padahal `admin_audit_logs.target_id` itu kolom generic/polymorphic (bisa nunjuk ke tabel manapun tergantung `target_type`), BUKAN foreign key asli ke `transactions`. PostgREST butuh FK constraint beneran buat resolve nested-select — karena gak ada, query gagal di server.

**Ganti fungsi `GET` jadi:**

```typescript
export async function GET(request: Request) {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select(`
      *,
      admin:users!admin_id (
        id, name, email, role
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data })
}
```

Fungsi `POST` di file yang sama **tidak perlu diubah**, sudah benar.

Kalau ke depannya butuh detail transaksi terkait tiap log (`target_type === 'transaction'`), itu harus query terpisah (filter tabel `transactions` by list `target_id` yang match) — bukan lewat nested-select, karena relasinya polymorphic dan PostgREST gak bisa handle itu secara native.

---

## Fix 3 (Preventif): Guard `fetchData` di `page.tsx` Biar Error Gak Membingungkan

Bukan bug baru, tapi penyebab kenapa error asli (405/500) malah nongol sebagai "Unexpected end of JSON input" yang gak jelas. `fetchData` di `page.tsx` baris ~78 manggil `.json()` langsung tanpa cek response dulu.

**Cari `fetchData` di file yang errornya muncul, tambahkan guard:**

```typescript
const res = await fetch(url)
if (!res.ok) {
  console.error(`Fetch failed: ${url}`, res.status)
  return null
}
const data = await res.json()
```

Terapkan pattern ini ke semua tempat yang fetch API admin (models, audit, users, transactions, dst) — biar kalau ada bug API baru ke depannya, errornya langsung jelas method/status apa yang gagal, bukan nutupin jadi JSON parse error yang bikin bingung.

---

## Checklist Verifikasi

- [ ] Halaman `/admin/models` load list model tanpa error 405
- [ ] Halaman `/admin/audit-logs` (atau halaman yang manggil `/api/admin/audit`) load tanpa error 500
- [ ] Console browser bersih dari `Unexpected end of JSON input`
- [ ] Coba matiin salah satu API sengaja (misal comment out sementara) — pastikan error yang muncul di console sekarang jelas (status code + endpoint), bukan JSON parse error generik