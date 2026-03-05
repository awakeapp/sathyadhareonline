import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline"
  size?: "sm" | "md" | "lg" | "icon"
  loading?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", asChild = false, loading = false, fullWidth = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    
    // Base styles
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
    
    // Variants
    const variants = {
      primary: "bg-[var(--color-primary)] text-black hover:bg-[#ffed4a] shadow-sm shadow-[var(--color-primary)]/20",
      secondary: "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
      ghost: "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
      destructive: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
      outline: "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)]",
    }
    
    // Sizes
    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6",
      lg: "h-14 px-8 text-base",
      icon: "h-11 w-11",
    }

    return (
      <Comp
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
