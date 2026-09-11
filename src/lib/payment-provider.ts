/* ============================================================
   PAYMENT PROVIDER ABSTRACTION
   ============================================================
   Switch provider aktif via env PAYMENT_PROVIDER.
   Pakasir JANGAN DIHAPUS — hanya di-disable sementara.
   ============================================================ */

export type PaymentProvider = "gopay_qris" | "pakasir"

export const ACTIVE_PROVIDER: PaymentProvider =
  (process.env.PAYMENT_PROVIDER as PaymentProvider) ?? "gopay_qris"

export function isGopayQrisActive(): boolean {
  return ACTIVE_PROVIDER === "gopay_qris"
}

export function isPakasirActive(): boolean {
  return ACTIVE_PROVIDER === "pakasir"
}

/* ============================================================
   GOPAY QRIS CONFIG
   ============================================================ */

export type GopayQrisConfig = {
  qrisUrl: string
  merchantName: string
  merchantId: string | null
  instructions: string
}

export function getGopayQrisConfig(): GopayQrisConfig {
  const qrisUrl = process.env.GOPAY_QRIS_URL?.trim()
  if (!qrisUrl) {
    throw new Error("GOPAY_QRIS_URL_MISSING")
  }
  return {
    qrisUrl,
    merchantName: process.env.GOPAY_MERCHANT_NAME?.trim() || "PakaiKuota",
    merchantId: process.env.GOPAY_MERCHANT_ID?.trim() || null,
    instructions:
      "Buka aplikasi GoPay/OVO/DANA/ShopeePay, scan QRIS di atas, " +
      "masukkan nominal sesuai order, lalu klik 'Saya Sudah Bayar'.",
  }
}