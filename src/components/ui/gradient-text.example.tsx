import { GradientText } from "./gradient-text"

/**
 * GradientText Component Examples
 * 
 * This file demonstrates various use cases of the GradientText component.
 * DO NOT import this file in production code.
 */

export function GradientTextExamples() {
  return (
    <div className="space-y-8 p-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">GradientText Examples</h2>
        <p className="text-muted-foreground">
          Various examples of the GradientText component with different configurations
        </p>
      </div>

      {/* Example 1: Default Primary Gradient */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Default Primary Gradient</h3>
        <GradientText className="text-4xl">
          Beautiful Gradient Text
        </GradientText>
      </div>

      {/* Example 2: Custom Tailwind Gradient */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Custom Tailwind Gradient</h3>
        <GradientText 
          gradientColors="from-red-500 via-orange-500 to-yellow-500"
          className="text-4xl"
        >
          Sunset Colors
        </GradientText>
      </div>

      {/* Example 3: Responsive Font Size */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Responsive Font Size (clamp)</h3>
        <GradientText 
          responsiveSize="clamp(2rem, 5vw, 4rem)"
          gradientColors="from-blue-500 to-purple-600"
        >
          Scales with Viewport
        </GradientText>
        <p className="text-sm text-muted-foreground">
          Resize your browser to see the text scale smoothly
        </p>
      </div>

      {/* Example 4: With Text Shadow */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">With Text Shadow</h3>
        <GradientText 
          withShadow
          className="text-5xl"
        >
          Depth Effect
        </GradientText>
      </div>

      {/* Example 5: Spot Number Display (Use Case) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Parking Spot Number (Use Case)</h3>
        <div className="bg-card p-6 rounded-lg border">
          <GradientText 
            responsiveSize="clamp(32px, 6vw, 48px)"
            withShadow
            className="block mb-2"
          >
            AV-21
          </GradientText>
          <p className="text-sm text-muted-foreground">
            Planta -1, Zona Norte
          </p>
        </div>
      </div>

      {/* Example 6: Date Header (Use Case) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Date Header (Use Case)</h3>
        <div className="bg-card p-6 rounded-lg border">
          <GradientText 
            responsiveSize="clamp(20px, 3vw, 28px)"
            fontWeight="600"
            letterSpacing="-0.02em"
          >
            Viernes, 15 de Noviembre
          </GradientText>
        </div>
      </div>

      {/* Example 7: Custom Gradient Direction */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Custom Gradient Direction</h3>
        <GradientText 
          gradient="90deg"
          gradientColors="from-green-400 to-blue-500"
          className="text-4xl"
        >
          Horizontal Gradient
        </GradientText>
      </div>

      {/* Example 8: Multiple Lines */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Multiple Lines</h3>
        <GradientText 
          responsiveSize="clamp(1.5rem, 3vw, 2.5rem)"
          gradientColors="from-pink-500 to-violet-500"
          className="block leading-tight"
          style={{ lineHeight: "1.2" }}
        >
          Multi-line
          <br />
          Gradient Text
        </GradientText>
      </div>

      {/* Example 9: Light Mode vs Dark Mode */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Adapts to Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background p-6 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-2">Current Theme</p>
            <GradientText className="text-3xl">
              Theme Aware
            </GradientText>
          </div>
          <div className="bg-muted p-6 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-2">On Muted Background</p>
            <GradientText className="text-3xl">
              Still Visible
            </GradientText>
          </div>
        </div>
      </div>

      {/* Example 10: Fallback Demo */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Browser Fallback</h3>
        <p className="text-sm text-muted-foreground">
          In browsers without background-clip support, text falls back to primary color
        </p>
        <GradientText className="text-4xl">
          Graceful Degradation
        </GradientText>
      </div>
    </div>
  )
}

/**
 * Usage Examples in Code
 */

// Example 1: Simple usage
export function SimpleExample() {
  return (
    <GradientText>
      Beautiful Text
    </GradientText>
  )
}

// Example 2: Parking spot number
export function SpotNumberExample() {
  return (
    <GradientText 
      responsiveSize="clamp(32px, 6vw, 48px)"
      withShadow
    >
      AV-21
    </GradientText>
  )
}

// Example 3: Date header
export function DateHeaderExample() {
  return (
    <GradientText 
      responsiveSize="clamp(20px, 3vw, 28px)"
      fontWeight="600"
    >
      Viernes, 15 de Noviembre
    </GradientText>
  )
}

// Example 4: Custom colors
export function CustomColorsExample() {
  return (
    <GradientText 
      gradientColors="from-red-500 to-yellow-500"
      className="text-5xl"
    >
      Custom Gradient
    </GradientText>
  )
}
