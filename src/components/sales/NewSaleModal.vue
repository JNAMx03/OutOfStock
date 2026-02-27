<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="closeModal">Cancelar</ion-button>
                </ion-buttons>
                <ion-title>Nueva Venta</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="handleSubmit" :disabled="!canSubmit || isLoading">
                        <strong>Registrar</strong>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <form @submit.prevent="handleSubmit">
                
                <!-- Selección de productos -->
                <div class="form-section">
                    <div class="section-header">
                        <h3>Productos</h3>
                        <ion-button size="small" @click="openProductSelector">
                        <ion-icon :icon="addOutline" slot="start"></ion-icon>
                            Agregar
                        </ion-button>
                    </div>

                    <!-- Lista de productos en el carrito -->
                    <div v-if="cart.length > 0" class="cart-items">
                        <ion-card v-for="(item, index) in cart" :key="index" class="cart-item">
                            <ion-card-content>
                                <div class="item-content">
                                    <div class="item-info">
                                        <h4>{{ item.productName }}</h4>
                                        <p class="item-price">{{ formatPrice(item.unitPrice) }} c/u</p>
                                    </div>
                                
                                    <!-- Controles de cantidad -->
                                    <div class="quantity-controls">
                                        <ion-button 
                                            fill="clear" 
                                            size="small"
                                            @click="decrementQuantity(index)"
                                            :disabled="item.quantity <= 1"
                                        >
                                            <ion-icon :icon="removeOutline" slot="icon-only"></ion-icon>
                                        </ion-button>
                                        
                                        <ion-input
                                            v-model.number="item.quantity"
                                            type="number"
                                            min="1"
                                            class="quantity-input"
                                            @ionChange="updateItemSubtotal(index)"
                                        ></ion-input>
                                        
                                        <ion-button 
                                            fill="clear" 
                                            size="small"
                                            @click="incrementQuantity(index)"
                                        >
                                            <ion-icon :icon="addOutline" slot="icon-only"></ion-icon>
                                        </ion-button>
                                    </div>
                                
                                    <div class="item-subtotal">
                                        <p>{{ formatPrice(item.subtotal) }}</p>
                                    </div>
                                
                                    <ion-button 
                                        fill="clear" 
                                        color="danger"
                                        size="small"
                                        @click="removeItem(index)"
                                    >
                                        <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                                    </ion-button>
                                </div>
                            </ion-card-content>
                        </ion-card>
                    </div>

                    <!-- Estado vacío -->
                    <div v-else class="empty-cart">
                        <ion-icon :icon="cartOutline" class="empty-icon"></ion-icon>
                        <p>Agrega productos a la venta</p>
                    </div>
                </div>

                <!-- Totales -->
                <div v-if="cart.length > 0" class="form-section">
                    <h3>Totales</h3>
                    
                    <!-- Descuento -->
                    <ion-item>
                        <ion-input
                            label="Descuento"
                            label-placement="floating"
                            v-model.number="discount"
                            type="number"
                            min="0"
                            :max="subtotal"
                            step="100"
                            placeholder="0"
                            @ionInput="calculateTotals"
                        ></ion-input>
                        <ion-note slot="helper">Opcional</ion-note>
                    </ion-item>

                    <!-- Resumen de totales -->
                    <ion-card class="totals-card">
                        <ion-card-content>
                            <div class="total-row">
                                <span class="label">Subtotal:</span>
                                <span class="value">{{ formatPrice(subtotal) }}</span>
                            </div>
                            <div v-if="discount > 0" class="total-row">
                                <span class="label">Descuento:</span>
                                <span class="value discount">-{{ formatPrice(discount) }}</span>
                            </div>
                            <div class="total-row total">
                                <span class="label">Total a Pagar:</span>
                                <span class="value">{{ formatPrice(total) }}</span>
                            </div>
                        </ion-card-content>
                    </ion-card>
                </div>

                <!-- Método de pago -->
                <div v-if="cart.length > 0" class="form-section">
                    <h3>Pago</h3>

                    <ion-item>
                        <ion-select
                            label="Método de Pago *"
                            label-placement="floating"
                            v-model="paymentMethod"
                            placeholder="Selecciona"
                            interface="action-sheet"
                        >
                            <ion-select-option value="cash">Efectivo</ion-select-option>
                            <ion-select-option value="card">Tarjeta</ion-select-option>
                            <ion-select-option value="transfer">Transferencia</ion-select-option>
                            <ion-select-option value="credit">A Crédito</ion-select-option>
                        </ion-select>
                    </ion-item>

                    <!-- Monto pagado -->
                    <ion-item>
                        <ion-input
                            label="Monto Pagado *"
                            label-placement="floating"
                            v-model.number="amountPaid"
                            type="number"
                            min="0"
                            :max="total"
                            step="100"
                            placeholder="0"
                        ></ion-input>
                        <ion-note slot="helper">
                            {{ paymentMethod === 'credit' ? 'Cuánto abona ahora (puede ser 0)' : 'Monto recibido del cliente' }}
                        </ion-note>
                    </ion-item>

                    <!-- Cambio (solo para efectivo) -->
                    <ion-card v-if="paymentMethod === 'cash' && amountPaid > total" class="change-card">
                        <ion-card-content>
                            <div class="change-info">
                                <ion-icon :icon="cashOutline"></ion-icon>
                                <div>
                                    <p class="change-label">Cambio a devolver</p>
                                    <p class="change-value">{{ formatPrice(amountPaid - total) }}</p>
                                </div>
                            </div>
                        </ion-card-content>
                    </ion-card>

                    <!-- Deuda pendiente -->
                    <ion-card v-if="amountPaid < total" class="debt-card" color="warning">
                        <ion-card-content>
                            <div class="debt-info">
                                <ion-icon :icon="alertCircleOutline"></ion-icon>
                                <div>
                                    <p class="debt-label">Monto pendiente (deuda)</p>
                                    <p class="debt-value">{{ formatPrice(total - amountPaid) }}</p>
                                </div>
                            </div>
                        </ion-card-content>
                    </ion-card>
                </div>

                <!-- Información del cliente -->
                <div v-if="cart.length > 0 && (paymentMethod === 'credit' || amountPaid < total)" class="form-section">
                    <h3>Cliente {{ paymentMethod === 'credit' ? '*' : '(Opcional)' }}</h3>

                    <ion-item>
                        <ion-input
                            label="Nombre del Cliente *"
                            label-placement="floating"
                            v-model="customer.name"
                            type="text"
                            placeholder="Nombre completo"
                            :required="paymentMethod === 'credit'"
                        ></ion-input>
                    </ion-item>

                    <ion-item>
                        <ion-input
                            label="Teléfono"
                            label-placement="floating"
                            v-model="customer.phone"
                            type="tel"
                            placeholder="+57 300 1234567"
                        ></ion-input>
                    </ion-item>

                    <ion-item>
                        <ion-input
                            label="Dirección"
                            label-placement="floating"
                            v-model="customer.address"
                            type="text"
                            placeholder="Dirección del cliente"
                        ></ion-input>
                    </ion-item>
                </div>

                <!-- Notas adicionales -->
                <div v-if="cart.length > 0" class="form-section">
                    <h3>Notas (Opcional)</h3>

                    <ion-item>
                        <ion-textarea
                            label="Notas"
                            label-placement="floating"
                            v-model="notes"
                            placeholder="Información adicional sobre la venta"
                            :auto-grow="true"
                            :rows="2"
                        ></ion-textarea>
                    </ion-item>
                </div>

                <!-- Mensaje de error -->
                <ion-text v-if="errorMessage" color="danger" class="error-message">
                    <p>{{ errorMessage }}</p>
                </ion-text>

            </form>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { ref, computed } from 'vue';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonButton,
        IonTitle,
        IonContent,
        IonItem,
        IonInput,
        IonTextarea,
        IonSelect,
        IonSelectOption,
        IonNote,
        IonCard,
        IonCardContent,
        IonText,
        IonIcon,
        toastController,
        modalController,
        actionSheetController,
    } from '@ionic/vue';
    import {
        addOutline,
        removeOutline,
        trashOutline,
        cartOutline,
        cashOutline,
        alertCircleOutline,
    } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';
    import { useProductsStore } from '@/stores/products';
    import { useSalesStore } from '@/stores/sales';
    import {
        validateSaleData,
        formatPrice,
        createSaleItemFromProduct,
        type SaleItem,
        type SaleCustomer,
        type PaymentMethod,
    } from '@/models/Sale';

    import type { ActionSheetButton } from '@ionic/core';

    // ============================================
    // COMPOSABLES
    // ============================================
    const authStore = useAuthStore();
    const storesStore = useStoresStore();
    const productsStore = useProductsStore();
    const salesStore = useSalesStore();

    // ============================================
    // ESTADO
    // ============================================
    const isLoading = ref(false);
    const errorMessage = ref('');

    // Carrito de productos
    const cart = ref<SaleItem[]>([]);

    // Totales
    const subtotal = ref(0);
    const discount = ref(0);
    const total = ref(0);

    // Pago
    const paymentMethod = ref<PaymentMethod>('cash');
    const amountPaid = ref(0);

    // Cliente
    const customer = ref<SaleCustomer>({
        name: '',
        phone: '',
        address: '',
    });

    // Notas
    const notes = ref('');

    // ============================================
    // COMPUTED
    // ============================================

    /**
     * Verifica si se puede enviar el formulario
     */
    const canSubmit = computed(() => {
        return (
            cart.value.length > 0 &&
            paymentMethod.value &&
            amountPaid.value >= 0 &&
            // Si es a crédito, debe tener cliente
            (paymentMethod.value !== 'credit' || customer.value.name.length > 0)
        );
    });

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Abre el selector de productos
     */
    async function openProductSelector() {
        const products = productsStore.activeProducts;
        
        if (products.length === 0) {
            await showToast('No hay productos disponibles', 'warning');
            return;
        }

        // Crear botones para el action sheet
        const buttons: ActionSheetButton[] = products.map(product => ({
            text: `${product.name} - ${formatPrice(product.salePrice)} (Stock: ${product.stock})`,
            handler: () => {
                addProductToCart(product);
            },
        }));

        buttons.push({
            text: 'Cancelar',
            role: 'cancel',
        });

        const actionSheet = await actionSheetController.create({
            header: 'Selecciona un Producto',
            buttons,
        });

        await actionSheet.present();
    }

    /**
     * Agrega un producto al carrito
     */
    function addProductToCart(product: any) {
        // Verificar si ya está en el carrito
        const existingIndex = cart.value.findIndex(item => item.productId === product.id);
        
        if (existingIndex !== -1) {
            // Si ya existe, incrementar cantidad
            cart.value[existingIndex].quantity++;
            updateItemSubtotal(existingIndex);
        } else {
            // Si no existe, agregarlo
            const newItem = createSaleItemFromProduct(product, 1);
            cart.value.push(newItem);
        }
        
        calculateTotals();
    }

    /**
     * Incrementa la cantidad de un item
     */
    function incrementQuantity(index: number) {
        cart.value[index].quantity++;
        updateItemSubtotal(index);
    }

    /**
     * Decrementa la cantidad de un item
     */
    function decrementQuantity(index: number) {
        if (cart.value[index].quantity > 1) {
            cart.value[index].quantity--;
            updateItemSubtotal(index);
        }
    }

    /**
     * Actualiza el subtotal de un item
     */
    function updateItemSubtotal(index: number) {
        const item = cart.value[index];
        item.subtotal = item.quantity * item.unitPrice;
        calculateTotals();
    }

    /**
     * Elimina un item del carrito
     */
    function removeItem(index: number) {
        cart.value.splice(index, 1);
        calculateTotals();
    }

    /**
     * Calcula los totales de la venta
     */
    function calculateTotals() {
        // Calcular subtotal
        subtotal.value = cart.value.reduce((sum, item) => sum + item.subtotal, 0);
        
        // Calcular total
        total.value = subtotal.value - (discount.value || 0);
        
        // Si el descuento es mayor al subtotal, ajustar
        if (discount.value > subtotal.value) {
            discount.value = subtotal.value;
            total.value = 0;
        }
        
        // Si es efectivo y no se ha ingresado monto, establecer el total
        if (paymentMethod.value === 'cash' && amountPaid.value === 0) {
            amountPaid.value = total.value;
        }
    }

    /**
     * Maneja el envío del formulario
     */
    async function handleSubmit() {
        errorMessage.value = '';
        
        // Preparar datos
        const saleData = {
            items: cart.value,
            customer: customer.value.name ? customer.value : undefined,
            paymentMethod: paymentMethod.value,
            amountPaid: amountPaid.value,
            discount: discount.value || undefined,
            notes: notes.value || undefined,
        };
        
        // Validar
        const validation = validateSaleData(saleData);
        if (!validation.valid) {
            errorMessage.value = validation.errors.join(', ');
            return;
        }
        
        isLoading.value = true;
        
        try {
            if (!authStore.user || !storesStore.currentStoreId) {
                errorMessage.value = 'Usuario o tienda no disponible';
                return;
            }
            
            const result = await salesStore.createSale(
                saleData,
                storesStore.currentStoreId,
                authStore.user.id
            );
            
            if (result.success) {
                await showToast('Venta registrada exitosamente', 'success');
                await closeModal();
            } else {
                errorMessage.value = result.error || 'Error al registrar venta';
            }
        } catch (error: any) {
            console.error('Error en submit:', error);
            errorMessage.value = 'Error inesperado. Intenta de nuevo.';
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Cierra el modal
     */
    async function closeModal() {
        await modalController.dismiss();
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

<style scoped>
    /* ============================================
    ESTILOS
    ============================================ */

    .form-section {
        margin-bottom: 32px;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 0 16px;
    }

    .form-section h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Carrito */
    .cart-items {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .cart-item {
        margin: 0;
    }

    .cart-item ion-card-content {
        padding: 12px;
    }

    .item-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .item-info {
        flex: 1;
        min-width: 0;
    }

    .item-info h4 {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 0 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .item-price {
        font-size: 13px;
        color: var(--ion-color-medium);
        margin: 0;
    }

    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .quantity-input {
        width: 60px;
        text-align: center;
        --padding-start: 4px;
        --padding-end: 4px;
    }

    .item-subtotal {
        min-width: 80px;
        text-align: right;
    }

    .item-subtotal p {
        font-size: 15px;
        font-weight: 600;
        color: var(--ion-color-primary);
        margin: 0;
    }

    /* Estado vacío */
    .empty-cart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        background: var(--ion-color-light);
        border-radius: 12px;
    }

    .empty-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 12px;
    }

    .empty-cart p {
        color: var(--ion-color-medium);
        margin: 0;
    }

    /* Totales */
    .totals-card {
        margin: 16px 0 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .totals-card ion-card-content {
        padding: 16px;
    }

    .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .total-row:last-child {
        margin-bottom: 0;
    }

    .total-row .label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
    }

    .total-row .value {
        font-size: 16px;
        font-weight: 600;
        color: white;
    }

    .total-row.total {
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.3);
        margin-top: 4px;
    }

    .total-row.total .label {
        font-size: 16px;
        font-weight: 600;
    }

    .total-row.total .value {
        font-size: 24px;
    }

    .total-row .value.discount {
        color: #ffc409;
    }

    /* Cambio */
    .change-card {
        margin: 16px 0 0;
        background: var(--ion-color-success);
    }

    .change-card ion-card-content {
        padding: 16px;
    }

    .change-info {
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;
    }

    .change-info ion-icon {
        font-size: 32px;
    }

    .change-label {
        font-size: 13px;
        margin: 0 0 4px;
        opacity: 0.9;
    }

    .change-value {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
    }

    /* Deuda */
    .debt-card ion-card-content {
        padding: 16px;
    }

    .debt-info {
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;
    }

    .debt-info ion-icon {
        font-size: 32px;
    }

    .debt-label {
        font-size: 13px;
        margin: 0 0 4px;
        opacity: 0.9;
    }

    .debt-value {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
    }

    .error-message {
        display: block;
        padding: 16px;
        margin: 16px;
        background: rgba(var(--ion-color-danger-rgb), 0.1);
        border-radius: 8px;
        text-align: center;
    }

    .error-message p {
        margin: 0;
        font-size: 14px;
    }

    ion-item {
        --padding-start: 16px;
        --inner-padding-end: 16px;
        margin-bottom: 8px;
    }

    /* Responsive */
    @media (max-width: 576px) {
        .item-content {
            flex-wrap: wrap;
        }
        
        .item-info {
            flex-basis: 100%;
        }
        
        .quantity-controls {
            flex: 1;
        }
    }
</style>