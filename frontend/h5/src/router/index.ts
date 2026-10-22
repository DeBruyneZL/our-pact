import { createRouter, createWebHistory } from 'vue-router'
import { consumeHandoffToken, getToken, goLogin } from '@our-pact/shared'
import TabLayout from '@/layouts/TabLayout.vue'
import MenuView from '@/views/menu/MenuView.vue'
import ActivitiesView from '@/views/activities/ActivitiesView.vue'
import MineView from '@/views/mine/MineView.vue'
import ProfileEditView from '@/views/ProfileEditView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      redirect: () => {
        goLogin()
        return { name: 'menu' }
      },
    },
    {
      path: '/',
      component: TabLayout,
      children: [
        { path: '', redirect: { name: 'menu' } },
        { path: 'menu', name: 'menu', component: MenuView },
        { path: 'activities', name: 'activities', component: ActivitiesView },
        { path: 'mine', name: 'mine', component: MineView },
      ],
    },
    { path: '/profile', redirect: { name: 'mine' } },
    { path: '/profile/edit', name: 'profile-edit', component: ProfileEditView },
    { path: '/home', redirect: { name: 'menu' } },
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
