<template>
    <div class="donut-container">
        <canvas ref="chartCanvas"></canvas>

        <div v-if="!hasData" class="no-data">
            <ion-icon :icon="pieChartOutline"></ion-icon>
            <p>Sin datos de pago</p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
    import { IonIcon } from '@ionic/vue';
    import { pieChartOutline } from 'ionicons/icons';
    import {
        Chart,
        DoughnutController,
        ArcElement,
        Tooltip,
        Legend,
    } from 'chart.js';
    import type { PaymentMethodSummary } from '@/stores/financials';

    Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

    // ============================================
    // PROPS
    // ============================================
    const props = defineProps<{
        data: PaymentMethodSummary[];
    }>();

    // ============================================
    // REFS
    // ============================================
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chartInstance: Chart | null = null;

    // ============================================
    // COMPUTED
    // ============================================
    const hasData = computed(() => props.data.length > 0);

    // Paleta de colores para los métodos de pago
    const COLORS = [
        'rgba(56, 128, 255, 0.8)',    // Azul - Efectivo
        'rgba(16, 220, 96, 0.8)',     // Verde - Tarjeta
        'rgba(255, 196, 9, 0.8)',     // Amarillo - Transferencia
        'rgba(235, 68, 90, 0.8)',     // Rojo - Crédito
        'rgba(112, 68, 255, 0.8)',    // Morado - Mixto
    ];

    // ============================================
    // FUNCIONES
    // ============================================
    function renderChart() {
        if (!chartCanvas.value) return;

        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        if (!hasData.value) return;

        chartInstance = new Chart(chartCanvas.value, {
            type: 'doughnut',
            data: {
                labels: props.data.map(d => `${d.method} (${d.percentage}%)`),
                datasets: [{
                    data: props.data.map(d => d.total),
                    backgroundColor: COLORS.slice(0, props.data.length),
                    borderWidth: 2,
                    borderColor: 'white',
                    hoverOffset: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%', // Grosor del donut
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 12,
                            usePointStyle: true,
                            font: { size: 11 },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label(context) {
                            const value = context.parsed;
                            return ` $${value.toLocaleString('es-CO')}`;
                            },
                        },
                    },
                },
            },
        });
    }

    onMounted(() => renderChart());
    watch(() => props.data, () => renderChart(), { deep: true });
    onUnmounted(() => { if (chartInstance) chartInstance.destroy(); });
</script>

<style scoped>
.donut-container {
    position: relative;
        height: 200px;
        width: 100%;
    }

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

    .no-data ion-icon { font-size: 40px; }
    .no-data p { font-size: 14px; margin: 0; }
</style>