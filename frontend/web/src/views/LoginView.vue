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
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
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
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 15%, rgba(91, 143, 122, 0.16), transparent 42%),
    linear-gradient(160deg, #f7f5f0, #efeae2);
}

.panel {
  width: min(420px, 100%);
  padding: 36px 32px 40px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: rgba(255, 252, 247, 0.96);
  box-shadow: 0 16px 36px rgba(44, 42, 38, 0.06);
}

.hero {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.desc {
  margin: 0 0 22px;
  color: var(--muted);
  line-height: 1.6;
  text-align: center;
  font-size: 14px;
}

.submit {
  width: 100%;
  margin-top: 6px;
}
</style>
