// 📌 STORE DE PERSONAL - Gestiona el equipo de cada tienda

// ============================================
// IMPORTS
// ============================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StaffMember, InviteStaffData } from '@/models/StaffMember';
import * as notificationsService from '@/services/notifications.service';

// Clave de localStorage para persistencia
const STORAGE_KEY = 'inventoryapp_staff';

// ============================================
// STORE DE PERSONAL
// ============================================

export const useStaffStore = defineStore('staff', () => {

    // ============================================
    // ESTADO
    // ============================================

    const members = ref<StaffMember[]>([]);
    const isLoading = ref(false);

    // ============================================
    // HELPERS PRIVADOS (localStorage)
    // ============================================

    function loadFromStorage(): StaffMember[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function saveToStorage(data: StaffMember[]) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error guardando personal en localStorage:', e);
        }
    }

    // ============================================
    // GETTERS (Computed)
    // ============================================

    /**
     * Personal de una tienda específica
     */
    const getMembersByStore = computed(() => (storeId: string) =>
        members.value.filter(m => m.storeId === storeId)
    );

    /**
     * Solo miembros activos de una tienda
     */
    const getActiveMembersByStore = computed(() => (storeId: string) =>
        members.value.filter(m => m.storeId === storeId && m.status === 'active')
    );

    /**
     * Invitaciones pendientes de una tienda
     */
    const getPendingInvitesByStore = computed(() => (storeId: string) =>
        members.value.filter(m => m.storeId === storeId && m.status === 'invited')
    );

    /**
     * Número total de miembros activos de una tienda
     */
    const getActiveMembersCount = computed(() => (storeId: string) =>
        members.value.filter(m => m.storeId === storeId && m.status === 'active').length
    );

    // ============================================
    // ACCIONES
    // ============================================

    /**
     * Carga el personal de una tienda desde localStorage
     */
    async function fetchStaff(storeId: string) {
        isLoading.value = true;
        try {
            const all = loadFromStorage();
            // Mezclar conservando los que ya existen en memoria de otras tiendas
            const otherStores = members.value.filter(m => m.storeId !== storeId);
            const thisStore = all.filter(m => m.storeId === storeId);
            members.value = [...otherStores, ...thisStore];
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * ✉️ Invita a un nuevo miembro a la tienda
     * Crea el registro y genera una notificación de invitación
     */
    async function inviteStaff(
        data: InviteStaffData,
        storeId: string,
        storeName: string,
        invitedByUserId: string,
        invitedBy: string
    ) {
        isLoading.value = true;
        try {
            // Verificar que no esté ya invitado/activo en esta tienda
            const existing = members.value.find(
                m => m.storeId === storeId && m.email.toLowerCase() === data.email.toLowerCase()
            );

            if (existing) {
                return {
                success: false,
                error: existing.status === 'invited'
                    ? 'Ya existe una invitación pendiente para ese email'
                    : 'Ese usuario ya forma parte de la tienda',
                };
            }

            const newMember: StaffMember = {
                id: `staff-${Date.now()}`,
                storeId,
                email: data.email.toLowerCase().trim(),
                name: data.name.trim(),
                role: data.role,
                status: 'invited',
                invitedBy: invitedByUserId,
                invitedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            members.value.push(newMember);
            saveToStorage(members.value);

            // Crear notificación de invitación en el sistema de alertas
            await notificationsService.createNotification({
                storeId,
                type: 'invitation',
                priority: 'high',
                title: 'Invitación enviada',
                message: `Se invitó a ${data.name} (${data.email}) como ${data.role === 'admin' ? 'Administrador' : 'Vendedor'}`,
                data: {
                    invitedBy,
                    // invitedByUserId,
                    storeName,
                    role: data.role,
                    // email: data.email,
                },
            });

            return { success: true, member: newMember };
        } catch (error: any) {
            console.error('Error al invitar personal:', error);
            return { success: false, error: 'Error al enviar invitación' };
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * ✅ Activa un miembro (acepta invitación o reactiva)
     */
    async function activateMember(memberId: string) {
        const index = members.value.findIndex(m => m.id === memberId);
        if (index === -1) return { success: false, error: 'Miembro no encontrado' };

        members.value[index] = {
            ...members.value[index],
            status: 'active',
            joinedAt: members.value[index].joinedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        saveToStorage(members.value);
        return { success: true };
    }

    /**
     * 🚫 Desactiva un miembro (no lo elimina)
     */
    async function deactivateMember(memberId: string) {
        const index = members.value.findIndex(m => m.id === memberId);
        if (index === -1) return { success: false, error: 'Miembro no encontrado' };

        members.value[index] = {
            ...members.value[index],
            status: 'inactive',
            updatedAt: new Date().toISOString(),
        };

        saveToStorage(members.value);
        return { success: true };
    }

    /**
     * 🔄 Cambia el rol de un miembro
     * Solo el Owner puede hacer esto
     */
    async function changeRole(memberId: string, newRole: 'admin' | 'seller') {
        const index = members.value.findIndex(m => m.id === memberId);
        if (index === -1) return { success: false, error: 'Miembro no encontrado' };

        members.value[index] = {
            ...members.value[index],
            role: newRole,
            updatedAt: new Date().toISOString(),
        };

        saveToStorage(members.value);
        return { success: true };
    }

    /**
     * 🗑️ Elimina un miembro permanentemente de la tienda
     */
    async function removeMember(memberId: string) {
        const index = members.value.findIndex(m => m.id === memberId);
        if (index === -1) return { success: false, error: 'Miembro no encontrado' };

        members.value.splice(index, 1);
        saveToStorage(members.value);
        return { success: true };
    }

    /**
     * 🧹 Limpia el store al hacer logout
     */
    function clear() {
        members.value = [];
    }

    // ============================================
    // RETORNAR
    // ============================================
    return {
        // Estado
        members,
        isLoading,

        // Getters
        getMembersByStore,
        getActiveMembersByStore,
        getPendingInvitesByStore,
        getActiveMembersCount,

        // Acciones
        fetchStaff,
        inviteStaff,
        activateMember,
        deactivateMember,
        changeRole,
        removeMember,
        clear,
    };
});

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
//
// Este store gestiona el PERSONAL de cada tienda.
//
// Persiste en localStorage (igual que los otros stores).
//
// FLUJO DE INVITACIÓN:
//  1. Owner/Admin invita por email → status: 'invited'
//  2. En una app real, se enviaría un email con link
//  3. La persona acepta → status: 'active'
//  4. Owner puede desactivar → status: 'inactive'
//
// PERMISOS:
//  • Owner: puede invitar admins y vendedores,
//           cambiar roles, activar/desactivar, eliminar
//  • Admin: puede invitar vendedores,
//           activar/desactivar vendedores
//  • Seller: no puede gestionar personal
//
// ============================================