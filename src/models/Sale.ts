// MODELO DE VENTA - Define la estructura de datos de una venta

// ============================================
// TIPOS Y ENUMS
// ============================================

/**
 * Métodos de pago disponibles
 */
export type PaymentMethod = 
    | 'cash'          // Efectivo
    | 'card'          // Tarjeta (débito/crédito)
    | 'transfer'      // Transferencia bancaria
    | 'credit'        // A crédito (deuda)
    | 'mixed';        // Pago mixto

/**
 * Estado de una venta
 */
export type SaleStatus = 
    | 'completed'     // Completada (pagada)
    | 'pending'       // Pendiente (a crédito)
    | 'partial'       // Pago parcial
    | 'cancelled';    // Cancelada

// ============================================
// INTERFACES
// ============================================

/**
 * Item individual en una venta
 */
export interface SaleItem {
    productId: string;            // ID del producto
    productName: string;          // Nombre del producto (snapshot)
    quantity: number;             // Cantidad vendida
    unitPrice: number;            // Precio unitario al momento de la venta
    subtotal: number;             // quantity * unitPrice
    purchasePrice: number;        // Costo del producto (para calcular ganancia)
}

/**
 * Información del cliente
 */
export interface SaleCustomer {
    name: string;                 // Nombre del cliente
    phone?: string;               // Teléfono
    email?: string;               // Email
    address?: string;             // Dirección
}

/**
 * Información de pago
 */
export interface SalePayment {
    method: PaymentMethod;        // Método de pago
    amount: number;               // Monto pagado
    reference?: string;           // Referencia de pago (para transferencias)
    date: string;                 // Fecha del pago
}

/**
 * Interfaz principal de Venta
 */
export interface Sale {
    // Identificación
    id: string;                   // ID único de la venta
    storeId: string;              // ID de la tienda
    saleNumber: string;           // Número de venta (ej: V-0001)
    
    // Items
    items: SaleItem[];            // Productos vendidos
    
    // Totales
    subtotal: number;             // Suma de subtotales de items
    tax?: number;                 // Impuestos (opcional)
    discount?: number;            // Descuento aplicado (opcional)
    total: number;                // Total a pagar
    
    // Cliente
    customer?: SaleCustomer;      // Información del cliente (opcional)
    
    // Pago
    paymentMethod: PaymentMethod; // Método de pago principal
    payments: SalePayment[];      // Historial de pagos
    amountPaid: number;           // Total pagado hasta ahora
    amountDue: number;            // Monto pendiente (deuda)
    
    // Estado
    status: SaleStatus;           // Estado de la venta
    
    // Notas
    notes?: string;               // Notas adicionales
    
    // Metadatos
    createdAt: string;            // Fecha de creación
    updatedAt: string;            // Fecha de actualización
    createdBy: string;            // ID del usuario que registró la venta
    
    // Estadísticas calculadas
    profit?: number;              // Ganancia total (se calcula)
}

/**
 * Datos para crear una nueva venta
 */
export interface CreateSaleData {
    items: SaleItem[];
    customer?: SaleCustomer;
    paymentMethod: PaymentMethod;
    amountPaid: number;           // Cuánto paga el cliente ahora
    discount?: number;
    notes?: string;
}

/**
 * Datos para actualizar una venta
 */
export interface UpdateSaleData {
    customer?: SaleCustomer;
    status?: SaleStatus;
    notes?: string;
}

/**
 * Datos para registrar un pago adicional (abono)
 */
export interface AddPaymentData {
    method: PaymentMethod;
    amount: number;
    reference?: string;
}

/**
 * Filtros para buscar ventas
 */
export interface SaleFilters {
    search?: string;              // Búsqueda por número o cliente
    status?: SaleStatus;          // Filtrar por estado
    paymentMethod?: PaymentMethod; // Filtrar por método de pago
    dateFrom?: string;            // Desde fecha
    dateTo?: string;              // Hasta fecha
    customerId?: string;          // Filtrar por cliente
    sortBy?: 'date' | 'total' | 'customer'; // Ordenar por
    sortOrder?: 'asc' | 'desc';   // Orden
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Calcula el subtotal de un item
 */
export function calculateItemSubtotal(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
}

/**
 * Calcula el total de la venta
 */
export function calculateSaleTotal(
    subtotal: number,
    tax: number = 0,
    discount: number = 0
): number {
    return subtotal + tax - discount;
}

/**
 * Calcula la ganancia de un item
 */
export function calculateItemProfit(
    quantity: number,
    salePrice: number,
    purchasePrice: number
): number {
    return quantity * (salePrice - purchasePrice);
}

/**
 * Calcula la ganancia total de una venta
 */
export function calculateSaleProfit(items: SaleItem[]): number {
    return items.reduce((total, item) => {
        return total + calculateItemProfit(item.quantity, item.unitPrice, item.purchasePrice);
    }, 0);
}

/**
 * Verifica si una venta está pagada completamente
 */
export function isSalePaid(sale: Sale): boolean {
    return sale.amountDue === 0;
}

/**
 * Verifica si una venta tiene deuda pendiente
 */
export function hasPendingDebt(sale: Sale): boolean {
    return sale.amountDue > 0;
}

/**
 * Obtiene el nombre del método de pago
 */
export function getPaymentMethodName(method: PaymentMethod): string {
    const names: Record<PaymentMethod, string> = {
        cash: 'Efectivo',
        card: 'Tarjeta',
        transfer: 'Transferencia',
        credit: 'A Crédito',
        mixed: 'Pago Mixto',
    };
    return names[method];
}

/**
 * Obtiene el icono del método de pago
 */
export function getPaymentMethodIcon(method: PaymentMethod): string {
    const icons: Record<PaymentMethod, string> = {
        cash: 'cash-outline',
        card: 'card-outline',
        transfer: 'swap-horizontal-outline',
        credit: 'time-outline',
        mixed: 'albums-outline',
    };
    return icons[method];
}

/**
 * Obtiene el color del estado de la venta
 */
export function getSaleStatusColor(status: SaleStatus): string {
    const colors: Record<SaleStatus, string> = {
        completed: 'success',
        pending: 'warning',
        partial: 'secondary',
        cancelled: 'danger',
    };
    return colors[status];
}

/**
 * Obtiene el nombre del estado de la venta
 */
export function getSaleStatusName(status: SaleStatus): string {
    const names: Record<SaleStatus, string> = {
        completed: 'Pagada',
        pending: 'Pendiente',
        partial: 'Pago Parcial',
        cancelled: 'Cancelada',
    };
    return names[status];
}

/**
 * Genera el número de venta siguiente
 */
export function generateSaleNumber(lastNumber: string): string {
    // Extraer el número de V-0001 -> 1
    const match = lastNumber.match(/V-(\d+)/);
    if (match) {
        const num = parseInt(match[1]) + 1;
        return `V-${num.toString().padStart(4, '0')}`;
    }
    return 'V-0001';
}

/**
 * Formatea un precio con moneda
 */
export function formatPrice(price: number, currency: string = '$'): string {
    return `${currency}${price.toLocaleString('es-CO')}`;
}

/**
 * Valida los datos de una venta
 */
export function validateSaleData(data: CreateSaleData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar items
    if (!data.items || data.items.length === 0) {
        errors.push('Debe agregar al menos un producto');
    }
    
    // Validar cantidades
    data.items.forEach((item, index) => {
        if (item.quantity <= 0) {
            errors.push(`La cantidad del producto ${index + 1} debe ser mayor a 0`);
        }
        if (item.unitPrice < 0) {
            errors.push(`El precio del producto ${index + 1} no puede ser negativo`);
        }
    });
    
    // Validar monto pagado
    if (data.amountPaid < 0) {
        errors.push('El monto pagado no puede ser negativo');
    }
    
    // Si es a crédito, debe tener información del cliente
    if (data.paymentMethod === 'credit' && !data.customer) {
        errors.push('Para ventas a crédito debe registrar el cliente');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Crea un item de venta desde un producto
 */
export function createSaleItemFromProduct(
    product: any,
    quantity: number
): SaleItem {
    return {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.salePrice,
        subtotal: calculateItemSubtotal(quantity, product.salePrice),
        purchasePrice: product.purchasePrice,
    };
}
