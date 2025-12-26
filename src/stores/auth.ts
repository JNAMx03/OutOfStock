import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
//import {Auth} from 'aws-amplify';
import { signIn, signOut, signUp, confirmSignUp, resendSignUpCode, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

//INTERFACES

//roles de usuario
export type UserRole = 'owner' | 'admin' | 'seller';

//estructura del usuario autenticado
export interface User{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    storeIds: string[];             //IDs de las tiendas asociadas al usuario
    currentStoreId: string | null;  //ID de la tienda actualmente seleccionada
    avatar?: string;
    phone?: string;
}

//STORE DE AUTENTICACIÓN

export const useAuthStore = defineStore('auth', () => {

    //ESTDO, variables reactivas

    //usuario local (null si no esta logueado)
    const user = ref<User | null>(null);

    //indica si estamos verficados la sesion al carga la app
    const isLoading = ref(false);

    //token de autenticación (lo de AWS  Cognito)
    const authToken = ref<string | null>(null);

    //GETTERS (computed) -valores calculados

    //verifica si hay un usuario logueado
    const isAuthenticated = computed(() => user.value !== null);

    //obtiene el rol del usuario actual
    const userRole = computed(() => user.value?.role || null);

    //verifica si el usuario es dueño
    const isOwner = computed(() => user.value?.role === 'owner');

    //verifica si el usuario es admin
    const isAdmin = computed(() => user.value?.role === 'admin');

    //verifica si el usuario es vendedor
    const isSeller = computed(() => user.value?.role === 'seller');

    //obtiene la tienda actual seleccionada
    const currentStore = computed(() => user.value?.currentStoreId);

    //ACTIONS (acciones) - funciones del store

    /**
   * LOGIN - Inicia sesión del usuario
   * @param email - Email del usuario
   * @param password - Contraseña
   * @returns Promise con el resultado
   */
  
    async function login(email: string, password: string){
        try{
            isLoading.value = true;

            //intenta autenticar con aws cognito
            await signIn({username: email, password});
            //obtiene el token de sesion
            const session = await fetchAuthSession();
            authToken.value = session.tokens?.accessToken?.toString() || null;

            //obtiene los atributos del usuario desde cognito
            const currentUser = await getCurrentUser();

            // TODO: En el futuro, obtendremos el rol y tiendas desde la base de datos
            // Por ahora, asignamos valores por defecto
            user.value ={
                id: currentUser.username,
                email: email,
                name: currentUser.username || 'Usuario',
                role: 'owner', //por defecto, el primer usuario es dueño
                storeIds: [],
                currentStoreId: null,
                avatar: undefined,
            };

            return { success: true };
        }catch(error: any){
            console.error('Error en login:', error);

            //manejo de errores especificos
            let errorMessage = 'Error al iniciar sesión';

            if(error.code === "UserNotFounfException"){
                errorMessage = 'Usuario no encontrado';
            }else if(error.code === "NotAuthorizedException"){
                errorMessage = 'Email o Contraseña incorrecta';
            }else if(error.code === "UserNotConfirmedException"){
                errorMessage = 'Debes confirmar tu email primero';
            }   
            return{ success: false, message: errorMessage };
        }finally{
            isLoading.value = false;
        }
    }

    /**
   * REGISTER - Registra un nuevo usuario
   * @param email - Email del nuevo usuario
   * @param password - Contraseña
   * @param name - Nombre completo
   * @returns Promise con el resultado
   */

    async function register(email: string, password: string, name: string){
        try{
            isLoading.value = true;

            //registra el usuario en aws cognito
            await signUp({
                username: email,
                password: password,
                options: {
                    userAttributes: {
                        email: email,
                        name: name,
                    },
                }
            });
            return{
                success: true,
                message: 'Regsitro exitoso. Revisa tu email para confirmar tu cuenta'
            };
        }catch(error: any){
            console.error('Error en registro:', error);

            let errorMessage = 'Error al registrar usuario';

            if(error.code === "UsernameExistsException"){
                errorMessage = 'El email ya está en uso';
            }else if(error.code === "InvalidPasswordException"){
                errorMessage = 'La contraseña no cumple con los requisitos';
            }else if(error.code === "InvalidParameterException"){
                errorMessage = 'Email o contraseña inválidos';
            }

            return{ success: false, message: errorMessage };
        }finally{
            isLoading.value = false;
        }
    }

    /**
   * CONFIRM EMAIL - Confirma el email del usuario
   * @param email - Email del usuario
   * @param code - Código de confirmación recibido por email
   * @returns Promise con el resultado
   */

    async function confirmEmail(email: string, code: string){
        try{
            isLoading.value = true;

            await confirmSignUp({
                username: email,
                confirmationCode: code
            });

            return{
                success: true,
                message: 'Email confirmado exitosamente, Ya puedes iniciar sesión'
            };
        }catch(error: any){
            console.error('Error en confirmación de email:', error);

            let errorMessage = 'Error al confirmar email';

            if(error.code === "CodeMismatchException"){
                errorMessage = 'Código de confirmación incorrecto';
            }else if(error.code === "ExpiredCodeException"){
                errorMessage = 'El código de confirmación ha expirado';
            }

            return{ success: false, message: errorMessage };
        }finally{
            isLoading.value = false;
        }      
    }

    /**
   * RESEND CONFIRMATION CODE - Reenvía el código de confirmación
   * @param email - Email del usuario
   * @returns Promise con el resultado
   */

    async function resendConfirmationCode(email: string){
        try{
            await resendSignUpCode({
                username: email
            });

            return{
                success: true,
                message: 'Código de confirmación reenviado. Revisa tu email.'
            };
        }catch(error: any){
            console.error('Error al reenviar código de confirmación:', error);

            return{
                success: false,
                message: 'Error al reenviar el código de confirmación'
            };
        }
    }

    /**
    * LOGOUT - Cierra sesión del usuario
    */

    async function logout(){
        try{
            await signOut();
            user.value = null;
            authToken.value = null;
        }catch(error){
            console.error('Error en logout;', error);
        }
    }

    /**
    * CHECK SESSION - Verifica si hay una sesión activa
    * Se ejecuta al cargar la app para restaurar sesión
    */

    async function checkSession(){
        try{
            isLoading.value = true;
            
            //intenta obtener el usuario actual de AWS Cognito
            const currentUser = await getCurrentUser();
            const session = await fetchAuthSession();
            authToken.value = session.tokens?.accessToken?.toString() || null;

            //restaura los datos del usuario
            //TODO: obtener datos completos de desde la base de datos
            user.value ={
                id: currentUser.username,
                email: currentUser.signInDetails?.loginId || '',
                name: currentUser.signInDetails?.loginId || 'Usuario',
                role: 'owner', //por defecto, el primer usuario es dueño
                storeIds: [],
                currentStoreId: null,
                avatar: undefined,
            };
        }catch(error){
            //no hay sesión activa
            user.value = null;
            authToken.value = null;
        }finally{
            isLoading.value = false;
        }
    }

    /**
    * SET CURRENT STORE - Cambia la tienda actual
    * @param storeId - ID de la tienda a seleccionar
    */

    function setCurrentStore(storeId: string){
        if(user.value){
            user.value.currentStoreId = storeId;
        }
    }

    /**
    * UPDATE USER - Actualiza datos del usuario
    * @param updates - Objeto con los campos a actualizar
    */

    function updateUser(updates: Partial<User>){
        if(user.value){
            user.value = { ...user.value, ...updates };
        }
    }

    //RETURN - expone el estado, getters y acciones del store
    return{
        //estado
        user,
        isLoading,
        authToken,

        //getters
        isAuthenticated,
        userRole,
        isOwner,
        isAdmin,
        isSeller,
        currentStore,

        //acciones
        login,
        register,
        confirmEmail,
        resendConfirmationCode,
        logout,
        checkSession,
        setCurrentStore,
        updateUser,
    };
});

    

// ============================================
// EXPLICACIÓN SIMPLE:
// ============================================
// Este store es como la "memoria" de autenticación de la app.
// 
// Guarda:
// - Quién está logueado
// - Su rol (dueño, admin, vendedor)
// - Sus permisos
// - Su token de sesión
//
// Proporciona funciones para:
// - Iniciar sesión (login)
// - Registrarse (register)
// - Confirmar email (confirmEmail)
// - Cerrar sesión (logout)
// - Verificar sesión activa (checkSession)
//
// Cualquier componente de la app puede usar este store
// para saber si hay un usuario logueado y qué permisos tiene.
// ============================================