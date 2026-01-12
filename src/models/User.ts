// definir la estructura de datos de un usuario

// ============================================
// TIPOS Y ENUMS
// ============================================

/**
 * Roles disponibles en el sistema
 * 
 * - owner: Dueño (acceso total a todo)
 * - admin: Administrador (gestión de inventario y ventas)
 * - seller: Vendedor (solo registro de ventas)
 */
export type UserRole = 'owner' | 'admin' | 'seller';

/**
 * Estado de un usuario
 * 
 * - active: Usuario activo
 * - inactive: Usuario desactivado temporalmente
 * - pending: Invitación pendiente de aceptar
 */
export type UserStatus = 'active' | 'inactive' | 'pending';

// ============================================
// INTERFACES
// ============================================

/**
 * Interfaz principal de Usuario
 * Define todos los campos que puede tener un usuario
 */
export interface User{
    //Identiifcacion
    id: string;
    email: string;
    name: string;

    //Roles y permisos
    role: UserRole;
    status: UserStatus;

    //Tiendas
    storeIds: string[];
    currentStoreId: string | null;

    // Informacion adicional
    avatar?: string;
    phone?: string;

    // Metadatos
    createdAt: string;
    updateAt: string;
    lastLoginAt?: string;

    //Invitaciones (si aplica)
    invitedBy?: string;
    invitedAt?: string;
}

/**
 * Datos para crear un nuevo usuario
 * (versión simplificada, sin campos auto-generados)
 */
export interface CreateUserData{
    email: string;
    name: string;
    role: UserRole;
    StoreIds: string[];
    phone?: string;
}

/**
 * Datos para actualizar un usuario
 * (todos los campos son opcionales)
 */
export interface UpdateUserData{
    name?: string;
    role?: UserRole;
    status?: UserStatus;
    storeIds?: string[];
    currentStoreId?: string | null;
    phone?: string;
    avatar?: string;
}

/**
 * Datos de invitación para nuevo usuario
 */
export interface InviteUserData {
  email: string;
  name: string;
  role: UserRole;
  storeId: string;               // Tienda a la que se invita
  message?: string;              // Mensaje personalizado (opcional)
}

/**
 * Permisos según el rol
 * Define qué puede hacer cada rol
 */
export interface RolePermissions {
  canManageInventory: boolean;    // Gestionar productos
  canManageSales: boolean;        // Gestionar ventas
  canViewFinancials: boolean;     // Ver datos financieros
  canManageStores: boolean;       // Gestionar tiendas
  canManageUsers: boolean;        // Gestionar usuarios
  canDeleteRecords: boolean;      // Eliminar registros
  canExportData: boolean;         // Exportar reportes
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtiene los permisos según el rol
 * @param role - Rol del usuario
 * @returns Objeto con los permisos
 */
export function getRolePermissions(role: UserRole): RolePermissions{
    switch(role){
        case 'owner':
            return{
                canManageInventory: true,
                canManageSales: true,
                canViewFinancials: true,
                canManageStores: true,
                canManageUsers: true,
                canDeleteRecords: true,
                canExportData: true
            };
        case 'admin':
            return{
                canManageInventory: true,
                canManageSales: true,
                canViewFinancials: true,
                canManageStores: false,
                canManageUsers: true,
                canDeleteRecords: false,
                canExportData: true
            };
        case 'seller':
            return{
                canManageInventory: false,
                canManageSales: true,
                canViewFinancials: false,
                canManageStores: false,
                canManageUsers: false,
                canDeleteRecords: false,
                canExportData: false
            };
        default:
            return{
                canManageInventory: false,
                canManageSales: false,
                canViewFinancials: false,
                canManageStores: false,
                canManageUsers: false,
                canDeleteRecords: false,
                canExportData: false
            }; 
    }
}

/**
 * Obtiene el nombre legible del rol
 * @param role - Rol del usuario
 * @returns Nombre en español
 */
export function getRoleName(role: UserRole): string{
    const roleNames={
        owner: 'Dueño',
        admin: 'Administrador',
        seller: 'Vendedor'
    };
    return roleNames[role];
}

/**
 * Obtiene el color asociado al rol (para badges)
 * @param role - Rol del usuario
 * @returns Color en formato Ionic
 */
export function getRoleColor(role: UserRole): string{
    const roleColors={
        owner: 'primary',
        admin: 'secondary',
        seller: 'tertiary',
    };
    return roleColors[role];
}

/**
 * Valida si un email es válido
 * @param email - Email a validar
 * @returns true si es válido
 */
export function isValidEmail(email: string): boolean{
    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida si una contraseña cumple los requisitos
 * @param password - Contraseña a validar
 * @returns Objeto con resultado y mensaje
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Debe contener al menos una letra mayúscula' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Debe contener al menos una letra minúscula' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Debe contener al menos un número' };
  }
  
  return { valid: true, message: 'Contraseña válida' };
}