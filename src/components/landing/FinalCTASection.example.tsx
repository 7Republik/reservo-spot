import { FinalCTASection } from './FinalCTASection';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const FinalCTASectionExample = () => {
  const navigate = useNavigate();

  const handlePrimaryClick = () => {
    // Navegar a la página de registro/demo
    navigate('/auth');
    toast.success('Redirigiendo a la demo...');
  };

  const handleSecondaryClick = () => {
    // Abrir modal de contacto o navegar a página de contacto
    toast.info('Abriendo formulario de contacto...');
    // O usar: window.location.href = 'mailto:info@reserveo.app';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ejemplo con datos del landingContent */}
      <FinalCTASection
        headline="Transforma la Gestión de tu Aparcamiento Hoy"
        subheadline="Únete a las empresas que ya optimizaron su parking con RESERVEO"
        onPrimaryClick={handlePrimaryClick}
        onSecondaryClick={handleSecondaryClick}
      />

      {/* Ejemplo con texto personalizado */}
      <FinalCTASection
        headline="¿Listo para Empezar?"
        subheadline="Prueba RESERVEO gratis durante 30 días"
        onPrimaryClick={handlePrimaryClick}
        onSecondaryClick={handleSecondaryClick}
      />

      {/* Ejemplo sin subheadline */}
      <FinalCTASection
        headline="Comienza Hoy Mismo"
        onPrimaryClick={handlePrimaryClick}
        onSecondaryClick={handleSecondaryClick}
      />
    </div>
  );
};
