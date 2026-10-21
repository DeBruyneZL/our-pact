<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <BrandLogo size="md" />
        <p class="sub">超级管理端</p>
      </div>
      <nav class="menu">
        <RouterLink :class="{ active: route.name === 'dishes' }" :to="{ name: 'dishes' }">菜单维护</RouterLink>
        <RouterLink :class="{ active: route.name === 'activities' }" :to="{ name: 'activities' }">活动记录</RouterLink>
        <RouterLink :class="{ active: route.name === 'users' }" :to="{ name: 'users' }">用户列表</RouterLink>
        <RouterLink :class="{ active: route.name === 'profile' }" :to="{ name: 'profile' }">个人中心</RouterLink>
        <button class="switch" type="button" @click="enterH5">切换用户端</button>
        <RouterLink class="switch-link" :to="{ name: 'portal' }">返回选端</RouterLink>
      </nav>
      <div class="account" v-if="auth.profile">
        <el-avatar :size="38" :src="auth.profile.avatar || undefined">{{ initial }}</el-avatar>
        <div class="account-text">
          <strong>{{ auth.displayName }}</strong>
          <span>超级管理员</span>
        </div>
        <el-button link type="primary" @click="onLogout">退出</el-button>
      </div>
    </aside>
    <section class="main">
      <header class="topbar">
        <div>
          <p class="crumb">饭否 / {{ pageTitle }}</p>
          <h1>{{ pageTitle }}</h1>
        </div>
      </header>
      <div class="body">
        <RouterView />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { goH5 } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'
import BrandLogo from '@/components/BrandLogo.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    dishes: '菜单维护',
    activities: '活动记录',
    users: '用户列表',
    profile: '个人中心',
  }
  return map[String(route.name)] || '管理端'
})
const initial = computed(() => auth.displayName.slice(0, 1))

onMounted(() => {
  auth.ensureProfile().catch(() => undefined)
})

function enterH5() {
  goH5(auth.token)
}

async function onLogout() {
  try {
    await ElMessageBox.confirm('确认退出当前账号？', '退出登录', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  await auth.logout()
  await router.replace({ name: 'login' })
}
</script>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
  background: var(--paper);
}

.sidebar {
  display: flex;
  flex-direction: column;
  padding: 24px 12px;
  background: #faf8f3;
  border-right: 1px solid var(--line);
  color: var(--ink);
}

.brand {
  padding: 8px 12px 20px;
}

.sub {
  margin: 8px 0 0;
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.menu {
  display: grid;
  gap: 4px;
}

.menu a,
.menu .switch {
  display: block;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  border-radius: 10px;
  color: #5c5852;
  background: transparent;
  text-decoration: none;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.menu a.active,
.menu a:hover,
.menu .switch:hover {
  background: rgba(91, 143, 122, 0.12);
  color: var(--brand-dark);
  font-weight: 600;
}

.switch-link {
  margin-top: 4px;
  color: var(--muted) !important;
  font-size: 13px;
}

.account {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  gap: 10px;
  align-items: center;
  margin-top: auto;
  padding: 16px 8px 6px;
  border-top: 1px solid var(--line);
}

.account-text {
  min-width: 0;
}

.account-text strong,
.account-text span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-text span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
}

.main {
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  min-height: 72px;
  padding: 14px 28px;
  background: rgba(255, 252, 247, 0.92);
  border-bottom: 1px solid var(--line);
}

.crumb {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 12px;
}

.topbar h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}

.body {
  padding: 24px 28px 40px;
}

@media (max-width: 860px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }
}
</style>
