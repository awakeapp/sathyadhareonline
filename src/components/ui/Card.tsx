import * as React from "react"
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--color-surface)]',
        'border border-[var(--color-border)]',
        'rounded-[var(--radius-md)]',
        'transition-all duration-200',
        paddings[padding],
        hoverable && [
          'cursor-pointer',
          'hover:shadow-[var(--shadow-md)]',
          'hover:border-[var(--color-primary)]/20',
          'active:scale-[0.99]',
        ],
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'mb-3 pb-3',
        'border-b border-[var(--color-border)]',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-[15px] font-semibold',
        'text-[var(--color-text)]',
        'leading-snug',
        className
      )}
    >
      {children}
    </h3>
  )
}

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-muted)]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { CardDescription, CardContent, CardFooter }
