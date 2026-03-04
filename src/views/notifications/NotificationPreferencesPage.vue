<!-- src/views/notifications/NotificationPreferencesPage.vue -->
<!-- 📌 PREFERENCIAS DE NOTIFICACIONES - Configuración de alertas del usuario -->

<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tabs/dashboard" text="Volver" />
                </ion-buttons>
                <ion-title>Preferencias de alertas</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">

            <!-- ======================================
                SECCIÓN: ALERTAS DE INVENTARIO
                ====================================== -->
            <div class="section">
                <div class="section-header">
                    <ion-icon :icon="cubeIcon" class="section-icon stock-icon" />
                    <div>
                        <h2 class="section-title">Alertas de inventario</h2>
                        <p class="section-desc">Recibe avisos cuando el stock sea bajo o se agote</p>
                    </div>
                </div>

                <ion-list lines="none" class="settings-list">
                <!-- Toggle: Stock bajo -->
                    <ion-item class="settings-item">
                        <div class="setting-info" slot="start">
                            <span class="setting-label">Stock bajo</span>
                            <span class="setting-desc">Cuando un producto baje del mínimo</span>
                        </div>
                        <ion-toggle
                            slot="end"
                            v-model="prefs.lowStockAlerts"
                            @ion-change="savePreferences"
                            color="warning"
                        />
                    </ion-item>

                    <!-- Toggle: Producto agotado -->
                    <ion-item class="settings-item">
                        <div class="setting-info" slot="start">
                            <span class="setting-label">Producto agotado</span>
                            <span class="setting-desc">Cuando el stock llegue a 0</span>
                        </div>
                        <ion-toggle
                            slot="end"
                            v-model="prefs.outOfStockAlerts"
                            @ion-change="savePreferences"
                            color="danger"
                        />
                    </ion-item>
                </ion-list>
            </div>

            <!-- ======================================
                SECCIÓN: ALERTAS DE DEUDAS
                ====================================== -->
            <div class="section">
                <div class="section-header">
                    <ion-icon :icon="cashIcon" class="section-icon debt-icon" />
                    <div>
                        <h2 class="section-title">Alertas de deudas</h2>
                        <p class="section-desc">Recordatorios de cobros pendientes</p>
                    </div>
                </div>

                <ion-list lines="none" class="settings-list">
                    <!-- Toggle: Recordatorio de deuda -->
                    <ion-item class="settings-item">
                        <div class="setting-info" slot="start">
                            <span class="setting-label">Recordatorio de cobro</span>
                            <span class="setting-desc">Cuando se acerque la fecha de vencimiento</span>
                        </div>
                        <ion-toggle
                            slot="end"
                            v-model="prefs.debtReminders"
                            @ion-change="savePreferences"
                            color="warning"
                        />
                    </ion-item>

                    <!-- Toggle: Deuda vencida -->
                    <ion-item class="settings-item">
                        <div class="setting-info" slot="start">
                            <span class="setting-label">Deuda vencida</span>
                            <span class="setting-desc">Cuando una deuda pase su fecha límite</span>
                        </div>
                        <ion-toggle
                            slot="end"
                            v-model="prefs.debtOverdueAlerts"
                            @ion-change="savePreferences"
                            color="danger"
                        />
                    </ion-item>

                    <!-- Selector de anticipación (días) -->
                    <ion-item class="settings-item" v-if="prefs.debtReminders">
                        <div class="setting-info" slot="start">
                            <span class="setting-label">Alertar con anticipación</span>
                            <span class="setting-desc">¿Con cuántos días de antelación?</span>
                        </div>
                        <ion-select
                            slot="end"
                            v-model="prefs.debtReminderDays"
                            interface="popover"
                            @ion-change="savePreferences"
                            class="days-select"
                        >
                            <ion-select-option :value="1">1 día</ion-select-option>
                            <ion-select-option :value="2">2 días</ion-select-option>
                            <ion-select-option :value="3">3 días</ion-select-option>
                            <ion-select-option :value="5">5 días</ion-select-option>
                            <ion-select-option :value="7">7 días</ion-select-option>
                        </ion-select>
                    </ion-item>
                </ion-list>
            </div>

            <!-- ======================================
                SECCIÓN: OTRAS ALERTAS
                ====================================== -->
            <div class="section">
                <div class="section-header">
                    <ion-icon :icon="notificationsIcon" class="section-icon other-icon" />
                    <div>
                        <h2 class="section-title">Otras notificaciones</h2>
                        <p class="section-desc">Invitaciones y confirmaciones</p>
                    </div>
                </div>

                <ion-list lines="none" class="settings-list">
                    <!-- Toggle: Invitaciones -->
                    <ion-item class="settings-item">
                        <div class="setting-info" slot="start">
                            <span class="setting-label">Invitaciones a tiendas</span>
                            <span class="setting-desc">Cuando alguien te invite como admin o vendedor</span>
                        </div>
                        <ion-toggle
                            slot="end"
                            v-model="prefs.invitations"
                            @ion-change="savePreferences"
                            color="primary"
                        />
                    </ion-item>

                    <!-- Toggle: Confirmaciones de venta -->
                    <ion-item class="settings-item">
                        <div class="setting-info" slot="start">
                            <span class="setting-label">Confirmaciones de venta</span>
                            <span class="setting-desc">Aviso al registrar cada venta (puede ser muchos)</span>
                        </div>
                        <ion-toggle
                            slot="end"
                            v-model="prefs.saleConfirmations"
                            @ion-change="savePreferences"
                            color="success"
                        />
                    </ion-item>
                </ion-list>
            </div>

            <!-- ======================================
                SECCIÓN: ACCIONES DE LIMPIEZA
                ====================================== -->
            <div class="section">
                <ion-list lines="none" class="settings-list">
                    <ion-item
                        class="settings-item action-item"
                        button
                        detail
                        @click="runChecksNow"
                    >
                        <ion-icon slot="start" :icon="refreshIcon" color="primary" />
                        <ion-label>
                            <span class="setting-label">Verificar alertas ahora</span>
                            <span class="setting-desc">Revisa el inventario y deudas manualmente</span>
                        </ion-label>
                    </ion-item>

                    <ion-item
                        class="settings-item action-item danger-action"
                        button
                        detail
                        @click="confirmClearAll"
                    >
                        <ion-icon slot="start" :icon="trashIcon" color="danger" />
                        <ion-label>
                            <span class="setting-label" style="color: var(--ion-color-danger)">
                                Borrar todas las notificaciones
                            </span>
                            <span class="setting-desc">Elimina todas las alertas actuales</span>
                        </ion-label>
                    </ion-item>
                </ion-list>
            </div>

        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { reactive } from 'vue';
    import {
        IonPage, IonHeader, IonToolbar, IonTitle, IonButtons,
        IonBackButton, IonContent, IonList, IonItem, IonToggle,
        IonSelect, IonSelectOption, IonIcon, IonLabel,
        alertController, toastController,
    } from '@ionic/vue';
    import {
        cube as cubeIcon,
        cash as cashIcon,
        notifications as notificationsIcon,
        refresh as refreshIcon,
        trash as trashIcon,
    } from 'ionicons/icons';
    import { useNotificationsStore } from '@/stores/notifications';
    // import { useStoresStore } from '@/stores/stores';
    import { useAuthStore } from '@/stores/auth';
    import { alertsService } from '@/services/alerts.service';

    // ============================================
    // STORES
    // ============================================
    const notificationsStore = useNotificationsStore();
    // const storesStore = useStoresStore();
    const authStore = useAuthStore();

    // ============================================
    // ESTADO LOCAL - copia reactiva de las preferencias
    // ============================================
    // Hacemos una copia reactiva para que los toggles funcionen en tiempo real
    const prefs = reactive({ ...notificationsStore.preferences });

    // ============================================
    // FUNCIONES
    // ============================================

    /** Guarda los cambios de preferencias en el store */
    function savePreferences(): void {
        notificationsStore.updatePreferences({ ...prefs });
    }

    /** Ejecuta la verificación de alertas manualmente en la tienda actual */
    async function runChecksNow(): Promise<void> {
        const currentStoreId = authStore.user?.currentStoreId;
        if (!currentStoreId) {
            const toast = await toastController.create({
                message: 'Primero selecciona una tienda',
                duration: 2000,
                color: 'warning',
            });
            await toast.present();
            return;
        }

        alertsService.runAllChecks(currentStoreId);

        const toast = await toastController.create({
            message: '✅ Verificación completada',
            duration: 2000,
            color: 'success',
            position: 'top',
        });
        await toast.present();
    }

    /** Pide confirmación antes de borrar todas las notificaciones */
    async function confirmClearAll(): Promise<void> {
        const alert = await alertController.create({
            header: 'Borrar notificaciones',
            message: '¿Estás seguro de que quieres eliminar todas las notificaciones?',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Borrar todo',
                    role: 'destructive',
                    handler: () => {
                    notificationsStore.clearAllNotifications();
                    },
                },
            ],
        });
        await alert.present();
    }
</script>

<style scoped>
    /* Sección con tarjeta de fondo */
    .section {
        background: var(--ion-background-color, white);
        border-radius: 12px;
        margin-bottom: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
    }

    /* Header de cada sección (ícono + título + descripción) */
    .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 16px 8px;
        border-bottom: 1px solid var(--ion-color-light);
    }

    .section-icon {
        font-size: 24px;
        flex-shrink: 0;
    }

    .stock-icon { color: var(--ion-color-warning); }
    .debt-icon  { color: var(--ion-color-danger); }
    .other-icon { color: var(--ion-color-primary); }

    .section-title {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 2px;
        color: var(--ion-color-dark);
    }

    .section-desc {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 0;
    }

    /* Lista de configuraciones */
    .settings-list {
        padding: 4px 0;
    }

    .settings-item {
        --padding-start: 16px;
        --padding-end: 12px;
        --min-height: 60px;
    }

    .setting-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        padding-right: 12px;
    }

    .setting-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--ion-color-dark);
    }

    .setting-desc {
        font-size: 12px;
        color: var(--ion-color-medium);
    }

    .days-select {
        min-width: 90px;
        font-size: 14px;
    }

    /* Ítems de acción (borrar, verificar) */
    .action-item {
        --padding-start: 16px;
    }

    .action-item ion-label {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
</style>