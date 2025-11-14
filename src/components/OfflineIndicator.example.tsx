/**
 * Ejemplo de uso del componente OfflineIndicator
 * 
 * Este archivo muestra cómo integrar el indicador de estado offline
 * en diferentes partes de la aplicación.
 */

import { OfflineIndicator } from './OfflineIndicator';

// ============================================
// Ejemplo 1: Uso básico (configuración por defecto)
// ============================================
export const BasicExample = () => {
  return (
    <div>
      {/* El indicador se mostrará automáticamente cuando se pierda la conexión */}
      <OfflineIndicator />
      
      {/* Resto de tu aplicación */}
      <main>
        <h1>Mi Aplicación</h1>
      </main>
    </div>
  );
};

// ============================================
// Ejemplo 2: Posicionado en la parte inferior
// ============================================
export const BottomPositionExample = () => {
  return (
    <div>
      <main>
        <h1>Mi Aplicación</h1>
      </main>
      
      {/* Indicador en la parte inferior */}
      <OfflineIndicator position="bottom" />
    </div>
  );
};

// ============================================
// Ejemplo 3: Sin auto-ocultación
// ============================================
export const NoAutoHideExample = () => {
  return (
    <div>
      {/* El indicador permanecerá visible incluso cuando vuelva la conexión */}
      <OfflineIndicator autoHide={false} />
      
      <main>
        <h1>Mi Aplicación</h1>
      </main>
    </div>
  );
};

// ============================================
// Ejemplo 4: Auto-ocultación personalizada
// ============================================
export const CustomAutoHideExample = () => {
  return (
    <div>
      {/* Se ocultará después de 5 segundos (5000ms) cuando vuelva la conexión */}
      <OfflineIndicator autoHideDelay={5000} />
      
      <main>
        <h1>Mi Aplicación</h1>
      </main>
    </div>
  );
};

// ============================================
// Ejemplo 5: Sin panel de detalles
// ============================================
export const NoDetailsExample = () => {
  return (
    <div>
      {/* Sin botón de expandir detalles */}
      <OfflineIndicator showDetails={false} />
      
      <main>
        <h1>Mi Aplicación</h1>
      </main>
    </div>
  );
};

// ============================================
// Ejemplo 6: Integración en Layout Principal (RECOMENDADO)
// ============================================
export const LayoutIntegrationExample = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Indicador global en la parte superior */}
      <OfflineIndicator />
      
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1>RESERVEO</h1>
        </div>
      </header>
      
      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Tu contenido aquí */}
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground">© 2025 RESERVEO</p>
        </div>
      </footer>
    </div>
  );
};

// ============================================
// Ejemplo 7: Configuración completa personalizada
// ============================================
export const FullCustomExample = () => {
  return (
    <div>
      <OfflineIndicator
        position="top"           // Posición: 'top' o 'bottom'
        autoHide={true}          // Auto-ocultar cuando vuelve conexión
        autoHideDelay={3000}     // Delay de 3 segundos
        showDetails={true}       // Mostrar botón de detalles
      />
      
      <main>
        <h1>Mi Aplicación</h1>
      </main>
    </div>
  );
};

// ============================================
// Notas de Implementación
// ============================================

/**
 * CARACTERÍSTICAS DEL COMPONENTE:
 * 
 * 1. Detección Automática:
 *    - Se muestra automáticamente cuando se pierde la conexión
 *    - Se oculta automáticamente cuando vuelve la conexión (configurable)
 * 
 * 2. Estados Visuales:
 *    - Offline: Barra roja con icono WifiOff pulsante
 *    - Online: Barra verde con icono Wifi
 * 
 * 3. Animaciones:
 *    - Transiciones suaves entre estados (300ms)
 *    - Respeta prefers-reduced-motion
 *    - Animación de entrada/salida fluida
 * 
 * 4. Panel de Detalles:
 *    - Expandible con botón
 *    - Muestra última sincronización
 *    - Lista funcionalidad disponible/no disponible
 *    - Nota informativa cuando offline
 * 
 * 5. Accesibilidad:
 *    - Botones con aria-label
 *    - Focus visible con ring
 *    - Navegación por teclado
 * 
 * 6. Responsive:
 *    - Grid adaptativo en panel de detalles
 *    - Container con max-width
 *    - Padding responsive
 * 
 * INTEGRACIÓN RECOMENDADA:
 * 
 * Añadir el componente en el layout principal de tu aplicación
 * (App.tsx, Layout.tsx, o componente raíz) para que esté
 * disponible en todas las páginas.
 * 
 * Ejemplo en App.tsx:
 * 
 * import { OfflineIndicator } from '@/components/OfflineIndicator';
 * 
 * function App() {
 *   return (
 *     <>
 *       <OfflineIndicator />
 *       <Router>
 *         // ... tus rutas
 *       </Router>
 *     </>
 *   );
 * }
 */
