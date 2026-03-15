// 📌 MODELO DE PRODUCTO - Define la estructura de datos de un producto

// ============================================
// TIPOS Y ENUMS
// ============================================

/**
 * Unidades de medida disponibles
 */

export type ProductUnit = 
| 'unit' // Unidad individual
| 'kg'   // Kilogramo
| 'g'    // Gramo
| 'l'    // Litro
| 'ml'   // Mililitro
| 'pack' // Paquete
| 'box'  // Caja
| 'dozen' // Docena
| 'set'  // Juego
| 'piece' // Pieza
| 'bag'  // Bolsa
| 'bottle' // Botella
| 'can'    // Lata
| 'roll'   // Rollo
| 'sheet'  // Hoja
| 'meter';  // Metro

/**
 * Estado de un producto
 */
export type ProductStatus =
| 'active'   // Producto activo y disponible
| 'inactive' // Producto inactivo y no disponible
| 'discontinued'; // Producto descontinuado

// ============================================
// INTERFACES
// ============================================

/**
 * Categoría de productos
 */
export interface ProductCategory {
    id: string; // Identificador único de la categoría
    name: string; // Nombre de la categoría
    description?: string; // Descripción opcional de la categoría
    color?: string; // Color asociado a la categoría (opcional)
    icon?: string; // Icono asociado a la categoría (opcional)
}

/**
 * Historial de precios del producto
 */
export interface PriceHistory {
    purchasePrice: number; // Precio de compra
    salePrice: number; // Precio de venta
    date: Date; // Fecha del cambio de precio
    reason?: string; // Razón del cambio de precio (opcional)
}

/**
 * Interfaz principal de Producto
 */
export interface Product {
    //identificacion
    id: string; // Identificador único del producto
    storeId: string; // Identificador de la tienda a la que pertenece el producto
    name: string; // Nombre del producto
    description?: string; // Descripción opcional del producto

    //categorizacion
    categoryId?: string; // Identificador de la categoría del producto
    sku?: string; // Código SKU (opcional, Stock Keeping Unit)
    barcode?: string; // Código de barras (opcional)

    //precios
    purchasePrice: number; // Precio de compra
    salePrice: number; // Precio de venta
    profitMargin: number; // Margen de beneficio calculado %

    //inventario
    stock: number; // Cantidad en stock
    minStock: number; // Cantidad mínima en stock para alertas
    maxStock?: number; // Cantidad máxima en stock para alertas
    unit: ProductUnit; // Unidad de medida del producto

    //estado
    status: ProductStatus; // Estado del producto (activo, inactivo, descontinuado)

    //multimedia
    image?: string; // URL de la imagen del producto (opcional)
    images?: string[]; // URLs de imágenes adicionales del producto (opcional)

    //metadatos
    createdAt: string; // Fecha de creación del producto
    updatedAt?: string; // Fecha de última actualización del producto
    createdBy: string; // Usuario que creó el producto
    updatedBy?: string; // Usuario que actualizó el producto

    //historial
    priceHistory?: PriceHistory[]; // Historial de precios del producto (opcional)

    //estadísticas (se acomulan, no se guardan)
    totalSales?: number; // Total de ventas del producto
    lastSaleDate?: Date; // Fecha de la última venta del producto
}

/**
 * Datos para crear un nuevo producto
 */
export interface CreateProductData {
    name: string; // Nombre del producto
    description?: string; // Descripción opcional del producto
    categoryId: string; // Identificador de la categoría del producto
    sku?: string; // Código SKU (opcional)
    barcode?: string; // Código de barras (opcional)
    purchasePrice: number; // Precio de compra
    salePrice?: number; // Precio de venta, opcional, se puede calcualar automaticamente
    profitMargin?: number; // Margen de beneficio calculado %, si no se da, usar el de la tienda
    stock: number; // Cantidad en stock
    minStock: number; // Cantidad mínima en stock para alertas
    maxStock: number; // Cantidad máxima en stock para alertas
    unit: ProductUnit; // Unidad de medida del producto
    status?: ProductStatus; // Estado del producto (opcional, por defecto 'active')
    image?: string; // URL de la imagen del producto (opcional)
    images?: string[]; // URLs de imágenes adicionales del producto (opcional)
}

/**
 * Datos para actualizar un producto
 */
export interface UpdateProductData {
    name?: string; // Nombre del producto (opcional)
    description?: string; // Descripción del producto (opcional)
    categoryId?: string; // Identificador de la categoría del producto (opcional)
    sku?: string; // Código SKU (opcional)
    barcode?: string; // Código de barras (opcional)
    purchasePrice?: number; // Precio de compra (opcional)
    salePrice?: number; // Precio de venta (opcional)
    profitMargin?: number; // Margen de beneficio calculado % (opcional)
    stock?: number; // Cantidad en stock (opcional)
    minStock?: number; // Cantidad mínima en stock para alertas (opcional)
    maxStock?: number; // Cantidad máxima en stock para alertas (opcional)
    unit?: ProductUnit; // Unidad de medida del producto (opcional)
    status?: ProductStatus; // Estado del producto (opcional)
    image?: string; // URL de la imagen del producto (opcional)
    images?: string[]; // URLs de imágenes adicionales del producto (opcional)
}

/**
 * Filtros para buscar productos
 */
export interface ProductFilters {
    search?: string; // Término de búsqueda para nombre o descripción
    categoryId?: string; // Filtrar por categoría
    status?: ProductStatus; // Filtrar por estado del producto
    lowStock?: boolean; // Filtrar productos con stock bajo (stock <= minStock)
    sortBy?: 'name' | 'price' | 'stock' | 'created'; // Campo para ordenar los resultados
    sortOrder?: 'asc' | 'desc'; // Orden de clasificación (ascendente o descendente)
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Calcula el precio de venta basado en el precio de compra y margen
 */
export function calculateSalePrice(purchasePrice: number, profitMargin: number): number {
    return Math.round(purchasePrice * (1 + profitMargin /100));
}

/**
 * Calcula el margen de ganancia basado en precios
 */
export function calculateProfitMargin(purchasePrice: number, salePrice: number): number {
    return Math.round(((salePrice - purchasePrice) / purchasePrice) * 100);
}

/**
 * Calcula la ganancia unitaria
 */
export function calculateProfit(purchasePrice: number, salePrice: number): number {
    return salePrice - purchasePrice;
}

/**
 * Verifica si un producto tiene stock bajo
 */
export function hasLowStock(product: Product): boolean {
    return product.stock <= product.minStock;
}

/**
 * Verifica si un producto está sin stock
 */
export function isOutOfStock(product: Product): boolean {
    return product.stock === 0;
}

/**
 * Obtiene el nombre legible de la unidad
 */
export function getUnitName(unit: ProductUnit): string {
    const unitNames: Record<ProductUnit, string> = {
        'unit': 'Unidad',
        'kg': 'Kilogramo',
        'g': 'Gramo',
        'l': 'Litro',
        'ml': 'Mililitro',
        'pack': 'Paquete',
        'box': 'Caja',
        'dozen': 'Docena',
        'set': 'Juego',
        'piece': 'Pieza',
        'bag': 'Bolsa',
        'bottle': 'Botella',
        'can': 'Lata',
        'roll': 'Rollo',
        'sheet': 'Hoja',
        'meter': 'Metro'
    }
    return unitNames[unit] || 'Unidad desconocida';
}

/**
 * Obtiene la abreviatura de la unidad
 */
export function getUnitAbbr(unit: ProductUnit): string {
    const unitAbbr: Record<ProductUnit, string> = {
        unit: 'und',
        kg: 'kg',
        g: 'g',
        l: 'l',
        ml: 'ml',
        pack: 'pqt',
        box: 'cja',
        dozen: 'doc',
        set: 'jgo',
        piece: 'pza',
        bag: 'bls',
        bottle: 'bot',
        can: 'lat',
        roll: 'rol',
        sheet: 'hj',
        meter: 'm'
    }
    return unitAbbr[unit];
}

/**
 * Obtiene el color del estado del producto
 */
export function getProductStatusColor(status: ProductStatus): string {
    const colors: Record<ProductStatus, string> = {
        active: 'success', // Verde para productos activos
        inactive: 'warning', // Amarillo para productos inactivos
        discontinued: 'danger', // Rojo para productos descontinuados
    }
    return colors[status];
}

/**
 * Obtiene el nombre del estado del producto
 */
export function getProductStatusName(status: ProductStatus): string {
    const names: Record<ProductStatus, string> = {
        active: 'Activo',
        inactive: 'Inactivo',
        discontinued: 'Descontinuado',
    }
    return names[status];
}

/**
 * Formatea un precio con moneda
 */
export function formatPrice(price: number, currency: string = '$'): string {
    return `${currency}${price.toLocaleString('es-CO')}`;
}

/**
 * Valida los datos de un producto
 */
export function validateProductData(data: CreateProductData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre
    if (!data.name || data.name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    // Validar precio de compra
    if (data.purchasePrice < 0) {
        errors.push('El precio de compra no puede ser negativo');
    }
    
    // Validar precio de venta (si se proporciona)
    if (data.salePrice !== undefined && data.salePrice < 0) {
        errors.push('El precio de venta no puede ser negativo');
    }
    
    // Validar que el precio de venta sea mayor al de compra
    if (data.salePrice !== undefined && data.salePrice < data.purchasePrice) {
        errors.push('El precio de venta debe ser mayor al precio de compra');
    }
    
    // Validar stock
    if (data.stock < 0) {
        errors.push('El stock no puede ser negativo');
    }
    
    // Validar stock mínimo
    if (data.minStock < 0) {
        errors.push('El stock mínimo no puede ser negativo');
    }
    
    // Validar margen de ganancia (si se proporciona)
    if (data.profitMargin !== undefined && data.profitMargin < 0) {
        errors.push('El margen de ganancia no puede ser negativo');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Crea un producto por defecto
 */
export function createDefaultProduct(storeId: string, userId: string): Product {
  return {
    id: `product-${Date.now()}`,
    storeId,
    name: '',
    purchasePrice: 0,
    salePrice: 0,
    profitMargin: 30,
    stock: 0,
    minStock: 10,
    unit: 'unit',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId,
  };
}

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
// 
// Este archivo define todo sobre los PRODUCTOS:
// 
// 1. Qué información tiene un producto:
//    - Identificación (nombre, SKU, código de barras)
//    - Precios (compra, venta, margen)
//    - Inventario (stock, mínimo, máximo, unidad)
//    - Estado (activo, inactivo, descontinuado)
//    - Multimedia (imágenes)
//    - Categoría
// 
// 2. Funciones útiles:
//    - Calcular precio de venta automáticamente
//    - Calcular margen de ganancia
//    - Verificar stock bajo
//    - Formatear precios
//    - Validar datos
// 
// 3. Unidades de medida:
//    - Unidad, kg, gramos, litros, paquetes, etc.
// 
// 4. Historial de precios:
//    - Guarda cambios de precios para análisis
// 
// Es la "plantilla" que usaremos para todos los productos.
// ============================================