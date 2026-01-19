<template>
    <ion-page>
        <ion-content :fullscreen="true" class="ion-padding">
            <div class="notfound-container">
                <ion-icon :icon="sadOutline" class="sad-icon"></ion-icon>
                <h1>404</h1>
                <h2>Página no encontrada</h2>
                <p>Lo sentimos, la página que buscas no existe.</p>
                <ion-button @click="goHome" expand="block">
                    Volver al inicio
                </ion-button>
            </div>
        </ion-content>
    </ion-page>
</template>

// ============================================
// IMPORTS
// ============================================

<script setup lang="ts">
    import { useRouter } from 'vue-router';
    import{
        IonPage,
        IonContent,
        IonButton,
        IonIcon,
    } from '@ionic/vue';
    import { sadOutline } from 'ionicons/icons';

    const router = useRouter();

    function goHome(){
        router.push('/');
    }
</script>

// ============================================
// ESTILOS
// ============================================

<style scoped>
    .notfound-container{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        min-height: 100%;
    }

    .sad-icon{
        font-size: 120px;
        color: var(--ion-color-medium);
        margin-bottom: 20px
    }

    h1{
        font-size: 72px;
        font-weight: bold;
        color: var(--ion-color-medium);
        margin: 0;
    }

    h2{
        font-size: 24px;
        color: var(--ion-color-dark);
        margin: 16px 0;
    }

    p{
        color: var(--ion-color-medium);
        margin-bottom: 32px;
    }

    ion-button{
        max-width: 300px;
    }
</style>