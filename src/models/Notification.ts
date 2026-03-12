// 📌 MODELO DE NOTIFICACIÓN - Define la estructura de las notificaciones

// ============================================
// TIPOS DE NOTIFICACIÓN
// ============================================

/**
 * Tipos posibles de notificación en la app
 * 
 * - stock_alert:  Producto con stock por debajo del mínimo
 * - debt_alert:   Cliente con deuda próxima a vencer o vencida
 * - invitation:   Invitación para ser admin o vendedor de una tienda
 * - sale_update:  Actualización de una venta (pago recibido, etc.)
 * - system:       Mensaje del sistema (actualizaciones, avisos)
 */
export type NotificationType =
    | 'stock_alert'
    | 'debt_alert'
    | 'invitation'
    | 'sale_update'
    | 'system';

/**
 * Prioridad de la notificación
 * 
 * - high:   Requiere atención inmediata (ej: stock en 0)
 * - medium: Importante pero no urgente (ej: stock bajo)
 * - low:    Informativa (ej: nueva venta registrada)
 */
export type NotificationPriority = 'high' | 'medium' | 'low';

// ============================================
// INTERFAZ PRINCIPAL
// ============================================

/**
 * Estructura completa de una Notificación
 */
export interface Notification {
    id: string;                        // ID único de la notificación
    type: NotificationType;            // Tipo de notificación
    priority: NotificationPriority;    // Prioridad: alta, media, baja
    title: string;                     // Título corto (ej: "Stock Bajo")
    message: string;                   // Mensaje descriptivo
    storeId: string;                   // Tienda a la que pertenece
    storeName?: string;                // Nombre de la tienda (para mostrar)
    isRead: boolean;                   // Si el usuario ya la leyó
    createdAt: string;                 // Fecha de creación (ISO string)
    readAt?: string;                   // Fecha en que se leyó (ISO string)
    
    // Datos adicionales según el tipo (payload)
    // Cada tipo puede traer información extra
    data?: NotificationData;
}

/**
 * Payload de datos adicionales según el tipo de notificación
 * Usamos una estructura flexible (Record) para cada tipo
 */
export type NotificationData =
    | StockAlertData
    | DebtAlertData
    | InvitationData
    | SaleUpdateData
    | SystemData;

// ============================================
// DATOS ADICIONALES POR TIPO
// ============================================

/**
 * Datos para alerta de stock bajo
 * Se genera cuando un producto baja del mínimo definido en la tienda
 */
export interface StockAlertData {
    productId: string;        // ID del producto con stock bajo
    productName: string;      // Nombre del producto
    currentStock: number;     // Stock actual
    minimumStock: number;     // Stock mínimo configurado
    unit?: string;            // Unidad de medida (ej: "cajas", "unidades")
}

/**
 * Datos para alerta de deuda
 * Se genera cuando un cliente tiene deuda vencida o próxima a vencer
 */
export interface DebtAlertData {
    saleId: string;           // ID de la venta con deuda
    saleNumber: string;       // Número de venta (ej: "V-0023")
    clientName: string;       // Nombre del cliente
    clientPhone?: string;     // Teléfono del cliente
    debtAmount: number;       // Monto total de la deuda
    daysOverdue?: number;     // Días vencida (si ya venció)
}

/**
 * Datos para invitación de personal
 * Se genera cuando el dueño/admin invita a alguien
 */
export interface InvitationData {
    invitedBy: string;        // Nombre del que invita
    role: 'admin' | 'seller'; // Rol al que se invita
    storeName: string;        // Nombre de la tienda
    invitationToken?: string; // Token de aceptación
}

/**
 * Datos para actualización de venta
 */
export interface SaleUpdateData {
    saleId: string;           // ID de la venta
    saleNumber: string;       // Número de venta
    clientName: string;       // Nombre del cliente
    amountPaid: number;       // Monto pagado
}

/**
 * Datos para mensaje del sistema
 */
export interface SystemData {
    actionUrl?: string;       // URL o ruta a la que navegar
    actionLabel?: string;     // Texto del botón de acción
}

// ============================================
// TIPOS AUXILIARES PARA CREAR NOTIFICACIONES
// ============================================

/**
 * Datos para crear una nueva notificación
 * (sin id, isRead, createdAt - se generan automáticamente)
 */
export type CreateNotificationData = Omit<Notification, 'id' | 'isRead' | 'createdAt'>;

/**
 * Configuración de preferencias de notificaciones del usuario
 */
export interface NotificationPreferences {
    stockAlerts: boolean;       // Recibir alertas de stock bajo
    debtAlerts: boolean;        // Recibir alertas de deudas
    saleUpdates: boolean;       // Recibir actualizaciones de ventas
    systemMessages: boolean;    // Recibir mensajes del sistema
    pushEnabled: boolean;       // Notificaciones push habilitadas
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtiene el color de Ionic según la prioridad
 * @param priority - Prioridad de la notificación
 * @returns Color de Ionic
 */
export function getNotificationColor(priority: NotificationPriority): string {
    const colors = {
        high: 'danger',     // Rojo - Urgente
        medium: 'warning',  // Amarillo - Importante
        low: 'primary',     // Azul - Informativo
    };
    return colors[priority];
}

/**
 * Obtiene el ícono de Ionicons según el tipo de notificación
 * @param type - Tipo de notificación
 * @returns Nombre del ícono
 */
export function getNotificationIcon(type: NotificationType): string {
    const icons = {
        stock_alert: 'cube-outline',
        debt_alert: 'cash-outline',
        invitation: 'person-add-outline',
        sale_update: 'cart-outline',
        system: 'information-circle-outline',
    };
    return icons[type];
}

/**
 * Obtiene el nombre legible del tipo de notificación
 * @param type - Tipo de notificación
 * @returns Nombre en español
 */
export function getNotificationTypeName(type: NotificationType): string {
    const names = {
        stock_alert: 'Alerta de Stock',
        debt_alert: 'Alerta de Deuda',
        invitation: 'Invitación',
        sale_update: 'Actualización de Venta',
        system: 'Sistema',
    };
    return names[type];
}

/**
 * Formatea la fecha de una notificación en texto relativo
 * Ejemplo: "Hace 5 minutos", "Hace 2 horas", "Ayer", "Hace 3 días"
 * @param dateString - Fecha en formato ISO
 * @returns Texto formateado
 */
export function formatNotificationDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    // Si es más antiguo, mostrar la fecha
    return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
    });
}

/**
 * Devuelve las preferencias de notificación por defecto
 */
export function getDefaultPreferences(): NotificationPreferences {
    return {
        stockAlerts: true,
        debtAlerts: true,
        saleUpdates: false,
        systemMessages: true,
        pushEnabled: false, // Se activa cuando el usuario lo permita
    };
}

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
// 
// Este archivo define TODO sobre las notificaciones:
// 
// 1. TIPOS:
//    - stock_alert: "¡El producto X tiene solo 2 unidades!"
//    - debt_alert:  "Juan Pérez tiene $50.000 vencidos"
//    - invitation:  "Te invitaron como Admin de Tienda A"
//    - sale_update: "Juan pagó $30.000 de su deuda"
//    - system:      "Nueva actualización disponible"
// 
// 2. PRIORIDADES:
//    - high (rojo):    Stock en 0, deuda muy vencida
//    - medium (amarillo): Stock bajo, deuda próxima a vencer
//    - low (azul):     Nuevas ventas, mensajes del sistema
// 
// 3. FUNCIONES:
//    - Colores según prioridad
//    - Íconos según tipo
//    - Fechas relativas ("Hace 5 minutos")
// ============================================