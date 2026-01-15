<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/register"></ion-back-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" class="ion-padding">
            <div class="confirm-container">
                <div class="icon-section">
                    <ion-icon :icon="mailOutline" class="mail-icon"></ion-icon>
                    <h2>Revisa tu Eamil</h2>
                    <p class="subtitle">
                        Hemos enviado un codigo de confirmacion a:
                    </p>
                    <p class="email-display">{{ email }}</p>
                </div>

                <!-- formulario -->
                <ion-card class="confirm-card">
                    <ion-card-content>

                        <ion-item lines="none" class="input-item">
                            <ion-label position="floating">Codigo de confirmación</ion-label>
                            <ion-input type="text" v-model="confirmationCode" placeholder="123456" :maxlength='6' @keyup.enter="handleConfirm"></ion-input>
                        </ion-item>

                        <!-- mensaje de error -->
                        <ion-text color="danger" v-if="errorMessage" class="error-message">
                            <p><small>{{  errorMessage  }}</small></p>
                        </ion-text>

                        <!-- boton confirmacion -->
                        <ion-button expand="block" @click="handleConfirm" :disabled="isLoading || !confirmationCode || confirmationCode.length < 6" class="confirm.button">
                            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                            <span v-else>Confirmar Email</span>
                        </ion-button>

                        <!-- reenviar codigo -->
                        <div class="resend-section">
                            <p>¿No has recibido el codigo?</p>
                            <ion-button fill="clear" @click="handleResendCode" :disabled="isResending || resendCooldown > 0">
                                <ion-spinner v-if="isResending" name="crescent" slot="start"></ion-spinner>
                                <span v-if="resendCooldown > 0">
                                    Reenviar codigo en {{ resendCooldown }}s
                                </span>
                                <span v-else>
                                    Reenviar Codigo
                                </span>
                            </ion-button>
                        </div>

                        <!-- ayuda -->
                        <div class="help-section">
                            <ion-accordion-group>
                                <ion-accordion value="help">
                                    <ion-item slot="header">
                                        <ion-label><h3>¿No encuentras el email?</h3></ion-label>
                                    </ion-item>
                                    <div slot="content" class="help-content">
                                        <ul>
                                            <li>Revisa tu carpeta de spam o correo no deseado.</li>
                                            <li>Asegúrate de que la dirección de email proporcionada sea correcta.</li>
                                            <li>Espera unos minutos, a veces los emails pueden tardar en llegar.</li>
                                            <li>Si el problema persiste, intenta reenviar el código de confirmación.</li>
                                        </ul>
                                    </div>
                                </ion-accordion>
                            </ion-accordion-group>
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
    import {ref, onMounted, onUnmounted} from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonBackButton,
        IonContent,
        IonCard,
        IonCardContent,
        IonItem,
        IonLabel,
        IonInput,
        IonButton,
        IonText,
        IonSpinner,
        IonIcon,
        IonAccordionGroup,
        IonAccordion,
        alertController,
        toastController,
    } from '@ionic/vue';
    import { mailOutline } from 'ionicons/icons';

    import { useAuthStore } from '@/stores/auth';

    // ============================================
    // COMPOSABLES
    // ============================================

    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();

    // ============================================
    // ESTADO LOCAL
    // ============================================

    const email = ref('');
    const confirmationCode = ref('');
    const isLoading = ref(false);
    const isResending = ref(false);
    const errorMessage = ref('');
    const resendCooldown = ref(0);

    //timer para el cooldown
    let cooldownTimer: number | null = null;

    // ============================================
    // LIFECYCLE
    // ============================================

    onMounted(() => {
        //obtener el email desde query string
        email.value = (route.query.email as string) || '';

        //si no hay email, redirigir a registro
        if(!email.value){
            router.push('/register');
        }
    });

    onUnmounted(() =>{
        //limpiar el timer cuando el componente se destruya
        if(cooldownTimer){
            clearInterval(cooldownTimer);
        }
    });

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * ✅ Confirma el email del usuario
     */

    async function handleConfirm(){
        errorMessage.value = '';

        if(!confirmationCode.value || confirmationCode.value.length < 6){
            errorMessage.value = 'Por favor, ingresa un codigo de confirmacion valido';
            return;
        }

        isLoading.value = true;

        try{
            const result = await authStore.confirmEmail(email.value, confirmationCode.value);

            if(result.success){
                //email condirmado exitosamente
                await showSuccessAlert();
            }else{
                errorMessage.value = result.message || 'Codigo incorrecto';
                await showToast(errorMessage.value, 'danger');
            }
        }catch(error: any){
            console.error('Error al confirmar: ', error );
            errorMessage.value = 'Error inesperado, Intenta de nuevo.';
            await showToast(errorMessage.value, 'danger');
        }finally{
            isLoading.value = false;
        }
    }

    /**
     * 🔄 Reenvía el código de confirmación
     */
    async function handleResendCode(){
        if(resendCooldown.value > 0) return;

        isResending.value = true;

        try{
            const result = await authStore.resendConfirmationCode(email.value);

            if(result.success){
                await showToast('Codigo reenviado, revisa tu email.', 'success');

                //iniciar cooldown de 60 segundos
                startCooldown(60);
            }else{
                await showToast(result.message || 'Error al reenviar codigo', 'danger');
            }
        }catch (error:any){
            console.error('Error al reenviar codigo: ', error);
            await showToast('Error al reenviar codigo', 'danger');
        }finally{
            isResending.value = false;
        }
    }

    /**
     * ⏱️ Inicia el cooldown para reenvío
     */
    function startCooldown(seconds: number){
        resendCooldown.value = seconds;

        cooldownTimer = setInterval(() => {
            resendCooldown.value--;

            if(resendCooldown.value <= 0){
                if(cooldownTimer){
                    clearInterval(cooldownTimer);
                    cooldownTimer = null;
                }
            }
        }, 1000) as unknown as number;
    }

    /**
     * ✅ Muestra alerta de éxito y redirige
     */
    async function showSuccessAlert(){
        const alert = await alertController.create({
            header: '¡Email Confirmado!',
            message: 'Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión.',
            buttons:[
                {
                    text: 'Iniciar Sesión',
                    handler: () => {
                        router.push('/login');
                    },
                },
            ],
            backdropDismiss: false,
        });
        await alert.present();
    }

    /**
     * 🍞 Muestra un toast
     */
    async function showToast(message: string, color: string = 'primary'){
        const toast = await toastController.create({
            message: message,
            duration: 3000,
            position: 'top',
            color: color,
        });
        await toast.present();
    }
</script>

// ============================================
// ESTILOS
// ============================================

<style scoped>

    .confirm-container{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        padding: 20px;
    }

    .icon-section {
        text-align: center;
        margin-bottom: 30px;
    }

    .mail-icon {
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

    .subtitle {
        color: var(--ion-color-medium);
        font-size: 14px;
        margin: 8px 0;
    }

    .email-display {
        font-weight: 600;
        color: var(--ion-color-primary);
        font-size: 16px;
        margin-top: 4px;
    }

    .confirm-card {
        width: 100%;
        max-width: 400px;
    }

    .input-item {
        margin-bottom: 16px;
        --background: var(--ion-color-light);
        --border-radius: 8px;
        --padding-start: 16px;
        --padding-end: 16px;
    }

    .error-message {
        display: block;
        margin: 10px 0;
        text-align: center;
    }

    .confirm-button {
        margin-top: 20px;
        height: 48px;
        font-weight: 600;
    }

    .resend-section {
        text-align: center;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--ion-color-light-shade);
    }

    .resend-section p {
        color: var(--ion-color-medium);
        font-size: 14px;
        margin-bottom: 8px;
    }

    .help-section {
        margin-top: 24px;
    }

    .help-content {
        padding: 16px;
        background: var(--ion-color-light);
        border-radius: 8px;
    }

    .help-content ul {
        margin: 0;
        padding-left: 20px;
        color: var(--ion-color-medium);
        font-size: 14px;
        line-height: 1.8;
    }

    .help-content li {
        margin: 8px 0;
    }

</style>