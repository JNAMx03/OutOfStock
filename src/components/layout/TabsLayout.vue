<template>
    <!-- 
        IonTabs: Componente de Ionic para navegación por tabs
        Los tabs aparecerán en la parte inferior (móvil) o lateral (tablet/desktop)
    -->
    <ion-page>
        <ion-tabs>
            <!-- 
                IonRouterOutlet: Donde se renderizan las páginas de cada tab
                Cada tab muestra su propia página aquí
            -->
            <ion-router-outlet></ion-router-outlet>

            <!-- 
                IonTabBar: Barra de tabs (inferior por defecto)
                slot="bottom": Los tabs aparecen abajo
            -->
            <ion-tab-bar slot="bottom">
                <!-- TAB 1: Dashboard / Inicio -->
                <ion-tab-button tab="dashboard" href="/tabs/dashboard">
                    <ion-icon :icon="homeOutline" aria-hidden="true"></ion-icon>
                    <ion-label>Inicio</ion-label>
                    <!-- Badge opcional para notificaciones -->
                    <!-- <ion-badge v-if="notificationsCount > 0">{{ notificationsCount }}</ion-badge> -->
                </ion-tab-button>

                <!-- TAB 2: Inventario -->
                <ion-tab-button tab="inventory" href="/tabs/inventory">
                    <ion-icon :icon="cubeOutline" aria-hidden="true"></ion-icon>
                    <ion-label>Inventario</ion-label>
                </ion-tab-button>

                <!-- TAB 3: Ventas -->
                <ion-tab-button tab="sales" href="/tabs/sales">
                    <ion-icon :icon="cartOutline" aria-hidden="true"></ion-icon>
                    <ion-label>Ventas</ion-label>
                </ion-tab-button>

                <!-- TAB 4: Finanzas (solo para Owner y Admin) -->
                <ion-tab-button v-if="canViewFinancials" tab="financials" href="/tabs/financials">
                    <ion-icon :icon="statsChartOutline" aria-hidden="true"></ion-icon>
                    <ion-label>Finanzas</ion-label>
                </ion-tab-button>

                <!-- TAB 5: Más opciones -->
                <ion-tab-button tab="more" href="/tabs/more">
                    <ion-icon :icon="ellipsisHorizontalOutline" aria-hidden="true"></ion-icon>
                    <ion-label>Más</ion-label>
                </ion-tab-button>
            </ion-tab-bar>
        </ion-tabs>
    </ion-page>
</template>

// ============================================
// IMPORTS
// ============================================
<script setup lang="ts">
    import { computed } from 'vue';
    import {
        IonPage,
        IonTabs,
        IonTabBar,
        IonTabButton,
        IonIcon,
        IonLabel,
        IonRouterOutlet,
    } from '@ionic/vue';
    import{
        homeOutline,
        cubeOutline,
        cartOutline,
        statsChartOutline,
        ellipsisHorizontalOutline,
    } from 'ionicons/icons';
    import { useAuthStore } from '@/stores/auth';

    // ============================================
    // COMPOSABLES
    // ============================================
    const authStore = useAuthStore();

    // ============================================
    // COMPUTED
    // ============================================

    /**
     * Verifica si el usuario puede ver finanzas
     * Solo Owner y Admin pueden ver este tab
     */
    const canViewFinancials = computed(() => {
        return authStore.isOwner || authStore.isAdmin;
    });

    // Si necesitáramos contar notificaciones, sería algo así:
    // const notificationsCount = computed(() => {
    //   // TODO: Obtener del store de notificaciones
    //   return 0;
    // });
</script>

/* ============================================
   ESTILOS DE LOS TABS
============================================ */

/* 
  Personalización de la barra de tabs
  Ionic ya viene con estilos por defecto muy buenos,
  pero podemos personalizarlos aquí
*/

<style scoped>
    ion-tab-bar {
        /* Altura de la barra de tabs */
        height: 56px;
        
        /* Sombra sutil hacia arriba */
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
        
        /* Bordes redondeados en la parte superior (opcional) */
        /* border-top-left-radius: 16px;
        border-top-right-radius: 16px; */
    }

    /* Estilo de cada botón del tab */
    ion-tab-button {
        /* Transición suave al cambiar de tab */
        transition: all 0.3s ease;
    }

    /* Tab seleccionado */
    ion-tab-button.tab-selected {
        /* El color se maneja automáticamente por Ionic
        usando la variable --ion-color-primary */
    }

    /* Icono del tab */
    ion-tab-button ion-icon {
        font-size: 24px;
        margin-bottom: 2px;
    }

    /* Label del tab */
    ion-tab-button ion-label {
        font-size: 11px;
        font-weight: 500;
        margin-top: 2px;
    }

    /* Badge de notificaciones (cuando se use) */
    ion-badge {
        position: absolute;
        top: 4px;
        right: 20%;
        min-width: 18px;
        height: 18px;
        font-size: 10px;
        border-radius: 9px;
    }

    /* Responsive: En tablets/desktop */
    @media (min-width: 768px) {
        ion-tab-bar {
            /* En pantallas grandes, los tabs pueden ser más anchos */
            height: 60px;
        }
        
        ion-tab-button ion-icon {
            font-size: 26px;
        }
        
        ion-tab-button ion-label {
            font-size: 12px;
        }
    }
</style>