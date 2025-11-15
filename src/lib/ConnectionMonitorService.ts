/**
 * Servicio de monitoreo de conexión
 * Detecta cambios de conectividad y notifica a los suscriptores
 * 
 * Características:
 * - Debounce de 5s para evitar parpadeos
 * - Validación de servidor antes de confirmar online
 * - 3 fallos consecutivos para entrar en modo offline
 * - Singleton pattern
 */

interface ConnectionStatus {
  isOnline: boolean;
  consecutiveFailures: number;
  lastCheck: Date | null;
}

type ConnectionCallback = (isOnline: boolean) => void;

class ConnectionMonitorService {
  private static instance: ConnectionMonitorService | null = null;
  
  private isOnline: boolean = navigator.onLine;
  private consecutiveFailures: number = 0;
  private lastCheck: Date | null = null;
  private callbacks: Set<ConnectionCallback> = new Set();
  
  private offlineTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 5000; // 5 segundos
  private readonly MAX_FAILURES = 3; // 3 fallos consecutivos
  
  private isMonitoring: boolean = false;

  private constructor() {
    // Constructor privado para singleton
  }

  /**
   * Obtiene la instancia única del servicio
   */
  public static getInstance(): ConnectionMonitorService {
    if (!ConnectionMonitorService.instance) {
      ConnectionMonitorService.instance = new ConnectionMonitorService();
    }
    return ConnectionMonitorService.instance;
  }

  /**
   * Inicia el monitoreo de conexión
   * @param callback Función a llamar cuando cambie el estado de conexión
   */
  public start(callback: ConnectionCallback): void {
    // Agregar callback
    this.callbacks.add(callback);

    // Si ya está monitoreando, no iniciar de nuevo
    if (this.isMonitoring) {
      console.log('[ConnectionMonitor] Ya está monitoreando, callback agregado');
      // Notificar estado actual al nuevo callback
      callback(this.isOnline);
      return;
    }

    console.log('[ConnectionMonitor] Iniciando monitoreo...');
    this.isMonitoring = true;

    // Escuchar eventos nativos del navegador
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Verificar estado inicial
    this.checkServerConnection().then((isConnected) => {
      this.updateStatus(isConnected);
    });
  }

  /**
   * Detiene el monitoreo de conexión
   */
  public stop(): void {
    console.log('[ConnectionMonitor] Deteniendo monitoreo...');
    
    // Limpiar listeners
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    // Limpiar timer
    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
      this.offlineTimer = null;
    }
    
    // Limpiar callbacks
    this.callbacks.clear();
    
    this.isMonitoring = false;
  }

  /**
   * Verifica la conexión manualmente
   */
  public async check(): Promise<boolean> {
    const isConnected = await this.checkServerConnection();
    this.updateStatus(isConnected);
    return isConnected;
  }

  /**
   * Obtiene el estado actual de conexión
   */
  public getStatus(): ConnectionStatus {
    return {
      isOnline: this.isOnline,
      consecutiveFailures: this.consecutiveFailures,
      lastCheck: this.lastCheck,
    };
  }

  /**
   * Handler para evento 'online' del navegador
   */
  private handleOnline = (): void => {
    console.log('[ConnectionMonitor] Evento online detectado');
    
    // Limpiar timer de debounce si existe
    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
      this.offlineTimer = null;
    }

    // Verificar con el servidor antes de confirmar
    this.checkServerConnection().then((isConnected) => {
      if (isConnected) {
        this.updateStatus(true);
      }
    });
  };

  /**
   * Handler para evento 'offline' del navegador
   */
  private handleOffline = (): void => {
    console.log('[ConnectionMonitor] Evento offline detectado');
    
    // Aplicar debounce de 5s (Requisito 2.1)
    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
    }

    this.offlineTimer = setTimeout(() => {
      this.updateStatus(false);
    }, this.DEBOUNCE_DELAY);
  };

  /**
   * Verifica la conexión con el servidor
   * Hace ping a un recurso ligero para verificar conectividad
   */
  private async checkServerConnection(): Promise<boolean> {
    try {
      // Intentar hacer un request ligero
      // Usamos un favicon o recurso estático para minimizar carga
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(window.location.origin + '/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      const isConnected = response.ok || response.status === 304; // 304 = Not Modified (cached)
      
      // Actualizar contadores de fallos
      if (isConnected) {
        this.consecutiveFailures = 0;
      } else {
        this.consecutiveFailures++;
      }

      this.lastCheck = new Date();
      
      // Solo considerar offline después de 3 fallos consecutivos (Requisito 2.2)
      return this.consecutiveFailures < this.MAX_FAILURES;
      
    } catch (error) {
      console.warn('[ConnectionMonitor] Error verificando servidor:', error);
      this.consecutiveFailures++;
      this.lastCheck = new Date();
      
      // Solo considerar offline después de 3 fallos consecutivos
      return this.consecutiveFailures < this.MAX_FAILURES;
    }
  }

  /**
   * Actualiza el estado de conexión y notifica a los callbacks
   */
  private updateStatus(isOnline: boolean): void {
    const previousStatus = this.isOnline;
    this.isOnline = isOnline;

    // Solo notificar si cambió el estado
    if (previousStatus !== isOnline) {
      console.log(`[ConnectionMonitor] Estado cambió: ${previousStatus ? 'online' : 'offline'} -> ${isOnline ? 'online' : 'offline'}`);
      
      // Notificar a todos los callbacks
      this.callbacks.forEach((callback) => {
        try {
          callback(isOnline);
        } catch (error) {
          console.error('[ConnectionMonitor] Error en callback:', error);
        }
      });
    }
  }
}

// Exportar instancia singleton
export const connectionMonitor = ConnectionMonitorService.getInstance();
