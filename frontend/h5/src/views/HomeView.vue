<template>
  <div class="page">
    <van-nav-bar title="当前用户" right-text="退出" @click-right="onLogout" />
    <p class="api">该页面调用 GET /api/auth/me</p>
    <van-empty v-if="errorMessage" :description="errorMessage" />
    <van-cell-group v-else inset>
      <van-cell title="用户编号" :value="text(auth.profile?.id)" />
      <van-cell title="用户名" :value="text(auth.profile?.username)" />
      <van-cell title="昵称" :value="text(auth.profile?.nickname)" />
      <van-cell title="注册时间" :value="formatDateTime(auth.profile?.createTime)" />
    </van-cell-group>
    <div class="actions">
      <van-button block round plain type="primary" :loading="loading" @click="loadProfile">重新获取</van-button>
    </div>
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

function text(value: string | number | undefined) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

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
.page {
  min-height: 100vh;
}

.api {
  margin: 16px;
  color: #78716c;
  font-size: 14px;
}

.actions {
  margin: 24px 16px;
}
</style>
