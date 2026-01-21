// MODELO DE TIENDA - Define la estructura de datos de una tienda

// ============================================
// TIPOS Y ENUMS
// ============================================

/*
* Tipo de tienda
*/

export type StoreType =
    | 'retail'        
    | 'wholesale'     
    | 'restaurant'    
    | 'bar'           
    | 'warehouse'     
    | 'other';

/*
* Estado de una tienda
*/

export type StoreStatus = 
    | 'active'        
    | 'inactive'      
    | 'closed';

// ============================================
// INTERFACES
// ============================================

/*
* Dirección de una tienda
*/

export interface StoreAddress{
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

/*
* Configuración de inventario de la tienda
*/
export interface StoreInventorySettings {
    lowStockThreshold: number;      // Umbral de stock bajo (cantidad mínima)
    enableLowStockAlerts: boolean;  // ¿Activar alertas de stock bajo?
    autoCalculatePrices: boolean;   // ¿Calcular precios automáticamente?
    defaultProfitMargin: number;    // Margen de ganancia por defecto (%)
}

/*
* Interfaz principal de Tienda
*/
export interface Store {
    // Identificación
    id: string;                           // ID único
    name: string;                         // Nombre de la tienda
    description?: string;                 // Descripción
    
    // Tipo y estado
    type: StoreType;                      // Tipo de tienda
    status: StoreStatus;                  // Estado actual
    
    // Información de contacto
    address: StoreAddress;                // Dirección completa
    phone?: string;                       // Teléfono
    email?: string;                       // Email de contacto
    
    // Identidad visual
    logo?: string;                        // URL del logo
    color?: string;                       // Color principal (hex)
    
    // Configuración
    inventorySettings: StoreInventorySettings;  // Configuración de inventario
    
    // Propietario y personal
    ownerId: string;                      // ID del dueño
    adminIds: string[];                   // IDs de administradores
    sellerIds: string[];                  // IDs de vendedores
    
    // Metadatos
    createdAt: string;                    // Fecha de creación (ISO string)
    updatedAt: string;                    // Fecha de actualización
}

/*
* Datos para crear una nueva tienda
*/
export interface CreateStoreData {
    name: string;
    description?: string;
    type: StoreType;
    address: StoreAddress;
    phone?: string;
    email?: string;
    logo?: string;
    color?: string;
    inventorySettings?: Partial<StoreInventorySettings>;
}

/*
* Datos para actualizar una tienda
*/
export interface UpdateStoreData {
    name?: string;
    description?: string;
    type?: StoreType;
    status?: StoreStatus;
    address?: Partial<StoreAddress>;
    phone?: string;
    email?: string;
    logo?: string;
    color?: string;
    inventorySettings?: Partial<StoreInventorySettings>;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtiene el nombre legible del tipo de tienda
 */
export function getStoreTypeName(type: StoreType): string {
  const typeNames: Record<StoreType, string> = {
    retail: 'Minorista',
    wholesale: 'Mayorista',
    restaurant: 'Restaurante',
    bar: 'Bar/Cantina',
    warehouse: 'Bodega',
    other: 'Otro',
  };
  return typeNames[type];
}

/**
 * Obtiene el icono asociado al tipo de tienda
 */
export function getStoreTypeIcon(type: StoreType): string {
  const typeIcons: Record<StoreType, string> = {
    retail: 'storefront-outline',
    wholesale: 'business-outline',
    restaurant: 'restaurant-outline',
    bar: 'beer-outline',
    warehouse: 'cube-outline',
    other: 'ellipsis-horizontal-outline',
  };
  return typeIcons[type];
}

/**
 * Obtiene el color del estado de la tienda
 */
export function getStoreStatusColor(status: StoreStatus): string {
  const statusColors: Record<StoreStatus, string> = {
    active: 'success',
    inactive: 'warning',
    closed: 'danger',
  };
  return statusColors[status];
}

/**
 * Obtiene el nombre legible del estado
 */
export function getStoreStatusName(status: StoreStatus): string {
  const statusNames: Record<StoreStatus, string> = {
    active: 'Activa',
    inactive: 'Inactiva',
    closed: 'Cerrada',
  };
  return statusNames[status];
}

/**
 * Crea una configuración de inventario por defecto
 */
export function createDefaultInventorySettings(): StoreInventorySettings {
  return {
    lowStockThreshold: 10,          // 10 unidades por defecto
    enableLowStockAlerts: true,     // Alertas activadas
    autoCalculatePrices: true,      // Calcular precios automáticamente
    defaultProfitMargin: 30,        // 30% de ganancia por defecto
  };
}

/**
 * Formatea una dirección completa como texto
 */
export function formatAddress(address: StoreAddress): string {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.country,
  ];
  
  if (address.zipCode) {
    parts.push(address.zipCode);
  }
  
  return parts.filter(Boolean).join(', ');
}

/**
 * Valida que los datos de una tienda sean correctos
 */
export function validateStoreData(data: CreateStoreData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar nombre
  if (!data.name || data.name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  // Validar dirección
  if (!data.address.street || data.address.street.trim().length === 0) {
    errors.push('La calle es requerida');
  }
  
  if (!data.address.city || data.address.city.trim().length === 0) {
    errors.push('La ciudad es requerida');
  }
  
  if (!data.address.state || data.address.state.trim().length === 0) {
    errors.push('El estado/departamento es requerido');
  }
  
  if (!data.address.country || data.address.country.trim().length === 0) {
    errors.push('El país es requerido');
  }
  
  // Validar teléfono (si se proporciona)
  if (data.phone && !/^\+?[\d\s\-()]+$/.test(data.phone)) {
    errors.push('El teléfono no tiene un formato válido');
  }
  
  // Validar email (si se proporciona)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('El email no tiene un formato válido');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}