<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="closeModal">Cancelar</ion-button>
                </ion-buttons>
                <ion-title>{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="handleSubmit" :disabled="!isFormValid || isLoading">
                        <strong>{{ isEditing ? 'Guardar' : 'Crear' }}</strong>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <form @submit.prevent="handleSubmit">
                <!-- Información básica -->
                <div class="form-section">
                    <h3>Información Básica</h3>

                    <!-- Nombre -->
                    <ion-item>
                        <ion-input 
                            label="Nombre del Producto *" 
                            label-placement="floating" 
                            v-model="formData.name" 
                            type="text" 
                            placeholder="Ej: Cerveza Corona 355ml" 
                            required
                        ></ion-input>
                    </ion-item>

                    <!-- Descripción -->
                    <ion-item>
                        <ion-textarea 
                            label="Descripción" 
                            label-placement="floating" 
                            v-model="formData.description" 
                            placeholder="Descripción breve del producto" 
                            :auto-grow="true" 
                            :rows="2" 
                        ></ion-textarea>
                    </ion-item>

                    <!-- SKU y Código de barras en una fila -->
                    <div class="row-fields">
                        <ion-item class="flex-item">
                            <ion-input 
                                label="SKU" 
                                label-placement="floating" 
                                v-model="formData.sku" 
                                type="text" 
                                placeholder="ABC-001" 
                                required
                            ></ion-input>
                        </ion-item>

                        <ion-item class="flex-item">
                            <ion-input 
                                label="Código de Barras" 
                                label-placement="floating" 
                                v-model="formData.barcode" 
                                type="text" 
                                placeholder="7501234567890" 
                            ></ion-input>
                        </ion-item>
                    </div>
                </div>

                <!-- Precios -->
                <div class="form-section">
                    <h3>Precios y Ganancia</h3>

                    <!-- Precio de compra -->
                    <ion-item>
                        <ion-input 
                            label="Precio de Compra (Costo) *" 
                            label-placement="floating"
                            v-model.number="formData.purchasePrice"
                            type="number"
                            min="0"
                            step="100"
                            placeholder="0"
                            @ionInput="handlePurchasePriceChange"
                            required
                        ></ion-input>
                        <ion-note slot="helper">Cuánto te cuesta el producto</ion-note>
                    </ion-item>

                    <!-- Margen de ganancia -->
                    <ion-item>
                        <ion-input
                            label="Margen de Ganancia (%)"
                            label-placement="floating"
                            v-model.number="formData.profitMargin"
                            type="number"
                            min="0"
                            max="1000"
                            step="1"
                            placeholder="30"
                            @ionInput="handleMarginChange"
                        ></ion-input>
                        <ion-note slot="helper">Porcentaje de ganancia sobre el costo</ion-note>
                    </ion-item>

                    <!-- Precio de venta (calculado automáticamente) -->
                    <ion-item>
                        <ion-input
                            label="Precio de Venta *"
                            label-placement="floating"
                            v-model.number="formData.salePrice"
                            type="number"
                            min="0"
                            step="100"
                            placeholder="0"
                            @ionInput="handleSalePriceChange"
                            required
                        ></ion-input>
                        <ion-note slot="helper">Precio al que lo vendes al cliente</ion-note>
                    </ion-item>

                    <!-- Resumen de ganancia -->
                    <ion-card v-if="formData.purchasePrice > 0 && formData.salePrice! > 0" class="profit-card">
                        <ion-card-content>
                            <div class="profit-summary">
                                <div class="profit-item">
                                    <span class="label">Ganancia por unidad:</span>
                                    <span class="value success">
                                        {{ formatPrice(formData.salePrice! - formData.purchasePrice) }}
                                    </span>
                                </div>
                                    <div class="profit-item">
                                    <span class="label">Margen real:</span>
                                    <span class="value">{{ calculatedMargin }}%</span>
                                </div>
                            </div>
                        </ion-card-content>
                    </ion-card>
                </div>

                <!-- Inventario -->
                <div class="form-section">
                    <h3>Inventario</h3>

                    <!-- Stock inicial y unidad en una fila -->
                    <div class="row-fields">
                        <ion-item class="flex-item">
                            <ion-input
                                label="Stock Inicial"
                                label-placement="floating"
                                v-model.number="formData.stock"
                                type="number"
                                min="0"
                                placeholder="0"
                                required
                            ></ion-input>
                        </ion-item>

                        <ion-item class="flex-item">
                            <!-- <ion-label position="floating">Unidad *</ion-label> -->
                            <ion-select
                                label="Unidad *"
                                label-placement="floating"
                                v-model="formData.unit"
                                placeholder="Selecciona"
                                interface="action-sheet"
                            >
                                <ion-select-option value="unit">Unidad</ion-select-option>
                                <ion-select-option value="kg">Kilogramo</ion-select-option>
                                <ion-select-option value="g">Gramo</ion-select-option>
                                <ion-select-option value="l">Litro</ion-select-option>
                                <ion-select-option value="ml">Mililitro</ion-select-option>
                                <ion-select-option value="pack">Paquete</ion-select-option>
                                <ion-select-option value="box">Caja</ion-select-option>
                                <ion-select-option value="bottle">Botella</ion-select-option>
                                <ion-select-option value="can">Lata</ion-select-option>
                            </ion-select>
                        </ion-item>
                    </div>

                    <!-- Stock mínimo y máximo en una fila -->
                    <div class="row-fields">
                        <ion-item class="flex-item">
                            <ion-input
                                label="Stock Mínimo *"
                                label-placement="floating"
                                v-model.number="formData.minStock"
                                type="number"
                                min="0"
                                placeholder="10"
                                required
                            ></ion-input>
                            <ion-note slot="helper">Alerta cuando llegue a este nivel</ion-note>
                        </ion-item>

                        <ion-item class="flex-item">
                            <ion-input
                                label="Stock Máximo"
                                label-placement="floating"
                                v-model.number="formData.maxStock"
                                type="number"
                                min="0"
                                placeholder="Opcional"
                            ></ion-input>
                        </ion-item>
                    </div>
                </div>

                <!-- Mensaje de error -->
                <ion-text v-if="errorMessage" color="danger" class="error-message">
                    <p>{{ errorMessage }}</p>
                </ion-text>

                <!-- Botón de submit (oculto, se activa con Enter) -->
                <button type="submit" style="display: none;"></button>
            </form>
        </ion-content>

        <!-- Footer con botones (solo en modo edición) -->
        <ion-footer v-if="isEditing">
            <ion-toolbar>
                <ion-button
                    expand="block"
                    color="danger"
                    fill="outline"
                    @click="confirmDelete"
                >
                <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                    Eliminar Producto
                </ion-button>
            </ion-toolbar>
        </ion-footer>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { ref, computed, onMounted } from 'vue';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonButton,
        IonTitle,
        IonContent,
        IonFooter,
        IonItem,
        IonInput,
        IonTextarea,
        IonSelect,
        IonSelectOption,
        IonNote,
        IonText,
        IonIcon,
        IonCard,
        IonCardContent,
        toastController,
        alertController,
        modalController,
    } from '@ionic/vue';
    import { trashOutline } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';
    import { useProductsStore } from '@/stores/products';
    import {
        validateProductData,
        calculateSalePrice,
        calculateProfitMargin,
        formatPrice,
        type Product,
        type CreateProductData,
        type ProductUnit,
    } from '@/models/Product';

    // ============================================
    // PROPS
    // ============================================
    const props = defineProps<{
        product?: Product; // Si se pasa, es modo edición
    }>();

    // ============================================
    // COMPOSABLES
    // ============================================
    const authStore = useAuthStore();
    const storesStore = useStoresStore();
    const productsStore = useProductsStore();

    // ============================================
    // ESTADO
    // ============================================
    const isLoading = ref(false);
    const errorMessage = ref('');
    const autoCalculate = ref(true); // Flag para saber si calcular automáticamente

    // Determinar si estamos editando o creando
    const isEditing = computed(() => !!props.product);

    // Datos del formulario
    const formData = ref<CreateProductData>({
        name: '',
        description: '',
        categoryId: '',
        sku: '',
        barcode: '',
        purchasePrice: 0,
        salePrice: 0,
        profitMargin: storesStore.currentStore?.inventorySettings.defaultProfitMargin || 30,
        stock: 0,
        minStock: storesStore.currentStore?.inventorySettings.lowStockThreshold || 10,
        maxStock: 0, 
        unit: 'unit' as ProductUnit,
    });

    // ============================================
    // COMPUTED
    // ============================================

    /**
     * Verifica si el formulario es válido
     */
    const isFormValid = computed(() => {
        return (
            formData.value.name.length > 0 &&
            formData.value.purchasePrice >= 0 &&
            formData.value.salePrice! > 0 &&
            formData.value.stock >= 0 &&
            formData.value.minStock >= 0
        );
    });

    /**
     * Calcula el margen real basado en los precios actuales
     */
    const calculatedMargin = computed(() => {
        if (formData.value.purchasePrice === 0) return 0;
        return calculateProfitMargin(formData.value.purchasePrice, formData.value.salePrice!);
    });

    // ============================================
    // LIFECYCLE
    // ============================================
    onMounted(() => {
        // Si estamos editando, cargar datos del producto
        if (props.product) {
            formData.value = {
                name: props.product.name,
                description: props.product.description,
                categoryId: props.product.categoryId!,
                sku: props.product.sku,
                barcode: props.product.barcode,
                purchasePrice: props.product.purchasePrice,
                salePrice: props.product.salePrice,
                profitMargin: props.product.profitMargin,
                stock: props.product.stock,
                minStock: props.product.minStock,
                maxStock: props.product.maxStock!,
                unit: props.product.unit,
            };
            autoCalculate.value = false; // No calcular auto al editar
        }
    });

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Maneja el cambio del precio de compra
     * Recalcula el precio de venta si está en modo auto
     */
    function handlePurchasePriceChange() {
        if (autoCalculate.value && formData.value.purchasePrice > 0) {
            formData.value.salePrice = calculateSalePrice(
            formData.value.purchasePrice,
            formData.value.profitMargin || 0
            );
        }
    }

    /**
     * Maneja el cambio del margen de ganancia
     * Recalcula el precio de venta
     */
    function handleMarginChange() {
        if (formData.value.purchasePrice > 0 && formData.value.profitMargin !== undefined) {
            autoCalculate.value = true;
            formData.value.salePrice = calculateSalePrice(
                formData.value.purchasePrice,
                formData.value.profitMargin
            );
        }
    }

    /**
     * Maneja el cambio manual del precio de venta
     * Desactiva el cálculo automático y recalcula el margen
     */
    function handleSalePriceChange() {
        autoCalculate.value = false;
        if (formData.value.purchasePrice > 0 && formData.value.salePrice! > 0) {
            formData.value.profitMargin = calculateProfitMargin(
                formData.value.purchasePrice,
                formData.value.salePrice!
            );
        }
    }

    /**
     * Maneja el envío del formulario
     */
    async function handleSubmit() {
        // Limpiar errores previos
        errorMessage.value = '';
        
        // Validar datos
        const validation = validateProductData(formData.value);
        if (!validation.valid) {
            errorMessage.value = validation.errors.join(', ');
            return;
        }
        
        isLoading.value = true;
        
        try {
            if (isEditing.value && props.product) {
                // ACTUALIZAR producto existente
                console.log('🔄 Actualizando producto:', formData.value.name);
                const result = await productsStore.updateProduct(props.product.id, formData.value);
                
                if (result.success) {
                    await showToast('Producto actualizado exitosamente', 'success');
                    await closeModal();
                } else {
                    errorMessage.value = result.error || 'Error al actualizar producto';
                }
            } else {
                // CREAR nuevo producto
                if (!authStore.user || !storesStore.currentStoreId) {
                    errorMessage.value = 'Usuario o tienda no disponible';
                    return;
                }
            
                console.log('➕ Creando producto:', formData.value.name);
                const defaultMargin = storesStore.currentStore?.inventorySettings.defaultProfitMargin || 30;
                
                const result = await productsStore.createProduct(
                    formData.value,
                    storesStore.currentStoreId,
                    authStore.user.id,
                    defaultMargin
                );
                
                if (result.success) {
                    await showToast('Producto creado exitosamente', 'success');
                    await closeModal();
                } else {
                    errorMessage.value = result.error || 'Error al crear producto';
                }
            }
        } catch (error: any) {
            console.error('Error en submit:', error);
            errorMessage.value = 'Error inesperado. Intenta de nuevo.';
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Confirma la eliminación del producto
     */
    async function confirmDelete() {
        if (!props.product) return;
        
        const alert = await alertController.create({
            header: 'Eliminar Producto',
            message: `¿Estás seguro de eliminar "${props.product.name}"? Esta acción no se puede deshacer.`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: async () => {
                    await handleDelete();
                    },
                },
            ],
        });

        await alert.present();
    }

    /**
     * Elimina el producto
     */
    async function handleDelete() {
        if (!props.product) return;
        
        isLoading.value = true;
        
        try {
            const result = await productsStore.deleteProduct(props.product.id);
            
            if (result.success) {
                await showToast('Producto eliminado', 'success');
                await closeModal();
            } else {
                errorMessage.value = result.error || 'Error al eliminar producto';
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            errorMessage.value = 'Error inesperado';
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

    .form-section h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 16px 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Campos en fila */
    .row-fields {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
    }

    .flex-item {
        flex: 1;
    }

    /* Card de resumen de ganancia */
    .profit-card {
        margin: 16px 0 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .profit-card ion-card-content {
        padding: 16px;
    }

    .profit-summary {
        display: flex;
        justify-content: space-around;
        gap: 16px;
    }

    .profit-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .profit-item .label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        text-transform: uppercase;
    }

    .profit-item .value {
        font-size: 18px;
        font-weight: bold;
        color: white;
    }

    .profit-item .value.success {
        color: #2dd36f;
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

    ion-footer {
        padding: 16px;
    }

    /* Responsive */
    @media (max-width: 576px) {
        .row-fields {
            flex-direction: column;
            gap: 0;
        }
        
        .profit-summary {
            flex-direction: column;
            gap: 12px;
        }
    }
</style>
