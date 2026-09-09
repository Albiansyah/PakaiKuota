"use client";

import { FormEvent, useEffect, useState } from "react";

type Model = { id: string; object: string; owned_by: string };

export default function PlaygroundPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [system, setSystem] = useState("You are a concise assistant.");
  const [message, setMessage] = useState("");
  const [responseText, setResponseText] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!apiKey) return;
    let active = true;
    fetch("/api/v1/models", { headers: { authorization: `Bearer ${apiKey}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("API key tidak valid atau model tidak tersedia.");
        const data = await res.json() as { data: Model[] };
        if (active) { setModels(data.data); setModel(data.data[0]?.id ?? ""); setState("ready"); }
      })
      .catch((err: Error) => { if (active) { setError(err.message); setState("error"); } });
    return () => { active = false; };
  }, [apiKey]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError(""); setResponseText("");
    try {
      const response = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}`, "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: message }], max_tokens: 256, stream: true }),
      });
      if (!response.ok) { const data = await response.json().catch(() => null) as { error?: { message?: string } } | null; throw new Error(data?.error?.message ?? "Request gagal."); }
      if (!response.body) throw new Error("Response kosong.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let output = "";
      while (true) { const chunk = await reader.read(); if (chunk.done) break; output += decoder.decode(chunk.value, { stream: true }); setResponseText(output); }
    } catch (err) { setError(err instanceof Error ? err.message : "Request gagal."); }
    setSubmitting(false);
  }

  return <div className="min-h-screen bg-[#FAFAF9]">
    <header className="border-b border-[#d9e0e8] bg-white px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-[#D97B2E]">Developer tool</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Playground</h1><p className="mt-3 max-w-xl text-sm text-[#40536d]">Uji chat completions dengan konfigurasi sederhana.</p></header>
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <form onSubmit={submit} className="min-w-0 border border-[#d9e0e8] bg-white p-5 sm:p-6"><div className="grid gap-5">
        <label className="block text-sm font-medium">API key<input required type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="pk_live_..." className="mt-2 min-h-11 w-full border border-[#b9c5d3] px-3 font-mono outline-none focus:border-[#122542]" /><span className="mt-2 block text-xs text-[#40536d]">Key hanya dipakai untuk request ini.</span></label>
        <label className="block text-sm font-medium">Model<select required disabled={state !== "ready"} value={model} onChange={(event) => setModel(event.target.value)} className="mt-2 min-h-11 w-full border border-[#b9c5d3] bg-white px-3 outline-none focus:border-[#122542]"><option value="">{state === "error" ? "Model tidak tersedia" : "Masukkan API key"}</option>{models.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></label>
        <label className="block text-sm font-medium">System message<textarea value={system} onChange={(event) => setSystem(event.target.value)} rows={3} className="mt-2 w-full border border-[#b9c5d3] px-3 py-2 outline-none focus:border-[#122542]" /></label>
        <label className="block text-sm font-medium">Pesan<textarea required value={message} onChange={(event) => setMessage(event.target.value)} rows={7} className="mt-2 w-full resize-y border border-[#b9c5d3] px-3 py-2 outline-none focus:border-[#122542]" /></label>
        {error && <p role="alert" className="border-l-2 border-[#D64545] bg-[#f9e8e8] px-4 py-3 text-sm text-[#8f2929]">{error}</p>}
        <button type="submit" disabled={submitting || state !== "ready" || !message.trim()} className="min-h-11 bg-[#F0A93B] px-5 font-semibold text-[#122542] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Mengirim..." : "Kirim"}</button>
      </div></form>
      <section className="min-w-0 border border-[#d9e0e8] bg-white p-5 sm:p-6"><h2 className="font-semibold">Response</h2><pre className="mt-4 min-h-96 max-w-full overflow-auto whitespace-pre-wrap break-words bg-[#122542] p-4 text-sm text-[#dbe4ef]">{responseText || "Response akan tampil di sini."}</pre></section>
    </div></div>
  </div>;
}
