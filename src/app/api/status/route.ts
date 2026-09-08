import { NextResponse } from 'next/server'

export async function GET() {
  // simple static status — would query New API in real impl
  return NextResponse.json({
    status: 'operational',
    gateway: 'ok',
    upstream: 'ok',
    timestamp: new Date().toISOString(),
  })
}
