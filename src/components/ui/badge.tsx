import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--bg-surface)] text-[var(--text-primary)]",
        secondary:
          "border-transparent bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]",
        destructive:
          "border-transparent bg-[var(--error)] text-white",
        outline: "border-[var(--border-color)] text-[var(--text-primary)]",
        success:
          "border-transparent bg-[var(--success)]/20 text-[var(--success)]",
        warning:
          "border-transparent bg-[var(--accent)]/20 text-[var(--accent-text)]",
        accent:
          "border-transparent bg-[var(--accent)] text-[var(--bg-base)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
