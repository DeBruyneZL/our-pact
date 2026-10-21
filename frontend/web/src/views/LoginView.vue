<template>
  <main class="login-page">
    <section class="brand-panel">
      <div class="brand-inner">
        <p class="eyebrow">FANFOU</p>
        <h1>饭否</h1>
        <p class="lead">统一登录入口。登录后普通用户进入用户端，超级管理员可自行选择进入管理端或用户端。</p>
      </div>
    </section>
    <section class="form-panel">
      <div class="form-card">
        <h2>登录</h2>
        <p class="desc">支持用户名或已绑定手机号。</p>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @submit.prevent>
          <el-form-item label="账号" prop="account">
            <el-input v-model="form.account" size="large" placeholder="用户名或手机号" clearable />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              show-password
              placeholder="请输入密码"
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <el-button type="primary" class="submit" size="large" :loading="loading" @click="onSubmit">
            登录
          </el-button>
        </el-form>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { goH5 } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({
  account: '',
  password: '',
})
const rules: FormRules = {
  account: [{ required: true, message: '请填写用户名或手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请填写密码', trigger: 'blur' }],
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  loading.value = true
  try {
    await auth.login(form.account.trim(), form.password)
    if (auth.isSuperAdmin) {
      await router.push({ name: 'portal' })
      return
    }
    goH5(auth.token)
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
  grid-template-columns: 1.05fr 0.95fr;
  background: #0d1a14;
}

.brand-panel {
  position: relative;
  display: grid;
  place-items: center;
  padding: 48px;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 22%, rgba(45, 140, 98, 0.34), transparent 38%),
    radial-gradient(circle at 82% 78%, rgba(20, 70, 48, 0.5), transparent 36%),
    linear-gradient(155deg, #0b1712, #13261d 48%, #0d1a14);
  color: #f4faf6;
}

.brand-panel::after {
  content: "";
  position: absolute;
  inset: 12% auto auto 10%;
  width: 240px;
  height: 240px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 40% 60% 55% 45%;
  transform: rotate(18deg);
}

.brand-inner {
  position: relative;
  z-index: 1;
  max-width: 440px;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.22em;
  color: #9fd0b4;
  font-size: 12px;
}

.brand-panel h1 {
  margin: 16px 0 0;
  font-size: 64px;
  font-weight: 680;
  letter-spacing: 0.04em;
}

.lead {
  margin: 18px 0 0;
  color: rgba(244, 250, 246, 0.78);
  line-height: 1.75;
  font-size: 16px;
}

.form-panel {
  display: grid;
  place-items: center;
  padding: 40px;
  background: linear-gradient(180deg, #f7faf6, #eef3ef);
}

.form-card {
  width: min(420px, 100%);
  padding: 36px 34px 40px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(20, 40, 30, 0.06);
}

.form-card h2 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0.02em;
}

.desc {
  margin: 10px 0 22px;
  color: var(--muted);
}

.submit {
  width: 100%;
  margin-top: 6px;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 240px;
    padding: 36px 24px;
  }

  .brand-panel h1 {
    font-size: 44px;
  }

  .form-panel {
    padding: 24px 16px 40px;
  }
}
</style>
