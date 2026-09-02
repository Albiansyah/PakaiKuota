# PRD: PakaiKuota.id

**Status:** Draft v0.4
**Owner:** Albiansyah
**Tanggal:** 31 Agustus 2026
**Nama Brand:** PakaiKuota.id
**Legal Entity:** PT Ales Cipta Sejahtera

---

## 1. Ringkasan Produk

Platform web yang memungkinkan user membeli akses API key ke berbagai model LLM (GPT, Claude, Gemini, dll) dengan sistem kuota prabayar. User top-up saldo, pilih paket atau pay-as-you-go, lalu mendapat API key yang bisa langsung dipakai untuk integrasi ke aplikasi/produk mereka sendiri. Backend menggunakan **New API** sebagai gateway management, dengan **OpenRouter** sebagai upstream utama (pay-as-you-go, tanpa modal besar di muka).

**Masalah yang diselesaikan:** Developer/startup Indonesia sulit akses API key LLM resmi (butuh kartu kredit internasional, minimum deposit besar, ribet verifikasi). Platform ini kasih akses lokal, bayar pakai QRIS/e-wallet, tanpa komitmen bulanan.

---

## 2. Target User

| Segmen | Kebutuhan |
|---|---|
| Developer individu/indie hacker | Akses murah buat side project, bayar sesuai pakai |
| Startup/UMKM | Integrasi AI ke produk tanpa ribet setup billing internasional |
| Reseller B2B | Beli dalam jumlah besar, jual ulang ke klien mereka dengan margin sendiri |

---

## 3. Scope MVP

### 3.1 Fitur Wajib (Must-Have)
- [ ] Registrasi & login user (email/Google OAuth via Supabase Auth, wajib verifikasi email)
- [ ] Dashboard: saldo, daftar API key, riwayat pemakaian per key
- [ ] Generate API key otomatis (call ke New API REST API)
- [ ] Top-up saldo via QRIS/e-wallet (Pakasir)
- [ ] Sistem kuota real-time dengan atomic deduction — quota berkurang sesuai token usage
- [ ] Katalog model lengkap (mirror dari OpenRouter, dengan harga jual per model)
- [ ] Playground dengan quota trial terpisah (bukan saldo asli) — lihat Bagian 10.1
- [ ] Riwayat transaksi & invoice (termasuk status PPN — lihat Bagian 14)

### 3.2 Fitur Fase 2 (Nice-to-Have, bukan MVP)
- [ ] Paket berlangganan (bulanan, kuota reset otomatis)
- [ ] Reseller tier / white-label (schema disiapkan dari awal — lihat Bagian 19)
- [ ] Referral program
- [ ] Auto-routing model termurah
- [ ] Dashboard admin buat monitoring margin real-time
- [ ] e-Faktur integration (kalau sudah PKP)

### 3.3 Eksplisit Di Luar Scope (v1)
- Custom fine-tuning model
- Support model on-premise/self-hosted
- Multi-currency selain Rupiah

---

## 4. Detail Halaman & Fungsionalitas

### 4.1 Halaman Publik (Tanpa Login)

| Halaman | Isi/Fungsi |
|---|---|
| Landing page | Value proposition, katalog model preview, CTA daftar |
| Pricing/Katalog model | Daftar semua model + harga jual per token, filter by kategori (murah/menengah/mahal) |
| Docs (`/docs`) | Quickstart guide, code snippet (curl, Python, Node.js), API reference interaktif — lihat Bagian 16 |
| Status page | Uptime gateway real-time, histori insiden — lihat Bagian 12 |
| Login/Register | Email+password atau Google OAuth, link verifikasi email |
| Legal (ToS, Privacy Policy, Refund Policy) | Termasuk klausul refund vs FX (Bagian 6.1) dan disclosure UU PDP (Bagian 15) |

### 4.2 Halaman User (Setelah Login)

**Dashboard utama**
- Ringkasan saldo saat ini (Rupiah)
- Grafik pemakaian 7/30 hari terakhir (token & biaya)
- Quick action: top-up, buat API key baru
- Notifikasi/alert (misal saldo hampir habis, mendekati spending limit)

**Halaman API Keys**
- List semua API key milik user (nama key, tanggal dibuat, status aktif/nonaktif, key ter-mask)
- Create: generate key baru (dengan nama label opsional, dan opsional set spending limit per-key)
- Read: lihat detail key — total usage, model yang paling sering dipakai lewat key ini
- Update: rename label key, aktif/nonaktifkan sementara (tanpa revoke permanen), set/ubah IP whitelist opsional
- Delete: revoke/regenerate key (invalidate lama, generate baru — lihat Bagian 10.4)
- **Full key hanya tampil sekali** saat pertama kali generate

**Halaman Top-up**
- Pilih nominal (preset atau custom)
- Pilih metode (QRIS/VA via Pakasir)
- Tampilkan QR/nomor VA + countdown expired
- Status real-time (pending/berhasil/gagal/expired)

**Halaman Playground**
- Test model langsung dari browser pakai quota trial (Bagian 10.1)
- Pilih model (dibatasi tier murah untuk trial)
- Riwayat percobaan singkat (opsional, session-based)

**Halaman Riwayat & Invoice**
- List transaksi top-up (tanggal, nominal, status, metode)
- List pemakaian API per key (bisa difilter by tanggal/model)
- Download invoice per transaksi (PDF, termasuk PPN kalau berlaku — Bagian 14)
- Request refund (kuota belum terpakai) langsung dari halaman ini

**Halaman Settings/Profil**
- Update profil dasar (nama, email — dengan re-verifikasi kalau email diganti)
- Ubah password / kelola koneksi Google OAuth
- Privacy mode toggle (nonaktifkan logging isi prompt — Bagian 15)
- Notifikasi preferences (email alert saldo rendah, dll)
- Request hapus akun/data (Bagian 15.1)

**Halaman Reseller (Fase 2, placeholder di MVP)**
- Muncul otomatis kalau volume transaksi lewati threshold (Bagian 19)
- Form lengkapi data bisnis (nama usaha, kontak, NPWP opsional)

### 4.3 Halaman Admin

Akses dibatasi role (Super Admin / Support — lihat Bagian 20), dengan audit log semua aksi.

**Dashboard Admin**
- Ringkasan: MAU, volume transaksi harian/bulanan, margin rata-rata, uptime gateway
- Alert terkini (anomali usage, margin negatif, hasil reconciliation gagal)

**Manajemen User** *(CRUD)*
- **Create**: admin bisa buat akun manual (misal untuk keperluan testing/support)
- **Read**: list semua user + filter (status verifikasi, volume transaksi, tanggal daftar), detail user (saldo, riwayat, API key aktif)
- **Update**: edit spending limit per user, suspend/aktifkan akun, ubah role (kalau ada tier reseller), reset verifikasi
- **Delete**: proses request hapus data (anonymize transaksi, hapus data personal — Bagian 15.1), bukan hard delete langsung

**Manajemen Model & Markup** *(CRUD)*
- **Create**: tambah model baru ke katalog (biasanya auto dari sync OpenRouter — Bagian 18, tapi tetap ada opsi manual)
- **Read**: list semua model + harga upstream vs harga jual + margin saat ini
- **Update**: ubah markup per model/tier, aktif/nonaktifkan model tertentu dari katalog
- **Delete**: hapus/deprecate model yang sudah tidak didukung upstream
- Histori perubahan markup tersimpan (audit trail — Bagian 18)

**Manajemen Transaksi & Refund**
- **Read**: list semua transaksi top-up (status, metode, user terkait), list semua refund request
- **Update**: approve/reject refund request, Support role dibatasi nominal tertentu, Super Admin tanpa batas (Bagian 20)
- Detail transaksi termasuk cross-check ke Pakasir Transaction Detail API

**Manajemen API Key (support level)**
- **Read**: lihat key milik user tertentu (ter-mask, untuk keperluan support/investigasi)
- **Update**: revoke key user tertentu (kasus abuse/permintaan user lewat support)
- Tidak bisa melihat full key value — hanya sistem yang generate saat pertama kali

**Monitoring & Anomali**
- Dashboard usage spike, pattern request identik, key dipakai dari banyak IP (Bagian 10.7)
- Review manual untuk flag yang butuh keputusan (suspend key/user)

**Reconciliation View**
- Hasil reconciliation harian Redis vs Supabase (Bagian 11.1) dan internal ledger vs OpenRouter (Bagian 11.2)
- Selisih di atas threshold ditandai untuk investigasi manual

**Manajemen Admin & RBAC** *(khusus Super Admin)*
- **Create**: undang admin/support baru
- **Read**: list semua admin + role masing-masing
- **Update**: ubah role admin
- **Delete**: cabut akses admin
- Audit log: siapa mengubah apa dan kapan (Bagian 20)

**KYC Reseller (Fase 2)**
- **Read**: list user yang sudah lewati threshold volume, status kelengkapan data bisnis
- **Update**: approve/reject data bisnis yang disubmit user

---

## 5. Arsitektur Teknis

```
[Next.js Frontend] <-> [Supabase: user, transaksi, package data — source of truth saldo]
        |
        v
[Backend API (Next.js API routes / separate service)]
        |
        v
[Redis: quota cache, sliding window rate limit, atomic deduction (Lua script)]
        |
        v
[New API - Production (Docker, VPS)]   [New API - Staging (VPS terpisah/port terpisah)]
        |
        v
[OpenRouter] --(fallback)--> [Direct provider key, jika ada]
```

**Stack:**
- Frontend: Next.js, TypeScript, Tailwind, Zustand
- Auth & DB user-facing: Supabase (source of truth untuk saldo)
- Cache/rate-limit: Redis dengan AOF persistence
- Gateway: New API (Go, Docker, di VPS Hetzner/Contabo) — admin panel di belakang VPN/Tailscale, tidak expose publik
- Secret management: Doppler/Infisical untuk upstream key (bukan `.env` plaintext)
- Upstream: OpenRouter (utama), tambah direct key kalau margin butuh optimasi
- Payment: **Pakasir** (payment link/API — QRIS & Virtual Account, di bawah naungan PT. Geksa, PG berizin BI)
- Automasi/notifikasi: n8n (webhook handling, alert Telegram, reconciliation job)
- Error tracking: Sentry (frontend + backend)
- Uptime monitoring: UptimeRobot/Better Uptime atau self-host Uptime Kuma

**Detail integrasi Pakasir:**
- Buat 1 Proyek di Pakasir per environment (sandbox utk testing, production utk live) — catat `slug` dan `api_key`
- Alur top-up: user pilih nominal → backend generate `order_id` unik → panggil `POST /api/transactioncreate/qris` (atau VA sesuai pilihan user) → tampilkan QR/nomor VA + countdown expired di frontend
- Webhook masuk ke endpoint `/api/webhook/pakasir` → **jangan langsung percaya payload webhook** → selalu konfirmasi ulang via `GET /api/transactiondetail` sebelum top-up quota ke New API
- Simpan mapping `order_id` ↔ `user_id` di Supabase sebelum redirect ke halaman pembayaran, biar webhook bisa dicocokkan
- Mode sandbox Pakasir punya endpoint `paymentsimulation` — pakai ini buat test end-to-end sebelum go-live, dikombinasikan dengan staging New API (Bagian 13)

---

## 6. Model Monetisasi

- **Pay-as-you-go**: saldo dikonversi ke quota unit New API, markup per model (contoh: 1.3x–2x dari harga OpenRouter tergantung model)
- **Paket nominal**: contoh Rp10.000 → quota senilai Rp10.000 (dengan markup sudah termasuk di rate konversi)
- **Markup differential per tier:**

| Tier Model | Markup | Contoh Kategori |
|---|---|---|
| Murah | ~1.8x – 2x (80-100%) | Model entry-level, high volume |
| **Menengah** | **~1.5x – 1.6x (50-60%)** | Model "cukup pintar, harga wajar" — volume pemakaian tertinggi |
| Mahal | ~1.3x – 1.4x (30-40%) | Model flagship, tetap kompetitif buat heavy user |

- Buffer FX +10-15% di atas markup dasar untuk menyerap risiko kurs USD/IDR (lihat Bagian 9), sudah termasuk dalam angka markup di atas

### 6.1 Kebijakan Refund (final, termasuk klarifikasi FX)
- Full refund untuk kuota yang belum terpakai, kapan aja, via request ke support
- **Refund dihitung dari nilai saldo Rupiah yang tersisa saat request** — bukan dikonversi ulang ke USD lalu kembali ke Rupiah pakai kurs terbaru
- Buffer FX yang sudah termasuk di markup dianggap biaya operasional platform (proteksi platform selama kuota "hidup"), **tidak dikembalikan terpisah** saat refund
- Dipotong biaya admin Pakasir kalau ada (cek nominal fee di pricing Pakasir)
- Klausul ini wajib eksplisit tertulis di ToS sebelum launch, supaya tidak ada ambiguitas saat ada komplain

---

## 7. Requirement Non-Fungsional

| Aspek | Target |
|---|---|
| Uptime gateway | > 99% (New API auto-fallback antar channel) |
| Response time overhead | < 500ms tambahan dari New API di luar waktu proses model |
| Keamanan | API key user tidak pernah expose upstream key asli; rate limit per key; upstream key di secret manager |
| Skalabilitas | VPS minimal 2 vCPU/4GB RAM untuk awal, scale vertikal dulu sebelum horizontal |
| Kepatuhan | ToS eksplisit larang penyalahgunaan; comply UU PDP; status PPN jelas |

---

## 8. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| User abuse (spam request, bot) | Rate limit per key + monitoring anomali usage + playground quota terpisah |
| Race condition / overdraft saldo | Atomic deduction via Redis Lua script (Bagian 10.2) |
| Float/kerugian margin | Real-time quota deduction, hard spending limit harian/jam, reconciliation harian (Bagian 11) |
| Upstream provider suspend akun | Diversifikasi lebih dari 1 upstream, SOP incident response (Bagian 12), auto-refund request gagal |
| Payment webhook gagal/telat | Idempotency check by `order_id` + selalu double-check via Transaction Detail API Pakasir |
| Redis down/data loss | AOF persistence + Supabase sebagai source of truth + reconciliation berkala |
| Kebocoran upstream key | Secret manager, admin panel di belakang VPN, rotasi berkala 90 hari |
| Kompetitor dengan margin lebih tipis | Fokus ke UX lokal (QRIS, dashboard Bahasa Indonesia, support cepat) |

---

## 9. Currency/FX Exposure

- OpenRouter charge dalam USD, user bayar Rupiah — risiko kurs bergerak setelah top-up tapi sebelum kuota terpakai
- Risiko FX diserap ke buffer markup (+10-15% di atas markup dasar), bukan harga IDR dinamis mengikuti kurs — user developer/UMKM lebih suka harga tetap dan predictable
- Sinkronisasi kurs USD/IDR harian via cron, dipakai untuk *review* markup table secara berkala, bukan untuk ubah harga real-time per transaksi
- Lihat Bagian 6.1 untuk keterkaitan buffer FX dengan kebijakan refund

---

## 10. Keamanan & Abuse Prevention

### 10.1 Playground Quota
- Playground pakai **quota trial terpisah** (bukan saldo asli): 10-20 request/hari per user, reset harian
- Wajib login buat akses playground (tidak ada mode anonymous)
- Rate limit kombinasi IP + user_id
- Model yang tersedia di playground dibatasi ke tier murah saja — membatasi kerugian maksimal kalau ada abuse yang lolos

### 10.2 Atomic Quota Deduction
- Redis Lua script untuk atomic check-and-decrement (bukan read-then-write terpisah)
- Quota floor di 0 — request ditolak (HTTP 402/429) sebelum diteruskan ke upstream kalau saldo tidak cukup
- Reservasi token estimasi di awal request (dari `max_tokens`), lalu adjust ke angka aktual setelah response selesai
- Load test: simulasikan 50-100 concurrent request dari 1 API key, pastikan total charge = total token aktual

### 10.3 Hard Spending Limit
- Tabel `spending_limits` per user: limit harian & per jam (default + bisa di-override admin)
- Sliding window counter di Redis, dicek sebelum forward request ke New API
- User baru dapat limit lebih ketat di 24-48 jam pertama
- Alert Telegram (via n8n) kalau user mendekati/melewati limit dalam waktu singkat

### 10.4 Key Management
- Regenerate key instan (invalidate lama, generate baru) tanpa hapus history usage
- Masking: full key cuma tampil sekali saat generate pertama, selanjutnya format `sk-xxxx...abcd`
- Opsional IP whitelist per key (cek dukungan di New API)
- Auto-revoke key idle >6 bulan, dengan notifikasi email dulu

### 10.5 Signup & Account Abuse
- Verifikasi email wajib (OTP/magic link) sebelum generate API key pertama
- Rate limit signup per IP (maks 3 akun/IP/24 jam)
- Cloudflare Turnstile/captcha di form signup
- Batasi klaim trial quota per email/device fingerprint

### 10.6 Proteksi Upstream Key
- Simpan upstream key (OpenRouter, direct provider) di secret manager (Doppler/Infisical), bukan `.env` plaintext
- New API admin panel di belakang VPN/Tailscale + IP whitelist + 2FA, tidak expose ke internet publik
- Rotasi upstream key tiap 90 hari (runbook terjadwal)
- Firewall VPS: hanya buka port yang perlu, admin port ditutup dari luar

### 10.7 Monitoring Anomali
- Log metadata request (timestamp, model, token count, IP) — bukan isi prompt
- Flag: usage spike mendadak, pattern request identik berulang, key dipakai dari banyak IP dalam waktu singkat
- Threshold alert: kalau 1 key generate cost > X Rupiah/jam, trigger review manual

---

## 11. Reconciliation

### 11.1 Redis vs Supabase (internal)
- Supabase tetap source of truth untuk saldo; Redis hanya cache untuk kecepatan
- Job berjalan tiap beberapa menit: bandingkan counter Redis vs ledger Supabase
- Selisih signifikan → alert + auto-correct ke arah konservatif (proteksi platform)
- Redis diaktifkan AOF persistence, backup ke disk terpisah dari VPS utama

### 11.2 Internal Ledger vs Upstream (New API vs OpenRouter)
- Job harian (n8n) menarik usage report New API dan usage/invoice API OpenRouter, dibandingkan
- Selisih di atas threshold (misal >2%) → alert manual review, tidak auto-resolve
- Simpan hasil reconciliation harian sebagai log audit trail

---

## 12. Incident Response — Upstream Suspend/Failure

- SOP tertulis: langkah pertama saat OpenRouter/upstream down atau suspend mendadak (switch ke direct provider key jika ada, atau maintenance mode)
- **Auto-refund** untuk request yang gagal total karena kesalahan upstream (bukan kesalahan user) — deteksi dari response error code, jangan potong quota untuk request tanpa response valid
- Status page publik sederhana (Better Uptime atau sejenis)
- Kontak darurat/eskalasi ke OpenRouter support disiapkan dari awal

---

## 13. Staging Environment

- 1 instance New API terpisah khusus staging (VPS sama beda port, atau VPS kecil terpisah)
- Semua perubahan config gateway (markup, model baru, routing) di-test di staging dulu sebelum production
- Dikombinasikan dengan Pakasir sandbox untuk alur testing end-to-end (payment + gateway) sebelum go-live

---

## 14. Pajak & Invoice

- Keputusan awal: harga ditampilkan **sudah termasuk PPN** atau **exclusive** (ditambah saat checkout) — ditentukan sebelum launch, tergantung status PKP dari PT Ales Cipta Sejahtera
- Invoice minimal include: nomor invoice unik, tanggal, item (paket/model), subtotal, PPN (jika ada), total
- e-Faktur integration masuk fase 2 (tidak wajib untuk MVP kalau omzet masih di bawah threshold PKP)
- Perlu konsultasi ke konsultan pajak sebelum menentukan struktur final

---

## 15. Kepatuhan Data & Privasi (UU PDP)

- Default: tidak simpan isi prompt secara permanen, hanya metadata (token count, model, timestamp) untuk billing/abuse detection
- Kalau butuh log isi prompt untuk debugging, retensi terbatas (7-30 hari) lalu auto-purge
- Disclosure eksplisit di ToS/Privacy Policy: prompt user diteruskan ke upstream (OpenRouter → provider asli), yang punya kebijakan data masing-masing
- Opsi "privacy mode" per user/key yang menonaktifkan logging isi prompt sama sekali

### 15.1 Data Subject Rights
- Proses request hapus data: user ajukan via support → admin hapus data personal (nama, email, dll) dari Supabase
- Data transaksi finansial **dikecualikan** dari penghapusan (kewajiban retensi pajak/akuntansi — cek durasi pasti ke konsultan legal)
- Anonymize record transaksi yang tersisa (ganti identitas dengan ID anonim) daripada hapus total

---

## 16. Developer Onboarding & Dokumentasi

- Halaman `/docs`: quickstart guide, code snippet per bahasa (curl, Python, Node.js), referensi API interaktif (gaya Stripe docs)
- Generate dokumentasi dari OpenAPI spec New API supaya selalu sinkron dengan endpoint yang tersedia

---

## 17. Observability & Monitoring

- Error tracking: Sentry (frontend + backend)
- Uptime monitoring untuk gateway New API sendiri (bukan hanya upstream)
- Alert Telegram via n8n kalau health check gateway gagal

---

## 18. Model Catalog Sync

- Cron/webhook sync otomatis (via n8n) menarik harga terbaru OpenRouter, dibandingkan ke markup table
- Alert Telegram kalau margin suatu model di bawah threshold (misal <10%) atau negatif
- Snapshot histori harga disimpan di Supabase untuk audit trail

---

## 19. Reseller Tier — Pertimbangan KYC (Desain Awal, Eksekusi Fase 2)

- Field opsional di schema user sejak awal (nama usaha, nomor kontak bisnis, NPWP opsional), dikumpulkan hanya saat volume transaksi user lewati threshold tertentu (misal >Rp5 juta/bulan)
- Mitigasi risiko AML/fraud pada transaksi besar via Pakasir

---

## 20. Admin RBAC

- Minimal 2 role untuk MVP:
  - **Super Admin**: akses penuh (markup table, refund manual, suspend user, manajemen admin lain)
  - **Support**: akses terbatas (lihat data user, proses refund dalam batas nominal tertentu, tidak bisa ubah markup/config sistem)
- Log semua aksi admin (siapa ubah apa, kapan) — audit trail di tabel terpisah
- Detail halaman admin per fungsi — lihat Bagian 4.3

---

## 21. Metrik Sukses (v1)

- Jumlah user aktif bulanan (MAU)
- Total volume transaksi (Rupiah) per bulan
- Margin rata-rata (%) setelah biaya upstream
- Churn rate (user yang top-up sekali lalu tidak kembali)
- Uptime gateway
- Selisih reconciliation harian (indikator kesehatan sistem billing)

---

## 22. Prioritas Eksekusi

| Tahap | Fokus | Alasan |
|---|---|---|
| Sebelum launch (wajib) | 10.1, 10.2, 10.3, 11.1, 12 | Langsung cegah kerugian finansial & trust issue di hari pertama |
| Sebelum launch (legal) | 14, 15 | Risiko hukum — perlu konsultasi konsultan pajak/legal |
| Minggu pertama post-launch | 10.6, 11.2, 13 | Proteksi lapis kedua, penting tapi tidak memblokir launch |
| Bisa menyusul | 20 | Relevan begitu tim bertambah |

---

## 23. Open Questions

**Sudah terjawab:**
- ✅ Kebijakan refund: full refund kuota belum terpakai, dihitung dari nilai Rupiah tersisa, buffer FX tidak dikembalikan terpisah (Bagian 6.1)
- ✅ Gaya UI: minimalis & teknikal (referensi Vercel/Supabase)
- ✅ Payment gateway: Pakasir
- ✅ Playground: quota trial terpisah, bukan saldo asli (Bagian 10.1)
- ✅ Nama brand & domain: **PakaiKuota.id**
- ✅ Legal entity: **PT Ales Cipta Sejahtera** (menentukan struktur PPN di Bagian 14 — perlu dicek status PKP)
- ✅ Markup default per tier: murah ~1.8-2x, menengah ~1.5-1.6x, mahal ~1.3-1.4x (Bagian 6)
- ✅ Detail halaman & fungsionalitas (publik, user, admin) — Bagian 4

**Masih perlu diputuskan (tidak blocking untuk UI/UX, tapi perlu sebelum launch):**
- Timeline target soft launch?
- Status PKP PT Ales Cipta Sejahtera — menentukan harga inclusive/exclusive PPN (Bagian 14)
- Durasi retensi wajib data transaksi finansial (perlu konfirmasi konsultan pajak)
