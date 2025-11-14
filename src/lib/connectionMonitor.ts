/**
 * ConnectionMonitorService
 * 
 * Servicio para monitorear el estado de conectividad de la aplicación.
 * Implementa detección inteligente con debounce, reintentos y validación de servidor.
 * 
 * Características:
 * - Verificación de conexión con ping a Supabase cada 30 segundos
 * - Exponential backoff para reintentos (1s, 2s, 4s, 8s, 16s, 30s max)
 * - Debounce de 5 segundos para evitar parpadeos
 * - 3 fallos consecutivos antes de entrar en modo offline
 * - Validación de servidor antes de salir del modo offline
 * - 2 reintentos automáticos para requests fallidos
 */

export interface ConnectionStatus {
  isOnline: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  nextCheckIn: number; // milisegundos
}

type ConnectionCallback = (isOnline: boolean) => void;

// Delays para exponential backoff (en milisegundos)
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];
const MAX_RETRIES = 2; // Reintentar 2 veces antes de fallar
const MAX_CONSECUTIVE_FAILURES = 3; // 3 fallos consecutivos para entrar en offline
const DEBOUNCE_DELAY = 5000; // 5 segundos de debounce
const CHECK_INTERVAL = 30000; // 30 segundos entre verificaciones

class ConnectionMonitorService {
  private isOnline: boolean = navigator.onLine;
  private consecutiveFailures: number = 0;
  private lastCheck: Date = new Date();
  private callback: ConnectionCallback | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private offlineDebounceTimer: NodeJS.Timeout | null = null;
  private onlineDebounceTimer: NodeJS.Timeout | null = null;

  /**
   * Inicia el monitoreo de conexión
   * @param callback Función a llamar cuando cambia el estado de conexión
   */
  start(callback: ConnectionCallback): void {
    this.callback = callback;
    
    // Escuchar eventos del navegador
    window.addEventListener('online', this.handleOnlineEvent);
    window.addEventListener('offline', this.handleOfflineEvent);
    
    // Verificar conexión inicial
    this.checkConnection();
    
    // Iniciar verificaciones periódicas
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, CHECK_INTERVAL);
  }

  /**
   * Detiene el monitoreo de conexión
   */
  stop(): void {
    window.removeEventListener('online', this.handleOnlineEvent);
    window.removeEventListener('offline', this.handleOfflineEvent);
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.offlineDebounceTimer) {
      clearTimeout(this.offlineDebounceTimer);
      this.offlineDebounceTimer = null;
    }
    
    if (this.onlineDebounceTimer) {
      clearTimeout(this.onlineDebounceTimer);
      this.onlineDebounceTimer = null;
    }
    
    this.callback = null;
  }

  /**
   * Verifica la conexión inmediatamente
   * @returns true si hay conexión, false si no
   */
  async check(): Promise<boolean> {
    return await this.detectConnection();
  }

  /**
   * Obtiene el estado actual de conexión
   */
  getStatus(): ConnectionStatus {
    return {
      isOnline: this.isOnline,
      lastCheck: this.lastCheck,
      consecutiveFailures: this.consecutiveFailures,
      nextCheckIn: this.checkInterval ? CHECK_INTERVAL : 0
    };
  }

  /**
   * Maneja el evento 'offline' del navegador
   */
  private handleOfflineEvent = (): void => {
    // Cancelar timer de online si existe
    if (this.onlineDebounceTimer) {
      clearTimeout(this.onlineDebounceTimer);
      this.onlineDebounceTimer = null;
    }
    
    // No entrar en modo offline inmediatamente (debounce de 5s)
    this.offlineDebounceTimer = setTimeout(() => {
      this.enterOfflineMode();
    }, DEBOUNCE_DELAY);
  };

  /**
   * Maneja el evento 'online' del navegador
   */
  private handleOnlineEvent = (): void => {
    // Cancelar timer de offline si existe
    if (this.offlineDebounceTimer) {
      clearTimeout(this.offlineDebounceTimer);
      this.offlineDebounceTimer = null;
    }
    
    // Validar conectividad real con servidor antes de confirmar
    this.onlineDebounceTimer = setTimeout(async () => {
      const isConnected = await this.validateServerConnectivity();
      if (isConnected) {
        this.exitOfflineMode();
      }
    }, 1000); // Pequeño delay para evitar checks innecesarios
  };

  /**
   * Verifica la conexión periódicamente
   */
  private async checkConnection(): Promise<void> {
    const isConnected = await this.detectConnection();
    
    if (isConnected) {
      // Conexión exitosa - resetear contador de fallos
      if (this.consecutiveFailures > 0) {
        this.consecutiveFailures = 0;
      }
      
      // Si estábamos offline, salir del modo offline
      if (!this.isOnline) {
        this.exitOfflineMode();
      }
    } else {
      // Fallo de conexión - incrementar contador
      this.consecutiveFailures++;
      
      // Si alcanzamos 3 fallos consecutivos, entrar en modo offline
      if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && this.isOnline) {
        this.enterOfflineMode();
      }
    }
  }

  /**
   * Detecta si hay conexión real al servidor
   * @returns true si hay conexión, false si no
   */
  private async detectConnection(): Promise<boolean> {
    // Si el navegador dice que no hay conexión, no hay conexión
    if (!navigator.onLine) {
      return false;
    }
    
    try {
      // Ping a Supabase con timeout de 5 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/`,
        {
          method: 'HEAD',
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      this.lastCheck = new Date();
      
      // Considerar conectado si el servidor responde (incluso con 401)
      // Un 401 significa que el servidor está disponible, solo falta autenticación
      // Solo considerar offline si hay error de red (timeout, DNS, etc.)
      return true;
    } catch (error) {
      this.lastCheck = new Date();
      // Solo aquí hay un problema real de conectividad
      return false;
    }
  }

  /**
   * Valida la conectividad con el servidor con reintentos
   * Requiere 3 fallos consecutivos para confirmar que no hay conexión
   * @returns true si hay conexión, false si no
   */
  private async validateServerConnectivity(): Promise<boolean> {
    let failures = 0;
    
    while (failures < MAX_CONSECUTIVE_FAILURES) {
      const isConnected = await this.detectConnection();
      
      if (isConnected) {
        return true; // Servidor responde correctamente
      }
      
      failures++;
      
      if (failures < MAX_CONSECUTIVE_FAILURES) {
        // Esperar antes del siguiente intento (exponential backoff)
        await this.delay(this.getNextDelay(failures));
      }
    }
    
    return false; // 3 fallos consecutivos = offline
  }

  /**
   * Entra en modo offline
   */
  private enterOfflineMode(): void {
    if (!this.isOnline) return; // Ya estamos offline
    
    this.isOnline = false;
    
    if (this.callback) {
      this.callback(false);
    }
  }

  /**
   * Sale del modo offline
   */
  private exitOfflineMode(): void {
    if (this.isOnline) return; // Ya estamos online
    
    this.isOnline = true;
    this.consecutiveFailures = 0;
    
    if (this.callback) {
      this.callback(true);
    }
  }

  /**
   * Calcula el delay para el siguiente reintento (exponential backoff con jitter)
   * @param failureCount Número de fallos consecutivos
   * @returns Delay en milisegundos
   */
  private getNextDelay(failureCount: number): number {
    const baseDelay = RETRY_DELAYS[Math.min(failureCount, RETRY_DELAYS.length - 1)];
    const jitter = Math.random() * 1000; // 0-1s de variación
    return baseDelay + jitter;
  }

  /**
   * Utility para esperar un tiempo determinado
   * @param ms Milisegundos a esperar
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ejecuta un request con reintentos automáticos
   * @param requestFn Función que ejecuta el request
   * @param maxRetries Número máximo de reintentos (default: 2)
   * @returns Resultado del request
   */
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Esperar antes del siguiente intento
          await this.delay(this.getNextDelay(attempt));
        }
      }
    }
    
    // Falló después de todos los reintentos
    throw lastError || new Error('Request failed after retries');
  }
}

// Exportar instancia singleton
export const connectionMonitor = new ConnectionMonitorService();
