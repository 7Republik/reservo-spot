/**
 * EJEMPLOS DE USO - Optimizaciones de Performance
 * 
 * Este archivo muestra cómo usar las herramientas de optimización
 * de performance implementadas en la tarea 8.
 */

import { useRef } from 'react';
import { useLazyEffects, useComplexAnimations } from '@/hooks/useLazyEffects';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { useFPSMonitor, useOptimizedAnimation, useComplexAnimationsEnabled } from '@/hooks/useAnimationOptimizer';

// ============================================
// EJEMPLO 1: Lazy Loading de Glassmorphism
// ============================================

export const LazyGlassCard = () => {
  // El efecto glassmorphism solo se activa cuando la card es visible
  const cardRef = useLazyEffects({
    threshold: 0.1,
    rootMargin: '50px',
    effectClass: 'effect-active',
    once: false // Remover efecto cuando no es visible (ahorra recursos)
  });

  return (
    <div ref={cardRef} className="glass-card-lazy">
      <h3>Card con Lazy Glassmorphism</h3>
      <p>El backdrop-filter solo se aplica cuando soy visible</p>
    </div>
  );
};

// ============================================
// EJEMPLO 2: Animaciones Complejas Solo en Desktop
// ============================================

export const ComplexAnimationCard = () => {
  // Habilita animaciones complejas solo en desktop con buena conexión
  const cardRef = useComplexAnimations();

  return (
    <div ref={cardRef} className="glass-card">
      <button className="btn-gradient-primary">
        {/* El shine effect solo se muestra si enable-complex-animations está activo */}
        Botón con Shine Effect
      </button>
    </div>
  );
};

// ============================================
// EJEMPLO 3: Adaptar UI según Conexión
// ============================================

export const AdaptiveCard = () => {
  const { isSlowConnection, connectionInfo, effectsConfig } = useConnectionMonitor();

  return (
    <div className={effectsConfig.enableBackdropFilter ? 'glass-card' : 'simple-card'}>
      <h3>Card Adaptativa</h3>
      {isSlowConnection ? (
        <p>Conexión lenta detectada. UI simplificada.</p>
      ) : (
        <p>Conexión buena. Efectos completos habilitados.</p>
      )}
      <small>Tipo: {connectionInfo.effectiveType}</small>
    </div>
  );
};

// ============================================
// EJEMPLO 4: Monitorear FPS
// ============================================

export const FPSMonitoredComponent = () => {
  const { currentFPS, averageFPS, isPerformanceGood } = useFPSMonitor(true);

  return (
    <div className="card">
      <h3>Monitor de Performance</h3>
      <div>FPS Actual: {currentFPS}</div>
      <div>FPS Promedio: {averageFPS}</div>
      <div>Estado: {isPerformanceGood ? '✓ Bueno' : '⚠ Bajo'}</div>
      {!isPerformanceGood && (
        <p className="text-warning">
          Performance bajo detectado. Efectos reducidos automáticamente.
        </p>
      )}
    </div>
  );
};

// ============================================
// EJEMPLO 5: Animación Optimizada con RAF
// ============================================

export const OptimizedAnimationExample = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { animate } = useOptimizedAnimation();

  const handleClick = () => {
    if (!elementRef.current) return;

    // Animar usando requestAnimationFrame (60fps garantizado)
    animate(
      elementRef.current,
      'opacity',
      0,
      1,
      300,
      'easeOut',
      () => console.log('Animación completada')
    );
  };

  return (
    <div>
      <button onClick={handleClick}>Animar</button>
      <div ref={elementRef} className="box">
        Elemento animado con RAF
      </div>
    </div>
  );
};

// ============================================
// EJEMPLO 6: Animaciones Condicionales
// ============================================

export const ConditionalAnimations = () => {
  const complexEnabled = useComplexAnimationsEnabled();

  return (
    <div className={complexEnabled ? 'with-animations' : 'without-animations'}>
      <h3>Animaciones Condicionales</h3>
      {complexEnabled ? (
        <div className="animate-slide-up">
          <p>Animaciones completas habilitadas</p>
        </div>
      ) : (
        <div>
          <p>Animaciones deshabilitadas (prefers-reduced-motion o conexión lenta)</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// EJEMPLO 7: Uso Completo en Dashboard
// ============================================

export const OptimizedDashboard = () => {
  // Monitorear conexión
  const { isSlowConnection } = useConnectionMonitor();
  
  // Monitorear FPS
  const { isPerformanceGood } = useFPSMonitor(true);
  
  // Verificar si se pueden usar animaciones complejas
  const complexEnabled = useComplexAnimationsEnabled();

  // Lazy loading para cards
  const card1Ref = useLazyEffects({ once: false });
  const card2Ref = useLazyEffects({ once: false });

  return (
    <div className="today-section-container">
      {/* Mostrar advertencia si hay problemas de performance */}
      {(isSlowConnection || !isPerformanceGood) && (
        <div className="alert alert-warning">
          ⚠ Efectos visuales reducidos para mejor performance
        </div>
      )}

      {/* Cards con lazy loading */}
      <div ref={card1Ref} className="glass-card-lazy">
        <h3>Reserva de Hoy</h3>
        <p>Glassmorphism cargado solo cuando es visible</p>
      </div>

      <div ref={card2Ref} className="glass-card-lazy">
        <h3>Check-in</h3>
        <button className={complexEnabled ? 'btn-gradient-primary' : 'btn-simple'}>
          {complexEnabled ? 'Check-in (con efectos)' : 'Check-in'}
        </button>
      </div>
    </div>
  );
};

// ============================================
// NOTAS DE IMPLEMENTACIÓN
// ============================================

/**
 * INICIALIZACIÓN AUTOMÁTICA:
 * 
 * El monitor de conexión se inicializa automáticamente en main.tsx:
 * 
 * ```typescript
 * import { initConnectionMonitor } from './lib/connectionMonitor';
 * initConnectionMonitor();
 * ```
 * 
 * Esto aplica automáticamente la clase .reduce-effects cuando:
 * - La conexión es 2g o slow-2g
 * - El usuario tiene "Save Data" activado
 * - El FPS promedio cae bajo 55fps
 * - El usuario tiene prefers-reduced-motion activado
 */

/**
 * CLASES CSS DISPONIBLES:
 * 
 * .glass-card-lazy - Card sin backdrop-filter inicial
 * .effect-active - Activa el backdrop-filter (añadida por IntersectionObserver)
 * .enable-complex-animations - Habilita animaciones complejas (shine, pulse)
 * .reduce-effects - Simplifica todos los efectos (añadida automáticamente)
 * .gpu-optimized - Activa aceleración GPU
 * .interactive-element - Gestiona will-change automáticamente
 */

/**
 * PERFORMANCE TARGETS:
 * 
 * - 60 FPS en animaciones
 * - Threshold de 55 FPS para reducir efectos
 * - Lazy loading con threshold 0.1 (10% visible)
 * - Early loading con rootMargin 50px
 * - Solo transform y opacity en animaciones
 * - will-change solo durante animación activa
 */
