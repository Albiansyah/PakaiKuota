import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default async function Icon() {
  // Fetch favicon dari settings
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/settings`, {
    next: { revalidate: 3600 },
  })
  const { settings } = await res.json()

  if (settings?.favicon_url) {
    // Redirect ke favicon custom
    return Response.redirect(settings.favicon_url)
  }

  // Fallback: generate favicon dari kode
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f0a93b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          fontSize: 20,
          fontWeight: 700,
          color: "#10192b",
        }}
      >
        PK
      </div>
    ),
    { ...size }
  )
}