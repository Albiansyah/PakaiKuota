"use client";

import { useState } from "react";

type ModelCardProps = {
  slug: string;
  name?: string;
  group?: string;
};

export function ModelCard({ slug, name, group }: ModelCardProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="pk-panel pk-lift group relative flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {group ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
              {group}
            </p>
          ) : null}
          <h3 className="mt-1.5 truncate text-sm font-semibold text-[color:var(--pk-text)]">
            {name ?? slug}
          </h3>
        </div>
        <span
          aria-hidden
          className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--pk-accent)] shadow-[0_0_10px_rgba(240,169,59,0.7)]"
        />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <code className="pk-scroll min-w-0 flex-1 truncate rounded-lg border border-[color:var(--pk-line)] bg-[#0b1626]/70 px-3 py-2 font-mono text-xs text-[color:var(--pk-text-dim)]">
          {slug}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Salin ${slug}`}
          className={`pk-copy-btn inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${
            copied
              ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
              : "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-dim)] hover:border-[color:var(--pk-accent)]/50 hover:text-[color:var(--pk-accent)]"
          }`}
        >
          {copied ? (
            <>
              <svg
                className="h-3.5 w-3.5"
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
                className="h-3.5 w-3.5"
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
              Salin
            </>
          )}
        </button>
      </div>
    </article>
  );
}