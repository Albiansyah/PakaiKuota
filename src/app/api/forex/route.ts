import { NextResponse } from 'next/server'
import { getUsdIdrRate } from '@/lib/forex'

export async function GET() {
  const rate = await getUsdIdrRate()
  return NextResponse.json({ rate })
}