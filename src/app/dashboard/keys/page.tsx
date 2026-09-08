"use client";

import { FormEvent, useEffect, useState } from "react";

type ApiKey = { id: string; name: string; key_prefix: string; revoked_at: string | null; created_at: string };

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setState("loading");
    const response = await fetch("/api/keys");
    if (!response.ok) { setState("error"); return; }
    const data = await response.json() as { keys: ApiKey[] };
    setKeys(data.keys);
    setState("ready");
  }
  useEffect(() => {
    let active = true;
    fetch("/api/keys")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) { setState("error"); return; }
        const data = await response.json() as { keys: ApiKey[] };
        if (!active) return;
        setKeys(data.keys);
        setState("ready");
      })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, []);

  async function generate(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await response.json() as { key?: string; error?: string };
    if (!response.ok || !data.key) { setMessage(data.error ?? "API key tidak bisa dibuat."); return; }
    setNewKey(data.key);
    setName("");
    await load();
  }

  async function revoke(id: string) {
    const response = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (!response.ok) { setMessage("API key tidak bisa dicabut."); return; }
    await load();
  }

  return <div><header className="border-b border-[#d9e0e8] bg-white px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-[#D97B2E]">Akses</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">API keys</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#40536d]">Buat key untuk mengakses endpoint chat completions. Plaintext hanya ditampilkan satu kali.</p></header><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><section className="border border-[#d9e0e8] bg-white p-5 sm:p-6"><h2 className="font-semibold">Generate key baru</h2><form onSubmit={generate} className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="key-name">Nama key</label><input id="key-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama key, misalnya laptop kerja" className="min-h-11 flex-1 border border-[#b9c5d3] px-3 outline-none focus:border-[#122542] focus:ring-2 focus:ring-[#F0A93B]" /><button className="min-h-11 bg-[#F0A93B] px-5 font-semibold text-[#122542] hover:bg-[#f7bb5d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#122542]">Generate API key</button></form>{message && <p role="alert" className="mt-4 text-sm text-[#D64545]">{message}</p>}</section>{newKey && <section role="alert" className="mt-6 border-l-2 border-[#D97B2E] bg-[#fff4df] p-5"><h2 className="font-semibold">Simpan key ini sekarang.</h2><p className="mt-2 text-sm text-[#6d4b1c]">Plaintext tidak akan ditampilkan lagi setelah halaman ini ditutup.</p><code className="mt-4 block overflow-x-auto border border-[#e5c98f] bg-white p-3 font-mono text-sm text-[#122542]">{newKey}</code><button onClick={() => void navigator.clipboard?.writeText(newKey)} className="mt-4 min-h-11 border border-[#122542] px-4 text-sm font-semibold hover:bg-white focus-visible:outline-2 focus-visible:outline-[#122542]">Salin key</button></section>}<section className="mt-10"><div className="flex items-end justify-between"><div><h2 className="text-xl font-semibold">Daftar key</h2><p className="mt-1 text-sm text-[#40536d]">Revoke berlaku segera.</p></div></div><div className="mt-4 overflow-x-auto border-y border-[#d9e0e8] bg-white">{state === "loading" && <p className="p-6 text-sm text-[#40536d]">Memuat API key...</p>}{state === "error" && <p role="alert" className="p-6 text-sm text-[#D64545]">Daftar API key tidak bisa dimuat.</p>}{state === "ready" && keys.length === 0 && <div className="p-8"><p className="font-semibold">Belum ada API key.</p><p className="mt-2 text-sm text-[#40536d]">Generate API key pertama kamu untuk mulai memakai API.</p></div>}{state === "ready" && keys.length > 0 && <table className="w-full min-w-[42rem] text-left text-sm"><thead className="border-b border-[#d9e0e8] text-[#40536d]"><tr><th className="px-5 py-4 font-medium">Nama</th><th className="px-5 py-4 font-medium">Prefix</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 text-right font-medium">Aksi</th></tr></thead><tbody>{keys.map((key) => <tr key={key.id} className="border-b border-[#eef1f5] last:border-0"><td className="px-5 py-4 font-medium">{key.name}</td><td className="px-5 py-4 font-mono text-[#40536d]">{key.key_prefix}...</td><td className={`px-5 py-4 ${key.revoked_at ? "text-[#D64545] line-through" : "text-[#1F9E6E]"}`}>{key.revoked_at ? "Dicabut" : "Aktif"}</td><td className="px-5 py-4 text-right">{!key.revoked_at && <button onClick={() => void revoke(key.id)} className="min-h-11 px-2 text-[#D64545] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#D64545]">Cabut</button>}</td></tr>)}</tbody></table>}</div></section></div></div>;
}
