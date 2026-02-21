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

    const router = useRouter();
    const authStore = useAuthStore();

    const isOwner = computed(() => authStore.isOwner);
    const isAdmin = computed(() => authStore.isAdmin);
    const canViewFinancials = computed(() => authStore.isOwner || authStore.isAdmin);

    function goToStoresManagement() {
        router.push('/stores-management');
    }

    async function handleLogout() {
        await authStore.logout();
        router.push('/login');
    }
</script>