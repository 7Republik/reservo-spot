/**
 * Monitor de calidad de conexión
 * Detecta conexiones lentas y adapta los efectos visuales
 */

type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

interface ConnectionInfo {
  effectiveType: ConnectionType;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Obtiene información de la conexión actual
 */
export const getConnectionInfo = (): ConnectionInfo => {
  // @ts-ignore - navigator.connection no está en todos los tipos
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) {
    return {
      effectiveType: 'unknown',
      saveData: false
    };
  }

  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData || false
  };
};

/**
 * Verifica si la conexión es lenta
 */
export const isSlowConnection = (): boolean => {
  const { effectiveType, saveData } = getConnectionInfo();
  
  // Si el usuario tiene "Save Data" activado, considerar conexión lenta
  if (saveData) return true;
  
  // Conexiones 2g y slow-2g son lentas
  const slowConnections: ConnectionType[] = ['slow-2g', '2g'];
  return slowConnections.includes(effectiveType);
};

/**
 * Aplica clase .reduce-effects al documentElement si la conexión es lenta
 */
export const applyConnectionBasedEffects = (): void => {
  const root = document.documentElement;
  
  if (isSlowConnection()) {
    root.classList.add('reduce-effects');
    console.info('🐌 Conexión lenta detectada. Efectos visuales reducidos.');
  } else {
    root.classList.remove('reduce-effects');
  }
};

/**
 * Monitorea cambios en la conexión y actualiza efectos
 */
export const monitorConnection = (): (() => void) => {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) {
    console.warn('Network Information API no soportada');
    return () => {}; // No-op cleanup
  }

  // Aplicar efectos iniciales
  applyConnectionBasedEffects();

  // Escuchar cambios en la conexión
  const handleChange = () => {
    applyConnectionBasedEffects();
  };

  connection.addEventListener('change', handleChange);

  // Retornar función de cleanup
  return () => {
    connection.removeEventListener('change', handleChange);
  };
};

/**
 * Inicializa el monitor de conexión
 * Debe llamarse una vez al inicio de la aplicación
 */
export const initConnectionMonitor = (): void => {
  // Aplicar efectos basados en conexión inicial
  applyConnectionBasedEffects();
  
  // Monitorear cambios
  monitorConnection();
  
  // También monitorear cambios en prefers-reduced-motion
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleMotionChange = () => {
    if (motionQuery.matches) {
      document.documentElement.classList.add('reduce-effects');
    } else if (!isSlowConnection()) {
      document.documentElement.classList.remove('reduce-effects');
    }
  };
  
  motionQuery.addEventListener('change', handleMotionChange);
};

/**
 * Obtiene configuración de efectos basada en la conexión
 */
export const getEffectsConfig = () => {
  const isSlow = isSlowConnection();
  
  return {
    enableBackdropFilter: !isSlow,
    enableGradients: !isSlow,
    enableAnimations: !isSlow,
    enableComplexEffects: !isSlow,
    simplifyUI: isSlow
  };
};

/**
 * Verifica si se deben usar efectos reducidos
 */
export const shouldReduceEffects = (): boolean => {
  // Verificar preferencia de movimiento reducido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Verificar conexión lenta
  const slowConnection = isSlowConnection();
  
  // Verificar si ya está aplicada la clase
  const hasReduceEffectsClass = document.documentElement.classList.contains('reduce-effects');
  
  return prefersReducedMotion || slowConnection || hasReduceEffectsClass;
};
