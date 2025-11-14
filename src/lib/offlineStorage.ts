/**
 * OfflineStorageService - Gestión de cache local con IndexedDB
 * 
 * Proporciona almacenamiento local para datos de la aplicación cuando está offline.
 * Implementa TTL (Time To Live), límites de tamaño y limpieza automática.
 */

// Constantes de configuración
const DB_NAME = 'reserveo_offline_cache';
const DB_VERSION = 1;
const CACHED_DATA_STORE = 'cached_data';
const SYNC_METADATA_STORE = 'sync_metadata';

// Límites de almacenamiento
export const STORAGE_LIMITS = {
  USER_DATA: 10 * 1024 * 1024,      // 10 MB
  ADMIN_DATA: 5 * 1024 * 1024,      // 5 MB
  TOTAL: 15 * 1024 * 1024,          // 15 MB
  WARNING_THRESHOLD: 0.8,            // 80% del límite
};

// TTL por defecto: 7 días
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * Estructura de datos cacheados
 */
export interface CachedData {
  key: string;              // Identificador único
  data: any;                // Datos serializados
  timestamp: number;        // Timestamp de guardado
  expiresAt: number;        // Timestamp de expiración
  dataType: string;         // Tipo de datos (reservations, spots, plates, etc)
  userId: string;           // Usuario propietario
  metadata?: Record<string, any>; // Metadatos adicionales
}

/**
 * Metadatos de sincronización
 */
export interface SyncMetadata {
  key: string;              // Identificador único
  lastSync: number;         // Última sincronización exitosa
  syncCount: number;        // Contador de sincronizaciones
}

/**
 * Opciones para guardar en cache
 */
export interface CacheOptions {
  ttl?: number;             // Time to live en milisegundos
  dataType?: string;        // Tipo de datos
  userId?: string;          // Usuario propietario
  metadata?: Record<string, any>;
}

/**
 * Servicio de almacenamiento offline con IndexedDB
 */
export class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Inicializa la base de datos IndexedDB
   */
  async init(): Promise<void> {
    // Si ya está inicializando, esperar a que termine
    if (this.initPromise) {
      return this.initPromise;
    }

    // Si ya está inicializado, no hacer nada
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Object Store para datos cacheados
        if (!db.objectStoreNames.contains(CACHED_DATA_STORE)) {
          const cachedDataStore = db.createObjectStore(CACHED_DATA_STORE, { 
            keyPath: 'key' 
          });
          
          // Índices para búsquedas eficientes
          cachedDataStore.createIndex('dataType', 'dataType', { unique: false });
          cachedDataStore.createIndex('userId', 'userId', { unique: false });
          cachedDataStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Object Store para metadatos de sincronización
        if (!db.objectStoreNames.contains(SYNC_METADATA_STORE)) {
          db.createObjectStore(SYNC_METADATA_STORE, { 
            keyPath: 'key' 
          });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Asegura que la base de datos esté inicializada
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  /**
   * Guarda datos en el cache
   */
  async set(key: string, data: any, options: CacheOptions = {}): Promise<void> {
    await this.ensureInitialized();

    const ttl = options.ttl || DEFAULT_TTL;
    const now = Date.now();

    const cachedData: CachedData = {
      key,
      data,
      timestamp: now,
      expiresAt: now + ttl,
      dataType: options.dataType || 'unknown',
      userId: options.userId || 'unknown',
      metadata: options.metadata,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHED_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(CACHED_DATA_STORE);
      const request = store.put(cachedData);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Error saving to cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Obtiene datos del cache
   */
  async get<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHED_DATA_STORE], 'readonly');
      const store = transaction.objectStore(CACHED_DATA_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const cachedData = request.result as CachedData | undefined;

        if (!cachedData) {
          resolve(null);
          return;
        }

        // Verificar si ha expirado
        if (Date.now() > cachedData.expiresAt) {
          // Eliminar dato expirado
          this.delete(key).catch(console.error);
          resolve(null);
          return;
        }

        resolve(cachedData.data as T);
      };

      request.onerror = () => {
        console.error('Error reading from cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Verifica si existe una entrada en el cache y no ha expirado
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Elimina una entrada específica del cache
   */
  async delete(key: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHED_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(CACHED_DATA_STORE);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Error deleting from cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Limpia entradas expiradas del cache
   */
  async cleanup(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHED_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(CACHED_DATA_STORE);
      const index = store.index('expiresAt');
      const now = Date.now();

      // Obtener todas las entradas expiradas
      const request = index.openCursor(IDBKeyRange.upperBound(now));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Error cleaning up cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Limpia todo el cache
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [CACHED_DATA_STORE, SYNC_METADATA_STORE], 
        'readwrite'
      );

      const cachedDataStore = transaction.objectStore(CACHED_DATA_STORE);
      const syncMetadataStore = transaction.objectStore(SYNC_METADATA_STORE);

      const clearCachedData = cachedDataStore.clear();
      const clearSyncMetadata = syncMetadataStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('Error clearing cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Obtiene el tamaño total del cache en bytes (aproximado)
   */
  async getSize(): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHED_DATA_STORE], 'readonly');
      const store = transaction.objectStore(CACHED_DATA_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const allData = request.result as CachedData[];
        
        // Calcular tamaño aproximado serializando los datos
        let totalSize = 0;
        for (const item of allData) {
          try {
            const serialized = JSON.stringify(item);
            totalSize += new Blob([serialized]).size;
          } catch (error) {
            console.error('Error calculating size for item:', item.key, error);
          }
        }

        resolve(totalSize);
      };

      request.onerror = () => {
        console.error('Error calculating cache size:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Registra una sincronización exitosa
   */
  async recordSync(key: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_METADATA_STORE);
      
      // Primero intentar obtener el registro existente
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        const existing = getRequest.result as SyncMetadata | undefined;
        
        const syncMetadata: SyncMetadata = {
          key,
          lastSync: Date.now(),
          syncCount: existing ? existing.syncCount + 1 : 1,
        };

        const putRequest = store.put(syncMetadata);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => {
          console.error('Error recording sync:', putRequest.error);
          reject(putRequest.error);
        };
      };

      getRequest.onerror = () => {
        console.error('Error reading sync metadata:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * Obtiene la última sincronización exitosa
   */
  async getLastSync(key: string): Promise<Date | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_METADATA_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_METADATA_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const metadata = request.result as SyncMetadata | undefined;
        resolve(metadata ? new Date(metadata.lastSync) : null);
      };

      request.onerror = () => {
        console.error('Error reading last sync:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Limpia entradas antiguas cuando se alcanza el límite de almacenamiento (FIFO)
   */
  async enforceStorageLimit(limit: number): Promise<void> {
    await this.ensureInitialized();

    const currentSize = await this.getSize();

    if (currentSize <= limit) {
      return; // No se ha alcanzado el límite
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHED_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(CACHED_DATA_STORE);
      const request = store.openCursor();

      let deletedSize = 0;
      const targetSize = currentSize - limit;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor && deletedSize < targetSize) {
          const item = cursor.value as CachedData;
          
          try {
            const serialized = JSON.stringify(item);
            const itemSize = new Blob([serialized]).size;
            
            cursor.delete();
            deletedSize += itemSize;
            cursor.continue();
          } catch (error) {
            console.error('Error deleting item:', error);
            cursor.continue();
          }
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Error enforcing storage limit:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Cierra la conexión a la base de datos
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Instancia singleton del servicio
let instance: OfflineStorageService | null = null;

/**
 * Obtiene la instancia singleton del servicio de almacenamiento offline
 */
export const getOfflineStorage = (): OfflineStorageService => {
  if (!instance) {
    instance = new OfflineStorageService();
  }
  return instance;
};
