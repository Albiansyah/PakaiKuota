# PRD: Admin Landing Redirect + Overview Enhancement

**Status:** Draft v0.1
**Referensi:** AGENT-BRIEF-Admin-Dashboard.md (sudah dieksekusi sebagian — sidebar `/admin/*` sudah jadi)
**Tanggal:** 31 Agustus 2026

---

## 1. Masalah Saat Ini

Dari screenshot: begitu admin login, dia mendarat di `/dashboard` (dashboard user biasa — saldo Rp0, Aksi Cepat, dst), lalu harus scroll ke bawah dan klik card "Kelola Sistem" buat baru sampai ke `/admin` (yang sidebar-nya sudah bagus, ada Overview/Users/Transaksi/Refund/Models/Margin/Rekonsiliasi/Audit Log/Broadcast/Anomaly/Reseller). Ini nambahin 1 langkah gak perlu tiap kali admin kerja, dan kesannya admin panel jadi "nempel" bukan pengalaman terpisah.

## 2. Requirement Utama

1. **Redirect otomatis pasca-login**: kalau `role === 'super_admin'` atau `role === 'support'`, setelah login langsung diarahkan ke `/admin` (Overview), BUKAN ke `/dashboard`.
2. **Overview page diperkaya**: saat ini section "Aktivitas Terbaru" masih kosong ("Belum ada aktivitas") dan gak ada visualisasi apapun. Tambahkan:
   - Bar chart (minimal 1, idealnya bisa lebih dari 1 — lihat open questions soal data apa aja)
   - Fitur search (scope-nya perlu diperjelas — lihat open questions)
3. **CRUD khusus di halaman Users**: bukan cuma list read-only, tapi Create/Read/Update/Delete penuh dari panel admin.

## 3. Behavior Redirect — Detail

- Titik redirect: langsung setelah proses login sukses (bukan nunggu user klik apapun).
- `/dashboard` (user dashboard) sebaiknya tetap ada dan bisa diakses admin secara manual kalau dia mau lihat "pandangan user" — bukan dihapus, cuma bukan default landing lagi.
- Middleware/route check yang sudah ada di `/admin/*` (cek role) tetap dipertahankan, ini soal *default landing page* aja, bukan soal access control (yang udah beres).

## 4. Overview — Elemen Baru

- **Bar chart**: minimal render 1 chart nyata (bukan placeholder), pakai library chart yang konsisten sama sisi user dashboard (kalau dashboard user udah pakai Tremor/Recharts, reuse yang sama, jangan tambah dependency baru).
- **Search**: 1 search bar di bagian atas Overview yang bisa langsung lompat ke hasil (user/transaksi/dll — scope final tergantung jawaban open questions di bawah).
- **Aktivitas Terbaru**: harus ke-isi data real dari `admin_audit_logs` join `transactions`/`users` (order by `created_at desc`), bukan lagi nampilin "Belum ada aktivitas" terus-terusan — cek kenapa query-nya belum jalan/belum ada trigger yang nulis ke situ.

## 5. Users — CRUD Penuh

- **Create**: admin bisa bikin user baru manual dari panel (nama, email, role awal), bukan cuma lewat signup flow biasa.
- **Read**: sudah ada (list + detail), pastikan tetap ada search/filter di halaman ini juga (terpisah dari search global di Overview).
- **Update**: edit profil, ubah role, adjust saldo manual (dengan alasan wajib diisi, masuk ke `admin_audit_logs`).
- **Delete**: perlu diputuskan soft-delete vs hard-delete (lihat open questions — ini keputusan penting, jangan asal pilih karena menyangkut integritas data transaksi historis).

---

## 6. Keputusan Final (Semua Sudah Di-ACC)

- ✅ **Delete user**: soft-delete via kolom `deleted_at timestamptz` (lihat migration di atas). Semua query normal filter `where deleted_at is null`.
- ✅ **`/dashboard` diakses manual oleh admin**: auto-redirect paksa ke `/admin`, enforced di middleware/route check, bukan cuma landing pasca-login.
- ✅ **Role `support`**: boleh CRUD user (create/read/update field non-sensitif), TIDAK boleh soft-delete user atau ubah role siapapun jadi/dari `super_admin`. Enforce di backend/API route, bukan cuma UI.
- ✅ **Saldo & API key buat akun admin**: tidak perlu. Field `balance_rupiah`/API key gak ditampilkan/dipakai di UI admin, biarkan default `0`/kosong.
- ✅ **Search di Overview**: shortcut ke halaman masing-masing (Users, Transaksi), bukan global search lintas tabel. Global search bisa jadi iterasi berikutnya kalau kebutuhannya nyata.
- ✅ **Verifikasi email buat user yang dibuat admin manual**: tidak perlu, langsung aktif (`email_confirm: true` via Supabase Admin API, sama kayak script seed admin).
- ✅ **Field yang boleh diedit admin di halaman Users**: `name`, `business_name`, `business_phone`, `npwp`, `balance_rupiah`, `role` (kecuali oleh `support`). **Tidak boleh diedit manual**: `email`, `id`, `created_at`.
- ✅ **Dialog konfirmasi + alasan wajib**: ya, untuk 2 aksi — adjust saldo manual dan soft-delete user. Alasan masuk ke kolom `details` (jsonb) di `admin_audit_logs`.
- ✅ **Search user by field**: email, nama, `business_name`. `order_id`/`api_key_id` tidak masuk search bar utama (dicari dari halaman detail terkait).
- ✅ **Bar chart di Overview**: 2 chart — (a) Revenue harian 30 hari terakhir, (b) Top 5 model by pemakaian token. Chart lain (user baru per hari, dst) masuk iterasi berikutnya.
- ✅ **Filter rentang tanggal chart**: tidak ada dulu, fixed 30 hari terakhir untuk versi awal.
- ✅ **Live-update/polling**: tidak perlu, cukup refresh saat page-load.

**Status: PRD ini siap dieksekusi penuh — tidak ada lagi open question yang menghambat development.**

---

## 7. Prioritas Eksekusi

Semua keputusan sudah final (section 6) — urutan kerja:

1. Migration: tambah kolom `deleted_at` ke `users`, middleware redirect admin di `/dashboard`
2. Overview: isi "Aktivitas Terbaru" dengan data real dari `admin_audit_logs`, tambah 2 bar chart (revenue harian 30 hari, top 5 model by usage)
3. Users: implementasi Create (form + Supabase Admin API, `email_confirm: true`), Update (field sesuai daftar di section 6, dengan dialog konfirmasi+alasan untuk adjust saldo), soft-Delete (dengan dialog konfirmasi+alasan)
4. Enforce pembatasan role `support` di level API route (bukan cuma sembunyiin tombol di UI)
5. Search shortcut di Overview ke halaman Users/Transaksi