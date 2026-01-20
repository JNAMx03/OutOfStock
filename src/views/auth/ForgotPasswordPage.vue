<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/login"></ion-back-button>
                </ion-buttons>
                <ion-title>Recuperar Constraseña</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" class="ion-padding">
            <div class="forgot-container">
                <div class="icon-section">
                    <ion-icon :icon="lockClosedOutline" cñass="lock-icon"></ion-icon>
                    <h2>¿Olvidaste tu contraseña?</h2>
                    <p class="subtitle">
                        Bi te preocupes, te enviaremos instrucciones para restablecerla.
                    </p>
                </div>

                <ion-card class="forgot-card">
                    <ion-card-content>
                        <ion-item lines="none" class="input-item">
                            <ion-input label="Email" label-placement="floating" type="email" v-model="email" placeholder="tu@email.com"></ion-input>
                        </ion-item>

                        <ion-button expand="block" @click="handleSendCode" :disabled="isLoading || !email" class="send-button">
                            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                            <span v-else>Enviar Codigo</span>
                        </ion-button>

                        <div class="blank-link">
                            <ion-button fill="clear" @click="goToLogin">
                                Volver al login
                            </ion-button>
                        </div>
                    </ion-card-content>
                </ion-card>
            </div>
        </ion-content>
    </ion-page>
</template>

// ============================================
// IMPORTS
// ============================================

<script setup lang="ts">
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';
    import{
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonBackButton,
        IonTitle,
        IonContent,
        IonCard,
        IonCardContent,
        IonItem,
        IonInput,
        IonButton,
        IonSpinner,
        IonIcon,
        toastController,
    }from '@ionic/vue';
    import { lockClosedOutline } from 'ionicons/icons';

    const router = useRouter();
    const email = ref('');
    const isLoading = ref(false);

    async function handleSendCode(){
        //funcionalidad pendiente
        await showToast('funcionalidad en desarrollo')
    }

    function goToLogin(){
        router.push('/login');
    }

    async function showToast(message: string, color: string = 'primary'){
        const toast = await toastController.create({
            message,
            color,
            duration: 3000,
            position: 'top',
        });
        await toast.present();
    }
</script>

// ============================================
// ESTILOS
// ============================================

<style scoped>
    .forgot-container{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        padding: 20px;
    }

    .icon-section{
        text-align: center;
        margin-bottom: 30px;
    }

    .lock-icon{
        font-size: 80px;
        color: var(--ion-color-primary);
        margin-bottom: 16px;
    }

    .icon-section h2 {
        font-size: 24px;
        font-weight: bold;
        color: var(--ion-color-dark);
        margin: 10px 0;
    }

    .subtitle{
        color: var(--ion-color-medium);
        font-size: 14px;
        max-width: 300px;
        margin: 0 auto;
    }

    .forgot-card{
        width: 100%;
        max-width: 400px;
    }

    .input-item{
        margin-bottom: 16px;
        --background: var(--ion-color-light);
        --border-radius: 8px;
        --pading-start: 16px;
        --padding-end: 16px;
    }

    .send-button{
        height: 48px;
        margin-top: 20px;
        font-weight: 600;
    }

    .blank-link{
        text-align: center;
        margin-top: 16px;
    }
</style>