<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="closeModal">Cancelar</ion-button>
                </ion-buttons>
                <ion-title>Registrar Abono</ion-title>
                <ion-buttons slot="end">
                    <ion-button
                        :disabled="!canSubmit || isLoading"
                        @click="handleSubmit"
                        strong
                    >
                        {{ isLoading ? 'Guardando...' : 'Guardar' }}
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">

        <!-- Nombre del cliente -->
        <div class="client-name-header">
            <ion-icon :icon="personOutline" color="primary"></ion-icon>
            <h2>{{ clientName }}</h2>
        </div>

        <!-- Seleccionar a qué venta aplicar el abono -->
        <div class="form-section">
            <h3>Aplicar abono a</h3>

            <ion-card
            v-for="sale in sales"
            :key="sale.id"
            class="sale-option"
            :class="{ selected: selectedSaleId === sale.id }"
            button
            @click="selectedSaleId = sale.id"
            >
                <ion-card-content>
                    <div class="sale-option-row">
                        <div class="sale-option-info">
                            <span class="sale-num">{{ sale.saleNumber }}</span>
                            <span class="sale-opt-date">{{ formatDate(sale.createdAt) }}</span>
                        </div>
                        <div class="sale-option-debt">
                            <span class="pending-amount">{{ formatCurrency(sale.amountDue) }}</span>
                            <span class="pending-label">pendiente</span>
                        </div>
                        <ion-radio :value="sale.id" :checked="selectedSaleId === sale.id"></ion-radio>
                    </div>
                </ion-card-content>
            </ion-card>
        </div>

        <!-- Monto del abono -->
        <div class="form-section">
            <h3>Monto del abono</h3>

            <!-- Acceso rápido: pagar el total pendiente -->
            <ion-button
            v-if="selectedSale"
            fill="outline"
            size="small"
            @click="setFullAmount"
            class="full-amount-btn"
            >
                Pagar todo ({{ formatCurrency(selectedSale.amountDue) }})
            </ion-button>

            <ion-item class="amount-item">
                <ion-label position="floating">Monto *</ion-label>
                <ion-input
                    v-model.number="amount"
                    type="number"
                    min="1"
                    :max="selectedSale?.amountDue"
                    placeholder="0"
                ></ion-input>
            </ion-item>
        </div>

        <!-- Método de pago del abono -->
        <div class="form-section">
            <h3>Método de pago</h3>
            <ion-item>
                <ion-label>Método</ion-label>
                <ion-select v-model="paymentMethod" interface="action-sheet">
                    <ion-select-option value="cash">💵 Efectivo</ion-select-option>
                    <ion-select-option value="card">💳 Tarjeta</ion-select-option>
                    <ion-select-option value="transfer">🏦 Transferencia</ion-select-option>
                </ion-select>
            </ion-item>
        </div>

        <!-- Nota opcional -->
        <div class="form-section">
            <h3>Nota (opcional)</h3>
            <ion-item>
                <ion-label position="floating">Nota del abono</ion-label>
                <ion-textarea
                    v-model="notes"
                    placeholder="Ej: Abono en efectivo, entregó $50k..."
                    :rows="2"
                ></ion-textarea>
            </ion-item>
        </div>

        <!-- Error -->
        <ion-text v-if="errorMessage" color="danger">
            <p class="error-msg">{{ errorMessage }}</p>
        </ion-text>

        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { ref, computed } from 'vue';
    import {
        IonPage, IonHeader, IonToolbar, IonButtons, IonButton,
        IonTitle, IonContent, IonItem, IonLabel, IonInput,
        IonTextarea, IonSelect, IonSelectOption, IonCard,
        IonCardContent, IonIcon, IonText, IonRadio,
        modalController, toastController,
    } from '@ionic/vue';
    import { personOutline } from 'ionicons/icons';

    import { useSalesStore } from '@/stores/sales';
    import type { Sale, PaymentMethod } from '@/models/Sale';

    // ============================================
    // PROPS
    // ============================================
    const props = defineProps<{
        clientName: string;
        sales: Sale[];  // Ventas con deuda pendiente del cliente
    }>();

    // ============================================
    // COMPOSABLES
    // ============================================
    const salesStore = useSalesStore();

    // ============================================
    // ESTADO
    // ============================================

    // Si solo hay una venta, la preseleccionamos
    const selectedSaleId = ref<string>(
        props.sales.length === 1 ? props.sales[0].id : ''
    );

    const amount = ref<number>(0);
    const paymentMethod = ref<PaymentMethod>('cash');
    const notes = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');

    // ============================================
    // COMPUTED
    // ============================================

    /** La venta seleccionada actualmente */
    const selectedSale = computed(() =>
        props.sales.find(s => s.id === selectedSaleId.value) || null
    );

    /** Validación para habilitar el botón de guardar */
    const canSubmit = computed(() =>
        selectedSaleId.value !== '' &&
        amount.value > 0 &&
        selectedSale.value !== null &&
        amount.value <= (selectedSale.value?.amountDue ?? 0)
    );

    // ============================================
    // FUNCIONES
    // ============================================

    /** Establece el monto total de la deuda seleccionada */
    function setFullAmount() {
        if (selectedSale.value) {
            amount.value = selectedSale.value.amountDue;
        }
    }

    /** Registra el abono usando addPayment del sales store */
    async function handleSubmit() {
        errorMessage.value = '';

        if (!selectedSale.value) {
            errorMessage.value = 'Selecciona una venta';
            return;
        }

        if (amount.value <= 0) {
            errorMessage.value = 'El monto debe ser mayor a 0';
            return;
        }

        if (amount.value > selectedSale.value.amountDue) {
            errorMessage.value = `El monto no puede superar la deuda ($${selectedSale.value.amountDue.toLocaleString('es-CO')})`;
            return;
        }

        isLoading.value = true;

        try {
            const result = await salesStore.addPayment(selectedSaleId.value, {
                amount: amount.value,
                method: paymentMethod.value,
                // notes: notes.value || undefined,
            });

            if (result.success) {
                await showToast(
                    `Abono de ${formatCurrency(amount.value)} registrado ✓`,
                    'success'
                );
                await modalController.dismiss({ success: true });
            } else {
                errorMessage.value = result.error || 'Error al registrar abono';
            }
        } catch (error) {
            errorMessage.value = 'Error inesperado. Intenta de nuevo.';
        } finally {
            isLoading.value = false;
        }
    }

    async function closeModal() {
        await modalController.dismiss();
    }

    async function showToast(message: string, color: string = 'primary') {
        const toast = await toastController.create({
            message,
            duration: 2500,
            position: 'top',
            color,
        });
        await toast.present();
    }

    function formatCurrency(value: number): string {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
        return `$${value.toLocaleString('es-CO')}`;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    }
</script>

<style scoped>
    .client-name-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 0 16px;
        border-bottom: 1px solid var(--ion-color-light-shade);
        margin-bottom: 8px;
    }

    .client-name-header ion-icon {
        font-size: 24px;
    }

    .client-name-header h2 {
        font-size: 18px;
        font-weight: 700;
        color: var(--ion-color-dark);
        margin: 0;
    }

    .form-section {
        margin-top: 20px;
    }

    .form-section h3 {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--ion-color-medium);
        margin: 0 0 8px 4px;
    }

    /* Opciones de venta */
    .sale-option {
        margin: 0 0 8px;
        transition: border 0.2s;
    }

    .sale-option.selected {
        border: 2px solid var(--ion-color-primary);
    }

    .sale-option ion-card-content {
        padding: 12px 14px;
    }

    .sale-option-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .sale-option-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .sale-num {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-dark);
    }

    .sale-opt-date {
        font-size: 11px;
        color: var(--ion-color-medium);
    }

    .sale-option-debt {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }

    .pending-amount {
        font-size: 15px;
        font-weight: 700;
        color: var(--ion-color-danger);
    }

    .pending-label {
        font-size: 10px;
        color: var(--ion-color-medium);
    }

    /* Botón de monto completo */
    .full-amount-btn {
        margin-bottom: 10px;
    }

    .amount-item {
        margin-bottom: 0;
    }

    .error-msg {
        font-size: 13px;
        padding: 8px 4px;
    }
</style>