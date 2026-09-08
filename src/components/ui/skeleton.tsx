import { cn } from "@/lib/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-surface)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
