import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateApiKey } from "@/lib/utils"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { data, error } = await (supabase
    .from("api_keys")
    .select("id, name, key_prefix, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keys: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const { full, prefix, hash } = generateApiKey()

  const { data: insertedData, error } = await (supabase.from("api_keys").insert({
    user_id: user.id,
    name,
    key_prefix: prefix,
    key_hash: hash,
    is_active: true,
  }).select('id').single() as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!insertedData) return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })

  // Return full key only once
  return NextResponse.json({ key: full, id: insertedData.id })
}
