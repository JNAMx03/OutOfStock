// src/services/alerts.service.ts
// 📌 SERVICIO DE ALERTAS - Detecta condiciones que requieren notificación
// Este archivo revisa el inventario y las ventas para generar alertas automáticas

import { useNotificationsStore } from '@/stores/notifications';
import { useInventoryStore } from '@/stores/inventory';
import { useSalesStore } from '@/stores/sales';
import { useStoresStore } from '@/stores/stores';

// ============================================
// SERVICIO DE ALERTAS
// ============================================

export const alertsService = {
    /**
     * 📦 VERIFICAR STOCK BAJO
     * Revisa todos los productos de una tienda y genera alertas
     * si alguno está por debajo de su nivel mínimo
     *
     * @param storeId - ID de la tienda a revisar
     */
    checkLowStock(storeId: string): void {
        const notificationsStore = useNotificationsStore();
        const inventoryStore = useInventoryStore();
        const storesStore = useStoresStore();

        // Verifica que el usuario quiere recibir estas alertas
        if (!notificationsStore.preferences.lowStockAlerts &&
            !notificationsStore.preferences.outOfStockAlerts) {
        return;
        }

        // Obtiene la tienda para mostrar su nombre en la notificación
        const store = storesStore.stores.find((s) => s.id === storeId);
        const storeName = store?.name || 'Tu tienda';

        // Obtiene los productos de esta tienda
        const products = inventoryStore.products.filter(
            (p) => p.storeId === storeId && p.isActive
        );

        products.forEach((product) => {
            // ====================================
            // CASO 1: PRODUCTO SIN STOCK (0 unidades)
            // ====================================
            if (
                product.stock === 0 &&
                notificationsStore.preferences.outOfStockAlerts &&
                !notificationsStore.isDuplicate('out_of_stock', product.id, storeId)
            ) {
                notificationsStore.addNotification({
                    type: 'out_of_stock',
                    priority: 'high',                         // 🔴 Prioridad alta
                    title: '¡Producto agotado!',
                    message: `"${product.name}" se quedó sin stock en ${storeName}. Debes reabastecer lo antes posible.`,
                    icon: 'alert-circle',
                    relatedId: product.id,
                    relatedType: 'product',
                    storeId,
                    storeName,
                });
            }

            // ====================================
            // CASO 2: STOCK POR DEBAJO DEL MÍNIMO
            // ====================================
            else if (
                product.stock > 0 &&
                product.minStock !== undefined &&
                product.stock <= product.minStock &&
                notificationsStore.preferences.lowStockAlerts &&
                !notificationsStore.isDuplicate('low_stock', product.id, storeId)
            ) {
                notificationsStore.addNotification({
                    type: 'low_stock',
                    priority: 'medium',                        // 🟡 Prioridad media
                    title: 'Stock bajo',
                    message: `"${product.name}" tiene solo ${product.stock} unidades en ${storeName}. El mínimo recomendado es ${product.minStock}.`,
                    icon: 'warning',
                    relatedId: product.id,
                    relatedType: 'product',
                    storeId,
                    storeName,
                });
            }
        });
    },

    /**
     * 💰 VERIFICAR DEUDAS PRÓXIMAS A VENCER O VENCIDAS
     * Revisa las ventas a crédito de una tienda y genera alertas
     * para deudas que están por vencer o que ya vencieron
     *
     * @param storeId - ID de la tienda a revisar
     */
    checkPendingDebts(storeId: string): void {
        const notificationsStore = useNotificationsStore();
        const salesStore = useSalesStore();
        const storesStore = useStoresStore();

        // Verifica que el usuario quiere recibir estas alertas
        if (!notificationsStore.preferences.debtReminders &&
            !notificationsStore.preferences.debtOverdueAlerts) {
            return;
        }

        const store = storesStore.stores.find((s) => s.id === storeId);
        const storeName = store?.name || 'Tu tienda';

        // Días de anticipación para alertar (configurable en preferencias)
        const reminderDays = notificationsStore.preferences.debtReminderDays;

        const now = new Date();

        // Obtiene ventas a crédito pendientes de esta tienda
        const pendingSales = salesStore.sales.filter(
            (s) =>
                s.storeId === storeId &&
                s.paymentMethod === 'credit' &&
                s.status === 'pending' &&
                s.clientInfo?.name // Solo si hay info del cliente
        );

        pendingSales.forEach((sale) => {
        // Si la venta tiene fecha de vencimiento
        if (sale.dueDate) {
            const dueDate = new Date(sale.dueDate);
            const daysUntilDue = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            // ====================================
            // CASO 1: DEUDA VENCIDA (pasó la fecha límite)
            // ====================================
            if (
                daysUntilDue < 0 &&
                notificationsStore.preferences.debtOverdueAlerts &&
                !notificationsStore.isDuplicate('debt_overdue', sale.id, storeId)
            ) {
                notificationsStore.addNotification({
                    type: 'debt_overdue',
                    priority: 'high',                       // 🔴 Prioridad alta
                    title: 'Deuda vencida',
                    message: `${sale.clientInfo!.name} tiene una deuda de $${sale.totalAmount.toLocaleString()} que venció hace ${Math.abs(daysUntilDue)} día(s) en ${storeName}.`,
                    icon: 'alert-circle-outline',
                    relatedId: sale.id,
                    relatedType: 'sale',
                    storeId,
                    storeName,
                });
            }

            // ====================================
            // CASO 2: DEUDA PRÓXIMA A VENCER
            // ====================================
            else if (
                daysUntilDue >= 0 &&
                daysUntilDue <= reminderDays &&
                notificationsStore.preferences.debtReminders &&
                !notificationsStore.isDuplicate('debt_reminder', sale.id, storeId)
            ) {
                const dueText = daysUntilDue === 0
                    ? 'hoy'
                    : daysUntilDue === 1
                    ? 'mañana'
                    : `en ${daysUntilDue} días`;

                notificationsStore.addNotification({
                    type: 'debt_reminder',
                    priority: 'medium',                     // 🟡 Prioridad media
                    title: 'Deuda por vencer',
                    message: `${sale.clientInfo!.name} tiene una deuda de $${sale.totalAmount.toLocaleString()} que vence ${dueText} en ${storeName}.`,
                    icon: 'time-outline',
                    relatedId: sale.id,
                    relatedType: 'sale',
                    storeId,
                    storeName,
                });
            }
        } else {
            // ====================================
            // CASO 3: DEUDA SIN FECHA (lleva más de 7 días)
            // ====================================
            const daysSinceSale = Math.ceil(
                (now.getTime() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            if (
                daysSinceSale >= 7 &&
                notificationsStore.preferences.debtReminders &&
                !notificationsStore.isDuplicate('debt_reminder', sale.id, storeId)
            ) {
                notificationsStore.addNotification({
                    type: 'debt_reminder',
                    priority: 'medium',
                    title: 'Deuda pendiente',
                    message: `${sale.clientInfo!.name} tiene una deuda de $${sale.totalAmount.toLocaleString()} sin pagar desde hace ${daysSinceSale} días en ${storeName}.`,
                    icon: 'cash-outline',
                    relatedId: sale.id,
                    relatedType: 'sale',
                    storeId,
                    storeName,
                });
            }
        }
        });
    },

    /**
     * 🔄 VERIFICAR TODAS LAS ALERTAS DE UNA TIENDA
     * Ejecuta todos los checks al mismo tiempo
     * Se llama cuando la app carga o cuando el usuario cambia de tienda
     *
     * @param storeId - ID de la tienda a revisar
     */
    runAllChecks(storeId: string): void {
        this.checkLowStock(storeId);
        this.checkPendingDebts(storeId);
    },

    /**
     * 📨 CREAR NOTIFICACIÓN DE INVITACIÓN
     * Se llama cuando alguien invita a un usuario a una tienda
     *
     * @param storeId - ID de la tienda
     * @param storeName - Nombre de la tienda
     * @param invitedByName - Nombre de quien invita
     * @param role - Rol asignado ('admin' | 'seller')
     */
    createInvitationNotification(
        storeId: string,
        storeName: string,
        invitedByName: string,
        role: 'admin' | 'seller'
    ): void {
        const notificationsStore = useNotificationsStore();

        if (!notificationsStore.preferences.invitations) return;

        const roleText = role === 'admin' ? 'Administrador' : 'Vendedor';

        notificationsStore.addNotification({
            type: 'invitation',
            priority: 'low',                              // 🔵 Prioridad baja
            title: 'Nueva invitación',
            message: `${invitedByName} te invitó como ${roleText} a la tienda "${storeName}". ¡Acepta la invitación para empezar!`,
            icon: 'mail-open-outline',
            relatedId: storeId,
            relatedType: 'store',
            storeId,
            storeName,
        });
    },
};