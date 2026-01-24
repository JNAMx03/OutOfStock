<template>
    <!-- 
        IonMenu: Componente de menú lateral de Ionic
        contentId: Debe coincidir con el id del IonRouterOutlet
    -->

    <ion-menu content-id="main-content" type="overlay">
        <ion-header>
            <ion-toolbar color="primary">
                <ion-title>Información</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <!-- Información de la Tienda Actual -->
            <div v-if="currentStore" class="store-info">
                <!-- logo de la tienda -->
                <div class="store-logo-container">
                    <div v-if="currentStore.logo" class="store-logo" :style="{ backgroundImage: 'url(${currentStore.logo})'}"></div>"
                    <div v.else class="store-logo-placeholder" :style="{ background: currentStore.color || '#38880ff'}">
                        <ion-icon :icon="storefrontOutline"></ion-icon>
                    </div>
                </div>

                <!-- Nombre y tipo de tienda -->
                <div class="store-details">
                    <h2>{{  currentStore.name }}</h2>
                    <ion-badge :color="getStoreStatusColor(currentStore.status)">
                        {{  getStoreStatusName(currentStore.status) }}
                    </ion-badge>
                    <p class="store-type">
                        <ion-icon :icon="getStoreTypeIconName(currentStore.type)"></ion-icon>
                        {{  getStoreTypeName(currentStore.type) }}
                    </p>
                </div>

                <!-- Descripción -->
                <p v-if="currentStore.description" class="store-description">
                    {{  currentStore.description }}
                </p>

                <!-- Información de contacto -->
                <ion-list class="contact-list">
                    <ion-list-header>
                        <ion-label>Contacto</ion-label>
                    </ion-list-header>

                    <!-- Dirección -->
                    <ion-item lines="none">
                        <ion-icon :icon="locationOutline" slot="start" color="primary"></ion-icon>
                        <ion-label class="ion-text-wrap">
                            <h3>Dirección</h3>
                            <p>{{ formatAddress(currentStore.address) }}</p>
                        </ion-label>
                    </ion-item>

                    <!-- Teléfono -->
                    <ion-item v-if="currentStore.phone" lines="none" :href="`tel:${currentStore.phone}`">
                        <ion-icon :icon="callOutline" slot="start" color="primary"></ion-icon>
                            <ion-label>
                                <h3>Teléfono</h3>
                                <p>{{ currentStore.phone }}</p>
                            </ion-label>
                    </ion-item>

                    <!-- Email -->
                    <ion-item v-if="currentStore.email" lines="none" :href="`mailto:${currentStore.email}`">
                        <ion-icon :icon="mailOutline" slot="start" color="primary"></ion-icon>
                            <ion-label>
                                <h3>Email</h3>
                                <p>{{ currentStore.email }}</p>
                            </ion-label>
                    </ion-item>
                </ion-list>

                <!-- Configuración de inventario -->
                <ion-list v-if="canViewSettings">
                    <ion-list-header>
                        <ion-label>Configuración</ion-label>
                    </ion-list-header>

                    <ion-item lines="none">
                        <ion-icon :icon="settingsOutline" slot="start" color="primary"></ion-icon>
                        <ion-label class="ion-text-wrap">
                            <h3>Stock Mínimo</h3>
                            <p>{{ currentStore.inventorySettings.lowStockThreshold }} unidades</p>
                        </ion-label>
                    </ion-item>

                    <ion-item lines="none">
                        <ion-icon :icon="trendingUpOutline" slot="start" color="primary"></ion-icon>
                        <ion-label class="ion-text-wrap">
                            <h3>Margen de Ganancia</h3>
                            <p>{{ currentStore.inventorySettings.defaultProfitMargin }}%</p>
                        </ion-label>
                    </ion-item>
                </ion-list>

                <!-- Botón de editar tienda (solo para Owner/Admin) -->
                <div v-if="canEditStore" class="action-buttons">
                    <ion-button expand="block" fill="outline" @click="editStore">
                        <ion-icon :icon="createOutline" slot="start"></ion-icon>
                        Editar Tienda
                    </ion-button>
                </div>
            </div>

            <!-- Sin tienda seleccionada -->
            <div v-else class="no-store">
                <ion-icon :icon="storefrontOutline" class="no-store-icon"></ion-icon>
                <p>No hay tienda seleccionada</p>
                <ion-button @click="createStore" v-if="isOwner">
                    <ion-icon :icon="addOutline" slot="start"></ion-icon>
                    Crear Tienda
                </ion-button>
            </div>
        </ion-content>
    </ion-menu>
</template>

// ============================================
// IMPORTS
// ============================================

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRouter } from 'vue-router';
    import {
        IonMenu,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonList,
        IonListHeader,
        IonLabel,
        IonItem,
        IonBadge,
        IonIcon,
        IonButton,
    } from '@ionic/vue';
    import {
        storefrontOutline,
        locationOutline,
        callOutline,
        mailOutline,
        settingsOutline,
        createOutline,
        addOutline,
        trendingUpOutline
    } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';
    import { 
        getStoreTypeName,
        getStoreTypeIcon,
        getStoreStatusName,
        getStoreStatusColor,
        formatAddress,
    } from '@/models/Store';

    // ============================================
    // COMPOSABLES
    // ============================================
    const router = useRouter();
    const authStore = useAuthStore();
    const storesStore = useStoresStore();

    // ============================================
    // COMPUTED
    // ============================================
    const currentStore = computed(() => storesStore.currentStore);
    const isOwner = computed(() => authStore.isOwner);
    const canViewSettings = computed(() => authStore.isOwner || authStore.isAdmin);
    const canEditStore = computed(() => authStore.isOwner || authStore.isAdmin);

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Obtiene el nombre del icono del tipo de tienda
     */
    function getStoreTypeIconName(type: string): string {
        return getStoreTypeIcon(type as any);
    }

    /**
     * Navega a editar tienda
     */
    function editStore() {
        // TODO: Implementar en fases futuras
        console.log('Editar tienda');
    }

    /**
     * Navega a crear tienda
     */
    function createStore() {
        // TODO: Implementar en fases futuras
        console.log('Crear tienda');
    }
</script>

/* ============================================
   ESTILOS DEL MENÚ
   ============================================ */

<style scoped>
    /* Información de la tienda */
    .store-info {
        padding: 20px;
    }

    /* Logo */
    .store-logo-container {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }

    .store-logo,
    .store-logo-placeholder {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .store-logo-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .store-logo-placeholder ion-icon {
        font-size: 48px;
        color: white;
    }

    /* Detalles de la tienda */
    .store-details {
        text-align: center;
        margin-bottom: 20px;
    }

    .store-details h2 {
        font-size: 22px;
        font-weight: bold;
        color: var(--ion-color-dark);
        margin: 0 0 8px;
    }

    .store-details ion-badge {
        margin-bottom: 8px;
    }

    .store-type {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: var(--ion-color-medium);
        font-size: 14px;
        margin: 8px 0 0;
    }

    .store-type ion-icon {
        font-size: 16px;
    }

    /* Descripción */
    .store-description {
        color: var(--ion-color-medium);
        font-size: 14px;
        line-height: 1.5;
        text-align: center;
        margin-bottom: 24px;
        padding: 0 10px;
    }

    /* Lista de contacto */
    .contact-list {
        margin-bottom: 16px;
    }

    .contact-list ion-item {
        --padding-start: 0;
        --inner-padding-end: 0;
    }

    .contact-list h3 {
        font-size: 12px;
        font-weight: 600;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        margin: 0 0 4px;
    }

    .contact-list p {
        color: var(--ion-color-dark);
        font-size: 14px;
        margin: 0;
    }

    /* Botones de acción */
    .action-buttons {
        margin-top: 24px;
        padding: 0 16px;
    }

    /* Sin tienda */
    .no-store {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        padding: 20px;
        text-align: center;
    }

    .no-store-icon {
        font-size: 80px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
    }

    .no-store p {
        color: var(--ion-color-medium);
        margin-bottom: 20px;
    }
</style>