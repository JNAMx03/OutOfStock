<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Ventas</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div class="empty-state">
        <ion-icon :icon="cartOutline" class="empty-icon"></ion-icon>
        <h2>Ventas</h2>
        <p>Registra y gestiona tus ventas</p>
        <ion-button>
          <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
          Nueva Venta
        </ion-button>
        <p class="info-text">
          <small>Esta funcionalidad se desarrollará en la Fase 6</small>
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
  import { cartOutline, addOutline, addCircleOutline } from 'ionicons/icons';
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