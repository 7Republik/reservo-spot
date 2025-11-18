import { RoleBenefit } from '@/data/landingContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Quote } from 'lucide-react';
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';

interface BenefitsByRoleSectionProps {
  title: string;
  subtitle?: string;
  roleBenefits: RoleBenefit[];
}

export const BenefitsByRoleSection = ({ 
  title, 
  subtitle,
  roleBenefits 
}: BenefitsByRoleSectionProps) => {
  const { ref: headerRef, isVisible: headerVisible, prefersReducedMotion } = useScrollAnimation();

  // Mapeo de colores a clases de Tailwind
  const colorClasses = {
    blue: {
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: 'text-blue-600 dark:text-blue-400',
      quote: 'border-blue-500/20 bg-blue-500/5'
    },
    purple: {
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: 'text-purple-600 dark:text-purple-400',
      quote: 'border-purple-500/20 bg-purple-500/5'
    },
    green: {
      badge: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      icon: 'text-green-600 dark:text-green-400',
      quote: 'border-green-500/20 bg-green-500/5'
    }
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        {/* Título de la sección */}
        <div 
          ref={headerRef as any}
          className={`text-center mb-8 sm:mb-12 md:mb-16 ${getAnimationClasses(headerVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm xs:text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              {subtitle}
            </p>
          )}
        </div>

        {/* Grid de 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {roleBenefits.map((benefit, index) => (
            <RoleBenefitCard 
              key={benefit.role}
              benefit={benefit}
              colors={colorClasses[benefit.color as keyof typeof colorClasses] || colorClasses.blue}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente separado para cada card con su propia animación
const RoleBenefitCard = ({ benefit, colors, index }: { benefit: RoleBenefit; colors: any; index: number }) => {
  const { ref, isVisible, prefersReducedMotion } = useScrollAnimation({
    threshold: 0.2,
  });
  const Icon = benefit.icon;

  return (
    <div
      ref={ref as any}
      className={getAnimationClasses(isVisible, 'fadeInUp', prefersReducedMotion)}
      style={{
        transitionDelay: prefersReducedMotion ? '0ms' : `${index * 150}ms`,
      }}
    >
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
        <CardHeader className="space-y-3 sm:space-y-4 p-5 sm:p-6">
          {/* Icono y Badge */}
          <div className="flex items-center justify-between">
            <div className={`p-2.5 sm:p-3 rounded-lg ${colors.badge}`}>
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.icon}`} />
            </div>
            <Badge variant="outline" className={`${colors.badge} text-xs sm:text-sm`}>
              {benefit.role}
            </Badge>
          </div>

          <CardTitle className="text-lg xs:text-xl sm:text-2xl">
            Para {benefit.role}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 sm:space-y-6 p-5 sm:p-6 pt-0">
          {/* Lista de beneficios */}
          <ul className="space-y-2.5 sm:space-y-3">
            {benefit.benefits.map((item, idx) => (
              <li 
                key={idx}
                className="flex items-start gap-2.5 sm:gap-3 text-xs xs:text-sm sm:text-base"
              >
                <Check className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>

          {/* Quote si existe */}
          {benefit.quote && (
            <div className={`relative p-3 sm:p-4 rounded-lg border ${colors.quote}`}>
              <Quote className={`h-3.5 w-3.5 sm:h-4 sm:w-4 absolute top-2 left-2 ${colors.icon} opacity-50`} />
              <p className="text-xs sm:text-sm italic text-muted-foreground pl-5 sm:pl-6">
                "{benefit.quote}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
