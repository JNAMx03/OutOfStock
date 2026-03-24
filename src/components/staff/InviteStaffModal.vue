<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="closeModal">Cancelar</ion-button>
                </ion-buttons>
                <ion-title>Invitar Persona</ion-title>
                <ion-buttons slot="end">
                    <ion-button
                        :disabled="!canSubmit || isLoading"
                        @click="handleSubmit"
                        strong
                    >
                        {{ isLoading ? 'Enviando...' : 'Invitar' }}
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">

        <!-- Explicación -->
        <div class="info-box">
            <ion-icon :icon="informationCircleOutline" color="primary"></ion-icon>
            <p>
                La persona recibirá una invitación para unirse a
                <strong>{{ storeName }}</strong>. Podrá acceder a la tienda
                según el rol que le asignes.
            </p>
        </div>

        <!-- Nombre -->
        <div class="form-section">
            <h3>Información</h3>
            <ion-item>
                <ion-input
                    label="Nombre completo *"
                    label-placement="floating"
                    v-model="form.name"
                    type="text"
                    placeholder="Ej: Carlos García"
                    autocomplete="name"
                ></ion-input>
            </ion-item>

            <ion-item>
                <ion-input
                    label="Email *"
                    label-placement="floating"
                    v-model="form.email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    autocomplete="email"
                ></ion-input>
            </ion-item>
        </div>

        <!-- Rol -->
        <div class="form-section">
            <h3>Rol en la tienda</h3>

            <!-- Opción: Admin (solo visible para Owner) -->
            <ion-card
            v-if="allowAdminRole"
            class="role-card"
            :class="{ selected: form.role === 'admin' }"
            button
            @click="form.role = 'admin'"
            >
                <ion-card-content>
                    <div class="role-option">
                        <div class="role-icon" style="background: rgba(56,128,255,0.12)">
                            <ion-icon :icon="shieldCheckmarkOutline" color="primary"></ion-icon>
                        </div>
                        <div class="role-info">
                            <h4>Administrador</h4>
                            <p>Acceso total a inventario, ventas y finanzas. Puede gestionar vendedores.</p>
                        </div>
                        <ion-radio :value="'admin'" :checked="form.role === 'admin'"></ion-radio>
                    </div>
                </ion-card-content>
            </ion-card>

            <!-- Opción: Vendedor (siempre visible) -->
            <ion-card
            class="role-card"
            :class="{ selected: form.role === 'seller' }"
            button
            @click="form.role = 'seller'"
            >
                <ion-card-content>
                    <div class="role-option">
                        <div class="role-icon" style="background: rgba(16,220,96,0.12)">
                            <ion-icon :icon="cartOutline" color="success"></ion-icon>
                        </div>
                        <div class="role-info">
                            <h4>Vendedor</h4>
                            <p>Solo puede registrar ventas y consultar stock. Sin acceso a finanzas.</p>
                        </div>
                        <ion-radio :value="'seller'" :checked="form.role === 'seller'"></ion-radio>
                    </div>
                </ion-card-content>
            </ion-card>
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
        IonTitle, IonContent, IonItem, IonInput,
        IonCard, IonCardContent, IonIcon, IonText, IonRadio,
        modalController, toastController,
    } from '@ionic/vue';
    import {
        informationCircleOutline, shieldCheckmarkOutline, cartOutline,
    } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    import { useStaffStore } from '@/stores/staff';

    // ============================================
    // PROPS
    // ============================================
    const props = defineProps<{
    storeId: string;
    storeName: string;
    allowAdminRole: boolean; // Solo el Owner puede invitar admins
    }>();

    // ============================================
    // COMPOSABLES
    // ============================================
    const authStore = useAuthStore();
    const staffStore = useStaffStore();

    // ============================================
    // ESTADO
    // ============================================
    const form = ref({
    name: '',
    email: '',
    role: 'seller' as 'admin' | 'seller',
    });

    const isLoading = ref(false);
    const errorMessage = ref('');

    // ============================================
    // COMPUTED
    // ============================================

    /** Email básico válido */
    const isEmailValid = computed(() =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())
    );

    const canSubmit = computed(() =>
        form.value.name.trim().length >= 2 &&
        isEmailValid.value &&
        form.value.role !== undefined
    );

    // ============================================
    // FUNCIONES
    // ============================================

    async function handleSubmit() {
        errorMessage.value = '';

        if (!authStore.user) {
            errorMessage.value = 'Usuario no autenticado';
            return;
        }

        // Admin solo puede invitar vendedores (doble verificación)
        if (!props.allowAdminRole && form.value.role === 'admin') {
            form.value.role = 'seller';
        }

        isLoading.value = true;

        try {
            const result = await staffStore.inviteStaff(
                {
                    name: form.value.name.trim(),
                    email: form.value.email.trim().toLowerCase(),
                    role: form.value.role,
                },
                props.storeId,
                props.storeName,
                authStore.user.id,
                authStore.user.name,
            );

            if (result.success) {
                await showToast(
                    `Invitación enviada a ${form.value.name} ✓`,
                    'success'
                );
                await modalController.dismiss({ success: true });
            } else {
                errorMessage.value = result.error || 'Error al enviar invitación';
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
</script>

<style scoped>
    /* Caja de información */
    .info-box {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: rgba(56, 128, 255, 0.08);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 20px;
    }

    .info-box ion-icon {
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .info-box p {
        font-size: 13px;
        color: var(--ion-color-dark);
        margin: 0;
        line-height: 1.5;
    }

    /* Secciones */
    .form-section {
        margin-bottom: 20px;
    }

    .form-section h3 {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--ion-color-medium);
        margin: 0 4px 8px;
    }

    /* Cards de rol */
    .role-card {
        margin: 0 0 10px;
        transition: border 0.2s;
    }

    .role-card.selected {
        border: 2px solid var(--ion-color-primary);
    }

    .role-card ion-card-content {
        padding: 12px 14px;
    }

    .role-option {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .role-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .role-icon ion-icon {
        font-size: 20px;
    }

    .role-info {
        flex: 1;
    }

    .role-info h4 {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 0 2px;
    }

    .role-info p {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 0;
        line-height: 1.4;
    }

    .error-msg {
        font-size: 13px;
        padding: 4px;
    }
</style>