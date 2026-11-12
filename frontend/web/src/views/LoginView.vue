<template>
  <main class="login-page">
    <section class="panel">
      <div class="hero">
        <BrandLogo size="lg" />
      </div>
      <p class="desc">朋友们，好久不见了，饭否？</p>
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
    </section>
    <a class="icp" :href="ICP_QUERY_URL" target="_blank" rel="noopener noreferrer">{{ ICP_NUMBER }}</a>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ICP_NUMBER, ICP_QUERY_URL } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()
const route = useRoute()
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

const adminOnlyMessage = '管理端仅超级管理员可登录，点菜请使用小程序'

onMounted(() => {
  if (route.query.denied === '1') {
    ElMessage.error(adminOnlyMessage)
  }
})

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  loading.value = true
  try {
    await auth.login(form.account.trim(), form.password)
    if (!auth.isSuperAdmin) {
      await auth.logout()
      ElMessage.error(adminOnlyMessage)
      return
    }
    await router.push({ name: 'dishes' })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px 72px;
  background:
    linear-gradient(180deg, rgba(255, 250, 242, 0.12), rgba(44, 42, 38, 0.16)),
    url('/login-bg.jpg') center / cover no-repeat;
}

.panel {
  position: relative;
  z-index: 1;
  width: min(400px, 100%);
  padding: 36px 32px 32px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  background: rgba(255, 252, 247, 0.84);
  box-shadow: 0 24px 60px rgba(44, 42, 38, 0.16);
  backdrop-filter: blur(16px);
}

.hero {
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
}

.desc {
  margin: 0 0 24px;
  color: #5c5852;
  line-height: 1.6;
  text-align: center;
  font-size: 15px;
}

.panel :deep(.el-form-item) {
  margin-bottom: 18px;
}

.panel :deep(.el-form-item__label) {
  color: var(--ink);
  font-weight: 600;
}

.panel :deep(.el-input__wrapper) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
}

.submit {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.icp {
  position: absolute;
  left: 50%;
  bottom: 18px;
  z-index: 1;
  padding: 4px 12px;
  border-radius: 999px;
  transform: translateX(-50%);
  color: rgba(44, 42, 38, 0.72);
  background: rgba(255, 252, 247, 0.55);
  font-size: 12px;
  line-height: 1.6;
  text-decoration: none;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}

.icp:hover {
  color: var(--ink);
}

@media (max-width: 640px) {
  .login-page {
    padding: 24px 16px 64px;
    background-position: 62% center;
  }

  .panel {
    padding: 28px 20px 24px;
  }
}
</style>
