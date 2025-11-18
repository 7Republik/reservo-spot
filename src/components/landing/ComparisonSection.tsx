import { X, Check } from 'lucide-react';
import { landingContent } from '@/data/landingContent';

export const ComparisonSection = () => {
  const { comparisons } = landingContent;

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Gestión Manual vs Con RESERVEO
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubre la diferencia entre seguir con procesos manuales o dar el salto a la automatización inteligente
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-border shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-6 px-8 text-left text-lg font-semibold text-foreground bg-muted/30">
                    Aspecto
                  </th>
                  <th className="py-6 px-8 text-left text-lg font-semibold text-destructive bg-destructive/5">
                    Gestión Manual
                  </th>
                  <th className="py-6 px-8 text-left text-lg font-semibold text-primary bg-primary/5">
                    Con RESERVEO
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, index) => (
                  <tr
                    key={row.aspect}
                    className={`border-b border-border last:border-b-0 transition-colors hover:bg-muted/20 ${
                      index % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                    }`}
                  >
                    <td className="py-6 px-8 font-medium text-foreground">
                      {row.aspect}
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-start gap-3">
                        <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{row.manual}</span>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground font-medium">{row.withReserveo}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-6">
            {comparisons.map((row) => (
              <div
                key={row.aspect}
                className="bg-card border border-border rounded-xl p-6 shadow-lg space-y-6"
              >
                <h3 className="text-xl font-bold text-foreground text-center pb-4 border-b border-border">
                  {row.aspect}
                </h3>
                
                {/* Manual */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="font-semibold text-destructive">Gestión Manual</span>
                  </div>
                  <p className="text-muted-foreground pl-10">{row.manual}</p>
                </div>

                {/* RESERVEO */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-primary">Con RESERVEO</span>
                  </div>
                  <p className="text-foreground font-medium pl-10">{row.withReserveo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="#pricing"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
          >
            Descubre la Diferencia
          </a>
        </div>
      </div>
    </section>
  );
};
