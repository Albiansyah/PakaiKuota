export type TopupPackageId =
  | "starter"
  | "popular"
  | "value"
  | "pro"
  | "business"

export interface TopupPackage {
  id: TopupPackageId
  name: string
  amount: number
  bonus: number
  detail: string
  featured: boolean
}

export const TOPUP_PACKAGES: TopupPackage[] = [
  {
    id: "starter",
    name: "Starter",
    amount: 25_000,
    bonus: 0,
    detail: "Cocok untuk coba-coba dan eksperimen awal.",
    featured: false,
  },
  {
    id: "popular",
    name: "Populer",
    amount: 50_000,
    bonus: 0,
    detail: "Paling banyak dipilih untuk pemakaian rutin.",
    featured: true,
  },
  {
    id: "value",
    name: "Value",
    amount: 100_000,
    bonus: 0,
    detail: "Untuk workflow harian dengan volume sedang.",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    amount: 500_000,
    bonus: 0,
    detail: "Untuk beban kerja tim dan proyek produktif.",
    featured: false,
  },
  {
    id: "business",
    name: "Business",
    amount: 1_000_000,
    bonus: 0,
    detail: "Untuk penggunaan intensif dan integrasi produksi.",
    featured: false,
  },
]

export const TOPUP_MIN = 10_000
export const TOPUP_MAX = 50_000_000
export const TOPUP_STEP = 1_000

export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`
}

export function usdPer1MFromPer1k(usdPer1k: number): number {
  if (usdPer1k <= 0) return 0
  return usdPer1k * 1000
}

export function formatUsd(value: number): string {
  if (value <= 0) return "Gratis"
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) {
    return `$${value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`
  }
  return `$${value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`
}

export function formatUsdPer1M(usdPer1k: number): string {
  return formatUsd(usdPer1MFromPer1k(usdPer1k))
}