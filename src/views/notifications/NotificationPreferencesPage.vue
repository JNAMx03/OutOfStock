<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="closeModal">
                        <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>Preferencias</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="savePreferences" :disabled="isSaving">
                        <strong>Guardar</strong>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">

            <!-- Descripción -->
            <div class="section-description">
                <ion-icon :icon="notificationsOutline" color="primary"></ion-icon>
                <p>Elige qué tipo de alertas quieres recibir en tu app.</p>
            </div>

            <!-- Tipos de alertas -->
            <ion-list>
                <ion-list-header>
                    <ion-label>Tipos de Alerta</ion-label>
                </ion-list-header>

                <!-- Alertas de stock -->
                <ion-item>
                    <div slot="start" class="pref-icon pref-icon--stock">
                        <ion-icon :icon="cubeOutline"></ion-icon>
                    </div>
                    <ion-label class="ion-text-wrap">
                        <h3>Alertas de Stock Bajo</h3>
                        <p>Cuando un producto baje del stock mínimo</p>
                    </ion-label>
                    <ion-toggle
                        v-model="localPrefs.stockAlerts"
                        slot="end"
                        color="primary"
                    ></ion-toggle>
                </ion-item>

                <!-- Alertas de deudas -->
                <ion-item>
                    <div slot="start" class="pref-icon pref-icon--debt">
                        <ion-icon :icon="cashOutline"></ion-icon>
                    </div>
                    <ion-label class="ion-text-wrap">
                        <h3>Alertas de Deudas</h3>
                        <p>Cuando un cliente tenga deuda vencida</p>
                    </ion-label>
                    <ion-toggle
                        v-model="localPrefs.debtAlerts"
                        slot="end"
                        color="primary"
                    ></ion-toggle>
                </ion-item>

                <!-- Mensajes del sistema -->
                <ion-item>
                    <div slot="start" class="pref-icon pref-icon--system">
                        <ion-icon :icon="informationCircleOutline"></ion-icon>
                    </div>
                    <ion-label class="ion-text-wrap">
                        <h3>Mensajes del Sistema</h3>
                        <p>Actualizaciones y avisos importantes</p>
                    </ion-label>
                    <ion-toggle
                        v-model="localPrefs.systemMessages"
                        slot="end"
                        color="primary"
                    ></ion-toggle>
                </ion-item>
            </ion-list>

            <!-- Nota informativa -->
            <ion-card class="info-card">
                <ion-card-content>
                    <ion-icon :icon="informationCircleOutline" color="primary"></ion-icon>
                    <p>
                        Las notificaciones se muestran dentro de la app.
                        Las notificaciones push en tu teléfono estarán disponibles
                        cuando instales la aplicación desde la tienda.
                    </p>
                </ion-card-content>
            </ion-card>

        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import {
        IonPage, IonHeader, IonToolbar, IonButtons, IonButton,
        IonTitle, IonContent, IonList, IonListHeader, IonItem,
        IonLabel, IonToggle, IonIcon, IonCard, IonCardContent,
        modalController, toastController,
    } from '@ionic/vue';
    import {
        closeOutline, notificationsOutline, cubeOutline,
        cashOutline, informationCircleOutline,
    } from 'ionicons/icons';

    import { useNotificationsStore } from '@/stores/notifications';
    import type { NotificationPreferences } from '@/models/Notification';
    import { getDefaultPreferences } from '@/models/Notification';

    const notificationsStore = useNotificationsStore();
    const isSaving = ref(false);

    // Copia local de las preferencias para editar sin afectar el store
    const localPrefs = ref<NotificationPreferences>(getDefaultPreferences());

    // Al montar, cargar las preferencias actuales del store
    onMounted(() => {
        localPrefs.value = { ...notificationsStore.preferences };
    });

    async function closeModal() {
        await modalController.dismiss();
    }

    async function savePreferences() {
        isSaving.value = true;
        try {
            await notificationsStore.updatePreferences(localPrefs.value);
            await showToast('Preferencias guardadas', 'success');
            await modalController.dismiss();
        } catch {
            await showToast('Error al guardar', 'danger');
        } finally {
            isSaving.value = false;
        }
    }

    async function showToast(message: string, color: string) {
        const toast = await toastController.create({
            message, duration: 2000, position: 'top', color,
        });
        await toast.present();
    }
</script>

<style scoped>
    .section-description {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 0;
        margin-bottom: 8px;
    }

    .section-description ion-icon {
        font-size: 28px;
        flex-shrink: 0;
    }

    .section-description p {
        color: var(--ion-color-medium);
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
    }

    .pref-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 4px;
    }

    .pref-icon ion-icon {
        font-size: 20px;
        color: white;
    }

    .pref-icon--stock { background: var(--ion-color-warning); }
    .pref-icon--debt  { background: var(--ion-color-danger); }
    .pref-icon--system { background: var(--ion-color-primary); }

    .info-card {
        margin-top: 24px;
    }

    .info-card ion-card-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }

    .info-card ion-icon {
        font-size: 24px;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .info-card p {
        color: var(--ion-color-medium);
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
    }
</style>