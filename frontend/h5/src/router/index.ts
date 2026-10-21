import { createRouter, createWebHistory } from 'vue-router'
import { consumeHandoffToken, getToken, goLogin } from '@our-pact/shared'
import HomeView from '@/views/HomeView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ProfileEditView from '@/views/ProfileEditView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', redirect: () => {
      goLogin()
      return '/home'
    } },
    { path: '/home', name: 'home', component: HomeView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/profile/edit', name: 'profile-edit', component: ProfileEditView },
  ],
})

router.beforeEach(async (to) => {
  consumeHandoffToken()
  const auth = useAuthStore()
  auth.syncToken()

  if (!getToken()) {
    goLogin()
    return false
  }

  try {
    await auth.ensureProfile()
  } catch {
    await auth.logout()
    goLogin()
    return false
  }

  return true
})

export default router
