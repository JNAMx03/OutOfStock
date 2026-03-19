<template>
    <!--
        Banner que aparece en la parte superior cuando
        el usuario pierde la conexión a internet.
        Se oculta automáticamente cuando vuelve la conexión.
    -->
    <Transition name="slide-down">
        <div v-if="!isOnline" class="offline-banner">
            <ion-icon :icon="cloudOfflineOutline"></ion-icon>
            <span>Sin conexión — Mostrando datos guardados</span>
        </div>
    </Transition>
</template>

<script setup lang="ts">
    import { IonIcon } from '@ionic/vue';
    import { cloudOfflineOutline } from 'ionicons/icons';
    import { useNetworkStatus } from '@/composables/usePerformance';

    const { isOnline } = useNetworkStatus();
</script>

<style scoped>
    .offline-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: var(--ion-color-warning);
        color: var(--ion-color-warning-contrast);
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .offline-banner ion-icon {
        font-size: 18px;
    }

    /* Animación de entrada/salida */
    .slide-down-enter-active,
    .slide-down-leave-active {
        transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .slide-down-enter-from,
    .slide-down-leave-to {
        transform: translateY(-100%);
        opacity: 0;
    }
</style>