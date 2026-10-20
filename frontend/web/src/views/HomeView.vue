<template>
  <div class="layout">
    <header class="topbar">
      <strong>你我约定</strong>
      <span>管理端</span>
      <el-button class="logout" @click="onLogout">退出登录</el-button>
    </header>
    <main class="content">
      <el-card shadow="never">
        <template #header>
          <div class="card-head">
            <span>当前登录用户</span>
            <el-button type="primary" link :loading="loading" @click="loadProfile">重新获取</el-button>
          </div>
        </template>
        <p class="api">该页面调用 GET /api/auth/me</p>
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" />
        <el-descriptions v-else-if="auth.profile" :column="1" border>
          <el-descriptions-item label="用户编号">{{ auth.profile.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ auth.profile.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ auth.profile.nickname }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDateTime(auth.profile.createTime) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatDateTime, getToken } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')

async function loadProfile() {
  loading.value = true
  errorMessage.value = ''
  try {
    await auth.loadProfile()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '获取用户失败'
    if (!getToken()) {
      auth.token = ''
      await router.replace({ name: 'login' })
    }
  } finally {
    loading.value = false
  }
}

async function onLogout() {
  await auth.logout()
  await router.replace({ name: 'login' })
}

onMounted(loadProfile)
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 24px;
  background: #1c1917;
  color: #f5f5f4;
}

.topbar span {
  color: #d6d3d1;
}

.logout {
  margin-left: auto;
}

.content {
  width: min(720px, calc(100% - 32px));
  margin: 28px auto;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.api {
  margin-top: 0;
  color: #78716c;
}
</style>
