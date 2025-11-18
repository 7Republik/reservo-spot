import { SolutionsSection } from './SolutionsSection';
import { landingContent } from '@/data/landingContent';

/**
 * Ejemplo de uso del componente SolutionsSection
 * 
 * Este componente muestra las 8 funcionalidades principales de RESERVEO
 * con un layout alternado (imagen izquierda/derecha).
 * 
 * Características:
 * - Layout alternado automático según imagePosition
 * - Responsive (stack en mobile)
 * - Lista de beneficios con checkmarks
 * - Placeholders temporales para screenshots
 */

export const SolutionsSectionExample = () => {
  return (
    <SolutionsSection
      title="Soluciones Completas para Cada Necesidad"
      solutions={landingContent.solutions}
    />
  );
};

/**
 * Integración en Landing Page:
 * 
 * import { SolutionsSection } from '@/components/landing/SolutionsSection';
 * import { landingContent } from '@/data/landingContent';
 * 
 * function LandingPage() {
 *   return (
 *     <>
 *       <HeroSection {...landingContent.hero} />
 *       <ProblemsSection problems={landingContent.problems} />
 *       <SolutionsSection 
 *         title="Soluciones Completas para Cada Necesidad"
 *         solutions={landingContent.solutions}
 *       />
 *       {/* ... más secciones */}
 *     </>
 *   );
 * }
 */

/**
 * Estructura de datos esperada:
 * 
 * interface Solution {
 *   id: string;
 *   title: string;
 *   description: string;
 *   benefits: string[];
 *   imageUrl: string;
 *   imagePosition: 'left' | 'right';
 * }
 * 
 * Las 8 soluciones incluidas:
 * 1. Sistema de Reservas Inteligente (imagen derecha)
 * 2. Check-in/Check-out Automático (imagen izquierda)
 * 3. Lista de Espera Dinámica (imagen derecha)
 * 4. Gestión de Incidentes con Foto (imagen izquierda)
 * 5. Sistema de Notificaciones Inteligente (imagen derecha)
 * 6. Gestión de Advertencias (imagen izquierda)
 * 7. Modo Offline (imagen derecha)
 * 8. Panel de Administración Completo (imagen izquierda)
 */

/**
 * Notas sobre screenshots:
 * 
 * Actualmente usando placeholders de placehold.co
 * Ver src/assets/landing/PLACEHOLDERS.md para instrucciones
 * de captura de screenshots reales.
 * 
 * Una vez capturados, actualizar imageUrl en landingContent.ts:
 * imageUrl: "/assets/landing/calendar-screenshot.png"
 */
