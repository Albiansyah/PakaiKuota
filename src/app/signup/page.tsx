"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => null) as { error?: string; session?: unknown } | null;
    if (!response.ok) {
      setState("error");
      setMessage(data?.error ?? "Akun tidak bisa dibuat.");
      return;
    }
    if (data?.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setState("success");
    setMessage("Akun dibuat. Cek email kamu untuk konfirmasi sebelum masuk.");
  }

  return (
    <main className="grid min-h-screen bg-[#FAFAF9] text-[#122542] lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="hidden bg-[#122542] p-10 text-white lg:flex lg:flex-col lg:justify-between"><Link href="/" className="text-lg font-semibold tracking-[-0.03em] focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Pakai<span className="text-[#F0A93B]">Kuota</span></Link><div className="max-w-md"><p className="text-sm text-[#F0A93B]">Mulai dengan fondasi yang jelas</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em]">Buat akun, isi kuota, lalu kirim request pertama kamu.</h1></div><p className="text-sm text-[#b7c5d6]">Tidak ada kartu kredit luar negeri.</p></aside>
      <section className="flex items-center px-5 py-12 sm:px-10"><div className="mx-auto w-full max-w-md"><Link href="/" className="text-lg font-semibold tracking-[-0.03em] lg:hidden">Pakai<span className="text-[#D97B2E]">Kuota</span></Link><div className="mt-12"><p className="text-sm font-semibold text-[#D97B2E]">Akun baru</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Buat akun PakaiKuota</h2><p className="mt-3 text-sm leading-6 text-[#40536d]">Gunakan email aktif. Konfirmasi email mungkin diperlukan.</p></div><form onSubmit={submit} className="mt-8 space-y-5">{state === "error" && <p role="alert" className="border-l-2 border-[#D64545] bg-[#f9e8e8] px-4 py-3 text-sm text-[#8f2929]">{message}</p>}{state === "success" && <p role="status" className="border-l-2 border-[#1F9E6E] bg-[#e5f5ef] px-4 py-3 text-sm text-[#146746]">{message}</p>}<label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-11 w-full border border-[#b9c5d3] bg-white px-3 text-base outline-none focus:border-[#122542] focus:ring-2 focus:ring-[#F0A93B]" /></label><label className="block text-sm font-medium">Password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-11 w-full border border-[#b9c5d3] bg-white px-3 text-base outline-none focus:border-[#122542] focus:ring-2 focus:ring-[#F0A93B]" /><span className="mt-2 block text-xs text-[#40536d]">Minimal 8 karakter.</span></label><button disabled={state === "loading" || state === "success"} className="min-h-12 w-full bg-[#F0A93B] px-5 font-semibold text-[#122542] hover:bg-[#f7bb5d] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#122542]">{state === "loading" ? "Membuat akun..." : "Buat akun"}</button></form><p className="mt-6 text-sm text-[#40536d]">Sudah punya akun? <Link href="/login" className="font-semibold text-[#122542] underline decoration-[#D97B2E] underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Masuk</Link></p></div></section>
    </main>
  );
}
