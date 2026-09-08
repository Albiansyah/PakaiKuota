# Fix: Admin Selalu Diarahkan ke Dashboard User

**Gejala:**
1. Login pakai akun admin → tetap mendarat di `/dashboard` (bukan `/admin`)
2. Ketik manual URL `/admin` → diminta login lagi (padahal sudah login) → setelah login, balik lagi ke `/dashboard`

Ada 2 bug terpisah yang menyebabkan ini.

---

## Bug 1: Middleware Buang Cookie Session Saat Redirect

**File:** `src/middleware.ts`

**Root cause:** `updateSession(request)` me-refresh session token Supabase dan menempelkan cookie baru ke object `response`. Tapi setiap kali middleware ini redirect (ke `/login` atau `/dashboard`), dia pakai `Response.redirect()` — ini API standar yang bikin response BARU DARI NOL, cookie yang sudah di-refresh di `response` tidak ikut terbawa. Akibatnya session "terputus" secara halus, itu sebabnya user diminta login ulang padahal sudah login.

**Fix — ganti seluruh isi `src/middleware.ts` jadi:**

```typescript
import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: import("next/server").NextRequest) {
  const response = await updateSession(request)

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const { createServerClient } = await import("@supabase/ssr")
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      const redirectRes = NextResponse.redirect(url)
      response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c))
      return redirectRes
    }

    const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!data || (data.role !== "super_admin" && data.role !== "support")) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      const redirectRes = NextResponse.redirect(url)
      response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c))
      return redirectRes
    }
  }

  // Bug 2 juga di-handle di sini: kalau admin akses /dashboard manual, paksa ke /admin
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const { createServerClient } = await import("@supabase/ssr")
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (data && (data.role === "super_admin" || data.role === "support")) {
        const url = request.nextUrl.clone()
        url.pathname = "/admin"
        const redirectRes = NextResponse.redirect(url)
        response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c))
        return redirectRes
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
}
```

Catatan: query `select("role")` ke tabel `users` sekarang jalan 2x kalau user hit `/admin` maupun `/dashboard` di request berbeda — ini oke untuk sekarang (data kecil, query cepat), tapi kalau nanti mau optimasi, bisa refactor jadi 1 helper function yang di-cache per-request.

---

## Bug 2: Redirect Setelah Login Hardcoded ke `/dashboard`

**Langkah agent:**

1. Cari file yang handle proses setelah login sukses:
```powershell
Get-ChildItem -Path src -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "router\.push\(.\/dashboard.\)|redirect\(.\/dashboard.\)" | Select-Object Path, LineNumber
```
Kemungkinan besar ada di `src/app/login/page.tsx` atau file action/handler terkait auth.

2. Setelah ketemu, ganti logic-nya: jangan langsung `router.push('/dashboard')` tanpa syarat. Setelah login berhasil, query role user itu dulu, baru tentukan tujuan:

```typescript
// Contoh pattern, sesuaikan sama struktur file yang ditemukan
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single()

if (profile?.role === "super_admin" || profile?.role === "support") {
  router.push("/admin")
} else {
  router.push("/dashboard")
}
```

3. Setelah kedua fix di atas diterapkan, hasil akhirnya: middleware di Bug 1 jadi **pengaman kedua** (kalau ada yang coba akses langsung tanpa lewat flow login normal), dan fix di sini jadi **pengalaman utama** (langsung ke tujuan yang benar begitu login sukses, gak perlu nunggu redirect dari middleware).

---

## Checklist Verifikasi

- [ ] Login sebagai admin → langsung mendarat di `/admin`, bukan `/dashboard`
- [ ] Login sebagai user biasa → tetap mendarat di `/dashboard` seperti biasa
- [ ] Admin ketik manual `/dashboard` di address bar → auto-redirect ke `/admin`
- [ ] Admin ketik manual `/admin` tanpa login → diarahkan ke `/login`, dan setelah login sukses, TIDAK diminta login ulang lagi (session tetap utuh)
- [ ] User biasa (bukan admin) coba akses `/admin` manual → ditolak, balik ke `/dashboard`