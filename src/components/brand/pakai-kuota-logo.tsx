"use client"

import { useSettings } from "@/components/providers/settings-provider"

export function PakaiKuotaLogo({ size = 32 }: { size?: number }) {
  const { settings } = useSettings()

  // Kalau admin upload custom logo, pakai itu
  if (settings?.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={settings.logo_url}
        alt={settings.brand_name ?? "Logo"}
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    )
  }

  // Fallback ke SVG default
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="absolute inset-0 rounded-[10px] bg-linear-to-br from-[#ffc266] to-[#f0a93b] opacity-30 blur-md" />

      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className="relative"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="pk-logo-grad"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffc266" />
            <stop offset="1" stopColor="#f0a93b" />
          </linearGradient>
          <linearGradient
            id="pk-logo-shine"
            x1="0"
            y1="0"
            x2="0"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="9"
          fill="url(#pk-logo-grad)"
        />

        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="9"
          fill="url(#pk-logo-shine)"
        />

        <path
          d="M11 22.5V10.5C11 9.94772 11.4477 9.5 12 9.5H17.5C19.1569 9.5 20.5 10.8431 20.5 12.5V14.5C20.5 16.1569 19.1569 17.5 17.5 17.5H15V22.5"
          stroke="#10192b"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        <path
          d="M22 14L19.5 18H21.5L19 22L23 17H21L22.5 14H22Z"
          fill="#10192b"
          opacity="0.85"
        />
      </svg>
    </span>
  )
}