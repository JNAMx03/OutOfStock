// STORE DE TIENDAS - Maneja todas las tiendas del usuario

// ============================================
// IMPORTS
// ============================================

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Store, CreateStoreData, UpdateStoreData } from '@/models/Store';
import * as storesService from '@/services/stores.services';
import * as cacheService from '@/services/cache.service';

// ============================================
// STORE DE TIENDAS
// ============================================

export const useStoresStore = defineStore('stores', () => {
    // ============================================
    // ESTADO (State)
    // ============================================
    
    // Lista de todas las tiendas del usuario
    const stores = ref<Store[]>([]);
    
    // ID de la tienda actualmente seleccionada (persistido en localStorage)
    const currentStoreId = ref<string | null>(
        localStorage.getItem('currentStoreId') || null
    );
    
    // Estado de carga
    const isLoading = ref(false);
    
    // ============================================
    // GETTERS (Computed)
    // ============================================
    
    /**
     * Obtiene la tienda actual seleccionada
     */
    const currentStore = computed(() => {
        if (!currentStoreId.value) return null;
        return stores.value.find(store => store.id === currentStoreId.value) || null;
    });
    
    /**
     * Verifica si hay tiendas disponibles
     */
    const hasStores = computed(() => stores.value.length > 0);
    
    /**
     * Obtiene el número total de tiendas
     */
    const storesCount = computed(() => stores.value.length);
    
    /**
     * Obtiene solo las tiendas activas
     */
    const activeStores = computed(() => 
        stores.value.filter(store => store.status === 'active')
    );

    // ============================================
    // ACCIONES (Actions)
    // ============================================
    
    /**
     * 📋 FETCH STORES - Obtiene todas las tiendas del usuario
     * TODO: En el futuro, esto obtendrá datos desde DynamoDB
     */
    async function fetchStores(userId: string, forceRefresh: boolean = false) {
        // Si ya hay tiendas cargadas y no es un refresh forzado, no hacer nada
        if (stores.value.length > 0 && !forceRefresh) {
            console.log('✅ Tiendas ya cargadas, usando caché local');
            return { success: true };
        }
        
        isLoading.value = true;
        
        try {
            // ============================================
            // PASO A: Intentar cargar desde caché (rápido)
            // ============================================
            if (!forceRefresh) {
                const cacheKey = `stores_${userId}`;
                const isValid = await cacheService.isCacheValid(cacheKey, 60); // válido 60 min

                if (isValid) {
                    // Cargar desde IndexedDB
                    const cachedStores = await cacheService.getItemsByOwner<Store>(
                        cacheService.STORES.STORES,
                        userId
                    );

                    if (cachedStores.length > 0) {
                        stores.value = cachedStores;
                        // Si hay tiendas y no hay una seleccionada, seleccionar la primera
                        if (!currentStoreId.value) {
                            currentStoreId.value = stores.value[0].id;
                            localStorage.setItem('currentStoreId', stores.value[0].id);
                        }
                        isLoading.value = false;
                        console.log(`⚡ ${cachedStores.length} tiendas cargadas desde caché:`, cachedStores.map(s => s.name));
                        return { success: true, fromCache: true };
                    }
                }
            }

            // ============================================
            // PASO B: Cargar datos frescos
            // ============================================
            console.log('📦 Cargando tiendas frescas para usuario:', userId);
            
            // Obtener tiendas desde el servicio (API)
            const fetchedStores = await storesService.getAllStores(userId);
            stores.value = fetchedStores;
            
            // ============================================
            // PASO C: Guardar en caché para la próxima vez
            // ============================================
            await cacheService.saveStores(stores.value, userId);
            await cacheService.saveLastSync(`stores_${userId}`);
            console.log('💾 Tiendas guardadas en caché');
            
            // Si hay tiendas y no hay una seleccionada, seleccionar la primera
            if (stores.value.length > 0 && !currentStoreId.value) {
                currentStoreId.value = stores.value[0].id;
                localStorage.setItem('currentStoreId', stores.value[0].id);
            }
            
            return { success: true, fromCache: false };
        } catch (error) {
        console.error('Error al obtener tiendas:', error);
        return { success: false, error: 'Error al cargar tiendas' };
        } finally {
        isLoading.value = false;
        }
    }
    
    /**
     * ➕ CREATE STORE - Crea una nueva tienda
     * TODO: Guardar en DynamoDB
     */
    async function createStore(data: CreateStoreData, userId: string) {
        isLoading.value = true;
        
        try {
            // Crear tienda usando el servicio
            const newStore = await storesService.createStore(data, userId);
            
            // Agregar a la lista local
            stores.value.push(newStore);
            
            // Guardar en caché
            await cacheService.saveStores(stores.value, userId);
            await cacheService.saveLastSync(`stores_${userId}`);
            console.log('💾 Nueva tienda guardada en caché:', newStore.id);
            
            // Seleccionar la nueva tienda
            currentStoreId.value = newStore.id;
            localStorage.setItem('currentStoreId', newStore.id);
            
            return { success: true, store: newStore };
        } catch (error) {
            console.error('Error al crear tienda:', error);
            return { success: false, error: 'Error al crear tienda' };
        } finally {
            isLoading.value = false;
        }
    }
    
    /**
     * ✏️ UPDATE STORE - Actualiza una tienda existente
     * TODO: Actualizar en DynamoDB
     */
    async function updateStore(storeId: string, data: UpdateStoreData) {
        isLoading.value = true;
        
        try {
            // Encontrar la tienda original
            const index = stores.value.findIndex(s => s.id === storeId);
            
            if (index === -1) {
                console.error('❌ Tienda no encontrada. ID buscado:', storeId);
                console.error('Tiendas disponibles:', stores.value.map(s => ({ id: s.id, name: s.name })));
                throw new Error('Tienda no encontrada');
            }
            
            const originalStore = stores.value[index];
            console.log('📝 Actualizando tienda:', originalStore.name);
            
            // Fusionar los datos nuevos con los originales
            // Esto preserva todos los campos que no se están actualizando
            const updatedStore: Store = {
                ...originalStore,
                ...data,
                // Fusionar address si existe
                address: data.address 
                ? { ...originalStore.address, ...data.address }
                : originalStore.address,
                // Fusionar inventorySettings si existe
                inventorySettings: data.inventorySettings
                ? { ...originalStore.inventorySettings, ...data.inventorySettings }
                : originalStore.inventorySettings,
                // Actualizar timestamp
                updatedAt: new Date().toISOString(),
            };
            
            // TODO: Actualizar en DynamoDB cuando implementemos AppSync
            // await storesService.updateStore(storeId, data);
            
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Actualizar en la lista local
            stores.value[index] = updatedStore;
            
            console.log('✅ Tienda actualizada exitosamente:', updatedStore.name);
            return { success: true, store: updatedStore };
        } catch (error: any) {
        console.error('❌ Error al actualizar tienda:', error);
        return { success: false, error: error.message || 'Error al actualizar tienda' };
        } finally {
        isLoading.value = false;
        }
    }
    
    /**
     * 🗑️ DELETE STORE - Elimina una tienda
     * TODO: Eliminar de DynamoDB (soft delete - cambiar estado a 'closed')
     */
    async function deleteStore(storeId: string) {
        isLoading.value = true;
        
        try {
        // Eliminar usando el servicio (soft delete - cambia estado a 'closed')
            await storesService.deleteStore(storeId);
            
            // Actualizar estado local
            const index = stores.value.findIndex(s => s.id === storeId);
            if (index !== -1) {
                stores.value[index].status = 'closed';
            }
            
            // Si era la tienda actual, deseleccionar
            if (currentStoreId.value === storeId) {
                const activeStore = activeStores.value[0];
                currentStoreId.value = activeStore?.id || null;
            }
            
            return { success: true };
        } catch (error: any) {
            console.error('Error al eliminar tienda:', error);
            return { success: false, error: error.message || 'Error al eliminar tienda' };
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * ♻️ REACTIVATE STORE - Reactiva una tienda cerrada
     */
    async function reactivateStore(storeId: string) {
        // Reutilizamos updateStore para cambiar el estado
        return updateStore(storeId, { status: 'active' });
    }

    /**
     * 💥 PERMANENT DELETE - Elimina una tienda definitivamente
     */
    async function permanentDeleteStore(storeId: string) {
        isLoading.value = true;
        try {
            // TODO: Llamar al servicio para eliminar de BD definitivamente
            // await storesService.permanentDeleteStore(storeId);

            // Eliminar del estado local
            const index = stores.value.findIndex(s => s.id === storeId);
            if (index !== -1) {
                stores.value.splice(index, 1);
            }
            return { success: true };
        } catch (error: any) {
            console.error('Error al eliminar definitivamente:', error);
            return { success: false, error: error.message };
        } finally {
            isLoading.value = false;
        }
    }
    
    /**
     * 🔄 SET CURRENT STORE - Cambia la tienda actual
     */
    function setCurrentStore(storeId: string) {
        const store = stores.value.find(s => s.id === storeId);
        
        if (store) {
        currentStoreId.value = storeId;
        localStorage.setItem('currentStoreId', storeId);
        return { success: true };
        }
        
        return { success: false, error: 'Tienda no encontrada' };
    }
    
    /**
     * 🔍 GET STORE BY ID - Obtiene una tienda específica por ID
     */
    function getStoreById(storeId: string): Store | null {
        return stores.value.find(s => s.id === storeId) || null;
    }
    
    /**
     * 🧹 CLEAR - Limpia todos los datos (al hacer logout)
     */
    function clear() {
        stores.value = [];
        currentStoreId.value = null;
        localStorage.removeItem('currentStoreId');
    }

    // ============================================
    // RETORNAR
    // ============================================
    return {
        // Estado
        stores,
        currentStoreId,
        isLoading,
        
        // Getters
        currentStore,
        hasStores,
        storesCount,
        activeStores,
        
        // Acciones
        fetchStores,
        createStore,
        updateStore,
        deleteStore,
        reactivateStore,
        permanentDeleteStore,
        setCurrentStore,
        getStoreById,
        clear,
    };
});

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
// 
// Este store maneja TODAS las tiendas del usuario.
// 
// Funcionalidades principales:
// 
// 1. ALMACENA:
//    - Lista de todas las tiendas
//    - Tienda actual seleccionada
// 
// 2. PERMITE:
//    - Crear nuevas tiendas
//    - Editar tiendas existentes
//    - "Eliminar" tiendas (realmente las marca como cerradas)
//    - Cambiar entre tiendas
// 
// 3. PROVEE:
//    - Tienda actual
//    - Solo tiendas activas
//    - Conteo de tiendas
// 
// Por ahora usa datos de ejemplo (mock data).
// En futuras fases, conectaremos esto con DynamoDB
// para que los datos persistan en la nube.
// ============================================