import { useState, useEffect } from 'react';
import { isSlowConnection, getConnectionInfo, getEffectsConfig } from '@/lib/connectionMonitor';

/**
 * Hook React para monitorear la calidad de la conexión
 * Retorna información sobre si se debe reducir efectos visuales
 */
export const useConnectionMonitor = () => {
  const [isSlowConn, setIsSlowConn] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo());

  useEffect(() => {
    // Verificar conexión inicial
    setIsSlowConn(isSlowConnection());
    setConnectionInfo(getConnectionInfo());

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return; // No hay soporte, usar valores iniciales
    }

    const handleChange = () => {
      setIsSlowConn(isSlowConnection());
      setConnectionInfo(getConnectionInfo());
    };
    
    connection.addEventListener('change', handleChange);
    
    return () => {
      connection.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    isSlowConnection: isSlowConn,
    connectionInfo,
    effectsConfig: getEffectsConfig()
  };
};
