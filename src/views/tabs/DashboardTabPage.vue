<template>
    <ion-page>
        <!-- Header con botón de menú y notificaciones -->
        <ion-header>
            <ion-toolbar>
                <!-- Botón para abrir el menú lateral -->
                <ion-buttons slot="start">
                    <ion-menu-button></ion-menu-button>
                </ion-buttons>

                <ion-title>{{  storeName || 'Dashboard' }}</ion-title>

                <!-- Botón de notificaciones -->
                <ion-buttons slot="end">
                    <ion-button @click="openNotifications">
                        <ion-icon :icon="notificationsOutline"></ion-icon>
                        <!-- Badge de notificaciones pendientes -->
                        <ion-badge v-if="notificationsCount > 0" color="danger" class="notification-badge">
                            {{ notificationsCount }}
                        </ion-badge>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" class="ion-padding">
            <!-- saludo personalizado -->
            <div class="welcome-section">
                <h1>¡Hola, {{  userName  }}! 👋</h1>
                <p class="subtitle">{{  getGreeting() }}</p>
            </div>

            <!-- Selector de tienda (si tiene múltiples) -->
            <ion-card v-if="hasMultipleStores" class="store-selector-card">
                <ion-card-content>
                    <ion-item lines="none">
                        <ion-label>Tienda actual: </ion-label>
                        <ion-select v-model="selectedStoreId" @ionChange="handleStoreChange" interface="action-sheet" placeholder="Seleccionar tienda">
                            <ion-select-option v-for="store in stores" :key="store.id" :value="store.id">
                                {{ store.name }}
                            </ion-select-option>
                        </ion-select>                    
                    </ion-item>
                </ion-card-content>
            </ion-card>

            <!-- KPIs principales -->
            <div class="kpi-grid">
                <ion-card class="kpi-card">
                    <ion-card-content>
                        <div class="kpi-icon" style="background: #3880ff15;">
                            <ion-icon :icon="cubeOutline" color="primary"></ion-icon>
                        </div>
                        <h3>Productos</h3>
                        <p class="kpi-value">0</p>
                        <p class="kpi-label">en inventario</p>
                    </ion-card-content>
                </ion-card>

                <ion-card class="kpi-card">
                    <ion-card-content>
                        <div class="kpi-icon" style="background: #10dc6015;">
                            <ion-icon :icon="cartOutline" color="success"></ion-icon>
                        </div>
                        <h3>Ventas hoy</h3>
                        <p class="kpi-value">0</p>
                        <p class="kpi-label">total vendido</p>
                    </ion-card-content>
                </ion-card>

                <ion-card class="kpi-card" v-if="canViewFinancials">
                    <ion-card-content>
                        <div class="kpi-icon" style="background: #ffc40915;">
                        <ion-icon :icon="cashOutline" color="warning"></ion-icon>
                        </div>
                        <h3>Ingresos Hoy</h3>
                        <p class="kpi-value">$0</p>
                        <p class="kpi-label">total vendido</p>
                    </ion-card-content>
                </ion-card>

                <ion-card class="kpi-card">
                    <ion-card-content>
                        <div class="kpi-icon" style="background: #eb445515;">
                        <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
                        </div>
                        <h3>Stock Bajo</h3>
                        <p class="kpi-value">0</p>
                        <p class="kpi-label">productos</p>
                    </ion-card-content>
                </ion-card>
            </div>

            <!-- Acciones rápidas -->
            <div class="quick-actions">
                <h2>Acciones Rápidas</h2>
                <div class="actions-grid">
                <ion-button expand="block" @click="goToAddProduct">
                    <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
                    Agregar Producto
                </ion-button>
                <ion-button expand="block" @click="goToNewSale">
                    <ion-icon :icon="cartOutline" slot="start"></ion-icon>
                    Nueva Venta
                </ion-button>
                </div>
            </div>

            <!-- Mensaje de construcción -->
            <ion-card class="info-card">
                <ion-card-content>
                    <ion-icon :icon="constructOutline" color="medium"></ion-icon>
                    <p>
                        <strong>Dashboard en construcción</strong><br>
                        <small>Las funcionalidades se activarán en las siguientes fases</small>
                    </p>
                </ion-card-content>
            </ion-card>
        </ion-content>
    </ion-page>
</template>

//************************
    IMPORTS
*/

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue';
    import { useRouter } from 'vue-router';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonButton,
        IonTitle,
        IonContent,
        IonCard,
        IonCardContent,
        IonIcon,
        IonBadge,
        IonItem,
        IonLabel,
        IonSelect,
        IonSelectOption,
    } from '@ionic/vue';
    import {
        notificationsOutline,
        cubeOutline,
        cartOutline,
        cashOutline,
        alertCircleOutline,
        addCircleOutline,
        constructOutline,
    } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';

    const router = useRouter();
    const authStore = useAuthStore();
    const storesStore = useStoresStore();

    // Estado
    const notificationsCount = ref(0); // TODO: Conectar con store de notificaciones
    const selectedStoreId = ref<string | null>(null);

    // Computed
    console.log(authStore.user);
    const userName = computed(() => authStore.user?.name || 'Usuario');
    const storeName = computed(() => storesStore.currentStore?.name || 'Mi Tienda');
    const stores = computed(() => storesStore.stores);
    const hasMultipleStores = computed(() => storesStore.storesCount > 1);
    const canViewFinancials = computed(() => authStore.isOwner || authStore.isAdmin);

    // Lifecycle
    onMounted(async () => {
        // Cargar tiendas si no están cargadas
        if (!storesStore.hasStores && authStore.user) {
            await storesStore.fetchStores(authStore.user.id);
        }
        
        // Establecer tienda seleccionada
        selectedStoreId.value = storesStore.currentStoreId;
    });

    // Funciones
    function getGreeting(): string {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    }

    function handleStoreChange(event: any) {
        const storeId = event.detail.value;
        storesStore.setCurrentStore(storeId);
    }

    function openNotifications() {
        // TODO: Abrir modal de notificaciones
        console.log('Abrir notificaciones');
    }

    function goToAddProduct() {
        router.push('/tabs/inventory/add');
    }

    function goToNewSale() {
        router.push('/tabs/sales/new');
    }
</script>

//******************************
    STYLES
*/

<style scoped>
    .notification-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        min-width: 16px;
        height: 16px;
        font-size: 10px;
        padding: 2px 4px;
    }

    .welcome-section {
        margin: 20px 0 24px;
    }

    .welcome-section h1 {
        font-size: 28px;
        font-weight: bold;
        color: var(--ion-color-dark);
        margin: 0;
    }

    .subtitle {
        color: var(--ion-color-medium);
        font-size: 16px;
        margin-top: 4px;
    }

    .store-selector-card {
        margin-bottom: 20px;
    }

    .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
    }

    .kpi-card {
        margin: 0;
    }

    .kpi-card ion-card-content {
        text-align: center;
        padding: 16px;
    }

    .kpi-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
    }

    .kpi-icon ion-icon {
        font-size: 28px;
    }

    .kpi-card h3 {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 0 0 8px;
        text-transform: uppercase;
        font-weight: 600;
    }

    .kpi-value {
        font-size: 24px;
        font-weight: bold;
        color: var(--ion-color-dark);
        margin: 0;
    }

    .kpi-label {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 4px 0 0;
    }

    .quick-actions {
        margin: 24px 0;
    }

    .quick-actions h2 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--ion-color-dark);
    }

    .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
    }

    .info-card {
        text-align: center;
        margin-top: 24px;
    }

    .info-card ion-icon {
        font-size: 48px;
        margin-bottom: 12px;
    }

    .info-card p {
        color: var(--ion-color-medium);
        margin: 0;
        line-height: 1.6;
    }
</style>