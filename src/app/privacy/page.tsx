import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi PakaiKuota.",
}

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen text-(--pk-text)">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
      </div>

      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
        >
          <ArrowLeft size={13} />
          Kembali ke halaman utama
        </Link>

        <article className="pk-panel pk-inview mt-6 p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Kebijakan Privasi
          </h1>
          <p className="mt-3 text-sm text-(--pk-text-mute)">
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-(--pk-text-dim)">
            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                1. Data yang Kami Kumpulkan
              </h2>
              <p className="mt-2">
                Kami mengumpulkan email, informasi akun, riwayat pemakaian
                API, dan data transaksi top up untuk operasional layanan.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                2. Penggunaan Data
              </h2>
              <p className="mt-2">
                Data digunakan untuk menyediakan layanan, memproses
                pembayaran, menghitung biaya pemakaian, dan meningkatkan
                kualitas layanan.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                3. Berbagi Data
              </h2>
              <p className="mt-2">
                Kami tidak menjual data kamu. Data dapat dibagikan kepada
                penyedia layanan pihak ketiga (seperti payment gateway)
                sebatas yang diperlukan untuk operasional.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                4. Keamanan
              </h2>
              <p className="mt-2">
                Kami menggunakan enkripsi dan praktik keamanan standar
                industri untuk melindungi data kamu. API key disimpan
                dalam bentuk hash.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                5. Hak Kamu
              </h2>
              <p className="mt-2">
                Kamu dapat mengakses, memperbarui, atau meminta penghapusan
                data akun dengan menghubungi dukungan.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                6. Kontak
              </h2>
              <p className="mt-2">
                Pertanyaan tentang privasi bisa dikirim melalui kanal
                dukungan yang tersedia di dashboard.
              </p>
            </section>
          </div>

          <div className="mt-10 border-t border-(--pk-line) pt-6">
            <Link
              href="/terms"
              className="text-sm text-(--pk-accent) hover:underline"
            >
              Lihat Ketentuan Layanan →
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}