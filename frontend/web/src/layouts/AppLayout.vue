<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <BrandLogo size="md" />
        <p class="sub">管理端</p>
      </div>
      <nav class="menu">
        <RouterLink :class="{ active: route.name === 'dishes' }" :to="{ name: 'dishes' }">菜单维护</RouterLink>
        <RouterLink :class="{ active: route.name === 'activities' }" :to="{ name: 'activities' }">活动记录</RouterLink>
        <RouterLink :class="{ active: route.name === 'notices' }" :to="{ name: 'notices' }">消息记录</RouterLink>
        <RouterLink :class="{ active: route.name === 'users' }" :to="{ name: 'users' }">用户列表</RouterLink>
      </nav>
      <div v-if="auth.profile" class="sidebar-foot">
        <el-dropdown trigger="click" placement="top-start" @command="onCommand">
          <button class="profile-trigger" type="button">
            <el-avatar :size="34" :src="auth.profile.avatar || undefined">{{ initial }}</el-avatar>
            <span class="name">{{ auth.displayName }}</span>
            <span class="caret">▴</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>
    <section class="main">
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
import { useAuthStore } from '@/stores/auth'
import BrandLogo from '@/components/BrandLogo.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const initial = computed(() => auth.displayName.slice(0, 1))

onMounted(() => {
  auth.ensureProfile().catch(() => undefined)
})

function onCommand(command: string) {
  if (command === 'profile') {
    void router.push({ name: 'profile' })
    return
  }
  if (command === 'logout') {
    void onLogout()
  }
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
  background: #e7f0eb;
}

.sidebar {
  display: flex;
  flex-direction: column;
  padding: 24px 12px;
  background: #e7f0eb;
  border-right: 1px solid #d3e2da;
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

.menu a {
  display: block;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  border-radius: 10px;
  color: #3f5248;
  background: transparent;
  text-decoration: none;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.menu a.active,
.menu a:hover {
  background: #fff;
  color: var(--brand-dark);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(44, 42, 38, 0.08);
}

.sidebar-foot {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #d3e2da;
}

.sidebar-foot :deep(.el-dropdown) {
  display: block;
  width: 100%;
}

.main {
  min-width: 0;
  background: var(--surface);
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.profile-trigger:hover {
  background: rgba(91, 143, 122, 0.12);
}

.profile-trigger :deep(.el-avatar) {
  flex-shrink: 0;
  background: var(--brand);
  color: #fff;
  font-weight: 600;
}

.profile-trigger .name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.profile-trigger .caret {
  color: var(--muted);
  font-size: 11px;
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
    border-bottom: 1px solid #d3e2da;
  }

  .body {
    padding: 20px 16px 40px;
  }
}
</style>
