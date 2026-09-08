# Ponytail engineering rules

Aturan ini wajib dibaca sebelum mengerjakan perubahan apa pun di repository PakaiKuota.

Ponytail berarti efisien, bukan ceroboh. Tulis kode sesedikit mungkin setelah memahami masalah dan alur end-to-end.

## Urutan keputusan

Sebelum menulis kode, periksa berurutan:

1. Apakah perubahan ini benar-benar diperlukan?
2. Apakah fungsi, helper, pola, atau route yang sama sudah ada dan bisa digunakan ulang?
3. Apakah standard library sudah cukup?
4. Apakah fitur native platform sudah cukup?
5. Apakah dependency yang sudah terpasang sudah menyelesaikan kebutuhan?
6. Apakah solusi dapat dibuat lebih sederhana tanpa mengurangi correctness?
7. Baru setelah itu tambahkan kode minimum yang benar.

Urutan ini dijalankan setelah memahami kebutuhan, bukan sebagai pengganti pembacaan kode dan penelusuran flow.

## Aturan implementasi

- Jangan membuat abstraksi yang tidak diminta.
- Jangan menambah dependency jika bisa dihindari.
- Jangan membuat boilerplate yang tidak diperlukan.
- Utamakan penghapusan atau reuse sebelum penambahan file baru.
- Perbaiki bug pada akar masalah dan periksa semua caller terkait.
- Validasi input di trust boundary.
- Pertahankan error handling yang mencegah kehilangan data atau saldo.
- Pertahankan keamanan, aksesibilitas, dan responsive behavior.
- Perubahan non-trivial harus meninggalkan minimal satu test atau pemeriksaan runnable.
- Jangan mengarang data, klaim, credential, endpoint, atau behavior provider.
- Untuk pekerjaan UI, baca dan patuhi `ANTISLOP-ID.md` serta `DESIGN.md` jika tersedia.

## Simplifikasi yang disengaja

Jika memilih pendekatan sederhana dengan batasan nyata, beri komentar `ponytail:` yang menyebutkan batasan dan jalur upgrade. Jangan memakai komentar tersebut untuk membenarkan implementasi yang tidak aman atau tidak benar.

## Urutan kerja wajib

Sebelum setiap perubahan:

1. Baca `PONYTAIL.md`.
2. Baca instruksi repository lain yang relevan, termasuk `AGENTS.md`, `ANTISLOP-ID.md`, dan dokumentasi Next.js terkait.
3. Baca file dan caller yang akan terdampak.
4. Pilih perubahan terkecil yang memenuhi requirement.
5. Jalankan test, lint, typecheck, atau build yang relevan.
