import { useFPSMonitor } from '@/hooks/useAnimationOptimizer';

/**
 * Componente para mostrar FPS en desarrollo
 * Solo visible en modo desarrollo
 */
export const FPSCounter = () => {
  const { currentFPS, averageFPS, isPerformanceGood } = useFPSMonitor(true);

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  const getColorClass = () => {
    if (averageFPS >= 55) return 'fps-good';
    if (averageFPS >= 45) return 'fps-medium';
    return 'fps-low';
  };

  return (
    <div className={`fps-counter ${getColorClass()}`}>
      <div>FPS: {currentFPS}</div>
      <div>Avg: {averageFPS}</div>
      <div>{isPerformanceGood ? '✓' : '⚠'}</div>
    </div>
  );
};
