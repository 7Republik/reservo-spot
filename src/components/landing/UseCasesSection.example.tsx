import { UseCasesSection } from './UseCasesSection';
import { landingContent } from '@/data/landingContent';

/**
 * Ejemplo de uso del componente UseCasesSection
 * 
 * Este componente muestra los casos de uso de RESERVEO en diferentes industrias
 * con un diseño de grid responsive (1 columna en móvil, 2 en tablet, 4 en desktop).
 */
export const UseCasesSectionExample = () => {
  return (
    <div className="min-h-screen bg-background">
      <UseCasesSection 
        title="Casos de Uso"
        useCases={landingContent.useCases}
      />
    </div>
  );
};

export default UseCasesSectionExample;
