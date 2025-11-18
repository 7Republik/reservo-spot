import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { landingContent } from "@/data/landingContent";
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';

export const FAQSection = () => {
  const { faqs } = landingContent;
  const { ref: headerRef, isVisible: headerVisible, prefersReducedMotion } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div 
          ref={headerRef as any}
          className={`text-center mb-8 sm:mb-12 md:mb-16 ${getAnimationClasses(headerVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Preguntas Frecuentes
          </h2>
          <p className="text-sm xs:text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Resolvemos las dudas más comunes sobre RESERVEO
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index}
              faq={faq}
              index={index}
            />
          ))}
        </Accordion>

        {/* CTA al final */}
        <div 
          ref={ctaRef as any}
          className={`mt-8 sm:mt-10 md:mt-12 text-center ${getAnimationClasses(ctaVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-2">
            ¿Más preguntas? Estamos aquí para ayudarte
          </p>
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Contáctanos
          </a>
        </div>
      </div>
    </section>
  );
};

// Componente separado para cada FAQ con su propia animación
const FAQItem = ({ faq, index }: { faq: { question: string; answer: string }; index: number }) => {
  const { ref, isVisible, prefersReducedMotion } = useScrollAnimation({
    threshold: 0.3,
  });

  return (
    <div
      ref={ref as any}
      className={getAnimationClasses(isVisible, 'fadeInUp', prefersReducedMotion)}
      style={{
        transitionDelay: prefersReducedMotion ? '0ms' : `${index * 80}ms`,
      }}
    >
      <AccordionItem
        value={`item-${index}`}
        className="border border-border rounded-lg px-4 sm:px-5 md:px-6 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300"
      >
        <AccordionTrigger className="text-left text-sm xs:text-base sm:text-lg font-semibold text-card-foreground hover:text-primary transition-colors py-4">
          {faq.question}
        </AccordionTrigger>
        <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {faq.answer}
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};
