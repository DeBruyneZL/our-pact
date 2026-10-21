<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="mark">饭</span>
        <div>
          <strong>饭否</strong>
          <p>超级管理端</p>
        </div>
      </div>
      <nav class="menu">
        <RouterLink :class="{ active: route.name === 'home' }" :to="{ name: 'home' }">
          <span class="dot" />
          工作台
        </RouterLink>
        <RouterLink :class="{ active: route.name === 'profile' }" :to="{ name: 'profile' }">
          <span class="dot" />
          个人中心
        </RouterLink>
        <button class="switch" type="button" @click="enterH5">
          <span class="dot" />
          切换用户端
        </button>
        <RouterLink class="switch-link" :to="{ name: 'portal' }">
          <span class="dot" />
          返回选端
        </RouterLink>
      </nav>
      <div class="account" v-if="auth.profile">
        <el-avatar :size="38" :src="auth.profile.avatar || undefined">{{ initial }}</el-avatar>
        <div class="account-text">
          <strong>{{ auth.displayName }}</strong>
          <span>超级管理员</span>
        </div>
        <el-button text class="logout" @click="onLogout">退出</el-button>
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

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const pageTitle = computed(() => (route.name === 'profile' ? '个人中心' : '工作台'))
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
  grid-template-columns: 248px 1fr;
  min-height: 100vh;
  background: var(--paper);
}

.sidebar {
  display: flex;
  flex-direction: column;
  padding: 22px 14px;
  background:
    linear-gradient(180deg, #102319 0%, #0d1a14 100%);
  color: #e8f2ec;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 10px 28px;
}

.mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(145deg, #2a8f62, #145338);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

.brand strong {
  display: block;
  font-size: 18px;
}

.brand p {
  margin: 3px 0 0;
  color: #9bb5a8;
  font-size: 12px;
}

.menu {
  display: grid;
  gap: 8px;
}

.menu a,
.menu .switch {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 13px 14px;
  border: 0;
  border-radius: 12px;
  color: #c5d7cd;
  background: transparent;
  text-decoration: none;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.menu a .dot,
.menu .switch .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
}

.menu a.active,
.menu a:hover,
.menu .switch:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.menu a.active .dot {
  background: #7ed0a7;
  box-shadow: 0 0 0 4px rgba(126, 208, 167, 0.16);
}

.switch-link {
  margin-top: 4px;
}

.account {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  gap: 10px;
  align-items: center;
  margin-top: auto;
  padding: 16px 8px 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #9bb5a8;
  font-size: 12px;
}

.logout {
  color: #c5d7cd !important;
}

.main {
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  min-height: 72px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(8px);
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
</style>
