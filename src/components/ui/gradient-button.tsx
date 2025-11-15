import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const gradientButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-xl font-semibold",
    "transition-all duration-200 ease-in-out",
    // Focus visible mejorado (2px ring)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "relative overflow-hidden",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Touch feedback para móvil
    "active:scale-[0.96]",
    // Tamaño mínimo para touch targets (WCAG 2.1 AA: 44x44px)
    "min-h-[44px] min-w-[44px]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-br from-[#667eea] to-[#764ba2]",
          "text-white",
          "shadow-[0_2px_12px_rgba(102,126,234,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:shadow-[0_4px_16px_rgba(102,126,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]",
          // Hover effect solo en desktop
          "@media(hover:hover)and(pointer:fine){hover:scale-[1.02]}",
        ],
        secondary: [
          "bg-gradient-to-br from-secondary to-secondary/80",
          "text-secondary-foreground",
          "shadow-[0_2px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "hover:shadow-[0_4px_16px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "@media(hover:hover)and(pointer:fine){hover:scale-[1.02]}",
        ],
        outline: [
          "bg-transparent",
          "border-2 border-transparent",
          "bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-padding",
          "text-foreground",
          "relative",
          // Gradient border effect
          "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit]",
          "before:bg-gradient-to-br before:from-[#667eea] before:to-[#764ba2]",
          "before:transition-opacity before:duration-300",
          "hover:before:opacity-10",
          "@media(hover:hover)and(pointer:fine){hover:-translate-y-0.5}",
          "shadow-[0_2px_8px_rgba(102,126,234,0.15)]",
          "hover:shadow-[0_4px_12px_rgba(102,126,234,0.2)]",
        ],
      },
      size: {
        sm: "text-sm px-4 py-2 rounded-lg min-h-[40px]",
        md: "text-base px-6 py-3 rounded-xl",
        lg: "text-lg px-8 py-4 rounded-2xl min-h-[52px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {/* Shine effect - solo desktop */}
        {variant === "primary" && !isDisabled && (
          <span
            className={cn(
              "absolute inset-0 -translate-x-full",
              "bg-gradient-to-r from-transparent via-white/30 to-transparent",
              "transition-transform duration-500",
              "group-hover:translate-x-full",
              // Solo en desktop con hover
              "hidden @media(hover:hover)and(pointer:fine):block",
            )}
            aria-hidden="true"
          />
        )}

        {/* Loading spinner */}
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-label="Cargando" />
        )}

        {/* Icon izquierdo */}
        {!loading && icon && iconPosition === "left" && (
          <span className="h-5 w-5 flex items-center justify-center">{icon}</span>
        )}

        {/* Contenido */}
        {children}

        {/* Icon derecho */}
        {!loading && icon && iconPosition === "right" && (
          <span className="h-5 w-5 flex items-center justify-center">{icon}</span>
        )}
      </Comp>
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants }
