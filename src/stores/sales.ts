// 📌 STORE DE VENTAS - Maneja todas las ventas de la tienda

// ============================================
// IMPORTS
// ============================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
    Sale, 
    CreateSaleData, 
    UpdateSaleData,
    AddPaymentData,
    SaleFilters 
} from '@/models/Sale';
import { 
    calculateSaleTotal,
    calculateSaleProfit,
    generateSaleNumber,
    hasPendingDebt 
} from '@/models/Sale';
import { useProductsStore } from './products';
import { useNotificationsStore } from '@/stores/notifications';

// ============================================
// STORE DE VENTAS
// ============================================

export const useSalesStore = defineStore('sales', () => {
    // ============================================
    // ESTADO (State)
    // ============================================
    
    // Lista de todas las ventas
    const sales = ref<Sale[]>([]);
    
    // Filtros activos
    const activeFilters = ref<SaleFilters>({});
    
    // Estado de carga
    const isLoading = ref(false);

    // ============================================
    // GETTERS (Computed)
    // ============================================
    
    /**
     * Obtiene ventas de una tienda específica
     */
    const getSalesByStore = computed(() => (storeId: string) => {
        return sales.value.filter(s => s.storeId === storeId);
    });
    
    /**
     * Obtiene ventas completadas (pagadas)
     */
    const completedSales = computed(() => 
        sales.value.filter(s => s.status === 'completed')
    );
    
    /**
     * Obtiene ventas pendientes (con deuda)
     */
    const pendingSales = computed(() => 
        sales.value.filter(s => hasPendingDebt(s))
    );
    
    /**
     * Total de ventas del día
     */
    const todaySalesTotal = computed(() => {
        const today = new Date().toDateString();
        return sales.value
        .filter(s => new Date(s.createdAt).toDateString() === today)
        .reduce((total, s) => total + s.total, 0);
    });
    
    /**
     * Total de ventas del mes
     */
    const monthSalesTotal = computed(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return sales.value
        .filter(s => {
            const saleDate = new Date(s.createdAt);
            return saleDate.getMonth() === currentMonth && 
                saleDate.getFullYear() === currentYear;
        })
        .reduce((total, s) => total + s.total, 0);
    });
    
    /**
     * Ganancia total del día
     */
    const todayProfit = computed(() => {
        const today = new Date().toDateString();
        return sales.value
        .filter(s => new Date(s.createdAt).toDateString() === today)
        .reduce((total, s) => total + (s.profit || 0), 0);
    });
    
    /**
     * Total de deudas pendientes
     */
    const totalPendingDebt = computed(() => {
        return sales.value
        .filter(s => hasPendingDebt(s))
        .reduce((total, s) => total + s.amountDue, 0);
    });
    
    /**
     * Ventas filtradas según filtros activos
     */
    const filteredSales = computed(() => {
        let result = [...sales.value];
        
        // Filtrar por búsqueda
        if (activeFilters.value.search) {
            const search = activeFilters.value.search.toLowerCase();
            result = result.filter(s => 
                s.saleNumber.toLowerCase().includes(search) ||
                s.customer?.name.toLowerCase().includes(search)
            );
        }
        
        // Filtrar por estado
        if (activeFilters.value.status) {
            result = result.filter(s => s.status === activeFilters.value.status);
        }
        
        // Filtrar por método de pago
        if (activeFilters.value.paymentMethod) {
            result = result.filter(s => s.paymentMethod === activeFilters.value.paymentMethod);
        }
        
        // Filtrar por rango de fechas
        if (activeFilters.value.dateFrom) {
            const from = new Date(activeFilters.value.dateFrom);
            result = result.filter(s => new Date(s.createdAt) >= from);
        }
        
        if (activeFilters.value.dateTo) {
            const to = new Date(activeFilters.value.dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(s => new Date(s.createdAt) <= to);
        }
        
        // Ordenar
        if (activeFilters.value.sortBy) {
            result.sort((a, b) => {
                const order = activeFilters.value.sortOrder === 'desc' ? -1 : 1;
                
                switch (activeFilters.value.sortBy) {
                case 'date':
                    return order * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                case 'total':
                    return order * (a.total - b.total);
                case 'customer':
                    return order * (a.customer?.name || '').localeCompare(b.customer?.name || '');
                default:
                    return 0;
                }
            });
        } else {
            // Por defecto, ordenar por fecha descendente (más reciente primero)
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        
        return result;
    });

    // ============================================
    // ACCIONES (Actions)
    // ============================================
    
    /**
     * 📋 FETCH SALES - Obtiene ventas de una tienda
     */
    async function fetchSales(storeId: string) {
        isLoading.value = true;
        
        try {
            console.log('📋 Cargando ventas de la tienda:', storeId);
            
            // TODO: Obtener desde DynamoDB/AppSync
            // Por ahora, mantener ventas en memoria
            
            // Solo cargar si no hay ventas para esta tienda
            const storeSales = sales.value.filter(s => s.storeId === storeId);
            
            if (storeSales.length === 0) {
                console.log('No hay ventas mock para cargar');
            }
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error al cargar ventas:', error);
            return { success: false, error: 'Error al cargar ventas' };
        } finally {
            isLoading.value = false;
        }
    }
    
    /**
     * ➕ CREATE SALE - Crea una nueva venta
     */
    async function createSale(
        data: CreateSaleData,
        storeId: string,
        userId: string
    ) {
        isLoading.value = true;
        
        try {
        console.log('➕ Creando venta...');
            
            // Calcular subtotal
            const subtotal = data.items.reduce((total, item) => total + item.subtotal, 0);
            
            // Calcular total
            const total = calculateSaleTotal(subtotal, 0, data.discount || 0);
            
            // Determinar estado según el pago
            let status: 'completed' | 'pending' | 'partial';
            if (data.amountPaid >= total) {
                status = 'completed';
            } else if (data.amountPaid > 0) {
                status = 'partial';
            } else {
                status = 'pending';
            }
            
            // Generar número de venta
            const lastSale = sales.value
                .filter(s => s.storeId === storeId)
                .sort((a, b) => b.saleNumber.localeCompare(a.saleNumber))[0];
            const saleNumber = lastSale ? generateSaleNumber(lastSale.saleNumber) : 'V-0001';
            
            const newSale: Sale = {
                id: `sale-${Date.now()}`,
                storeId,
                saleNumber,
                items: data.items,
                subtotal,
                discount: data.discount,
                total,
                customer: data.customer,
                paymentMethod: data.paymentMethod,
                payments: data.amountPaid > 0 ? [{
                    method: data.paymentMethod,
                    amount: data.amountPaid,
                    date: new Date().toISOString(),
                }] : [],
                amountPaid: data.amountPaid,
                amountDue: total - data.amountPaid,
                status,
                notes: data.notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: userId,
                profit: calculateSaleProfit(data.items),
            };
            
            // TODO: Guardar en DynamoDB
            await new Promise(resolve => setTimeout(resolve, 500));
            
            sales.value.push(newSale);
            
            // Actualizar stock de productos
            const productsStore = useProductsStore();
            for (const item of data.items) {
                await productsStore.updateStock(item.productId, item.quantity, 'subtract');
            }
            
            console.log('✅ Venta creada exitosamente:', saleNumber);
            return { success: true, sale: newSale };
        } catch (error) {
            console.error('❌ Error al crear venta:', error);
            return { success: false, error: 'Error al crear venta' };
        } finally {
            isLoading.value = false;
        }
    }
    
    /**
     * ✏️ UPDATE SALE - Actualiza una venta
     */
    async function updateSale(saleId: string, data: UpdateSaleData) {
        isLoading.value = true;
        
        try {
            const index = sales.value.findIndex(s => s.id === saleId);
            
            if (index === -1) {
                throw new Error('Venta no encontrada');
            }
            
            const updatedSale: Sale = {
                ...sales.value[index],
                ...data,
                updatedAt: new Date().toISOString(),
            };
            
            // TODO: Actualizar en DynamoDB
            await new Promise(resolve => setTimeout(resolve, 500));
            
            sales.value[index] = updatedSale;
            
            console.log('✅ Venta actualizada exitosamente');
            return { success: true, sale: updatedSale };
        } catch (error: any) {
            console.error('❌ Error al actualizar venta:', error);
            return { success: false, error: error.message || 'Error al actualizar venta' };
        } finally {
            isLoading.value = false;
        }
    }
    
    /**
     * 💰 ADD PAYMENT - Agrega un pago a una venta (abono)
     */
    async function addPayment(saleId: string, data: AddPaymentData) {
        isLoading.value = true;
        
        try {
            const index = sales.value.findIndex(s => s.id === saleId);
            
            if (index === -1) {
                throw new Error('Venta no encontrada');
            }
            
            const sale = sales.value[index];
            
            // Verificar que no se pague más de lo debido
            if (data.amount > sale.amountDue) {
                throw new Error('El monto excede la deuda pendiente');
            }
            
            // Agregar pago al historial
            const newPayment = {
                method: data.method,
                amount: data.amount,
                reference: data.reference,
                date: new Date().toISOString(),
            };
            
            const updatedPayments = [...sale.payments, newPayment];
            const newAmountPaid = sale.amountPaid + data.amount;
            const newAmountDue = sale.total - newAmountPaid;
            
            // Actualizar estado
            let newStatus = sale.status;
            if (newAmountDue === 0) {
                newStatus = 'completed';
            } else if (newAmountPaid > 0) {
                newStatus = 'partial';
            }
            
            const updatedSale: Sale = {
                ...sale,
                payments: updatedPayments,
                amountPaid: newAmountPaid,
                amountDue: newAmountDue,
                status: newStatus,
                updatedAt: new Date().toISOString(),
            };
            
            // TODO: Actualizar en DynamoDB
            await new Promise(resolve => setTimeout(resolve, 500));
            
            sales.value[index] = updatedSale;
            
            console.log('✅ Pago registrado exitosamente');
            return { success: true, sale: updatedSale };
        } catch (error: any) {
            console.error('❌ Error al registrar pago:', error);
            return { success: false, error: error.message || 'Error al registrar pago' };
        } finally {
            isLoading.value = false;
        }
    }
    
    /**
     * 🗑️ CANCEL SALE - Cancela una venta
     */
    async function cancelSale(saleId: string) {
        isLoading.value = true;
        
        try {
            const index = sales.value.findIndex(s => s.id === saleId);
            
            if (index === -1) {
                throw new Error('Venta no encontrada');
            }
            
            const sale = sales.value[index];
            
            // Restaurar stock de productos
            const productsStore = useProductsStore();
            for (const item of sale.items) {
                await productsStore.updateStock(item.productId, item.quantity, 'add');
            }
            
            // Marcar como cancelada
            await updateSale(saleId, { status: 'cancelled' });
            
            console.log('✅ Venta cancelada');
            return { success: true };
        } catch (error: any) {
            console.error('❌ Error al cancelar venta:', error);
            return { success: false, error: error.message || 'Error al cancelar venta' };
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 💰 CHECK DEBTS - Verifica deudas vencidas y crea alertas
     * Se llama al cargar el módulo de ventas o cartera
     * @param storeId - ID de la tienda
     * @param storeName - Nombre de la tienda
     */
    async function checkAndAlertDebts(storeId: string, storeName: string) {
        const notificationsStore = useNotificationsStore();
        
        // Filtrar ventas con deuda pendiente
        const pendingSales = sales.value.filter(sale =>
            sale.storeId === storeId &&
            (sale.status === 'pending' || sale.status === 'partial')
        );
        
        const today = new Date();
        
        for (const sale of pendingSales) {
            // Calcular monto pendiente
            const pendingAmount = sale.total - (sale.amountPaid || 0);
            
            // Calcular días desde la venta
            const saleDate = new Date(sale.createdAt);
            const diffDays = Math.floor(
            (today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // Alertar si la deuda tiene más de 3 días sin pagar
            if (diffDays >= 3 && pendingAmount > 0) {
                await notificationsStore.createDebtAlert(storeId, storeName, {
                    saleId: sale.id,
                    saleNumber: sale.saleNumber,
                    clientName: sale.customer?.name || 'Cliente',
                    clientPhone: sale.customer?.phone,
                    debtAmount: pendingAmount,
                    daysOverdue: diffDays,
                });
            }
        }
    }
    
    /**
     * 🔍 SET FILTERS - Establece filtros de búsqueda
     */
    function setFilters(filters: SaleFilters) {
        activeFilters.value = filters;
    }
    
    /**
     * 🧹 CLEAR FILTERS - Limpia todos los filtros
     */
    function clearFilters() {
        activeFilters.value = {};
    }
    
    /**
     * 🔍 GET SALE BY ID - Obtiene una venta específica
     */
    function getSaleById(saleId: string): Sale | null {
        return sales.value.find(s => s.id === saleId) || null;
    }
    
    /**
     * 🧹 CLEAR - Limpia todos los datos
     */
    function clear() {
        sales.value = [];
        activeFilters.value = {};
    }

    // ============================================
    // RETORNAR
    // ============================================
    return {
        // Estado
        sales,
        activeFilters,
        isLoading,
        
        // Getters
        getSalesByStore,
        completedSales,
        pendingSales,
        todaySalesTotal,
        monthSalesTotal,
        todayProfit,
        totalPendingDebt,
        filteredSales,
        
        // Acciones
        fetchSales,
        createSale,
        updateSale,
        addPayment,
        cancelSale,
        setFilters,
        clearFilters,
        getSaleById,
        clear,
        checkAndAlertDebts,
    };
});

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
// 
// Este store maneja TODAS las ventas de la tienda.
// 
// Funcionalidades principales:
// 
// 1. ALMACENA:
//    - Lista de ventas
//    - Filtros activos
// 
// 2. PERMITE:
//    - Crear ventas nuevas
//    - Actualizar ventas
//    - Agregar pagos (abonos)
//    - Cancelar ventas
//    - Buscar y filtrar
// 
// 3. CALCULA:
//    - Total de ventas del día
//    - Total del mes
//    - Ganancia del día
//    - Deudas pendientes
//    - Estado de la venta (pagada, pendiente, parcial)
// 
// 4. AUTOMATIZA:
//    - Genera números de venta (V-0001, V-0002...)
//    - Actualiza el stock automáticamente
//    - Calcula totales y ganancias
//    - Maneja el estado según los pagos
// 
// 5. FILTRA:
//    - Por búsqueda (número o cliente)
//    - Por estado (pagada, pendiente, etc.)
//    - Por método de pago
//    - Por rango de fechas
//    - Ordenar por diferentes criterios
// 
// Los datos por ahora son locales (mock).
// En futuras fases conectaremos con DynamoDB.
// ============================================