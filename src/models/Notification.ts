// 📌 MODELO DE NOTIFICACIÓN - Define la estructura de una notificación en la app

// ============================================
// TIPOS Y ENUMS
// ============================================

/**
 * Tipos de notificaciones que puede generar el sistema
 *
 * - low_stock:       Stock de un producto por debajo del mínimo
 * - out_of_stock:    Producto sin existencias
 * - debt_reminder:   Recordatorio de deuda pendiente de un cliente
 * - debt_overdue:    Deuda vencida (pasó la fecha límite)
 * - invitation:      Invitación para unirse a una tienda como admin o vendedor
 * - sale_completed:  Confirmación de venta registrada (para admins)
 * - system:          Mensaje general del sistema
 */
export type NotificationType =
  | 'low_stock'
  | 'out_of_stock'
  | 'debt_reminder'
  | 'debt_overdue'
  | 'invitation'
  | 'sale_completed'
  | 'system';

/**
 * Prioridad de la notificación (afecta el color e icono visual)
 *
 * - high:   Rojo  → Stock agotado, deuda vencida
 * - medium: Amarillo → Stock bajo, deuda próxima a vencer
 * - low:    Azul  → Información general
 */
export type NotificationPriority = 'high' | 'medium' | 'low';

/**
 * Estado de la notificación
 *
 * - unread:    Nueva, aún no vista por el usuario
 * - read:      Ya fue vista/leída
 * - dismissed: El usuario la descartó manualmente
 */
export type NotificationStatus = 'unread' | 'read' | 'dismissed';

// ============================================
// INTERFAZ PRINCIPAL
// ============================================

/**
 * Estructura completa de una Notificación
 */
export interface Notification {
  id: string;                    // ID único de la notificación
  type: NotificationType;        // Tipo de alerta
  priority: NotificationPriority; // Nivel de urgencia
  status: NotificationStatus;    // ¿Ya fue leída?

  // Contenido visible
  title: string;                 // Título corto (ej: "Stock bajo")
  message: string;               // Descripción detallada
  icon: string;                  // Nombre del ícono de Ionic

  // Referencia al elemento relacionado (para navegar al hacer clic)
  relatedId?: string;            // ID del producto, cliente o venta
  relatedType?: 'product' | 'sale' | 'client' | 'store'; // Qué tipo de dato

  // Tienda a la que pertenece esta notificación
  storeId: string;
  storeName?: string;

  // Metadatos
  createdAt: string;             // Fecha de creación (ISO string)
  readAt?: string;               // Fecha en que se leyó
}

// ============================================
// INTERFAZ DE PREFERENCIAS
// ============================================

/**
 * Configuración de qué notificaciones quiere recibir el usuario
 */
export interface NotificationPreferences {
  lowStockAlerts: boolean;       // Alertas de stock bajo
  outOfStockAlerts: boolean;     // Alertas de stock agotado
  debtReminders: boolean;        // Recordatorios de deudas
  debtOverdueAlerts: boolean;    // Alertas de deudas vencidas
  saleConfirmations: boolean;    // Confirmaciones de ventas
  invitations: boolean;          // Invitaciones a tiendas

  // Umbral de días para alertar sobre deudas (ej: 3 = 3 días antes de vencer)
  debtReminderDays: number;
}

// ============================================
// VALORES POR DEFECTO
// ============================================

/**
 * Preferencias por defecto al crear un usuario nuevo
 */
export const defaultNotificationPreferences: NotificationPreferences = {
  lowStockAlerts: true,
  outOfStockAlerts: true,
  debtReminders: true,
  debtOverdueAlerts: true,
  saleConfirmations: false,      // Por defecto desactivadas (pueden ser muchas)
  invitations: true,
  debtReminderDays: 3,
};

// ============================================
// HELPERS DE TIPADO
// ============================================

/**
 * Datos mínimos para crear una notificación nueva
 * (sin los campos que se generan automáticamente como id y createdAt)
 */
export type CreateNotificationData = Omit<Notification, 'id' | 'createdAt' | 'status'>;