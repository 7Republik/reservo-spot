import { useEffect, useState, useRef } from 'react';
import {
  startFPSMonitoring,
  stopFPSMonitoring,
  getAverageFPS,
  getCurrentFPS,
  isPerformanceGood,
  startAutoOptimization,
  animateElement,
  easings,
  withWillChange
} from '@/lib/animationOptimizer';

/**
 * Hook para monitorear FPS y optimizar animaciones automáticamente
 */
export const useFPSMonitor = (autoOptimize = true) => {
  const [fps, setFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);
  const [performanceGood, setPerformanceGood] = useState(true);

  useEffect(() => {
    // Iniciar monitoreo
    const meter = startFPSMonitoring();
    
    // Iniciar auto-optimización si está habilitado
    let cleanup: (() => void) | undefined;
    if (autoOptimize) {
      cleanup = startAutoOptimization();
    }

    // Actualizar estado cada segundo
    const intervalId = setInterval(() => {
      setFps(getCurrentFPS());
      setAvgFps(getAverageFPS());
      setPerformanceGood(isPerformanceGood());
    }, 1000);

    return () => {
      clearInterval(intervalId);
      stopFPSMonitoring();
      cleanup?.();
    };
  }, [autoOptimize]);

  return {
    currentFPS: fps,
    averageFPS: avgFps,
    isPerformanceGood: performanceGood
  };
};

/**
 * Hook para animar un elemento con requestAnimationFrame
 */
export const useOptimizedAnimation = () => {
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      // Cancelar animación al desmontar
      cancelRef.current?.();
    };
  }, []);

  const animate = (
    element: HTMLElement,
    property: 'transform' | 'opacity',
    from: string | number,
    to: string | number,
    duration: number,
    easing: keyof typeof easings = 'easeOut',
    onComplete?: () => void
  ) => {
    // Cancelar animación anterior si existe
    cancelRef.current?.();

    // Iniciar nueva animación
    cancelRef.current = animateElement({
      element,
      property,
      from,
      to,
      duration,
      easing: easings[easing],
      onComplete
    });
  };

  return { animate };
};

/**
 * Hook para gestionar will-change automáticamente
 */
export const useWillChange = (ref: React.RefObject<HTMLElement>) => {
  const addWillChange = (properties: string[], callback: () => void) => {
    if (!ref.current) return;
    withWillChange(ref.current, properties, callback);
  };

  return { addWillChange };
};

/**
 * Hook para detectar si se deben usar animaciones complejas
 */
export const useComplexAnimationsEnabled = () => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Verificar prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const checkEnabled = () => {
      const prefersReduced = motionQuery.matches;
      const hasReduceEffects = document.documentElement.classList.contains('reduce-effects');
      setEnabled(!prefersReduced && !hasReduceEffects);
    };

    checkEnabled();
    motionQuery.addEventListener('change', checkEnabled);

    // Observar cambios en la clase reduce-effects
    const observer = new MutationObserver(checkEnabled);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      motionQuery.removeEventListener('change', checkEnabled);
      observer.disconnect();
    };
  }, []);

  return enabled;
};
