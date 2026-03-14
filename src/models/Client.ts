// 📌 MODELO DE CLIENTE - Define la estructura del módulo de cartera

// ============================================
// INTERFACES
// ============================================

/**
 * Cliente derivado de las ventas.
 * No se almacena por separado — se construye a partir
 * de las ventas que tienen clientInfo.
 */
export interface Client {
    // Identificador único: usamos el teléfono como llave
    // (si no tiene teléfono, usamos el nombre normalizado)
    id: string;

    // Datos del cliente (vienen de clientInfo en Sale)
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;

    // Métricas calculadas
    totalPurchases: number;        // Total comprado (suma de todos sus totalAmount)
    totalPaid: number;             // Total pagado hasta ahora
    totalDebt: number;             // Deuda pendiente actual
    salesCount: number;            // Número de ventas realizadas
    lastPurchaseDate: string;      // Fecha de la última compra

    // IDs de las ventas de este cliente (para navegar al detalle)
    saleIds: string[];
}

/**
 * Filtros para la lista de clientes
 */
export type ClientFilter = 'all' | 'debtors' | 'frequent';

/**
 * Opciones de orden para la lista
 */
export type ClientSortBy = 'name' | 'debt' | 'purchases' | 'lastPurchase';

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Genera un ID único para un cliente
 * Usa el teléfono si existe, o el nombre normalizado
 */
export function generateClientId(name: string, phone?: string): string {
    if (phone) {
        // Limpiar el teléfono (solo dígitos)
        return `client-phone-${phone.replace(/\D/g, '')}`;
    }
    // Normalizar el nombre (minúsculas, sin espacios extra, sin acentos)
    const normalized = name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');
    return `client-name-${normalized}`;
}

/**
 * Determina si un cliente es "frecuente"
 * Criterio: 3 o más compras
 */
export function isFrequentClient(client: Client): boolean {
    return client.salesCount >= 3;
}

/**
 * Determina si un cliente tiene deuda activa
 */
export function hasActiveDebt(client: Client): boolean {
    return client.totalDebt > 0;
}

/**
 * Formatea la deuda para mostrar
 */
export function formatDebt(amount: number): string {
    if (amount <= 0) return 'Al día ✓';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
    return `$${amount.toLocaleString('es-CO')}`;
}