import { landingContent } from '@/data/landingContent';
import { Card, CardContent } from '@/components/ui/card';
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';

export const ProblemsSection = () => {
  const { ref: headerRef, isVisible: headerVisible, prefersReducedMotion } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        {/* Header */}
        <div 
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16 ${getAnimationClasses(headerVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-2">
            ¿Te suena familiar?
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-muted-foreground px-4">
            Estos son los problemas más comunes que enfrentan las empresas al gestionar su aparcamiento de forma manual
          </p>
        </div>

        {/* Grid de problemas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {landingContent.problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <ProblemCard 
                key={index}
                problem={problem}
                Icon={Icon}
                index={index}
              />
            );
          })}
        </div>

        {/* CTA opcional */}
        <div 
          ref={ctaRef}
          className={`text-center mt-8 sm:mt-10 md:mt-12 px-4 ${getAnimationClasses(ctaVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <p className="text-sm xs:text-base sm:text-lg text-muted-foreground">
            ¿Cansado de estos problemas? <span className="font-semibold text-foreground">RESERVEO tiene la solución.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

// Componente separado para cada card con su propia animación
const ProblemCard = ({ problem, Icon, index }: { problem: any; Icon: any; index: number }) => {
  const { ref, isVisible, prefersReducedMotion } = useScrollAnimation({
    threshold: 0.2,
  });

  return (
    <div
      ref={ref}
      className={getAnimationClasses(isVisible, 'fadeInUp', prefersReducedMotion)}
      style={{
        transitionDelay: prefersReducedMotion ? '0ms' : `${index * 100}ms`,
      }}
    >
      <Card className="border-2 hover:border-destructive/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group h-full">
        <CardContent className="p-4 sm:p-5 md:p-6">
          {/* Icono */}
          <div className="mb-3 sm:mb-4 inline-flex p-2.5 sm:p-3 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
          </div>

          {/* Título */}
          <h3 className="text-base xs:text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-foreground">
            {problem.title}
          </h3>

          {/* Descripción */}
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {problem.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
