// src/stores/notifications.ts
// 📌 STORE DE NOTIFICACIONES - Gestiona todo el sistema de alertas

// ============================================
// IMPORTS
// ============================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
    Notification,
    NotificationPreferences,
    StockAlertData,
    DebtAlertData,
} from '@/models/Notification';
import { getDefaultPreferences } from '@/models/Notification';
import * as notificationsService from '@/services/notifications.service';

// ============================================
// STORE DE NOTIFICACIONES
// ============================================

export const useNotificationsStore = defineStore('notifications', () => {
    // ============================================
    // ESTADO (State)
    // ============================================
    
    // Lista de todas las notificaciones de la tienda actual
    const notifications = ref<Notification[]>([]);
    
    // Preferencias de notificación del usuario
    const preferences = ref<NotificationPreferences>(getDefaultPreferences());
    
    // Estado de carga
    const isLoading = ref(false);
    
    // ID de la tienda y usuario actual (para saber qué cargar)
    const currentStoreId = ref<string | null>(null);
    const currentUserId = ref<string | null>(null);

    // ============================================
    // GETTERS (Computed)
    // ============================================
    
    /**
     * Solo las notificaciones NO leídas
     */
    const unreadNotifications = computed(() =>
        notifications.value.filter(n => !n.isRead)
    );
    
    /**
     * Conteo de notificaciones no leídas
     * Este es el número que se muestra en el badge del ícono 🔔
     */
    const unreadCount = computed(() => unreadNotifications.value.length);
    
    /**
     * ¿Hay notificaciones sin leer?
     * Para mostrar/ocultar el badge
     */
    const hasUnread = computed(() => unreadCount.value > 0);
    
    /**
     * Solo las alertas de stock bajo (no leídas)
     * Para el Dashboard de inventario
     */
    const stockAlerts = computed(() =>
        notifications.value.filter(n => n.type === 'stock_alert' && !n.isRead)
    );
    
    /**
     * Solo las alertas de deuda (no leídas)
     * Para el módulo de cartera
     */
    const debtAlerts = computed(() =>
        notifications.value.filter(n => n.type === 'debt_alert' && !n.isRead)
    );
    
    /**
     * Invitaciones pendientes (no leídas)
     */
    const pendingInvitations = computed(() =>
        notifications.value.filter(n => n.type === 'invitation' && !n.isRead)
    );
    
    /**
     * Notificaciones agrupadas por tipo para la UI
     */
    const groupedByType = computed(() => {
        const groups: Record<string, Notification[]> = {};
        notifications.value.forEach(n => {
        if (!groups[n.type]) groups[n.type] = [];
        groups[n.type].push(n);
        });
        return groups;
    });

    // ============================================
    // ACCIONES (Actions)
    // ============================================
    
    /**
     * 📋 FETCH - Carga las notificaciones de la tienda actual
     * @param storeId - ID de la tienda
     * @param userId - ID del usuario (para cargar preferencias)
     */
    async function fetchNotifications(storeId: string, userId: string) {
        isLoading.value = true;
        currentStoreId.value = storeId;
        currentUserId.value = userId;
        
        try {
            // Cargar notificaciones y preferencias en paralelo
            const [fetchedNotifications, fetchedPreferences] = await Promise.all([
                notificationsService.getNotifications(storeId),
                notificationsService.getPreferences(userId),
            ]);
            
            notifications.value = fetchedNotifications;
            preferences.value = fetchedPreferences;
            
            return { success: true };
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
            return { success: false, error: 'Error al cargar notificaciones' };
        } finally {
            isLoading.value = false;
        }
    }
    
    /**
     * ✅ MARK AS READ - Marca una notificación como leída
     * @param notificationId - ID de la notificación
     */
    async function markAsRead(notificationId: string) {
        try {
            // Actualizar localmente (inmediato para mejor UX)
            const index = notifications.value.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                notifications.value[index].isRead = true;
                notifications.value[index].readAt = new Date().toISOString();
            }
            
            // Persistir en el servicio
            await notificationsService.markAsRead(notificationId);
            
            return { success: true };
        } catch (error) {
            console.error('Error al marcar como leída:', error);
            return { success: false };
        }
    }
    
    /**
     * ✅✅ MARK ALL AS READ - Marca TODAS como leídas
     */
    async function markAllAsRead() {
        if (!currentStoreId.value) return { success: false };
        
        try {
        // Actualizar localmente
            const now = new Date().toISOString();
            notifications.value = notifications.value.map(n => ({
                ...n,
                isRead: true,
                readAt: n.readAt || now,
            }));
            
            // Persistir
            await notificationsService.markAllAsRead(currentStoreId.value);
            
            return { success: true };
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
            return { success: false };
        }
    }
    
    /**
     * 🗑️ DELETE - Elimina una notificación
     * @param notificationId - ID de la notificación
     */
    async function deleteNotification(notificationId: string) {
        try {
            // Eliminar localmente
            notifications.value = notifications.value.filter(n => n.id !== notificationId);
            
            // Persistir
            await notificationsService.deleteNotification(notificationId);
            
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            return { success: false };
        }
    }
    
    /**
     * 🧹 CLEAR READ - Limpia todas las notificaciones leídas
     */
    async function clearReadNotifications() {
        if (!currentStoreId.value) return { success: false };
        
        try {
            // Eliminar localmente las leídas
            notifications.value = notifications.value.filter(n => !n.isRead);
            
            // Persistir
            await notificationsService.deleteAllRead(currentStoreId.value);
            
            return { success: true };
        } catch (error) {
            console.error('Error al limpiar notificaciones:', error);
            return { success: false };
        }
    }
    
    /**
     * 🚨 CREATE STOCK ALERT - Crea una alerta de stock bajo
     * Se llama automáticamente desde el inventario store
     * @param storeId - ID de la tienda
     * @param storeName - Nombre de la tienda
     * @param data - Datos del producto con stock bajo
     */
    async function createStockAlert(
        storeId: string,
        storeName: string,
        data: StockAlertData
    ) {
        // Verificar que las alertas de stock estén habilitadas
        if (!preferences.value.stockAlerts) return;
        
        // Verificar que no exista ya una alerta similar reciente
        const isDuplicate = await notificationsService.hasDuplicateAlert(
            storeId,
            'stock_alert',
            data.productId
        );
        if (isDuplicate) return;
        
        try {
            // Determinar prioridad según nivel de stock
            // Si el stock es 0: prioridad alta (rojo)
            // Si el stock es menor al mínimo: prioridad media (amarillo)
            const priority = data.currentStock === 0 ? 'high' : 'medium';
            
            const title = data.currentStock === 0
                ? '⚠️ Sin Stock'
                : '📦 Stock Bajo';
            
            const message = data.currentStock === 0
                ? `${data.productName} se ha quedado sin stock`
                : `${data.productName} tiene solo ${data.currentStock} unidades (mínimo: ${data.minimumStock})`;
            
            // Crear la notificación
            const newNotification = await notificationsService.createNotification({
                type: 'stock_alert',
                priority,
                title,
                message,
                storeId,
                storeName,
                data,
            });
            
            // Agregar al estado local (al inicio de la lista)
            notifications.value.unshift(newNotification);
        
        } catch (error) {
            console.error('Error al crear alerta de stock:', error);
        }
    }
    
    /**
     * 💰 CREATE DEBT ALERT - Crea una alerta de deuda
     * Se llama automáticamente desde el store de ventas
     * @param storeId - ID de la tienda
     * @param storeName - Nombre de la tienda
     * @param data - Datos de la deuda
     */
    async function createDebtAlert(
        storeId: string,
        storeName: string,
        data: DebtAlertData
    ) {
        // Verificar preferencias
        if (!preferences.value.debtAlerts) return;
        
        // Verificar duplicados
        const isDuplicate = await notificationsService.hasDuplicateAlert(
            storeId,
            'debt_alert',
            data.saleId
        );
        if (isDuplicate) return;
        
        try {
            // Determinar prioridad según días vencida
            const priority = (data.daysOverdue && data.daysOverdue > 7) ? 'high' : 'medium';
            
            const title = data.daysOverdue
                ? `💸 Deuda Vencida (${data.daysOverdue} días)`
                : '💸 Deuda Pendiente';
            
            const message = `${data.clientName} debe $${data.debtAmount.toLocaleString('es-CO')} (${data.saleNumber})`;
            
            const newNotification = await notificationsService.createNotification({
                type: 'debt_alert',
                priority,
                title,
                message,
                storeId,
                storeName,
                data,
            });
            
            notifications.value.unshift(newNotification);
        
        } catch (error) {
            console.error('Error al crear alerta de deuda:', error);
        }
    }
    
    /**
     * ⚙️ UPDATE PREFERENCES - Guarda las preferencias del usuario
     * @param newPreferences - Nuevas preferencias
     */
    async function updatePreferences(newPreferences: NotificationPreferences) {
        if (!currentUserId.value) return { success: false };
        
        try {
            preferences.value = newPreferences;
            await notificationsService.savePreferences(currentUserId.value, newPreferences);
            return { success: true };
        } catch (error) {
            console.error('Error al guardar preferencias:', error);
            return { success: false };
        }
    }
    
    /**
     * 🔄 REFRESH - Recarga las notificaciones
     */
    async function refresh() {
        if (!currentStoreId.value || !currentUserId.value) return;
        await fetchNotifications(currentStoreId.value, currentUserId.value);
    }
    
    /**
     * 🧹 CLEAR - Limpia el store (al hacer logout o cambiar tienda)
     */
    function clear() {
        notifications.value = [];
        currentStoreId.value = null;
        currentUserId.value = null;
        preferences.value = getDefaultPreferences();
    }

    // ============================================
    // RETORNAR
    // ============================================
    return {
        // Estado
        notifications,
        preferences,
        isLoading,
        
        // Getters
        unreadNotifications,
        unreadCount,
        hasUnread,
        stockAlerts,
        debtAlerts,
        pendingInvitations,
        groupedByType,
        
        // Acciones
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearReadNotifications,
        createStockAlert,
        createDebtAlert,
        updatePreferences,
        refresh,
        clear,
    };
});

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
// 
// Este store es el "cerebro" de las notificaciones.
// 
// GUARDA:
// - Lista de todas las notificaciones
// - Preferencias del usuario
// 
// CALCULA:
// - Cuántas hay sin leer (para el badge 🔔)
// - Separa por tipo (stock, deudas, invitaciones)
// 
// PERMITE:
// - Marcar como leídas (una o todas)
// - Eliminar notificaciones
// - CREAR alertas de stock bajo (automático)
// - CREAR alertas de deuda (automático)
// - Guardar preferencias del usuario
// 
// Otros stores (inventory, sales) llamarán a
// createStockAlert() y createDebtAlert() cuando
// detecten situaciones que requieren alertar.
// ============================================