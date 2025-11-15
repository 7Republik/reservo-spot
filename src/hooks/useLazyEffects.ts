import { useEffect, useRef } from 'react';

interface UseLazyEffectsOptions {
  threshold?: number;
  rootMargin?: string;
  effectClass?: string;
  once?: boolean;
}

/**
 * Hook para activar efectos visuales solo cuando el elemento es visible
 * Usa IntersectionObserver para mejor performance
 */
export const useLazyEffects = (
  options: UseLazyEffectsOptions = {}
) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    threshold = 0.1, // Early loading
    rootMargin = '50px', // Cargar un poco antes
    effectClass = 'effect-active',
    once = false // Si true, solo activa una vez
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Verificar soporte de IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      // Fallback: activar efecto inmediatamente
      element.classList.add(effectClass);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add(effectClass);
          
          // Si once=true, dejar de observar después de activar
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          // Solo remover si no es "once" (para ahorrar recursos)
          element.classList.remove(effectClass);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, effectClass, once]);

  return ref;
};

/**
 * Hook para habilitar animaciones complejas solo en desktop con buena conexión
 */
export const useComplexAnimations = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Verificar si es desktop
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    
    // Verificar calidad de conexión
    // @ts-ignore - navigator.connection no está en todos los tipos
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    let hasGoodConnection = true;
    if (connection) {
      const slowConnections = ['slow-2g', '2g'];
      hasGoodConnection = !slowConnections.includes(connection.effectiveType);
    }

    // Solo habilitar en desktop con buena conexión
    if (isDesktop && hasGoodConnection) {
      element.classList.add('enable-complex-animations');
    }

    return () => {
      element.classList.remove('enable-complex-animations');
    };
  }, []);

  return ref;
};
