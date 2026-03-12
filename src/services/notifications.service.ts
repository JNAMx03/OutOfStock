// 📌 SERVICIO DE NOTIFICACIONES - Lógica de acceso a datos

// ============================================
// IMPORTS
// ============================================
import type {
    Notification,
    CreateNotificationData,
    NotificationPreferences,
} from '@/models/Notification';
import { getDefaultPreferences } from '@/models/Notification';

// ============================================
// CLAVE DE ALMACENAMIENTO LOCAL
// ============================================
// Igual que los otros servicios, guardamos en localStorage
// hasta que conectemos con DynamoDB

const STORAGE_KEY_NOTIFICATIONS = 'inventoryapp_notifications';
const STORAGE_KEY_PREFERENCES = 'inventoryapp_notification_preferences';

// ============================================
// FUNCIONES DEL SERVICIO
// ============================================

/**
 * 📋 GET ALL - Obtiene todas las notificaciones de una tienda
 * @param storeId - ID de la tienda
 * @returns Lista de notificaciones ordenadas (más recientes primero)
 */
export async function getNotifications(storeId: string): Promise<Notification[]> {
    try {
        // Leer del localStorage
        const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
        
        // Filtrar por tienda y ordenar por fecha (más reciente primero)
        return allNotifications
            .filter(n => n.storeId === storeId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        return [];
    }
}

/**
 * ➕ CREATE - Crea una nueva notificación
 * @param data - Datos de la notificación
 * @returns Notificación creada
 */
export async function createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
        // Leer notificaciones existentes
        const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
        
        // Crear la nueva notificación
        const newNotification: Notification = {
            ...data,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        
        // Agregar al inicio (más reciente primero)
        allNotifications.unshift(newNotification);
        
        // Limitar a 100 notificaciones por tienda para no llenar localStorage
        const filtered = allNotifications.filter(n => n.storeId === data.storeId);
        if (filtered.length > 100) {
            // Eliminar las más antiguas
            const toKeep = filtered.slice(0, 100);
            const otherStores = allNotifications.filter(n => n.storeId !== data.storeId);
            localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify([...otherStores, ...toKeep]));
        } else {
            localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(allNotifications));
        }
        
        return newNotification;
        
    } catch (error) {
        console.error('Error al crear notificación:', error);
        throw error;
    }
}

/**
 * ✅ MARK AS READ - Marca una notificación como leída
 * @param notificationId - ID de la notificación
 */
export async function markAsRead(notificationId: string): Promise<void> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
        
        // Encontrar y actualizar la notificación
        const index = allNotifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            allNotifications[index].isRead = true;
            allNotifications[index].readAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(allNotifications));
        }
        
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
}

/**
 * ✅✅ MARK ALL AS READ - Marca TODAS las notificaciones de una tienda como leídas
 * @param storeId - ID de la tienda
 */
export async function markAllAsRead(storeId: string): Promise<void> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
        
        const now = new Date().toISOString();
        
        // Marcar todas las de esta tienda como leídas
        const updated = allNotifications.map(n => {
            if (n.storeId === storeId && !n.isRead) {
                return { ...n, isRead: true, readAt: now };
            }
            return n;
        });
        
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
        
    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
    }
}

/**
 * 🗑️ DELETE - Elimina una notificación
 * @param notificationId - ID de la notificación
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
        
        // Filtrar (eliminar la notificación)
        const filtered = allNotifications.filter(n => n.id !== notificationId);
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(filtered));
        
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
    }
}

/**
 * 🗑️🗑️ DELETE ALL READ - Elimina todas las notificaciones leídas de una tienda
 * Útil para "limpiar" el centro de notificaciones
 * @param storeId - ID de la tienda
 */
export async function deleteAllRead(storeId: string): Promise<void> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
        
        // Mantener las no leídas de esta tienda + todas las de otras tiendas
        const filtered = allNotifications.filter(n => 
            n.storeId !== storeId || !n.isRead
        );
        
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(filtered));
        
    } catch (error) {
        console.error('Error al eliminar notificaciones leídas:', error);
    }
}

/**
 * ⚙️ GET PREFERENCES - Obtiene las preferencias de notificación del usuario
 * @param userId - ID del usuario
 * @returns Preferencias del usuario
 */
export async function getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
        const key = `${STORAGE_KEY_PREFERENCES}_${userId}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Si no tiene preferencias guardadas, devuelve las por defecto
        return getDefaultPreferences();
        
    } catch (error) {
        console.error('Error al obtener preferencias:', error);
        return getDefaultPreferences();
    }
}

/**
 * ⚙️ SAVE PREFERENCES - Guarda las preferencias de notificación del usuario
 * @param userId - ID del usuario
 * @param preferences - Preferencias a guardar
 */
export async function savePreferences(
userId: string,
preferences: NotificationPreferences
): Promise<void> {
    try {
        const key = `${STORAGE_KEY_PREFERENCES}_${userId}`;
        localStorage.setItem(key, JSON.stringify(preferences));
        
    } catch (error) {
        console.error('Error al guardar preferencias:', error);
        throw error;
    }
}

/**
 * 🔍 CHECK DUPLICATES - Verifica si ya existe una alerta similar reciente
 * Evita crear múltiples alertas del mismo producto en poco tiempo
 * @param storeId - ID de la tienda
 * @param type - Tipo de notificación
 * @param referenceId - ID de referencia (producto, venta, etc.)
 * @returns true si ya existe una notificación similar en las últimas 24h
 */
export async function hasDuplicateAlert(
storeId: string,
type: string,
referenceId: string
): Promise<boolean> {
    try {
        const notifications = await getNotifications(storeId);
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        
        // Buscar si ya existe una notificación del mismo tipo para el mismo elemento
        // creada en las últimas 24 horas
        return notifications.some(n => {
            if (n.type !== type) return false;
            if (new Date(n.createdAt) < yesterday) return false;
            
            // Verificar el ID de referencia según el tipo
            if (n.data && 'productId' in n.data && n.data.productId === referenceId) return true;
            if (n.data && 'saleId' in n.data && n.data.saleId === referenceId) return true;
            
            return false;
        });
        
    } catch (error) {
        return false;
    }
}

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
// 
// Este servicio maneja TODAS las operaciones
// con notificaciones (guardar, leer, marcar, eliminar).
// 
// Por ahora usa localStorage igual que los otros
// servicios del proyecto. En el futuro se conectará
// con DynamoDB en AWS.
// 
// Funciones principales:
// - getNotifications: Lista todas las de una tienda
// - createNotification: Crea una nueva
// - markAsRead: Marca una como leída
// - markAllAsRead: Marca todas como leídas
// - deleteNotification: Elimina una
// - deleteAllRead: Limpia las leídas
// - getPreferences / savePreferences: Config del usuario
// - hasDuplicateAlert: Evita alertas repetidas
// ============================================