Gue mau lu melakukan AUDIT MENYELURUH terhadap sistem payment/top-up yang saat ini ada di direktori project ini.

JANGAN LANGSUNG NGODING.
JANGAN HAPUS / REFACTOR BESAR-BESARAN.
JANGAN MENGUBAH DATABASE, API, PAYMENT FLOW, ATAU BILLING SEBELUM AUDIT SELESAI DAN LU MELAPORKAN HASILNYA.

PROJECT:
PakaiKuota
Lokasi:
D:\MY PROJECT\PERSONAL\PakaiKuota

==================================================
TUJUAN AUDIT
==================================================

Gue sedang mempertimbangkan untuk sementara menggunakan QRIS milik gue sendiri sebagai metode pembayaran/top-up manual.

Namun payment gateway yang sekarang SUDAH ADA JANGAN DIHAPUS.

Target arsitektur:

CURRENT:
User
→ pilih top-up
→ payment gateway
→ payment confirmation/webhook
→ wallet user bertambah
→ wallet_ledger

TEMPORARY MVP:
User
→ pilih nominal top-up
→ tampil QRIS gue
→ user bayar
→ user klik "Saya sudah bayar"
→ status menjadi waiting_verification
→ user bisa kirim konfirmasi ke WhatsApp
→ admin cek pembayaran
→ admin Approve / Reject
→ jika Approve:
   wallet user bertambah
   wallet_ledger mencatat credit
→ jika Reject:
   wallet tidak bertambah

FUTURE:
User
→ pilih nominal
→ payment gateway
→ automated payment confirmation/webhook
→ wallet user bertambah

Jadi payment gateway lama harus DIJEDA / DISABLE secara konfigurasi atau feature flag,
BUKAN DIHAPUS.

Nanti harus mudah untuk switch:

PAYMENT_MODE = manual_qris

atau:

PAYMENT_MODE = gateway

tanpa membongkar sistem lagi.

==================================================
BAGIAN 1 — AUDIT STRUKTUR PROJECT
==================================================

Cari dan petakan semua file yang berhubungan dengan:

1. top up
2. payment
3. payment gateway
4. QRIS
5. transaction
6. wallet
7. balance
8. wallet_ledger
9. webhook
10. payment callback
11. order
12. invoice
13. checkout
14. admin payment
15. refund
16. idempotency
17. notification
18. WhatsApp
19. environment variables terkait payment

Cari berdasarkan:
- filename
- folder
- import
- function
- API route
- database query
- RPC
- env variable
- UI text

Jangan hanya mencari folder bernama payment.
Telusuri dependency/import chain-nya.

==================================================
BAGIAN 2 — PETAKAN PAYMENT FLOW SEKARANG
==================================================

Gue mau lu jelaskan FLOW PAYMENT YANG SEKARANG BENAR-BENAR TERJADI DI CODE.

Buat flow seperti:

User
 ↓
[page/component]
 ↓
[API route]
 ↓
[payment provider]
 ↓
[callback/webhook]
 ↓
[database]
 ↓
[wallet]
 ↓
[ledger]

Untuk setiap step tulis:

- file
- function
- endpoint
- database table
- database RPC jika ada
- status transaction
- field yang dipakai
- bagaimana nominal ditentukan
- bagaimana user_id dikaitkan dengan payment
- bagaimana order_id dibuat
- bagaimana duplicate payment dicegah
- kapan balance user bertambah
- bagaimana payment dianggap berhasil
- bagaimana payment dianggap gagal
- bagaimana expired payment ditangani
- bagaimana refund ditangani kalau ada

Jangan berasumsi.
Kalau sesuatu tidak ditemukan di code, tulis:

NOT FOUND

==================================================
BAGIAN 3 — DATABASE AUDIT
==================================================

Cari schema/migration/table yang berhubungan dengan payment dan wallet.

Khusus cari:

- users
- wallet_ledger
- topup_transactions
- payments
- orders
- invoices
- transactions
- payment_events
- webhook_events
- balance
- balance_held

Untuk setiap table yang relevan jelaskan:

TABLE:
COLUMN:
TYPE:
PURPOSE:
USED BY:
STATUS VALUES:
RELATION:
UNIQUE CONSTRAINT:
INDEX:
RLS:
TRIGGER:
RPC:

Cari juga apakah sudah ada mekanisme atomic transaction.

Khusus wallet:

jelaskan dengan pasti bagaimana:

balance + topup

dilakukan.

Apakah langsung:

UPDATE users SET balance = balance + x

atau melalui RPC/function?

Apakah wallet_ledger selalu dibuat bersamaan?

Apakah ada risiko:

wallet bertambah tetapi ledger gagal?

atau:

ledger masuk tetapi wallet tidak bertambah?

==================================================
BAGIAN 4 — PAYMENT GATEWAY YANG SEKARANG
==================================================

Identifikasi payment gateway yang sekarang dipakai.

Cari:

- provider
- SDK
- API
- environment variable
- secret key reference
- webhook secret
- callback URL
- payment creation endpoint
- payment status endpoint
- webhook handler

Jelaskan:

1. bagaimana payment dibuat
2. bagaimana payment status diverifikasi
3. bagaimana webhook diverifikasi
4. apakah webhook signature dicek
5. apakah server melakukan re-check transaction ke provider
6. apakah nominal diverifikasi
7. apakah order_id diverifikasi
8. apakah webhook idempotent
9. apakah duplicate webhook aman
10. apakah payment bisa diproses dua kali
11. apakah payment gateway saat ini terhubung langsung ke wallet

PENTING:

Jangan hapus implementation payment gateway tersebut.

Tentukan bagian mana yang harus tetap dipertahankan untuk future use.

==================================================
BAGIAN 5 — CEK APAKAH MANUAL QRIS BISA MASUK
==================================================

Sekarang analisis apakah architecture existing bisa menerima metode:

manual_qris

tanpa merusak payment gateway existing.

Idealnya gue mau konsep:

payment_method:
- manual_qris
- gateway

atau:

payment_provider:
- manual_qris
- existing_gateway

Dan:

payment_mode:
- manual_qris
- gateway

Pilih desain yang paling cocok dengan code existing.

Jangan membuat duplicate wallet system.

Manual QRIS harus menggunakan wallet/top-up/ledger infrastructure yang sudah ada jika memungkinkan.

==================================================
BAGIAN 6 — DESAIN FLOW MANUAL QRIS
==================================================

Target flow:

USER:

1. buka Top Up
2. pilih:
   Rp10.000
   Rp20.000
   Rp50.000
   Rp100.000
   custom amount
3. klik Bayar
4. sistem membuat topup order
5. sistem menampilkan QRIS milik gue
6. nominal pembayaran ditampilkan
7. order ID ditampilkan
8. countdown / expiry jika cocok
9. user membayar
10. user klik:

   "Saya sudah bayar"

11. status:

   waiting_verification

12. user bisa klik:

   "Konfirmasi via WhatsApp"

13. WhatsApp dibuka dengan pesan otomatis berisi:
   - order ID
   - nominal
   - email/username jika aman
   - waktu pembayaran

ADMIN:

1. buka admin dashboard
2. lihat pending top-ups
3. lihat:
   - order ID
   - user
   - nominal
   - waktu dibuat
   - status
   - payment method
4. Approve
5. Reject
6. optional admin note

APPROVE:

harus atomic:

topup status
→ completed

wallet balance
→ +amount

wallet_ledger
→ credit amount

approved_at
→ timestamp

approved_by
→ admin user

Semua harus berhasil atau semua gagal.

REJECT:

topup status
→ rejected

wallet tidak berubah.

==================================================
BAGIAN 7 — SECURITY / FRAUD
==================================================

Audit risiko manual QRIS.

Khusus:

Apakah user bisa:

- klik "Saya sudah bayar" berkali-kali?
- membuat order berkali-kali?
- mendapatkan credit dua kali?
- memalsukan nominal?
- mengubah user_id?
- mengubah order_id?
- approve dirinya sendiri?
- memanggil endpoint approve langsung?
- mengubah status completed dari client?
- replay request?
- melakukan race condition?
- melakukan double-click approve?

Tentukan protection yang sudah ada.

Kalau belum ada, rekomendasikan.

PENTING:

Client tidak boleh bisa menentukan:

status = completed

Client hanya boleh:

pending → waiting_verification

Sedangkan:

waiting_verification → completed

HARUS hanya dilakukan server/admin.

==================================================
BAGIAN 8 — IDEMPOTENCY
==================================================

Cari apakah existing system sudah punya:

- idempotency_key
- unique order_id
- unique payment reference
- webhook event ID
- transaction ID

Untuk manual QRIS, tentukan identifier yang paling aman.

Target:

1 top-up order
→ maksimal 1 wallet credit.

Walaupun admin:
- klik approve dua kali
- refresh
- request terkirim dua kali
- dua admin approve bersamaan

wallet tetap hanya bertambah SEKALI.

==================================================
BAGIAN 9 — PAYMENT MODE SWITCH
==================================================

Gue TIDAK MAU payment gateway lama dihapus.

Buat rekomendasi arsitektur supaya nanti bisa:

MODE A:

MANUAL_QRIS

MODE B:

GATEWAY

Misalnya secara konsep:

PAYMENT_MODE=manual_qris

atau:

PAYMENT_MODE=gateway

Tapi jangan langsung implement sebelum audit selesai.

Cari dulu apakah environment variable sudah ada yang bisa dipakai.

Kalau belum ada, rekomendasikan lokasi terbaik.

Target:

Manual QRIS sekarang:

Top Up
→ manual QRIS

Future:

ubah config

→ gateway aktif lagi

Tanpa perlu membongkar database wallet.

==================================================
BAGIAN 10 — FRONTEND AUDIT
==================================================

Cari halaman/component top-up yang sekarang.

Jelaskan:

- file
- route
- component
- state
- API yang dipanggil
- payment UI
- success state
- failed state
- loading state

Tentukan perubahan minimal yang diperlukan agar UI mendukung:

MANUAL QRIS

Contoh:

Pilih nominal
↓
Buat pesanan
↓
Tampilkan QRIS
↓
"Sudah bayar"
↓
"Menunggu verifikasi"
↓
"Konfirmasi WhatsApp"

Tapi payment gateway UI existing harus tetap ada di codebase.

Idealnya render berdasarkan payment mode.

==================================================
BAGIAN 11 — ADMIN AUDIT
==================================================

Cari apakah admin sudah punya halaman untuk:

- topup
- payment
- transactions
- wallet
- user balance

Kalau ada, jelaskan.

Kalau belum ada, tentukan lokasi paling tepat untuk menambahkan:

Pending Top Ups

dengan action:

[Approve]

[Reject]

Pastikan admin authorization sudah ada.

Jangan membuat endpoint admin yang bisa dipanggil user biasa.

==================================================
BAGIAN 12 — WHATSAPP
==================================================

Cek apakah project sudah punya integration WhatsApp.

Kalau belum:

jangan langsung membuat WhatsApp API.

Untuk MVP cukup gunakan:

wa.me

atau deep link WhatsApp dengan prefilled message.

Cari lokasi paling tepat untuk membuat link tersebut.

Jangan expose secret.

==================================================
BAGIAN 13 — QRIS
==================================================

Untuk MVP gue akan menggunakan QRIS milik gue sendiri.

Audit apa yang diperlukan agar QRIS bisa ditampilkan:

- image
- static QR
- URL
- config
- environment variable
- public asset

Jangan hardcode secret.

Kalau QRIS berupa image, tentukan tempat paling aman dan praktis.

Nominal top-up user harus tetap disimpan di database sebagai nominal order.

PENTING:

Karena QRIS manual bersifat static/manual, sistem TIDAK boleh menganggap QR scan/payment otomatis valid.

Payment baru completed setelah admin verification.

==================================================
BAGIAN 14 — BUSINESS LOGIC
==================================================

Pisahkan dengan jelas:

TOP UP WALLET

vs

AI USAGE BILLING.

Top-up:

customer bayar Rp100.000
→ wallet +Rp100.000

AI usage:

GPT/Claude/GLM digunakan
→ billing existing melakukan debit berdasarkan actual usage.

Jangan ubah:

authorize_request

finalize_request

AI billing

wallet hold

AI usage ledger

kecuali audit menemukan dependency yang memang wajib.

Payment/topup harus terpisah dari AI usage billing.

==================================================
BAGIAN 15 — BACKWARD COMPATIBILITY
==================================================

Pastikan desain manual QRIS tidak merusak:

- existing users
- existing wallet balance
- existing wallet_ledger
- existing AI usage
- existing API key
- existing payment gateway
- existing admin
- existing transactions

Tidak boleh ada migration destructive.

Jangan DROP COLUMN.

Jangan DROP TABLE.

Jangan rename table existing tanpa alasan kuat.

Jangan menghapus payment gateway code.

==================================================
BAGIAN 16 — AUDIT ENVIRONMENT VARIABLES
==================================================

Cari semua env:

PAYMENT_*
MIDTRANS_*
XENDIT_*
GOPAY_*
QRIS_*
WEBHOOK_*
WHATSAPP_*

dan semua kemungkinan nama lain.

Laporkan:

variable
→ digunakan di file mana
→ untuk apa
→ wajib/tidak
→ production/development

Tentukan mana yang masih diperlukan walaupun payment gateway sedang dijeda.

==================================================
BAGIAN 17 — OUTPUT YANG GUE MAU
==================================================

JANGAN NGODING DULU.

Berikan report dalam format:

# PAYMENT SYSTEM AUDIT

## 1. Current Architecture

diagram lengkap.

## 2. Current Payment Flow

step-by-step dengan file/function.

## 3. Current Database

table + column + relationship.

## 4. Current Payment Gateway

provider + integration + webhook + status.

## 5. Current Wallet Credit Flow

jelaskan persis kapan balance bertambah.

## 6. Current Security

idempotency + authorization + race condition.

## 7. Manual QRIS Feasibility

jawab:

APAKAH BISA?

YES / NO / YES WITH CHANGES

dan jelaskan alasannya.

## 8. Recommended Architecture

diagram:

MANUAL QRIS
vs
PAYMENT GATEWAY

## 9. Minimal Changes

list file yang perlu dibuat/diubah.

Bedakan:

CREATE
MODIFY
KEEP UNCHANGED

## 10. Database Changes

jelaskan migration yang diperlukan.

Tidak perlu menulis SQL dulu kalau belum yakin.

## 11. Payment Mode Switch

jelaskan bagaimana:

manual_qris → gateway

bisa dilakukan nanti.

## 12. Risks

semua risiko yang lu temukan.

## 13. Existing Code That MUST NOT Be Touched

Khusus tandai billing AI yang sudah production-tested.

## 14. Recommended Implementation Order

urutan implementasi paling aman.

## 15. Final Verdict

Jawab tiga hal:

1. Apakah payment gateway sekarang bisa dipause tanpa dihapus?
2. Apakah manual QRIS bisa ditambahkan tanpa merusak gateway?
3. Apakah nanti bisa switch kembali ke gateway tanpa redesign wallet?

==================================================
ATURAN KERJA
==================================================

1. Audit dulu.
2. Jangan langsung coding.
3. Jangan delete.
4. Jangan destructive migration.
5. Jangan menyentuh AI billing yang tidak berkaitan.
6. Jangan membuat asumsi jika code tidak ditemukan.
7. Tunjukkan file path dan function name.
8. Kalau ada ambiguity, tandai sebagai AMBIGUOUS.
9. Kalau menemukan bug existing, laporkan tapi jangan otomatis refactor.
10. Fokus utama sekarang PAYMENT/TOP-UP.
11. Payment gateway lama HARUS dipertahankan.
12. Manual QRIS hanya menjadi payment method sementara.
13. Desain harus memungkinkan payment gateway diaktifkan kembali.
14. Wallet hanya boleh dikredit setelah payment benar-benar diverifikasi.
15. Manual confirmation dari user TIDAK sama dengan payment success.
16. Admin approval harus server-side dan idempotent.
17. Jangan menyimpan secret/key QRIS/payment di client.
18. Jangan mengubah pricing AI.
19. Jangan mengubah authorize_request/finalize_request tanpa alasan dependency yang terbukti.
20. Setelah audit selesai, BERHENTI dan tunggu instruksi gue sebelum implementasi.

Mulai sekarang dengan membaca dan memetakan seluruh codebase yang relevan.