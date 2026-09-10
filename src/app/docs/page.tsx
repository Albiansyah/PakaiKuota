"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  FileCode,
  Key,
  Rocket,
  Terminal,
} from "lucide-react"

const SNIPPETS = {
  curl: `curl https://pakai-kuota.vercel.app/api/v1/chat/completions \\
  -H "Authorization: Bearer $PK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "system", "content": "Kamu adalah asisten yang helpful."},
      {"role": "user", "content": "Halo, siapa kamu?"}
    ]
  }'`,

  python: `import requests

url = "https://pakai-kuota.vercel.app/api/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "gpt-4o-mini",
    "messages": [
        {"role": "user", "content": "Halo!"}
    ]
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,

  node: `const response = await fetch("https://pakai-kuota.vercel.app/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.PK_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "nvidia-nemotron-3-ultra-550b-a55bfree",
    messages: [{ role: "user", content: "Halo!" }]
  })
});

const data = await response.json();
console.log(data);`,

  go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://pakai-kuota.vercel.app/api/v1/chat/completions"

	payload := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "user", "content": "Halo!"},
		},
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	fmt.Println("Response:", resp.Status)
}`,

  php: `<?php

$url = "https://pakai-kuota.vercel.app/api/v1/chat/completions";

$data = [
    "model" => "gpt-4o-mini",
    "messages" => [
        ["role" => "user", "content" => "Halo!"]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer YOUR_API_KEY",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);`,
}

const MODELS = [
  {
    name: "nvidia-nemotron-3-ultra-550b-a55bfree",
    description: "Model gratis yang sudah terhubung ke gateway",
    tier: "Gratis",
    price: "Rp 0",
  },
]

const STEPS = [
  {
    icon: Rocket,
    title: "1. Daftar Akun",
    description: "Daftar di PakaiKuota.id dan verifikasi email",
  },
  {
    icon: Key,
    title: "2. Top-up Saldo",
    description: "Top-up saldo menggunakan QRIS",
  },
  {
    icon: BookOpen,
    title: "3. Buat API Key",
    description: "Generate API key di dashboard",
  },
  {
    icon: FileCode,
    title: "4. Mulai Coding",
    description: "Gunakan API key untuk mengakses model LLM",
  },
]

const SECTIONS = [
  { id: "quickstart", label: "Mulai Cepat" },
  { id: "setup", label: "Setup API" },
  { id: "format", label: "Format Request" },
  { id: "errors", label: "Error Umum" },
  { id: "examples", label: "Contoh Code" },
  { id: "models", label: "Model Tersedia" },
]

const TAB_LANGS = [
  { id: "curl", label: "cURL", icon: Terminal },
  { id: "python", label: "Python" },
  { id: "node", label: "Node.js" },
  { id: "go", label: "Go" },
  { id: "php", label: "PHP" },
]

export default function DocsPage() {
  const { t } = useLanguage()
  const { user } = useSupabase()
  const [activeTab, setActiveTab] = useState<keyof typeof SNIPPETS>("curl")
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState("quickstart")
  const contentRef = useRef<HTMLDivElement | null>(null)

  const code = useMemo(() => SNIPPETS[activeTab], [activeTab])

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 border-b border-[color:var(--pk-line)] bg-[#050b16]/85 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
          >
            <span className="pk-logo" aria-hidden />
            <span className="hidden sm:inline">
              Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
            </span>
            <span className="ml-1 rounded-full border border-[color:var(--pk-line-2)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[color:var(--pk-text-mute)]">
              Docs
            </span>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            {user ? (
              <Link
                href="/dashboard"
                className="pk-btn-primary inline-flex min-h-10 items-center gap-2 px-4 text-sm"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Kembali ke dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden min-h-10 items-center px-3 text-[color:var(--pk-text-dim)] transition-colors hover:text-white sm:flex"
                >
                  Masuk
                </Link>
                <Link
                  href="/signup"
                  className="pk-btn-primary inline-flex min-h-10 items-center px-4 text-sm"
                >
                  Buat akun
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[14rem_1fr]">
        {/* ============ SIDEBAR ============ */}
        <aside className="hidden lg:block">
          <nav
            aria-label="Navigasi dokumentasi"
            className="sticky top-24 space-y-1"
          >
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-text-mute)]">
              Daftar isi
            </p>
            {SECTIONS.map((section) => {
              const active = activeSection === section.id
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                    active
                      ? "bg-white/5 text-[color:var(--pk-text)]"
                      : "text-[color:var(--pk-text-dim)] hover:bg-white/[0.02] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className={`h-1 w-1 rounded-full transition-colors ${
                        active
                          ? "bg-[color:var(--pk-accent)]"
                          : "bg-transparent"
                      }`}
                    />
                    {section.label}
                  </span>
                  <ChevronRight
                    size={12}
                    className={`text-[color:var(--pk-text-mute)] transition-transform duration-200 ${
                      active
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    }`}
                  />
                </a>
              )
            })}

            <div className="mt-8 rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 p-4">
              <p className="text-xs font-semibold text-[color:var(--pk-text)]">
                Butuh bantuan?
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[color:var(--pk-text-mute)]">
                Tim support siap membantu via WhatsApp.
              </p>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[color:var(--pk-accent)] hover:underline"
              >
                Buka dashboard →
              </Link>
            </div>
          </nav>
        </aside>

        {/* ============ MOBILE TOC ============ */}
        <div className="pk-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
          {SECTIONS.map((section) => {
            const active = activeSection === section.id
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  active
                    ? "border-[color:var(--pk-accent)]/40 bg-[color:var(--pk-accent)]/10 text-[color:var(--pk-accent)]"
                    : "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-dim)]"
                }`}
              >
                {section.label}
              </a>
            )
          })}
        </div>

        {/* ============ CONTENT ============ */}
        <div ref={contentRef} className="min-w-0 space-y-6">
          {/* Hero */}
          <section className="pk-panel pk-inview p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
              Dokumentasi
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Panduan API PakaiKuota
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
              Quickstart guide dan contoh code untuk mengintegrasikan API
              PakaiKuota ke aplikasi kamu. Endpoint chat completions yang
              kompatibel dengan format OpenAI.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2.5 py-1 text-[#6ee7b7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                OpenAI-compatible
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--pk-line-2)] bg-[#0b1626] px-2.5 py-1 text-[color:var(--pk-text-dim)]">
                Streaming
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--pk-line-2)] bg-[#0b1626] px-2.5 py-1 text-[color:var(--pk-text-dim)]">
                Bayar per token
              </span>
            </div>
          </section>

          {/* Quickstart */}
          <section id="quickstart" className="pk-panel pk-inview p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Rocket size={16} className="text-[color:var(--pk-accent)]" />
              <h2 className="text-lg font-semibold tracking-[-0.02em]">
                Mulai Cepat
              </h2>
            </div>
            <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
              4 langkah untuk mulai menggunakan API.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                return (
                  <div
                    key={i}
                    className="pk-lift flex flex-col rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 p-4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-accent)]">
                      <Icon size={16} />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-[color:var(--pk-text-dim)]">
                      {step.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Setup */}
          <section id="setup" className="pk-panel pk-inview p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              Setup API
            </h2>
            <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
              Konfigurasi yang perlu disiapkan sebelum request pertama.
            </p>

            <ol className="mt-6 space-y-3 text-sm leading-6">
              {[
                <>Daftar atau masuk ke akun PakaiKuota.</>,
                <>
                  Buka Dashboard → API Keys, buat key baru, lalu simpan
                  plaintext key. Key hanya ditampilkan saat dibuat.
                </>,
                <>
                  Pastikan saldo tersedia. Request pay-per-use akan memotong
                  saldo Rupiah setelah provider berhasil merespons.
                </>,
                <>
                  Gunakan slug model yang tersedia. Model gratis saat ini:{" "}
                  <code className="rounded-md border border-[color:var(--pk-line-2)] bg-[#0b1626] px-1.5 py-0.5 font-mono text-xs text-[color:var(--pk-accent)]">
                    nvidia-nemotron-3-ultra-550b-a55bfree
                  </code>
                  .
                </>,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="pk-step-no flex-shrink-0">{`0${i + 1}`}</span>
                  <span className="pt-2 text-[color:var(--pk-text-dim)]">
                    {item}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Endpoint
                </p>
                <code className="mt-2 block break-all font-mono text-sm text-[color:var(--pk-text)]">
                  POST /api/v1/chat/completions
                </code>
                <p className="mt-3 text-[11px] text-[color:var(--pk-text-mute)]">
                  Production:
                </p>
                <code className="mt-1 block break-all font-mono text-[11px] text-[color:var(--pk-text-dim)]">
                  https://pakai-kuota.vercel.app/api/v1/chat/completions
                </code>
              </div>
              <div className="rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Daftar model
                </p>
                <code className="mt-2 block font-mono text-sm text-[color:var(--pk-text)]">
                  GET /api/v1/models
                </code>
                <p className="mt-3 text-[11px] leading-5 text-[color:var(--pk-text-dim)]">
                  Dengan header API key. Hanya model yang diaktifkan admin yang
                  ditampilkan.
                </p>
              </div>
            </div>
          </section>

          {/* Format */}
          <section id="format" className="pk-panel pk-inview p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              Format Request
            </h2>
            <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
              Parameter yang didukung endpoint chat completion.
            </p>

            <ul className="mt-6 space-y-3 text-sm leading-6 text-[color:var(--pk-text-dim)]">
              {[
                <>
                  <code className="rounded-md border border-[color:var(--pk-line-2)] bg-[#0b1626] px-1.5 py-0.5 font-mono text-xs text-[color:var(--pk-accent)]">
                    model
                  </code>{" "}
                  wajib: slug dari daftar model.
                </>,
                <>
                  <code className="rounded-md border border-[color:var(--pk-line-2)] bg-[#0b1626] px-1.5 py-0.5 font-mono text-xs text-[color:var(--pk-accent)]">
                    messages
                  </code>{" "}
                  wajib: array berisi{" "}
                  <code className="font-mono text-xs text-[color:var(--pk-text)]">
                    role
                  </code>{" "}
                  dan{" "}
                  <code className="font-mono text-xs text-[color:var(--pk-text)]">
                    content
                  </code>
                  .
                </>,
                <>
                  <code className="rounded-md border border-[color:var(--pk-line-2)] bg-[#0b1626] px-1.5 py-0.5 font-mono text-xs text-[color:var(--pk-accent)]">
                    max_tokens
                  </code>{" "}
                  opsional: integer 1–4096. Gunakan nilai kecil untuk membatasi
                  biaya.
                </>,
                <>
                  <code className="rounded-md border border-[color:var(--pk-line-2)] bg-[#0b1626] px-1.5 py-0.5 font-mono text-xs text-[color:var(--pk-accent)]">
                    stream
                  </code>
                  ,{" "}
                  <code className="rounded-md border border-[color:var(--pk-line-2)] bg-[#0b1626] px-1.5 py-0.5 font-mono text-xs text-[color:var(--pk-accent)]">
                    temperature
                  </code>
                  , dan{" "}
                  <code className="rounded-md border border-[color:var(--pk-line-2)] bg-[#0b1626] px-1.5 py-0.5 font-mono text-xs text-[color:var(--pk-accent)]">
                    top_p
                  </code>{" "}
                  opsional.
                </>,
                <>
                  Simpan API key di environment variable server, jangan di
                  frontend publik atau repository.
                </>,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--pk-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 p-4 text-sm leading-6 text-[color:var(--pk-text-dim)]">
              Billing memakai harga model, markup, kurs USD/IDR, dan token
              aktual dari provider jika tersedia. Request gagal tidak
              seharusnya memotong saldo.
            </p>
          </section>

          {/* Errors */}
          <section id="errors" className="pk-panel pk-inview p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              Error Umum
            </h2>
            <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
              Kode error yang mungkin kamu temui dan solusinya.
            </p>

            <div className="mt-6 space-y-2">
              {[
                {
                  code: "401 INVALID_API_KEY",
                  desc: "API key salah atau sudah dicabut.",
                  tone: "err",
                },
                {
                  code: "403 MODEL_DISABLED",
                  desc: "Model belum diaktifkan admin.",
                  tone: "warn",
                },
                {
                  code: "404 MODEL_NOT_FOUND",
                  desc: "Gunakan slug yang dikembalikan endpoint daftar model.",
                  tone: "warn",
                },
                {
                  code: "429 RATE_LIMITED",
                  desc: "Batas request tercapai.",
                  tone: "warn",
                },
                {
                  code: "402/502 UPSTREAM_ERROR",
                  desc: "Provider tidak memiliki channel, kredit, atau mengembalikan error.",
                  tone: "err",
                },
              ].map((item) => (
                <div
                  key={item.code}
                  className="flex flex-col gap-1.5 rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <code
                    className={`flex-shrink-0 rounded-md border px-2 py-1 font-mono text-xs ${
                      item.tone === "err"
                        ? "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]"
                        : "border-[color:var(--pk-accent)]/30 bg-[color:var(--pk-accent)]/10 text-[color:var(--pk-accent)]"
                    }`}
                  >
                    {item.code}
                  </code>
                  <p className="text-sm text-[color:var(--pk-text-dim)]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Examples */}
          <section id="examples" className="pk-panel pk-inview p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              Contoh Code
            </h2>
            <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
              Copy-paste ready untuk berbagai bahasa pemrograman.
            </p>

            <div className="mt-6 overflow-hidden rounded-xl border border-[color:var(--pk-line)]">
              <div className="pk-scroll flex items-center gap-1 overflow-x-auto border-b border-[color:var(--pk-line)] bg-[#0b1626]/80 p-1.5">
                {TAB_LANGS.map((tab) => {
                  const active = activeTab === tab.id
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setActiveTab(tab.id as keyof typeof SNIPPETS)
                      }
                      aria-selected={active}
                      role="tab"
                      className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all ${
                        active
                          ? "bg-gradient-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                          : "text-[color:var(--pk-text-dim)] hover:text-white"
                      }`}
                    >
                      {Icon ? <Icon size={12} /> : null}
                      {tab.label}
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={copyToClipboard}
                  aria-label="Salin kode"
                  className={`ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${
                    copied
                      ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                      : "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-accent)]/50 hover:text-[color:var(--pk-accent)]"
                  }`}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span className="hidden sm:inline">
                    {copied ? "Tersalin" : "Salin"}
                  </span>
                </button>
              </div>

              <pre className="pk-scroll pk-terminal overflow-x-auto p-5 font-mono text-[12.5px] leading-6 text-[color:var(--pk-text)]">
                <code>{code}</code>
              </pre>
            </div>
          </section>

          {/* Models */}
          <section id="models" className="pk-panel pk-inview p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              Model yang Tersedia
            </h2>
            <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
              Daftar model yang dapat diakses via API.
            </p>

            <div className="mt-6 space-y-3">
              {MODELS.map((model) => (
                <div
                  key={model.name}
                  className="pk-lift flex flex-col gap-4 rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-accent)]">
                      <Code2 size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="truncate font-mono text-sm font-medium text-[color:var(--pk-text)]">
                          {model.name}
                        </code>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2 py-0.5 text-[10px] font-medium text-[#6ee7b7]">
                          {model.tier}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--pk-text-dim)]">
                        {model.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:flex-shrink-0">
                    <p className="font-mono text-base font-semibold text-[color:var(--pk-accent)]">
                      {model.price}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                      per 1M tokens
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-[color:var(--pk-text-dim)]">
              Lihat semua model di{" "}
              <Link
                href="/#harga"
                className="font-medium text-[color:var(--pk-accent)] hover:underline"
              >
                halaman harga
              </Link>
            </p>
          </section>

          {/* CTA bawah */}
          <section className="pk-panel pk-featured pk-inview relative overflow-hidden p-6 text-center sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(240,169,59,0.22),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                Siap mulai?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Buat akun, isi kuota, dan kirim request pertama kamu dalam
                hitungan menit.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="pk-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm"
                  >
                    <ArrowLeft size={14} />
                    Kembali ke dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="pk-btn-primary inline-flex min-h-11 items-center justify-center px-5 text-sm"
                    >
                      Buat akun gratis
                    </Link>
                    <Link
                      href="/login"
                      className="pk-btn-ghost inline-flex min-h-11 items-center justify-center px-5 text-sm font-medium"
                    >
                      Sudah punya akun
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}