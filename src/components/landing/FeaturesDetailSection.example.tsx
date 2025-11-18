import { FeaturesDetailSection } from './FeaturesDetailSection';
import { landingContent } from '@/data/landingContent';

/**
 * Ejemplo de uso del componente FeaturesDetailSection
 * 
 * Este componente muestra las características detalladas de cada módulo
 * del sistema en formato de tabs.
 */
export function FeaturesDetailSectionExample() {
  return (
    <div className="min-h-screen bg-background">
      <FeaturesDetailSection modules={landingContent.modules} />
    </div>
  );
}

/**
 * Uso en la landing page:
 * 
 * import { FeaturesDetailSection } from '@/components/landing/FeaturesDetailSection';
 * import { landingContent } from '@/data/landingContent';
 * 
 * <FeaturesDetailSection modules={landingContent.modules} />
 */
