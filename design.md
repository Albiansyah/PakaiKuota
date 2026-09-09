# Prompt: Redesign Total Halaman Admin "PakaiKuota"

SEBELUM LANJUT HARUS MEMBACA ANTISLOP-ID.md
## Konteks
Redesign total halaman **admin dashboard** aplikasi PakaiKuota (Next.js, deployed di Vercel). Saat ini tampilan admin masih sangat basic: sidebar statis tanpa grouping, semua card/section punya style form HTML polos, button belum konsisten, dan tidak ada sistem notifikasi. Tujuannya: bikin admin panel yang modern, interaktif, ringan, dan konsisten menggunakan **shadcn/ui**.

Halaman yang perlu di-cover (minimal, sesuaikan dengan struktur project yang ada):
- Ringkasan (dashboard overview)
- Users
- Transaksi
- Refund queue
- Token packages
- NewAPI config
- Model & pricing
- Reconciliation

## Tujuan Utama
1. **Redesign total UI/UX**, bukan cuma tempel style di komponen lama.
2. Gunakan **shadcn/ui** sebagai design system utama (jangan mix dengan library UI lain yang bikin bundle berat).
3. Performa harus **ringan** — hindari re-render berlebihan, lazy load komponen berat, minimalkan dependency.
4. Sidebar diberi **struktur dropdown/collapsible (nested navigation)**, bukan flat list.
5. Layout antar **container/card tertata rapi** dengan spacing & hierarchy yang jelas.
6. **Button** dibuat konsisten (variant, size, warna sesuai konteks aksi).
7. Ada **sistem notifikasi** (toast) untuk feedback aksi user (sukses, error, warning, loading).

## Detail Requirement

### 1. Sidebar Navigation
- Gunakan komponen `Sidebar` dari shadcn/ui (`sidebar-07` / block sidebar terbaru) sebagai basis, bukan bikin dari nol.
- Group menu berdasarkan kategori, contoh:
  - **Overview** → Ringkasan
  - **Manajemen** → Users, Transaksi, Refund queue
  - **Konfigurasi** → NewAPI config, Model & pricing, Token packages
  - **Laporan** → Reconciliation
- Setiap group bisa **expand/collapse (accordion/dropdown)** menggunakan `Collapsible` dari shadcn.
- Highlight menu aktif sesuai route saat ini (gunakan `usePathname` di Next.js).
- Sidebar bisa di-collapse jadi icon-only mode (toggle di header) untuk hemat ruang di layar kecil.
- Tampilkan info admin (email, role) di bagian bawah sidebar dalam bentuk dropdown menu (`DropdownMenu`) berisi: profile, logout, switch ke dashboard user.

### 2. Layout & Container
- Gunakan grid/flex layout yang konsisten, dengan max-width container dan padding seragam di semua halaman.
- Setiap section (misal "Konfigurasi NewAPI", "Rate Limiting", "Paket Token") dibungkus dalam `Card` shadcn (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) — bukan div polos dengan border manual.
- Beri jarak (gap) yang konsisten antar card (misal `space-y-6` atau `gap-6` di grid).
- Untuk halaman dengan banyak section (seperti NewAPI config), pertimbangkan pakai `Tabs` shadcn untuk memecah jadi beberapa tab (misal: "API Config", "Rate Limiting", "Paket Token") agar tidak terlalu panjang scroll ke bawah.
- Form input pakai `Input`, `Label`, `Switch`/`Checkbox`, `Select` dari shadcn — termasuk field seperti "Aktifkan NewAPI" yang sekarang masih checkbox HTML biasa.
- Untuk field sensitif (API Key) tambahkan tombol show/hide (icon eye) dan tombol copy.

### 3. Button Consistency
- Definisikan aturan jelas kapan pakai variant apa:
  - `default` → aksi utama/simpan (misal "Simpan Perubahan")
  - `outline` / `secondary` → aksi sekunder (misal "Batal", "Kelola Paket Token")
  - `destructive` → aksi berbahaya (hapus, refund, disable)
  - `ghost` → aksi minor di dalam tabel/list (edit icon, dsb)
- Tambahkan **loading state** pada button saat submit (disable + spinner, gunakan `Loader2` dari lucide-react).
- Ukuran button konsisten per konteks (form action pakai `default`/`lg`, table row action pakai `sm`/`icon`).
- Sticky action bar di bagian bawah form panjang (misal "Simpan" tetap terlihat saat scroll) jika halaman terlalu panjang.

### 4. Notifikasi (Toast)
- Implementasi sistem toast global menggunakan `sonner` (rekomendasi shadcn saat ini) atau `Toast`/`Toaster` dari shadcn/ui.
- Trigger toast untuk:
  - Sukses simpan konfigurasi
  - Error validasi / gagal request API
  - Warning (misal markup > 100%, rate limit di-set 0 berarti unlimited — kasih info)
  - Loading/pending state untuk aksi async yang agak lama (misal test koneksi ke NewAPI)
- Posisi toast konsisten (misal top-right), auto-dismiss dengan durasi wajar, tapi tetap bisa di-dismiss manual.
- Untuk aksi destruktif (hapus user, reject refund) gunakan `AlertDialog` konfirmasi sebelum eksekusi, baru munculkan toast hasilnya.

### 5. Data Display (Users, Transaksi, Refund queue, Reconciliation)
- Gunakan `Table` shadcn/ui + `DataTable` pattern (dengan `@tanstack/react-table` jika belum ada) untuk:
  - Sorting per kolom
  - Search/filter
  - Pagination
  - Bulk action (checkbox select row) jika relevan (misal approve banyak refund sekaligus)
- Status (misal status transaksi, status refund) ditampilkan pakai `Badge` dengan warna sesuai state (success/warning/destructive/secondary).
- Tambahkan skeleton loading (`Skeleton` dari shadcn) saat data sedang fetch, jangan blank/spinner penuh layar.

### 6. Dashboard "Ringkasan"
- Tambahkan beberapa `Card` metrics ringkas di atas (total user, total transaksi, revenue, saldo NewAPI, dsb) dengan angka besar + trend indicator kecil (naik/turun).
- Bisa tambahkan chart ringan (pakai `recharts`, sudah kompatibel dengan shadcn `Chart` component) untuk tren transaksi/revenue harian.

### 7. Responsiveness & Performance
- Pastikan semua halaman responsive: sidebar auto-collapse jadi `Sheet` (drawer) di mobile.
- Split component besar, gunakan `dynamic import` untuk komponen berat (chart, modal besar) agar initial load ringan.
- Hindari fetch data berlebihan di client — gunakan server component / server actions Next.js sebisa mungkin, fetch client hanya untuk data yang perlu real-time/interaktif.
- Pastikan dark mode tetap konsisten (jika sudah ada) menggunakan CSS variable shadcn, jangan hardcode warna.

## Deliverable yang Diharapkan dari Agent
1. Struktur folder komponen baru (misal `components/admin/sidebar.tsx`, `components/admin/nav-*.tsx`, dll) mengikuti pattern shadcn block.
2. List shadcn component yang perlu di-install (`npx shadcn add ...`) sebelum mulai coding.
3. Refactor halaman satu per satu sesuai urutan prioritas: **Sidebar & Layout → NewAPI Config → Ringkasan → Users/Transaksi/Refund (table pattern) → Token packages/Model & pricing → Reconciliation**.
4. Setelah tiap halaman selesai, tunjukkan ringkasan perubahan (component apa yang dipakai, kenapa) sebelum lanjut ke halaman berikutnya.
5. Tidak menghapus fungsionalitas existing (semua field, tombol, dan logic yang sudah ada harus tetap berjalan, hanya UI/UX & struktur kode yang di-upgrade).

## Catatan Tambahan
- Jangan install library UI tambahan selain shadcn/ui + lucide-react + sonner (untuk toast) + recharts (untuk chart) kecuali benar-benar diperlukan, demi menjaga bundle tetap ringan.
- Ikuti convention penamaan & struktur project Next.js yang sudah ada, cek dulu struktur folder sebelum generate file baru.