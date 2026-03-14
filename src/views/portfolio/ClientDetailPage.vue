<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/portfolio"></ion-back-button>
                </ion-buttons>
                <ion-title>{{ client?.name || 'Cliente' }}</ion-title>
                <ion-buttons slot="end">
                    <!-- Botón de llamar (si tiene teléfono) -->
                    <ion-button v-if="client?.phone" :href="`tel:${client.phone}`">
                        <ion-icon :icon="callOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">

            <!-- Si no existe el cliente -->
            <div v-if="!client" class="loading-state">
                <ion-spinner name="crescent"></ion-spinner>
            </div>

            <div v-else>

                <!-- ============================
                    ENCABEZADO DEL CLIENTE
                    ============================ -->
                <div class="client-header ion-padding">

                    <!-- Avatar grande -->
                    <div class="avatar-large" :class="{ 'has-debt': client.totalDebt > 0 }">
                        {{ client.name.charAt(0).toUpperCase() }}
                    </div>

                    <!-- Nombre y badges -->
                    <div class="header-info">
                        <h1>{{ client.name }}</h1>
                        <div class="header-badges">
                            <ion-badge v-if="client.totalDebt > 0" color="danger">
                                Deuda: {{ formatCurrency(client.totalDebt) }}
                            </ion-badge>
                            <ion-badge v-else color="success">Al día ✓</ion-badge>
                            <ion-badge v-if="isFrequent" color="warning">⭐ Frecuente</ion-badge>
                        </div>
                        <p v-if="client.phone" class="contact-line">
                            <ion-icon :icon="callOutline"></ion-icon> {{ client.phone }}
                        </p>
                        <p v-if="client.email" class="contact-line">
                            <ion-icon :icon="mailOutline"></ion-icon> {{ client.email }}
                        </p>
                    </div>
                </div>

                <!-- ============================
                    KPIs DEL CLIENTE
                    ============================ -->
                <div class="kpi-strip ion-padding-horizontal">
                    <div class="kpi-item">
                        <p class="kpi-val">{{ client.salesCount }}</p>
                        <p class="kpi-lbl">Compras</p>
                    </div>
                    <div class="kpi-divider"></div>
                    <div class="kpi-item">
                        <p class="kpi-val">{{ formatCurrency(client.totalPurchases) }}</p>
                        <p class="kpi-lbl">Total comprado</p>
                    </div>
                    <div class="kpi-divider"></div>
                    <div class="kpi-item">
                        <p class="kpi-val danger">{{ formatCurrency(client.totalDebt) }}</p>
                        <p class="kpi-lbl">Pendiente</p>
                    </div>
                </div>

                <!-- Botón de registrar abono (solo si tiene deuda) -->
                <div v-if="client.totalDebt > 0" class="add-payment-btn ion-padding">
                    <ion-button expand="block" color="success" @click="openAddPayment">
                        <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
                        Registrar Abono
                    </ion-button>
                </div>

                <!-- ============================
                    HISTORIAL DE COMPRAS
                    ============================ -->
                <div class="section ion-padding-horizontal">
                    <h2 class="section-title">Historial de Compras</h2>

                    <ion-card v-if="clientSales.length === 0" class="empty-sales">
                        <ion-card-content>
                            <p>No hay ventas registradas.</p>
                        </ion-card-content>
                    </ion-card>

                    <ion-card
                        v-for="sale in clientSales"
                        :key="sale.id"
                        class="sale-card"
                    >
                        <ion-card-content>

                            <!-- Cabecera de la venta -->
                            <div class="sale-header">
                                <div class="sale-id-date">
                                    <span class="sale-number">{{ sale.saleNumber }}</span>
                                    <span class="sale-date">{{ formatDateFull(sale.createdAt) }}</span>
                                </div>
                                <ion-badge :color="getSaleStatusColor(sale.status)">
                                    {{ getSaleStatusName(sale.status) }}
                                </ion-badge>
                            </div>

                            <!-- Items de la venta -->
                            <div class="sale-items">
                                <p
                                v-for="item in sale.items"
                                :key="item.productId"
                                class="sale-item-line"
                                >
                                    {{ item.quantity }}× {{ item.productName }}
                                    <span class="item-subtotal">{{ formatCurrency(item.subtotal) }}</span>
                                </p>
                            </div>

                            <!-- Totales de la venta -->
                            <div class="sale-totals">
                                <div class="total-row-mini">
                                    <span>Total</span>
                                    <span class="bold">{{ formatCurrency(sale.total) }}</span>
                                </div>
                                <div class="total-row-mini">
                                    <span>Pagado</span>
                                    <span class="success">{{ formatCurrency(sale.amountPaid || 0) }}</span>
                                </div>
                                <div v-if="sale.amountDue > 0" class="total-row-mini">
                                    <span>Pendiente</span>
                                    <span class="danger bold">{{ formatCurrency(sale.amountDue) }}</span>
                                </div>
                            </div>

                            <!-- Historial de abonos de esta venta -->
                            <div
                                v-if="sale.payments && sale.payments.length > 0"
                                class="payment-history"
                            >
                                <p class="history-title">Abonos recibidos:</p>
                                <div
                                v-for="(payment, idx) in sale.payments"
                                :key="idx"
                                class="payment-entry"
                                >
                                    <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
                                    <span class="payment-amount success">
                                        +{{ formatCurrency(payment.amount) }}
                                    </span>
                                    <span class="payment-method-name">
                                        ({{ getPaymentMethodName(payment.method) }})
                                    </span>
                                    <span class="payment-date">
                                        {{ formatDateShort(payment.date) }}
                                    </span>
                                </div>
                            </div>

                            <!-- Botón de abono por venta individual -->
                            <div v-if="sale.amountDue > 0" class="sale-pay-btn">
                                <ion-button
                                fill="outline"
                                size="small"
                                color="success"
                                @click="openAddPaymentForSale(sale)"
                                >
                                    <ion-icon :icon="cashOutline" slot="start"></ion-icon>
                                    Abonar a esta venta
                                </ion-button>
                            </div>

                        </ion-card-content>
                    </ion-card>
                </div>

            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import {
        IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
        IonButton, IonTitle, IonContent, IonCard, IonCardContent,
        IonIcon, IonBadge, IonSpinner, modalController,
    } from '@ionic/vue';
    import {
        callOutline, mailOutline, addCircleOutline,
        cashOutline, checkmarkCircleOutline,
    } from 'ionicons/icons';

    import { useClientsStore } from '@/stores/clients';
    // import { useSalesStore } from '@/stores/sales';
    import { isFrequentClient } from '@/models/Client';
    import {
        getSaleStatusColor, getSaleStatusName,
        getPaymentMethodName,
    } from '@/models/Sale';
    import type { Sale } from '@/models/Sale';
    import AddPaymentModal from '@/components/portfolio/AddPaymentModal.vue';

    // ============================================
    // COMPOSABLES
    // ============================================
    const route = useRoute();
    const clientsStore = useClientsStore();
    // const salesStore = useSalesStore();

    // ============================================
    // COMPUTED
    // ============================================

    /** ID del cliente desde la URL */
    const clientId = computed(() => route.params.id as string);

    /** Datos del cliente */
    const client = computed(() => clientsStore.getClientById(clientId.value));

    /** Ventas del cliente ordenadas por fecha (más reciente primero) */
    const clientSales = computed(() =>
        clientsStore.getSalesByClient(clientId.value)
    );

    /** Si es cliente frecuente */
    const isFrequent = computed(() =>
        client.value ? isFrequentClient(client.value) : false
    );

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Abre el modal de abono (para todas las deudas del cliente)
     */
    async function openAddPayment() {
        if (!client.value) return;

        // Pasar todas las ventas con deuda pendiente
        const salesWithDebt = clientSales.value.filter(s => s.amountDue > 0);

        const modal = await modalController.create({
            component: AddPaymentModal,
            componentProps: {
                clientName: client.value.name,
                sales: salesWithDebt,
            },
            initialBreakpoint: 0.75,
            breakpoints: [0, 0.75, 1],
        });

        await modal.present();
    }

    /**
     * Abre el modal de abono para una venta específica
     */
    async function openAddPaymentForSale(sale: Sale) {
        const modal = await modalController.create({
            component: AddPaymentModal,
            componentProps: {
                clientName: client.value?.name || '',
                sales: [sale],  // Solo esa venta
            },
            initialBreakpoint: 0.75,
            breakpoints: [0, 0.75, 1],
        });

        await modal.present();
    }

    function formatCurrency(value: number): string {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
        return `$${value.toLocaleString('es-CO')}`;
    }

    function formatDateFull(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    function formatDateShort(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short',
        });
    }
</script>

<style scoped>
    /* Encabezado del cliente */
    .client-header {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        padding-top: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--ion-color-light-shade);
    }

    .avatar-large {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--ion-color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: 700;
        flex-shrink: 0;
    }

    .avatar-large.has-debt {
        background: var(--ion-color-danger);
    }

    .header-info {
        flex: 1;
    }

    .header-info h1 {
        font-size: 22px;
        font-weight: 700;
        color: var(--ion-color-dark);
        margin: 0 0 8px;
    }

    .header-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
    }

    .contact-line {
        font-size: 13px;
        color: var(--ion-color-medium);
        margin: 2px 0;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* KPI strip */
    .kpi-strip {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding-top: 16px;
        padding-bottom: 16px;
        background: var(--ion-color-light);
        margin: 16px 0;
        border-radius: 12px;
    }

    .kpi-item {
        text-align: center;
        flex: 1;
    }

    .kpi-val {
        font-size: 18px;
        font-weight: 800;
        color: var(--ion-color-dark);
        margin: 0;
    }

    .kpi-val.danger { color: var(--ion-color-danger); }

    .kpi-lbl {
        font-size: 11px;
        color: var(--ion-color-medium);
        margin: 2px 0 0;
        text-transform: uppercase;
    }

    .kpi-divider {
        width: 1px;
        height: 36px;
        background: var(--ion-color-light-shade);
    }

    /* Botón de abono */
    .add-payment-btn {
        padding-bottom: 0;
    }

    /* Historial de ventas */
    .section {
        padding-bottom: 24px;
    }

    .section-title {
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--ion-color-medium);
        margin: 16px 0 10px;
    }

    .sale-card {
        margin: 0 0 12px;
    }

    .sale-card ion-card-content {
        padding: 14px 16px;
    }

    .sale-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .sale-id-date {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .sale-number {
        font-size: 14px;
        font-weight: 700;
        color: var(--ion-color-dark);
    }

    .sale-date {
        font-size: 11px;
        color: var(--ion-color-medium);
    }

    /* Items de la venta */
    .sale-items {
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--ion-color-light-shade);
    }

    .sale-item-line {
        font-size: 13px;
        color: var(--ion-color-dark);
        margin: 2px 0;
        display: flex;
        justify-content: space-between;
    }

    .item-subtotal {
        font-weight: 600;
    }

    /* Totales */
    .sale-totals {
        margin-bottom: 8px;
    }

    .total-row-mini {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--ion-color-medium);
        padding: 2px 0;
    }

    .total-row-mini .bold { font-weight: 700; color: var(--ion-color-dark); }
    .total-row-mini .success { color: var(--ion-color-success); font-weight: 600; }
    .total-row-mini .danger { color: var(--ion-color-danger); }

    /* Abonos */
    .payment-history {
        padding-top: 8px;
        border-top: 1px solid var(--ion-color-light-shade);
        margin-top: 8px;
    }

    .history-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--ion-color-medium);
        margin: 0 0 6px;
    }

    .payment-entry {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        margin-bottom: 4px;
    }

    .payment-amount.success { color: var(--ion-color-success); font-weight: 700; }
    .payment-method-name { color: var(--ion-color-medium); }
    .payment-date { color: var(--ion-color-medium); margin-left: auto; }

    .sale-pay-btn {
        margin-top: 8px;
    }

    /* Estados */
    .loading-state {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 50vh;
    }

    .empty-sales ion-card-content {
        text-align: center;
        color: var(--ion-color-medium);
    }
</style>