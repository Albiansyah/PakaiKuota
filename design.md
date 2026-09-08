# Frontend Design Brief — PakaiKuota.cloud

**Untuk:** coding agent yang akan build dashboard & landing page
**Stack wajib:** Next.js (Vercel) + shadcn/ui + Tailwind
**Sumber kebenaran fitur:** PRD PakaiKuota v1.3 (arsitektur, roles, wallet lifecycle, error codes, pricing)
**Cara pakai dokumen ini:** semua keputusan di sini sudah final dan siap diimplementasikan langsung. Bagian yang masih butuh input eksplisit ditandai `[BUTUH INPUT USER]` di §9 — di luar itu, jangan tanya balik, jalankan sesuai brief.

---

## 1. Positioning & Kepribadian Brand

PakaiKuota adalah **reseller akses API LLM untuk pasar Indonesia** — value proposition-nya adalah kejelasan dan kemudahan: bayar QRIS/VA lokal, tanpa kartu kredit luar negeri, tanpa daftar satu-satu ke provider asing. Produk ini menyentuh **uang** dan **infrastruktur teknis** sekaligus — dua hal yang orang Indonesia biasanya skeptis kalau tidak terasa tegas dan jelas.

**Kepribadian brand (3 kata kunci):**
- **Tegas** — tidak ragu-ragu, tidak banyak basa-basi, tidak minta maaf berlebihan di error state. Bilang apa adanya: saldo kurang ya bilang saldo kurang, bukan "Ups, sepertinya ada sedikit kendala~"
- **Jelas** — angka (saldo, harga, token) selalu presisi dan mudah dipindai, bukan disembunyikan di balik jargon teknis.
- **Ringkas** — tidak ada dekorasi yang tidak perlu. UI dashboard untuk orang yang mau kerja cepat, bukan dijelajahi santai.

**Yang harus dihindari secara sadar** (supaya tidak jatuh ke template generik AI-generated):
- Background krem hangat + aksen terracotta/warna clay (kesan "template AI")
- Kartu-kartu seragam dengan border-radius & shadow abu-abu lembut yang sama di semua tempat
- Label ALL-CAPS di atas setiap section, eyebrow label yang tidak perlu
- Gradient dekoratif tanpa fungsi

---

## 2. Sistem Warna — dengan Alasan Psikologis

Base disesuaikan ke CSS variables shadcn (`--background`, `--primary`, dst). Semua warna di bawah untuk **light mode** sebagai default; siapkan juga varian dark mode dengan lightness disesuaikan (jangan cuma invert).

| Token | Hex | Peran | Alasan psikologis |
|---|---|---|---|
| `--primary` | `#122542` (navy gelap pekat) | Warna utama — nav, header, elemen struktural | Biru gelap = kepercayaan, stabilitas, kompetensi teknis. Ini warna yang dipakai institusi finansial supaya orang percaya nyimpen saldo di sini. |
| `--accent` | `#F0A93B` (amber/kuning kuota) | CTA utama, angka harga, elemen yang harus "ditangkap mata duluan" | Amber = energi, kejelasan, dan asosiasi dengan nilai/emas — kontras tinggi terhadap navy tanpa terasa alarm seperti merah. Dipakai HANYA untuk aksi & angka penting, bukan dekorasi, supaya tetap "tegas" bukan ramai. |
| `--success` | `#1F9E6E` (emerald) | Status `completed`, `credited`, saldo bertambah | Hijau = aman, transaksi berhasil, saldo cukup. |
| `--destructive` | `#D64545` (crimson) | Status `failed`, `REVOKED`, `INSUFFICIENT_BALANCE`, aksi revoke | Merah untuk kondisi yang benar-benar butuh perhatian user — dipakai tegas, bukan lembut/pastel, supaya tidak diabaikan. |
| `--warning` | `#D97B2E` (burnt orange, beda dari accent) | `RATE_LIMITED`, `QUOTA_EXCEEDED`, hold/pending states | Sengaja dibedakan dari `--accent` supaya user tidak bingung antara "ini tombol aksi" vs "ini peringatan". |
| `--background` | `#FAFAF9` (light) / `#0B1220` (dark) | Latar utama | Netral, bukan krem hangat (hindari kesan template) — sedikit dingin untuk menguatkan kesan navy/tegas. |
| `--muted` | `#EEF1F5` | Card sekunder, table striping | Abu kebiruan sangat pucat, selaras dengan navy tanpa berat. |

**Aturan pemakaian:** amber (`--accent`) adalah satu-satunya warna yang boleh "menyala" di layar — reserved untuk harga, CTA utama ("Beli Kuota", "Generate API Key"), dan angka saldo. Kalau semua warna dipakai rata, tidak ada yang terasa tegas. Satu warna yang benar-benar berani di satu tempat > semua warna medium di semua tempat.

---

## 3. Tipografi

Dua keluarga font, peran jelas berbeda:

- **Display/Headline & UI label:** font grotesk geometris yang tegas — contoh: **General Sans** atau **Instrument Sans** (bukan Inter default, terlalu netral untuk kesan "tegas"). Weight 600–700 untuk headline, 500 untuk label UI.
- **Angka (harga, saldo, token count, tabel usage log):** font monospace dengan tabular figures — contoh: **IBM Plex Mono** atau **JetBrains Mono**. Ini penting secara fungsional, bukan gaya: di dashboard billing, angka Rupiah dan token HARUS align rapi secara vertikal di tabel, dan monospace bikin perbedaan digit (mis. Rp 120.000 vs Rp 1.200.000) langsung kebaca tanpa harus dihitung digit-nya.
- **Body text (paragraf, deskripsi, copy):** sans-serif yang sama dengan display tapi weight 400, size 14–15px untuk densitas dashboard.

Line length body max ~80 karakter. Jangan pakai ALL-CAPS untuk label section — cukup weight lebih tebal dan `letter-spacing` sedikit saja kalau perlu differentiasi.

---

## 4. Prinsip Layout

- **Table/list-first, bukan card-first.** Data seperti usage log, wallet ledger, dan daftar API key adalah data tabular berulang — tampilkan sebagai tabel shadcn (`<Table>`) dengan kolom rapi dan angka rata kanan, BUKAN dipecah jadi kartu-kartu individual (itu default generik yang harus dihindari sesuai §1).
- **Card dipakai terbatas** — hanya untuk 3–4 metrik ringkasan di atas dashboard (saldo tersedia, spend bulan ini, request hari ini, active keys) dan untuk pricing tier comparison (§5). Di luar itu, pakai tabel/list.
- **Sidebar navigasi kiri, fixed**, bukan navbar horizontal — cocok untuk density dashboard.
- **Alignment:** kiri-align untuk teks & tabel, kanan-align untuk semua kolom angka/Rupiah/token.
- Satu momen motion yang disengaja per interaksi penting (mis. saat generate API key baru: reveal sekali dengan sedikit animasi "muncul" untuk menandai "ini cuma keliatan sekali", bukan animasi hover di semua tempat).

---

## 5. Menampilkan Harga (Psikologi Harga + Kejelasan)

Fitur pricing dari backend: tier model (Standard/Premium/Ultra), paket durasi (Pemula 7 hari / Harian 14 hari / Pro 30 hari), custom purchase nominal bebas.

**Aturan tampilan harga:**
1. **Selalu Rupiah, selalu eksplisit "Rp".** Jangan tampilkan angka USD di UI customer sama sekali (itu detail internal upstream cost, bukan urusan user — lihat PRD §3.1).
2. **Harga per 1.000 token ditampilkan sebagai satuan utama**, dengan estimasi konversi kasar ("≈ X request chat" atau semacamnya) sebagai bantuan kontekstual kecil di bawahnya — angka mentah token sulit dibayangkan orang awam.
3. **Comparison table untuk 3 tier** (`shadcn Card` + `Table` hybrid: 3 kolom card berdampingan, isi tabel fitur di dalamnya) — tier tengah (Premium) sedikit ditonjolkan (border `--accent`, bukan badge "Popular" generik — biarkan visual hierarchy yang bicara).
4. **Paket durasi ditampilkan sebagai pilihan radio/segmented control**, bukan dropdown — supaya user langsung lihat semua opsi tanpa klik tambahan (sesuai prinsip "tegas", tidak menyembunyikan pilihan).
5. **Custom purchase:** input nominal dengan live-calculated output token estimate di sampingnya, update real-time saat user ketik.
6. Warna angka harga = `--accent` (amber), konsisten di semua tempat harga muncul (landing, checkout, dashboard).

---

## 5a. Wordmark / Logo — Arah Desain (belum ada aset existing)

Belum ada logo, jadi arah berikut jadi panduan buat agent atau desainer yang mengeksekusi nanti:

- **Bentuk:** wordmark teks ("PakaiKuota"), bukan simbol abstrak — nama brand-nya sendiri sudah deskriptif dan mudah diingat, tidak perlu ikon tambahan yang malah mengaburkan. Kalau mau ada mark kecil, cukup elemen geometris sederhana yang bisa jadi favicon (mis. bentuk sinyal/gelombang data yang dipotong tegas, bukan gradient/3D).
- **Warna:** navy (`--primary`) sebagai warna dasar wordmark, dengan kemungkinan aksen amber (`--accent`) pada satu elemen kecil saja (mis. titik di huruf "i", atau underline pendek) — konsisten dengan prinsip §2: satu aksen berani, sisanya tenang.
- **Karakter tipografi logo:** tegas, geometris, sedikit condensed — selaras dengan font display di §3. Hindari huruf bulat/playful (tidak cocok dengan positioning "tegas" dan produk yang menyangkut uang).
- **Uji cepat:** wordmark harus tetap terbaca jelas di ukuran favicon 16×16px (disederhanakan jadi monogram "PK" kalau perlu) dan di atas background navy gelap (dashboard) maupun terang (landing page).

---

## 6. Peta Halaman (dari fitur backend yang sudah dikonfirmasi)

| Halaman | Role | Komponen shadcn utama |
|---|---|---|
| Landing / marketing | Publik | Hero, pricing tier cards (§5), FAQ accordion |
| Register / Login | Publik | Form, Input, Button |
| Dashboard Home | `user` | Card ringkasan (saldo, spend, request hari ini), Table (aktivitas terbaru) |
| API Keys | `user` | Table (daftar key), Dialog (generate — plaintext tampil sekali, pakai `Alert` untuk warning "simpan sekarang"), Badge (status active/revoked) |
| Topup / Beli Kuota | `user` | Tabs (paket vs custom), RadioGroup, pricing display §5, redirect ke Pakasir checkout |
| Riwayat Transaksi | `user` | Table dengan status stepper (`pending → paid → credited`), Badge per status |
| Usage Log | `user` | Table dengan filter (model, tanggal, status), kolom token & cost rata kanan (font mono) |
| Wallet Ledger / Mutasi Saldo | `user` | Table statement-style: kolom `balance_before → balance_after`, running balance |
| Refund | `user` | Form pengajuan, Table status (`requested/approved/rejected`) |
| Playground / API Tester | `user` | Panel split: form request (pilih model, system/user message, `temperature`/`max_tokens`) di kiri, response viewer (termasuk mode streaming) di kanan; `Tabs` untuk lihat equivalent `curl`/JS snippet; tampilkan estimasi & actual cost dari request itu langsung di panel — ini titik paling pas buat user paham konkret "1x coba = segini Rupiah" |
| Settings | `user` | Form profil, info rate limit saat ini |
| Admin — Users & Transactions | `support`/`super_admin` | Table dengan aksi terbatas sesuai role (§4 PRD) |
| Admin — Model & Pricing | `super_admin` | Table editable, Dialog untuk ubah markup |
| Admin — Reconciliation Alerts | `super_admin` | Table dengan severity Badge (pakai `--destructive` untuk `alert`) |
| Admin — Audit Log | `super_admin` | Table read-only, filter by action/admin |

---

## 7. Status & Error State → Komponen

Mapping error code dari PRD §8.2 ke UI, konsisten di semua tempat:

| Kondisi backend | Komponen | Warna | Copy tone |
|---|---|---|---|
| `INSUFFICIENT_BALANCE` | `Alert` (destructive) di titik aksi (mis. saat mau pakai API key di playground) | `--destructive` | "Saldo tidak cukup untuk request ini. Isi ulang untuk lanjut." — bukan "Maaf, sepertinya saldo Anda..." |
| `API_KEY_REVOKED` / revoke aksi | `Badge` abu + strikethrough pada key row | `--muted-foreground` | "Dicabut" + timestamp |
| `RATE_LIMITED` | `Alert` (warning) | `--warning` | "Terlalu banyak request. Coba lagi dalam beberapa saat." |
| `ACCOUNT_SUSPENDED` | Full-page block, bukan toast | `--destructive` | Jelas & langsung: "Akun disuspend. Hubungi support untuk detail." |
| Topup `pending` | `Badge` outline + spinner kecil | `--warning` | "Menunggu pembayaran" |
| Topup `credited` | `Badge` solid | `--success` | "Berhasil" |
| Usage `failed` (termasuk `timeout_orphaned_hold`) | Baris tabel abu, badge merah muted | `--destructive` (muted variant) | "Gagal — saldo tidak dipotong" (selalu tegaskan ini, karena ini poin trust utama) |
| Empty state (belum ada API key / belum ada transaksi) | Ilustrasi minimal + 1 CTA jelas | — | Ajakan bertindak langsung: "Generate API key pertama kamu" — bukan paragraf penjelasan panjang |

Prinsip nulis error (ikut PRD & prinsip tegas): **tidak minta maaf, langsung bilang apa yang terjadi dan apa yang harus dilakukan user.**

---

## 8. Komponen shadcn yang Dipakai (checklist implementasi)

`Button`, `Input`, `Table`, `Card`, `Badge`, `Alert`, `Dialog`, `Tabs`, `RadioGroup`, `Accordion`, `Dropdown Menu` (admin actions), `Sheet` (mobile nav), `Skeleton` (loading state tabel), `Toast/Sonner` (konfirmasi aksi ringan seperti "API key disalin"), `Separator`.

Kustomisasi wajib di `globals.css` / `tailwind.config`: override token warna sesuai §2, radius default **kecil** (`--radius: 0.375rem`) — bukan radius besar ala SaaS kit generik, supaya kesan tetap tegas bukan "friendly rounded".

---

## 9. Keputusan yang Sudah Dikonfirmasi

Brief ini sudah final, tidak ada lagi bagian yang menunggu keputusan:

1. **Aset brand** — belum ada logo/wordmark existing. Desain dari nol mengikuti arah di §5a (wordmark navy + aksen amber, geometris-tegas).
2. **Daftar halaman** — peta halaman di §6 dipakai apa adanya sebagai scope MVP; tidak ada halaman tersembunyi dari PRD v1.0 yang perlu ditambahkan.
3. **Playground/API tester** — masuk MVP, sudah ditambahkan sebagai baris tersendiri di §6, termasuk requirement tampilkan estimasi & actual cost langsung di panel.

Agent bisa langsung mulai implementasi dari brief ini tanpa perlu klarifikasi tambahan.

