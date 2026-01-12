import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

// Imporata Ionic Vue y sus estilos
import { IonicVue } from '@ionic/vue';

// Importa Pinia (gestor de estado global)
import { createPinia } from 'pinia';

// Importa Amplify y su configuración
import { Amplify } from 'aws-amplify';
// @ts-expect-error AWS exports file lacks TypeScript declarations
import awsconfig from './aws-exports.d.js';
Amplify.configure(awsconfig);

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

// ============================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ============================================

// Crea una instancia de Pinia (nuestro gestor de estado)
// Pinia es como una "memoria global" que todas las páginas pueden usar
const pinia = createPinia();

// Crea la aplicación Vue
const app = createApp(App)
  .use(IonicVue) //componentes moviles nativos
  .use(router) //sistema de navegacion
  .use(pinia); //gestor de estado global

// ============================================
// ESPERAR A QUE EL ROUTER ESTÉ LISTO
// ============================================

// Espera a que el router esté listo antes de montar la app
// Esto evita errores de navegación
router.isReady().then(() => {
  // Monta la aplicación en el elemento con id="app" del index.html
  // Es como "encender" la aplicación
  app.mount('#app');
});
