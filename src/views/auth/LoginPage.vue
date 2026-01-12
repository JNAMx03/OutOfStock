<template>
    <ion-page>
        <ion-content :fullscreen="true" class="ion-padding">
            <div class ="login-container">
                <!-- logo o nombre -->
                <div class="logo-section">
                    <ion-icon :icon="cubeOutline" class="app-icon"></ion-icon>
                    <h1>Out Of Stock</h1>
                    <p class="subtittle">Gestion integral de inventarios</p>
                </div>

                <ion-card class="login-card">
                    <ion-card-content>
                        <h2 class="form-tittle">Iniciar Sesión</h2>
                        <!-- correo -->
                        <ion-item lines="none" class="input.item">
                            <Ion-label position="floating">Email</Ion-label>
                            <ion-input type="email" v-model="email" placeholder="tu@email.com" @keyup.enter="handleLogin"></ion-input>
                        </ion-item>

                        <!-- contraseña -->
                        <ion-item lines="none" class="input-item">
                            <Ion-label position="floating">Contraseña</Ion-label>
                            <ion-input type="password" v-model="password" placeholder="********" @keyup.enter="handleLogin"></ion-input>
                        </ion-item>

                        <!-- mostrar si existe un error -->
                        <ion-text color="danger" v-if="errorMessage" class="error-message">
                            <p><small>{{errorMessage}}</small></p>
                        </ion-text>
                        
                        <!-- boton login -->
                        <ion-button expand="block" @click="handleLogin" :disabled="isLoading || !email || !password" class="login-button">
                            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                            <span v-else>Iniciar Sesión</span>
                        </ion-button>

                        <!-- link para recuperar contraseña -->
                        <div class="forgot-password">
                            <ion-button fill="clear" size="small" @click="goToForgotPassword">
                                ¿Olvidaste tu contraseña?
                            </ion-button>
                        </div>

                        <!-- divisor xd -->
                        <div class="divider">
                            <span>o</span>
                        </div>

                        <!-- link de registro -->
                        <div class="register-section">
                            <p>¿No tienes cuenta?</p>
                            <ion-button fill="outline" expland="block" @click="goToRegister">
                                Crear cuenta
                            </ion-button>
                        </div>
                    </ion-card-content>
                </ion-card>

                <!-- footer con version ?? -->
                <div clas="footer">
                <p><small>v1.0.0 - Out Of Stock</small></p>
                </div>
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
    import { 
        IonPage,
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
        toastController,
    } from '@ionic/vue';
    import { cubeOutline } from 'ionicons/icons';

    //importa el store de autenticacion
    import { useAuthStore } from '@/stores/auth';

    // ============================================
    // COMPOSABLES
    // ============================================
    const router = useRouter();
    const authStore = useAuthStore();

    // ============================================
    // ESTADO LOCAL (variables reactivas)
    // ============================================

    // Campos del formulario
    const email = ref('');
    const password = ref('');

    // Estados de la UI
    const isLoading = ref(false);
    const errorMessage = ref('');

    // ============================================
    // FUNCIONES
    // ============================================

    /**
     * 🔑 Maneja el login del usuario
     */
    async function handleLogin(){
        //limpiar mensaje de error previo
        errorMessage.value = '';

        //validacion basica
        if(!email.value || !password.value){
            errorMessage.value = 'Por favor completa todos los campos.';
            return;
        }

        //activar estado de carga
        isLoading.value = true;

        try{
            //intentar login usando el store
            const result = await authStore.login(email.value, password.value);

            if (result.success){
                //login exitoso
                await showToast('Inicio de sesión exitoso', 'success');
                //redidirigir al dashboard
                router.push('/dashboard');
            }else{
                //login fallo
                errorMessage.value = result.message || 'Error al iniciar sesión. Por favor intenta de nuevo.';
                await showToast(errorMessage.value, 'danger');
            }
        }catch (error: any){
            console.error('Login error:', error);
            errorMessage.value = 'Error al iniciar sesión. Por favor intenta de nuevo.';
            await showToast(errorMessage.value, 'danger');
        }finally{
            isLoading
        }
    }
        // navega a la pagina de recuperacion de constraseña
        function goToForgotPassword(){
            router.push('/forgot-password');
        }

        //navega a la pagina de registro
        function goToRegister(){
            router.push('/register');
        }

        /**
         * 🍞 Muestra un toast (notificación temporal)
         * @param message - Mensaje a mostrar
         * @param color - Color del toast (success, danger, warning)
         */
        async function showToast(message: string, color: string ='primary'){
            const toast = await toastController.create({
                message: message,
                duration: 3000,
                position: 'top',
                color: color,
            });
            await toast.present();
        }
</script>

* ============================================
   ESTILOS DEL COMPONENTE
   ============================================ */


<style scoped>

/* Contenedor principal centrado */
.login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    align-items: center;
    min-height: 100%;
    padding: 20px;
}

/* logo o nombre */
.logo-section {
    text-align: center;
    margin-bottom: 30px;
}

.app-icon {
    font-size: 80px;
    color: var(--ion-color-primary);
    margin-bottom: 10px;    
}

.logo-section h1{
    font-size: 32px;
    font-weight: bold;
    color: var(--ion-color-primary);
    margin: 0;
}

.subtittle {
    font-size: 14px;
    color: var(--ion-color-medium);
}

/* card formulario */
.login-card{
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.form-tittle{
    text-align: center;
    margin-bottom: 20px;
    color: var(--ion-color-primary);
}

/* items del formulario */
.input-item{
    margin-bottom: 16px;
    --background: var(--ion-color-light);
    --border-radius: 8px;
    --padding-start: 16px;
    --paffing-end: 16px;
}

/* mensaje error */
.error-message {
    display: block;
    margin: 10px 0;
    text-align: center;
}

/* boton de login */
.login-button{
    margin-top: 20px;
    height: 48px;
    font-weight: 600;
}

/* link de recuperacion de contraseña */
.forgot-password {
    text-align: center;
    margin-top: 10px;
}

/* divisor */
.divider{
    display: flex;
    align-items: center;
    text-align: center;
    margin: 20px 0;
    color: var(--ion-color-medium);
}

.divider::before,
.divider::after{
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--ion-color-light-shade);
}

.divider span{
    padding: 0 10px;
}

/* seccionde registro */
.register-section{
    text-align: center;
}

.register-section p{
    margin-bottom: 10px;
    color: var(--ion-color-medium);
}

/* footer */
.footer{
    margin-top: 30px;
    text-align: center;
    color: var(--ion-color-medium);
}

/* responsive para pantallas pequeñas */
@media (max-width: 576px){
    .login-card{
        box-shadow: none;
    }

    .app-icon{
        font-size: 60px;
    }

    .logo-section h1{
        font-size: 28px;
    }
}
</style>