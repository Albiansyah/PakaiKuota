import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function generateOrderId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `TRX-${ts}-${rand}`.toUpperCase()
}

export function maskApiKey(key: string): string {
  if (key.length < 12) return key
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

export function generateApiKey(): { full: string; prefix: string; hash: string } {
  const random = crypto.getRandomValues(new Uint8Array(24))
  const hex = Array.from(random, (b) => b.toString(16).padStart(2, "0")).join("")
  const full = `pk-${hex}`
  const prefix = full.slice(0, 7)
  const hash = Buffer.from(full).toString("base64")
  return { full, prefix, hash }
}