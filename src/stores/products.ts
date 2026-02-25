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
     * Obtiene solo productos activos
     */
    const activeProducts = computed(() => 
        products.value.filter(p => p.status === 'active')
    );

    /**
   * Obtiene productos con stock bajo
   */
  const lowStockProducts = computed(() => 
    products.value.filter(p => hasLowStock(p) && !isOutOfStock(p))
  );
  
  /**
   * Obtiene productos sin stock
   */
  const outOfStockProducts = computed(() => 
    products.value.filter(p => isOutOfStock(p))
  );
  
  /**
   * Cuenta total de productos
   */
  const totalProducts = computed(() => products.value.length);
  
  /**
   * Valor total del inventario (costo)
   */
  const totalInventoryValue = computed(() => {
    return products.value.reduce((total, p) => {
      return total + (p.purchasePrice * p.stock);
    }, 0);
  });
  
    /**
     * Productos filtrados según filtros activos
     */
    const filteredProducts = computed(() => {
        let result = [...products.value];
        
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
     * 📋 FETCH PRODUCTS - Obtiene productos de una tienda
     */
    async function fetchProducts (storeId: string){
        isLoading.value = true;

        try{
            console.log('Cargando productos de la tienda:', storeId);

            // TODO: Obtener desde DynamoDB/AppSync
            // Por ahora, mantener productos en memoria
            // Solo cargar si no hay productos para esta tienda

            const stroreProducts = products.value.filter(p => p.storeId === storeId);

            if(stroreProducts.length === 0){
                // cargar productos mock de ejemplo (solo la primera vez)
                const mockProducts: Product[] = [
                    {
                        id: `product-${Date.now()}-1`,
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
                        id: `product-${Date.now()}-2`,
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
            }
            return {success: true};
        }catch(error){
            console.error('Error al cargar productos:', error);
            return{ success: false, error: 'Error al cargar productos' };
        }finally{
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
   */
    async function updateStock(productId: string, quantity: number, operation: 'add' | 'subtract' | 'set') {
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
        
        return await updateProduct(productId, { stock: newStock });
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
        totalProducts,
        totalInventoryValue,
        filteredProducts,
        
        // Acciones
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        setFilters,
        clearFilters,
        getProductById,
        clear,
    };
});