// 📌 STORE DE PRODUCTOS - Maneja todos los productos del inventario

// ============================================
// IMPORTS
// ============================================

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type{
    Product, 
    CreateProductData, 
    UpdateProductData,
    ProductFilters,
    ProductCategory
} from '@/models/Product';
import {
    hasLowStock,
    isOutOfStock,
    calculateSalePrice,
} from '@/models/Product';
import { useNotificationsStore } from '@/stores/notifications';
import { useStoresStore } from '@/stores/stores';
import * as cacheService from '@/services/cache.service';

// ============================================
// STORE DE PRODUCTOS
// ============================================

export const useProductsStore = defineStore('products', () => {
    // ============================================
    // ESTADO (State)
    // ============================================

    // Lista de todos los productos
    const products = ref<Product[]>([]);

    //categorias disponibles
    const categories = ref<ProductCategory[]>([]);

    // filtros activos
    const activeFilters = ref<ProductFilters>({});

    // estado de carga
    const isLoading = ref(false);

    // ============================================
    // GETTERS (Computed)
    // ============================================
    
    /**
     * Obtiene productos de una tienda específica
     */
    const getProductsByStore = computed(() =>(storeId: string)=>{
        return products.value.filter(p => p.storeId === storeId);
    });

    /**
     * Obtiene solo productos activos de la tienda actual
     */
    const activeProducts = computed(() => {
        const storesStore = useStoresStore();
        return products.value.filter(p => p.status === 'active' && p.storeId === storesStore.currentStoreId);
    });

    /**
     * Obtiene productos con stock bajo de la tienda actual
     */
    const lowStockProducts = computed(() => {
        const storesStore = useStoresStore();
        return products.value.filter(p => hasLowStock(p) && !isOutOfStock(p) && p.storeId === storesStore.currentStoreId && p.status !== 'discontinued');
    });
    
    /**
     * Obtiene productos sin stock de la tienda actual
     */
    const outOfStockProducts = computed(() => {
        const storesStore = useStoresStore();
        return products.value.filter(p => isOutOfStock(p) && p.storeId === storesStore.currentStoreId && p.status !== 'discontinued');
    });

    /**
     * Obtiene productos descontinuados (papelera) de la tienda actual
     */
    const discontinuedProducts = computed(() => {
        const storesStore = useStoresStore();
        return products.value.filter(p => p.status === 'discontinued' && p.storeId === storesStore.currentStoreId);
    });
    
    /**
     * Cuenta total de productos de la tienda actual
     */
    const totalProducts = computed(() => {
        const storesStore = useStoresStore();
        return products.value.filter(p => p.storeId === storesStore.currentStoreId && p.status !== 'discontinued').length;
    });
    
    /**
     * Valor total del inventario (costo) de la tienda actual
     */
    const totalInventoryValue = computed(() => {
        const storesStore = useStoresStore();
        return products.value
            .filter(p => p.storeId === storesStore.currentStoreId && p.status !== 'discontinued')
            .reduce((total, p) => {
            return total + (p.purchasePrice * p.stock);
            }, 0);
    });
  
    /**
     * Productos filtrados según filtros activos de la tienda actual
     */
    const filteredProducts = computed(() => {
        const storesStore = useStoresStore();
        // Excluimos descontinuados de la lista principal
        let result = [...products.value].filter(p => p.storeId === storesStore.currentStoreId && p.status !== 'discontinued');
        
        // Filtrar por búsqueda
        if (activeFilters.value.search) {
            const search = activeFilters.value.search.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(search) ||
                p.sku?.toLowerCase().includes(search) ||
                p.barcode?.includes(search)
            );
        }
        
        // Filtrar por categoría
        if (activeFilters.value.categoryId) {
            result = result.filter(p => p.categoryId === activeFilters.value.categoryId);
        }
        
        // Filtrar por estado
        if (activeFilters.value.status) {
            result = result.filter(p => p.status === activeFilters.value.status);
        }
        
        // Filtrar solo stock bajo
        if (activeFilters.value.lowStock) {
            result = result.filter(p => hasLowStock(p));
        }
        
        // Ordenar
        if (activeFilters.value.sortBy) {
            result.sort((a, b) => {
                const order = activeFilters.value.sortOrder === 'desc' ? -1 : 1;
                
                switch (activeFilters.value.sortBy) {
                case 'name':
                    return order * a.name.localeCompare(b.name);
                case 'price':
                    return order * (a.salePrice - b.salePrice);
                case 'stock':
                    return order * (a.stock - b.stock);
                case 'created':
                    return order * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                default:
                    return 0;
                }
            });
        }
        
        return result;
    });   
    
    // ============================================
    // ACCIONES (Actions)
    // ============================================
    
    /**
     * 📋 FETCH PRODUCTS - Obtiene productos con estrategia caché-primero
     * 1. Muestra datos del caché INMEDIATAMENTE (si existen)
     * 2. En segundo plano carga del servidor
     * 3. Actualiza el caché con los nuevos datos
     */
    async function fetchProducts(storeId: string, forceRefresh: boolean = false) {
        isLoading.value = true;

        try {
            // ============================================
            // PASO A: Intentar cargar desde caché (rápido)
            // ============================================
            if (!forceRefresh) {
            const cacheKey = `products_${storeId}`;
            const isValid = await cacheService.isCacheValid(cacheKey, 60); // válido 60 min

            if (isValid) {
                // Cargar desde IndexedDB
                const cachedProducts = await cacheService.getItemsByStore<Product>(
                cacheService.STORES.PRODUCTS,
                storeId
                );

                if (cachedProducts.length > 0) {
                // Mostrar inmediatamente sin esperar al servidor
                const otherStores = products.value.filter(p => p.storeId !== storeId);
                products.value = [...otherStores, ...cachedProducts];
                isLoading.value = false;
                console.log(`⚡ ${cachedProducts.length} productos cargados desde caché`);
                return { success: true, fromCache: true };
                }
            }
            }

            // ============================================
            // PASO B: Cargar datos frescos (red o mock)
            // ============================================
            console.log('📦 Cargando productos frescos para tienda:', storeId);

            // Los productos ya existentes en memoria de otras tiendas
            const storeProducts = products.value.filter(p => p.storeId === storeId);

            if (storeProducts.length === 0 || forceRefresh) {
            // Datos mock de ejemplo (en producción vendrán de DynamoDB)
            const mockProducts: Product[] = [
                {
                id: `product-mock-1`,
                storeId,
                name: 'Cerveza Corona 355ml',
                description: 'Cerveza mexicana premium',
                categoryId: 'cat-1',
                barcode: '7501234567890',
                purchasePrice: 2500,
                salePrice: 3500,
                profitMargin: 40,
                stock: 48,
                minStock: 24,
                unit: 'bottle',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'user-1',
                },
                {
                id: `product-mock-2`,
                storeId,
                name: 'Coca-Cola 2L',
                description: 'Bebida refrescante',
                categoryId: 'cat-2',
                barcode: '7506234567891',
                purchasePrice: 4000,
                salePrice: 6000,
                profitMargin: 50,
                stock: 8,
                minStock: 12,
                unit: 'bottle',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'user-1',
                },
            ];

            products.value.push(...mockProducts);

            // ============================================
            // PASO C: Guardar en caché para la próxima vez
            // ============================================
            const allStoreProducts = products.value.filter(p => p.storeId === storeId);
            await cacheService.saveItems(cacheService.STORES.PRODUCTS, allStoreProducts, storeId);
            await cacheService.saveLastSync(`products_${storeId}`);
            console.log('💾 Productos guardados en caché');
            }

            return { success: true, fromCache: false };
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            return { success: false, error: 'Error al cargar productos' };
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * ➕ CREATE PRODUCT - Crea un nuevo producto
     */
    async function createProduct(
        data: CreateProductData,
        storeId: string,
        userId: string,
        defaultProfitMargin = 40,
    ){
        isLoading.value = true;

        try{
            console.log("Creando producto:", data.name);

            //calcular precio de venta si no se proporciona
            const profitMargin = data.profitMargin || defaultProfitMargin;
            const salePrice = data.salePrice || calculateSalePrice(data.purchasePrice, profitMargin);

            const newProduct: Product = {
                id: `product-${Date.now()}`,
                storeId,
                name: data.name,
                description: data.description,
                categoryId: data.categoryId,
                sku: data.sku,
                barcode: data.barcode,
                purchasePrice: data.purchasePrice,
                salePrice: salePrice,
                profitMargin: profitMargin,
                stock: data.stock,
                minStock: data.minStock,
                maxStock: data.maxStock,
                unit: data.unit,
                status: 'active',
                image: data.image,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: userId,
            };

            //TODO: Guardar en DynamoDB/AppSync
            await new Promise(resolve => setTimeout(resolve, 500));

            products.value.push(newProduct);

            // Actualizar el caché con el nuevo producto
            const allStoreProducts = products.value.filter(p => p.storeId === storeId);
            await cacheService.saveItems(cacheService.STORES.PRODUCTS, allStoreProducts, storeId);
            await cacheService.saveLastSync(`products_${storeId}`);

            console.log("producto creado exitosamente");
            return { success: true, product: newProduct };
        }catch(error){
            console.error('Error al crear producto:', error);
            return { success: false, error: 'Error al crear producto' };
        }finally{
            isLoading.value = false;
        }
    }

    /**
   * ✏️ UPDATE PRODUCT - Actualiza un producto
   */
    async function updateProduct(productId: string, data: UpdateProductData) {
        isLoading.value = true;
        
        try {
            const index = products.value.findIndex(p => p.id === productId);
        
        if (index === -1) {
            throw new Error('Producto no encontrado');
        }
        
        const originalProduct = products.value[index];
        console.log('📝 Actualizando producto:', originalProduct.name);
        
        // Si cambió el precio de compra o margen, recalcular precio de venta
        let salePrice = data.salePrice || originalProduct.salePrice;
        if (data.purchasePrice !== undefined || data.profitMargin !== undefined) {
            const newPurchasePrice = data.purchasePrice || originalProduct.purchasePrice;
            const newMargin = data.profitMargin || originalProduct.profitMargin;
            salePrice = calculateSalePrice(newPurchasePrice, newMargin);
        }
        
        const updatedProduct: Product = {
            ...originalProduct,
            ...data,
            salePrice,
            updatedAt: new Date().toISOString(),
        };
        
        // TODO: Actualizar en DynamoDB
        await new Promise(resolve => setTimeout(resolve, 500));
        
        products.value[index] = updatedProduct;

        if (data.stock !== undefined) {
            const storesStore = useStoresStore();
            const notificationsStore = useNotificationsStore();

            const minimumStock =
                updatedProduct.minStock ??
                storesStore.currentStore?.inventorySettings?.lowStockThreshold ??
                10;

            if (updatedProduct.stock <= minimumStock) {
                await notificationsStore.createStockAlert(
                    updatedProduct.storeId,
                    storesStore.currentStore?.name || 'Tu Tienda',
                    {
                        productId: updatedProduct.id,
                        productName: updatedProduct.name,
                        currentStock: updatedProduct.stock,
                        minimumStock: minimumStock,
                    }
                );
            }
        }

        console.log('✅ Producto actualizado exitosamente');
        
        return { success: true, product: updatedProduct };
        } catch (error: any) {
            console.error('❌ Error al actualizar producto:', error);
            return { success: false, error: error.message || 'Error al actualizar producto' };
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * ♻️ REACTIVATE PRODUCT - Reactiva un producto descontinuado
     */
    async function reactivateProduct(productId: string) {
        return updateProduct(productId, { status: 'active' });
    }

    /**
     * 💥 PERMANENT DELETE - Elimina un producto definitivamente
     */
    async function permanentDeleteProduct(productId: string) {
        isLoading.value = true;
        try {
            const index = products.value.findIndex(p => p.id === productId);
            if (index !== -1) {
                products.value.splice(index, 1);
                
                // Actualizar caché
                const storesStore = useStoresStore();
                const storeId = storesStore.currentStoreId;
                if (storeId) {
                    const allStoreProducts = products.value.filter(p => p.storeId === storeId);
                    await cacheService.saveItems(cacheService.STORES.PRODUCTS, allStoreProducts, storeId);
                }
            }
            return { success: true };
        } catch (error: any) {
            console.error('Error al eliminar definitivamente:', error);
            return { success: false, error: error.message };
        } finally {
            isLoading.value = false;
        }
    }

    /**
   * 🗑️ DELETE PRODUCT - Elimina un producto (soft delete)
   */
    async function deleteProduct(productId: string) {
        isLoading.value = true;
        
        try {
            // Marcar como descontinuado en lugar de eliminar
            await updateProduct(productId, { status: 'discontinued' });
            
            console.log('✅ Producto eliminado');
            return { success: true };
        } catch (error: any) {
            console.error('❌ Error al eliminar producto:', error);
            return { success: false, error: error.message || 'Error al eliminar producto' };
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 📊 UPDATE STOCK - Actualiza el stock de un producto
     * Ahora también lanza alerta de stock bajo automáticamente
     */
    async function updateStock(
    productId: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set'
    ) {

        console.log('🔄 updateStock llamado:', { productId, quantity, operation });

        const index = products.value.findIndex(p => p.id === productId);

        if (index === -1) {
            return { success: false, error: 'Producto no encontrado' };
        }

        const product = products.value[index];
        let newStock = product.stock;

        switch (operation) {
            case 'add':
            newStock += quantity;
            break;
            case 'subtract':
            newStock -= quantity;
            break;
            case 'set':
            newStock = quantity;
            break;
        }

        // No permitir stock negativo
        if (newStock < 0) {
            return { success: false, error: 'Stock no puede ser negativo' };
        }

        const result = await updateProduct(productId, { stock: newStock });

        console.log('📊 Stock actualizado. Nuevo stock:', newStock, '| minStock:', products.value[index]?.minStock);

        // ============================================
        // ALERTA AUTOMÁTICA DE STOCK BAJO
        // Se dispara cuando el stock baja del mínimo
        // ============================================
        if (result.success) {
            const updatedProduct = products.value[index];
            const storesStore = useStoresStore();
            const notificationsStore = useNotificationsStore();

            // Obtener el stock mínimo: usa el del producto o el de la tienda como fallback
            const minimumStock =
            updatedProduct.minStock ??
            storesStore.currentStore?.inventorySettings?.lowStockThreshold ??
            10;

            console.log('🚦 Verificando alerta:', { newStock, minimumStock, debeAlertar: newStock <= minimumStock });

            // Si el nuevo stock está en o por debajo del mínimo → crear alerta
            if (newStock <= minimumStock) {
                await notificationsStore.createStockAlert(
                    updatedProduct.storeId,
                    storesStore.currentStore?.name || 'Tu Tienda',
                    {
                    productId: updatedProduct.id,
                    productName: updatedProduct.name,
                    currentStock: newStock,
                    minimumStock: minimumStock,
                    }
                );
            }
        }

        return result;
    }

    /**
     * 🔍 SET FILTERS - Establece filtros de búsqueda
     */
    function setFilters(filters: ProductFilters) {
        activeFilters.value = filters;
    }
    
    /**
     * 🧹 CLEAR FILTERS - Limpia todos los filtros
     */
    function clearFilters() {
        activeFilters.value = {};
    }
    
    /**
     * 🔍 GET PRODUCT BY ID - Obtiene un producto específico
     */
    function getProductById(productId: string): Product | null {
        return products.value.find(p => p.id === productId) || null;
    }
    
    /**
     * 🧹 CLEAR - Limpia todos los datos
     */
    function clear() {
        products.value = [];
        categories.value = [];
        activeFilters.value = {};
    }
    // ============================================
    // RETORNAR
    // ============================================
    return {
        // Estado
        products,
        categories,
        activeFilters,
        isLoading,
        
        // Getters
        getProductsByStore,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        discontinuedProducts,
        totalProducts,
        totalInventoryValue,
        filteredProducts,
        
        // Acciones
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        reactivateProduct,
        permanentDeleteProduct,
        updateStock,
        setFilters,
        clearFilters,
        getProductById,
        clear,
    };
});

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
// 
// Este store maneja TODOS los productos del inventario.
// 
// Funcionalidades principales:
// 
// 1. ALMACENA:
//    - Lista de productos por tienda
//    - Categorías
//    - Filtros activos
// 
// 2. PERMITE:
//    - Crear productos
//    - Editar productos
//    - Eliminar productos (soft delete)
//    - Actualizar stock
//    - Buscar y filtrar
// 
// 3. CALCULA:
//    - Productos con stock bajo
//    - Productos sin stock
//    - Valor total del inventario
//    - Precio de venta automático
// 
// 4. FILTRA:
//    - Por búsqueda (nombre, SKU, código de barras)
//    - Por categoría
//    - Por estado
//    - Solo stock bajo
//    - Ordenar por diferentes criterios
// 
// Los datos por ahora son locales (mock).
// En futuras fases conectaremos con DynamoDB.
// ============================================