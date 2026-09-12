import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Ketentuan Layanan",
  description: "Ketentuan layanan PakaiKuota.",
}

export default function TermsPage() {
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
            Ketentuan Layanan
          </h1>
          <p className="mt-3 text-sm text-(--pk-text-mute)">
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-(--pk-text-dim)">
            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                1. Penerimaan Ketentuan
              </h2>
              <p className="mt-2">
                Dengan membuat akun dan menggunakan layanan PakaiKuota, kamu
                menyetujui ketentuan ini. Jika tidak setuju, mohon tidak
                menggunakan layanan.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                2. Akun & Saldo
              </h2>
              <p className="mt-2">
                Kamu bertanggung jawab atas keamanan akun dan API key. Saldo
                dalam Rupiah bersifat prabayar dan dipotong sesuai pemakaian
                aktual. Saldo tidak dapat dipindahtangankan.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                3. Pemakaian yang Dilarang
              </h2>
              <p className="mt-2">
                Dilarang menggunakan layanan untuk aktivitas ilegal, spam,
                penipuan, atau melanggar hak pihak lain. Kami berhak
                menangguhkan akun yang melanggar.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                4. Refund
              </h2>
              <p className="mt-2">
                Pengajuan refund dapat dilakukan melalui dashboard dan akan
                ditinjau oleh admin. Refund diberikan sesuai kebijakan yang
                berlaku.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                5. Perubahan Ketentuan
              </h2>
              <p className="mt-2">
                Kami dapat mengubah ketentuan ini dari waktu ke waktu.
                Perubahan akan diumumkan melalui halaman ini.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-(--pk-text)">
                6. Kontak
              </h2>
              <p className="mt-2">
                Pertanyaan tentang ketentuan ini bisa dikirim melalui kanal
                dukungan yang tersedia di dashboard.
              </p>
            </section>
          </div>

          <div className="mt-10 border-t border-(--pk-line) pt-6">
            <Link
              href="/privacy"
              className="text-sm text-(--pk-accent) hover:underline"
            >
              Lihat Kebijakan Privasi →
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}