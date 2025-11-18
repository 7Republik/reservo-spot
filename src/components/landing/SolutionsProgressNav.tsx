import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SolutionsProgressNavProps {
  solutions: Array<{ id: string; title: string }>;
  sectionId?: string;
}

export const SolutionsProgressNav = ({ solutions, sectionId = 'solutions' }: SolutionsProgressNavProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sectionRef.current = document.getElementById(sectionId);

    const handleScroll = () => {
      if (!sectionRef.current) return;

      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Obtener la siguiente sección (features)
      const nextSection = document.getElementById('features');
      const nextRect = nextSection?.getBoundingClientRect();

      // Mostrar solo si:
      // 1. Estamos dentro de la sección de soluciones
      // 2. La siguiente sección NO está visible en absoluto
      const isInSection = rect.top < windowHeight * 0.8 && rect.bottom > windowHeight * 0.3;
      const nextSectionNotVisible = !nextRect || nextRect.top >= windowHeight;
      
      setIsVisible(isInSection && nextSectionNotVisible);

      if (isInSection) {
        // Calcular progreso dentro de la sección
        const sectionHeight = section.offsetHeight;
        const scrolledInSection = Math.max(0, -rect.top);
        const sectionProgress = Math.min(100, (scrolledInSection / sectionHeight) * 100);
        setProgress(sectionProgress);

        // Calcular qué solución está activa
        const solutionIndex = Math.floor((sectionProgress / 100) * solutions.length);
        setActiveIndex(Math.min(solutionIndex, solutions.length - 1));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [solutions.length, sectionId]);

  const scrollToSolution = (index: number) => {
    if (!sectionRef.current) return;

    const section = sectionRef.current;
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    // Calcular posición de cada solución dentro de la sección
    // Añadir un pequeño offset para centrar mejor
    const progressRatio = index / Math.max(solutions.length - 1, 1);
    const targetPosition = sectionTop + (sectionHeight * progressRatio * 0.85);
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
    });
  };

  const goToPrevious = () => {
    if (activeIndex > 0) {
      scrollToSolution(activeIndex - 1);
    }
  };

  const goToNext = () => {
    if (activeIndex < solutions.length - 1) {
      scrollToSolution(activeIndex + 1);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      {/* Contenedor con borde gradiente animado */}
      <div className="relative p-[2px] group">
        {/* Gradiente animado suave con blur */}
        <div 
          className="absolute inset-0 rounded-2xl z-[1] opacity-50 group-hover:opacity-70 blur-md transition duration-500"
          style={{
            background: 'linear-gradient(90deg, #00ccb1, #1ca0fb, #7b61ff, #ffc414, #00ccb1)',
            backgroundSize: '300% 100%',
            animation: 'gradient 8s ease-in-out infinite',
          }}
        />
        
        {/* Gradiente animado de borde (sin blur, más suave) */}
        <div 
          className="absolute inset-0 rounded-2xl z-[1] opacity-60"
          style={{
            background: 'linear-gradient(90deg, #00ccb1, #1ca0fb, #7b61ff, #ffc414, #00ccb1)',
            backgroundSize: '300% 100%',
            animation: 'gradient 8s ease-in-out infinite',
          }}
        />
        
        {/* Contenido */}
        <div className="relative z-10 bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl p-4">
        {/* Contenido compacto en una sola línea */}
        <div className="flex items-center gap-4">
          {/* Título con ancho fijo */}
          <div className="w-64 flex-shrink-0">
            <span className="text-sm font-semibold text-foreground truncate block">
              {solutions[activeIndex].title}
            </span>
          </div>

          {/* Contador fijo separado */}
          <div className="w-16 flex-shrink-0">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap block text-center">
              {activeIndex + 1}/{solutions.length}
            </span>
          </div>

          {/* Barra de progreso con puntos - solo visual */}
          <div className="flex-1 flex items-center gap-2">
            {solutions.map((solution, index) => (
              <div
                key={solution.id}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all duration-300",
                  activeIndex === index
                    ? "bg-primary"
                    : index < activeIndex
                    ? "bg-primary/50"
                    : "bg-muted"
                )}
                title={solution.title}
              />
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
