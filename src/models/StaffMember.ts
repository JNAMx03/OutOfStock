// 📌 MODELO DE PERSONAL - Define la estructura de miembros del equipo por tienda

// import type { UserRole } from '@/models/User';

// ============================================
// TIPOS
// ============================================

/**
 * Estado del miembro en la tienda
 * - invited: se le envió invitación, aún no acepta
 * - active:  está activo y puede operar en la tienda
 * - inactive: fue desactivado por el Owner/Admin
 */
export type StaffStatus = 'invited' | 'active' | 'inactive';

// ============================================
// INTERFACES
// ============================================

/**
 * Miembro del personal de una tienda.
 * Un usuario puede ser staff de varias tiendas.
 */
export interface StaffMember {
    id: string;           // ID único de este registro (no es el userId)
    storeId: string;      // Tienda a la que pertenece
    email: string;        // Email con el que fue invitado
    name: string;         // Nombre (se llena al aceptar, o lo ingresa el invitador)

    // Rol asignado en ESTA tienda (owners no se agregan como staff)
    role: 'admin' | 'seller';

    // Estado
    status: StaffStatus;

    // Auditoría
    invitedBy: string;    // userId de quien envió la invitación
    invitedAt: string;    // ISO string de la fecha de invitación
    joinedAt?: string;    // ISO string cuando aceptó (undefined si aún no acepta)
    updatedAt: string;    // Última modificación
}

/**
 * Datos para invitar a un nuevo miembro
 */
export interface InviteStaffData {
    email: string;
    name: string;
    role: 'admin' | 'seller';
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Nombre legible del estado del staff
 */
export function getStaffStatusName(status: StaffStatus): string {
    const names: Record<StaffStatus, string> = {
        invited:  'Invitación pendiente',
        active:   'Activo',
        inactive: 'Inactivo',
    };
    return names[status];
}

/**
 * Color Ionic para el badge de estado
 */
export function getStaffStatusColor(status: StaffStatus): string {
    const colors: Record<StaffStatus, string> = {
        invited:  'warning',
        active:   'success',
        inactive: 'medium',
    };
    return colors[status];
}

/**
 * Verifica si un miembro está activo y puede operar
 */
export function isStaffActive(member: StaffMember): boolean {
    return member.status === 'active';
}