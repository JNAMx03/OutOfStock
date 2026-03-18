// ⚡ SERVICIO DE CACHÉ - IndexedDB para datos grandes

// ============================================
// CONFIGURACIÓN DE LA BASE DE DATOS
// ============================================

// Nombre de la base de datos en IndexedDB
const DB_NAME = 'InventoryAppCache';
// Versión de la base de datos
// Si cambias la estructura, incrementa este número
const DB_VERSION = 1;

// Nombres de los "almacenes" (equivalente a tablas)
export const STORES = {
    PRODUCTS:      'products',     // Productos del inventario
    SALES:         'sales',        // Ventas
    NOTIFICATIONS: 'notifications', // Notificaciones
    METADATA:      'metadata',     // Info de caché (timestamps, versiones)
} as const;

// Tipo para las keys del store
type StoreName = typeof STORES[keyof typeof STORES];

// ============================================
// INICIALIZACIÓN DE INDEXEDDB
// ============================================

/**
 * Abre (o crea) la base de datos IndexedDB.
 * Se ejecuta automáticamente la primera vez.
 * Es una promesa porque IndexedDB es asíncrono.
 */
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Se ejecuta cuando se crea o actualiza la BD
        // Aquí definimos la estructura de las tablas
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Crear almacén de productos
            if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
                const productsStore = db.createObjectStore(STORES.PRODUCTS, {
                    keyPath: 'id', // El campo 'id' es la llave primaria
                });
                // Índice para buscar por tienda rápidamente
                productsStore.createIndex('storeId', 'storeId', { unique: false });
            }

            // Crear almacén de ventas
            if (!db.objectStoreNames.contains(STORES.SALES)) {
                const salesStore = db.createObjectStore(STORES.SALES, {
                    keyPath: 'id',
                });
                salesStore.createIndex('storeId', 'storeId', { unique: false });
                salesStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Crear almacén de notificaciones
            if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
                const notifsStore = db.createObjectStore(STORES.NOTIFICATIONS, {
                    keyPath: 'id',
                });
                notifsStore.createIndex('storeId', 'storeId', { unique: false });
            }

            // Crear almacén de metadata (para timestamps de última sincronización)
            if (!db.objectStoreNames.contains(STORES.METADATA)) {
                db.createObjectStore(STORES.METADATA, {
                    keyPath: 'key', // Ej: 'products_store-123_lastSync'
                });
            }

            console.log('✅ IndexedDB creada/actualizada correctamente');
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            console.error('❌ Error al abrir IndexedDB:', event);
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
}

// ============================================
// FUNCIONES GENÉRICAS DEL CACHÉ
// ============================================

/**
 * 💾 GUARDAR - Guarda un array de items en IndexedDB
 * Reemplaza todos los items del almacén para esa tienda
 * @param storeName - Nombre del almacén (STORES.PRODUCTS, etc.)
 * @param items - Items a guardar
 * @param storeId - ID de la tienda (para limpiar solo sus datos)
 */
export async function saveItems<T extends { id: string; storeId?: string }>(
  storeName: StoreName,
  items: T[],
  storeId?: string
): Promise<void> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);

            // Si se especifica storeId, primero eliminar los existentes de esa tienda
            if (storeId) {
                const index = objectStore.index('storeId');
                const deleteRequest = index.openCursor(IDBKeyRange.only(storeId));

                deleteRequest.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest).result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    } else {
                        // Después de eliminar, insertar los nuevos
                        items.forEach(item => objectStore.put(item));
                    }
                };
            } else {
                // Sin storeId: guardar directamente (upsert)
                items.forEach(item => objectStore.put(item));
            }

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };

            transaction.onerror = (event) => {
                console.error(`❌ Error al guardar en ${storeName}:`, event);
                db.close();
                reject(transaction.error);
            };
        });
    } catch (error) {
        // Si IndexedDB falla, no romper la app — registrar y continuar
        console.warn(`⚠️ Cache no disponible (${storeName}):`, error);
    }
}

/**
 * 📖 OBTENER POR TIENDA - Lee todos los items de una tienda
 * @param storeName - Nombre del almacén
 * @param storeId - ID de la tienda
 * @returns Array de items, o [] si hay error
 */
export async function getItemsByStore<T>(
  storeName: StoreName,
  storeId: string
): Promise<T[]> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const index = objectStore.index('storeId');
            const request = index.getAll(storeId);

            request.onsuccess = (event) => {
                const results = (event.target as IDBRequest).result as T[];
                db.close();
                resolve(results || []);
            };

            request.onerror = (event) => {
                console.error(`❌ Error al leer ${storeName}:`, event);
                db.close();
                reject(request.error);
            };
        });
    } catch (error) {
        console.warn(`⚠️ Cache no disponible (${storeName}):`, error);
        return [];
    }
}

/**
 * 🔍 OBTENER POR ID - Lee un item específico
 * @param storeName - Nombre del almacén
 * @param id - ID del item
 * @returns El item o null si no existe
 */
export async function getItemById<T>(
  storeName: StoreName,
  id: string
): Promise<T | null> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(id);

            request.onsuccess = (event) => {
                const result = (event.target as IDBRequest).result as T | undefined;
                db.close();
                resolve(result || null);
            };

            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        });
    } catch (error) {
        console.warn(`⚠️ Cache no disponible:`, error);
        return null;
    }
}

/**
 * 🗑️ LIMPIAR - Elimina todos los datos de una tienda en un almacén
 * @param storeName - Nombre del almacén
 * @param storeId - ID de la tienda
 */
export async function clearStoreData(
  storeName: StoreName,
  storeId: string
): Promise<void> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const index = objectStore.index('storeId');
            const request = index.openCursor(IDBKeyRange.only(storeId));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                cursor.delete();
                cursor.continue();
                }
            };

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };

            transaction.onerror = () => {
                db.close();
                reject(transaction.error);
            };
        });
    } catch (error) {
        console.warn(`⚠️ Error al limpiar caché:`, error);
    }
}

// ============================================
// FUNCIONES DE METADATA (timestamps de sync)
// ============================================

/**
 * 📅 GUARDAR TIMESTAMP - Registra cuándo se sincronizó por última vez
 * @param key - Clave única (ej: 'products_store-123')
 */
export async function saveLastSync(key: string): Promise<void> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.METADATA, 'readwrite');
            const objectStore = transaction.objectStore(STORES.METADATA);

            objectStore.put({
                key,
                lastSync: new Date().toISOString(),
            });

            transaction.oncomplete = () => { db.close(); resolve(); };
            transaction.onerror = () => { db.close(); reject(transaction.error); };
        });
    } catch (error) {
        console.warn('⚠️ Error al guardar timestamp:', error);
    }
}

/**
 * 📅 LEER TIMESTAMP - Lee cuándo fue la última sincronización
 * @param key - Clave única
 * @returns Fecha ISO string, o null si nunca se sincronizó
 */
export async function getLastSync(key: string): Promise<string | null> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.METADATA, 'readonly');
            const objectStore = transaction.objectStore(STORES.METADATA);
            const request = objectStore.get(key);

            request.onsuccess = (event) => {
                const result = (event.target as IDBRequest).result;
                db.close();
                resolve(result?.lastSync || null);
            };

            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (error) {
        return null;
    }
}

/**
 * ⏰ VERIFICAR SI EL CACHÉ ESTÁ VIGENTE
 * Retorna true si el caché fue actualizado hace menos de N minutos
 * @param key - Clave del timestamp
 * @param maxAgeMinutes - Minutos máximos de validez (default: 30)
 */
export async function isCacheValid(
  key: string,
  maxAgeMinutes: number = 30
): Promise<boolean> {
    const lastSync = await getLastSync(key);
    if (!lastSync) return false;

    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60);

    return diffMinutes < maxAgeMinutes;
}

/**
 * 🧹 LIMPIAR TODA LA BASE DE DATOS
 * Útil al cerrar sesión para liberar espacio
 */
export async function clearAllCache(): Promise<void> {
    return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

        deleteRequest.onsuccess = () => {
            console.log('✅ Caché limpiado completamente');
            resolve();
        };

        deleteRequest.onerror = () => {
            console.error('❌ Error al limpiar caché');
            reject(deleteRequest.error);
        };
    });
}

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
//
// Este servicio es como un "almacén local" dentro
// del navegador, pero MÁS GRANDE que localStorage.
//
// localStorage: límite ~5MB (suficiente para config)
// IndexedDB:    límite ~50% del disco disponible
//
// ¿Para qué lo usamos?
//  • Guardar productos y ventas localmente
//  • La app carga datos del caché mientras espera
//    la respuesta del servidor (más rápida)
//  • Permite que la app funcione sin internet
//    usando datos en caché
//
// FLUJO DE CARGA (con caché):
//  1. Usuario abre "Inventario"
//  2. Se muestran datos del caché INMEDIATAMENTE
//  3. En segundo plano se consulta el servidor
//  4. Cuando llega respuesta, se actualiza la UI
//  5. Se guarda en caché la nueva data
//
// ============================================