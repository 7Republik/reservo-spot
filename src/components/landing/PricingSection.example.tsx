import { PricingSection } from './PricingSection';
import { landingContent } from '@/data/landingContent';

/**
 * Ejemplo de uso del componente PricingSection
 * 
 * Este componente muestra los planes de pricing con:
 * - 3 tiers (Starter, Professional, Enterprise)
 * - Plan central destacado como "Recomendado"
 * - Lista de características con checkmarks
 * - CTA "Contactar para Precio"
 * - Diseño responsive
 */
export const PricingSectionExample = () => {
  return (
    <div className="min-h-screen bg-background">
      <PricingSection tiers={landingContent.pricingTiers} />
    </div>
  );
};

export default PricingSectionExample;
