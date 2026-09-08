# PRD Fase 2 — PakaiKuota.id

**Status:** Draft v0.1
**Turunan dari:** PRD-API-Reseller-Platform.md, PRD-UIUX-Simpul.md
**Tanggal:** 31 Agustus 2026

---

## 1. Ringkasan

PRD ini mencakup 7 area kerja lanjutan setelah landing page dasar & database schema selesai: fix theme mode, fix i18n, fitur paket harga baru, kickoff konfigurasi New API, akun admin, pengayaan dashboard, dan integrasi Pakasir.

---

## 2. Fix: Light Mode Belum Berfungsi

### Diagnosis

Dari `globals.css` yang sudah ada, root cause-nya: token warna (`--bg-base`, `--text-primary`, dkk) didefinisikan **langsung di `:root` tanpa varian terang**, jadi berapa pun toggle theme di-klik, CSS value-nya gak pernah berubah — semua komponen selalu baca nilai dark yang sama. Ini bukan bug logic di theme-provider, tapi memang token light mode-nya belum pernah ditulis.

### Fix

1. Cek `src/components/providers/theme-provider.tsx` — pastikan dia toggle attribute (`class="dark"` atau `data-theme="dark"`) di elemen `<html>`. Kalau pakai `next-themes`, defaultnya `attribute="class"`.
2. Di `globals.css`, pisahkan token jadi 2 set: default (`:root`, dipakai sebagai light) dan override (`.dark`, dipakai kalau class `dark` aktif di `<html>`):

```css
:root {
  /* Light mode (default) */
  --bg-base: #FFFFFF;
  --bg-surface: #F5F6F7;
  --bg-surface-hover: #ECEDEF;
  --border-color: #E2E4E8;
  --text-primary: #14171B;
  --text-secondary: #5B6470;
  --text-tertiary: #9AA3AE;
  --accent: #F5A623;
  --accent-text: #A66A00;  /* varian lebih gelap khusus dipakai sebagai warna TEKS, karena #F5A623 kontrasnya kurang di atas putih */
  --accent-hover: #E09415;
  --success: #1A7F37;
  --warning: #A66A00;
  --error: #CF222E;
}

.dark {
  /* Dark mode (yang sudah ada sekarang) */
  --bg-base: #0B0D10;
  --bg-surface: #14171B;
  --bg-surface-hover: #1B1F24;
  --border-color: #262B31;
  --text-primary: #EDEFF2;
  --text-secondary: #9AA3AE;
  --text-tertiary: #5B6470;
  --accent: #F5A623;
  --accent-text: #F5A623;
  --accent-hover: #FFB93D;
  --success: #3FB950;
  --warning: #F5A623;
  --error: #F85149;
}
```

3. Ganti setiap pemakaian `text-[var(--accent)]` untuk teks (bukan background tombol) menjadi `text-[var(--accent-text)]`, biar kontras tetap aman di light mode (lihat contoh headline "harga terjangkau" di landing page — itu pakai accent sebagai warna teks langsung).
4. Cek `@theme inline` di bagian atas `globals.css` — blok itu pakai `oklch()` dan sepertinya gak dipakai sama sekali di komponen (semua komponen akses lewat `var(--accent)` dkk langsung, bukan lewat utility Tailwind `bg-accent`). Kalau benar gak dipakai, hapus biar gak ada 2 sumber kebenaran warna yang beda-beda.
5. Default theme: sarankan tetap **dark** (sesuai brief awal, developer-first product), tapi user bisa toggle manual, dan preferensi disimpan (localStorage via next-themes otomatis handle ini).

---

## 3. Fix: Bahasa Cuma Jalan di Navbar

### Diagnosis

`footer.tsx` sudah benar pakai `t("nav.docs")` dkk dari `useLanguage()`. Tapi `page.tsx` (landing) semua teksnya **hardcoded string Indonesia langsung** ("API LLM dengan harga terjangkau", "Bayar pakai QRIS...", dst) — gak lewat fungsi `t()` sama sekali. Ini kemungkinan besar sama di semua halaman lain (`/pricing`, `/docs`, dashboard, dll) kecuali navbar yang emang dari awal sudah pakai `t()`.

### Fix

1. Audit semua file `.tsx` di `src/app/` dan `src/components/` — cari semua string UI yang hardcoded Bahasa Indonesia.
2. Pindahkan semua string itu ke dictionary translasi (cek struktur yang sudah ada di `language-provider.tsx` — kemungkinan ada file `id.json`/`en.json` atau object literal di dalam provider itu sendiri).
3. Ganti setiap teks hardcoded jadi `{t("key.yang.sesuai")}`, dengan penamaan key yang konsisten per halaman, contoh:
```
hero.title, hero.subtitle, hero.cta_primary, hero.cta_secondary
features.qris.title, features.qris.description
models.section_title, models.section_subtitle
```
4. Prioritas halaman: landing (`page.tsx`) dulu karena paling sering dilihat, lalu `/pricing`, `/docs`, baru dashboard.
5. Tambahkan ke checklist QA: toggle bahasa di navbar, screenshot tiap halaman di kedua bahasa, pastikan tidak ada teks yang "ketinggalan" di Bahasa Indonesia saat mode English aktif (atau sebaliknya).

---

## 4. Fitur Baru: Paket Harga 7/14/30 Hari + Custom

Sesuai keputusan: **paket ini tambahan**, bukan pengganti pay-as-you-go yang sudah ada — user tetap bisa top-up bebas seperti biasa, paket ini opsi kedua buat yang mau komitmen di awal dengan harga lebih pasti.

### 4.1 Struktur Paket

| Paket | Durasi aktif | Kuota (contoh) | Catatan |
|---|---|---|---|
| Starter | 7 hari | Rp 50.000 setara kuota | Buat coba-coba/testing |
| Standard | 14 hari | Rp 150.000 setara kuota | Paling umum buat side project |
| Pro | 30 hari | Rp 400.000 setara kuota | Buat produksi kecil |
| Custom | N hari (input bebas) | Rp X (input bebas) | Formula di bawah |

*(Nominal contoh di atas placeholder — perlu dikalibrasi tim/lo sendiri berdasar margin riil.)*

### 4.2 Formula Harga Custom (Otomatis)

```
Total Harga = Nilai Kuota (Rp) + Biaya Durasi
Biaya Durasi = Tarif Harian × Jumlah Hari
```

- **Nilai Kuota (Rp)**: langsung 1:1 sama seperti top-up biasa (markup per model sudah include di dalamnya, gak perlu hitung ulang).
- **Tarif Harian**: makin panjang durasi, makin murah tarif per harinya (insentif komitmen lebih lama) — contoh degresif:

| Durasi | Tarif harian |
|---|---|
| 1–7 hari | Rp 500/hari |
| 8–14 hari | Rp 400/hari |
| 15–30 hari | Rp 300/hari |
| >30 hari | Rp 250/hari |

- Custom package otomatis pakai tarif sesuai bracket durasi yang diinput user, dihitung real-time di form sebelum checkout (jadi user lihat harga sebelum bayar, gak perlu approval manual admin).
- Kalau kuota custom habis sebelum durasi berakhir, key nonaktif (atau tawarkan top-up tambahan tanpa perlu beli paket baru — opsional, bisa didiskusikan).
- Kalau durasi habis tapi kuota masih sisa: sisa kuota otomatis convert balik ke saldo pay-as-you-go biasa (bukan hangus) — ini konsisten sama kebijakan refund "full refund kapan aja" yang sudah ditetapkan.

### 4.3 Halaman `/pricing` — Struktur UI

- 3 card paket tetap (Starter/Standard/Pro) ditampilkan berdampingan, highlight salah satu sebagai "Paling Populer" (biasanya Standard).
- Di bawahnya, section terpisah "Butuh durasi/kuota lain?" dengan form custom: input jumlah hari (number) + input nominal kuota (Rp) → live preview total harga sebelum checkout.
- Tetap tampilkan opsi pay-as-you-go di bagian atas/terpisah dengan jelas, biar user paham dua model ini bisa dipilih independen.

---

## 5. Kickoff Konfigurasi New API

Ini belum pernah di-setup untuk PakaiKuota (catatan: endpoint `ai.bluepack.my.id` yang lo pakai di Claude Code itu punya orang lain, cuma buat pemakaian pribadi lo — beda sama New API instance yang PakaiKuota butuh sebagai backend sendiri).

### Langkah Kickoff

1. **Provision VPS** — minimal 2 vCPU/4GB RAM (Hetzner/Contabo sesuai riset sebelumnya).
2. **Deploy New API via Docker Compose** — butuh 3 service: New API app, MySQL/PostgreSQL (data channel & user), Redis (cache quota).
3. **First boot**: New API generate akun admin default (biasanya `root`/password random atau perlu di-set env var awal) — **segera ganti password default ini**, jangan biarkan default.
4. **Setup Channel (upstream)**: tambahkan OpenRouter sebagai channel pertama — masukkan API key OpenRouter di dashboard New API, test dengan 1 model dulu (misal `gpt-4o-mini`) sebelum aktifin semua model.
5. **Setup Token/Key untuk internal**: New API punya konsep "token" per user internal-nya sendiri — ini BUKAN yang langsung dikasih ke end-user PakaiKuota, tapi dipetakan lewat backend app lo (New API jadi infrastruktur, bukan front-facing).
6. **Konek ke app PakaiKuota**: backend app (Next.js API routes) manggil New API REST API buat provision key/quota tiap kali user top-up atau generate key baru — ini nyambung ke schema `api_keys` yang sudah ada di Supabase.
7. **Test end-to-end**: dari Playground di dashboard PakaiKuota, kirim 1 request beneran, pastikan alurnya: request → New API → OpenRouter → response balik → quota ke-deduct di New API → sinkron ke `usage_logs` Supabase.

---

## 6. Akun Admin

Rekomendasi: **script seed otomatis** via Supabase Admin API (bukan insert manual SQL langsung, karena `auth.users` dikelola Supabase Auth, gak bisa di-insert manual dengan aman — perlu lewat Admin API biar password ke-hash bener).

### Langkah

1. Bikin script Node.js sekali-jalan (`scripts/seed-admin.ts` atau `.js`) yang pakai **Supabase Service Role Key** (bukan anon key — ini kredensial sensitif, taruh di `.env.local`, JANGAN commit ke git):

```js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role, bukan anon key
)

async function seedAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@pakaikuota.id',
    password: 'admin123',
    email_confirm: true,
  })
  if (error) throw error

  await supabase.from('users').update({ role: 'super_admin' }).eq('id', data.user.id)
  console.log('Admin created:', data.user.id)
}

seedAdmin()
```

2. Jalankan sekali: `node scripts/seed-admin.ts`, lalu **ganti password lewat halaman login setelahnya** (jangan biarkan password di script tetap jadi password aktif).
3. Tambahkan middleware/route guard di `/admin/*` yang cek `role === 'super_admin' || role === 'support'` dari tabel `users`, redirect ke `/` kalau bukan.

---

## 7. Eksplorasi Dashboard — User & Admin (Biar Gak Terlalu Simple)

### 7.1 Dashboard User — Ide Pengayaan

- **Usage chart** yang lebih dari sekadar angka: breakdown per model (donut chart persentase pemakaian), tren harian (line chart 7/30 hari terakhir)
- **Cost projection**: "Dengan pola pemakaian saat ini, saldo lo cukup buat ~X hari lagi" — proaktif kasih warning sebelum saldo habis
- **API key health**: indikator kapan terakhir dipakai, kalau ada key yang gak dipakai >30 hari, kasih saran revoke
- **Notifikasi in-app**: saldo hampir habis, model baru ditambahkan, harga model berubah
- **Quick actions widget**: shortcut "Top up Rp50rb" langsung dari dashboard home tanpa harus ke halaman topup

### 7.2 Dashboard Admin — Ide Pengayaan

- **Margin monitor real-time**: per model, tampilkan upstream cost vs revenue, alert kalau margin di bawah threshold (nyambung ke section Model Catalog Sync di PRD sebelumnya)
- **User activity feed**: siapa yang baru daftar, siapa yang top-up besar, siapa yang mendekati limit — biar admin bisa proaktif follow-up (terutama buat calon reseller B2B)
- **Reconciliation dashboard**: visualisasi dari tabel `reconciliation_logs` yang sudah ada di schema — highlight kalau ada selisih Redis vs Supabase atau internal vs upstream
- **Refund queue**: daftar request refund yang perlu diproses, dengan estimasi nominal otomatis dari sisa kuota real-time
- **Broadcast/announcement tool**: admin bisa kirim notifikasi ke semua user (misal pengumuman maintenance) dari dashboard, gak perlu manual query DB

---

## 8. Integrasi Pakasir

**Kredensial** (sudah didapat, taruh di `.env.local` — JANGAN commit ke repo, terutama kalau repo bakal public):
```
PAKASIR_SLUG=pakaikuota
PAKASIR_API_KEY=ok80sD1TPz5p0ssZafwqanpPu8TrZlCU
```

⚠️ Catatan keamanan: key ini sudah pernah lo ketik di chat ini — pastikan gak ke-commit ke git history dari awal. Kalau project ini nanti mau di-push ke GitHub, cek dulu `.gitignore` udah include `.env.local` sebelum commit pertama.

### Implementasi (sesuai PRD sebelumnya, sekarang dengan kredensial nyata)

1. Endpoint top-up di backend app manggil `POST /api/transactioncreate/qris` (atau `/va`) pakai `PAKASIR_API_KEY` dari env, project slug `pakaikuota`.
2. Simpan `order_id` yang di-generate ke tabel `transactions` (schema sudah ada) sebelum redirect user ke halaman pembayaran.
3. Webhook Pakasir masuk → jangan langsung percaya payload → selalu konfirmasi ulang via `GET /api/transactiondetail` sebelum update `balance_rupiah` di tabel `users`.
4. Test dulu di mode sandbox (kalau Pakasir sediakan `paymentsimulation`) sebelum live beneran dengan uang asli.

---

## 9. Prioritas Eksekusi

Urutan yang gw saranin (technical dependency + risk):

1. **Fix light mode & i18n** — ini bug kecil tapi visible ke semua user, cepat dikerjain, langsung ningkatin kesan profesional
2. **Setup New API** — blocker buat semua fitur lain yang butuh koneksi real ke model (playground, generate key beneran)
3. **Integrasi Pakasir** — perlu New API jalan dulu biar top-up bisa langsung nyambung ke provisioning quota
4. **Akun admin** — bisa paralel kapan aja, gak dependent ke yang lain
5. **Halaman pricing paket** — bisa dikerjain paralel dari sisi UI, tapi baru bisa live penuh setelah New API & Pakasir jalan
6. **Pengayaan dashboard** — terakhir, karena butuh data real (usage, transaksi) buat masuk akal ditest

---

## 10. Open Questions

- Nominal kuota & tarif harian paket di section 4 masih placeholder — perlu dikalibrasi berdasar margin target lo yang sebenarnya
- Kalau kuota paket habis sebelum durasi selesai: auto top-up atau nonaktif total? (section 4.2)
- Support/live chat buat user di dashboard — masuk scope sekarang atau nanti?
