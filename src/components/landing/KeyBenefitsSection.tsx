import { KeyBenefit } from '@/data/landingContent';

interface KeyBenefitsSectionProps {
  benefits: KeyBenefit[];
}

export const KeyBenefitsSection = ({ benefits }: KeyBenefitsSectionProps) => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Título de la sección */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Beneficios Clave
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Beneficios verificables que transforman la gestión de tu aparcamiento
          </p>
        </div>

        {/* Grid de beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group bg-card border border-border rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icono con animación en hover */}
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Icon className="w-8 h-8" />
                </div>

                {/* Título */}
                <h3 className="text-xl md:text-2xl font-bold text-card-foreground mb-4">
                  {benefit.title}
                </h3>

                {/* Descripción */}
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
