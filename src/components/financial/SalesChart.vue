<template>
    <!--
        Contenedor de la gráfica de barras.
        Muestra ingresos y ganancia por período.
    -->
    <div class="chart-container">
        <canvas ref="chartCanvas"></canvas>

        <!-- Estado vacío si no hay datos -->
        <div v-if="!hasData" class="no-data">
            <ion-icon :icon="barChartOutline"></ion-icon>
            <p>Sin ventas en este período</p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
    import { IonIcon } from '@ionic/vue';
    import { barChartOutline } from 'ionicons/icons';
    import {
        Chart,
        BarElement,
        BarController,
        CategoryScale,
        LinearScale,
        Tooltip,
        Legend,
    } from 'chart.js';
    import type { ChartDataPoint } from '@/stores/financials';

    // Registrar los componentes de Chart.js que usaremos
    // (Chart.js v3+ requiere registro explícito)
    Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend);

    // ============================================
    // PROPS
    // ============================================
    const props = defineProps<{
        data: ChartDataPoint[];  // Puntos de datos del store financiero
    }>();

    // ============================================
    // REFS
    // ============================================
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chartInstance: Chart | null = null;

    // ============================================
    // COMPUTED
    // ============================================
    const hasData = computed(() =>
        props.data.length > 0 && props.data.some(d => d.revenue > 0 || d.profit > 0)
    );

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * Crea o actualiza la gráfica con los datos actuales
     */
    function renderChart() {
        if (!chartCanvas.value) return;

        // Si ya existe una gráfica, destruirla primero
        // (necesario al cambiar datos para evitar superposición)
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        if (!hasData.value) return;

        const labels = props.data.map(d => d.label);
        const revenueData = props.data.map(d => d.revenue);
        const profitData = props.data.map(d => d.profit);
        const purchasesData = props.data.map(d => d.purchases);

        chartInstance = new Chart(chartCanvas.value, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                    // Barras de ingresos (azul)
                    label: 'Ingresos',
                    data: revenueData,
                    backgroundColor: 'rgba(56, 128, 255, 0.7)',
                    borderColor: 'rgba(56, 128, 255, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    },
                    {
                    // Barras de ganancia (verde)
                    label: 'Ganancia',
                    data: profitData,
                    backgroundColor: 'rgba(16, 220, 96, 0.7)',
                    borderColor: 'rgba(16, 220, 96, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    },
                    {
                    // Barras de costo (naranja)
                    label: 'Costo',
                    data: purchasesData,
                    backgroundColor: 'rgba(255, 196, 9, 0.5)',
                    borderColor: 'rgba(255, 196, 9, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            font: { size: 12 },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            // Formatear los valores del tooltip con moneda
                            label(context) {
                            const value = context.parsed.y;
                            return ` ${context.dataset.label}: $${value?.toLocaleString('es-CO')}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: {
                            font: { size: 11 },
                            // Abreviar valores grandes (ej: 50000 → $50k)
                            callback(value) {
                                const num = Number(value);
                                if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
                                if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
                                return `$${num}`;
                            },
                        },
                    },
                },
            },
        });
    }

    // ============================================
    // LIFECYCLE
    // ============================================

    onMounted(() => {
        renderChart();
    });

    // Cuando cambien los datos, re-renderizar la gráfica
    watch(() => props.data, () => {
        renderChart();
    }, { deep: true });

    // Al desmontar el componente, destruir la gráfica
    // para liberar memoria
    onUnmounted(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    });
</script>

<style scoped>
    .chart-container {
        position: relative;
        height: 220px;
        width: 100%;
    }

    /* Estado vacío */
    .no-data {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--ion-color-medium);
    }

    .no-data ion-icon {
        font-size: 40px;
    }

    .no-data p {
        font-size: 14px;
        margin: 0;
    }
</style>