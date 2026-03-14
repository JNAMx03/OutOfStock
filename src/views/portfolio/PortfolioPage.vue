<template>
    <ion-page>
        <!-- Header -->
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-menu-button></ion-menu-button>
                </ion-buttons>
                <ion-title>Cartera</ion-title>
                <ion-buttons slot="end">
                    <!-- Ordenar -->
                    <ion-button id="sort-trigger">
                        <ion-icon :icon="funnelOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>

            <!-- Barra de búsqueda -->
            <ion-toolbar>
                <ion-searchbar
                v-model="searchQuery"
                placeholder="Buscar cliente por nombre o teléfono"
                @ionInput="handleSearch"
                :debounce="300"
                ></ion-searchbar>
            </ion-toolbar>

            <!-- Segmento de filtros -->
            <ion-toolbar>
                <ion-segment v-model="activeFilter" @ionChange="handleFilterChange">
                    <ion-segment-button value="all">
                        <ion-label>Todos ({{ clientsStore.allClients.length }})</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="debtors">
                        <ion-label>Deudores ({{ clientsStore.debtorsCount }})</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="frequent">
                        <ion-label>Frecuentes</ion-label>
                    </ion-segment-button>
                </ion-segment>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">

        <!-- Pull to refresh -->
        <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <!-- Resumen de deudas (solo si hay deudores) -->
        <div v-if="clientsStore.debtorsCount > 0" class="debt-summary ion-padding-horizontal">
            <ion-card color="danger" class="summary-card">
                <ion-card-content>
                    <div class="summary-content">
                        <div class="summary-icon">
                            <ion-icon :icon="alertCircleOutline"></ion-icon>
                        </div>
                        <div class="summary-info">
                            <p class="summary-label">Total por cobrar</p>
                            <p class="summary-value">
                            {{ formatCurrency(clientsStore.totalPendingDebt) }}
                            </p>
                        </div>
                        <div class="summary-count">
                            <p class="count-num">{{ clientsStore.debtorsCount }}</p>
                            <p class="count-label">clientes</p>
                        </div>
                    </div>
                </ion-card-content>
            </ion-card>
        </div>

        <!-- Popover de ordenamiento -->
        <ion-popover trigger="sort-trigger" trigger-action="click">
            <ion-content>
                <ion-list lines="none">
                    <ion-list-header>Ordenar por</ion-list-header>
                    <ion-item button @click="setSortBy('debt')">
                        <ion-icon :icon="cashOutline" slot="start" color="danger"></ion-icon>
                        <ion-label>Mayor deuda</ion-label>
                        <ion-icon
                            v-if="currentSort === 'debt'"
                            :icon="checkmarkOutline"
                            slot="end"
                            color="primary"
                        ></ion-icon>
                    </ion-item>
                    <ion-item button @click="setSortBy('purchases')">
                        <ion-icon :icon="cartOutline" slot="start" color="success"></ion-icon>
                        <ion-label>Mayor comprador</ion-label>
                        <ion-icon
                            v-if="currentSort === 'purchases'"
                            :icon="checkmarkOutline"
                            slot="end"
                            color="primary"
                        ></ion-icon>
                    </ion-item>
                    <ion-item button @click="setSortBy('lastPurchase')">
                        <ion-icon :icon="timeOutline" slot="start" color="primary"></ion-icon>
                        <ion-label>Más reciente</ion-label>
                        <ion-icon
                            v-if="currentSort === 'lastPurchase'"
                            :icon="checkmarkOutline"
                            slot="end"
                            color="primary"
                        ></ion-icon>
                    </ion-item>
                    <ion-item button @click="setSortBy('name')">
                        <ion-icon :icon="textOutline" slot="start" color="medium"></ion-icon>
                        <ion-label>Nombre A-Z</ion-label>
                        <ion-icon
                            v-if="currentSort === 'name'"
                            :icon="checkmarkOutline"
                            slot="end"
                            color="primary"
                        ></ion-icon>
                    </ion-item>
                </ion-list>
            </ion-content>
        </ion-popover>

        <!-- Estado cargando -->
        <div v-if="isLoading" class="loading-state">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Cargando clientes...</p>
        </div>

        <!-- Lista de clientes -->
        <div
            v-else-if="clientsStore.filteredClients.length > 0"
            class="clients-list ion-padding"
        >
            <ion-card
            v-for="client in clientsStore.filteredClients"
            :key="client.id"
            class="client-card"
            button
            @click="openClientDetail(client)"
            >
                <ion-card-content>
                    <div class="client-row">

                        <!-- Avatar con inicial -->
                        <div class="client-avatar" :class="{ 'has-debt': client.totalDebt > 0 }">
                            {{ client.name.charAt(0).toUpperCase() }}
                        </div>

                        <!-- Información del cliente -->
                        <div class="client-info">
                            <div class="client-name-row">
                                <h3>{{ client.name }}</h3>
                                <!-- Badge de cliente frecuente -->
                                <ion-badge v-if="isFrequent(client)" color="warning" class="frequent-badge">
                                    ⭐ Frecuente
                                </ion-badge>
                            </div>

                            <p v-if="client.phone" class="client-phone">
                                <ion-icon :icon="callOutline"></ion-icon>
                                {{ client.phone }}
                            </p>

                            <div class="client-stats">
                                <span class="stat">
                                    <ion-icon :icon="cartOutline"></ion-icon>
                                    {{ client.salesCount }} compra{{ client.salesCount !== 1 ? 's' : '' }}
                                </span>
                                <span class="stat">
                                    <ion-icon :icon="timeOutline"></ion-icon>
                                    {{ formatDate(client.lastPurchaseDate) }}
                                </span>
                            </div>
                        </div>

                        <!-- Deuda o estado al día -->
                        <div class="client-debt-col">
                            <div v-if="client.totalDebt > 0" class="debt-indicator">
                                <p class="debt-amount danger">
                                    {{ formatCurrency(client.totalDebt) }}
                                </p>
                                <p class="debt-label">pendiente</p>
                            </div>
                            <div v-else class="paid-indicator">
                                <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
                                <p class="paid-label">Al día</p>
                            </div>
                        </div>

                    </div>
                </ion-card-content>
            </ion-card>
        </div>

        <!-- Estado vacío -->
        <div v-else class="empty-state ion-padding">
            <ion-icon :icon="peopleOutline" class="empty-icon"></ion-icon>
            <h3>
            {{
                searchQuery
                ? 'Sin resultados'
                : activeFilter === 'debtors'
                ? 'No hay deudas pendientes 🎉'
                : 'Sin clientes registrados'
            }}
            </h3>
            <p>
            {{
                searchQuery
                ? `No se encontró "${searchQuery}"`
                : activeFilter === 'debtors'
                ? 'Todos tus clientes están al día.'
                : 'Los clientes aparecen aquí cuando registras ventas con nombre de cliente.'
            }}
            </p>
        </div>

        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { ref, onMounted, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import {
        IonPage, IonHeader, IonToolbar, IonButtons, IonMenuButton,
        IonButton, IonTitle, IonContent, IonCard, IonCardContent,
        IonIcon, IonBadge, IonLabel, IonList, IonListHeader, IonItem,
        IonSegment, IonSegmentButton, IonSearchbar, IonSpinner,
        IonRefresher, IonRefresherContent, IonPopover,
    } from '@ionic/vue';
    import {
        alertCircleOutline, funnelOutline, cashOutline, cartOutline,
        timeOutline, callOutline, checkmarkCircleOutline, peopleOutline,
        textOutline, checkmarkOutline,
    } from 'ionicons/icons';

    import { useStoresStore } from '@/stores/stores';
    import { useSalesStore } from '@/stores/sales';
    import { useClientsStore } from '@/stores/clients';
    import type { Client, ClientFilter, ClientSortBy } from '@/models/Client';
    import { isFrequentClient } from '@/models/Client';

    // ============================================
    // COMPOSABLES
    // ============================================
    const router = useRouter();
    const storesStore = useStoresStore();
    const salesStore = useSalesStore();
    const clientsStore = useClientsStore();

    // ============================================
    // ESTADO LOCAL
    // ============================================
    const isLoading = ref(false);
    const searchQuery = ref('');
    const activeFilter = ref<ClientFilter>('all');
    const currentSort = ref<ClientSortBy>('debt');

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Carga las ventas si no están en memoria
     */
    async function loadData() {
        const storeId = storesStore.currentStoreId;
        if (!storeId) return;
        isLoading.value = true;
        try {
            await salesStore.fetchSales(storeId);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Cambia el filtro de segmento
     */
    function handleFilterChange(event: any) {   
        const filter = event.detail.value as ClientFilter;
        activeFilter.value = filter;
        clientsStore.setFilter(filter);
    }

    /**
     * Maneja la búsqueda
     */
    function handleSearch() {
        clientsStore.setSearch(searchQuery.value);
    }

    /**
     * Cambia el orden y cierra el popover
     */
    function setSortBy(sort: ClientSortBy) {
        currentSort.value = sort;
        clientsStore.setSortBy(sort);
    }

    /**
     * Abre el detalle de un cliente
     */
    function openClientDetail(client: Client) {
        router.push(`/portfolio/client/${client.id}`);
    }

    /**
     * Pull to refresh
     */
    async function handleRefresh(event: any) {
        await loadData();
        event.target.complete();
    }

    /**
     * Determina si un cliente es frecuente
     */
    function isFrequent(client: Client): boolean {
        return isFrequentClient(client);
    }

    /**
     * Formatea moneda (abreviada para la lista)
     */
    function formatCurrency(value: number): string {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
        return `$${value.toLocaleString('es-CO')}`;
    }

    /**
     * Formatea fecha de manera relativa y legible
     */
    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
        return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    }

    // ============================================
    // LIFECYCLE
    // ============================================
    onMounted(async () => {
        await loadData();
    });

    watch(() => storesStore.currentStoreId, async (newId) => {
        if (newId) await loadData();
    });
</script>

<style scoped>
    /* Banner de resumen de deuda */
    .debt-summary {
        padding-top: 16px;
    }

    .summary-card {
        margin: 0;
    }

    .summary-card ion-card-content {
        padding: 16px;
    }

    .summary-content {
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;
    }

    .summary-icon ion-icon {
        font-size: 32px;
    }

    .summary-info {
        flex: 1;
    }

    .summary-label {
        font-size: 12px;
        margin: 0;
        opacity: 0.9;
    }

    .summary-value {
        font-size: 22px;
        font-weight: 800;
        margin: 0;
    }

    .summary-count {
        text-align: center;
    }

    .count-num {
        font-size: 24px;
        font-weight: 800;
        margin: 0;
    }

    .count-label {
        font-size: 11px;
        opacity: 0.85;
        margin: 0;
    }

    /* Lista de clientes */
    .clients-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .client-card {
        margin: 0;
    }

    .client-card ion-card-content {
        padding: 14px 16px;
    }

    .client-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    /* Avatar */
    .client-avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: var(--ion-color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 700;
        flex-shrink: 0;
    }

    .client-avatar.has-debt {
        background: var(--ion-color-danger);
    }

    /* Info del cliente */
    .client-info {
        flex: 1;
        min-width: 0;
    }

    .client-name-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 2px;
    }

    .client-name-row h3 {
        font-size: 15px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
    }

    .frequent-badge {
        font-size: 10px;
    }

    .client-phone {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 2px 0;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .client-phone ion-icon {
        font-size: 12px;
    }

    .client-stats {
        display: flex;
        gap: 12px;
        margin-top: 4px;
    }

    .stat {
        font-size: 11px;
        color: var(--ion-color-medium);
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .stat ion-icon {
        font-size: 11px;
    }

    /* Columna de deuda */
    .client-debt-col {
        text-align: right;
        flex-shrink: 0;
    }

    .debt-indicator {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }

    .debt-amount {
        font-size: 16px;
        font-weight: 700;
        margin: 0;
    }

    .debt-amount.danger {
        color: var(--ion-color-danger);
    }

    .debt-label {
        font-size: 10px;
        color: var(--ion-color-medium);
        margin: 0;
    }

    .paid-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }

    .paid-indicator ion-icon {
        font-size: 22px;
    }

    .paid-label {
        font-size: 10px;
        color: var(--ion-color-success);
        margin: 0;
        font-weight: 600;
    }

    /* Estado cargando y vacío */
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

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        text-align: center;
    }

    .empty-icon {
        font-size: 80px;
        color: var(--ion-color-light-shade);
        margin-bottom: 16px;
    }

    .empty-state h3 {
        font-size: 18px;
        color: var(--ion-color-dark);
        margin: 0 0 8px;
    }

    .empty-state p {
        color: var(--ion-color-medium);
        line-height: 1.5;
        max-width: 280px;
    }

    @media (min-width: 600px) {
        .clients-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        }
    }
</style>