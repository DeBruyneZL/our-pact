import { createRouter, createWebHistory } from 'vue-router'
import { consumeHandoffToken, getToken } from '@our-pact/shared'
import AppLayout from '@/layouts/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DishesView from '@/views/dishes/DishesView.vue'
import ActivitiesView from '@/views/activities/ActivitiesView.vue'
import NoticesView from '@/views/notices/NoticesView.vue'
import UsersView from '@/views/users/UsersView.vue'
import ProfileView from '@/views/ProfileView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    {
      path: '/',
      component: AppLayout,
      meta: { admin: true },
      children: [
        { path: '', redirect: { name: 'dishes' } },
        { path: 'dishes', name: 'dishes', component: DishesView },
        { path: 'activities', name: 'activities', component: ActivitiesView },
        { path: 'notices', name: 'notices', component: NoticesView },
        { path: 'users', name: 'users', component: UsersView },
        { path: 'profile', name: 'profile', component: ProfileView },
        { path: 'home', redirect: { name: 'dishes' } },
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
      if (!auth.isSuperAdmin) {
        await auth.logout()
        return true
      }
      return { name: 'dishes' }
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

  if (!auth.isSuperAdmin) {
    await auth.logout()
    return { name: 'login', query: { denied: '1' } }
  }

  return true
})

export default router
