<template>
  <main class="login-page">
    <section class="panel">
      <h1>饭否</h1>
      <p class="desc">管理端登录后会调用后端示例接口，读取当前用户。</p>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @submit.prevent>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="admin" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="123456" />
        </el-form-item>
        <el-button type="primary" class="submit" :loading="loading" @click="onSubmit">登录</el-button>
      </el-form>
      <p class="hint">示例账号 admin / 123456</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({
  username: 'admin',
  password: '123456',
})
const rules: FormRules = {
  username: [{ required: true, message: '请填写用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请填写密码', trigger: 'blur' }],
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    await router.push({ name: 'home' })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.panel {
  width: min(420px, 100%);
  padding: 32px 28px;
  background: #fffdf8;
  border: 1px solid #e7e0d4;
  border-radius: 16px;
}

h1 {
  margin: 8px 0 0;
  font-size: 32px;
  font-weight: 600;
}

.desc,
.hint {
  color: #78716c;
  line-height: 1.6;
}

.submit {
  width: 100%;
}
</style>
