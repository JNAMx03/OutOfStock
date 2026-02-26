<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-menu-button></ion-menu-button>
                </ion-buttons>
                <ion-title>Inventario</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="openFilters">
                        <ion-icon :icon="filterOutline"></ion-icon>
                    </ion-button>
                    <ion-button @click="addProduct">
                        <ion-icon :icon="addOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>

            <!-- barra de busqueda -->
            <ion-toolbar>
                <ion-searchbar v-model="searchQuery" placeholder="Buscar por nombre, SKU o codigo de barras" @ionInput="handleSearch" :debounce="300"></ion-searchbar>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" >
            <!-- alertas de sctock -->
            <div v-if="lowStockProducts.length > 0 || outOfStockProducts.length > 0" class="alerts-section">
                <ion-card v-if="outOfStockProducts.length > 0" color="danger" class="alert-card">
                    <ion-card-content>
                        <ion-icon :icon="alertCircleOutline"></ion-icon>
                        <strong>{{ outOfStockProducts.length}}</strong> prodcuto(s) sin stock
                    </ion-card-content>
                </ion-card>

                <ion-card v-if="lowStockProducts.length > 0" color="warning" class="alert-card">
                    <ion-card-content>
                        <ion-icon :icon="warningOutline"></ion-icon>
                        <strong>{{ lowStockProducts.length }}</strong> producto(s) con stock bajo
                    </ion-card-content>
                </ion-card>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Cargando productos...</p>
            </div>

            <!-- Lista de productos -->
            <div v-else-if="filteredProducts.length > 0" class="products-list ion-padding">
                <ion-card v-for="product in filteredProducts" :key="product.id" class="product-card" button @click="viewProduct(product)">
                    <ion-card-content>
                        <div class="product-header">
                            <!-- Imagen o placeholder -->
                            <div class="product-image">
                                <img v-if="product.image" :src="product.image" :alt="product.name" />
                                <ion-icon v-else :icon="cubeOutline"></ion-icon>
                            </div>

                            <!-- Información principal -->
                            <div class="product-info">
                                <h2>{{ product.name }}</h2>
                                <p v-if="product.description" class="description">{{ product.description }}</p>
                                
                                <div class="product-meta">
                                <ion-badge v-if="product.sku" color="medium">SKU: {{ product.sku }}</ion-badge>
                                <ion-badge :color="getStockColor(product)" class="stock-badge">
                                    {{ product.stock }} {{ getUnitAbbr(product.unit) }}
                                </ion-badge>
                                </div>
                            </div>
                        </div>

                        <!-- Precios y ganancia -->
                        <div class="product-prices">
                            <div class="price-item">
                                <span class="label">Compra:</span>
                                <span class="value">{{ formatPrice(product.purchasePrice) }}</span>
                            </div>
                            <div class="price-item">
                                <span class="label">Venta:</span>
                                <span class="value success">{{ formatPrice(product.salePrice) }}</span>
                            </div>
                            <div class="price-item">
                                <span class="label">Ganancia:</span>
                                <span class="value profit">
                                {{ formatPrice(calculateProfit(product.purchasePrice, product.salePrice)) }}
                                ({{ product.profitMargin }}%)
                                </span>
                            </div>
                        </div>

                        <!-- Acciones -->
                        <div class="product-actions">
                            <ion-button fill="clear" size="small" @click.stop="editProduct(product)">
                                <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
                            </ion-button>
                            <ion-button fill="clear" size="small" color="danger" @click.stop="confirmDeleteProduct(product)">
                                <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                            </ion-button>
                        </div>
                    </ion-card-content>
                </ion-card>
            </div>

            <!-- Estado vacío -->
            <div v-else class="empty-state ion-padding">
                <ion-icon :icon="cubeOutline" class="empty-icon"></ion-icon>
                <h2>{{ searchQuery ? 'Sin resultados' : 'No hay productos' }}</h2>
                <p v-if="searchQuery">
                    No se encontraron productos con "{{ searchQuery }}"
                </p>
                <p v-else>
                    Comienza agregando productos a tu inventario
                </p>
                <ion-button v-if="!searchQuery" @click="addProduct">
                <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
                    Agregar Primer Producto
                </ion-button>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
   
    import { ref, computed, onMounted, watch } from 'vue';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonButton,
        IonTitle,
        IonContent,
        IonSearchbar,
        IonCard,
        IonCardContent,
        IonIcon,
        IonBadge,
        IonSpinner,
        alertController,
        toastController,
    } from '@ionic/vue';
    import { 
        cubeOutline,
        addOutline,
        addCircleOutline,
        filterOutline,
        createOutline,
        trashOutline,
        alertCircleOutline,
        warningOutline,
    } from 'ionicons/icons';
    // import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';
    import { useProductsStore } from '@/stores/products';
    import {
        formatPrice,
        calculateProfit,
        getUnitAbbr,
        hasLowStock,
        isOutOfStock,
        type Product,
    } from '@/models/Product';
    
    // const router = useRouter();
    // const authStore = useAuthStore();
    const storesStore = useStoresStore();
    const productsStore = useProductsStore();

    // Estado
    const searchQuery = ref('');

    // Computed
    const isLoading = computed(() => productsStore.isLoading);
    const currentStoreId = computed(() => storesStore.currentStoreId);
    const filteredProducts = computed(() => productsStore.filteredProducts);
    const lowStockProducts = computed(() => productsStore.lowStockProducts);
    const outOfStockProducts = computed(() => productsStore.outOfStockProducts);

    // Lifecycle
    onMounted(async () => {
        if (currentStoreId.value) {
            await productsStore.fetchProducts(currentStoreId.value);
        }
    });

    // Watch para recargar productos si cambia la tienda
    watch(currentStoreId, async (newStoreId) => {
        if (newStoreId) {
            await productsStore.fetchProducts(newStoreId);
        }
    });

    // Funciones
    function handleSearch() {
        productsStore.setFilters({ search: searchQuery.value });
    }

    function getStockColor(product: Product): string {
        if (isOutOfStock(product)) return 'danger';
        if (hasLowStock(product)) return 'warning';
        return 'success';
    }

    function addProduct() {
        // TODO: Abrir modal de crear producto
        console.log('Agregar producto');
    }

    function viewProduct(product: Product) {
        // TODO: Ver detalles del producto
        console.log('Ver producto:', product.name);
    }

    function editProduct(product: Product) {
        // TODO: Editar producto
        console.log('Editar producto:', product.name);
    }

    async function confirmDeleteProduct(product: Product) {
        const alert = await alertController.create({
            header: 'Eliminar Producto',
            message: `¿Estás seguro de eliminar "${product.name}"?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: async () => {
                    const result = await productsStore.deleteProduct(product.id);
                    if (result.success) {
                        await showToast('Producto eliminado', 'success');
                    } else {
                        await showToast(result.error || 'Error', 'danger');
                    }
                    },
                },
            ],
        });
        await alert.present();
    }

    function openFilters() {
        // TODO: Implementar filtros avanzados
        console.log('Abrir filtros');
    }

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
    .alerts-section {
        padding: 12px 16px 0;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .alert-card {
        flex: 1;
        min-width: 200px;
        margin: 0;
    }

    .alert-card ion-card-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        color: white;
    }

    .alert-card ion-icon {
        font-size: 24px;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: 16px;
    }

    .products-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .product-card {
        margin: 0;
        transition: transform 0.2s;
    }

    .product-card:hover {
        transform: translateY(-2px);
    }

    .product-header {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
    }

    .product-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        background: var(--ion-color-light);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
    }

    .product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .product-image ion-icon {
        font-size: 40px;
        color: var(--ion-color-medium);
    }

    .product-info {
        flex: 1;
    }

    .product-info h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 0 4px;
    }

    .description {
        font-size: 14px;
        color: var(--ion-color-medium);
        margin: 4px 0 8px;
        display: -webkit-box;
        /* -webkit-line-clamp: 2; */
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .product-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .stock-badge {
        font-weight: 600;
    }

    .product-prices {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-top: 1px solid var(--ion-color-light-shade);
        border-bottom: 1px solid var(--ion-color-light-shade);
        margin-bottom: 12px;
    }

    .price-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .price-item .label {
        font-size: 11px;
        color: var(--ion-color-medium);
        text-transform: uppercase;
    }

    .price-item .value {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-dark);
    }

    .price-item .value.success {
        color: var(--ion-color-success);
    }

    .price-item .value.profit {
        color: var(--ion-color-primary);
    }

    .product-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        text-align: center;
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
        margin-bottom: 24px;
    }

    @media (min-width: 768px) {
        .products-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        }
    }
</style>