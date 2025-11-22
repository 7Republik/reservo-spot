/**
 * OfflineCache - Servicio de almacenamiento offline con fallback
 * 
 * Características:
 * - IndexedDB como almacenamiento principal
 * - Fallback a Map en memoria para modo incógnito
 * - Limpieza automática cuando alcanza 10MB
 * - Gestión de datos antiguos (TTL de 7 días)
 * - Compresión de datos con LZ-string
 * - Estrategia LRU (Least Recently Used) para limpieza
 * 
 * Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5
 * Soluciona: Problema 3 (IndexedDB lleno), Problema 7 (Modo incógnito)
 */

import LZString from 'lz-string';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  lastAccessed: number; // Para estrategia LRU
  compressed?: boolean; // Indica si los datos están comprimidos
}

class OfflineCache {
  private dbName = 'reserveo_offline';
  private storeName = 'cache';
  private version = 1;
  private db: IDBDatabase | null = null;
  private fallbackMap: Map<string, CacheEntry> = new Map();
  private useFallback = false;
  private maxSize = 10 * 1024 * 1024; // 10 MB
  private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

  /**
   * Inicializa el servicio de cache
   * Intenta usar IndexedDB, si falla usa Map como fallback
   */
  async init(): Promise<void> {
    try {
      // Verificar si IndexedDB está disponible
      if (!window.indexedDB) {
        console.warn('IndexedDB no disponible, usando fallback a Map');
        this.useFallback = true;
        return;
      }

      await this.initIndexedDB();
    } catch (error) {
      console.warn('Error al inicializar IndexedDB, usando fallback a Map:', error);
      this.useFallback = true;
    }
  }

  /**
   * Inicializa IndexedDB
   */
  private initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          reject(new Error('Error al abrir IndexedDB'));
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Crear object store si no existe
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Comprime datos usando LZ-string
   */
  private compressData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return LZString.compress(jsonString);
    } catch (error) {
      console.error('Error al comprimir datos:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * Descomprime datos usando LZ-string
   */
  private decompressData(compressed: string): any {
    try {
      const decompressed = LZString.decompress(compressed);
      return decompressed ? JSON.parse(decompressed) : null;
    } catch (error) {
      console.error('Error al descomprimir datos:', error);
      return null;
    }
  }

  /**
   * Guarda datos en el cache con timestamp y compresión opcional
   */
  async set<T>(key: string, data: T): Promise<boolean> {
    try {
      // Estimar tamaño sin comprimir
      const uncompressedSize = this.estimateSize(data);
      const shouldCompress = uncompressedSize > 1024; // Comprimir si es mayor a 1KB

      let entryData: any = data;
      let compressed = false;

      // Comprimir si es necesario
      if (shouldCompress) {
        entryData = this.compressData(data);
        compressed = true;
      }

      const entry: CacheEntry = {
        data: entryData,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        compressed
      };

      // Verificar tamaño antes de guardar
      const dataSize = this.estimateSize(entry);
      const currentSize = await this.getSize();

      if (currentSize + dataSize > this.maxSize) {
        console.warn('Cache casi lleno, aplicando estrategia LRU...');
        await this.evictLRU();
      }

      if (this.useFallback) {
        this.fallbackMap.set(key, entry);
        return true;
      }

      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(entry, key);

          request.onsuccess = () => resolve(true);
          request.onerror = () => {
            console.error('Error al guardar en cache:', request.error);
            resolve(false);
          };
        } catch (error) {
          console.error('Error en set:', error);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error al guardar en cache:', error);
      return false;
    }
  }

  /**
   * Obtiene datos del cache y actualiza el timestamp de último acceso
   * Retorna null si no existe o si los datos son muy antiguos
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useFallback) {
        const entry = this.fallbackMap.get(key);
        if (!entry) return null;

        // Verificar antigüedad
        if (Date.now() - entry.timestamp > this.maxAge) {
          this.fallbackMap.delete(key);
          return null;
        }

        // Actualizar último acceso (LRU)
        entry.lastAccessed = Date.now();

        // Descomprimir si es necesario
        if (entry.compressed) {
          return this.decompressData(entry.data) as T;
        }

        return entry.data as T;
      }

      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const getRequest = store.get(key);

          getRequest.onsuccess = () => {
            const entry = getRequest.result as CacheEntry | undefined;
            
            if (!entry) {
              resolve(null);
              return;
            }

            // Verificar antigüedad
            if (Date.now() - entry.timestamp > this.maxAge) {
              // Eliminar datos antiguos
              this.remove(key);
              resolve(null);
              return;
            }

            // Actualizar último acceso (LRU)
            entry.lastAccessed = Date.now();
            store.put(entry, key);

            // Descomprimir si es necesario
            if (entry.compressed) {
              resolve(this.decompressData(entry.data) as T);
            } else {
              resolve(entry.data as T);
            }
          };

          getRequest.onerror = () => {
            console.error('Error al leer del cache:', getRequest.error);
            resolve(null);
          };
        } catch (error) {
          console.error('Error en get:', error);
          resolve(null);
        }
      });
    } catch (error) {
      console.error('Error al obtener del cache:', error);
      return null;
    }
  }

  /**
   * Elimina una entrada específica del cache
   */
  async remove(key: string): Promise<void> {
    try {
      if (this.useFallback) {
        this.fallbackMap.delete(key);
        return;
      }

      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.delete(key);

          request.onsuccess = () => resolve();
          request.onerror = () => {
            console.error('Error al eliminar del cache:', request.error);
            resolve();
          };
        } catch (error) {
          console.error('Error en remove:', error);
          resolve();
        }
      });
    } catch (error) {
      console.error('Error al eliminar del cache:', error);
    }
  }

  /**
   * Limpia todo el cache
   */
  async clear(): Promise<void> {
    try {
      if (this.useFallback) {
        this.fallbackMap.clear();
        return;
      }

      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => {
            console.error('Error al limpiar cache:', request.error);
            resolve();
          };
        } catch (error) {
          console.error('Error en clear:', error);
          resolve();
        }
      });
    } catch (error) {
      console.error('Error al limpiar cache:', error);
    }
  }

  /**
   * Estima el tamaño del cache en bytes
   */
  async getSize(): Promise<number> {
    try {
      if (this.useFallback) {
        let totalSize = 0;
        this.fallbackMap.forEach((entry) => {
          totalSize += this.estimateSize(entry);
        });
        return totalSize;
      }

      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.getAllKeys();

          request.onsuccess = async () => {
            let totalSize = 0;
            const keys = request.result;

            for (const key of keys) {
              const data = await this.get(key as string);
              if (data) {
                totalSize += this.estimateSize({ data, timestamp: Date.now() });
              }
            }

            resolve(totalSize);
          };

          request.onerror = () => {
            console.error('Error al calcular tamaño:', request.error);
            resolve(0);
          };
        } catch (error) {
          console.error('Error en getSize:', error);
          resolve(0);
        }
      });
    } catch (error) {
      console.error('Error al obtener tamaño del cache:', error);
      return 0;
    }
  }

  /**
   * Elimina entradas usando estrategia LRU (Least Recently Used)
   * Elimina el 20% de las entradas menos usadas recientemente
   */
  async evictLRU(): Promise<void> {
    try {
      if (this.useFallback) {
        // Convertir Map a array y ordenar por lastAccessed
        const entries = Array.from(this.fallbackMap.entries());
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        // Eliminar el 20% menos usado
        const toDelete = Math.ceil(entries.length * 0.2);
        for (let i = 0; i < toDelete; i++) {
          this.fallbackMap.delete(entries[i][0]);
        }

        console.log(`Eliminadas ${toDelete} entradas usando estrategia LRU`);
        return;
      }

      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.openCursor();
          const entries: Array<{ key: IDBValidKey; lastAccessed: number }> = [];

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            
            if (cursor) {
              const entry = cursor.value as CacheEntry;
              entries.push({
                key: cursor.key,
                lastAccessed: entry.lastAccessed || entry.timestamp
              });
              cursor.continue();
            } else {
              // Ordenar por lastAccessed (más antiguo primero)
              entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

              // Eliminar el 20% menos usado
              const toDelete = Math.ceil(entries.length * 0.2);
              let deletedCount = 0;

              const deleteTransaction = this.db!.transaction([this.storeName], 'readwrite');
              const deleteStore = deleteTransaction.objectStore(this.storeName);

              for (let i = 0; i < toDelete; i++) {
                deleteStore.delete(entries[i].key);
                deletedCount++;
              }

              deleteTransaction.oncomplete = () => {
                console.log(`Eliminadas ${deletedCount} entradas usando estrategia LRU`);
                resolve();
              };

              deleteTransaction.onerror = () => {
                console.error('Error al eliminar entradas LRU');
                resolve();
              };
            }
          };

          request.onerror = () => {
            console.error('Error al aplicar estrategia LRU:', request.error);
            resolve();
          };
        } catch (error) {
          console.error('Error en evictLRU:', error);
          resolve();
        }
      });
    } catch (error) {
      console.error('Error al aplicar estrategia LRU:', error);
    }
  }

  /**
   * Limpia datos antiguos (más de 7 días)
   */
  async cleanOldData(): Promise<void> {
    try {
      if (this.useFallback) {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.fallbackMap.forEach((entry, key) => {
          if (now - entry.timestamp > this.maxAge) {
            keysToDelete.push(key);
          }
        });

        keysToDelete.forEach(key => this.fallbackMap.delete(key));
        console.log(`Limpiados ${keysToDelete.length} registros antiguos del cache`);
        return;
      }

      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.openCursor();
          const now = Date.now();
          let deletedCount = 0;

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            
            if (cursor) {
              const entry = cursor.value as CacheEntry;
              
              if (now - entry.timestamp > this.maxAge) {
                cursor.delete();
                deletedCount++;
              }
              
              cursor.continue();
            } else {
              console.log(`Limpiados ${deletedCount} registros antiguos del cache`);
              resolve();
            }
          };

          request.onerror = () => {
            console.error('Error al limpiar datos antiguos:', request.error);
            resolve();
          };
        } catch (error) {
          console.error('Error en cleanOldData:', error);
          resolve();
        }
      });
    } catch (error) {
      console.error('Error al limpiar datos antiguos:', error);
    }
  }

  /**
   * Estima el tamaño de un objeto en bytes
   */
  private estimateSize(obj: any): number {
    try {
      const jsonString = JSON.stringify(obj);
      return new Blob([jsonString]).size;
    } catch (error) {
      console.error('Error al estimar tamaño:', error);
      return 0;
    }
  }

  /**
   * Verifica si está usando fallback (Map en memoria)
   */
  isUsingFallback(): boolean {
    return this.useFallback;
  }

  /**
   * Obtiene estadísticas del cache
   * Incluye: tamaño total, número de entradas, porcentaje usado, entradas comprimidas
   */
  async getStats(): Promise<{
    totalSize: number;
    totalSizeFormatted: string;
    maxSize: number;
    maxSizeFormatted: string;
    percentageUsed: number;
    entryCount: number;
    compressedCount: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const totalSize = await this.getSize();
      const percentageUsed = (totalSize / this.maxSize) * 100;

      let entryCount = 0;
      let compressedCount = 0;
      let oldestTimestamp = Infinity;
      let newestTimestamp = 0;

      if (this.useFallback) {
        entryCount = this.fallbackMap.size;
        this.fallbackMap.forEach((entry) => {
          if (entry.compressed) compressedCount++;
          if (entry.timestamp < oldestTimestamp) oldestTimestamp = entry.timestamp;
          if (entry.timestamp > newestTimestamp) newestTimestamp = entry.timestamp;
        });
      } else {
        if (!this.db) {
          await this.init();
        }

        await new Promise<void>((resolve) => {
          try {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.openCursor();

            request.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest).result;
              
              if (cursor) {
                entryCount++;
                const entry = cursor.value as CacheEntry;
                if (entry.compressed) compressedCount++;
                if (entry.timestamp < oldestTimestamp) oldestTimestamp = entry.timestamp;
                if (entry.timestamp > newestTimestamp) newestTimestamp = entry.timestamp;
                cursor.continue();
              } else {
                resolve();
              }
            };

            request.onerror = () => {
              console.error('Error al obtener estadísticas:', request.error);
              resolve();
            };
          } catch (error) {
            console.error('Error en getStats:', error);
            resolve();
          }
        });
      }

      return {
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        maxSize: this.maxSize,
        maxSizeFormatted: this.formatBytes(this.maxSize),
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        entryCount,
        compressedCount,
        oldestEntry: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : null,
        newestEntry: newestTimestamp !== 0 ? new Date(newestTimestamp) : null,
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del cache:', error);
      return {
        totalSize: 0,
        totalSizeFormatted: '0 B',
        maxSize: this.maxSize,
        maxSizeFormatted: this.formatBytes(this.maxSize),
        percentageUsed: 0,
        entryCount: 0,
        compressedCount: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Formatea bytes en formato legible (KB, MB, etc.)
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Carga datos del cache con validación de antigüedad
   * Retorna los datos junto con información sobre su antigüedad
   * 
   * @param key - Clave del dato a cargar
   * @returns Objeto con datos, timestamp y advertencia si aplica
   */
  async loadFromCache<T>(key: string): Promise<{
    data: T | null;
    timestamp: Date | null;
    isStale: boolean;
    ageInHours: number;
    relativeTime: string;
  }> {
    try {
      let entry: CacheEntry<T> | null = null;

      if (this.useFallback) {
        const fallbackEntry = this.fallbackMap.get(key);
        if (fallbackEntry) {
          entry = fallbackEntry as CacheEntry<T>;
        }
      } else {
        if (!this.db) {
          await this.init();
        }

        entry = await new Promise((resolve) => {
          try {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => {
              const result = request.result as CacheEntry<T> | null;
              
              // Actualizar último acceso si existe
              if (result) {
                result.lastAccessed = Date.now();
                store.put(result, key);
              }
              
              resolve(result);
            };

            request.onerror = () => {
              console.error('Error al leer del cache:', request.error);
              resolve(null);
            };
          } catch (error) {
            console.error('Error en loadFromCache:', error);
            resolve(null);
          }
        });
      }

      // Si no hay datos, retornar null
      if (!entry) {
        return {
          data: null,
          timestamp: null,
          isStale: false,
          ageInHours: 0,
          relativeTime: '',
        };
      }

      // Calcular antigüedad
      const now = Date.now();
      const ageInMs = now - entry.timestamp;
      const ageInHours = ageInMs / (1000 * 60 * 60);
      const timestamp = new Date(entry.timestamp);

      // Verificar si los datos son muy antiguos (más de 7 días)
      if (ageInMs > this.maxAge) {
        // Eliminar datos antiguos
        await this.remove(key);
        return {
          data: null,
          timestamp: null,
          isStale: true,
          ageInHours,
          relativeTime: this.formatRelativeTime(ageInMs),
        };
      }

      // Descomprimir datos si es necesario
      let data: T | null = null;
      if (entry.compressed) {
        data = this.decompressData(entry.data as string) as T;
      } else {
        data = entry.data as T;
      }

      // Determinar si los datos están obsoletos (más de 24 horas)
      const isStale = ageInHours > 24;

      return {
        data,
        timestamp,
        isStale,
        ageInHours,
        relativeTime: this.formatRelativeTime(ageInMs),
      };
    } catch (error) {
      console.error('Error al cargar del cache:', error);
      return {
        data: null,
        timestamp: null,
        isStale: false,
        ageInHours: 0,
        relativeTime: '',
      };
    }
  }

  /**
   * Formatea un timestamp en formato relativo ("hace 2 horas")
   * 
   * @param ageInMs - Antigüedad en milisegundos
   * @returns String con formato relativo
   */
  private formatRelativeTime(ageInMs: number): string {
    const seconds = Math.floor(ageInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
    if (hours > 0) {
      return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    if (minutes > 0) {
      return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    return 'hace unos segundos';
  }

  /**
   * Obtiene el timestamp de un dato en cache
   * 
   * @param key - Clave del dato
   * @returns Timestamp o null si no existe
   */
  async getTimestamp(key: string): Promise<Date | null> {
    try {
      if (this.useFallback) {
        const entry = this.fallbackMap.get(key);
        return entry ? new Date(entry.timestamp) : null;
      }

      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(key);

          request.onsuccess = () => {
            const entry = request.result as CacheEntry | undefined;
            resolve(entry ? new Date(entry.timestamp) : null);
          };

          request.onerror = () => {
            console.error('Error al obtener timestamp:', request.error);
            resolve(null);
          };
        } catch (error) {
          console.error('Error en getTimestamp:', error);
          resolve(null);
        }
      });
    } catch (error) {
      console.error('Error al obtener timestamp:', error);
      return null;
    }
  }
}

// Exportar instancia singleton
export const offlineCache = new OfflineCache();
