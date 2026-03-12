<template>
    <!--
        IonPage: Contenedor de página Ionic
        Como es un modal, tiene su propio header con botón de cerrar
    -->
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <!-- Botón cerrar (izquierda) -->
                <ion-buttons slot="start">
                    <ion-button @click="closeModal">
                        <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                
                <ion-title>
                    Notificaciones
                    <!-- Badge con conteo de no leídas -->
                    <ion-badge
                        v-if="notificationsStore.hasUnread"
                        color="danger"
                        class="header-badge"
                    >
                        {{ notificationsStore.unreadCount }}
                    </ion-badge>
                </ion-title>
                
                <!-- Opciones del header (derecha) -->
                <ion-buttons slot="end">
                    <!-- Marcar todas como leídas -->
                    <ion-button
                        v-if="notificationsStore.hasUnread"
                        fill="clear"
                        @click="markAllRead"
                    >
                        <small>Leer todo</small>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
            
            <!-- Segmento para filtrar por tipo -->
            <ion-toolbar>
                <ion-segment v-model="selectedFilter" scrollable>
                    <ion-segment-button value="all">
                        <ion-label>Todas</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="stock_alert">
                        <ion-label>📦 Stock</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="debt_alert">
                        <ion-label>💸 Deudas</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="invitation">
                        <ion-label>👤 Invitaciones</ion-label>
                    </ion-segment-button>
                </ion-segment>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <!-- Pull to refresh -->
            <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
                <ion-refresher-content></ion-refresher-content>
            </ion-refresher>

            <!-- Estado de carga -->
            <div v-if="notificationsStore.isLoading" class="loading-state">
                <ion-spinner name="crescent" color="primary"></ion-spinner>
                <p>Cargando notificaciones...</p>
            </div>

            <!-- Lista de notificaciones -->
            <div v-else-if="filteredNotifications.length > 0">
                
                <!-- Botón limpiar leídas (si hay leídas) -->
                <div v-if="hasReadNotifications" class="clear-read-bar">
                    <ion-button
                        fill="clear"
                        size="small"
                        color="medium"
                        @click="confirmClearRead"
                    >
                        <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                        Limpiar leídas
                    </ion-button>
                </div>
                
                <!-- 
                ion-list con sliding items:
                Al deslizar una notificación a la izquierda,
                aparecen opciones (eliminar, marcar leída)
                -->
                <ion-list class="notifications-list">
                    <ion-item-sliding
                        v-for="notification in filteredNotifications"
                        :key="notification.id"
                    >
                        <!-- Notificación principal -->
                        <ion-item
                        :class="['notification-item', { 'unread': !notification.isRead }]"
                        @click="handleNotificationClick(notification)"
                        button
                        :detail="false"
                        >
                            <!-- Ícono del tipo de notificación -->
                            <div
                                slot="start"
                                :class="['notif-icon', `notif-icon--${notification.priority}`]"
                            >
                                <ion-icon :icon="getIcon(notification.type)"></ion-icon>
                            </div>
                            
                            <ion-label class="ion-text-wrap">
                                <!-- Título y badge de no leída -->
                                <div class="notif-header">
                                    <h2>{{ notification.title }}</h2>
                                    <!-- Punto rojo si no está leída -->
                                    <div v-if="!notification.isRead" class="unread-dot"></div>
                                </div>
                                
                                <!-- Mensaje descriptivo -->
                                <p class="notif-message">{{ notification.message }}</p>
                                
                                <!-- Footer: tienda + fecha -->
                                <div class="notif-footer">
                                    <ion-badge
                                        :color="getColor(notification.priority)"
                                        class="priority-badge"
                                    >
                                        {{ getPriorityName(notification.priority) }}
                                    </ion-badge>
                                    <span class="notif-date">
                                        {{ formatDate(notification.createdAt) }}
                                    </span>
                                </div>
                            </ion-label>
                        </ion-item>
                        
                        <!-- Opciones al deslizar (swipe options) -->
                        <ion-item-options side="end">
                            <!-- Marcar como leída / no leída -->
                            <ion-item-option
                                v-if="!notification.isRead"
                                color="primary"
                                @click="markRead(notification.id)"
                            >
                                <ion-icon :icon="checkmarkOutline" slot="top"></ion-icon>
                                Leída
                            </ion-item-option>
                            
                            <!-- Eliminar -->
                            <ion-item-option
                                color="danger"
                                @click="deleteNotif(notification.id)"
                            >
                                <ion-icon :icon="trashOutline" slot="top"></ion-icon>
                                Eliminar
                            </ion-item-option>
                        </ion-item-options>
                        
                    </ion-item-sliding>
                </ion-list>
            </div>

            <!-- Estado vacío -->
            <div v-else class="empty-state">
                <ion-icon :icon="notificationsOutline" class="empty-icon"></ion-icon>
                <h2>Sin notificaciones</h2>
                <p v-if="selectedFilter === 'all'">
                    No tienes notificaciones en este momento
                </p>
                <p v-else>
                    No hay notificaciones de este tipo
                </p>
                <ion-button fill="outline" @click="selectedFilter = 'all'" v-if="selectedFilter !== 'all'">
                    Ver todas
                </ion-button>
            </div>

        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { ref, computed } from 'vue';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonButton,
        IonTitle,
        IonContent,
        IonList,
        IonItem,
        IonItemSliding,
        IonItemOptions,
        IonItemOption,
        IonLabel,
        IonIcon,
        IonBadge,
        IonSegment,
        IonSegmentButton,
        IonSpinner,
        IonRefresher,
        IonRefresherContent,
        modalController,
        alertController,
        toastController,
    } from '@ionic/vue';
    import {
        closeOutline,
        notificationsOutline,
        checkmarkOutline,
        trashOutline,
        cubeOutline,
        cashOutline,
        personAddOutline,
        cartOutline,
        informationCircleOutline,
    } from 'ionicons/icons';

    import { useNotificationsStore } from '@/stores/notifications';
    import type { Notification, NotificationType, NotificationPriority } from '@/models/Notification';
    import {
        getNotificationColor,
        formatNotificationDate,
    } from '@/models/Notification';

    // ============================================
    // COMPOSABLES
    // ============================================
    const notificationsStore = useNotificationsStore();

    // ============================================
    // ESTADO LOCAL
    // ============================================

    // Filtro seleccionado en el segmento
    const selectedFilter = ref<'all' | NotificationType>('all');

    // ============================================
    // COMPUTED
    // ============================================

    /**
     * Notificaciones filtradas según el segmento seleccionado
     */
    const filteredNotifications = computed(() => {
        if (selectedFilter.value === 'all') {
            return notificationsStore.notifications;
        }
        return notificationsStore.notifications.filter(
            n => n.type === selectedFilter.value
        );
    });

    /**
     * ¿Hay notificaciones leídas para mostrar el botón "Limpiar"?
     */
    const hasReadNotifications = computed(() =>
        notificationsStore.notifications.some(n => n.isRead)
    );

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Cierra el modal
     */
    async function closeModal() {
        await modalController.dismiss();
    }

    /**
     * Maneja el click en una notificación
     * - La marca como leída
     * - En el futuro: navega a la sección correspondiente
     */
    async function handleNotificationClick(notification: Notification) {
        // Marcar como leída al tocar
        if (!notification.isRead) {
            await notificationsStore.markAsRead(notification.id);
        }
        
        // TODO Fase 8+: Navegar según el tipo de notificación
        // if (notification.type === 'stock_alert') {
        //   closeModal();
        //   router.push('/tabs/inventory');
        // }
    }

    /**
     * Marca una notificación como leída y cierra el sliding
     */
    async function markRead(notificationId: string) {
        await notificationsStore.markAsRead(notificationId);
    }

    /**
     * Elimina una notificación con confirmación
     */
    async function deleteNotif(notificationId: string) {
        await notificationsStore.deleteNotification(notificationId);
        await showToast('Notificación eliminada', 'medium');
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    async function markAllRead() {
        await notificationsStore.markAllAsRead();
        await showToast('Todas marcadas como leídas', 'success');
    }

    /**
     * Solicita confirmación antes de limpiar leídas
     */
    async function confirmClearRead() {
        const alert = await alertController.create({
            header: 'Limpiar notificaciones',
            message: '¿Eliminar todas las notificaciones que ya leíste?',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                },
                {
                    text: 'Limpiar',
                    role: 'destructive',
                    handler: async () => {
                    await notificationsStore.clearReadNotifications();
                    await showToast('Notificaciones leídas eliminadas', 'medium');
                    },
                },
            ],
        });
        await alert.present();
    }

    /**
     * Pull to refresh
     */
    async function handleRefresh(event: any) {
        await notificationsStore.refresh();
        event.target.complete();
    }

    /**
     * Obtiene el ícono de Ionicons para el tipo de notificación
     */
    function getIcon(type: NotificationType): any {
        const icons: Record<NotificationType, any> = {
            stock_alert: cubeOutline,
            debt_alert: cashOutline,
            invitation: personAddOutline,
            sale_update: cartOutline,
            system: informationCircleOutline,
        };
        return icons[type];
    }

    /**
     * Obtiene el color de Ionic según la prioridad
     */
    function getColor(priority: NotificationPriority): string {
        return getNotificationColor(priority);
    }

    /**
     * Nombre legible de la prioridad
     */
    function getPriorityName(priority: NotificationPriority): string {
        const names = {
            high: 'Urgente',
            medium: 'Importante',
            low: 'Informativo',
        };
        return names[priority];
    }

    /**
     * Formatea la fecha de la notificación
     */
    function formatDate(dateString: string): string {
        return formatNotificationDate(dateString);
    }

    /**
     * Muestra un toast de feedback
     */
    async function showToast(message: string, color: string = 'primary') {
        const toast = await toastController.create({
            message,
            duration: 2000,
            position: 'top',
            color,
        });
        await toast.present();
    }
</script>

<style scoped>
    /* ============================================
    ESTILOS DEL CENTRO DE NOTIFICACIONES
    ============================================ */

    /* Badge en el título del header */
    .header-badge {
        margin-left: 8px;
        font-size: 11px;
        padding: 2px 6px;
        vertical-align: middle;
    }

    /* Barra para limpiar leídas */
    .clear-read-bar {
        display: flex;
        justify-content: flex-end;
        padding: 4px 16px 0;
        border-bottom: 1px solid var(--ion-color-light-shade);
    }

    /* Lista de notificaciones */
    .notifications-list {
    padding: 0;
    }

    /* Item de notificación */
    .notification-item {
        --padding-start: 0;
        --inner-padding-end: 16px;
        border-bottom: 1px solid var(--ion-color-light-shade);
        transition: background 0.2s;
    }

    /* Fondo diferente para las no leídas */
    .notification-item.unread {
        --background: rgba(var(--ion-color-primary-rgb), 0.04);
    }

    /* Ícono del tipo de notificación */
    .notif-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 12px 12px 12px 16px;
        flex-shrink: 0;
    }

    .notif-icon ion-icon {
        font-size: 22px;
        color: white;
    }

    /* Colores según prioridad */
    .notif-icon--high {
        background: var(--ion-color-danger);
    }

    .notif-icon--medium {
        background: var(--ion-color-warning);
    }

    .notif-icon--low {
        background: var(--ion-color-primary);
    }

    /* Header de la notificación (título + punto rojo) */
    .notif-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
    }

    .notif-header h2 {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0;
        flex: 1;
    }

    /* Punto rojo para "no leída" */
    .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ion-color-danger);
        margin-left: 8px;
        flex-shrink: 0;
    }

    /* Mensaje de la notificación */
    .notif-message {
        font-size: 13px;
        color: var(--ion-color-medium-shade);
        margin: 0 0 6px;
        line-height: 1.4;
    }

    /* Footer: badge de prioridad + fecha */
    .notif-footer {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .priority-badge {
        font-size: 10px;
        padding: 2px 6px;
    }

    .notif-date {
        font-size: 11px;
        color: var(--ion-color-medium);
    }

    /* Estado de carga */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: 16px;
    }

    .loading-state p {
        color: var(--ion-color-medium);
    }

    /* Estado vacío */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        padding: 40px 20px;
    }

    .empty-icon {
        font-size: 80px;
        color: var(--ion-color-light-shade);
        margin-bottom: 16px;
    }

    .empty-state h2 {
        font-size: 20px;
        color: var(--ion-color-dark);
        margin: 0 0 8px;
    }

    .empty-state p {
        color: var(--ion-color-medium);
        margin-bottom: 20px;
        line-height: 1.5;
    }
</style>

<!--
============================================
EXPLICACIÓN SIMPLE:
============================================

Esta página ES el "Centro de Notificaciones".
Se abre como un modal al tocar el 🔔 del header.

FUNCIONALIDADES:
1. FILTROS por tipo (Todas / Stock / Deudas / Invitaciones)
2. INDICADOR de no leídas (punto rojo + número)
3. SWIPE para opciones (deslizar → Marcar leída / Eliminar)
4. LEER TODO: botón para marcar todas leídas
5. LIMPIAR LEÍDAS: elimina las ya vistas
6. PULL TO REFRESH: deslizar para recargar
7. ESTADOS: cargando, vacío, con resultados

DISEÑO:
- Ícono de color según prioridad (rojo/amarillo/azul)
- Punto rojo en no leídas
- Fecha relativa ("Hace 5 min", "Ayer")
- Badge de prioridad (Urgente/Importante/Informativo)

============================================
-->