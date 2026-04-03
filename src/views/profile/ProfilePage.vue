<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tabs/more"></ion-back-button>
                </ion-buttons>
                <ion-title>Mi Perfil</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <ion-card>
                <ion-card-header class="profile-header">
                    <div class="profile-info">
                        <ion-avatar class="profile-avatar">
                            <img :src="userAvatar" :alt="user?.name || 'Usuario'" />
                        </ion-avatar>
                        <div class="profile-text">
                            <ion-card-title>{{ user?.name || 'Usuario' }}</ion-card-title>
                            <ion-card-subtitle>{{ user?.email || 'email@ejemplo.com' }}</ion-card-subtitle>
                        </div>
                    </div>
                </ion-card-header>

                <ion-card-content>
                    <ion-list>
                        <ion-item>
                            <ion-icon :icon="personOutline" slot="start"></ion-icon>
                            <ion-label>
                                <h3>Nombre</h3>
                                <p>{{ user?.name || 'No especificado' }}</p>
                            </ion-label>
                        </ion-item>

                        <ion-item>
                            <ion-icon :icon="mailOutline" slot="start"></ion-icon>
                            <ion-label>
                                <h3>Email</h3>
                                <p>{{ user?.email || 'No especificado' }}</p>
                            </ion-label>
                        </ion-item>

                        <ion-item>
                            <ion-icon :icon="shieldCheckmarkOutline" slot="start"></ion-icon>
                            <ion-label>
                                <h3>Rol</h3>
                                <p>{{ userRole }}</p>
                            </ion-label>
                        </ion-item>

                        <ion-item>
                            <ion-icon :icon="storefrontOutline" slot="start"></ion-icon>
                            <ion-label>
                                <h3>Tienda Actual</h3>
                                <p>{{ currentStore?.name || 'Ninguna tienda seleccionada' }}</p>
                            </ion-label>
                        </ion-item>

                        <ion-item v-if="user?.phone">
                            <ion-icon :icon="callOutline" slot="start"></ion-icon>
                            <ion-label>
                                <h3>Teléfono</h3>
                                <p>{{ user?.phone }}</p>
                            </ion-label>
                        </ion-item>
                    </ion-list>
                </ion-card-content>
            </ion-card>

            <ion-card>
                <ion-card-header>
                    <ion-card-title>Acciones</ion-card-title>
                </ion-card-header>

                <ion-card-content>
                    <ion-list>
                        <ion-item button @click="editProfile">
                            <ion-icon :icon="createOutline" slot="start" color="primary"></ion-icon>
                            <ion-label>
                                <h3>Editar Perfil</h3>
                                <p>Actualizar información personal</p>
                            </ion-label>
                        </ion-item>

                        <ion-item button @click="changePassword">
                            <ion-icon :icon="keyOutline" slot="start" color="primary"></ion-icon>
                            <ion-label>
                                <h3>Cambiar Contraseña</h3>
                                <p>Actualizar tu contraseña</p>
                            </ion-label>
                        </ion-item>

                        <ion-item button @click="viewPrivacySettings">
                            <ion-icon :icon="shieldOutline" slot="start" color="primary"></ion-icon>
                            <ion-label>
                                <h3>Privacidad</h3>
                                <p>Configurar privacidad y datos</p>
                            </ion-label>
                        </ion-item>
                    </ion-list>
                </ion-card-content>
            </ion-card>

            <ion-card v-if="isOwner">
                <ion-card-header>
                    <ion-card-title>Estadísticas</ion-card-title>
                </ion-card-header>

                <ion-card-content>
                    <ion-list>
                        <ion-item>
                            <ion-icon :icon="storefrontOutline" slot="start"></ion-icon>
                            <ion-label>
                                <h3>Tiendas</h3>
                                <p>{{ storesCount }} tienda(s)</p>
                            </ion-label>
                        </ion-item>

                        <ion-item>
                            <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
                            <ion-label>
                                <h3>Personal</h3>
                                <p>{{ staffCount }} miembro(s)</p>
                            </ion-label>
                        </ion-item>
                    </ion-list>
                </ion-card-content>
            </ion-card>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonAvatar,
} from '@ionic/vue';
import {
    personOutline,
    mailOutline,
    shieldCheckmarkOutline,
    storefrontOutline,
    createOutline,
    keyOutline,
    shieldOutline,
    peopleOutline,
    callOutline,
} from 'ionicons/icons';

import { useAuthStore } from '@/stores/auth';
import { useStoresStore } from '@/stores/stores';
import { useStaffStore } from '@/stores/staff';

const authStore = useAuthStore();
const storesStore = useStoresStore();
const staffStore = useStaffStore();

const user = computed(() => authStore.user);
const currentStore = computed(() => storesStore.currentStore);
const isOwner = computed(() => authStore.isOwner);
const storesCount = computed(() => storesStore.storesCount);
const staffCount = computed(() => {
    if (!storesStore.currentStoreId) return 0;
    return staffStore.getActiveMembersCount(storesStore.currentStoreId);
});

const userRole = computed(() => {
    if (authStore.isOwner) return 'Propietario';
    if (authStore.isAdmin) return 'Administrador';
    return 'Vendedor';
});

const userAvatar = computed(() => {
    // Por ahora usar un avatar genérico
    // En el futuro se puede implementar subida de fotos
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.value?.name || 'User')}&background=3880ff&color=fff&size=128`;
});

async function editProfile() {
    // TODO: Implementar edición de perfil
    console.log('Editar perfil - funcionalidad pendiente');
}

async function changePassword() {
    // TODO: Implementar cambio de contraseña
    console.log('Cambiar contraseña - funcionalidad pendiente');
}

async function viewPrivacySettings() {
    // TODO: Implementar configuración de privacidad
    console.log('Configuración de privacidad - funcionalidad pendiente');
}
</script>

<style scoped>
.profile-header {
    padding: 16px;
}

.profile-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.profile-avatar {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
}

.profile-text {
    flex: 1;
}

ion-card {
    margin: 16px;
}

ion-card:first-child {
    margin-top: 0;
}
</style>