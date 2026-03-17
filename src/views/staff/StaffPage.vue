<template>
    <ion-page>
        <!-- Header -->
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tabs/more"></ion-back-button>
                </ion-buttons>
                <ion-title>Personal</ion-title>
                <ion-buttons slot="end">
                    <!-- Solo Owner y Admin pueden invitar -->
                    <ion-button v-if="canInvite" @click="openInviteModal">
                        <ion-icon :icon="personAddOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">

            <!-- Pull to refresh -->
            <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
                <ion-refresher-content></ion-refresher-content>
            </ion-refresher>

            <!-- Estado de carga -->
            <div v-if="isLoading" class="loading-state">
                <ion-spinner name="crescent" color="primary"></ion-spinner>
                <p>Cargando personal...</p>
            </div>

            <div v-else class="ion-padding">

                <!-- ============================
                    RESUMEN RÁPIDO
                    ============================ -->
                <div class="summary-strip">
                    <div class="summary-item">
                        <p class="summary-num">{{ activeCount }}</p>
                        <p class="summary-label">Activos</p>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-item">
                        <p class="summary-num warning">{{ pendingCount }}</p>
                        <p class="summary-label">Pendientes</p>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-item">
                        <p class="summary-num medium">{{ inactiveCount }}</p>
                        <p class="summary-label">Inactivos</p>
                    </div>
                </div>

                <!-- ============================
                    INVITACIONES PENDIENTES
                    ============================ -->
                <section v-if="pendingMembers.length > 0" class="section">
                    <h2 class="section-title">⏳ Invitaciones Pendientes</h2>

                    <ion-card
                        v-for="member in pendingMembers"
                        :key="member.id"
                        class="member-card"
                    >
                        <ion-card-content>
                            <div class="member-row">
                                <div class="member-avatar avatar--pending">
                                    {{ member.name.charAt(0).toUpperCase() }}
                                </div>
                                <div class="member-info">
                                    <h3>{{ member.name }}</h3>
                                    <p class="member-email">{{ member.email }}</p>
                                    <div class="member-badges">
                                        <ion-badge :color="getRoleColor(member.role)">
                                            {{ getRoleName(member.role) }}
                                        </ion-badge>
                                        <ion-badge color="warning">Pendiente</ion-badge>
                                    </div>
                                    <p class="member-date">
                                        Invitado {{ formatDate(member.invitedAt) }}
                                    </p>
                                </div>
                                <!-- Acciones para invitación pendiente -->
                                <ion-button
                                fill="clear"
                                color="success"
                                size="small"
                                @click="confirmActivate(member)"
                                title="Marcar como activo (simular aceptación)"
                                >
                                    <ion-icon :icon="checkmarkCircleOutline" slot="icon-only"></ion-icon>
                                </ion-button>
                                <ion-button
                                fill="clear"
                                color="danger"
                                size="small"
                                @click="confirmRemove(member)"
                                title="Cancelar invitación"
                                >
                                    <ion-icon :icon="closeCircleOutline" slot="icon-only"></ion-icon>
                                </ion-button>
                            </div>
                        </ion-card-content>
                    </ion-card>
                </section>

                <!-- ============================
                    MIEMBROS ACTIVOS
                    ============================ -->
                <section v-if="activeMembers.length > 0" class="section">
                    <h2 class="section-title">✅ Activos</h2>

                    <ion-card
                        v-for="member in activeMembers"
                        :key="member.id"
                        class="member-card"
                    >
                        <ion-card-content>
                            <div class="member-row">
                                <!-- Avatar con inicial -->
                                <div class="member-avatar avatar--active">
                                    {{ member.name.charAt(0).toUpperCase() }}
                                </div>

                                <!-- Info del miembro -->
                                <div class="member-info">
                                    <h3>{{ member.name }}</h3>
                                    <p class="member-email">{{ member.email }}</p>
                                    <div class="member-badges">
                                        <ion-badge :color="getRoleColor(member.role)">
                                        {{ getRoleName(member.role) }}
                                        </ion-badge>
                                    </div>
                                    <p class="member-date">
                                        Desde {{ formatDate(member.joinedAt || member.invitedAt) }}
                                    </p>
                                </div>

                                <!-- Menú de acciones -->
                                <ion-button
                                fill="clear"
                                color="medium"
                                size="small"
                                :id="`trigger-${member.id}`"
                                >
                                    <ion-icon :icon="ellipsisVerticalOutline" slot="icon-only"></ion-icon>
                                </ion-button>

                                <!-- Popover con opciones del miembro -->
                                <ion-popover
                                :trigger="`trigger-${member.id}`"
                                trigger-action="click"
                                >
                                    <ion-content>
                                        <ion-list lines="none">

                                        <!-- Cambiar rol (solo Owner) -->
                                        <ion-item
                                            v-if="isOwner && member.role === 'seller'"
                                            button
                                            @click="confirmChangeRole(member, 'admin')"
                                        >
                                            <ion-icon :icon="arrowUpCircleOutline" slot="start" color="primary"></ion-icon>
                                            <ion-label>Promover a Admin</ion-label>
                                        </ion-item>

                                        <ion-item
                                            v-if="isOwner && member.role === 'admin'"
                                            button
                                            @click="confirmChangeRole(member, 'seller')"
                                        >
                                            <ion-icon :icon="arrowDownCircleOutline" slot="start" color="warning"></ion-icon>
                                            <ion-label>Cambiar a Vendedor</ion-label>
                                        </ion-item>

                                        <!-- Desactivar -->
                                        <ion-item
                                            v-if="canManageMember(member)"
                                            button
                                            @click="confirmDeactivate(member)"
                                        >
                                            <ion-icon :icon="pauseCircleOutline" slot="start" color="warning"></ion-icon>
                                            <ion-label>Desactivar</ion-label>
                                        </ion-item>

                                        <!-- Eliminar (solo Owner) -->
                                        <ion-item
                                            v-if="isOwner"
                                            button
                                            @click="confirmRemove(member)"
                                        >
                                            <ion-icon :icon="trashOutline" slot="start" color="danger"></ion-icon>
                                            <ion-label color="danger">Eliminar</ion-label>
                                        </ion-item>

                                        </ion-list>
                                    </ion-content>
                                </ion-popover>
                            </div>
                        </ion-card-content>
                    </ion-card>
                </section>

                <!-- ============================
                    MIEMBROS INACTIVOS
                    ============================ -->
                <section v-if="inactiveMembers.length > 0" class="section">
                    <h2 class="section-title">🚫 Inactivos</h2>

                    <ion-card
                        v-for="member in inactiveMembers"
                        :key="member.id"
                        class="member-card member-card--inactive"
                    >
                        <ion-card-content>
                            <div class="member-row">
                                <div class="member-avatar avatar--inactive">
                                    {{ member.name.charAt(0).toUpperCase() }}
                                </div>
                                <div class="member-info">
                                    <h3>{{ member.name }}</h3>
                                    <p class="member-email">{{ member.email }}</p>
                                    <div class="member-badges">
                                        <ion-badge color="medium">{{ getRoleName(member.role) }}</ion-badge>
                                        <ion-badge color="medium">Inactivo</ion-badge>
                                    </div>
                                </div>
                                <!-- Reactivar -->
                                <ion-button
                                v-if="canManageMember(member)"
                                fill="outline"
                                color="success"
                                size="small"
                                @click="confirmActivate(member)"
                                >
                                    Reactivar
                                </ion-button>
                                <!-- Eliminar (solo Owner) -->
                                <ion-button
                                v-if="isOwner"
                                fill="clear"
                                color="danger"
                                size="small"
                                @click="confirmRemove(member)"
                                >
                                    <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                                </ion-button>
                            </div>
                        </ion-card-content>
                    </ion-card>
                </section>

                <!-- Estado vacío -->
                <div v-if="allMembers.length === 0" class="empty-state">
                    <ion-icon :icon="peopleOutline" class="empty-icon"></ion-icon>
                    <h3>Sin personal registrado</h3>
                    <p>Invita a tu equipo para que puedan gestionar la tienda contigo.</p>
                    <ion-button v-if="canInvite" @click="openInviteModal">
                        <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
                        Invitar Persona
                    </ion-button>
                </div>

            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    // ============================================
    // IMPORTS
    // ============================================
    import { ref, computed, onMounted } from 'vue';
    import {
        IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
        IonButton, IonTitle, IonContent, IonCard, IonCardContent,
        IonIcon, IonBadge, IonLabel, IonList, IonItem, IonSpinner,
        IonRefresher, IonRefresherContent, IonPopover,
        modalController, alertController, toastController,
    } from '@ionic/vue';
    import {
        personAddOutline, checkmarkCircleOutline, closeCircleOutline,
        ellipsisVerticalOutline, trashOutline, pauseCircleOutline,
        arrowUpCircleOutline, arrowDownCircleOutline, peopleOutline,
    } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';
    import { useStoresStore } from '@/stores/stores';
    import { useStaffStore } from '@/stores/staff';
    import { getRoleName, getRoleColor } from '@/models/User';
    import type { StaffMember } from '@/models/StaffMember';
    import InviteStaffModal from '@/components/staff/InviteStaffModal.vue';

    // ============================================
    // COMPOSABLES
    // ============================================
    const authStore = useAuthStore();
    const storesStore = useStoresStore();
    const staffStore = useStaffStore();

    // ============================================
    // ESTADO LOCAL
    // ============================================
    const isLoading = ref(false);

    // ============================================
    // COMPUTED
    // ============================================

    const storeId = computed(() => storesStore.currentStoreId || '');
    const isOwner = computed(() => authStore.isOwner);
    const isAdmin = computed(() => authStore.isAdmin);

    // Solo Owner y Admin pueden invitar; Admin solo puede invitar vendedores
    const canInvite = computed(() => authStore.isOwner || authStore.isAdmin);

    /** Todo el personal de esta tienda */
    const allMembers = computed(() =>
        staffStore.getMembersByStore(storeId.value)
    );

    const activeMembers = computed(() =>
        allMembers.value.filter(m => m.status === 'active')
    );

    const pendingMembers = computed(() =>
        allMembers.value.filter(m => m.status === 'invited')
    );

    const inactiveMembers = computed(() =>
        allMembers.value.filter(m => m.status === 'inactive')
    );

    const activeCount = computed(() => activeMembers.value.length);
    const pendingCount = computed(() => pendingMembers.value.length);
    const inactiveCount = computed(() => inactiveMembers.value.length);

    /**
     * Determina si el usuario actual puede gestionar a este miembro:
     * - Owner puede gestionar a todos (admin y seller)
     * - Admin solo puede gestionar vendedores
     */
    function canManageMember(member: StaffMember): boolean {
        if (isOwner.value) return true;
        if (isAdmin.value && member.role === 'seller') return true;
        return false;
    }

    // ============================================
    // FUNCIONES
    // ============================================

    async function loadData() {
        if (!storeId.value) return;
            isLoading.value = true;
        try {
            await staffStore.fetchStaff(storeId.value);
        } finally {
            isLoading.value = false;
        }
    }

    async function openInviteModal() {
        const modal = await modalController.create({
            component: InviteStaffModal,
            componentProps: {
                storeId: storeId.value,
                storeName: storesStore.currentStore?.name || '',
                // Admin solo puede invitar vendedores
                allowAdminRole: isOwner.value,
            },
            initialBreakpoint: 0.75,
            breakpoints: [0, 0.75, 1],
        });
        await modal.present();
    }

    async function confirmActivate(member: StaffMember) {
        const action = member.status === 'invited' ? 'aceptar invitación de' : 'reactivar a';
        const alert = await alertController.create({
            header: member.status === 'invited' ? 'Aceptar Invitación' : 'Reactivar Miembro',
            message: `¿Confirmas ${action} ${member.name}?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Confirmar',
                    handler: async () => {
                        const result = await staffStore.activateMember(member.id);
                        if (result.success) {
                            await showToast(`${member.name} activado correctamente`, 'success');
                        }
                    },
                },
            ],
        });
        await alert.present();
    }

    async function confirmDeactivate(member: StaffMember) {
        const alert = await alertController.create({
            header: 'Desactivar Miembro',
            message: `¿Desactivar a ${member.name}? Ya no podrá acceder a esta tienda.`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Desactivar',
                    role: 'destructive',
                    handler: async () => {
                        const result = await staffStore.deactivateMember(member.id);
                        if (result.success) {
                            await showToast(`${member.name} desactivado`, 'warning');
                        }
                    },
                },
            ],
        });
        await alert.present();
    }

    async function confirmChangeRole(member: StaffMember, newRole: 'admin' | 'seller') {
        const roleName = newRole === 'admin' ? 'Administrador' : 'Vendedor';
        const alert = await alertController.create({
            header: 'Cambiar Rol',
            message: `¿Cambiar el rol de ${member.name} a ${roleName}?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Confirmar',
                    handler: async () => {
                        const result = await staffStore.changeRole(member.id, newRole);
                        if (result.success) {
                            await showToast(`Rol actualizado a ${roleName}`, 'success');
                        }
                    },
                },
            ],
        });
        await alert.present();
    }

    async function confirmRemove(member: StaffMember) {
        const action = member.status === 'invited' ? 'cancelar la invitación de' : 'eliminar a';
        const alert = await alertController.create({
            header: member.status === 'invited' ? 'Cancelar Invitación' : 'Eliminar Miembro',
            message: `¿Estás seguro de que deseas ${action} ${member.name}? Esta acción no se puede deshacer.`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: async () => {
                        const result = await staffStore.removeMember(member.id);
                        if (result.success) {
                            await showToast(`${member.name} eliminado`, 'danger');
                        }
                    },
                },
            ],
        });
        await alert.present();
    }

    async function handleRefresh(event: any) {
        await loadData();
        event.target.complete();
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        const diffMs = Date.now() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'hoy';
        if (diffDays === 1) return 'ayer';
        if (diffDays < 7) return `hace ${diffDays} días`;
        return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
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

    // ============================================
    // LIFECYCLE
    // ============================================
    onMounted(async () => {
        await loadData();
    });
</script>

<style scoped>
    /* Resumen rápido */
    .summary-strip {
        display: flex;
        justify-content: space-around;
        align-items: center;
        background: var(--ion-color-light);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
    }

    .summary-item {
        text-align: center;
        flex: 1;
    }

    .summary-num {
        font-size: 24px;
        font-weight: 800;
        color: var(--ion-color-dark);
        margin: 0;
    }

    .summary-num.warning { color: var(--ion-color-warning); }
    .summary-num.medium  { color: var(--ion-color-medium); }

    .summary-label {
        font-size: 11px;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        margin: 2px 0 0;
    }

    .summary-divider {
        width: 1px;
        height: 36px;
        background: var(--ion-color-light-shade);
    }

    /* Secciones */
    .section {
        margin-bottom: 24px;
    }

    .section-title {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--ion-color-medium);
        margin: 0 0 10px;
    }

    /* Cards de miembro */
    .member-card {
        margin: 0 0 10px;
    }

    .member-card--inactive {
        opacity: 0.65;
    }

    .member-card ion-card-content {
        padding: 12px 14px;
    }

    .member-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    /* Avatar */
    .member-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
        color: white;
        flex-shrink: 0;
    }

    .avatar--active   { background: var(--ion-color-primary); }
    .avatar--pending  { background: var(--ion-color-warning); }
    .avatar--inactive { background: var(--ion-color-medium); }

    /* Info del miembro */
    .member-info {
        flex: 1;
        min-width: 0;
    }

    .member-info h3 {
        font-size: 15px;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin: 0 0 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .member-email {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 0 0 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .member-badges {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 4px;
    }

    .member-date {
        font-size: 11px;
        color: var(--ion-color-medium);
        margin: 0;
    }

    /* Estado cargando */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: 16px;
    }

    .loading-state p { color: var(--ion-color-medium); }

    /* Estado vacío */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        text-align: center;
    }

    .empty-icon {
        font-size: 80px;
        color: var(--ion-color-light-shade);
        margin-bottom: 16px;
    }

    .empty-state h3 {
        font-size: 18px;
        color: var(--ion-color-dark);
        margin: 0 0 8px;
    }

    .empty-state p {
        color: var(--ion-color-medium);
        max-width: 280px;
        line-height: 1.5;
        margin-bottom: 24px;
    }
</style>