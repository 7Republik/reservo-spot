import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const animatedIconVariants = cva(
  [
    "inline-flex items-center justify-center",
    "transition-all duration-200 ease-in-out",
    // Respetar preferencias de movimiento reducido
    "motion-reduce:transition-none",
    "motion-reduce:animate-none",
  ],
  {
    variants: {
      animation: {
        none: "",
        pulse: [
          "animate-pulse-subtle",
          // Simplificar en móvil
          "md:animate-pulse-ring",
        ],
        bounce: [
          "hover:animate-bounce-subtle",
          // Solo en desktop con hover
          "@media(hover:none){animation:none}",
        ],
        draw: [
          // Animación de dibujo para checkmarks
          "[&_path]:animate-draw-check",
          // Solo en hover en desktop
          "@media(hover:none){[&_path]:animation:none}",
        ],
        float: [
          "animate-float",
          // Simplificar en móvil
          "md:animate-float-full",
        ],
        spin: "animate-spin",
        ping: "animate-ping",
      },
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
    },
    defaultVariants: {
      animation: "none",
      size: "md",
    },
  }
)

export interface AnimatedIconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof animatedIconVariants> {
  icon: React.ReactNode
  duration?: number
  delay?: number
  lazy?: boolean
}

const AnimatedIcon = React.forwardRef<HTMLSpanElement, AnimatedIconProps>(
  (
    {
      className,
      animation,
      size,
      icon,
      duration = 2000,
      delay = 0,
      lazy = false,
      style,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(!lazy)
    const iconRef = React.useRef<HTMLSpanElement>(null)

    // Lazy loading con IntersectionObserver
    React.useEffect(() => {
      if (!lazy || isVisible) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true)
              observer.disconnect()
            }
          })
        },
        {
          threshold: 0.1, // Activar cuando 10% es visible
          rootMargin: "50px", // Early loading
        }
      )

      if (iconRef.current) {
        observer.observe(iconRef.current)
      }

      return () => observer.disconnect()
    }, [lazy, isVisible])

    // Detectar preferencia de movimiento reducido
    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === "undefined") return false
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }, [])

    // No aplicar animación si el usuario prefiere movimiento reducido
    const effectiveAnimation = prefersReducedMotion ? "none" : animation

    return (
      <span
        ref={iconRef}
        className={cn(
          animatedIconVariants({ animation: effectiveAnimation, size }),
          // Solo aplicar animación si es visible (lazy loading)
          !isVisible && "opacity-0",
          className
        )}
        style={{
          ...style,
          ...(duration && {
            animationDuration: `${duration}ms`,
          }),
          ...(delay && {
            animationDelay: `${delay}ms`,
          }),
        }}
        aria-hidden="true"
        {...props}
      >
        {icon}
      </span>
    )
  }
)
AnimatedIcon.displayName = "AnimatedIcon"

export { AnimatedIcon, animatedIconVariants }
