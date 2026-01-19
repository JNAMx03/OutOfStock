<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>Dashboard</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="handleLogout">
                        <ion-icon :icon="logOutOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" class="ion-padding">
            <div class="dashboard-container">
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>¡Bienvenido!</ion-card-title>
                        <ion-card-subtitle>{{ user?.name }}</ion-card-subtitle>
                    </ion-card-header>
                    <ion-card-content>
                        <p><strong>Email: </strong>{{ user?.email }}</p>
                        <p><strong>Rol: </strong>
                            <ion-badge :color="getRoleColor(user?.role!)">
                                {{ getRoleName(user?.role!) }}
                            </ion-badge>
                        </p>

                        <ion-button expand="block" class="ion-margin-top" disabled>
                            en construccions
                        </ion-button>

                        <p class="info-text ion-margin-top">
                            ✅ La autenticación funciona correctamente.
                        </p>
                    </ion-card-content>
                </ion-card>
            </div>
        </ion-content>
    </ion-page>
</template>

// ============================================
// IMPORTS
// ============================================

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRouter } from 'vue-router';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardSubtitle,
        IonCardContent,
        IonBadge,        
    } from '@ionic/vue';
    import { logOutOutline } from 'ionicons/icons';
    import { useAuthStore } from '@/stores/auth';
    import { getRoleName, getRoleColor } from '@/models/User';

    const router = useRouter();
    const authStore = useAuthStore();

    const user = computed(() => authStore.user);

    console.log(user);

    async function handleLogout(){
        await authStore.logout();
        router.push('/login');
    }
</script>

// ============================================
// ESTILOS
// ============================================

<style scoped>
    .dashboard-container{
        max-width: 600px;
        margin: 0 auto;
        padding-top: 20px;
    }

    .info-text{
        font-size: 14px;
        color: var(--ion-color-medium);
        text-align: center;
        line-height: 1.6;
    }
</style>