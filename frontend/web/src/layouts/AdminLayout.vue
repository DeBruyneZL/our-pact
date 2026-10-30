<template>
  <div class="admin-shell">
    <aside class="admin-nav">
      <div class="brand">
        <p class="mark">Admin</p>
        <BrandLogo size="md" />
      </div>
      <el-menu :default-active="active" router>
        <el-menu-item index="/shop">店铺介绍</el-menu-item>
        <el-menu-item index="/dishes">菜单维护</el-menu-item>
        <el-menu-item index="/activities">活动记录</el-menu-item>
        <el-menu-item index="/users">用户列表</el-menu-item>
      </el-menu>
      <div class="nav-foot">
        <span>{{ auth.profile?.nickname || auth.profile?.username || '管理员' }}</span>
        <el-button link type="primary" @click="onLogout">退出</el-button>
      </div>
    </aside>
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BrandLogo from '@/components/BrandLogo.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const active = computed(() => {
  if (route.path.startsWith('/shop')) return '/shop'
  if (route.path.startsWith('/dishes')) return '/dishes'
  if (route.path.startsWith('/activities')) return '/activities'
  if (route.path.startsWith('/users')) return '/users'
  return route.path
})

async function onLogout() {
  await auth.logout()
  await router.replace({ name: 'login' })
}

onMounted(() => {
  if (!auth.profile) {
    void auth.loadProfile().catch(() => undefined)
  }
})
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 220px 1fr;
}

.admin-nav {
  background: #faf8f3;
  border-right: 1px solid #e5e1d8;
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.brand {
  padding: 8px 12px 20px;
}

.mark {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #5b8f7a;
  font-weight: 700;
}

.admin-nav :deep(.el-menu) {
  border-right: none;
  background: transparent;
}

.nav-foot {
  margin-top: auto;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #8a8680;
  font-size: 13px;
}

.admin-main {
  padding: 28px 32px 48px;
  min-width: 0;
}

@media (max-width: 860px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .admin-nav {
    border-right: none;
    border-bottom: 1px solid #e5e1d8;
  }

  .admin-main {
    padding: 20px 16px 40px;
  }
}
</style>
