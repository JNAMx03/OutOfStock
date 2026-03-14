<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                <ion-menu-button></ion-menu-button>
                </ion-buttons>
                <ion-title>Más</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <ion-list>
                <ion-list-header>
                    <ion-label>Mi Cuenta</ion-label>
                </ion-list-header>

                <ion-item button>
                    <ion-icon :icon="personOutline" slot="start"></ion-icon>
                    <ion-label>Perfil</ion-label>
                </ion-item>

                <ion-item button>
                    <ion-icon :icon="settingsOutline" slot="start"></ion-icon>
                    <ion-label>Configuración</ion-label>
                </ion-item>

                <ion-list-header>
                    <ion-label>Gestión</ion-label>
                </ion-list-header>

                <ion-item button @click="goToStoresManagement" v-if="isOwner">
                    <ion-icon :icon="storefrontOutline" slot="start"></ion-icon>
                    <ion-label>Mis Tiendas</ion-label>
                </ion-item>

                <ion-item button v-if="isOwner || isAdmin">
                    <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
                    <ion-label>Personal</ion-label>
                </ion-item>

                <ion-item button v-if="canViewFinancials">
                    <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
                    <ion-label>Reportes</ion-label>
                </ion-item>

                <ion-list-header>
                    <ion-label>Ayuda</ion-label>
                </ion-list-header>

                <ion-item button>
                    <ion-icon :icon="helpCircleOutline" slot="start"></ion-icon>
                    <ion-label>Centro de Ayuda</ion-label>
                </ion-item>

                <ion-item button>
                    <ion-icon :icon="informationCircleOutline" slot="start"></ion-icon>
                    <ion-label>Acerca de</ion-label>
                </ion-item>

                <ion-item button lines="none" @click="handleLogout">
                    <ion-icon :icon="logOutOutline" slot="start" color="danger"></ion-icon>
                    <ion-label color="danger">Cerrar Sesión</ion-label>
                </ion-item>

                <ion-item button @click="openNotificationPreferences">
                    <ion-icon :icon="notificationsOutline" slot="start"></ion-icon>
                    <ion-label>Preferencias de notificaciones</ion-label>
                    <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
                </ion-item>

                <ion-item button @click="router.push('/portfolio')" detail>
                    <ion-icon :icon="peopleOutline" slot="start" color="primary"></ion-icon>
                    <ion-label>
                        <h3>Cartera de Clientes</h3>
                        <p>Deudores, abonos e historial</p>
                    </ion-label>
                    <!-- Badge con el número de deudores (si hay) -->
                    <ion-badge v-if="debtorsCount > 0" color="danger" slot="end">
                        {{ debtorsCount }}
                    </ion-badge>
                </ion-item>
            </ion-list>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRouter } from 'vue-router';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonTitle,
        IonContent,
        IonList,
        IonListHeader,
        IonItem,
        IonLabel,
        IonIcon,
    } from '@ionic/vue';
    import {
        personOutline,
        settingsOutline,
        storefrontOutline,
        peopleOutline,
        documentTextOutline,
        helpCircleOutline,
        informationCircleOutline,
        logOutOutline,
    } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    // import { useNotificationsStore } from '@/stores/notifications';
    import { notificationsOutline, chevronForwardOutline } from 'ionicons/icons';
    import { useClientsStore } from '@/stores/clients';

    const router = useRouter();
    const authStore = useAuthStore();
    const clientsStore = useClientsStore();

    const isOwner = computed(() => authStore.isOwner);
    const isAdmin = computed(() => authStore.isAdmin);
    const canViewFinancials = computed(() => authStore.isOwner || authStore.isAdmin);
    const debtorsCount = computed(() => clientsStore.debtorsCount);

    function goToStoresManagement() {
        router.push('/stores-management');
    }

    async function handleLogout() {
        await authStore.logout();
        router.push('/login');
    }

    async function openNotificationPreferences() {
        const { modalController } = await import('@ionic/vue');
        const { default: NotificationPreferencesPage } = await import(
            '@/views/notifications/NotificationPreferencesPage.vue'
        );
        
        const modal = await modalController.create({
            component: NotificationPreferencesPage,
            initialBreakpoint: 0.75,
            breakpoints: [0, 0.75, 1],
        });
        
        await modal.present();
    }
</script>