import Link from "next/link";
import { WhatsAppCs } from "@/components/whatsapp-cs";

const tiers = [
  {
    name: "Standard",
    detail: "Untuk eksperimen dan penggunaan rutin.",
    price: "Lihat harga setelah masuk",
    tone: "bg-white",
  },
  {
    name: "Premium",
    detail: "Untuk workflow yang butuh model lebih kuat.",
    price: "Lihat harga setelah masuk",
    tone: "bg-[#122542] text-white",
  },
  {
    name: "Ultra",
    detail: "Untuk beban kerja dengan kebutuhan model tertinggi.",
    price: "Lihat harga setelah masuk",
    tone: "bg-white",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] text-[#122542]">
      <header className="border-b border-[#d9e0e8] bg-[#122542] text-white">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-lg font-semibold tracking-[-0.03em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F0A93B]">
            Pakai<span className="text-[#F0A93B]">Kuota</span>
          </Link>
          <nav aria-label="Navigasi utama" className="flex items-center gap-2 text-sm">
            <Link href="#harga" className="hidden min-h-11 items-center px-3 text-[#dbe4ef] hover:text-white focus-visible:outline-2 focus-visible:outline-[#F0A93B] sm:flex">Harga</Link>
            <Link href="/login" className="flex min-h-11 items-center px-3 text-[#dbe4ef] hover:text-white focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Masuk</Link>
            <Link href="/signup" className="flex min-h-11 items-center border border-[#F0A93B] bg-[#F0A93B] px-4 font-semibold text-[#122542] hover:bg-[#f7bb5d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Buat akun</Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#d9e0e8] bg-[#122542] text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:py-28">
          <div>
            <p className="mb-5 max-w-xl text-sm font-medium text-[#F0A93B]">API LLM untuk kebutuhan kerja kamu</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">Pakai API LLM. Bayar dengan Rupiah.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#dbe4ef] sm:text-lg">Satu API key untuk model LLM yang kamu butuhkan. Isi kuota lewat QRIS atau VA, lalu pakai endpoint chat completions yang familiar.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex min-h-12 items-center justify-center bg-[#F0A93B] px-5 font-semibold text-[#122542] hover:bg-[#f7bb5d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Mulai dengan akun</Link>
              <Link href="#cara-kerja" className="inline-flex min-h-12 items-center justify-center border border-[#718199] px-5 font-medium text-white hover:border-white focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Lihat alurnya</Link>
            </div>
          </div>
          <div className="border-l-2 border-[#F0A93B] pl-6 lg:mb-2">
            <p className="text-sm leading-6 text-[#dbe4ef]">Yang kamu lihat jelas:</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white">
              <li>Saldo tersedia sebelum request dikirim.</li>
              <li>Biaya dihitung dari pemakaian token aktual.</li>
              <li>Request gagal tidak memotong saldo.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-sm font-semibold text-[#D97B2E]">Alur penggunaan</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-[-0.035em]">Dari saldo ke request, tanpa langkah tersembunyi.</h2>
        </div>
        <ol className="divide-y divide-[#d9e0e8] border-y border-[#d9e0e8]">
          <li className="grid gap-3 py-5 sm:grid-cols-[5rem_1fr] sm:gap-6"><span className="font-mono text-sm text-[#D97B2E]">01</span><div><h3 className="font-semibold">Isi kuota</h3><p className="mt-1 text-sm leading-6 text-[#40536d]">Pilih nominal dan selesaikan pembayaran melalui QRIS atau VA.</p></div></li>
          <li className="grid gap-3 py-5 sm:grid-cols-[5rem_1fr] sm:gap-6"><span className="font-mono text-sm text-[#D97B2E]">02</span><div><h3 className="font-semibold">Buat API key</h3><p className="mt-1 text-sm leading-6 text-[#40536d]">Key hanya ditampilkan saat dibuat. Simpan di tempat yang aman.</p></div></li>
          <li className="grid gap-3 py-5 sm:grid-cols-[5rem_1fr] sm:gap-6"><span className="font-mono text-sm text-[#D97B2E]">03</span><div><h3 className="font-semibold">Kirim request</h3><p className="mt-1 text-sm leading-6 text-[#40536d]">Gunakan endpoint chat completions dengan format yang familiar.</p></div></li>
        </ol>
      </section>

      <section id="harga" className="border-y border-[#d9e0e8] bg-[#EEF1F5]">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#D97B2E]">Pilihan model</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Pilih tier sesuai beban kerja.</h2></div><p className="max-w-sm text-sm leading-6 text-[#40536d]">Harga dan model aktif tampil dari konfigurasi akun. Tidak ada angka perkiraan yang disamarkan sebagai harga final.</p></div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {tiers.map((tier) => <article key={tier.name} className={`border border-[#c6d0dc] p-6 ${tier.tone}`}><h3 className="text-xl font-semibold">{tier.name}</h3><p className={`mt-3 min-h-12 text-sm leading-6 ${tier.name === "Premium" ? "text-[#dbe4ef]" : "text-[#40536d]"}`}>{tier.detail}</p><p className={`mt-8 border-t pt-4 text-sm font-mono ${tier.name === "Premium" ? "border-[#718199] text-[#F0A93B]" : "border-[#d9e0e8] text-[#122542]"}`}>{tier.price}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <div><h2 className="text-3xl font-semibold tracking-[-0.035em]">Pertanyaan yang penting sebelum mulai.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#40536d]">Jawaban ini mengikuti perilaku billing yang digunakan sistem.</p></div>
        <div className="divide-y divide-[#d9e0e8] border-y border-[#d9e0e8]"><details className="group py-5"><summary className="cursor-pointer list-none font-semibold focus-visible:outline-2 focus-visible:outline-[#122542]">Apa yang terjadi jika request gagal?</summary><p className="mt-3 text-sm leading-6 text-[#40536d]">Hold dilepas dan saldo tidak dipotong.</p></details><details className="group py-5"><summary className="cursor-pointer list-none font-semibold focus-visible:outline-2 focus-visible:outline-[#122542]">Bagaimana pembayaran diverifikasi?</summary><p className="mt-3 text-sm leading-6 text-[#40536d]">Webhook hanya menjadi pemicu. Status diverifikasi ulang melalui Transaction Detail API Pakasir.</p></details><details className="group py-5"><summary className="cursor-pointer list-none font-semibold focus-visible:outline-2 focus-visible:outline-[#122542]">Kapan saya bisa mulai memakai API?</summary><p className="mt-3 text-sm leading-6 text-[#40536d]">Setelah pembayaran terverifikasi dan saldo masuk, buat API key dari dashboard.</p></details></div>
      </section>

      <footer className="border-t border-[#d9e0e8] bg-[#122542] text-[#dbe4ef]"><div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8"><span className="font-semibold text-white">Pakai<span className="text-[#F0A93B]">Kuota</span></span><span>API LLM dengan pembayaran Rupiah.</span></div></footer>
      <WhatsAppCs />
    </main>
  );
}
