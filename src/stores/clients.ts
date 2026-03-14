// 📌 STORE DE CLIENTES - Deriva clientes de las ventas existentes

// ============================================
// IMPORTS
// ============================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSalesStore } from '@/stores/sales';
import type { Client, ClientFilter, ClientSortBy } from '@/models/Client';
import { generateClientId, hasActiveDebt, isFrequentClient } from '@/models/Client';

// ============================================
// STORE DE CLIENTES
// ============================================

export const useClientsStore = defineStore('clients', () => {

    // ============================================
    // ESTADO
    // ============================================

    // Filtro activo en la lista
    const activeFilter = ref<ClientFilter>('all');

    // Criterio de orden
    const sortBy = ref<ClientSortBy>('debt');

    // Texto de búsqueda
    const searchQuery = ref('');

    // ============================================
    // GETTERS (Computed)
    // ============================================

    /**
     * Construye la lista de clientes a partir de las ventas.
     * Agrupa ventas por clientId (teléfono o nombre).
     * Solo incluye ventas que tienen clientInfo.
     */
    const allClients = computed((): Client[] => {
        const salesStore = useSalesStore();

        // Acumulador: clientId → Client parcial
        const clientMap: Record<string, Client> = {};

        salesStore.sales.forEach(sale => {
            // Solo procesar ventas que tienen información del cliente
            if (!sale.customer?.name) return;
            // Excluir ventas canceladas
            if (sale.status === 'cancelled') return;

            const clientId = generateClientId(
                sale.customer.name,
                sale.customer.phone
            );

            if (!clientMap[clientId]) {
                // Primera vez que vemos este cliente → inicializar
                clientMap[clientId] = {
                id: clientId,
                name: sale.customer.name,
                phone: sale.customer.phone,
                email: sale.customer.email,
                address: sale.customer.address,
                totalPurchases: 0,
                totalPaid: 0,
                totalDebt: 0,
                salesCount: 0,
                lastPurchaseDate: sale.createdAt,
                saleIds: [],
                };
            }

            const client = clientMap[clientId];

            // Acumular métricas de esta venta
            client.totalPurchases += sale.total;
            client.totalPaid += sale.amountPaid || 0;
            client.totalDebt += sale.amountDue || 0;
            client.salesCount += 1;
            client.saleIds.push(sale.id);

            // Actualizar fecha de última compra (la más reciente)
            if (sale.createdAt > client.lastPurchaseDate) {
                client.lastPurchaseDate = sale.createdAt;
            }
        });

        return Object.values(clientMap);
    });

    /**
     * Lista de clientes filtrada y ordenada según las preferencias del usuario
     */
    const filteredClients = computed((): Client[] => {
        let result = [...allClients.value];

        // FILTRO POR TIPO
        switch (activeFilter.value) {
            case 'debtors':
                result = result.filter(c => hasActiveDebt(c));
                break;
            case 'frequent':
                result = result.filter(c => isFrequentClient(c));
                break;
            // 'all': sin filtro adicional
        }

        // FILTRO POR BÚSQUEDA (nombre o teléfono)
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.phone?.includes(q) ||
                c.email?.toLowerCase().includes(q)
            );
        }

        // ORDENAR
        result.sort((a, b) => {
            switch (sortBy.value) {
                case 'debt':
                return b.totalDebt - a.totalDebt; // Mayor deuda primero
                case 'purchases':
                return b.totalPurchases - a.totalPurchases; // Mayor comprador primero
                case 'lastPurchase':
                return new Date(b.lastPurchaseDate).getTime() -
                        new Date(a.lastPurchaseDate).getTime(); // Más reciente primero
                case 'name':
                return a.name.localeCompare(b.name, 'es'); // Alfabético
                default:
                return 0;
            }
        });

        return result;
    });

    /**
     * Solo los clientes con deuda activa, ordenados por monto descendente
     */
    const debtors = computed(() =>
        allClients.value
        .filter(c => hasActiveDebt(c))
        .sort((a, b) => b.totalDebt - a.totalDebt)
    );

    /**
     * Solo los clientes frecuentes (3+ compras)
     */
    const frequentClients = computed(() =>
        allClients.value
        .filter(c => isFrequentClient(c))
        .sort((a, b) => b.salesCount - a.salesCount)
    );

    /**
     * Suma total de deudas pendientes de todos los clientes
     */
    const totalPendingDebt = computed(() =>
        debtors.value.reduce((sum, c) => sum + c.totalDebt, 0)
    );

    /**
     * Número de clientes con deuda
     */
    const debtorsCount = computed(() => debtors.value.length);

    // ============================================
    // ACCIONES
    // ============================================

    /**
     * Obtiene un cliente por su ID
     */
    function getClientById(clientId: string): Client | null {
        return allClients.value.find(c => c.id === clientId) || null;
    }

    /**
     * Obtiene todas las ventas de un cliente específico
     */
    function getSalesByClient(clientId: string) {
        const salesStore = useSalesStore();
        const client = getClientById(clientId);
        if (!client) return [];

        return salesStore.sales
        .filter(s => client.saleIds.includes(s.id))
        .sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    /**
     * Cambia el filtro activo
     */
    function setFilter(filter: ClientFilter) {
        activeFilter.value = filter;
    }

    /**
     * Cambia el criterio de orden
     */
    function setSortBy(sort: ClientSortBy) {
        sortBy.value = sort;
    }

    /**
     * Establece la búsqueda
     */
    function setSearch(query: string) {
        searchQuery.value = query;
    }

    /**
     * Limpia los filtros
     */
    function clearFilters() {
        activeFilter.value = 'all';
        sortBy.value = 'debt';
        searchQuery.value = '';
    }

    // ============================================
    // RETORNAR
    // ============================================
    return {
        // Estado
        activeFilter,
        sortBy,
        searchQuery,

        // Getters
        allClients,
        filteredClients,
        debtors,
        frequentClients,
        totalPendingDebt,
        debtorsCount,

        // Acciones
        getClientById,
        getSalesByClient,
        setFilter,
        setSortBy,
        setSearch,
        clearFilters,
    };
});

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
//
// Este store NO guarda datos propios en localStorage.
// Construye la lista de clientes EN TIEMPO REAL
// a partir de las ventas existentes.
//
// Un "cliente" se reconoce por su teléfono (o nombre
// si no tiene teléfono). Si Juan Pérez compró 3 veces,
// aparece como 1 cliente con 3 ventas.
//
// CALCULA POR CLIENTE:
//  • Total comprado (suma de sus ventas)
//  • Total pagado
//  • Deuda pendiente
//  • Número de compras
//  • Fecha de última compra
//
// ============================================