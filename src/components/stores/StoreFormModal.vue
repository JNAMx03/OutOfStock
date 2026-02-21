<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="closeModal">Cancelar</ion-button>
                </ion-buttons>
                <ion-title>{{ isEditing ? 'Editar Tienda' : 'Nueva Tienda' }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="handleSubmit" :disabled="!isFormValid || isLoading">
                        <strong>{{ isEditing ? 'Guardar' : 'Crear'  }}</strong>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <form @submit.prevent="handleSubmit">
                <!-- informacion basica -->
                <div class="form-section">
                    <h3>Información Básica</h3>
                    
                    <!-- nombre -->
                    <ion-item>
                        <ion-input label="Nombre de la tienda" label-placement="floating" type="text" v-model="formData.name" placeholder="Mi Tienda" required></ion-input>
                    </ion-item>

                    <!-- descripcion -->
                     <ion-item>
                        <ion-textarea label="Descripción" label-placement="floating" type="text" v-model="formData.description" placeholder="Descripción de la tienda" :auto-grow="true" :rows="3"></ion-textarea>
                    </ion-item>

                    <!-- tipo de tienda -->
                    <ion-item>
                        <ion-select label="Tipo de tienda" label-placement="floating" v-model="formData.type" placeholder="Selecciona un tipo" interface="action-sheet">
                            <ion-select-option value="retail">Minorista</ion-select-option>
                            <ion-select-option value="wholesale">Mayorista</ion-select-option>
                            <ion-select-option value="restaurant">Restaurante</ion-select-option>
                            <ion-select-option value="bar">Bar</ion-select-option>
                            <ion-select-option value="warehouse">Almacén</ion-select-option>
                            <ion-select-option value="other">Otro</ion-select-option>
                        </ion-select>
                    </ion-item>
                </div>

                <!-- ubicacion -->
                <div class="form-section">
                    <h3>Ubicación</h3>

                    <!-- calle -->
                    <ion-item>
                        <ion-input label="Dirección" label-placement="floating" type="text" v-model="formData.address.street" placeholder="Calle 123 #45-67" required></ion-input>
                    </ion-item>

                    <!-- ciudad -->
                    <ion-item>
                        <ion-input label="Ciudad" label-placement="floating" type="text" v-model="formData.address.city" placeholder="Bogotá" required></ion-input>
                    </ion-item>

                    <!-- estado/departamento -->
                    <ion-item>
                        <ion-input label="Estado / Departamento" label-placement="floating" type="text" v-model="formData.address.state" placeholder="Cundinamarca" required></ion-input>
                    </ion-item>

                    <!-- pais -->
                    <ion-item>
                        <ion-input label="País" label-placement="floating" type="text" v-model="formData.address.country" placeholder="Colombia" required></ion-input>
                    </ion-item>

                    <!-- codigo postal -->
                    <ion-item>
                        <ion-input label="Código Postal" label-placement="floating" type="text" v-model="formData.address.zipCode" placeholder="110111" required></ion-input>
                    </ion-item>
                </div>

                <!-- contacto -->
                <div class="form-section">
                    <h3>Contacto</h3>

                    <!-- telefono -->
                    <ion-item>
                        <ion-input label="Teléfono" label-placement="floating" type="tel" v-model="formData.phone" placeholder="300 1234567" required></ion-input>
                    </ion-item>

                    <!-- email -->
                    <ion-item>
                        <ion-input label="Email" label-placement="floating" type="email" v-model="formData.email" placeholder="mi-tienda@ejemplo.com" required></ion-input>
                    </ion-item>
                </div>

                <!-- configuracion de inventario -->
                <div class="form-section">
                    <h3>Configuración de Inventario</h3>
                

                    <!-- stock minimo -->
                    <ion-item>
                        <ion-input label="Stock Mínimo" label-placement="floating" type="number" v-model.number="formData.inventorySettings!.lowStockThreshold" min="1" placeholder="10" required></ion-input>
                    </ion-item>

                    <!-- margen de ganancia -->
                    <ion-item>
                        <ion-input label="Margen de Ganancia (%)" label-placement="floating" type="number" v-model.number="formData.inventorySettings!.defaultProfitMargin" min="0" max="100" placeholder="23" required></ion-input>
                    </ion-item>

                    <!-- calcular precio de venta automaticamente -->
                    <ion-item>
                        <ion-label>Calcular Precio de Venta Automáticamente</ion-label>
                        <ion-toggle v-model="formData.inventorySettings!.autoCalculatePrices" slot="end"></ion-toggle>
                    </ion-item> 
                    
                    <!-- alerta de stock bajo -->
                    <ion-item>
                        <ion-label>Activar Alertas de Stock Bajo</ion-label>
                        <ion-toggle v-model="formData.inventorySettings!.enableLowStockAlerts" slot="end"></ion-toggle>
                    </ion-item>
                </div>

                <!-- personalizacion -->
                <div class="form-section">
                    <h3>Personalización</h3>

                    <!-- color -->
                    <ion-item>
                        <ion-input label="Color de la tienda" label-placement="floating" type="text" v-model="formData.color"></ion-input>
                    </ion-item>

                    <!-- logo (pendiente implementar subida de imagen) -->
                    <ion-item button @click="showComingSoon">
                        <ion-icon :icon="imageOutline" slot="start"></ion-icon>
                        <ion-label>
                            <h3>Logo de la tienda</h3>
                            <p>Proximamente diponible</p>
                        </ion-label>
                    </ion-item>
                </div>

                <!-- mensaje de error -->
                <ion-text color="danger" v-if="errorMessage" class="error-message">
                    <p>{{ errorMessage }}</p>
                </ion-text>

                <!-- boton de submit (oculto, se activa con enter) -->
                <button type="submit" style="display: none;"></button>
            </form>
        </ion-content>

        <!-- footer con botones -->
        <ion-footer v-if="isEditing">
            <ion-toolbar>
                <ion-button expand="block" color="danger" fill="outline" @click="ConfirmDelete">
                    <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                    Eliminar Tienda
                </ion-button>
            </ion-toolbar>
        </ion-footer>
    </ion-page>
</template>

// ============================================
// IMPORTS
// ============================================

<script setup lang="ts">
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
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonText,
    IonIcon,
    toastController,
    alertController,
    modalController,
    } from '@ionic/vue';
    import { imageOutline, trashOutline } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';
    import {
    validateStoreData,
    createDefaultInventorySettings,
    type Store,
    type CreateStoreData,
    type StoreType,
    } from '@/models/Store';

    // ============================================
    // PROPS
    // ============================================
    const props = defineProps<{
        store?: Store; //si se pasa, es modo edicion
    }>();

    // ============================================
    // COMPOSABLES
    // ============================================
    const authStore = useAuthStore();
    const storesStore = useStoresStore();

    // ============================================
    // ESTADO
    // ============================================
    const isLoading = ref(false);
    const errorMessage = ref('');

    // Determinar si estamos editando o creando
    const isEditing = computed(() => !!props.store);

    //datos formulario
    const formData = ref<CreateStoreData>({
        name: '',
        description: '',
        type: 'retail' as StoreType,
        address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
        },
        phone: '',
        email: '',
        color: '#3880ff', //color por defecto de Ionic
        inventorySettings: createDefaultInventorySettings(),
    });

    // ============================================
    // COMPUTED
    // ============================================

    /**
     * Verifica si el formulario es válido
     */
    const isFormValid = computed(() => {
        return(
            formData.value.name.length > 0 &&
            formData.value.address.street.length > 0 &&
            formData.value.address.city.length > 0 &&
            formData.value.address.state.length > 0 &&
            formData.value.address.country.length > 0
        );
    });

    // ============================================
    // LIFECYCLE
    // ============================================
    onMounted(() => {
        //si etamos editando, cargar los datos de la tienda en el formulario
        if(props.store){
            formData.value = {
                name: props.store.name,
                description: props.store.description,
                type: props.store.type,
                address: {...props.store.address},
                phone: props.store.phone,
                email: props.store.email,
                color: props.store.color,
                inventorySettings: {...props.store.inventorySettings},
            };
        }
    });

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Maneja el envío del formulario
     */
    async function handleSubmit(){
        //limpiar errores previos
        errorMessage.value = '';

        // Asegurar que el tipo esté definido (por defecto 'retail')
        if (!formData.value.type) {
            formData.value.type = 'retail';
        }
        
        console.log('📝 Datos del formulario antes de validar:', {
            name: formData.value.name,
            type: formData.value.type,
            address: formData.value.address,
        });

        //validar datos del formulario
        const validation = validateStoreData(formData.value);
        if(!validation.valid){
            errorMessage.value = validation.errors.join(', ')
            return;
        }

        isLoading.value = true;

        try{
            if(isEditing.value && props.store){
                //actualizar tienda existente
                const result = await storesStore.updateStore(props.store.id, formData.value);

                if(result.success){
                    await showToast('Tienda actualizada exitosamente', 'success');
                    await closeModal();
                }else{
                    errorMessage.value = result.error || 'Error al actualizar la tienda';
                }
            }else{
                //crear nueva tienda
                if(!authStore.user){
                    errorMessage.value = 'Usuario no autenticado';
                    return;
                }

                const result = await storesStore.createStore(formData.value, authStore.user.id);

                if(result.success){
                    await showToast('Tienda creada exitosamente', 'success');
                    await closeModal();
                }else{
                    errorMessage.value = result.error || 'Error al crear la tienda';
                }
            }
        }catch (error: any){
            console.error('Error en submit:', error);
            errorMessage.value = 'Error inesperado. Por favor intenta de nuevo.';
        }finally{
            isLoading.value = false;
        }
    }
    /**
     * Confirma la eliminación de la tienda
     */
    async function ConfirmDelete(){
        if(!props.store) return;

        const alert = await alertController.create({
            header: 'Elimar Tienda',
            message: `¿Estás seguro que deseas eliminar la tienda "${props.store.name}"? Esta acción no se puede deshacer.`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: async() =>{
                        await handleDelete();
                    },
                },
            ],
        });

        await alert.present();
    }
    
    /**
     * Elimina la tienda
     */
    async function handleDelete(){
        if (!props.store) return;

        isLoading.value = true;
        
        try {
            const result = await storesStore.deleteStore(props.store.id);
            
            if (result.success) {
            await showToast('Tienda eliminada', 'success');
            await closeModal();
            } else {
            errorMessage.value = result.error || 'Error al eliminar tienda';
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
     * Muestra mensaje de "próximamente"
     */
    async function showComingSoon() {
        await showToast('Función próximamente disponible', 'warning');
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
</style>