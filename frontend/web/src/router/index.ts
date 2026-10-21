import { createRouter, createWebHistory } from 'vue-router'
import { consumeHandoffToken, getToken, goH5 } from '@our-pact/shared'
import AppLayout from '@/layouts/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import PortalView from '@/views/PortalView.vue'
import HomeView from '@/views/HomeView.vue'
import ProfileView from '@/views/ProfileView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/portal', name: 'portal', component: PortalView, meta: { portal: true } },
    {
      path: '/',
      component: AppLayout,
      meta: { admin: true },
      children: [
        { path: '', redirect: { name: 'home' } },
        { path: 'home', name: 'home', component: HomeView },
        { path: 'profile', name: 'profile', component: ProfileView },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  consumeHandoffToken()
  const auth = useAuthStore()
  auth.token = getToken()
  const loggedIn = Boolean(auth.token)

  if (to.name === 'login') {
    if (!loggedIn) {
      return true
    }
    try {
      await auth.ensureProfile()
      if (auth.isSuperAdmin) {
        return { name: 'portal' }
      }
      goH5(auth.token)
      return false
    } catch {
      await auth.logout()
      return true
    }
  }

  if (!loggedIn) {
    return { name: 'login' }
  }

  try {
    await auth.ensureProfile()
  } catch {
    await auth.logout()
    return { name: 'login' }
  }

  if (to.meta.portal) {
    if (!auth.isSuperAdmin) {
      goH5(auth.token)
      return false
    }
    return true
  }

  if (to.meta.admin || to.matched.some((record) => record.meta.admin)) {
    if (!auth.isSuperAdmin) {
      goH5(auth.token)
      return false
    }
  }

  return true
})

export default router
