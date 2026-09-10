import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_FILES = 3
const ALLOWED_EXT = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "pdf",
  "txt",
  "doc",
  "docx",
  "zip",
]

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const phone = String(formData.get("phone") ?? "").trim()
    const category = String(formData.get("category") ?? "Umum").trim()
    const message = String(formData.get("message") ?? "").trim()

    // Validasi
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nama, email, dan pesan wajib diisi" },
        { status: 400 }
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      )
    }
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Pesan maksimal 2000 karakter" },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()

    // Upload files
    const fileEntries = formData.getAll("files") as File[]
    const attachments: { name: string; url: string; size: number }[] = []

    for (const file of fileEntries.slice(0, MAX_FILES)) {
      if (file.size > MAX_FILE_SIZE) continue

      const ext = (file.name.split(".").pop() ?? "").toLowerCase()
      if (!ALLOWED_EXT.includes(ext)) continue

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`

      const { error: uploadErr } = await supabase.storage
        .from("feedback-attachments")
        .upload(path, file, { cacheControl: "3600", upsert: false })

      if (uploadErr) continue

      // Karena bucket private, kita simpan path-nya saja.
      // Admin akan generate signed URL saat lihat detail.
      attachments.push({
        name: file.name,
        url: path,
        size: file.size,
      })
    }

    // IP & user agent (untuk anti-spam & audit)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown"
    const userAgent = req.headers.get("user-agent") ?? ""

    const { error: insertErr } = await supabase.from("feedback").insert({
      name,
      email,
      phone: phone || null,
      category,
      message,
      attachments,
      ip_address: ip,
      user_agent: userAgent,
    })

    if (insertErr) {
      console.error("Feedback insert error:", insertErr)
      return NextResponse.json(
        { error: "Gagal menyimpan feedback" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Feedback API error:", err)
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}