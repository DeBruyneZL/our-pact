import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@our-pact/shared'
import LoginView from '@/views/LoginView.vue'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/home', name: 'home', component: HomeView },
  ],
})

router.beforeEach((to) => {
  const loggedIn = Boolean(getToken())
  if (!to.meta.public && !loggedIn) {
    return { name: 'login' }
  }
  if (to.name === 'login' && loggedIn) {
    return { name: 'home' }
  }
  return true
})

export default router
