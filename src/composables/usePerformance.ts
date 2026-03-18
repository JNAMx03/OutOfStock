// src/composables/usePerformance.ts
// ⚡ COMPOSABLE DE PERFORMANCE - Utilidades de optimización

import { ref, onMounted, onUnmounted } from 'vue';

// ============================================
// DEBOUNCE
// ============================================

/**
 * Debounce: espera N milisegundos antes de ejecutar la función.
 * Útil para búsquedas en tiempo real (no hacer petición en cada tecla).
 * 
 * Ejemplo:
 *   const buscar = useDebounce((texto) => fetchProductos(texto), 300);
 *   buscar('cerveza'); // espera 300ms antes de ejecutar
 * 
 * @param fn - Función a ejecutar
 * @param delay - Milisegundos de espera (default: 300)
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        // Cancelar el timer anterior
        clearTimeout(timeoutId);
        // Iniciar un nuevo timer
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

// ============================================
// THROTTLE
// ============================================

/**
 * Throttle: ejecuta la función máximo 1 vez cada N milisegundos.
 * Útil para eventos de scroll, resize, etc.
 * 
 * @param fn - Función a ejecutar
 * @param limit - Milisegundos entre ejecuciones (default: 200)
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 200
): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            fn(...args);
        }
    };
}

// ============================================
// LAZY LOADING DE IMÁGENES
// ============================================

/**
 * useLazyImage: Carga una imagen solo cuando entra al viewport.
 * Usa IntersectionObserver (nativo del navegador, muy eficiente).
 * 
 * Ejemplo de uso en un componente:
 *   const { imageRef, loadedSrc, isLoaded } = useLazyImage(product.image);
 *   <img :ref="imageRef" :src="loadedSrc" :class="{ 'loaded': isLoaded }" />
 * 
 * @param src - URL de la imagen a cargar
 * @param placeholder - URL de imagen placeholder (mientras carga)
 */
export function useLazyImage(
  src: string | undefined,
  placeholder: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=='
) {
    const imageRef = ref<HTMLImageElement | null>(null);
    const loadedSrc = ref<string>(placeholder);
    const isLoaded = ref(false);
    let observer: IntersectionObserver | null = null;

    onMounted(() => {
        if (!src) return;

        // IntersectionObserver: detecta cuando el elemento entra al viewport
        observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // El elemento está visible → cargar la imagen real
                        const img = new Image();
                        img.onload = () => {
                        loadedSrc.value = src;
                        isLoaded.value = true;
                        };
                        img.src = src;

                        // Dejar de observar (ya cargamos la imagen)
                        observer?.unobserve(entry.target);
                    }
                });
            },
            {
                // La imagen empieza a cargar cuando está a 100px de aparecer
                rootMargin: '100px',
                threshold: 0.01,
            }
        );

        if (imageRef.value) {
            observer.observe(imageRef.value);
        }
    });

    onUnmounted(() => {
        observer?.disconnect();
    });

    return { imageRef, loadedSrc, isLoaded };
}

// ============================================
// ONLINE/OFFLINE STATUS
// ============================================

/**
 * useNetworkStatus: Detecta si hay conexión a internet.
 * Emite un evento cuando cambia el estado.
 * 
 * Ejemplo:
 *   const { isOnline } = useNetworkStatus();
 *   // En el template: <div v-if="!isOnline">Sin conexión</div>
 */
export function useNetworkStatus() {
    const isOnline = ref(navigator.onLine);

    function updateStatus() {
        isOnline.value = navigator.onLine;
    }

    onMounted(() => {
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
    });

    onUnmounted(() => {
        window.removeEventListener('online', updateStatus);
        window.removeEventListener('offline', updateStatus);
    });

    return { isOnline };
}

// ============================================
// VIRTUAL SCROLLING HELPER
// ============================================

/**
 * useVirtualList: Para listas muy largas (500+ items).
 * Solo renderiza los items visibles en pantalla.
 * 
 * @param items - Lista completa de items
 * @param itemHeight - Altura de cada item en píxeles
 * @param containerHeight - Altura del contenedor visible
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number = 80,
  containerHeight: number = 600
) {
    const scrollTop = ref(0);

    // Cuántos items caben en pantalla + buffer extra
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 5;

    // Índice del primer item visible
    const startIndex = ref(0);

    function onScroll(event: Event) {
        const target = event.target as HTMLElement;
        scrollTop.value = target.scrollTop;
        startIndex.value = Math.floor(scrollTop.value / itemHeight);
    }

    // Items visibles actualmente
    const visibleItems = ref(items.slice(0, visibleCount));

    function updateVisibleItems() {
        const start = Math.max(0, startIndex.value);
        const end = Math.min(items.length, start + visibleCount);
        visibleItems.value = items.slice(start, end) as typeof visibleItems.value;
    }

    return {
        visibleItems,
        onScroll,
        updateVisibleItems,
        // Offset para mantener el scroll correcto
        topPadding: startIndex.value * itemHeight,
        totalHeight: items.length * itemHeight,
    };
}

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
//
// Este composable tiene 4 utilidades de performance:
//
// 1. useDebounce: Para búsquedas
//    Sin debounce: busca "c", "ce", "cer", "cerv"... (4 peticiones)
//    Con debounce: espera 300ms y busca solo "cerv" (1 petición)
//
// 2. useThrottle: Para eventos frecuentes
//    Evita que una función se ejecute 100 veces por segundo
//
// 3. useLazyImage: Para imágenes
//    No carga las fotos hasta que el usuario las ve
//    Ahorra banda ancha y mejora el tiempo de carga inicial
//
// 4. useNetworkStatus: Para offline
//    Detecta si hay internet y muestra un aviso
//
// ============================================