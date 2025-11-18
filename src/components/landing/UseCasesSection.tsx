import { UseCase } from '@/data/landingContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';

interface UseCasesSectionProps {
  title: string;
  useCases: UseCase[];
}

export const UseCasesSection = ({ title, useCases }: UseCasesSectionProps) => {
  const { ref: headerRef, isVisible: headerVisible, prefersReducedMotion } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

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
          <p className="text-sm xs:text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            RESERVEO se adapta a las necesidades específicas de tu industria
          </p>
        </div>

        {/* Grid de casos de uso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {useCases.map((useCase, index) => (
            <UseCaseCard 
              key={index}
              useCase={useCase}
              index={index}
            />
          ))}
        </div>

        {/* CTA opcional */}
        <div 
          ref={ctaRef as any}
          className={`text-center mt-8 sm:mt-10 md:mt-12 px-4 ${getAnimationClasses(ctaVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
            ¿Tu industria no está en la lista?
          </p>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-5 sm:px-6">
            Contáctanos para una solución personalizada
          </button>
        </div>
      </div>
    </section>
  );
};

// Componente separado para cada card con su propia animación
const UseCaseCard = ({ useCase, index }: { useCase: UseCase; index: number }) => {
  const { ref, isVisible, prefersReducedMotion } = useScrollAnimation({
    threshold: 0.2,
  });
  const Icon = useCase.icon;

  return (
    <div
      ref={ref as any}
      className={getAnimationClasses(isVisible, 'fadeInUp', prefersReducedMotion)}
      style={{
        transitionDelay: prefersReducedMotion ? '0ms' : `${index * 100}ms`,
      }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card h-full">
        <CardHeader className="p-5 sm:p-6">
          {/* Icono */}
          <div className="mb-3 sm:mb-4 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          
          {/* Título */}
          <CardTitle className="text-lg sm:text-xl font-semibold text-card-foreground">
            {useCase.industry}
          </CardTitle>
          
          {/* Descripción */}
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            {useCase.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0">
          {/* Lista de beneficios */}
          <ul className="space-y-2">
            {useCase.benefits.map((benefit, benefitIndex) => (
              <li 
                key={benefitIndex}
                className="flex items-start gap-2 text-xs xs:text-sm text-muted-foreground"
              >
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
