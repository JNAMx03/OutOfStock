<!-- src/components/shared/NotificationsPanel.vue -->
<!-- 📌 PANEL DE NOTIFICACIONES - Lista completa de alertas -->

<template>
    <ion-header class="ion-no-border">
        <ion-toolbar>
            <ion-title>Notificaciones</ion-title>

            <!-- Botones de acción en el header -->
            <ion-buttons slot="end">
                <!-- Marcar todo como leído (solo visible si hay notificaciones sin leer) -->
                <ion-button
                    v-if="unreadCount > 0"
                    fill="clear"
                    size="small"
                    color="primary"
                    @click="markAllAsRead"
                    >
                    Leer todo
                </ion-button>

                <!-- Cerrar el panel -->
                <ion-button fill="clear" @click="$emit('close')">
                    <ion-icon slot="icon-only" :icon="closeIcon" />
                </ion-button>
            </ion-buttons>
        </ion-toolbar>

        <!-- Filtros (Todas / Sin leer / Urgentes) -->
        <ion-toolbar>
            <ion-segment v-model="activeFilter" class="filter-segment">
                <ion-segment-button value="all">
                    <ion-label>Todas</ion-label>
                </ion-segment-button>
                <ion-segment-button value="unread">
                    <ion-label>
                        Sin leer
                        <span v-if="unreadCount > 0" class="filter-badge">{{ unreadCount }}</span>
                    </ion-label>
                </ion-segment-button>
                <ion-segment-button value="urgent">
                    <ion-label>Urgentes</ion-label>
                </ion-segment-button>
            </ion-segment>
        </ion-toolbar>
    </ion-header>

    <ion-content class="notifications-content">

        <!-- Estado vacío: cuando no hay notificaciones -->
        <div v-if="filteredNotifications.length === 0" class="empty-state">
            <ion-icon :icon="notificationsOffIcon" class="empty-icon" />
            <h3>{{ emptyStateTitle }}</h3>
            <p>{{ emptyStateMessage }}</p>
        </div>

        <!-- Lista de notificaciones -->
        <ion-list v-else lines="none" class="notifications-list">
            <div
                v-for="notification in filteredNotifications"
                :key="notification.id"
                class="notification-item"
                :class="[
                `priority-${notification.priority}`,
                { 'is-unread': notification.status === 'unread' }
                ]"
                @click="handleNotificationClick(notification)"
            >
                <!-- Franja de color izquierda (indica prioridad) -->
                <div class="priority-bar" :class="`bar-${notification.priority}`"></div>

                <!-- Ícono de la notificación -->
                <div class="notif-icon-wrapper" :class="`icon-bg-${notification.priority}`">
                    <ion-icon :icon="getIcon(notification.icon)" class="notif-icon" />
                </div>

                <!-- Contenido de la notificación -->
                <div class="notif-content">
                    <div class="notif-header">
                        <span class="notif-title">{{ notification.title }}</span>
                        <!-- Punto rojo para notificaciones sin leer -->
                        <div v-if="notification.status === 'unread'" class="unread-dot"></div>
                    </div>
                    <p class="notif-message">{{ notification.message }}</p>
                    <div class="notif-footer">
                        <!-- Nombre de la tienda -->
                        <span v-if="notification.storeName" class="store-tag">
                            <ion-icon :icon="storefrontIcon" /> {{ notification.storeName }}
                        </span>
                        <!-- Tiempo transcurrido -->
                        <span class="notif-time">{{ formatTime(notification.createdAt) }}</span>
                    </div>
                </div>

                <!-- Botón de descarte -->
                <ion-button
                    fill="clear"
                    size="small"
                    class="dismiss-btn"
                    @click.stop="dismissNotification(notification.id)"
                >
                    <ion-icon slot="icon-only" :icon="closeCircleIcon" />
                </ion-button>
            </div>
        </ion-list>

        <!-- Botón para limpiar notificaciones leídas -->
        <div v-if="hasReadNotifications" class="clear-section">
        <ion-button
            fill="outline"
            color="medium"
            size="small"
            expand="block"
            @click="clearReadNotifications"
        >
            <ion-icon slot="start" :icon="trashIcon" />
            Limpiar notificaciones leídas
        </ion-button>
        </div>

    </ion-content>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { ref, computed } from 'vue';
    import { useRouter } from 'vue-router';
    import {
        IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
        IonIcon, IonContent, IonList, IonSegment, IonSegmentButton,
        IonLabel,
    } from '@ionic/vue';
    import {
        close as closeIcon,
        closeCircle as closeCircleIcon,
        trash as trashIcon,
        storefront as storefrontIcon,
        notificationsOff as notificationsOffIcon,
        alertCircle, alertCircleOutline, warning,
        timeOutline, cashOutline, mailOpenOutline,
        checkmarkCircleOutline, informationCircleOutline,
    } from 'ionicons/icons';
    import { useNotificationsStore } from '@/stores/notifications';
    import type { Notification } from '@/models/Notification';

    // ============================================
    // EMITS
    // ============================================
    // Le dice al componente padre que el usuario quiere cerrar el panel
    const emit = defineEmits<{ (e: 'close'): void }>();

    // ============================================
    // STORE Y ROUTER
    // ============================================
    const notificationsStore = useNotificationsStore();
    const router = useRouter();

    // ============================================
    // ESTADO LOCAL
    // ============================================
    // Filtro activo: 'all' | 'unread' | 'urgent'
    const activeFilter = ref<'all' | 'unread' | 'urgent'>('all');

    // ============================================
    // GETTERS
    // ============================================
    const unreadCount = computed(() => notificationsStore.unreadCount);

    // Notificaciones filtradas según el tab activo
    const filteredNotifications = computed(() => {
        const sorted = notificationsStore.sortedNotifications;
        switch (activeFilter.value) {
            case 'unread':
            return sorted.filter((n) => n.status === 'unread');
            case 'urgent':
            return sorted.filter((n) => n.priority === 'high');
            default:
            return sorted;
        }
    });

    // ¿Hay notificaciones ya leídas? (para mostrar el botón de limpiar)
    const hasReadNotifications = computed(() =>
        notificationsStore.notifications.some((n) => n.status === 'read')
    );

    // Texto del estado vacío según el filtro activo
    const emptyStateTitle = computed(() => {
        switch (activeFilter.value) {
            case 'unread': return 'Todo al día';
            case 'urgent': return 'Sin alertas urgentes';
            default: return 'Sin notificaciones';
        }
    });

    const emptyStateMessage = computed(() => {
        switch (activeFilter.value) {
            case 'unread': return 'No tienes notificaciones pendientes por leer.';
            case 'urgent': return 'No hay alertas de alta prioridad en este momento.';
            default: return 'Aquí aparecerán las alertas de stock bajo, deudas y más.';
        }
    });

    // ============================================
    // MAPEO DE ÍCONOS
    // ============================================
    // Convierte el string del ícono guardado en la notificación al objeto de ionicons
    function getIcon(iconName: string) {
        const iconMap: Record<string, any> = {
            'alert-circle': alertCircle,
            'alert-circle-outline': alertCircleOutline,
            'warning': warning,
            'time-outline': timeOutline,
            'cash-outline': cashOutline,
            'mail-open-outline': mailOpenOutline,
            'checkmark-circle-outline': checkmarkCircleOutline,
            'information-circle-outline': informationCircleOutline,
        };
        return iconMap[iconName] || informationCircleOutline;
    }

    // ============================================
    // FORMATEO DE TIEMPO
    // ============================================
    // Muestra el tiempo de manera amigable: "hace 5 min", "hace 2 horas", etc.
    function formatTime(dateString: string): string {
        const diff = Date.now() - new Date(dateString).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Ahora mismo';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        return new Date(dateString).toLocaleDateString('es-CO', {
            day: 'numeric', month: 'short',
        });
    }

    // ============================================
    // ACCIONES
    // ============================================

    /**
     * Al hacer clic en una notificación:
     * 1. La marca como leída
     * 2. Navega al elemento relacionado si corresponde
     * 3. Cierra el panel
     */
    function handleNotificationClick(notification: Notification): void {
        notificationsStore.markAsRead(notification.id);

        // Navega a la página relacionada según el tipo
        if (notification.relatedType === 'product') {
            router.push('/tabs/inventory');
        } else if (notification.relatedType === 'sale') {
            router.push('/tabs/sales');
        } else if (notification.relatedType === 'store') {
            router.push('/tabs/dashboard');
        }

        emit('close');
    }

    function markAllAsRead(): void {
        notificationsStore.markAllAsRead();
    }

    function dismissNotification(id: string): void {
        notificationsStore.dismissNotification(id);
    }

    function clearReadNotifications(): void {
        notificationsStore.clearReadNotifications();
    }
</script>

<style scoped>
    /* ============================================
    CONTENIDO PRINCIPAL
    ============================================ */
    .notifications-content {
        --background: var(--ion-color-light);
    }

    /* ============================================
    FILTROS
    ============================================ */
    .filter-segment {
        padding: 0 12px 8px;
    }

    /* Badge dentro del tab "Sin leer" */
    .filter-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--ion-color-danger);
        color: white;
        font-size: 10px;
        font-weight: 700;
        min-width: 16px;
        height: 16px;
        border-radius: 8px;
        padding: 0 3px;
        margin-left: 4px;
        vertical-align: middle;
    }

    /* ============================================
    ESTADO VACÍO
    ============================================ */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 32px;
        text-align: center;
    }

    .empty-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .empty-state h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px;
        color: var(--ion-color-dark);
    }

    .empty-state p {
        font-size: 14px;
        color: var(--ion-color-medium);
        margin: 0;
        line-height: 1.5;
    }

    /* ============================================
    LISTA DE NOTIFICACIONES
    ============================================ */
    .notifications-list {
        padding: 8px 12px;
        background: transparent;
    }

    /* Cada tarjeta de notificación */
    .notification-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: var(--ion-background-color, white);
        border-radius: 12px;
        margin-bottom: 8px;
        padding: 12px 8px 12px 0;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .notification-item:active {
        transform: scale(0.98);
    }

    /* Notificaciones no leídas tienen fondo ligeramente diferente */
    .notification-item.is-unread {
        background: color-mix(in srgb, var(--ion-color-primary) 5%, white);
    }

    /* ============================================
    BARRA DE PRIORIDAD (franja izquierda de color)
    ============================================ */
    .priority-bar {
        width: 4px;
        min-height: 100%;
        align-self: stretch;
        border-radius: 0 4px 4px 0;
        flex-shrink: 0;
    }

    .bar-high   { background: var(--ion-color-danger); }
    .bar-medium { background: var(--ion-color-warning); }
    .bar-low    { background: var(--ion-color-primary); }

    /* ============================================
    ÍCONO
    ============================================ */
    .notif-icon-wrapper {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .icon-bg-high   { background: rgba(var(--ion-color-danger-rgb), 0.15); }
    .icon-bg-medium { background: rgba(var(--ion-color-warning-rgb), 0.15); }
    .icon-bg-low    { background: rgba(var(--ion-color-primary-rgb), 0.15); }

    .notif-icon {
        font-size: 20px;
    }

    .icon-bg-high .notif-icon   { color: var(--ion-color-danger); }
    .icon-bg-medium .notif-icon { color: var(--ion-color-warning); }
    .icon-bg-low .notif-icon    { color: var(--ion-color-primary); }

    /* ============================================
    CONTENIDO DE TEXTO
    ============================================ */
    .notif-content {
        flex: 1;
        min-width: 0; /* Necesario para que el texto haga ellipsis correctamente */
    }

    .notif-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;
    }

    .notif-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-dark);
    }

    /* Punto rojo para notificaciones no leídas */
    .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ion-color-danger);
        flex-shrink: 0;
    }

    .notif-message {
        font-size: 13px;
        color: var(--ion-color-medium-shade);
        margin: 0 0 6px;
        line-height: 1.4;
        /* Limita a 2 líneas con ellipsis */
        display: -webkit-box;
        /* -webkit-line-clamp: 2; */
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .notif-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .store-tag {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 11px;
        color: var(--ion-color-primary);
        background: rgba(var(--ion-color-primary-rgb), 0.1);
        padding: 2px 6px;
        border-radius: 4px;
    }

    .store-tag ion-icon {
        font-size: 10px;
    }

    .notif-time {
        font-size: 11px;
        color: var(--ion-color-medium);
        margin-left: auto;
    }

    /* ============================================
    BOTÓN DE DESCARTAR
    ============================================ */
    .dismiss-btn {
        --padding-start: 4px;
        --padding-end: 4px;
        color: var(--ion-color-medium);
        flex-shrink: 0;
        align-self: flex-start;
        margin-top: -2px;
    }

    /* ============================================
    BOTÓN LIMPIAR NOTIFICACIONES
    ============================================ */
    .clear-section {
        padding: 8px 16px 24px;
    }
</style>