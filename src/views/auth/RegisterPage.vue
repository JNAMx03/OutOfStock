<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <!-- boton para volver atras -->
                <ion-buttons slot="start">
                    <ion-back-button default-href="/login"></ion-back-button>
                </ion-buttons>
                <ion-title>Crear Cuenta</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true" class="ion-padding">
            <div class="register-container">
                <!-- logo -->
                <div class="logo-section">
                    <ion-icon :icon="personAddOutline" class="register-icon"></ion-icon>
                    <h2>Unete Out Of Stock</h2>
                    <p class="subtitle">Crea tu cuenta y comienza a gestionar tu invetario</p>
                </div>

                <!-- formulario de registro -->
                <ion-card class="register-card">
                    <ion-card-content>
                        <ion-item lines="none" class="input-item">
                            <ion-label position="floating">Nombre completo *</ion-label>
                            <ion-input type="text" v-model="name" placeholder="Peter Parker"></ion-input>
                        </ion-item>

                        <ion-item lines="none" class="input-item">
                            <ion-label position="floating">Correo electrónico *</ion-label>
                            <ion-input type="email" v-model="email" placeholder="tu@rmail.com"></ion-input>
                        </ion-item>

                        <ion-item lines="none" class="input-item">
                            <ion-label position="floating">Contraseña *</ion-label>
                            <ion-input type="password" v-model="password" placeholder="********"></ion-input>
                        </ion-item>

                        <ion-item lines="none" class="input-item">
                            <ion-label position="floating">Confirmar contraseña *</ion-label>
                            <ion-input type="password" v-model="confirmPassword" placeholder="********" @keyup.enter="handleRegister"></ion-input>
                        </ion-item>

                        <div class="password-requirements" v-if="password">
                            <p><small><strong>Requisitos de contraseña:</strong></small></p>
                            <ul>
                                <li :class="{valid:password.length >= 8}">
                                    <ion-icon :icon="password.length >= 8 ? checkmarkCircle : closeCircle" ></ion-icon>
                                    Mínimo 8 caracteres
                                </li>
                                <li :class="{ valid: /[A-Z]/.test(password) }">
                                    <ion-icon :icon="/[A-Z]/.test(password) ? checkmarkCircle : closeCircle"></ion-icon>
                                    Una letra mayúscula
                                </li>
                                <li :class="{ valid: /[a-z]/.test(password) }">
                                    <ion-icon :icon="/[a-z]/.test(password) ? checkmarkCircle : closeCircle"></ion-icon>
                                    Una letra minúscula
                                </li>
                                <li :class="{ valid: /[0-9]/.test(password) }">
                                    <ion-icon :icon="/[0-9]/.test(password) ? checkmarkCircle : closeCircle"></ion-icon>
                                    Un número
                                </li>
                            </ul>
                        </div>

                        <!-- Mensaje de error -->
                        <ion-text color="danger" v-if="errorMessage" class="error-message">
                            <p><small>{{ errorMessage }}</small></p>
                        </ion-text>

                        <!-- Botón de Registro -->
                        <ion-button expand="block" class="register-button" @click="handleRegister" :disabled="isLoading || !isFormValid">
                            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                            <span v-else>Crear Cuenta</span>
                        </ion-button>

                        <!-- terminos y condiciones -->
                        <div class="terms">
                            <p>
                                <small>
                                    Al registrarte, aceptas nuestros
                                    <a href="#">Términos y Condiciones</a> y
                                    <a href="#">Política de Privacidad</a>
                                </small>
                            </p>
                        </div>

                         <!-- link para login -->
                        <div class="login-section">
                            <p>¿Ya tienes cuenta?</p>
                            <ion-button fill="outline" expand="block" @clivk="goToLogin">
                                Iniciar Seión
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
    import { ref, computed } from 'vue';
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
        IonLabel,
        IonInput,
        IonButton,
        IonText,
        IonSpinner,
        IonIcon,
        alertController,
        toastController,
    } from '@ionic/vue';
    import { personAddOutline, checkmarkCircle, closeCircle } from 'ionicons/icons';

    import { useAuthStore} from '@/stores/auth';
    import { validatePassword, isValidEmail } from  '@/models/User';

    // ============================================
    // COMPOSABLES
    // ============================================
    const router = useRouter();
    const authStore = useAuthStore();

    // ============================================
    // ESTADO LOCAL
    // ============================================
    const name = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');

    // ============================================
    // COMPUTED (valores calculados)
    // ============================================

    /**
     * Verifica si el formulario es válido
     */
    const isFormValid = computed(() => {
        return(
            name.value.length > 0 &&
            isValidEmail(email.value) &&
            validatePassword(password.value) &&
            password.value === confirmPassword.value
        );
    });

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * 📝 Maneja el registro del usuario
     */
    async function handleRegister(){
        //limpia mensajes previos
        errorMessage.value = '';

        //validar nombre
        if(!name.value || name.value.trim().length < 2){
            errorMessage.value = 'Por favor ingresa tu nombre completo.';
            return;
        }

        //validar email
        if(!isValidEmail(email.value)){
            errorMessage.value = 'Por favor ingresa un correo electrónico válido.';
            return;
        }

        //validar contraseña
        const passwordValidation = validatePassword(password.value);
        if(!passwordValidation.valid){
            errorMessage.value = passwordValidation.message;
            return;
        }

        //validar confirmación de contraseña
        if(password.value !== confirmPassword.value){
            errorMessage.value = 'Las contraseñas no coinciden.';
            return;
        }

        //activar estado de carga
        isLoading.value = true;

        try{
            //intentar registro
            const result = await authStore.register(
                email.value,
                password.value,
                name.value
            );

            if(result.success){
                //regsitro exitoso
                await showSuccessAlert();
            }else{
                //error en registro
                errorMessage.value = result.message || 'Error al crear la cuenta.';
                await showToast(errorMessage.value, 'danger');
            }
        }catch(error: any){
            console.error('Registro fallido:', error);
            errorMessage.value = 'Error al crear la cuenta. Inténtalo de nuevo más tarde.';
            await showToast(errorMessage.value, 'danger');
        }finally{
            //desactivar estado de carga
            isLoading.value = false;
        }
    }

    /**
     * ✅ Muestra alerta de éxito y redirige a confirmación
     */
    async function showSuccessAlert() {
        const alert = await alertController.create({
            header: '¡Registro Exitoso!',
            message: `Hemos enviado un código de confirmación a ${email.value}. Por favor revisa tu bandeja de entrada.`,
            buttons: [{
                text: 'Confirmar Email',
                handler: () => {
                    // Redirigir a página de confirmación (la crearemos después)
                    router.push({
                        path: '/confirm-email',
                        query: { email: email.value }
                    });
                },
            },],
            backdropDismiss: false, // No se puede cerrar tocando afuera
        });

        await alert.present();
    }

    /**
     * 🔙 Navega a la página de login
     */
    function goToLogin() {
        router.push('/login');
    }

    /**
     * 🍞 Muestra un toast (notificación)
     */
    async function showToast(message: string, color: string = 'primary') {
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
    .register-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        padding: 20px;
    }

    .logo-section {
        text-align: center;
        margin-bottom: 20px;
    }

    .register-icon {
        font-size: 60px;
        color: var(--ion-color-primary);
        margin-bottom: 10px;
    }

    .logo-section h2 {
        font-size: 24px;
        font-weight: bold;
        color: var(--ion-color-dark);
        margin: 10px 0;
    }

    .subtitle {
        color: var(--ion-color-medium);
        font-size: 14px;
        max-width: 300px;
        margin: 0 auto;
    }

    .register-card {
        width: 100%;
        max-width: 450px;
    }

    .input-item {
        margin-bottom: 16px;
        --background: var(--ion-color-light);
        --border-radius: 8px;
        --padding-start: 16px;
    --padding-end: 16px;
    }

    /* Requisitos de contraseña */
    .password-requirements {
        margin: 16px 0;
        padding: 12px;
        background: var(--ion-color-light);
        border-radius: 8px;
    }

    .password-requirements ul {
        list-style: none;
        padding: 0;
        margin: 8px 0 0 0;
    }

    .password-requirements li {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 6px 0;
        color: var(--ion-color-danger);
        font-size: 13px;
    }

    .password-requirements li.valid {
        color: var(--ion-color-success);
    }

    .password-requirements li ion-icon {
        font-size: 18px;
    }

    .error-message {
        display: block;
        margin: 10px 0;
        text-align: center;
    }

    .register-button {
        margin-top: 20px;
        height: 48px;
        font-weight: 600;
    }

    .terms {
        text-align: center;
        margin-top: 16px;
        color: var(--ion-color-medium);
    }

    .terms a {
        color: var(--ion-color-primary);
        text-decoration: none;
    }

    .login-section {
        text-align: center;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--ion-color-light-shade);
    }

    .login-section p {
        color: var(--ion-color-medium);
        margin-bottom: 10px;
    }

    @media (max-width: 576px) {
    .register-card {
        box-shadow: none;
    }
    }
</style>