<template>
  <div class="page">
    <van-nav-bar title="你我约定" />
    <p class="intro">登录后进入首页，首页会请求后端的当前用户接口。</p>
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="用户名"
          placeholder="admin"
          :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="123456"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
      </van-cell-group>
      <div class="actions">
        <van-button round block type="primary" native-type="submit" :loading="loading">登录</van-button>
      </div>
    </van-form>
    <p class="hint">示例账号 admin / 123456</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const username = ref('admin')
const password = ref('123456')
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    await router.push({ name: 'home' })
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 32px;
}

.intro,
.hint {
  margin: 16px 16px 8px;
  color: #78716c;
  line-height: 1.6;
  font-size: 14px;
}

.actions {
  margin: 24px 16px 0;
}
</style>
