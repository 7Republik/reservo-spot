import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook para animar elementos cuando entran en el viewport
 * Usa Intersection Observer para detectar visibilidad
 * Respeta prefers-reduced-motion automáticamente
 */
export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    triggerOnce = true,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Detectar preferencia de movimiento reducido
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Si el usuario prefiere movimiento reducido, mostrar inmediatamente
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, prefersReducedMotion]);

  return { ref, isVisible, prefersReducedMotion };
};

/**
 * Variantes de animación predefinidas
 */
export const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  slideInUp: {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  },
  slideInDown: {
    hidden: { opacity: 0, y: -60 },
    visible: { opacity: 1, y: 0 },
  },
} as const;

/**
 * Clases CSS para animaciones (alternativa sin JS)
 */
export const getAnimationClasses = (
  isVisible: boolean,
  variant: keyof typeof animationVariants = 'fadeInUp',
  prefersReducedMotion: boolean = false
) => {
  if (prefersReducedMotion) {
    return 'opacity-100';
  }

  const baseClasses = 'transition-all duration-700 ease-out';
  
  if (!isVisible) {
    switch (variant) {
      case 'fadeIn':
        return `${baseClasses} opacity-0`;
      case 'fadeInUp':
        return `${baseClasses} opacity-0 translate-y-10`;
      case 'fadeInDown':
        return `${baseClasses} opacity-0 -translate-y-10`;
      case 'fadeInLeft':
        return `${baseClasses} opacity-0 -translate-x-10`;
      case 'fadeInRight':
        return `${baseClasses} opacity-0 translate-x-10`;
      case 'scaleIn':
        return `${baseClasses} opacity-0 scale-95`;
      case 'slideInUp':
        return `${baseClasses} opacity-0 translate-y-16`;
      case 'slideInDown':
        return `${baseClasses} opacity-0 -translate-y-16`;
      default:
        return `${baseClasses} opacity-0 translate-y-10`;
    }
  }

  return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
};
