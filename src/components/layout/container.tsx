import { cn } from "@/lib/cn"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "default" | "sm" | "lg" | "xl" | "full"
}

export function Container({
  className,
  size = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "xs" && "max-w-sm",
        size === "default" && "max-w-7xl",
        size === "sm" && "max-w-3xl",
        size === "lg" && "max-w-5xl",
        size === "xl" && "max-w-[90rem]",
        size === "full" && "max-w-full",
        className
      )}
      {...props}
    />
  )
}

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "surface" | "bordered" | "accent"
}

export function Section({
  className,
  variant = "default",
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "py-12 md:py-16 lg:py-20",
        variant === "surface" && "bg-[var(--bg-surface)]",
        variant === "bordered" && "border-y border-[var(--border-color)]",
        variant === "accent" && "bg-[var(--accent)]/5",
        className
      )}
      {...props}
    />
  )
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

export function PageHeader({
  className,
  title,
  description,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)} {...props}>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h1>
      {description && (
        <p className="text-[var(--text-secondary)]">
          {description}
        </p>
      )}
    </div>
  )
}

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5
  gap?: "sm" | "md" | "lg"
}

export function Grid({
  className,
  cols = 3,
  gap = "md",
  ...props
}: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        cols === 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
        gap === "sm" && "gap-4",
        gap === "md" && "gap-6",
        gap === "lg" && "gap-8",
        className
      )}
      {...props}
    />
  )
}
