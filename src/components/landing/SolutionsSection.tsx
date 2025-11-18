import { Solution } from '@/data/landingContent';
import { Check } from 'lucide-react';
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';

interface SolutionsSectionProps {
  title: string;
  solutions: Solution[];
}

export const SolutionsSection = ({ title, solutions }: SolutionsSectionProps) => {
  const { ref: headerRef, isVisible: headerVisible, prefersReducedMotion } = useScrollAnimation();

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        {/* Título de la sección */}
        <div 
          ref={headerRef as any}
          className={`text-center mb-8 sm:mb-12 md:mb-16 ${getAnimationClasses(headerVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            {title}
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Descubre cómo RESERVEO resuelve cada problema con funcionalidades específicas
          </p>
        </div>

        {/* Soluciones con línea de conexión en S estilo Art Deco */}
        <div className="relative">
          {/* Línea decorativa en S estilo Art Deco (solo desktop) */}
          <div className="hidden lg:block absolute left-0 right-0 top-0 bottom-0 pointer-events-none overflow-hidden">
            {/* Línea en S usando divs con border */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1">
              {solutions.map((_, index) => {
                const isEven = index % 2 === 0;
                const topPercent = (index / solutions.length) * 100;
                const heightPercent = (1 / solutions.length) * 100;
                
                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                      left: '50%',
                      width: '200px',
                    }}
                  >
                    {/* Curva en S */}
                    <div
                      className="absolute inset-0"
                      style={{
                        borderTop: '3px solid hsl(var(--primary) / 0.4)',
                        borderRadius: isEven ? '0 100px 0 0' : '100px 0 0 0',
                        transform: isEven ? 'translateX(-50%)' : 'translateX(-150px)',
                        filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.3))',
                      }}
                    />
                    
                    {/* Nodo decorativo Art Deco */}
                    <div
                      className="absolute top-0"
                      style={{
                        left: isEven ? '0' : '200px',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Glow */}
                      <div className="absolute inset-0 w-8 h-8 bg-primary/30 rounded-full blur-md animate-pulse" />
                      
                      {/* Círculo exterior */}
                      <div className="relative w-12 h-12 rounded-full bg-background border-3 border-primary shadow-lg flex items-center justify-center">
                        {/* Círculo interior */}
                        <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">
                            {index + 1}
                          </span>
                        </div>
                        
                        {/* Rayos Art Deco */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                          <div
                            key={angle}
                            className="absolute w-6 h-0.5 bg-primary/30"
                            style={{
                              transform: `rotate(${angle}deg)`,
                              transformOrigin: 'left center',
                              left: '50%',
                              top: '50%',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Soluciones */}
          <div className="relative space-y-12 sm:space-y-16 md:space-y-20 lg:space-y-24" style={{ zIndex: 1 }}>
            {solutions.map((solution, index) => (
              <SolutionItem 
                key={solution.id}
                solution={solution}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Componente separado para cada solución con su propia animación
const SolutionItem = ({ solution, index }: { solution: Solution; index: number }) => {
  const { ref, isVisible, prefersReducedMotion } = useScrollAnimation({
    threshold: 0.2,
  });

  const animationVariant = solution.imagePosition === 'left' ? 'fadeInLeft' : 'fadeInRight';

  return (
    <div
      ref={ref as any}
      className={`flex flex-col ${
        solution.imagePosition === 'left'
          ? 'lg:flex-row-reverse'
          : 'lg:flex-row'
      } gap-6 sm:gap-8 md:gap-10 lg:gap-16 items-center ${getAnimationClasses(isVisible, animationVariant, prefersReducedMotion)}`}
    >
      {/* Contenido de texto */}
      <div className="flex-1 space-y-4 sm:space-y-6">
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground px-2">
            {solution.title}
          </h3>
          <p className="text-sm xs:text-base sm:text-lg text-muted-foreground leading-relaxed px-2">
            {solution.description}
          </p>
        </div>

        {/* Lista de beneficios */}
        <ul className="space-y-2.5 sm:space-y-3 px-2">
          {solution.benefits.map((benefit, benefitIndex) => (
            <li
              key={benefitIndex}
              className="flex items-start gap-2.5 sm:gap-3 text-foreground"
            >
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm sm:text-base">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Imagen/Screenshot */}
      <div className="flex-1 w-full">
        <div className="relative rounded-lg overflow-hidden shadow-xl bg-card border border-border hover:shadow-2xl transition-shadow duration-300">
          <img
            src={solution.imageUrl}
            alt={`${solution.title} - Funcionalidad de RESERVEO para gestión de aparcamiento corporativo`}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
