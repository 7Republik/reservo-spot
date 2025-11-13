import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar media queries en tiempo real.
 * 
 * @param query - Media query CSS (ej: "(min-width: 768px)")
 * @returns boolean - true si la media query coincide, false si no
 * 
 * @example
 * const isTablet = useMediaQuery("(min-width: 768px)");
 * const isMobile = useMediaQuery("(max-width: 767px)");
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    // Verificar si estamos en el navegador
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Actualizar el estado inicial
    setMatches(mediaQuery.matches);

    // Función para manejar cambios en la media query
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Agregar listener para cambios
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup: remover listener al desmontar
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};
