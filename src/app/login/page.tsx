"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setState("error");
      setMessage("Email atau password tidak valid.");
      return;
    }
    const data = await response.json() as { role?: string };
    router.push(data.role === "super_admin" || data.role === "support" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen bg-[#FAFAF9] text-[#122542] lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="hidden bg-[#122542] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-[-0.03em] focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Pakai<span className="text-[#F0A93B]">Kuota</span></Link>
        <div className="max-w-md"><p className="text-sm text-[#F0A93B]">Akses kerja kamu</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em]">Masuk dan lihat saldo, key, serta pemakaian dalam satu tempat.</h1></div>
        <p className="text-sm text-[#b7c5d6]">Pembayaran dalam Rupiah. Angka billing tetap jelas.</p>
      </aside>
      <section className="flex items-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="text-lg font-semibold tracking-[-0.03em] lg:hidden">Pakai<span className="text-[#D97B2E]">Kuota</span></Link>
          <div className="mt-12"><p className="text-sm font-semibold text-[#D97B2E]">Akun</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Masuk ke PakaiKuota</h2><p className="mt-3 text-sm leading-6 text-[#40536d]">Gunakan akun kamu untuk mengelola kuota dan API key.</p></div>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {state === "error" && <p role="alert" className="border-l-2 border-[#D64545] bg-[#f9e8e8] px-4 py-3 text-sm text-[#8f2929]">{message}</p>}
            <label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-11 w-full border border-[#b9c5d3] bg-white px-3 text-base outline-none focus:border-[#122542] focus:ring-2 focus:ring-[#F0A93B]" /></label>
            <label className="block text-sm font-medium">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-11 w-full border border-[#b9c5d3] bg-white px-3 text-base outline-none focus:border-[#122542] focus:ring-2 focus:ring-[#F0A93B]" /></label>
            <button disabled={state === "loading"} className="min-h-12 w-full bg-[#F0A93B] px-5 font-semibold text-[#122542] hover:bg-[#f7bb5d] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#122542]">{state === "loading" ? "Memeriksa akun..." : "Masuk"}</button>
          </form>
          <p className="mt-6 text-sm text-[#40536d]">Belum punya akun? <Link href="/signup" className="font-semibold text-[#122542] underline decoration-[#D97B2E] underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Buat akun</Link></p>
        </div>
      </section>
    </main>
  );
}
