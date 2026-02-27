<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Ventas</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openNewSale">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      
      <!-- Barra de búsqueda -->
      <ion-toolbar>
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Buscar por número o cliente"
          @ionInput="handleSearch"
          :debounce="300"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Estadísticas del día -->
      <div class="stats-section">
        <ion-card class="stat-card">
          <ion-card-content>
            <div class="stat-content">
              <div class="stat-icon" style="background: #3880ff15;">
                <ion-icon :icon="cashOutline" color="primary"></ion-icon>
              </div>
              <div class="stat-info">
                <p class="stat-label">Ventas Hoy</p>
                <p class="stat-value">{{ formatPrice(todaySalesTotal) }}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card" v-if="canViewFinancials">
          <ion-card-content>
            <div class="stat-content">
              <div class="stat-icon" style="background: #10dc6015;">
                <ion-icon :icon="trendingUpOutline" color="success"></ion-icon>
              </div>
              <div class="stat-info">
                <p class="stat-label">Ganancia Hoy</p>
                <p class="stat-value">{{ formatPrice(todayProfit) }}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card">
          <ion-card-content>
            <div class="stat-content">
              <div class="stat-icon" style="background: #ffc40915;">
                <ion-icon :icon="timeOutline" color="warning"></ion-icon>
              </div>
              <div class="stat-info">
                <p class="stat-label">Pendientes</p>
                <p class="stat-value">{{ formatPrice(totalPendingDebt) }}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Cargando ventas...</p>
      </div>

      <!-- Lista de ventas -->
      <div v-else-if="filteredSales.length > 0" class="sales-list ion-padding">
        <ion-card
          v-for="sale in filteredSales"
          :key="sale.id"
          class="sale-card"
          button
          @click="viewSale(sale)"
        >
          <ion-card-content>
            <div class="sale-header">
              <!-- Número y fecha -->
              <div class="sale-info">
                <h2>{{ sale.saleNumber }}</h2>
                <p class="sale-date">{{ formatDate(sale.createdAt) }}</p>
              </div>

              <!-- Estado -->
              <ion-badge :color="getSaleStatusColor(sale.status)">
                {{ getSaleStatusName(sale.status) }}
              </ion-badge>
            </div>

            <!-- Cliente -->
            <div v-if="sale.customer" class="sale-customer">
              <ion-icon :icon="personOutline"></ion-icon>
              <span>{{ sale.customer.name }}</span>
            </div>

            <!-- Items -->
            <div class="sale-items">
              <p class="items-summary">
                {{ sale.items.length }} producto(s) - {{ getTotalQuantity(sale) }} unidades
              </p>
            </div>

            <!-- Totales -->
            <div class="sale-totals">
              <div class="total-row">
                <span class="label">Total:</span>
                <span class="value total">{{ formatPrice(sale.total) }}</span>
              </div>
              <div v-if="sale.amountDue > 0" class="total-row debt">
                <span class="label">Pendiente:</span>
                <span class="value">{{ formatPrice(sale.amountDue) }}</span>
              </div>
              <div v-if="canViewFinancials && sale.profit" class="total-row profit">
                <span class="label">Ganancia:</span>
                <span class="value">{{ formatPrice(sale.profit) }}</span>
              </div>
            </div>

            <!-- Método de pago -->
            <div class="payment-method">
              <ion-icon :icon="getPaymentMethodIcon(sale.paymentMethod)"></ion-icon>
              <span>{{ getPaymentMethodName(sale.paymentMethod) }}</span>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Estado vacío -->
      <div v-else class="empty-state ion-padding">
        <ion-icon :icon="cartOutline" class="empty-icon"></ion-icon>
        <h2>{{ searchQuery ? 'Sin resultados' : 'No hay ventas' }}</h2>
        <p v-if="searchQuery">
          No se encontraron ventas con "{{ searchQuery }}"
        </p>
        <p v-else>
          Registra tu primera venta para comenzar
        </p>
        <ion-button v-if="!searchQuery" @click="openNewSale">
          <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
          Registrar Primera Venta
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  // import { useRouter } from 'vue-router';
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
    modalController,
  } from '@ionic/vue';
  import {
    cartOutline,
    addOutline,
    addCircleOutline,
    cashOutline,
    trendingUpOutline,
    timeOutline,
    personOutline,
  } from 'ionicons/icons';

  import { useAuthStore } from '@/stores/auth';
  import { useStoresStore } from '@/stores/stores';
  import { useSalesStore } from '@/stores/sales';
  import {
    formatPrice,
    getPaymentMethodName,
    getPaymentMethodIcon,
    getSaleStatusColor,
    getSaleStatusName,
    type Sale,
  } from '@/models/Sale';

  import NewSaleModal from '@/components/sales/NewSaleModal.vue';

  // const router = useRouter();
  const authStore = useAuthStore();
  const storesStore = useStoresStore();
  const salesStore = useSalesStore();

  // Estado
  const searchQuery = ref('');

  // Computed
  const isLoading = computed(() => salesStore.isLoading);
  const currentStoreId = computed(() => storesStore.currentStoreId);
  const filteredSales = computed(() => salesStore.filteredSales);
  const todaySalesTotal = computed(() => salesStore.todaySalesTotal);
  const todayProfit = computed(() => salesStore.todayProfit);
  const totalPendingDebt = computed(() => salesStore.totalPendingDebt);
  const canViewFinancials = computed(() => authStore.isOwner || authStore.isAdmin);

  // Lifecycle
  onMounted(async () => {
    if (currentStoreId.value) {
      await salesStore.fetchSales(currentStoreId.value);
    }
  });

  // Watch para recargar ventas si cambia la tienda
  watch(currentStoreId, async (newStoreId) => {
    if (newStoreId) {
      await salesStore.fetchSales(newStoreId);
    }
  });

  // Funciones
  function handleSearch() {
    salesStore.setFilters({ search: searchQuery.value });
  }

  function getTotalQuantity(sale: Sale): number {
    return sale.items.reduce((total, item) => total + item.quantity, 0);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer, ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  async function openNewSale() {
      const modal = await modalController.create({
      component: NewSaleModal,
    });
    
    await modal.present();
  }

  function viewSale(sale: Sale) {
    // TODO: Ver detalles de la venta
    console.log('Ver venta:', sale.saleNumber);
  }
</script>

<style scoped>
  .stats-section {
    padding: 12px 16px;
    display: flex;
    gap: 12px;
    overflow-x: auto;
  }

  .stat-card {
    flex: 1;
    min-width: 150px;
    margin: 0;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-icon ion-icon {
    font-size: 24px;
  }

  .stat-info {
    flex: 1;
  }

  .stat-label {
    font-size: 12px;
    color: var(--ion-color-medium);
    margin: 0 0 4px;
  }

  .stat-value {
    font-size: 18px;
    font-weight: bold;
    color: var(--ion-color-dark);
    margin: 0;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: 16px;
  }

  .sales-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sale-card {
    margin: 0;
    transition: transform 0.2s;
  }

  .sale-card:hover {
    transform: translateY(-2px);
  }

  .sale-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .sale-info h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--ion-color-dark);
    margin: 0 0 4px;
  }

  .sale-date {
    font-size: 13px;
    color: var(--ion-color-medium);
    margin: 0;
  }

  .sale-customer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px;
    background: var(--ion-color-light);
    border-radius: 6px;
    font-size: 14px;
    color: var(--ion-color-dark);
  }

  .sale-customer ion-icon {
    font-size: 18px;
    color: var(--ion-color-medium);
  }

  .sale-items {
    margin-bottom: 12px;
  }

  .items-summary {
    font-size: 13px;
    color: var(--ion-color-medium);
    margin: 0;
  }

  .sale-totals {
    padding: 12px 0;
    border-top: 1px solid var(--ion-color-light-shade);
    border-bottom: 1px solid var(--ion-color-light-shade);
    margin-bottom: 12px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .total-row:last-child {
    margin-bottom: 0;
  }

  .total-row .label {
    font-size: 13px;
    color: var(--ion-color-medium);
  }

  .total-row .value {
    font-size: 15px;
    font-weight: 600;
    color: var(--ion-color-dark);
  }

  .total-row.total .value {
    font-size: 18px;
    color: var(--ion-color-primary);
  }

  .total-row.debt .value {
    color: var(--ion-color-warning);
  }

  .total-row.profit .value {
    color: var(--ion-color-success);
  }

  .payment-method {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--ion-color-medium);
  }

  .payment-method ion-icon {
    font-size: 18px;
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
</style>