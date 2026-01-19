// ============================================
// IMPORTS
// ============================================
import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

// ============================================
// DEFINICIÓN DE RUTAS
// ============================================
const routes: Array<RouteRecordRaw> = [

  // ==========================================
  // RUTA RAÍZ (/)
  // ==========================================
  {
    path: '/',
    redirect: '/login', //redirige directamente al login
  },

  // ==========================================
  // RUTAS DE AUTENTICACIÓN (Públicas)
  // ==========================================
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: { requiresAuth: false}, //no requiere estar logueado
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterPage.vue'),
    meta: { requiresAuth: false},
  },
  {
    path: '/confirm-email',
    name: 'ConfirmEmail',
    component: () => import('@/views/auth/ConfirmEmailPage.vue'),
    meta: { requiresAuth: false},
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordPage.vue'),
    meta: { requiresAuth: false},
  },

  // ==========================================
  // RUTAS PROTEGIDAS (Requieren autenticación)
  // ==========================================
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardPage.vue'),
    meta: { requiresAuth: true, //requiere estar logueado
      roles: ['owner', 'admin', 'seller'], //todos los roles pueden acceder
    },
  },

  // ==========================================
  // RUTA 404 (Página no encontrada)
  // ==========================================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundPage.vue'),
  }
];

// ============================================
// CREAR EL ROUTER
// ============================================
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ============================================
// NAVIGATION GUARDS (Guardias de navegación)
// ============================================

/**
 * Guard: Verificar autenticación antes de cada ruta
 * 
 * Este guard se ejecuta ANTES de navegar a cualquier página.
 * Sirve para:
 * 1. Verificar si el usuario está logueado
 * 2. Redirigir a login si intenta acceder a páginas protegidas
 * 3. Verificar permisos según roles
 */
router.beforeEach(async (to, from, next)=>{
  // Obtener el store de autenticación
  const authStore = useAuthStore();

  // ==========================================
  // 1. VERIFICAR SESIÓN (solo la primera vez)
  // ==========================================
  // Si aún no hemos verificado la sesión, hacerlo ahora
  if(authStore.user === null &&  !authStore.isLoading){
    await authStore.checkSession();
  }

  // ==========================================
  // 2. VERIFICAR SI LA RUTA REQUIERE AUTH
  // ==========================================
  const requiresAuth = to.meta.requiresAuth as boolean;
  const isAuthenticated = authStore.isAuthenticated;

  // Si la ruta requiere autenticación y el usuario NO está logueado
  if(requiresAuth && !isAuthenticated){
    // Redirigir a login
    next({
      name: 'Login',
      query: { redirect: to.fullPath}, //guardar a donde quiera ir
    });
    return;
  }

  // ==========================================
  // 3. VERIFICAR ROLES (si la ruta los requiere)
  // ==========================================
  const requiredRole = to.meta.roles as string[] | undefined;

  if(requiresAuth && requiredRole && authStore.user){
    const userRole = authStore.user.role;

    // Verificar si el usuario tiene el rol requerido 
    if(!requiredRole.includes(userRole)){
      // El usuario no tiene permisos para esta página
      next({name: 'Dashboard'});
      return;
    }
  }

  // ==========================================
  // 4. EVITAR QUE USUARIOS LOGUEADOS VEAN LOGIN
  // ==========================================
  // Si el usuario ya está logueado y intenta ir a login/register
  if(isAuthenticated && !requiresAuth){
    next({name: 'Dashboard'});
    return;
  }

  // ==========================================
  // 5. TODO OK, PERMITIR NAVEGACIÓN
  // ==========================================
  next();
});

// ============================================
// EXPORTAR EL ROUTER
// ============================================
export default router;