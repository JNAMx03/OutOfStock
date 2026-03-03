// 📌 STORE DE NOTIFICACIONES - Estado global de todas las alertas de la app

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
    Notification,
    NotificationPreferences,
    CreateNotificationData,
} from '@/models/Notification';
import { defaultNotificationPreferences } from '@/models/Notification';

// ============================================
// CLAVE PARA LOCALSTORAGE
// ============================================
// Guardamos las notificaciones en localStorage para que persistan
// entre sesiones (no se pierdan si el usuario cierra la app)
const STORAGE_KEY = 'inventory_notifications';
const PREFS_KEY = 'inventory_notification_prefs';

// ============================================
// STORE DE NOTIFICACIONES
// ============================================

export const useNotificationsStore = defineStore('notifications', () => {
    // ============================================
    // ESTADO (State)
    // ============================================

    // Lista de todas las notificaciones
    const notifications = ref<Notification[]>([]);

    // Preferencias del usuario sobre qué notificaciones recibir
    const preferences = ref<NotificationPreferences>({ ...defaultNotificationPreferences });

    // Indica si el panel de notificaciones está abierto
    const isPanelOpen = ref(false);

    // ============================================
    // GETTERS (Computed)
    // ============================================

    // Solo las notificaciones NO leídas
    const unreadNotifications = computed(() =>
        notifications.value.filter((n) => n.status === 'unread')
    );

    // Cantidad de notificaciones sin leer (para el badge del ícono)
    const unreadCount = computed(() => unreadNotifications.value.length);

    // Notificaciones agrupadas por prioridad (primero las más urgentes)
    const sortedNotifications = computed(() =>
        [...notifications.value]
        .filter((n) => n.status !== 'dismissed')
        .sort((a, b) => {
            // Primero las no leídas
            if (a.status === 'unread' && b.status !== 'unread') return -1;
            if (a.status !== 'unread' && b.status === 'unread') return 1;

            // Luego por prioridad
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // Por último, las más recientes primero
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
    );

    // Solo alertas de alta prioridad sin leer (para mostrar en el banner)
    const urgentNotifications = computed(() =>
        unreadNotifications.value.filter((n) => n.priority === 'high')
    );

    // ¿Hay notificaciones urgentes sin leer?
    const hasUrgentAlerts = computed(() => urgentNotifications.value.length > 0);

    // ============================================
    // ACCIONES - CRUD DE NOTIFICACIONES
    // ============================================

    /**
     * Carga las notificaciones guardadas en localStorage
     * Se llama cuando la app inicia
     */
    function loadFromStorage(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                notifications.value = JSON.parse(saved);
            }

            const savedPrefs = localStorage.getItem(PREFS_KEY);
            if (savedPrefs) {
                preferences.value = { ...defaultNotificationPreferences, ...JSON.parse(savedPrefs) };
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
    }

    /**
     * Guarda las notificaciones en localStorage
     * Se llama automáticamente después de cada cambio
     */
    function saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.value));
        } catch (error) {
            console.error('Error al guardar notificaciones:', error);
        }
    }

    /**
     * ➕ Crea una nueva notificación
     * @param data - Datos de la notificación a crear
     * @returns La notificación creada
     */
    function addNotification(data: CreateNotificationData): Notification {
        const newNotification: Notification = {
            ...data,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'unread',
            createdAt: new Date().toISOString(),
        };

        // Agrega al inicio de la lista (las más nuevas primero)
        notifications.value.unshift(newNotification);

        // Limita a máximo 100 notificaciones para no llenar el storage
        if (notifications.value.length > 100) {
            notifications.value = notifications.value.slice(0, 100);
        }

        saveToStorage();
        return newNotification;
    }

    /**
     * ✅ Marca una notificación como leída
     * @param id - ID de la notificación
     */
    function markAsRead(id: string): void {
        const notification = notifications.value.find((n) => n.id === id);
        if (notification && notification.status === 'unread') {
            notification.status = 'read';
            notification.readAt = new Date().toISOString();
            saveToStorage();
        }
    }

    /**
     * ✅ Marca TODAS las notificaciones como leídas
     */
    function markAllAsRead(): void {
        const now = new Date().toISOString();
        notifications.value.forEach((n) => {
            if (n.status === 'unread') {
                n.status = 'read';
                n.readAt = now;
            }
        });
        saveToStorage();
    }

    /**
     * ❌ Descarta (oculta) una notificación
     * @param id - ID de la notificación
     */
    function dismissNotification(id: string): void {
        const notification = notifications.value.find((n) => n.id === id);
        if (notification) {
            notification.status = 'dismissed';
            saveToStorage();
        }
    }

    /**
     * 🗑️ Elimina notificaciones leídas (limpieza)
     */
    function clearReadNotifications(): void {
        notifications.value = notifications.value.filter((n) => n.status !== 'read');
        saveToStorage();
    }

    /**
     * 🗑️ Elimina TODAS las notificaciones
     */
    function clearAllNotifications(): void {
        notifications.value = [];
        saveToStorage();
    }

    /**
     * Evita notificaciones duplicadas del mismo tipo para el mismo producto/cliente
     * Útil para no crear 10 alertas de "stock bajo" para el mismo producto
     * @param type - Tipo de notificación
     * @param relatedId - ID del elemento relacionado
     */
    function isDuplicate(type: string, relatedId: string, storeId: string): boolean {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        return notifications.value.some(
            (n) =>
                n.type === type &&
                n.relatedId === relatedId &&
                n.storeId === storeId &&
                n.status !== 'dismissed' &&
                n.createdAt > oneDayAgo // Solo evita duplicados del mismo día
        );
    }

    // ============================================
    // ACCIONES - PREFERENCIAS
    // ============================================

    /**
     * ⚙️ Actualiza las preferencias de notificaciones del usuario
     * @param updates - Campos a actualizar
     */
    function updatePreferences(updates: Partial<NotificationPreferences>): void {
        preferences.value = { ...preferences.value, ...updates };
        localStorage.setItem(PREFS_KEY, JSON.stringify(preferences.value));
    }

    // ============================================
    // ACCIONES - PANEL
    // ============================================

    /** Abre el panel de notificaciones */
    function openPanel(): void {
        isPanelOpen.value = true;
    }

    /** Cierra el panel de notificaciones */
    function closePanel(): void {
        isPanelOpen.value = false;
    }

    /** Alterna entre abierto y cerrado */
    function togglePanel(): void {
        isPanelOpen.value = !isPanelOpen.value;
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    // Carga las notificaciones al crear el store
    loadFromStorage();

    // ============================================
    // RETORNAR (exponer al resto de la app)
    // ============================================
    return {
        // Estado
        notifications,
        preferences,
        isPanelOpen,

        // Getters
        unreadNotifications,
        unreadCount,
        sortedNotifications,
        urgentNotifications,
        hasUrgentAlerts,

        // Acciones - Notificaciones
        loadFromStorage,
        addNotification,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearReadNotifications,
        clearAllNotifications,
        isDuplicate,

        // Acciones - Preferencias
        updatePreferences,

        // Acciones - Panel
        openPanel,
        closePanel,
        togglePanel,
    };
});
