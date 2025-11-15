import * as React from "react"
import { cn } from "@/lib/utils"

export interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Gradient direction
   * @default "135deg"
   */
  gradient?: string
  /**
   * Whether to use the default primary gradient
   * @default true
   */
  usePrimaryGradient?: boolean
  /**
   * Custom gradient colors (overrides usePrimaryGradient)
   * Example: "from-blue-500 to-purple-600"
   */
  gradientColors?: string
  /**
   * Responsive font size using clamp()
   * Example: "clamp(1rem, 2vw, 1.5rem)"
   */
  responsiveSize?: string
  /**
   * Font weight
   * @default "700"
   */
  fontWeight?: string
  /**
   * Letter spacing
   * @default "-0.02em"
   */
  letterSpacing?: string
  /**
   * Whether to add text shadow for depth
   * @default false
   */
  withShadow?: boolean
  /**
   * Children to render
   */
  children: React.ReactNode
}

/**
 * GradientText component
 * 
 * Displays text with a gradient effect using background-clip.
 * Includes fallback for browsers without support.
 * 
 * @example
 * ```tsx
 * <GradientText>Beautiful Gradient Text</GradientText>
 * 
 * <GradientText 
 *   gradientColors="from-red-500 to-yellow-500"
 *   responsiveSize="clamp(2rem, 5vw, 4rem)"
 * >
 *   Custom Gradient
 * </GradientText>
 * ```
 */
export const GradientText = React.forwardRef<HTMLSpanElement, GradientTextProps>(
  (
    {
      className,
      gradient = "135deg",
      usePrimaryGradient = true,
      gradientColors,
      responsiveSize,
      fontWeight = "700",
      letterSpacing = "-0.02em",
      withShadow = false,
      children,
      style,
      ...props
    },
    ref
  ) => {
    // Determine gradient style
    const gradientStyle = React.useMemo(() => {
      if (gradientColors) {
        // Custom Tailwind gradient classes
        return undefined // Will use className instead
      }
      
      if (usePrimaryGradient) {
        // Default primary gradient
        return {
          background: `linear-gradient(${gradient}, var(--primary) 0%, var(--secondary, #764ba2) 100%)`,
        }
      }
      
      return undefined
    }, [gradient, usePrimaryGradient, gradientColors])

    // Responsive font size
    const fontSizeStyle = responsiveSize
      ? { fontSize: responsiveSize }
      : undefined

    // Text shadow for depth (adapts to dark mode)
    const shadowStyle = withShadow
      ? { textShadow: "0 2px 8px rgba(102, 126, 234, 0.3), 0 4px 16px rgba(102, 126, 234, 0.2)" }
      : undefined

    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          "inline-block relative z-10",
          "bg-clip-text text-transparent",
          // Fallback for browsers without background-clip support
          "supports-[background-clip:text]:bg-clip-text",
          "supports-[background-clip:text]:text-transparent",
          // Fallback color (visible only if background-clip not supported)
          "[&:not(supports-[background-clip:text])]:text-primary",
          // Custom gradient colors via Tailwind
          gradientColors && `bg-gradient-to-r ${gradientColors}`,
          className
        )}
        style={{
          ...gradientStyle,
          ...fontSizeStyle,
          fontWeight,
          letterSpacing,
          ...shadowStyle,
          lineHeight: "1",
          // Mejorar renderizado del texto
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          // Forzar renderizado en GPU para mejor calidad
          transform: "translateZ(0)",
          willChange: "auto",
          ...style,
        }}
        {...props}
      >
        {children}
      </span>
    )
  }
)

GradientText.displayName = "GradientText"
