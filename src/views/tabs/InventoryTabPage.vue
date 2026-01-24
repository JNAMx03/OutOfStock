<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-menu-button></ion-menu-button>
                </ion-buttons>
                <ion-title>Inventario</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="addProduct">
                        <ion-icon :icon="addOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" class="ion-padding">
            <div class="empty-state">
                <ion-icon :icon="cubeOutline" class="empty-icon"></ion-icon>
                    <h2>Inventario</h2>
                    <p>Aquí podrás gestionar todos tus productos</p>
                <ion-button @click="addProduct">
                    <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
                    Agregar Producto
                </ion-button>
                <p class="info-text">
                    <small>Esta funcionalidad se desarrollará en la Fase 5</small>
                </p>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonButton,
        IonTitle,
        IonContent,
        IonIcon,
    } from '@ionic/vue';
    import { cubeOutline, addOutline, addCircleOutline } from 'ionicons/icons';

    function addProduct() {
        console.log('Agregar producto');
    }
</script>

<style scoped>
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
    }

    .empty-icon {
        font-size: 120px;
        color: var(--ion-color-medium);
        margin-bottom: 20px;
    }

    .empty-state h2 {
        font-size: 24px;
        color: var(--ion-color-dark);
        margin: 16px 0;
    }

    .empty-state p {
        color: var(--ion-color-medium);
        margin-bottom: 24px;
    }

    .info-text {
        margin-top: 16px;
        color: var(--ion-color-medium);
    }
</style>