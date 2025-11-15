/**
 * Optimizador de animaciones para mantener 60fps
 * Usa solo transform y opacity, gestiona will-change, y mide FPS
 */

interface AnimationConfig {
  element: HTMLElement;
  property: 'transform' | 'opacity';
  from: string | number;
  to: string | number;
  duration: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

/**
 * Funciones de easing optimizadas
 */
export const easings = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => Math.pow(t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

/**
 * Anima un elemento usando requestAnimationFrame
 * Solo usa transform y opacity para mejor performance
 */
export const animateElement = (config: AnimationConfig): (() => void) => {
  const {
    element,
    property,
    from,
    to,
    duration,
    easing = easings.easeOut,
    onComplete
  } = config;

  let startTime: number | null = null;
  let animationId: number;

  // Añadir will-change solo durante la animación
  element.style.willChange = property;

  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    // Interpolar valor
    if (property === 'opacity') {
      const fromNum = typeof from === 'number' ? from : parseFloat(from as string);
      const toNum = typeof to === 'number' ? to : parseFloat(to as string);
      const value = fromNum + (toNum - fromNum) * easedProgress;
      element.style.opacity = value.toString();
    } else if (property === 'transform') {
      element.style.transform = to as string; // Simplificado para transforms
    }

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      // Limpiar will-change al terminar
      element.style.willChange = 'auto';
      onComplete?.();
    }
  };

  animationId = requestAnimationFrame(animate);

  // Retornar función para cancelar animación
  return () => {
    cancelAnimationFrame(animationId);
    element.style.willChange = 'auto';
  };
};

/**
 * Medidor de FPS
 */
class FPSMeter {
  private frames: number[] = [];
  private lastTime = performance.now();
  private isRunning = false;
  private animationId: number | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.frames = [];
    this.measure();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private measure = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const delta = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Calcular FPS
    const fps = 1000 / delta;
    this.frames.push(fps);

    // Mantener solo los últimos 60 frames (1 segundo a 60fps)
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    this.animationId = requestAnimationFrame(this.measure);
  };

  getAverageFPS(): number {
    if (this.frames.length === 0) return 0;
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frames.length);
  }

  getCurrentFPS(): number {
    if (this.frames.length === 0) return 0;
    return Math.round(this.frames[this.frames.length - 1]);
  }

  isPerformanceGood(): boolean {
    return this.getAverageFPS() >= 55;
  }
}

// Instancia global del medidor
let fpsMeter: FPSMeter | null = null;

/**
 * Inicia la medición de FPS
 */
export const startFPSMonitoring = (): FPSMeter => {
  if (!fpsMeter) {
    fpsMeter = new FPSMeter();
  }
  fpsMeter.start();
  return fpsMeter;
};

/**
 * Detiene la medición de FPS
 */
export const stopFPSMonitoring = (): void => {
  fpsMeter?.stop();
};

/**
 * Obtiene el FPS actual
 */
export const getCurrentFPS = (): number => {
  return fpsMeter?.getCurrentFPS() || 0;
};

/**
 * Obtiene el FPS promedio
 */
export const getAverageFPS = (): number => {
  return fpsMeter?.getAverageFPS() || 0;
};

/**
 * Verifica si el performance es bueno (>= 55fps)
 */
export const isPerformanceGood = (): boolean => {
  return fpsMeter?.isPerformanceGood() ?? true;
};

/**
 * Optimiza animaciones basándose en el FPS actual
 */
export const optimizeAnimationsBasedOnFPS = (): void => {
  if (!fpsMeter) return;

  const avgFPS = fpsMeter.getAverageFPS();
  const root = document.documentElement;

  if (avgFPS < 55 && avgFPS > 0) {
    // Performance bajo, reducir efectos
    root.classList.add('reduce-effects');
    console.warn(`⚠️ FPS bajo detectado (${avgFPS}). Reduciendo efectos visuales.`);
  } else if (avgFPS >= 58) {
    // Performance bueno, habilitar efectos (si no hay otras restricciones)
    const hasSlowConnection = root.classList.contains('reduce-effects');
    if (!hasSlowConnection) {
      root.classList.remove('reduce-effects');
    }
  }
};

/**
 * Monitorea FPS continuamente y optimiza automáticamente
 */
export const startAutoOptimization = (): (() => void) => {
  const meter = startFPSMonitoring();
  
  // Verificar FPS cada 2 segundos
  const intervalId = setInterval(() => {
    optimizeAnimationsBasedOnFPS();
  }, 2000);

  // Retornar función de cleanup
  return () => {
    clearInterval(intervalId);
    stopFPSMonitoring();
  };
};

/**
 * Utilidad para añadir will-change temporalmente
 */
export const withWillChange = (
  element: HTMLElement,
  properties: string[],
  callback: () => void
): void => {
  // Añadir will-change
  element.style.willChange = properties.join(', ');

  // Ejecutar callback
  callback();

  // Remover will-change después de un frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.style.willChange = 'auto';
    });
  });
};

/**
 * Verifica si se deben usar animaciones optimizadas
 */
export const shouldUseOptimizedAnimations = (): boolean => {
  // Verificar prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return false;

  // Verificar si hay clase reduce-effects
  const hasReduceEffects = document.documentElement.classList.contains('reduce-effects');
  if (hasReduceEffects) return false;

  // Verificar FPS si está disponible
  if (fpsMeter) {
    return fpsMeter.isPerformanceGood();
  }

  return true;
};
