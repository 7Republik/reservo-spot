import { KeyBenefitsSection } from './KeyBenefitsSection';
import { ShieldCheck, FileCheck, Zap, Bell } from 'lucide-react';

/**
 * Ejemplo de uso de KeyBenefitsSection
 * 
 * Este componente muestra 4 beneficios clave en un grid 2x2 (responsive a 1 columna en móvil).
 * Cada card tiene:
 * - Icono con animación en hover (scale + rotate)
 * - Título destacado
 * - Descripción breve
 * - Efecto hover con elevación y sombra
 */

export const KeyBenefitsSectionExample = () => {
  const exampleBenefits = [
    {
      icon: ShieldCheck,
      title: "Cero conflictos de doble reserva",
      description: "El sistema garantiza por diseño que cada plaza solo puede reservarse una vez por fecha. Imposible crear conflictos."
    },
    {
      icon: FileCheck,
      title: "Trazabilidad completa de ocupación",
      description: "Logs automáticos de todas las operaciones. Sabes quién reservó qué, cuándo y por qué en todo momento."
    },
    {
      icon: Zap,
      title: "Gestión automatizada de incidentes",
      description: "Desde el reporte con foto hasta la reasignación y advertencia al infractor. Todo automático."
    },
    {
      icon: Bell,
      title: "Notificaciones en tiempo real",
      description: "In-app y email. Los usuarios siempre están informados de ofertas, recordatorios y advertencias."
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <KeyBenefitsSection benefits={exampleBenefits} />
    </div>
  );
};

/**
 * Características del componente:
 * 
 * - Grid responsive: 2 columnas en desktop, 1 en móvil
 * - Cards con hover effect (elevación + translate)
 * - Iconos con animación (scale + rotate) en hover
 * - Usa tokens semánticos de color (bg-card, text-foreground, etc.)
 * - Espaciado consistente con el resto de la landing
 * - Sombras sutiles que aumentan en hover
 * 
 * Props:
 * - benefits: Array de objetos con { icon, title, description }
 * 
 * Uso en Index.tsx:
 * ```tsx
 * <KeyBenefitsSection benefits={landingContent.keyBenefits} />
 * ```
 */
