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

            <!-- lista de tiendas ACTIVAS -->
            <div v-else-if="activeStoresList.length>0" class="stores-list">
                <ion-card v-for="store in activeStoresList" :key="store.id" class="store-card" :class="{ 'current-store': store.id === currentStoreId}" button @click="selectStore(store.id)">
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
                            <ion-button fill="clear" size="small" color="medium" @click.stop="confirmDeleteStore(store)">
                                <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                            </ion-button>
                         </div>
                    </ion-card-content>
                </ion-card>    
            </div>

            <!-- estdo vacio (solo si no hay activas) -->
            <div v-else-if="!isLoading && closedStoresList.length === 0" class="empty-state">
                <ion-icon :icon="storefrontOutline" class="empty-icon"></ion-icon>
                <h2>No tienes tiendas registradas</h2>
                <p>Crea tu primera tienda para comenzar a gestionar tu inventario</p>
                <ion-button @click="openCreateStoreModal">
                    <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
                    Crear mi primera tienda
                </ion-button>
            </div>

            <!-- SECCIÓN: Tiendas Eliminadas / Cerradas -->
            <div v-if="closedStoresList.length > 0" class="closed-stores-section">
                <div class="section-divider" @click="toggleClosedStores">
                    <ion-icon :icon="showClosedStores ? chevronUpOutline : chevronDownOutline"></ion-icon>
                    <span>Tiendas Eliminadas ({{ closedStoresList.length }})</span>
                </div>

                <div v-if="showClosedStores" class="stores-list faded-list">
                    <ion-card v-for="store in closedStoresList" :key="store.id" class="store-card closed-card">
                        <ion-card-content>
                            <div class="store-card-header">
                                <div class="store-logo grayscale">
                                    <ion-icon v-if="!store.logo" :icon="storefrontOutline"></ion-icon>
                                </div>
                                <div class="store-info">
                                    <div class="store-title-row">
                                        <h2>{{ store.name }}</h2>
                                    </div>
                                    <div class="store-meta">
                                        <ion-badge color="medium">Eliminada</ion-badge>
                                    </div>
                                </div>
                            </div>

                            <!-- Acciones de restauración -->
                            <div class="store-actions">
                                <ion-button fill="clear" size="small" color="primary" @click.stop="handleReactivateStore(store)">
                                    <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                                    Restaurar
                                </ion-button>
                                <ion-button fill="clear" size="small" color="danger" @click.stop="confirmPermanentDelete(store)">
                                    <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                                </ion-button>
                            </div>
                        </ion-card-content>
                    </ion-card>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

// ============================================
// IMPORTS
// ============================================

<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
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
        modalController,
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
        refreshOutline,
        chevronDownOutline,
        chevronUpOutline,
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

    // Importamos el componente del modal
    import StoreFormModal from '@/components/stores/StoreFormModal.vue';

    // ============================================
    // COMPOSABLES
    // ===========================================

    //const router = useRouter();
    const authStore = useAuthStore();
    const storesStore = useStoresStore();

    // ============================================
    // COMPUTED
    // ============================================

    // Todas las tiendas (raw)
    const allStores = computed(() => storesStore.stores);
    
    // Tiendas activas (visibles en dashboard principal)
    const activeStoresList = computed(() => 
        allStores.value.filter(s => s.status !== 'closed')
    );

    // Tiendas cerradas (papelera)
    const closedStoresList = computed(() => 
        allStores.value.filter(s => s.status === 'closed')
    );

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

    // Estado para mostrar/ocultar tiendas cerradas
    const showClosedStores = ref(false);
    function toggleClosedStores() { showClosedStores.value = !showClosedStores.value; }

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
        const modal = await modalController.create({
            component: StoreFormModal,
            // No pasamos prop store, así entra en modo "crear"
        });
        
        await modal.present();
        
        // Cuando se cierra el modal, recargar tiendas
        //const { data } = await modal.onWillDismiss();
        if (authStore.user) {
            await storesStore.fetchStores(authStore.user.id);
        }
    }

    /**
     * Abre el modal para editar una tienda
     */
    async function editStore(store: Store) {
        const modal = await modalController.create({
            component: StoreFormModal,
            componentProps: {
            store, // Pasamos la tienda para editar
            },
        });
        
        await modal.present();
        
        // Cuando se cierra el modal, recargar tiendas
        //const { data } = await modal.onWillDismiss();
        if (authStore.user) {
            await storesStore.fetchStores(authStore.user.id);
        }

        // // Cuando se cierra el modal, NO es necesario recargar
        // // porque el store ya tiene los datos actualizados
        // // esto se activa y se comenta el IF de arriba
        // await modal.onWillDismiss();
    }

    /**
     * Confirma y elimina una tienda
     */
    async function confirmDeleteStore(store: Store) {
        const alert = await alertController.create({
            header: 'Eliminar Tienda',
            message: `¿Deseas enviar "${store.name}" a la papelera? Podrás restaurarla después si lo necesitas.`,
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
     * Reactiva una tienda
     */
    async function handleReactivateStore(store: Store) {
        const result = await storesStore.reactivateStore(store.id);
        if (result.success) {
            await showToast('Tienda restaurada correctamente', 'success');
        } else {
            await showToast('Error al restaurar tienda', 'danger');
        }
    }

    /**
     * Confirma eliminación permanente
     */
    async function confirmPermanentDelete(store: Store) {
        const alert = await alertController.create({
            header: 'Eliminar Definitivamente',
            message: `¿Estás seguro? La tienda "${store.name}" y TODO su historial se borrarán permanentemente. Esta acción NO se puede deshacer.`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar para siempre',
                    role: 'destructive',
                    handler: async () => {
                        await handlePermanentDelete(store.id);
                    }
                }
            ]
        });
        await alert.present();
    }

    /**
     * Ejecuta eliminación permanente
     */
    async function handlePermanentDelete(storeId: string) {
        const result = await storesStore.permanentDeleteStore(storeId);
        if (result.success) {
            await showToast('Tienda eliminada permanentemente', 'medium');
        } else {
            await showToast('Error al eliminar', 'danger');
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

/* Sección de Tiendas Eliminadas */
.closed-stores-section {
    margin-top: 32px;
    border-top: 1px dashed var(--ion-color-medium);
    padding-top: 16px;
}

.section-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--ion-color-medium);
    font-size: 14px;
    cursor: pointer;
    padding: 8px;
    user-select: none;
}

.faded-list {
    opacity: 0.8;
    margin-top: 16px;
}

.closed-card {
    background: var(--ion-color-light);
    border: 1px dashed var(--ion-color-medium);
}

.closed-card .store-title-row h2 {
    color: var(--ion-color-medium);
    text-decoration: line-through;
}

.grayscale {
    filter: grayscale(100%);
    opacity: 0.6;
    background-color: var(--ion-color-medium) !important;
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

<!--
============================================
EXPLICACIÓN SIMPLE:
============================================

Esta página muestra todas las tiendas del usuario.

Funcionalidades:

1. LISTA DE TIENDAS:
   - Muestra todas las tiendas
   - Resalta la tienda actual
   - Muestra logo, nombre, estado, tipo
   - Información de contacto

2. SELECCIONAR TIENDA:
   - Click en una card para seleccionarla
   - Se marca con checkmark y borde azul

3. CREAR TIENDA:
   - Botón + en el header
   - Botón grande si no hay tiendas

4. EDITAR TIENDA:
   - Botón de lápiz en cada card
   - Abre modal de edición

5. ELIMINAR TIENDA:
   - Botón de basura
   - Confirma antes de eliminar
   - Soft delete (no elimina realmente)

6. ESTADOS:
   - Loading: Muestra spinner
   - Con tiendas: Muestra grid/lista
   - Sin tiendas: Estado vacío con CTA

============================================
-->