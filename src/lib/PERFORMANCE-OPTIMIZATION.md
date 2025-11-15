# Sistema de Optimización de Performance

Sistema completo de optimización de performance para móvil implementado en la tarea 8 del rediseño visual del dashboard.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Componentes del Sistema](#componentes-del-sistema)
- [Uso Rápido](#uso-rápido)
- [API Detallada](#api-detallada)
- [Ejemplos](#ejemplos)
- [Performance Targets](#performance-targets)

## ✨ Características

### 8.1 Lazy Loading de Efectos
- ✅ IntersectionObserver para activar glassmorphism solo cuando visible
- ✅ Lazy load de animaciones complejas (shine effect, pulse)
- ✅ Threshold de 0.1 para early loading
- ✅ RootMargin de 50px para cargar antes de que sea visible

### 8.2 Detección de Conexión Lenta
- ✅ Detección de `navigator.connection.effectiveType`
- ✅ Deshabilitar backdrop-filter en conexiones 2g/slow-2g
- ✅ Simplificar gradientes a colores sólidos
- ✅ Clase `.reduce-effects` aplicada automáticamente
- ✅ Respeto a preferencia "Save Data"

### 8.3 Optimización de Animaciones para 60fps
- ✅ Solo transform y opacity en animaciones
- ✅ will-change solo durante animación activa
- ✅ requestAnimationFrame para animaciones custom
- ✅ Medidor de FPS integrado
- ✅ Optimización automática si FPS < 55

## 🔧 Componentes del Sistema

### Librerías Core

#### `lazyEffects.ts`
Funciones para lazy loading de efectos visuales.

```typescript
import { observeLazyEffects } from '@/lib/lazyEffects';

// Observar elementos con clase .glass-card
observeLazyEffects('.glass-card', {
  threshold: 0.1,
  rootMargin: '50px',
  effectClass: 'effect-active'
});
```

#### `connectionMonitor.ts`
Monitor de calidad de conexión.

```typescript
import { initConnectionMonitor, isSlowConnection } from '@/lib/connectionMonitor';

// Inicializar (ya se hace automáticamente en main.tsx)
initConnectionMonitor();

// Verificar si la conexión es lenta
if (isSlowConnection()) {
  console.log('Conexión lenta detectada');
}
```

#### `animationOptimizer.ts`
Optimizador de animaciones y medidor de FPS.

```typescript
import { startFPSMonitoring, getAverageFPS } from '@/lib/animationOptimizer';

// Iniciar monitoreo
startFPSMonitoring();

// Obtener FPS promedio
const fps = getAverageFPS();
console.log(`FPS: ${fps}`);
```

### Hooks React

#### `useLazyEffects`
Hook para lazy loading de efectos en componentes.

```typescript
import { useLazyEffects } from '@/hooks/useLazyEffects';

const MyCard = () => {
  const cardRef = useLazyEffects({
    threshold: 0.1,
    effectClass: 'effect-active',
    once: false
  });

  return <div ref={cardRef} className="glass-card-lazy">...</div>;
};
```

#### `useConnectionMonitor`
Hook para monitorear la conexión.

```typescript
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';

const MyComponent = () => {
  const { isSlowConnection, connectionInfo } = useConnectionMonitor();

  return (
    <div>
      {isSlowConnection && <p>Conexión lenta</p>}
      <small>Tipo: {connectionInfo.effectiveType}</small>
    </div>
  );
};
```

#### `useFPSMonitor`
Hook para monitorear FPS.

```typescript
import { useFPSMonitor } from '@/hooks/useAnimationOptimizer';

const MyComponent = () => {
  const { currentFPS, averageFPS, isPerformanceGood } = useFPSMonitor(true);

  return (
    <div>
      <p>FPS: {currentFPS}</p>
      <p>Promedio: {averageFPS}</p>
      {!isPerformanceGood && <p>⚠ Performance bajo</p>}
    </div>
  );
};
```

#### `useOptimizedAnimation`
Hook para animaciones optimizadas con RAF.

```typescript
import { useOptimizedAnimation } from '@/hooks/useAnimationOptimizer';

const MyComponent = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { animate } = useOptimizedAnimation();

  const handleClick = () => {
    animate(
      elementRef.current!,
      'opacity',
      0,
      1,
      300,
      'easeOut'
    );
  };

  return <div ref={elementRef} onClick={handleClick}>Animar</div>;
};
```

### Componentes UI

#### `FPSCounter`
Componente para mostrar FPS (solo en desarrollo).

```typescript
import { FPSCounter } from '@/components/FPSCounter';

// En App.tsx o layout principal
<FPSCounter />
```

## 🚀 Uso Rápido

### 1. Lazy Loading de Glassmorphism

```tsx
import { useLazyEffects } from '@/hooks/useLazyEffects';

const MyCard = () => {
  const cardRef = useLazyEffects();

  return (
    <div ref={cardRef} className="glass-card-lazy">
      {/* El backdrop-filter se activa solo cuando es visible */}
      <h3>Mi Card</h3>
    </div>
  );
};
```

### 2. Adaptar UI según Conexión

```tsx
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';

const MyComponent = () => {
  const { effectsConfig } = useConnectionMonitor();

  return (
    <div className={effectsConfig.enableBackdropFilter ? 'glass-card' : 'simple-card'}>
      {/* UI adaptada automáticamente */}
    </div>
  );
};
```

### 3. Monitorear Performance

```tsx
import { useFPSMonitor } from '@/hooks/useAnimationOptimizer';

const MyDashboard = () => {
  const { isPerformanceGood } = useFPSMonitor(true);

  return (
    <div>
      {!isPerformanceGood && (
        <div className="alert">⚠ Performance bajo. Efectos reducidos.</div>
      )}
    </div>
  );
};
```

## 📚 API Detallada

### Clases CSS

#### `.glass-card-lazy`
Card sin backdrop-filter inicial. Se activa con `.effect-active`.

```css
.glass-card-lazy {
  background: rgba(255, 255, 255, 0.1);
  /* Sin backdrop-filter inicialmente */
}

.glass-card-lazy.effect-active {
  backdrop-filter: blur(12px) saturate(180%);
}
```

#### `.reduce-effects`
Aplicada automáticamente al `<html>` cuando:
- Conexión es 2g o slow-2g
- Usuario tiene "Save Data" activado
- FPS promedio < 55
- prefers-reduced-motion está activado

```css
.reduce-effects .glass-card {
  backdrop-filter: none;
  background: rgba(255, 255, 255, 0.95);
}

.reduce-effects * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

#### `.enable-complex-animations`
Habilita animaciones complejas (shine, pulse) solo en desktop con buena conexión.

```css
.enable-complex-animations .btn-gradient-primary::before {
  display: block; /* Shine effect */
}

.enable-complex-animations .icon-pulse::after {
  display: block; /* Pulse ring */
}
```

### Funciones Principales

#### `initConnectionMonitor()`
Inicializa el monitor de conexión. Ya se llama automáticamente en `main.tsx`.

```typescript
import { initConnectionMonitor } from '@/lib/connectionMonitor';
initConnectionMonitor();
```

#### `isSlowConnection()`
Verifica si la conexión es lenta.

```typescript
import { isSlowConnection } from '@/lib/connectionMonitor';

if (isSlowConnection()) {
  // Simplificar UI
}
```

#### `startFPSMonitoring()`
Inicia el monitoreo de FPS.

```typescript
import { startFPSMonitoring, getAverageFPS } from '@/lib/animationOptimizer';

startFPSMonitoring();
const fps = getAverageFPS();
```

#### `animateElement(config)`
Anima un elemento usando requestAnimationFrame.

```typescript
import { animateElement, easings } from '@/lib/animationOptimizer';

const cancel = animateElement({
  element: myElement,
  property: 'opacity',
  from: 0,
  to: 1,
  duration: 300,
  easing: easings.easeOut,
  onComplete: () => console.log('Done')
});

// Cancelar si es necesario
cancel();
```

## 📖 Ejemplos

Ver archivo completo de ejemplos: `src/lib/performanceOptimization.example.tsx`

### Ejemplo: Dashboard Optimizado

```tsx
import { useLazyEffects } from '@/hooks/useLazyEffects';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { useFPSMonitor } from '@/hooks/useAnimationOptimizer';

export const OptimizedDashboard = () => {
  const { isSlowConnection } = useConnectionMonitor();
  const { isPerformanceGood } = useFPSMonitor(true);
  const card1Ref = useLazyEffects();
  const card2Ref = useLazyEffects();

  return (
    <div className="today-section-container">
      {(isSlowConnection || !isPerformanceGood) && (
        <div className="alert">⚠ Efectos reducidos</div>
      )}

      <div ref={card1Ref} className="glass-card-lazy">
        <h3>Card 1</h3>
      </div>

      <div ref={card2Ref} className="glass-card-lazy">
        <h3>Card 2</h3>
      </div>
    </div>
  );
};
```

## 🎯 Performance Targets

### FPS
- **Target**: 60 FPS
- **Threshold**: 55 FPS (bajo este valor se reducen efectos)
- **Medición**: Promedio de últimos 60 frames (1 segundo)

### Lazy Loading
- **Threshold**: 0.1 (10% del elemento visible)
- **RootMargin**: 50px (cargar antes de que sea visible)
- **Strategy**: Activar cuando visible, desactivar cuando no

### Conexión
- **Slow**: 2g, slow-2g
- **Save Data**: Tratado como conexión lenta
- **Adaptación**: Automática al cambiar tipo de conexión

### Animaciones
- **Properties**: Solo transform y opacity
- **will-change**: Solo durante animación activa
- **RAF**: Todas las animaciones custom usan requestAnimationFrame
- **Easing**: Funciones optimizadas (easeOut, easeIn, easeInOut)

## 🔍 Debugging

### Mostrar FPS Counter

```tsx
import { FPSCounter } from '@/components/FPSCounter';

// Solo visible en desarrollo
<FPSCounter />
```

### Verificar Estado de Optimizaciones

```typescript
import { shouldReduceEffects } from '@/lib/connectionMonitor';
import { isPerformanceGood } from '@/lib/animationOptimizer';

console.log('Reduce effects:', shouldReduceEffects());
console.log('Performance good:', isPerformanceGood());
console.log('Has reduce-effects class:', 
  document.documentElement.classList.contains('reduce-effects')
);
```

### Forzar Reducción de Efectos

```typescript
// Para testing
document.documentElement.classList.add('reduce-effects');
```

## 📱 Soporte de Navegadores

### IntersectionObserver
- ✅ Chrome 51+
- ✅ Firefox 55+
- ✅ Safari 12.1+
- ✅ Edge 15+
- ✅ Fallback: Activar efectos inmediatamente

### Network Information API
- ✅ Chrome 61+
- ✅ Edge 79+
- ⚠️ Firefox: No soportado
- ⚠️ Safari: No soportado
- ✅ Fallback: Asumir buena conexión

### requestAnimationFrame
- ✅ Todos los navegadores modernos
- ✅ Polyfill no necesario

## 🚨 Notas Importantes

1. **Inicialización Automática**: El monitor de conexión se inicializa automáticamente en `main.tsx`. No es necesario llamarlo manualmente.

2. **Clase .reduce-effects**: Se aplica automáticamente al `<html>` cuando se detectan condiciones de bajo performance. No añadirla manualmente.

3. **will-change**: Solo se usa durante animaciones activas. Se remueve automáticamente después.

4. **FPS Counter**: Solo visible en modo desarrollo. No aparece en producción.

5. **Fallbacks**: Todos los sistemas tienen fallbacks para navegadores sin soporte de APIs modernas.

## 📄 Archivos Relacionados

- `src/lib/lazyEffects.ts` - Lazy loading de efectos
- `src/lib/connectionMonitor.ts` - Monitor de conexión
- `src/lib/animationOptimizer.ts` - Optimizador de animaciones
- `src/hooks/useLazyEffects.ts` - Hook para lazy effects
- `src/hooks/useConnectionMonitor.ts` - Hook para conexión
- `src/hooks/useAnimationOptimizer.ts` - Hooks para animaciones
- `src/components/FPSCounter.tsx` - Componente FPS counter
- `src/styles/visual-effects.css` - Estilos optimizados
- `src/lib/performanceOptimization.example.tsx` - Ejemplos de uso

## 🎓 Mejores Prácticas

1. **Usar lazy loading para glassmorphism**: Siempre usar `.glass-card-lazy` con `useLazyEffects()`
2. **Monitorear FPS en desarrollo**: Usar `<FPSCounter />` para detectar problemas
3. **Respetar reduce-effects**: No forzar efectos cuando la clase está presente
4. **Animaciones solo con transform/opacity**: Nunca animar width, height, left, top, etc.
5. **will-change temporal**: Nunca dejar will-change permanente
6. **RAF para animaciones custom**: Siempre usar `useOptimizedAnimation()` o `animateElement()`

---

**Implementado en**: Tarea 8 - Optimizar performance para móvil  
**Fecha**: 2025-11-14  
**Spec**: 02-rediseno-visual-dashboard-hoy
