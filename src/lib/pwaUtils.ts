/**
 * PWA Utilities
 * 
 * Funciones helper para detectar y gestionar el estado de PWA
 */

/**
 * Detecta si la app está corriendo como PWA instalada
 */
export const isPWA = (): boolean => {
  // Método 1: Display mode standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Método 2: iOS Safari
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // Método 3: Android TWA (Trusted Web Activity)
  const isAndroidTWA = document.referrer.includes('android-app://');
  
  return isStandalone || isIOSStandalone || isAndroidTWA;
};

/**
 * Detecta si el dispositivo es móvil
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detecta si es iOS
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Detecta si es Android
 */
export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

/**
 * Verifica si la PWA puede ser instalada
 */
export const canInstallPWA = (): boolean => {
  return 'serviceWorker' in navigator && !isPWA();
};

/**
 * Obtiene información del estado de la PWA
 */
export const getPWAInfo = () => {
  return {
    isPWA: isPWA(),
    isMobile: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    canInstall: canInstallPWA(),
    displayMode: window.matchMedia('(display-mode: standalone)').matches
      ? 'standalone'
      : 'browser',
  };
};

/**
 * Log de información de PWA (útil para debugging)
 */
export const logPWAInfo = () => {
  const info = getPWAInfo();
  console.log('[PWA Info]', {
    'Running as PWA': info.isPWA,
    'Mobile Device': info.isMobile,
    'iOS': info.isIOS,
    'Android': info.isAndroid,
    'Can Install': info.canInstall,
    'Display Mode': info.displayMode,
    'User Agent': navigator.userAgent,
  });
};
