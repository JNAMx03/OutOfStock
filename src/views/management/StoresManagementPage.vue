<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tabs/more"></ion-back-button>
                </ion-buttons>
                <ion-title>Mis Tiendas</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="openCreateStoreModal">
                        <ion-icon :icon="addOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" class="ion-padding">
            <!-- loading -->
            <div v-if="isLoading" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Cargando tiendas...</p>
            </div>

            <!-- lista de tiendas -->
            <div v-else-if="stores.length>0" class="stores-list">
                <ion-card v-for="store in stores" :key="store.id" class="store-card" :class="{ 'current-store': store.id === currentStoreId}" button @click="selectStore(store.id)">
                    <ion-card-content>
                        <div class="store-card-header">
                            <!-- logo o place holder -->
                            <div class="store-logo" :style="{background: store.logo ? `url(${store.logo}) center/cover` : store.color || '#3880ff'}">
                                <ion-icon v-if="!store.logo" :icon="storefrontOutline"></ion-icon>
                            </div>

                            <!-- informacion principal -->
                            <div class="store-info">
                                <div class="store-title-row">
                                    <h2>{{ store.name }}</h2>
                                    <ion-icon v-if="store.id === currentStoreId" :icon="checkmarkCircleOutline" color="primary" class="check-icon"></ion-icon>
                                </div>

                                <div class="store-meta">
                                    <ion-badge :color="getStoreStatusColor(store.status)">
                                        {{  getStoreStatusName(store.status) }}
                                    </ion-badge>
                                    <span class="store-type">
                                        <ion-icon :icon="getStoreTypeIconName(store.type)"></ion-icon>
                                        {{ getStoreTypeName(store.type) }}
                                    </span>
                                </div>

                                <p v-if="store.description" class="store-description">
                                    {{ store.description }}
                                </p>
                            </div>
                        </div>

                        <!-- informacion del contacto -->
                        <div class="store-contact">
                            <div v-if="store.address" class="contact-item">
                                <ion-icon :icon="locationOutline"></ion-icon>
                                <span>{{  formatAddressShort(store.address) }}</span>
                            </div>
                            <div v-if="store.phone" class="contact-item">
                                <ion-icon :icon="callOutline" color="medium"></ion-icon>
                                <span>{{ store.phone }}</span>
                            </div>
                        </div>

                        <!-- acciones -->
                         <div class="store-actions">
                            <ion-button fill="clear" size="small" @click.stop="editStore(store)">
                                <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
                            </ion-button>
                            <ion-button fill="clear" size="small" color="danger" @click.stop="confirmDeleteStore(store)">
                                <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                            </ion-button>
                         </div>
                    </ion-card-content>
                </ion-card>    
            </div>

            <!-- estdo vacio -->
            <div v-else class="empty-state">
                <ion-icon :icon="storefrontOutline" class="empty-icon"></ion-icon>
                <h2>No tienes tiendas registradas</h2>
                <p>Crea tu primera tienda para comenzar a gestionar tu inventario</p>
                <ion-button @click="openCreateStoreModal">
                    <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
                    Crear mi primera tienda
                </ion-button>
            </div>
        </ion-content>
    </ion-page>
</template>

// ============================================
// IMPORTS
// ============================================

<script setup lang="ts">
    import { computed, onMounted } from 'vue';
    //import { useRouter } from 'vue-router';
    import{
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonBackButton,
        IonButton,
        IonTitle,
        IonContent,
        IonCard,
        IonCardContent,
        IonIcon,
        IonBadge,
        IonSpinner,
        alertController,
        toastController,
    } from '@ionic/vue';
    import {
        addOutline,
        addCircleOutline,
        storefrontOutline,
        checkmarkCircleOutline,
        locationOutline,
        callOutline,
        createOutline,
        trashOutline,
    } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';
    import {
        getStoreTypeName,
        getStoreTypeIcon,
        getStoreStatusColor,
        getStoreStatusName,
        type Store,
    } from '@/models/Store';

    // ============================================
    // COMPOSABLES
    // ===========================================

    //const router = useRouter();
    const authStore = useAuthStore();
    const storesStore = useStoresStore();

    // ============================================
    // COMPUTED
    // ============================================

    const stores = computed(() => storesStore.stores);
    const currentStoreId = computed(() => storesStore.currentStoreId);
    const isLoading = computed(() => storesStore.isLoading);

    // ============================================
    // LIFECYCLE
    // ============================================

    onMounted(async () =>{
        //cargar tiendas si no estan cargadas
        if (!storesStore.hasStores && authStore.user){
            await storesStore.fetchStores(authStore.user.id);
        }
    });

    // ============================================
    // FUNCIONES
    // ============================================

    /**
    * Obtiene el nombre del icono del tipo de tienda
    */

    function getStoreTypeIconName(type: string){
        return getStoreTypeIcon(type as any);
    }

    /**
     * Formatea la dirección de forma corta
     */
    function formatAddressShort(address: any): string {
        return `${address.city}, ${address.state}`;
    }

    /**
     * Selecciona una tienda como actual
     */
    async function selectStore(storeId: string) {
        const result = storesStore.setCurrentStore(storeId);
        
        if (result.success) {
            await showToast('Tienda seleccionada', 'success');
        }
    }

    /**
     * Abre el modal para crear una nueva tienda
     */
    async function openCreateStoreModal() {
        // TODO: Implementar modal de formulario
        // Por ahora, mostramos un alert
        const alert = await alertController.create({
            header: 'Crear Tienda',
            message: 'El formulario se implementará en el siguiente paso',
            buttons: ['OK'],
        });
        await alert.present();
    }

    /**
     * Abre el modal para editar una tienda
     */
    async function editStore(store: Store) {
        // TODO: Implementar modal de formulario
        const alert = await alertController.create({
            header: 'Editar Tienda',
            message: `Editando: ${store.name}. El formulario se implementará en el siguiente paso.`,
            buttons: ['OK'],
        });
        await alert.present();
    }

    /**
     * Confirma y elimina una tienda
     */
    async function confirmDeleteStore(store: Store) {
        const alert = await alertController.create({
            header: 'Eliminar Tienda',
            message: `¿Estás seguro de que deseas eliminar "${store.name}"? Esta acción no se puede deshacer.`,
            buttons: [
            {
                text: 'Cancelar',
                role: 'cancel',
            },
            {
                text: 'Eliminar',
                role: 'destructive',
                handler: async () => {
                await handleDeleteStore(store.id);
                },
            },
            ],
        });

        await alert.present();
    }

    /**
     * Elimina una tienda
     */
    async function handleDeleteStore(storeId: string) {
        const result = await storesStore.deleteStore(storeId);
        
        if (result.success) {
            await showToast('Tienda eliminada', 'success');
        } else {
            await showToast(result.error || 'Error al eliminar tienda', 'danger');
        }
    }

    /**
     * Muestra un toast
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

/* ============================================
   ESTILOS
   ============================================ */

<style scoped>
    /* Loading */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: 16px;
}

.loading-container p {
    color: var(--ion-color-medium);
}

/* Lista de tiendas */
.stores-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Card de tienda */
.store-card {
    margin: 0;
    transition: transform 0.2s, box-shadow 0.2s;
}

.store-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.store-card.current-store {
    border: 2px solid var(--ion-color-primary);
}

.store-card-header {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}

/* Logo */
.store-logo {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.store-logo ion-icon {
    font-size: 40px;
    color: white;
}

/* Información */
.store-info {
    flex: 1;
}

.store-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.store-title-row h2 {
    font-size: 20px;
    font-weight: bold;
    color: var(--ion-color-dark);
    margin: 0;
}

.check-icon {
    font-size: 24px;
}

.store-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.store-type {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--ion-color-medium);
    font-size: 14px;
}

.store-type ion-icon {
    font-size: 16px;
}

.store-description {
    color: var(--ion-color-medium);
    font-size: 14px;
    margin: 8px 0 0;
    line-height: 1.4;
}

/* Contacto */
.store-contact {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--ion-color-light-shade);
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ion-color-medium);
    font-size: 14px;
}

.contact-item ion-icon {
    font-size: 18px;
}

/* Acciones */
.store-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--ion-color-light-shade);
}

/* Estado vacío */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
    padding: 20px;
}

.empty-icon {
    font-size: 120px;
    color: var(--ion-color-medium);
    margin-bottom: 20px;
}

.empty-state h2 {
    font-size: 24px;
    color: var(--ion-color-dark);
    margin: 16px 0;
}

.empty-state p {
    color: var(--ion-color-medium);
    max-width: 400px;
    margin-bottom: 24px;
    line-height: 1.5;
}

/* Responsive */
@media (min-width: 768px) {
    .stores-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    }
}
</style>