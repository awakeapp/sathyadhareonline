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
    // Base styles
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50"
    
    // Variants
    const variants = {
      primary: "bg-[var(--color-primary)] text-black hover:bg-[#ffed4a] shadow-[0_4px_0_0_rgba(104,93,230,0.3)] hover:shadow-[0_2px_0_0_rgba(104,93,230,0.3)] hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-none",
      secondary: "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-none",
      ghost: "text-[var(--color-text)] hover:bg-[var(--color-surface-2)] active:scale-95",
      destructive: "bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95",
      outline: "border-2 border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)] active:scale-95",
    }
    
    // Sizes
    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6",
      lg: "h-14 px-8 text-base",
      icon: "h-11 w-11",
    }

    const classes = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className
    );

    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
      if (props.onClick) props.onClick(e);
    };

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        {...props}
        onClick={handleClick}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
