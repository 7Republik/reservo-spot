# Design Document

## Overview

Este documento describe el diseño visual y técnico para transformar la sección "Hoy" del dashboard de RESERVEO en una experiencia premium y moderna. El rediseño se basa en principios de diseño contemporáneos como glassmorphism, microinteracciones fluidas, y un sistema de colores sofisticado.

El enfoque es crear una interfaz que se sienta "cara" y bien pulida, similar a aplicaciones premium como Linear, Stripe, o Apple's design language, pero manteniendo la funcionalidad y usabilidad existentes.

## Architecture

### Component Structure

```
TodaySection (Container)
├── DateHeader (Enhanced Typography)
│   ├── CalendarIcon (Animated)
│   └── DateDisplay (Variable Font)
├── TodayCheckinCard (Glassmorphism Card)
│   ├── StatusBadge (Gradient Border)
│   ├── CheckinPrompt (Enhanced Typography)
│   └── CheckinButton (Gradient + Animations)
└── TodayReservationCard (Premium Card)
    ├── SpotNumberDisplay (Hero Typography)
    ├── LocationInfo (Animated Icon)
    ├── ActionButtons (Gradient Buttons)
    │   ├── ReportIncidentButton
    │   └── ViewLocationButton
    └── Dividers (Gradient Lines)
```

### Visual Hierarchy

**Level 1 - Hero Elements:**
- Spot number (AV-21): 48-56px, font-weight: 700
- Primary CTA buttons: Large, gradient backgrounds

**Level 2 - Important Info:**
- Date display: 24-28px, font-weight: 600
- Check-in status: 18-20px, font-weight: 500

**Level 3 - Supporting Info:**
- Location details: 14-16px, font-weight: 400
- Secondary text: 12-14px, font-weight: 400

## Components and Interfaces

### 1. Enhanced Date Header (Mobile-Optimized)

**Visual Design:**
```tsx
// Gradient text effect
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
-webkit-background-clip: text
-webkit-text-fill-color: transparent

// Animated calendar icon (subtle on mobile)
animation: float 3s ease-in-out infinite
```

**Typography (Mobile-First):**
```css
/* Mobile: compacto */
.date-header {
  font-family: Inter Variable, SF Pro Display, system-ui;
}

.date-display {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.day-name {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.7;
}

/* Desktop: más espacioso */
@media (min-width: 768px) {
  .date-display {
    font-size: 28px;
  }
  
  .day-name {
    font-size: 16px;
  }
}
```

**Spacing (Mobile-First):**
```css
/* Mobile */
.date-header {
  margin-bottom: 20px;
  padding: 12px 16px;
}

.calendar-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

/* Desktop */
@media (min-width: 768px) {
  .date-header {
    margin-bottom: 32px;
    padding: 16px 24px;
  }
  
  .calendar-icon {
    width: 32px;
    height: 32px;
    margin-right: 12px;
  }
}
```

### 2. Glassmorphism Card System (Mobile-Optimized)

**Base Card Styles (Mobile-First):**
```css
/* Mobile: más compacto, menos blur para performance */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.glass-card-dark {
  background: rgba(17, 25, 40, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.125);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Desktop: más espacioso y efectos más intensos */
@media (min-width: 768px) {
  .glass-card {
    backdrop-filter: blur(20px) saturate(180%);
    border-radius: 24px;
    padding: 24px;
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .glass-card-dark {
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}
```

**Hover State (Desktop only):**
```css
/* No hover effects on mobile (touch devices) */
@media (hover: hover) and (pointer: fine) {
  .glass-card:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 12px 48px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Active state for mobile (touch feedback) */
.glass-card:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}
```

### 3. Premium Button System (Mobile-Optimized)

**Primary Gradient Button (Check-in) - Mobile-First:**
```css
/* Mobile: más compacto, touch-friendly (min 44px height) */
.btn-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  min-height: 48px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  box-shadow: 
    0 2px 12px rgba(102, 126, 234, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Desktop: más espacioso */
@media (min-width: 768px) {
  .btn-gradient-primary {
    border-radius: 16px;
    padding: 16px 32px;
    font-size: 16px;
    width: auto;
    box-shadow: 
      0 4px 16px rgba(102, 126, 234, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
}

/* Shine effect (desktop only) */
@media (hover: hover) and (pointer: fine) {
  .btn-gradient-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.3), 
      transparent
    );
    transition: left 0.5s;
  }

  .btn-gradient-primary:hover::before {
    left: 100%;
  }

  .btn-gradient-primary:hover {
    transform: scale(1.02);
    box-shadow: 
      0 6px 24px rgba(102, 126, 234, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}

/* Touch feedback for mobile */
.btn-gradient-primary:active {
  transform: scale(0.96);
  transition: transform 0.1s;
}
```

**Secondary Outline Button (Report/Location) - Mobile-First:**
```css
/* Mobile: más compacto, stack vertical si es necesario */
.btn-outline-secondary {
  background: transparent;
  border: 2px solid;
  border-image: linear-gradient(135deg, #667eea, #764ba2) 1;
  border-radius: 12px;
  padding: 12px 20px;
  min-height: 44px;
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
}

/* Desktop: más espacioso */
@media (min-width: 768px) {
  .btn-outline-secondary {
    border-radius: 16px;
    padding: 14px 28px;
    font-size: 15px;
    gap: 8px;
  }
}

/* Hover effect (desktop only) */
@media (hover: hover) and (pointer: fine) {
  .btn-outline-secondary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #667eea, #764ba2);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .btn-outline-secondary:hover::before {
    opacity: 0.1;
  }

  .btn-outline-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }
}

/* Touch feedback for mobile */
.btn-outline-secondary:active {
  transform: scale(0.96);
  transition: transform 0.1s;
}

/* Button group layout (mobile: stack, desktop: row) */
.button-group {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

@media (min-width: 640px) {
  .button-group {
    flex-direction: row;
  }
}
```

### 4. Animated Icons

**Pulse Animation (Location Icon):**
```css
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.icon-location {
  position: relative;
}

.icon-location::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid currentColor;
  border-radius: 50%;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Bounce Animation (Alert Icon):**
```css
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.icon-alert:hover {
  animation: bounce-subtle 0.6s ease-in-out;
}
```

**Checkmark Draw Animation:**
```css
@keyframes draw-check {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.icon-check {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
}

.btn-checkin:hover .icon-check {
  animation: draw-check 0.4s ease-out forwards;
}
```

### 5. Spot Number Display (Mobile-First)

**Hero Typography (Responsive):**
```css
.spot-number {
  /* Mobile: más compacto */
  font-size: clamp(32px, 6vw, 48px);
  font-weight: 700;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  line-height: 1;
  margin: 0;
}

/* Desktop: más grande */
@media (min-width: 768px) {
  .spot-number {
    font-size: clamp(48px, 8vw, 64px);
    text-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
}
```

**Location Subtitle:**
```css
.spot-location {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

@media (min-width: 768px) {
  .spot-location {
    font-size: 16px;
    gap: 8px;
    margin-top: 8px;
  }
}
```

### 6. Gradient Dividers

```css
.divider-gradient {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(102, 126, 234, 0.3) 50%,
    transparent 100%
  );
  margin: 24px 0;
}
```

### 7. Background Gradients

**Light Mode:**
```css
.dashboard-bg-light {
  background: linear-gradient(
    135deg,
    #f5f7fa 0%,
    #c3cfe2 100%
  );
  min-height: 100vh;
}
```

**Dark Mode:**
```css
.dashboard-bg-dark {
  background: linear-gradient(
    135deg,
    #0f0c29 0%,
    #302b63 50%,
    #24243e 100%
  );
  min-height: 100vh;
}
```

## Data Models

### Color System

```typescript
interface ColorPalette {
  primary: {
    base: string;      // #667eea
    light: string;     // #8b9ef5
    dark: string;      // #5568d3
    gradient: string;  // linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  };
  secondary: {
    base: string;      // #764ba2
    light: string;     // #9b6bc4
    dark: string;      // #5d3a7f
  };
  accent: {
    success: string;   // #10b981
    warning: string;   // #f59e0b
    error: string;     // #ef4444
    info: string;      // #3b82f6
  };
  neutral: {
    50: string;        // Lightest
    100: string;
    // ... hasta 900
    900: string;       // Darkest
  };
}
```

### Animation Timing

```typescript
interface AnimationConfig {
  duration: {
    fast: number;      // 150ms
    normal: number;    // 300ms
    slow: number;      // 500ms
  };
  easing: {
    easeOut: string;   // cubic-bezier(0.4, 0, 0.2, 1)
    easeIn: string;    // cubic-bezier(0.4, 0, 1, 1)
    easeInOut: string; // cubic-bezier(0.4, 0, 0.2, 1)
    spring: string;    // cubic-bezier(0.34, 1.56, 0.64, 1)
  };
  stagger: number;     // 100ms delay between elements
}
```

### Component Props

```typescript
interface GlassCardProps {
  variant: 'light' | 'dark';
  blur: number;           // 10-30px
  opacity: number;        // 0.1-0.3
  borderOpacity: number;  // 0.1-0.3
  shadow: 'sm' | 'md' | 'lg' | 'xl';
  hover: boolean;
  children: React.ReactNode;
}

interface GradientButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition: 'left' | 'right';
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
```

## Error Handling

### Animation Performance

```typescript
// Detect reduced motion preference
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Disable animations if user prefers
if (prefersReducedMotion) {
  document.documentElement.classList.add('reduce-motion');
}
```

```css
.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
```

### Fallback Styles

```css
/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(20px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
  }
  
  .glass-card-dark {
    background: rgba(17, 25, 40, 0.95);
  }
}

/* Fallback for gradient text */
@supports not (-webkit-background-clip: text) {
  .spot-number {
    color: var(--primary);
    -webkit-text-fill-color: unset;
  }
}
```

## Testing Strategy

### Visual Regression Testing

1. **Snapshot Tests:**
   - Capturar screenshots de cada componente en diferentes estados
   - Comparar con baseline para detectar cambios visuales no intencionados

2. **Cross-browser Testing:**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

3. **Responsive Testing:**
   - Mobile: 375px, 414px
   - Tablet: 768px, 1024px
   - Desktop: 1280px, 1920px

### Animation Performance Testing

```typescript
// Measure animation frame rate
const measureFPS = () => {
  let lastTime = performance.now();
  let frames = 0;
  
  const loop = () => {
    const currentTime = performance.now();
    frames++;
    
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));
      console.log(`FPS: ${fps}`);
      frames = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(loop);
  };
  
  requestAnimationFrame(loop);
};
```

**Performance Targets:**
- Maintain 60 FPS during animations
- First paint < 1.5s
- Time to interactive < 3s

### Accessibility Testing

1. **Color Contrast:**
   - All text must meet WCAG AA (4.5:1 for normal text)
   - Interactive elements must meet WCAG AA (3:1)

2. **Keyboard Navigation:**
   - All interactive elements must be keyboard accessible
   - Focus states must be clearly visible

3. **Screen Reader Testing:**
   - Test with VoiceOver (macOS)
   - Test with NVDA (Windows)
   - Ensure all animations have appropriate aria-live regions

### User Testing

1. **A/B Testing:**
   - Compare new design vs old design
   - Measure: engagement time, click-through rate, user satisfaction

2. **Usability Testing:**
   - 5-10 users test the new interface
   - Observe: confusion points, delight moments, task completion time

3. **Performance Perception:**
   - Survey users on perceived speed and quality
   - Measure: "feels fast", "looks professional", "easy to use"

## Implementation Notes

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.15);
  --shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.2);
  
  /* Animations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Component Library Integration

**Use existing shadcn/ui components as base:**
- Button → Enhance with gradients
- Card → Add glassmorphism
- Badge → Add gradient borders

**Add new utility components:**
- `GlassCard` - Reusable glassmorphism container
- `GradientButton` - Enhanced button with animations
- `AnimatedIcon` - Icon wrapper with animations
- `GradientText` - Text with gradient effect

### Performance Optimization

1. **Use CSS transforms for animations** (GPU accelerated)
2. **Lazy load heavy animations** (IntersectionObserver)
3. **Debounce hover effects** on mobile
4. **Use will-change sparingly** (only during animation)
5. **Optimize gradient complexity** (max 3-4 color stops)

## Design Rationale

### Why Glassmorphism?

- **Modern aesthetic:** Popular in 2024-2025 design trends
- **Depth perception:** Creates visual hierarchy without heavy shadows
- **Versatility:** Works in both light and dark modes
- **Premium feel:** Associated with high-end applications

### Why Gradient Buttons?

- **Visual interest:** More engaging than flat colors
- **Call-to-action emphasis:** Draws attention to important actions
- **Brand differentiation:** Unique visual identity
- **Perceived value:** Associated with premium products

### Why Microinteractions?

- **User feedback:** Confirms actions are registered
- **Delight factor:** Makes the app feel alive and responsive
- **Perceived performance:** Makes the app feel faster
- **Professional polish:** Shows attention to detail

### Color Palette Choice

**Primary Gradient (Purple-Blue):**
- Purple (#764ba2): Creativity, innovation, premium
- Blue (#667eea): Trust, professionalism, technology
- Combination: Modern, tech-forward, reliable

**Why this works for RESERVEO:**
- Differentiates from typical corporate blues
- Feels modern and innovative
- Works well in both light and dark modes
- High contrast for accessibility

## Mobile-First Optimization Strategy

### Space Efficiency

**Compact Layout Principles:**
```css
/* Mobile: máxima densidad de información */
.today-section-mobile {
  padding: 12px;
  gap: 12px;
}

/* Reduce spacing between elements */
.card-content-mobile {
  padding: 16px;
  gap: 12px;
}

/* Compact typography scale */
.mobile-text-scale {
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-lg: 16px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
}
```

**Vertical Space Management:**
```css
/* Reduce vertical margins on mobile */
.section-spacing-mobile {
  margin-bottom: 12px;
}

.card-spacing-mobile {
  margin-bottom: 12px;
}

/* Desktop: más espacioso */
@media (min-width: 768px) {
  .section-spacing-mobile {
    margin-bottom: 24px;
  }
  
  .card-spacing-mobile {
    margin-bottom: 20px;
  }
}
```

### Touch-Friendly Interactions

**Minimum Touch Targets:**
```css
/* WCAG 2.1 Level AAA: 44x44px minimum */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Increase tap area without visual size */
.touch-target-extended::before {
  content: '';
  position: absolute;
  inset: -8px;
}
```

**Spacing Between Touch Targets:**
```css
/* Minimum 8px between interactive elements */
.touch-group {
  gap: 8px;
}

/* Prevent accidental taps */
.button-group-mobile {
  gap: 12px;
}
```

### Performance Optimization for Mobile

**Reduce Animation Complexity:**
```css
/* Mobile: simpler animations */
@media (max-width: 767px) {
  .glass-card {
    /* Reduce blur for better performance */
    backdrop-filter: blur(10px) saturate(150%);
  }
  
  /* Disable complex animations on low-end devices */
  @media (prefers-reduced-motion: no-preference) {
    .btn-gradient-primary::before {
      display: none; /* No shine effect on mobile */
    }
  }
}
```

**Lazy Load Heavy Effects:**
```typescript
// Only apply glassmorphism when in viewport
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('glass-effect-active');
    }
  });
});

document.querySelectorAll('.glass-card').forEach(card => {
  observer.observe(card);
});
```

### Content Prioritization

**Mobile Layout Hierarchy:**
```
1. Date Header (compact, 20px font)
2. Check-in Card (if applicable, full width)
3. Reservation Card (compact, essential info only)
   - Spot Number (32px, prominent)
   - Location (14px, with icon)
   - Action Buttons (stacked or 2-column)
```

**Hide Non-Essential Elements on Mobile:**
```css
/* Hide decorative elements on small screens */
@media (max-width: 640px) {
  .decorative-gradient-bg {
    display: none;
  }
  
  .floating-particles {
    display: none;
  }
  
  /* Simplify dividers */
  .divider-gradient {
    background: var(--border);
    height: 1px;
  }
}
```

### Responsive Typography

**Fluid Type Scale:**
```css
/* Mobile-first fluid typography */
:root {
  --font-size-base: clamp(14px, 2vw, 16px);
  --font-size-lg: clamp(16px, 2.5vw, 18px);
  --font-size-xl: clamp(20px, 3vw, 24px);
  --font-size-2xl: clamp(24px, 4vw, 32px);
  --font-size-3xl: clamp(32px, 5vw, 48px);
}
```

### Viewport Height Management

**Avoid Fixed Heights:**
```css
/* Use min-height instead of height */
.today-section {
  min-height: auto;
  max-height: none;
}

/* Account for mobile browser chrome */
.mobile-viewport {
  height: 100dvh; /* Dynamic viewport height */
  min-height: -webkit-fill-available;
}
```

### Network-Aware Loading

**Reduce Assets on Slow Connections:**
```typescript
// Detect connection speed
const connection = (navigator as any).connection;
const isSlowConnection = connection?.effectiveType === '2g' || 
                         connection?.effectiveType === 'slow-2g';

if (isSlowConnection) {
  // Disable heavy animations
  document.documentElement.classList.add('reduce-effects');
  
  // Use simpler gradients
  document.documentElement.classList.add('simple-gradients');
}
```

```css
.reduce-effects .glass-card {
  backdrop-filter: none;
  background: rgba(255, 255, 255, 0.95);
}

.simple-gradients .btn-gradient-primary {
  background: var(--primary);
}
```

### Mobile-Specific Measurements

**Actual Screen Dimensions:**
```
iPhone SE (2022): 375x667px
iPhone 14 Pro: 393x852px
iPhone 14 Pro Max: 430x932px
Samsung Galaxy S23: 360x780px
Pixel 7: 412x915px
```

**Safe Area Insets:**
```css
/* Account for notches and home indicators */
.today-section {
  padding-top: max(12px, env(safe-area-inset-top));
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  padding-left: max(12px, env(safe-area-inset-left));
  padding-right: max(12px, env(safe-area-inset-right));
}
```

### Testing Checklist for Mobile

- [ ] All touch targets are minimum 44x44px
- [ ] Text is readable at 14px minimum
- [ ] Cards don't exceed viewport width
- [ ] Buttons are full-width or properly sized
- [ ] Animations run at 60fps on mid-range devices
- [ ] Content fits without horizontal scroll
- [ ] Safe area insets are respected
- [ ] Works in both portrait and landscape
- [ ] Tested on iOS Safari and Chrome Android
- [ ] Works with system font scaling (up to 200%)
