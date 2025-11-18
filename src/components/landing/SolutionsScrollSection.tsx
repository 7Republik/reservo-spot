import { Solution } from '@/data/landingContent';
import { Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SolutionsScrollSectionProps {
  title: string;
  solutions: Solution[];
}

export const SolutionsScrollSection = ({ title, solutions }: SolutionsScrollSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !contentRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;
      const windowHeight = window.innerHeight;

      // Calcular el progreso del scroll dentro del contenedor
      const scrollStart = rect.top;
      const scrollEnd = rect.bottom - windowHeight;
      
      if (scrollStart > 0) {
        // Antes de llegar al contenedor
        setActiveIndex(0);
        setProgress(0);
      } else if (scrollEnd < 0) {
        // Después del contenedor
        setActiveIndex(solutions.length - 1);
        setProgress(100);
      } else {
        // Dentro del contenedor
        const scrollProgress = Math.abs(scrollStart) / (containerHeight - windowHeight);
        const clampedProgress = Math.max(0, Math.min(1, scrollProgress));
        setProgress(clampedProgress * 100);

        // Calcular qué sección está activa
        const sectionIndex = Math.floor(clampedProgress * solutions.length);
        setActiveIndex(Math.min(sectionIndex, solutions.length - 1));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [solutions.length]);

  const scrollToSection = (index: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerTop = container.offsetTop;
    const containerHeight = container.offsetHeight;
    const windowHeight = window.innerHeight;
    
    const scrollableHeight = containerHeight - windowHeight;
    const targetScroll = containerTop + (scrollableHeight * (index / solutions.length));
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        {/* Título de la sección */}
        <div className="text-center mb-12 md:mb-16 lg:mb-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            {title}
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Descubre cómo RESERVEO resuelve cada problema con funcionalidades específicas
          </p>
        </div>

        {/* Layout con navegación lateral (desktop) */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Navegación lateral fija (solo desktop) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-2">
              {solutions.map((solution, index) => (
                <button
                  key={solution.id}
                  onClick={() => scrollToSection(index)}
                  className={cn(
                    "w-full text-left px-6 py-4 rounded-lg transition-all duration-300",
                    "hover:bg-accent/50",
                    activeIndex === index
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : "bg-card text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      activeIndex === index ? "bg-primary-foreground scale-150" : "bg-muted-foreground/30"
                    )} />
                    <span className="font-semibold text-sm md:text-base">
                      {solution.title}
                    </span>
                  </div>
                </button>
              ))}
              
              {/* Barra de progreso */}
              <div className="mt-6 px-6">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenedor con altura fija para scroll controlado */}
          <div 
            ref={containerRef}
            className="lg:col-span-8"
            style={{ height: `${solutions.length * 100}vh` }}
          >
            {/* Contenido sticky que cambia según el scroll */}
            <div 
              ref={contentRef}
              className="sticky top-24 h-[80vh] flex items-center"
            >
              <SolutionCard 
                solution={solutions[activeIndex]} 
                isActive={true}
                index={activeIndex}
              />
            </div>
          </div>
        </div>

        {/* Indicador de progreso móvil */}
        <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              {solutions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSection(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    activeIndex === index
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Ir a ${solutions[index].title}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Componente de tarjeta de solución con animaciones
const SolutionCard = ({ 
  solution, 
  isActive,
  index 
}: { 
  solution: Solution; 
  isActive: boolean;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "w-full transition-all duration-700 ease-out",
        isActive ? "opacity-100 scale-100" : "opacity-40 scale-95"
      )}
    >
      <div className="space-y-6 md:space-y-8">
        {/* Badge con número */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-lg md:text-xl transition-all duration-500",
            isActive 
              ? "bg-primary text-primary-foreground scale-110 shadow-lg" 
              : "bg-muted text-muted-foreground"
          )}>
            {index + 1}
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>

        {/* Título y descripción */}
        <div className="space-y-4">
          <h3 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            {solution.title}
          </h3>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            {solution.description}
          </p>
        </div>

        {/* Beneficios */}
        <ul className="space-y-3 md:space-y-4">
          {solution.benefits.map((benefit, benefitIndex) => (
            <li
              key={benefitIndex}
              className={cn(
                "flex items-start gap-3 text-foreground transition-all duration-500",
                isActive 
                  ? "translate-x-0 opacity-100" 
                  : "translate-x-4 opacity-60"
              )}
              style={{
                transitionDelay: isActive ? `${benefitIndex * 100}ms` : '0ms'
              }}
            >
              <div className={cn(
                "mt-1 rounded-full p-1 transition-all duration-500",
                isActive ? "bg-primary/20" : "bg-muted"
              )}>
                <Check className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-500",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <span className="text-sm sm:text-base md:text-lg flex-1">
                {benefit}
              </span>
            </li>
          ))}
        </ul>

        {/* Imagen/Screenshot */}
        <div className={cn(
          "relative rounded-xl overflow-hidden shadow-2xl bg-card border border-border transition-all duration-700",
          isActive 
            ? "scale-100 opacity-100 translate-y-0" 
            : "scale-95 opacity-60 translate-y-4"
        )}>
          <div className="aspect-video w-full">
            <img
              src={solution.imageUrl}
              alt={`${solution.title} - Funcionalidad de RESERVEO`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          {/* Overlay con gradiente cuando no está activo */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-background/80 to-transparent transition-opacity duration-700",
            isActive ? "opacity-0" : "opacity-100"
          )} />
        </div>
      </div>
    </div>
  );
};
