<template>
  <!-- 
    IonApp: Componente raíz de Ionic
    Todos los componentes de Ionic deben estar dentro de este
  -->
  <ion-app>
    <!-- 
      IonRouterOutlet: Donde se renderizan las páginas
      Es como un "contenedor" que muestra la página actual
    -->
    <ion-router-outlet/>
  </ion-app>
</template>

// ============================================
// IMPORTS
// ============================================

<script setup lang="ts">
  import { IonApp, IonRouterOutlet } from '@ionic/vue';
  import { onMounted } from 'vue';
  import { useAuthStore } from '@/stores/auth';

  // ============================================
  // SETUP
  // ============================================

  const authStore = useAuthStore();

  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * onMounted: Se ejecuta cuando el componente se monta
   * 
   * Aquí verificamos si hay una sesión activa (token guardado)
   * Esto permite que el usuario permanezca logueado aunque
   * cierre y abra la app
   */

  onMounted(async () =>{
    console.log('app iniciada - verificando sesion...');

    try{
      // intenta restairar la sesion desde aws cognito
      await authStore.checkSession();

      if( authStore.isAuthenticated){
        console.log('sesion restaurada:', authStore.user?.email);
      }else{
        console.log('no hay sesion activa');
      }
    }catch(error){
      console.error('error al verificar sesion:', error);
    }
  });
</script>

/* ============================================
   ESTILOS GLOBALES
   ============================================ */

/* 
  Estos estilos se aplican a TODA la app 
  No tienen 'scoped' porque necesitamos que sean globales
*/

/* Variables personalizadas (las definiremos mejor después) */

<style>
  :root{
    --app-background: #121212;
  }

  /*fondo de la app*/
  ion-content{
    --background: var(--app-background);
  }

  /*scroll siave en toda la app*/
  *{
    scroll-behavior: smooth
  }
</style>