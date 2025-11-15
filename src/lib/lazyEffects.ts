/**
 * Lazy loading de efectos visuales usando IntersectionObserver
 * Activa glassmorphism y animaciones solo cuando los elementos son visibles
 */

interface LazyEffectOptions {
  threshold?: number;
  rootMargin?: string;
  effectClass?: string;
}

/**
 * Observa elementos y añade clase de efecto cuando son visibles
 */
export const observeLazyEffects = (
  selector: string,
  options: LazyEffectOptions = {}
): IntersectionObserver | null => {
  // Verificar soporte de IntersectionObserver
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported');
    return null;
  }

  const {
    threshold = 0.1, // Early loading
    rootMargin = '50px', // Cargar un poco antes de que sea visible
    effectClass = 'effect-active'
  } = options;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Añadir clase de efecto activo
          entry.target.classList.add(effectClass);
          
          // Opcional: dejar de observar después de activar
          // observer.unobserve(entry.target);
        } else {
          // Opcional: remover clase cuando no es visible (ahorra recursos)
          entry.target.classList.remove(effectClass);
        }
      });
    },
    {
      threshold,
      rootMargin
    }
  );

  // Observar todos los elementos que coincidan con el selector
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => observer.observe(element));

  return observer;
};

/**
 * Hook para usar lazy effects en componentes React
 */
export const useLazyEffects = (
  ref: React.RefObject<HTMLElement>,
  options: LazyEffectOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    effectClass = 'effect-active'
  } = options;

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Verificar soporte
    if (!('IntersectionObserver' in window)) {
      // Fallback: activar efecto inmediatamente
      element.classList.add(effectClass);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add(effectClass);
        } else {
          element.classList.remove(effectClass);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, rootMargin, effectClass]);
};

/**
 * Lazy load de animaciones complejas (shine effect, pulse)
 */
export const enableComplexAnimations = (element: HTMLElement) => {
  // Solo habilitar en desktop y con buena conexión
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const hasGoodConnection = checkConnectionQuality();
  
  if (isDesktop && hasGoodConnection) {
    element.classList.add('enable-complex-animations');
  }
};

/**
 * Verifica la calidad de la conexión
 */
const checkConnectionQuality = (): boolean => {
  // @ts-ignore - navigator.connection no está en todos los tipos
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return true; // Asumir buena conexión si no hay API
  
  const slowConnections = ['slow-2g', '2g'];
  return !slowConnections.includes(connection.effectiveType);
};
