# PERINTAH KERJA — AUDIT & PERBAIKAN MENYELURUH FRONTEND PAKAIKUOTA

## ATURAN UTAMA (WAJIB DIBACA SEBELUM MULAI)

1. **DILARANG mengerjakan sebagian lalu berhenti.** Kamu tidak boleh melapor "selesai" sebelum SEMUA halaman di bawah sudah diperiksa dan diperbaiki satu per satu. Setengah-setengah tidak diterima.
2. **DILARANG menganggap satu halaman "sudah benar" hanya karena terlihat benar di UI.** Setiap field yang menampilkan angka/data WAJIB ditelusuri sampai ke sumber datanya di backend (Supabase query / API route). Kalau kamu tidak bisa menunjukkan query atau endpoint yang menyuplai field itu, anggap field itu RUSAK.
3. **DILARANG membiarkan placeholder (`--`, `Data usage belum tersedia`, dsb) tetap ada di produksi kalau data aslinya sebenarnya SUDAH ADA di backend.** Placeholder hanya boleh muncul kalau memang belum ada data sama sekali (contoh: user baru belum pernah transaksi).
4. **Bug acuan yang WAJIB kamu pahami sebagai pola, bukan cuma 1 bug tunggal:**
   Di halaman Ringkasan (`/dashboard`), "Saldo tersedia", "Pemakaian bulan ini", "Request hari ini" semua tampil `--` / kosong. Tapi di halaman Mutasi Saldo (`/dashboard/ledger`), data yang SAMA PERSIS (saldo, riwayat pemakaian) sudah tampil dan benar. Ini artinya backend-nya SUDAH JALAN — masalahnya murni di frontend yang tidak connect ke sumber data yang sama. **Cari pola ini di SEMUA halaman lain**, bukan cuma di Ringkasan.
5. Setiap kali kamu selesai satu halaman, kamu WAJIB laporkan dalam format checklist di bagian bawah dokumen ini — isi kolom "Status" dan "Sumber data" dengan bukti konkret (nama fungsi/query/endpoint), bukan cuma tulis "OK".

## LANGKAH KERJA (WAJIB DIIKUTI URUT, TIDAK BOLEH LONCAT)

### Langkah 1 — Inventarisasi
Buat daftar SEMUA halaman frontend yang ada (route list lengkap), termasuk sub-halaman/modal/dialog. Jangan cuma ambil dari sidebar — cek juga route yang tidak muncul di nav tapi ada di codebase (`app/` atau `pages/` directory).

### Langkah 2 — Untuk SETIAP halaman, lakukan 4 hal ini tanpa kecuali:
a. Screenshot / catat semua field yang menampilkan data (angka, teks, status, tanggal).
b. Untuk setiap field, telusuri ke belakang: komponen React → hook/fetch → API route Next.js → query Supabase. Tulis path lengkapnya.
c. Bandingkan: apakah query itu mengambil dari tabel/kolom yang SAMA dengan yang sudah terbukti benar di halaman lain (misal Mutasi Saldo)? Kalau ada 2 halaman menampilkan "saldo" tapi dari 2 sumber query berbeda, itu BUG — harus disatukan ke satu source of truth.
d. Kalau field kosong/placeholder padahal datanya ada di backend, PERBAIKI kode-nya saat itu juga, bukan dicatat untuk nanti.

### Langkah 3 — Daftar halaman yang WAJIB diperiksa (minimal, tambahkan kalau ada yang tidak masuk list ini)
- [ ] `/dashboard` (Ringkasan) — saldo tersedia, pemakaian bulan ini, request hari ini, API key aktif, aktivitas terbaru
- [ ] `/dashboard/api-keys` — daftar key, status aktif/nonaktif, reveal, cabut/revoke
- [ ] `/dashboard/beli-kuota` — daftar paket, harga, model yang tersedia
- [ ] `/dashboard/transaksi` — riwayat pembelian/topup
- [ ] `/dashboard/ledger` (Mutasi saldo) — SUDAH BENAR, jadikan referensi source of truth
- [ ] `/dashboard/refund` — status refund, riwayat refund
- [ ] `/dashboard/playground` — koneksi ke API key user, response real dari New API
- [ ] Halaman login/register (kalau ada data profil yang harus sinkron)
- [ ] Semua modal/dialog (contoh: dialog "Siapkan API key pertama" — apakah key yang tampil di situ konsisten dengan yang muncul di halaman API keys?)

### Langkah 4 — Verifikasi silang (WAJIB, jangan skip)
Setelah semua halaman diperbaiki, buka SEMUA halaman itu berurutan dalam satu sesi browsing sebagai satu user yang sama, dan pastikan angka yang sama (saldo, jumlah request, dst) KONSISTEN di semua tempat yang menampilkannya. Kalau ada selisih walau kecil, itu bug yang belum selesai.

### Langkah 5 — Laporan akhir
Isi tabel checklist di bawah ini SATU PER SATU. Tidak boleh ada baris kosong atau "TBD".

| Halaman | Field yang diperiksa | Status sebelum | Status sesudah | Sumber data (query/endpoint) |
|---|---|---|---|---|
| /dashboard | Saldo tersedia | Kosong (`--`) | | |
| /dashboard | Pemakaian bulan ini | Kosong (`--`) | | |
| /dashboard | Request hari ini | Kosong (`--`) | | |
| /dashboard | API key aktif | Kosong (`--`) | | |
| /dashboard | Aktivitas terbaru | "Belum ada data" | | |
| /dashboard/api-keys | Reveal key | ? | | |
| /dashboard/api-keys | Cabut/revoke key | ? | | |
| /dashboard/beli-kuota | ... | | | |
| /dashboard/transaksi | ... | | | |
| /dashboard/refund | ... | | | |
| /dashboard/playground | ... | | | |

## HAL YANG TIDAK BOLEH DILAKUKAN
- Jangan menambah fitur baru yang tidak diminta (misal referral, analitik chart) — fokus HANYA menyambungkan frontend yang sudah ada ke data backend yang sudah benar.
- Jangan mengubah skema/struktur backend kecuali memang terbukti backend-nya juga salah (kalau begitu, laporkan dulu sebelum ubah).
- Jangan menandai pekerjaan selesai kalau tabel checklist di atas masih ada kolom kosong.