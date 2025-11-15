import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassCardVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        light: [
          "bg-white/10 dark:bg-[rgba(17,25,40,0.85)]",
          "border-white/20 dark:border-white/15",
          "shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]",
        ],
        dark: [
          "bg-[rgba(17,25,40,0.85)] dark:bg-[rgba(17,25,40,0.9)]",
          "border-white/[0.125] dark:border-white/[0.15]",
          "shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]",
        ],
      },
      blur: {
        sm: "backdrop-blur-[10px]",
        md: "backdrop-blur-[12px]",
        lg: "backdrop-blur-[20px]",
      },
      shadow: {
        sm: "",
        md: "",
        lg: "",
        xl: "",
      },
      hover: {
        true: "hover:-translate-y-1 active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "light",
      blur: "md",
      shadow: "md",
      hover: false,
    },
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  asChild?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, blur, shadow, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, blur, shadow, hover }),
          "border rounded-2xl p-6",
          "md:rounded-3xl md:p-8",
          // Optimización móvil: blur reducido
          "backdrop-saturate-[180%]",
          // Fallback para navegadores sin soporte
          "supports-[backdrop-filter]:bg-opacity-10",
          "supports-[not(backdrop-filter)]:bg-opacity-95",
          className
        )}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard, glassCardVariants }
