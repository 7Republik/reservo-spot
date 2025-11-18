import { Check, Shield, Zap, HeadphonesIcon } from 'lucide-react';
import { PricingTier } from '@/data/landingContent';
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';

interface PricingSectionProps {
  tiers: PricingTier[];
}

export const PricingSection = ({ tiers }: PricingSectionProps) => {
  const { ref: headerRef, isVisible: headerVisible, prefersReducedMotion } = useScrollAnimation();
  const { ref: noteRef, isVisible: noteVisible } = useScrollAnimation();
  const { ref: trustRef, isVisible: trustVisible } = useScrollAnimation();

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        {/* Header */}
        <div 
          ref={headerRef as any}
          className={`text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16 ${getAnimationClasses(headerVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Planes para Cada Tamaño de Empresa
          </h2>
          <p className="text-sm xs:text-base sm:text-lg text-muted-foreground px-4 mb-4">
            Elige el plan que mejor se adapte a tus necesidades. Todos incluyen soporte técnico y actualizaciones.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Sin compromiso</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span>Setup en 48h</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <HeadphonesIcon className="h-4 w-4 text-primary" />
              <span>Soporte incluido</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {tiers.map((tier, index) => (
            <PricingCard 
              key={tier.name}
              tier={tier}
              index={index}
              isLast={index === tiers.length - 1}
            />
          ))}
        </div>

        {/* Trust Section */}
        <div 
          ref={trustRef as any}
          className={`text-center mt-12 sm:mt-16 px-4 ${getAnimationClasses(trustVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 sm:p-8">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              <span className="font-semibold text-foreground">Todos los planes incluyen:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Actualizaciones automáticas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Backups diarios</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Seguridad GDPR</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Modo offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div 
          ref={noteRef as any}
          className={`text-center mt-8 sm:mt-10 px-4 ${getAnimationClasses(noteVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <p className="text-sm sm:text-base text-muted-foreground">
            ¿Necesitas algo específico?{' '}
            <a href="#contact" className="text-primary hover:underline font-semibold">
              Contáctanos
            </a>
            {' '}para un plan personalizado
          </p>
        </div>
      </div>
    </section>
  );
};

// Componente separado para cada card con su propia animación
const PricingCard = ({ tier, index, isLast }: { tier: PricingTier; index: number; isLast: boolean }) => {
  const { ref, isVisible, prefersReducedMotion } = useScrollAnimation({
    threshold: 0.2,
  });

  return (
    <div
      ref={ref as any}
      className={getAnimationClasses(isVisible, 'scaleIn', prefersReducedMotion)}
      style={{
        transitionDelay: prefersReducedMotion ? '0ms' : `${index * 150}ms`,
      }}
    >
      <div
        className={`
          relative rounded-2xl border p-6 sm:p-8 h-full flex flex-col
          transition-all duration-300
          ${
            tier.recommended
              ? 'border-primary bg-card shadow-2xl md:scale-105 lg:scale-110'
              : 'border-border bg-card hover:border-primary/50 hover:shadow-lg'
          }
          ${index === 1 ? 'md:col-span-2 lg:col-span-1' : ''}
        `}
      >
        {/* Recommended Badge */}
        {tier.recommended && (
          <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
              Recomendado
            </span>
          </div>
        )}

        {/* Tier Name */}
        <div className="mb-4 sm:mb-5">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {tier.name}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-3">
            {tier.description}
          </p>
          
          {/* Price Display */}
          {tier.price ? (
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                  {tier.price}
                </span>
                {tier.priceUnit && (
                  <span className="text-sm text-muted-foreground">
                    {tier.priceUnit}
                  </span>
                )}
              </div>
              {tier.priceNote && (
                <p className="text-xs text-muted-foreground mt-1">
                  {tier.priceNote}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                Precio personalizado
              </span>
            </div>
          )}
        </div>

        {/* Features List */}
        <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
          {tier.features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-start gap-2.5 sm:gap-3">
              <Check className={`
                h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5
                ${tier.recommended ? 'text-primary' : 'text-muted-foreground'}
              `} />
              <span className="text-sm sm:text-base text-foreground">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <div className="space-y-3">
          <button
            className={`
              w-full py-2.5 sm:py-3 px-6 rounded-lg font-semibold text-sm sm:text-base
              transition-all duration-200
              ${
                tier.recommended
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }
            `}
          >
            {tier.ctaText || 'Solicitar Demo Gratuita'}
          </button>
          
          {/* Value Props */}
          <div className="text-center space-y-1">
            {tier.valueProps?.map((prop, propIndex) => (
              <p key={propIndex} className="text-xs text-muted-foreground">
                {prop}
              </p>
            ))}
          </div>
        </div>

        {/* Note */}
        {isLast && (
          <p className="text-xs text-muted-foreground text-center mt-3 sm:mt-4 pt-3 border-t border-border">
            Planes personalizables según necesidades
          </p>
        )}
      </div>
    </div>
  );
};
