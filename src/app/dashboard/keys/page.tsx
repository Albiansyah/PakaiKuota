"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  revoked_at: string | null;
  created_at: string;
};

type StatusFilter = "all" | "active" | "revoked";
type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const searchRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setState("loading");
    const response = await fetch("/api/keys");
    if (!response.ok) {
      setState("error");
      return;
    }
    const data = (await response.json()) as { keys: ApiKey[] };
    setKeys(data.keys);
    setState("ready");
  }

  useEffect(() => {
    let active = true;
    fetch("/api/keys")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setState("error");
          return;
        }
        const data = (await response.json()) as { keys: ApiKey[] };
        if (!active) return;
        setKeys(data.keys);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function generate(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await response.json()) as { key?: string; error?: string };
    if (!response.ok || !data.key) {
      setMessage(data.error ?? "API key tidak bisa dibuat.");
      return;
    }
    setNewKey(data.key);
    setName("");
    await load();
  }

  async function revoke(id: string) {
    const response = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("API key tidak bisa dicabut.");
      return;
    }
    await load();
  }

  async function copyNewKey() {
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const stats = useMemo(() => {
    const active = keys.filter((k) => !k.revoked_at).length;
    return {
      total: keys.length,
      active,
      revoked: keys.length - active,
    };
  }, [keys]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = keys;
    if (status === "active") list = list.filter((k) => !k.revoked_at);
    if (status === "revoked") list = list.filter((k) => k.revoked_at);
    if (q) {
      list = list.filter((k) => k.name.toLowerCase().includes(q));
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      const at = new Date(a.created_at).getTime();
      const bt = new Date(b.created_at).getTime();
      return sort === "oldest" ? at - bt : bt - at;
    });
    return sorted;
  }, [keys, query, status, sort]);

  const hasFilter = query.trim().length > 0 || status !== "all";

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <header className="border-b border-[color:var(--pk-line)] bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Akses
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            API keys
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Buat key untuk mengakses endpoint chat completions. Plaintext hanya
            ditampilkan satu kali.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section className="pk-panel pk-inview p-5 sm:p-6">
          <h2 className="text-base font-semibold">Generate key baru</h2>
          <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
            Beri nama agar mudah diidentifikasi nanti.
          </p>

          <form
            onSubmit={generate}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="key-name">
              Nama key
            </label>
            <input
              id="key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama key, misalnya laptop kerja"
              className="min-h-11 flex-1 rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
            />
            <button
              type="submit"
              className="pk-btn-primary inline-flex min-h-11 items-center justify-center px-5 text-sm"
            >
              Generate API key
            </button>
          </form>

          {message && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]"
            >
              <span aria-hidden className="mt-0.5">
                ⚠
              </span>
              {message}
            </p>
          )}
        </section>

        {newKey && (
          <section
            role="alert"
            className="pk-panel pk-featured pk-inview mt-6 overflow-hidden p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--pk-accent)]/15 text-xs text-[color:var(--pk-accent)]">
                !
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">
                  Simpan key ini sekarang.
                </h2>
                <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
                  Plaintext tidak akan ditampilkan lagi setelah halaman ini
                  ditutup.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="pk-scroll min-w-0 flex-1 overflow-x-auto rounded-xl border border-[color:var(--pk-line-2)] bg-[#060d19] px-4 py-3 font-mono text-sm text-[color:var(--pk-text)]">
                {newKey}
              </code>
              <button
                type="button"
                onClick={copyNewKey}
                className={`pk-copy-btn inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all ${
                  copied
                    ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                    : "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-dim)] hover:border-[color:var(--pk-accent)]/50 hover:text-[color:var(--pk-accent)]"
                }`}
              >
                {copied ? (
                  <>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Tersalin
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Salin key
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">
                Daftar key
              </h2>
              <p className="mt-1 text-sm text-[color:var(--pk-text-dim)]">
                Revoke berlaku segera.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[color:var(--pk-text-mute)]">
              <span>{stats.total} total</span>
              <span className="h-1 w-1 rounded-full bg-[color:var(--pk-line-2)]" />
              <span className="text-[#6ee7b7]">{stats.active} aktif</span>
              <span className="h-1 w-1 rounded-full bg-[color:var(--pk-line-2)]" />
              <span className="text-[#fca5a5]">{stats.revoked} dicabut</span>
            </div>
          </div>

          {state === "ready" && keys.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--pk-text-mute)]"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama key..."
                  className="min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] pl-10 pr-16 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Bersihkan pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-[color:var(--pk-text-mute)] transition-colors hover:text-[color:var(--pk-text)]"
                  >
                    Clear
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[color:var(--pk-line-2)] bg-[#0b1626] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--pk-text-mute)] sm:inline-block">
                    /
                  </kbd>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div
                  role="tablist"
                  aria-label="Filter status"
                  className="inline-flex rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] p-1"
                >
                  {(
                    [
                      { id: "all", label: "Semua" },
                      { id: "active", label: "Aktif" },
                      { id: "revoked", label: "Dicabut" },
                    ] as { id: StatusFilter; label: string }[]
                  ).map((tab) => {
                    const active = status === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={active}
                        type="button"
                        onClick={() => setStatus(tab.id)}
                        className={`min-h-9 rounded-lg px-3 text-xs font-medium transition-all ${
                          active
                            ? "bg-gradient-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                            : "text-[color:var(--pk-text-dim)] hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <label className="sr-only" htmlFor="sort">
                  Urutkan
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="min-h-11 rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3 pr-8 text-xs text-[color:var(--pk-text)] outline-none transition-colors focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                >
                  <option value="newest">Terbaru dulu</option>
                  <option value="oldest">Terlama dulu</option>
                  <option value="name-asc">Nama A → Z</option>
                  <option value="name-desc">Nama Z → A</option>
                </select>
              </div>
            </div>
          )}

          <div className="pk-panel pk-inview mt-4 overflow-hidden">
            {state === "loading" && (
              <p className="p-6 text-sm text-[color:var(--pk-text-dim)]">
                Memuat API key...
              </p>
            )}

            {state === "error" && (
              <p role="alert" className="p-6 text-sm text-[#fca5a5]">
                Daftar API key tidak bisa dimuat.
              </p>
            )}

            {state === "ready" && keys.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-semibold">Belum ada API key.</p>
                <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                  Generate API key pertama kamu untuk mulai memakai API.
                </p>
              </div>
            )}

            {state === "ready" && keys.length > 0 && filtered.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-semibold">Tidak ada key yang cocok.</p>
                <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                  Coba ubah kata kunci atau filter status.
                </p>
                {hasFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setStatus("all");
                    }}
                    className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
                  >
                    Reset filter
                  </button>
                )}
              </div>
            )}

            {state === "ready" && filtered.length > 0 && (
              <div className="pk-scroll overflow-x-auto">
                <table className="w-full min-w-[42rem] text-left text-sm">
                  <thead className="border-b border-[color:var(--pk-line)] text-[color:var(--pk-text-mute)]">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Nama
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Prefix
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((key) => (
                      <tr
                        key={key.id}
                        className="border-b border-[color:var(--pk-line)] transition-colors last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4 font-medium">
                          {query ? (
                            <Highlight text={key.name} query={query} />
                          ) : (
                            key.name
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-[color:var(--pk-text-dim)]">
                          {key.key_prefix}...
                        </td>
                        <td className="px-5 py-4">
                          {key.revoked_at ? (
                            <span className="inline-flex items-center gap-2 text-[#fca5a5]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#f87171]" />
                              Dicabut
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-[#6ee7b7]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                              Aktif
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {!key.revoked_at && (
                            <button
                              onClick={() => void revoke(key.id)}
                              className="inline-flex min-h-9 items-center rounded-lg border border-[#f87171]/30 px-3 text-xs font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/10"
                            >
                              Cabut
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {state === "ready" && keys.length > 0 && filtered.length > 0 && (
            <p className="mt-3 text-xs text-[color:var(--pk-text-mute)]">
              Menampilkan {filtered.length} dari {keys.length} key
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <mark className="rounded bg-[color:var(--pk-accent)]/25 px-0.5 text-[color:var(--pk-accent-2)]">
        {match}
      </mark>
      {after}
    </>
  );
}