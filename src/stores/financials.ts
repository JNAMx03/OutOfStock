// 📌 STORE FINANCIERO - Centraliza todas las métricas y estadísticas

// ============================================
// IMPORTS
// ============================================
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSalesStore } from '@/stores/sales';
// import { useProductsStore } from '@/stores/products';
import type { Sale } from '@/models/Sale';

// ============================================
// TIPOS PROPIOS DEL MÓDULO FINANCIERO
// ============================================

/**
 * Períodos de tiempo para filtrar las métricas
 */
export type FinancialPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

/**
 * Un punto de datos en una gráfica
 * Ejemplo: { label: 'Lun', revenue: 50000, profit: 15000, purchases: 35000 }
 */
export interface ChartDataPoint {
    label: string;       // Etiqueta del eje X (ej: "Lun", "Ene", "Semana 1")
    revenue: number;     // Ingresos (ventas cobradas)
    profit: number;      // Ganancia neta
    purchases: number;   // Costo de compras (purchasePrice × cantidad vendida)
    salesCount: number;  // Número de ventas
}

/**
 * Resumen de un método de pago
 */
export interface PaymentMethodSummary {
    method: string;       // Nombre del método
    total: number;        // Total recaudado
    count: number;        // Número de transacciones
    percentage: number;   // Porcentaje del total
}

/**
 * KPIs principales del período seleccionado
 */
export interface FinancialKPIs {
    totalRevenue: number;        // Ingresos totales (ventas completadas)
    totalProfit: number;         // Ganancia neta total
    totalPurchases: number;      // Costo total de lo vendido
    profitMargin: number;        // Margen de ganancia promedio (%)
    totalSales: number;          // Número de ventas
    averageTicket: number;       // Ticket promedio por venta
    pendingDebts: number;        // Total de deudas pendientes
    collectedDebts: number;      // Deudas cobradas en el período
}

// ============================================
// STORE FINANCIERO
// ============================================

export const useFinancialsStore = defineStore('financials', () => {

    // ============================================
    // ESTADO (State)
    // ============================================

    // Período activo seleccionado por el usuario
    const activePeriod = ref<FinancialPeriod>('month');

    // Rango de fechas personalizado (para período 'custom')
    const customStartDate = ref<string>('');
    const customEndDate = ref<string>('');

    // Estado de carga
    const isLoading = ref(false);

    // ============================================
    // REFERENCIAS A OTROS STORES
    // (se llaman dentro de computed para evitar
    //  problemas de orden de inicialización)
    // ============================================

    // ============================================
    // HELPERS PRIVADOS
    // ============================================

    /**
     * Obtiene el rango de fechas según el período activo
     * Devuelve { start, end } como objetos Date
     */
    function getDateRange(period: FinancialPeriod): { start: Date; end: Date } {
        const now = new Date();
        const end = new Date(now);
        end.setHours(23, 59, 59, 999); // Fin del día actual

        let start = new Date(now);

        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;

            case 'week':{
                // Inicio de la semana (lunes)
                const dayOfWeek = now.getDay(); // 0=Dom, 1=Lun...
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                start.setDate(now.getDate() - diffToMonday);
                start.setHours(0, 0, 0, 0);
                break;}

            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                start.setHours(0, 0, 0, 0);
                break;

            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                start.setHours(0, 0, 0, 0);
                break;

            case 'custom':
                return {
                    start: customStartDate.value
                        ? new Date(customStartDate.value)
                        : new Date(now.getFullYear(), now.getMonth(), 1),
                    end: customEndDate.value ? new Date(customEndDate.value) : end,
                };
        }

        return { start, end };
    }

    /**
     * Filtra ventas según el período activo
     * Excluye ventas canceladas
     */
    function getSalesForPeriod(
        allSales: Sale[],
        storeId: string,
        period: FinancialPeriod
    ): Sale[] {
        const { start, end } = getDateRange(period);

        return allSales.filter(sale => {
            if (sale.storeId !== storeId) return false;
            if (sale.status === 'cancelled') return false;

            const saleDate = new Date(sale.createdAt);
            return saleDate >= start && saleDate <= end;
        });
    }

    // ============================================
    // GETTERS (Computed) — MÉTRICAS PRINCIPALES
    // ============================================

    /**
     * KPIs del período activo para una tienda
     * Función generadora (se usa en la vista pasando el storeId)
     */
    function getKPIs(storeId: string): FinancialKPIs {
        const salesStore = useSalesStore();
        const sales = getSalesForPeriod(salesStore.sales, storeId, activePeriod.value);

        // Calcular ingresos (solo ventas completadas o parciales — dinero ya recibido)
        const totalRevenue = sales.reduce((sum, sale) => {
            // amountPaid = lo que ya pagaron (funciona para completed, partial y pending con abono)
            return sum + (sale.amountPaid || sale.total);
        }, 0);

        // Calcular ganancia neta total
        const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

        // Calcular costo total de las compras (lo que costó lo que vendimos)
        const totalPurchases = totalRevenue - totalProfit;

        // Margen de ganancia promedio
        const profitMargin = totalRevenue > 0
        ? Math.round((totalProfit / totalRevenue) * 100)
        : 0;

        // Número de ventas
        const totalSales = sales.length;

        // Ticket promedio
        const averageTicket = totalSales > 0
        ? Math.round(totalRevenue / totalSales)
        : 0;

        // Deudas pendientes (de TODAS las ventas, no solo del período)
        const allStoreSales = salesStore.sales.filter(s => s.storeId === storeId);
        const pendingDebts = allStoreSales.reduce((sum, sale) => {
            return sum + (sale.amountDue || 0);
        }, 0);

        // Deudas cobradas en el período (ventas que tenían deuda y ya pagaron)
        const collectedDebts = sales.reduce((sum, sale) => {
            if (sale.paymentMethod === 'credit' && sale.status === 'completed') {
                return sum + sale.total;
            }
            return sum;
        }, 0);

        return {
            totalRevenue,
            totalProfit,
            totalPurchases,
            profitMargin,
            totalSales,
            averageTicket,
            pendingDebts,
            collectedDebts,
        };
    }

    /**
     * Datos para la gráfica de ventas por período
     * Agrupa las ventas en puntos de tiempo (días, semanas, meses)
     */
    function getChartData(storeId: string): ChartDataPoint[] {
        const salesStore = useSalesStore();
        const sales = getSalesForPeriod(salesStore.sales, storeId, activePeriod.value);

        if (sales.length === 0) return [];

        const { start } = getDateRange(activePeriod.value);
        const now = new Date();
        const points: ChartDataPoint[] = [];

        if (activePeriod.value === 'today') {
            // Agrupar por hora (0-23)
            for (let hour = 0; hour <= now.getHours(); hour++) {
                const hourSales = sales.filter(sale => {
                    return new Date(sale.createdAt).getHours() === hour;
                });

                points.push({
                    label: `${hour.toString().padStart(2, '0')}h`,
                    revenue: hourSales.reduce((s, sale) => s + (sale.amountPaid || sale.total), 0),
                    profit: hourSales.reduce((s, sale) => s + (sale.profit || 0), 0),
                    purchases: hourSales.reduce((s, sale) => s + ((sale.amountPaid || sale.total) - (sale.profit || 0)), 0),
                    salesCount: hourSales.length,
                });
            }

        } else if (activePeriod.value === 'week') {
        // Agrupar por día de la semana
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            if (day > now) break;

            const daySales = sales.filter(sale => {
                const saleDate = new Date(sale.createdAt);
                return saleDate.toDateString() === day.toDateString();
            });

            points.push({
                label: dayNames[i],
                revenue: daySales.reduce((s, sale) => s + (sale.amountPaid || sale.total), 0),
                profit: daySales.reduce((s, sale) => s + (sale.profit || 0), 0),
                purchases: daySales.reduce((s, sale) => s + ((sale.amountPaid || sale.total) - (sale.profit || 0)), 0),
                salesCount: daySales.length,
            });
        }

        } else if (activePeriod.value === 'month') {
            // Agrupar por semana del mes
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const weeksCount = Math.ceil(daysInMonth / 7);

            for (let week = 0; week < weeksCount; week++) {
                const weekStart = new Date(start);
                weekStart.setDate(1 + week * 7);
                if (weekStart > now) break;

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                const weekSales = sales.filter(sale => {
                    const saleDate = new Date(sale.createdAt);
                    return saleDate >= weekStart && saleDate <= weekEnd;
                });

                points.push({
                    label: `Sem ${week + 1}`,
                    revenue: weekSales.reduce((s, sale) => s + (sale.amountPaid || sale.total), 0),
                    profit: weekSales.reduce((s, sale) => s + (sale.profit || 0), 0),
                    purchases: weekSales.reduce((s, sale) => s + ((sale.amountPaid || sale.total) - (sale.profit || 0)), 0),
                    salesCount: weekSales.length,
                });
            }

        } else if (activePeriod.value === 'year') {
            // Agrupar por mes
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            for (let month = 0; month <= now.getMonth(); month++) {
                const monthSales = sales.filter(sale => {
                    return new Date(sale.createdAt).getMonth() === month;
                });

                points.push({
                    label: monthNames[month],
                    revenue: monthSales.reduce((s, sale) => s + (sale.amountPaid || sale.total), 0),
                    profit: monthSales.reduce((s, sale) => s + (sale.profit || 0), 0),
                    purchases: monthSales.reduce((s, sale) => s + ((sale.amountPaid || sale.total) - (sale.profit || 0)), 0),
                    salesCount: monthSales.length,
                });
            }
        }

        return points;
    }

    /**
     * Resumen por método de pago
     * Para la gráfica de pastel
     */
    function getPaymentMethodSummary(storeId: string): PaymentMethodSummary[] {
        const salesStore = useSalesStore();
        const sales = getSalesForPeriod(salesStore.sales, storeId, activePeriod.value);

        // Acumular por método de pago
        const methodMap: Record<string, { total: number; count: number }> = {};

        sales.forEach(sale => {
            const method = sale.paymentMethod;
            if (!methodMap[method]) {
                methodMap[method] = { total: 0, count: 0 };
            }
            methodMap[method].total += sale.amountPaid || sale.total;
            methodMap[method].count++;
        });

        const grandTotal = Object.values(methodMap).reduce((s, m) => s + m.total, 0);

        // Nombres en español
        const methodNames: Record<string, string> = {
            cash: 'Efectivo',
            card: 'Tarjeta',
            transfer: 'Transferencia',
            credit: 'A Crédito',
            mixed: 'Mixto',
        };

        return Object.entries(methodMap).map(([method, data]) => ({
            method: methodNames[method] || method,
            total: data.total,
            count: data.count,
            percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0,
        })).sort((a, b) => b.total - a.total); // Ordenar de mayor a menor
    }

    /**
     * Top productos más vendidos del período
     */
    function getTopProducts(storeId: string, limit: number = 5): Array<{
        productId: string;
        productName: string;
        totalQuantity: number;
        totalRevenue: number;
        totalProfit: number;
    }> {
        const salesStore = useSalesStore();
        const sales = getSalesForPeriod(salesStore.sales, storeId, activePeriod.value);

        // Acumular por producto
        const productMap: Record<string, {
            productName: string;
            totalQuantity: number;
            totalRevenue: number;
            totalProfit: number;
        }> = {};

        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!productMap[item.productId]) {
                    productMap[item.productId] = {
                        productName: item.productName,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        totalProfit: 0,
                    };
                }
                productMap[item.productId].totalQuantity += item.quantity;
                productMap[item.productId].totalRevenue += item.subtotal;
                productMap[item.productId].totalProfit +=
                item.quantity * (item.unitPrice - item.purchasePrice);
            });
        });

        return Object.entries(productMap)
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);
    }

    // ============================================
    // ACCIONES (Actions)
    // ============================================

    /**
     * 🔄 SET PERIOD - Cambia el período activo
     */
    function setPeriod(period: FinancialPeriod) {
        activePeriod.value = period;
    }

    /**
     * 📅 SET CUSTOM RANGE - Establece un rango personalizado
     */
    function setCustomRange(start: string, end: string) {
        customStartDate.value = start;
        customEndDate.value = end;
        activePeriod.value = 'custom';
    }

    /**
     * 🧹 CLEAR - Limpia el store (al logout)
     */
    function clear() {
        activePeriod.value = 'month';
        customStartDate.value = '';
        customEndDate.value = '';
    }

    // ============================================
    // RETORNAR
    // ============================================
    return {
        // Estado
        activePeriod,
        customStartDate,
        customEndDate,
        isLoading,

        // Funciones calculadoras
        getKPIs,
        getChartData,
        getPaymentMethodSummary,
        getTopProducts,

        // Acciones
        setPeriod,
        setCustomRange,
        clear,
    };
});

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
//
// Este store es el "cerebro financiero" de la app.
//
// NO guarda datos propios — toma los datos del
// store de ventas y los transforma en métricas.
//
// CALCULA:
//  • KPIs: ingresos, ganancia, margen, ticket promedio
//  • Gráficas: puntos de datos por hora/día/semana/mes
//  • Métodos de pago: distribución porcentual
//  • Top productos: los más vendidos
//
// PERÍODOS disponibles:
//  • Hoy / Esta semana / Este mes / Este año / Personalizado
//
// ============================================