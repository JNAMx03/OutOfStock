<!-- src/components/shared/NotificationBell.vue -->
<!-- 📌 CAMPANA DE NOTIFICACIONES - Ícono con badge en la barra superior -->

<template>
    <!-- Botón de la campana -->
    <ion-button
        fill="clear"
        class="notification-bell-btn"
        @click="handleBellClick"
        :aria-label="`Notificaciones: ${unreadCount} sin leer`"
    >
        <!-- Contenedor para posicionar el badge sobre el ícono -->
        <div class="bell-wrapper">
            <!-- Ícono de campana -->
            <!-- Usa 'notifications' si hay alertas urgentes (llena), 'notifications-outline' si no -->
            <ion-icon
                :icon="hasUrgentAlerts ? notificationsIcon : notificationsOutlineIcon"
                :class="['bell-icon', { 'bell-urgent': hasUrgentAlerts, 'bell-shake': shouldShake }]"
            />

            <!-- Badge con la cantidad de notificaciones sin leer -->
            <!-- Solo aparece si hay al menos 1 notificación sin leer -->
            <div v-if="unreadCount > 0" class="notification-badge" :class="badgeClass">
                <!-- Muestra el número, pero si son más de 99 muestra "99+" -->
                {{ unreadCount > 99 ? '99+' : unreadCount }}
            </div>
        </div>
    </ion-button>

    <!-- Modal del panel de notificaciones -->
    <!-- Se abre al hacer clic en la campana -->
    <ion-modal
        :is-open="isPanelOpen"
        @did-dismiss="closePanel"
        :initial-breakpoint="0.85"
        :breakpoints="[0, 0.5, 0.85, 1]"
        handle-behavior="cycle"
        class="notifications-modal"
    >
        <NotificationsPanel @close="closePanel" />
    </ion-modal>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { computed, ref, watch } from 'vue';
    import { IonButton, IonIcon, IonModal } from '@ionic/vue';
    import { notifications as notificationsIcon, notificationsOutline as notificationsOutlineIcon } from 'ionicons/icons';
    import { useNotificationsStore } from '@/stores/notifications';
    import NotificationsPanel from './NotificationsPanel.vue';

    // ============================================
    // STORE
    // ============================================
    const notificationsStore = useNotificationsStore();

    // ============================================
    // ESTADO LOCAL
    // ============================================
    // Controla la animación de sacudida cuando llega una nueva alerta urgente
    const shouldShake = ref(false);

    // ============================================
    // GETTERS DEL STORE
    // ============================================
    const unreadCount = computed(() => notificationsStore.unreadCount);
    const hasUrgentAlerts = computed(() => notificationsStore.hasUrgentAlerts);
    const isPanelOpen = computed(() => notificationsStore.isPanelOpen);

    // ============================================
    // COLOR DEL BADGE
    // ============================================
    // Rojo si hay alertas urgentes, naranja si solo hay medias, azul si son informativas
    const badgeClass = computed(() => {
        if (notificationsStore.urgentNotifications.length > 0) return 'badge-urgent';
        const hasMedium = notificationsStore.unreadNotifications.some(n => n.priority === 'medium');
        if (hasMedium) return 'badge-medium';
        return 'badge-low';
    });

    // ============================================
    // ANIMACIÓN DE SACUDIDA
    // ============================================
    // Cuando llega una nueva notificación urgente, la campana se "sacude"
    watch(
        () => notificationsStore.urgentNotifications.length,
        (newCount, oldCount) => {
            if (newCount > oldCount) {
                shouldShake.value = true;
                // Quita la animación después de 1 segundo
                setTimeout(() => {
                    shouldShake.value = false;
                }, 1000);
            }
        }
    );

    // ============================================
    // FUNCIONES
    // ============================================

    /** Abre el panel de notificaciones */
    function handleBellClick(): void {
        notificationsStore.togglePanel();
    }

    /** Cierra el panel de notificaciones */
    function closePanel(): void {
        notificationsStore.closePanel();
    }
</script>

<style scoped>
    /* Quita el padding por defecto del botón de Ionic */
    .notification-bell-btn {
        --padding-start: 8px;
        --padding-end: 8px;
        position: relative;
    }

    /* Contenedor del ícono + badge */
    .bell-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
    }

    /* El ícono de la campana */
    .bell-icon {
        font-size: 24px;
        color: var(--ion-color-medium);
        transition: color 0.3s ease;
    }

    /* Cuando hay alertas urgentes, la campana se vuelve roja */
    .bell-urgent {
        color: var(--ion-color-danger);
    }

    /* Animación de sacudida cuando llega una alerta urgente */
    @keyframes shake {
        0%, 100% { transform: rotate(0deg); }
        20%       { transform: rotate(-15deg); }
        40%       { transform: rotate(15deg); }
        60%       { transform: rotate(-10deg); }
        80%       { transform: rotate(10deg); }
    }

    .bell-shake {
        animation: shake 0.5s ease-in-out;
    }

    /* El badge (círculo con el número) */
    .notification-badge {
        position: absolute;
        top: -4px;
        right: -6px;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: white;
        padding: 0 4px;
        border: 2px solid var(--ion-background-color, white);
        line-height: 1;
    }

    /* Colores del badge según prioridad */
    .badge-urgent { background-color: var(--ion-color-danger); }
    .badge-medium { background-color: var(--ion-color-warning); }
    .badge-low    { background-color: var(--ion-color-primary); }

    /* Modal de notificaciones */
    .notifications-modal {
        --border-radius: 16px 16px 0 0;
    }
</style>