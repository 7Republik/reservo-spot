import { ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';
import { ParkingConfetti } from './ParkingConfetti';

interface FinalCTASectionProps {
  headline: string;
  subheadline?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export const FinalCTASection = ({
  headline,
  subheadline,
  onPrimaryClick,
  onSecondaryClick
}: FinalCTASectionProps) => {
  const { ref: contentRef, isVisible: contentVisible, prefersReducedMotion } = useScrollAnimation({
    threshold: 0.3,
  });

  return (
    <section className="relative py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Confetti de parking cuando la sección es visible */}
      <ParkingConfetti trigger={contentVisible && !prefersReducedMotion} duration={4000} />
      
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        <div 
          ref={contentRef as any}
          className={`max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 ${getAnimationClasses(contentVisible, 'scaleIn', prefersReducedMotion)}`}
        >
          {/* Headline */}
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight px-2">
            {headline}
          </h2>

          {/* Subheadline */}
          {subheadline && (
            <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto px-4">
              {subheadline}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-2 sm:pt-4 max-w-md sm:max-w-none mx-auto px-4">
            <Button
              size="lg"
              onClick={onPrimaryClick}
              className="
                bg-white text-primary hover:bg-white/90
                text-sm xs:text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto
                shadow-2xl hover:shadow-white/20
                transition-all duration-300
                hover:scale-105 hover:-translate-y-1
                group
                w-full sm:w-auto
              "
            >
              Solicitar Demo Gratuita
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onSecondaryClick}
              className="
                bg-transparent text-white border-2 border-white
                hover:bg-white hover:text-primary
                text-sm xs:text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto
                transition-all duration-300
                hover:scale-105 hover:-translate-y-1
                group
                w-full sm:w-auto
              "
            >
              <MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Hablar con Ventas
            </Button>
          </div>

          {/* Trust Badge */}
          <div className="pt-4 sm:pt-6 md:pt-8">
            <p className="text-white/80 text-xs xs:text-sm px-4">
              ✓ Sin compromiso • ✓ Setup en 48 horas • ✓ Soporte incluido
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
