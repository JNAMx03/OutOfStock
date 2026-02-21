// 📌 SERVICIO DE TIENDAS - Maneja todas las operaciones con DynamoDB

// ============================================
// IMPORTS
// ============================================
import { get, post, put, del } from 'aws-amplify/api';
import type { Store, CreateStoreData, UpdateStoreData } from '@/models/Store';
import { createDefaultInventorySettings } from '@/models/Store';

// ============================================
// CONFIGURACIÓN
// ============================================

// Nombre de la API en DynamoDB
const API_NAME = 'inventoryDB';
const TABLE_NAME = 'Stores';

// Debug: Verificar configuración, eliminar en producción***
console.log('API_NAME:', API_NAME);
console.log('TABLE_NAME:', TABLE_NAME);
console.log('api', get, post, put, del);

// ============================================
// SERVICIO DE TIENDAS
// ============================================

/**
 * 🔍 GET ALL STORES - Obtiene todas las tiendas de un usuario
 * @param userId - ID del usuario
 * @returns Promise con array de tiendas
 */
export async function getAllStores(userId: string): Promise<Store[]> {
  try {
    // Consulta a DynamoDB
    // NOTA: Por ahora, DynamoDB Amplify no soporta queries directamente
    // Usaremos un workaround temporal hasta configurar AppSync (Fase posterior)
    
    // Por ahora, retornamos datos mock
    // TODO: Implementar query real con AppSync en fase posterior
    console.log('📦 Obteniendo tiendas para usuario:', userId);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Retornar datos de ejemplo
    const mockStores: Store[] = [
      {
        id: `store-${Date.now()}`,
        name: 'Tienda Principal',
        description: 'Mi primera tienda de inventario',
        type: 'retail',
        status: 'active',
        address: {
          street: 'Calle 123 #45-67',
          city: 'Bogotá',
          state: 'Cundinamarca',
          country: 'Colombia',
          zipCode: '110111',
        },
        phone: '+57 300 1234567',
        email: 'tienda@ejemplo.com',
        color: '#3880ff',
        inventorySettings: createDefaultInventorySettings(),
        ownerId: userId,
        adminIds: [],
        sellerIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    return mockStores;
  } catch (error) {
    console.error('❌ Error al obtener tiendas:', error);
    throw error;
  }
}

/**
 * 📦 GET STORE BY ID - Obtiene una tienda específica
 * @param storeId - ID de la tienda
 * @returns Promise con la tienda
 */
export async function getStoreById(storeId: string): Promise<Store | null> {
  try {
    console.log('📦 Obteniendo tienda:', storeId);
    
    // TODO: Implementar con DynamoDB real
    // Por ahora retornamos null
    return null;
  } catch (error) {
    console.error('❌ Error al obtener tienda:', error);
    throw error;
  }
}

/**
 * ➕ CREATE STORE - Crea una nueva tienda
 * @param data - Datos de la nueva tienda
 * @param userId - ID del usuario que la crea
 * @returns Promise con la tienda creada
 */
export async function createStore(  data: CreateStoreData,  userId: string): Promise<Store> {
  try {
    console.log('➕ Creando tienda:', data.name);
    
    // Crear objeto de tienda completo
    const newStore: Store = {
      id: `store-${Date.now()}`, // ID temporal
      name: data.name,
      description: data.description,
      type: data.type,
      status: 'active',
      address: data.address,
      phone: data.phone,
      email: data.email,
      logo: data.logo,
      color: data.color || '#3880ff',
      inventorySettings: {
        ...createDefaultInventorySettings(),
        ...data.inventorySettings,
      },
      ownerId: userId,
      adminIds: [],
      sellerIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // TODO: Guardar en DynamoDB
    // await API.put(API_NAME, `/stores`, {
    //   body: newStore,
    // });
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('✅ Tienda creada exitosamente');
    return newStore;
  } catch (error) {
    console.error('❌ Error al crear tienda:', error);
    throw error;
  }
}

/**
 * ✏️ UPDATE STORE - Actualiza una tienda existente
 * @param storeId - ID de la tienda
 * @param data - Datos a actualizar
 * @returns Promise con la tienda actualizada
 */
export async function updateStore(  storeId: string,  data: UpdateStoreData): Promise<Store> {
  try {
    console.log('✏️ Actualizando tienda:', storeId);
    
    // TODO: Implementar actualización real con DynamoDB
    // Por ahora, simulamos
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Crear objeto actualizado (mock)
    const updatedStore: Store = {
      id: storeId,
      name: data.name || 'Tienda',
      type: data.type || 'retail',
      status: data.status || 'active',
      address: (data.address as any) || {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
      },
      inventorySettings: createDefaultInventorySettings(),
      ownerId: 'user-id',
      adminIds: [],
      sellerIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('✅ Tienda actualizada exitosamente');
    return updatedStore;
  } catch (error) {
    console.error('❌ Error al actualizar tienda:', error);
    throw error;
  }
}

/**
 * 🗑️ DELETE STORE - Elimina una tienda (soft delete)
 * @param storeId - ID de la tienda
 * @returns Promise<void>
 */
export async function deleteStore(storeId: string): Promise<void> {
  try {
    console.log('🗑️ Eliminando tienda:', storeId);
    
    // En lugar de eliminar, cambiamos el estado a 'closed'
    await updateStore(storeId, { status: 'closed' });
    
    console.log('✅ Tienda eliminada (soft delete) exitosamente');
  } catch (error) {
    console.error('❌ Error al eliminar tienda:', error);
    throw error;
  }
}

/**
 * 👥 ADD USER TO STORE - Agrega un usuario a una tienda
 * @param storeId - ID de la tienda
 * @param userId - ID del usuario
 * @param role - Rol del usuario (admin o seller)
 * @returns Promise<void>
 */
export async function addUserToStore(  storeId: string,  userId: string,  role: 'admin' | 'seller'): Promise<void> {
  try {
    console.log(`👥 Agregando ${role} a tienda:`, storeId);
    
    // TODO: Implementar con DynamoDB real
    // Actualizar el array de adminIds o sellerIds
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Usuario agregado a tienda exitosamente');
  } catch (error) {
    console.error('❌ Error al agregar usuario a tienda:', error);
    throw error;
  }
}

/**
 * 🚫 REMOVE USER FROM STORE - Remueve un usuario de una tienda
 * @param storeId - ID de la tienda
 * @param userId - ID del usuario
 * @returns Promise<void>
 */
export async function removeUserFromStore(  storeId: string,  userId: string): Promise<void> {
  try {
    console.log(`Removiendo ${userId} de tienda:`, storeId);
    
    // TODO: Implementar con DynamoDB real
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Usuario removido de tienda exitosamente');
  } catch (error) {
    console.error('❌ Error al remover usuario de tienda:', error);
    throw error;
  }
}


// 
// Funciones principales:
// - getAllStores: Obtiene todas las tiendas del usuario
// - getStoreById: Obtiene una tienda específica
// - createStore: Crea una nueva tienda
// - updateStore: Actualiza datos de una tienda
// - deleteStore: Elimina una tienda (soft delete)
// - addUserToStore: Agrega personal a una tienda
// - removeUserFromStore: Remueve personal
// 
// Por ahora usa datos MOCK (falsos) porque:
// 1. Amplify Storage (DynamoDB) tiene limitaciones
// 2. En una fase posterior usaremos AWS AppSync (GraphQL)
//    que es más potente y fácil de usar
// 
// Los datos mock permiten desarrollar la UI y lógica
// sin preocuparnos por el backend todavía.
// 
// Cuando implementemos AppSync, solo cambiaremos
// estas funciones sin tocar el resto de la app.
// ============================================