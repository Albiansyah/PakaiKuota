import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error: "endpoint_retired",
      message:
        "Flow pembelian token sudah tidak tersedia. Gunakan top up saldo di /dashboard/topup.",
    },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json({ error: "endpoint_retired" }, { status: 410 })
}