<template>
    <ion-page>
        <!-- Header -->
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-menu-button></ion-menu-button>
                </ion-buttons>
                <ion-title>Finanzas</ion-title>
                <ion-buttons slot="end">
                    <!-- Botón para refrescar datos -->
                    <ion-button @click="loadData" :disabled="isLoading">
                        <ion-icon :icon="refreshOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>

            <!-- Selector de período -->
            <ion-toolbar>
                <ion-segment
                v-model="selectedPeriod"
                @ionChange="handlePeriodChange"
                scrollable
                >
                    <ion-segment-button value="today">
                        <ion-label>Hoy</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="week">
                        <ion-label>Semana</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="month">
                        <ion-label>Mes</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="year">
                        <ion-label>Año</ion-label>
                    </ion-segment-button>
                </ion-segment>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">

        <!-- Pull to refresh -->
        <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <!-- Estado de carga -->
        <div v-if="isLoading" class="loading-state">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Cargando datos financieros...</p>
        </div>

        <div v-else class="ion-padding">

            <!-- ============================
                SECCIÓN 1: KPIs PRINCIPALES
                ============================ -->
            <section class="section">
                <h2 class="section-title">Resumen del Período</h2>

                <!-- Grid de 2x2 de tarjetas KPI -->
                <div class="kpi-grid">

                    <!-- Ingresos Totales -->
                    <ion-card class="kpi-card kpi-card--primary">
                        <ion-card-content>
                            <div class="kpi-icon-wrap" style="background: rgba(56,128,255,0.12)">
                                <ion-icon :icon="cashOutline" color="primary"></ion-icon>
                            </div>
                            <p class="kpi-label">Ingresos</p>
                            <p class="kpi-value">{{ formatCurrency(kpis.totalRevenue) }}</p>
                            <p class="kpi-sub">{{ kpis.totalSales }} ventas</p>
                        </ion-card-content>
                    </ion-card>

                    <!-- Ganancia Neta -->
                    <ion-card class="kpi-card kpi-card--success">
                        <ion-card-content>
                            <div class="kpi-icon-wrap" style="background: rgba(16,220,96,0.12)">
                                <ion-icon :icon="trendingUpOutline" color="success"></ion-icon>
                            </div>
                            <p class="kpi-label">Ganancia Neta</p>
                            <p class="kpi-value success">{{ formatCurrency(kpis.totalProfit) }}</p>
                            <p class="kpi-sub">Margen: {{ kpis.profitMargin }}%</p>
                        </ion-card-content>
                    </ion-card>

                    <!-- Ticket Promedio -->
                    <ion-card class="kpi-card">
                        <ion-card-content>
                            <div class="kpi-icon-wrap" style="background: rgba(255,196,9,0.12)">
                                <ion-icon :icon="receiptOutline" color="warning"></ion-icon>
                            </div>
                            <p class="kpi-label">Ticket Promedio</p>
                            <p class="kpi-value">{{ formatCurrency(kpis.averageTicket) }}</p>
                            <p class="kpi-sub">por transacción</p>
                        </ion-card-content>
                    </ion-card>

                    <!-- Deudas Pendientes -->
                    <ion-card class="kpi-card kpi-card--danger">
                        <ion-card-content>
                            <div class="kpi-icon-wrap" style="background: rgba(235,68,90,0.12)">
                                <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
                            </div>
                            <p class="kpi-label">Deudas</p>
                            <p class="kpi-value danger">{{ formatCurrency(kpis.pendingDebts) }}</p>
                            <p class="kpi-sub">pendientes de cobro</p>
                        </ion-card-content>
                    </ion-card>

                </div>
            </section>

            <!-- ============================
                SECCIÓN 2: GRÁFICA DE BARRAS
                ============================ -->
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">Ingresos vs Ganancia vs Costo</h2>
                </div>

                <ion-card class="chart-card">
                    <ion-card-content>
                        <SalesChart :data="chartData" />
                    </ion-card-content>
                </ion-card>
            </section>

            <!-- ============================
                SECCIÓN 3: MÉTODOS DE PAGO
                ============================ -->
            <section class="section" v-if="paymentSummary.length > 0">
                <h2 class="section-title">Métodos de Pago</h2>

                <div class="payment-layout">
                    <!-- Gráfica de donut -->
                    <ion-card class="chart-card chart-card--half">
                        <ion-card-content>
                            <PaymentChart :data="paymentSummary" />
                        </ion-card-content>
                    </ion-card>

                    <!-- Lista de métodos -->
                    <ion-card class="payment-list-card">
                        <ion-card-content>
                            <div
                            v-for="(item, index) in paymentSummary"
                            :key="item.method"
                            class="payment-row"
                            >
                                <div
                                    class="payment-dot"
                                    :style="{ background: paymentColors[index] }"
                                ></div>
                                <div class="payment-info">
                                    <span class="payment-method">{{ item.method }}</span>
                                    <span class="payment-count">{{ item.count }} trans.</span>
                                </div>
                                <div class="payment-amount">
                                    <span class="payment-total">{{ formatCurrency(item.total) }}</span>
                                    <span class="payment-pct">{{ item.percentage }}%</span>
                                </div>
                            </div>
                        </ion-card-content>
                    </ion-card>
                </div>
            </section>

            <!-- ============================
                SECCIÓN 4: TOP PRODUCTOS
                ============================ -->
            <section class="section" v-if="topProducts.length > 0">
                <h2 class="section-title">Productos Más Vendidos</h2>

                <ion-card>
                    <ion-list lines="none">
                        <ion-item
                            v-for="(product, index) in topProducts"
                            :key="product.productId"
                            class="top-product-item"
                        >
                            <!-- Posición (1°, 2°, etc.) -->
                            <div slot="start" :class="['rank-badge', `rank-badge--${index + 1}`]">
                                {{ index + 1 }}
                            </div>

                            <ion-label>
                                <h3>{{ product.productName }}</h3>
                                <p>{{ product.totalQuantity }} unidades vendidas</p>
                            </ion-label>

                            <div slot="end" class="product-revenue">
                                <span class="revenue">{{ formatCurrency(product.totalRevenue) }}</span>
                                <span class="profit-small success">
                                    +{{ formatCurrency(product.totalProfit) }}
                                </span>
                            </div>
                        </ion-item>
                    </ion-list>
                </ion-card>
            </section>

            <!-- ============================
                SECCIÓN 5: RESUMEN DE DEUDAS
                ============================ -->
            <section class="section" v-if="pendingSales.length > 0">
                <div class="section-header">
                    <h2 class="section-title">Deudas Pendientes</h2>
                    <ion-badge color="danger">{{ pendingSales.length }}</ion-badge>
                </div>

                <ion-card>
                    <ion-list lines="full">
                        <ion-item
                            v-for="sale in pendingSales.slice(0, 5)"
                            :key="sale.id"
                            class="debt-item"
                        >
                            <ion-label>
                                <h3>{{ sale.customer?.name || 'Cliente sin nombre' }}</h3>
                                <p>{{ sale.saleNumber }} · {{ formatDate(sale.createdAt) }}</p>
                            </ion-label>

                            <div slot="end" class="debt-amount">
                                <span class="debt-value danger">
                                    {{ formatCurrency(sale.amountDue) }}
                                </span>
                                <ion-badge :color="getSaleStatusColor(sale.status)">
                                    {{ getSaleStatusName(sale.status) }}
                                </ion-badge>
                            </div>
                        </ion-item>
                    </ion-list>

                    <!-- Ver más si hay más de 5 -->
                    <div v-if="pendingSales.length > 5" class="see-more">
                        <ion-button fill="clear" size="small">
                            Ver {{ pendingSales.length - 5 }} más
                            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
                        </ion-button>
                    </div>
                </ion-card>
            </section>

            <!-- Estado vacío (sin ventas en el período) -->
            <div v-if="kpis.totalSales === 0 && !isLoading" class="empty-state">
                <ion-icon :icon="statsChartOutline" class="empty-icon"></ion-icon>
                <h3>Sin ventas en este período</h3>
                <p>Registra tus primeras ventas para ver las estadísticas aquí.</p>
                <ion-button fill="outline" router-link="/tabs/sales">
                    <ion-icon :icon="cartOutline" slot="start"></ion-icon>
                    Ir a Ventas
                </ion-button>
            </div>

        </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { ref, computed, onMounted, watch } from 'vue';
    import {
        IonPage, IonHeader, IonToolbar, IonButtons, IonMenuButton,
        IonButton, IonTitle, IonContent, IonCard, IonCardContent,
        IonIcon, IonBadge, IonLabel, IonList, IonItem, IonSegment,
        IonSegmentButton, IonSpinner, IonRefresher, IonRefresherContent,
    } from '@ionic/vue';
    import {
        cashOutline, trendingUpOutline, receiptOutline, alertCircleOutline,
        refreshOutline, statsChartOutline, cartOutline, chevronForwardOutline,
    } from 'ionicons/icons';

    // import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';
    import { useSalesStore } from '@/stores/sales';
    import { useFinancialsStore } from '@/stores/financials';
    import type { FinancialPeriod } from '@/stores/financials';
    import { getSaleStatusColor, getSaleStatusName } from '@/models/Sale';
    import SalesChart from '@/components/financial/SalesChart.vue';
    import PaymentChart from '@/components/financial/PaymentChart.vue';

    // ============================================
    // COMPOSABLES
    // ============================================
    // const authStore = useAuthStore();
    const storesStore = useStoresStore();
    const salesStore = useSalesStore();
    const financialsStore = useFinancialsStore();

    // ============================================
    // ESTADO LOCAL
    // ============================================
    const isLoading = ref(false);
    const selectedPeriod = ref<FinancialPeriod>('month');

    // Colores para el gráfico de pastel (deben coincidir con PaymentChart.vue)
    const paymentColors = [
    'rgba(56, 128, 255, 0.8)',
    'rgba(16, 220, 96, 0.8)',
    'rgba(255, 196, 9, 0.8)',
    'rgba(235, 68, 90, 0.8)',
    'rgba(112, 68, 255, 0.8)',
    ];

    // ============================================
    // COMPUTED
    // ============================================

    /** ID de la tienda actual */
    const storeId = computed(() => storesStore.currentStoreId || '');

    /** KPIs calculados por el store financiero */
    const kpis = computed(() => financialsStore.getKPIs(storeId.value));

    /** Datos para la gráfica de barras */
    const chartData = computed(() => financialsStore.getChartData(storeId.value));

    /** Distribución por método de pago */
    const paymentSummary = computed(() =>
        financialsStore.getPaymentMethodSummary(storeId.value)
    );

    /** Top 5 productos más vendidos */
    const topProducts = computed(() =>
        financialsStore.getTopProducts(storeId.value, 5)
    );

    /** Ventas con deuda pendiente */
    const pendingSales = computed(() =>
        salesStore.sales.filter(s =>
            s.storeId === storeId.value &&
            (s.status === 'pending' || s.status === 'partial') &&
            s.amountDue > 0
        ).sort((a, b) => b.amountDue - a.amountDue) // Las de mayor deuda primero
    );

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Carga las ventas si no están cargadas aún
     */
    async function loadData() {
        if (!storeId.value) return;
        isLoading.value = true;

        try {
            await salesStore.fetchSales(storeId.value);
        } catch (error) {
            console.error('Error al cargar datos financieros:', error);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Maneja el cambio de período en el segmento
     */
    function handlePeriodChange(event: any) {
        const period = event.detail.value as FinancialPeriod;
        financialsStore.setPeriod(period);
    }

    /**
     * Pull to refresh
     */
    async function handleRefresh(event: any) {
        await loadData();
        event.target.complete();
    }

    /**
     * Formatea un número como moneda colombiana
     */
    function formatCurrency(value: number): string {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}k`;
        }
        return `$${value.toLocaleString('es-CO')}`;
    }

    /**
     * Formatea una fecha a texto legible
     */
    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
        });
    }

    // ============================================
    // LIFECYCLE
    // ============================================
    onMounted(async () => {
        // Sincronizar el período del store con el segmento visual
        selectedPeriod.value = financialsStore.activePeriod;
        await loadData();
    });

    // Si cambia la tienda, recargar datos
    watch(() => storesStore.currentStoreId, async (newId) => {
        if (newId) await loadData();
    });
</script>

<style scoped>
    /* ============================================
    ESTILOS DEL MÓDULO FINANCIERO
    ============================================ */

    /* Secciones */
    .section {
        margin-bottom: 28px;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .section-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--ion-color-dark);
        margin: 0 0 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Grid de KPIs */
    .kpi-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    .kpi-card {
        margin: 0;
    }

    .kpi-card ion-card-content {
        padding: 16px;
        text-align: center;
    }

    .kpi-icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 10px;
    }

    .kpi-icon-wrap ion-icon {
        font-size: 24px;
    }

    .kpi-label {
        font-size: 11px;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
        margin: 0 0 4px;
    }

    .kpi-value {
        font-size: 20px;
        font-weight: 800;
        color: var(--ion-color-dark);
        margin: 0 0 2px;
        line-height: 1.2;
    }

    .kpi-value.success { color: var(--ion-color-success); }
    .kpi-value.danger  { color: var(--ion-color-danger); }

    .kpi-sub {
        font-size: 11px;
        color: var(--ion-color-medium);
        margin: 0;
    }

    /* Tarjeta de gráfica */
    .chart-card {
        margin: 0;
    }

    .chart-card ion-card-content {
        padding: 16px;
    }

    /* Layout de métodos de pago */
    .payment-layout {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .payment-list-card {
        margin: 0;
    }

    .payment-list-card ion-card-content {
        padding: 12px 16px;
    }

    .payment-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid var(--ion-color-light-shade);
    }

    .payment-row:last-child { border-bottom: none; }

    .payment-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .payment-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .payment-method {
        font-size: 14px;
        font-weight: 500;
        color: var(--ion-color-dark);
    }

    .payment-count {
        font-size: 11px;
        color: var(--ion-color-medium);
    }

    .payment-amount {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }

    .payment-total {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-dark);
    }

    .payment-pct {
        font-size: 11px;
        color: var(--ion-color-medium);
    }

    /* Top productos */
    .top-product-item {
        --padding-start: 12px;
        --inner-padding-end: 12px;
    }

    .rank-badge {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: white;
        flex-shrink: 0;
        background: var(--ion-color-medium);
    }

    .rank-badge--1 { background: #FFD700; color: #333; }
    .rank-badge--2 { background: #C0C0C0; color: #333; }
    .rank-badge--3 { background: #CD7F32; color: white; }

    .product-revenue {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
    }

    .revenue {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-dark);
    }

    .profit-small {
        font-size: 11px;
    }

    .profit-small.success { color: var(--ion-color-success); }

    /* Deudas pendientes */
    .debt-item {
        --padding-start: 16px;
        --inner-padding-end: 16px;
    }

    .debt-amount {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
    }

    .debt-value {
        font-size: 15px;
        font-weight: 700;
    }

    .debt-value.danger { color: var(--ion-color-danger); }

    .see-more {
        display: flex;
        justify-content: center;
        padding: 8px;
    }

    /* Estado de carga */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        gap: 16px;
    }

    .loading-state p {
        color: var(--ion-color-medium);
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
        font-size: 80px;
        color: var(--ion-color-light-shade);
        margin-bottom: 16px;
    }

    .empty-state h3 {
        font-size: 20px;
        color: var(--ion-color-dark);
        margin: 0 0 8px;
    }

    .empty-state p {
        color: var(--ion-color-medium);
        margin-bottom: 24px;
        line-height: 1.5;
        max-width: 300px;
    }

    /* Responsive: en pantallas grandes, 4 KPIs en una fila */
    @media (min-width: 600px) {
        .kpi-grid {
            grid-template-columns: repeat(4, 1fr);
        }

        .payment-layout {
            flex-direction: row;
        }

        .chart-card--half {
            flex: 1;
        }

        .payment-list-card {
            flex: 1;
        }
    }
</style>

<!--
============================================
EXPLICACIÓN SIMPLE:
============================================

Esta es la pantalla del MÓDULO FINANCIERO.
Solo pueden verla el Dueño y el Admin.

CONTIENE:
1. SELECTOR DE PERÍODO (Hoy/Semana/Mes/Año)
   Al cambiarlo, todos los datos se recalculan.

2. KPIs PRINCIPALES (4 tarjetas):
   - Ingresos totales del período
   - Ganancia neta (lo que queda después de costos)
   - Ticket promedio por venta
   - Deudas pendientes de cobrar

3. GRÁFICA DE BARRAS:
   Ingresos vs Ganancia vs Costo, agrupados
   por hora/día/semana/mes según el período.

4. MÉTODOS DE PAGO:
   Gráfica de donut + lista con porcentajes.
   Muestra cómo pagan tus clientes.

5. TOP PRODUCTOS:
   Los 5 más vendidos con sus ingresos y ganancia.

6. DEUDAS PENDIENTES:
   Lista de ventas a crédito que aún no se cobran.

============================================
-->