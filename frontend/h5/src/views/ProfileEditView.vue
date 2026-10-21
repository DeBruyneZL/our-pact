<template>
  <div class="page">
    <van-nav-bar title="编辑资料" left-arrow @click-left="router.back()" />
    <van-form @submit="onSave">
      <van-cell-group inset class="panel">
        <van-field
          v-model="nickname"
          label="昵称"
          maxlength="64"
          placeholder="请输入昵称"
          :rules="[{ required: true, message: '请填写昵称' }]"
        />
        <van-field
          v-model="phone"
          label="手机号"
          maxlength="11"
          placeholder="请输入手机号"
          :rules="[
            { required: true, message: '请填写手机号' },
            { pattern: PHONE_PATTERN, message: '手机号格式不正确' },
          ]"
        />
        <van-cell title="用户名" :value="auth.profile?.username || '-'" label="不可修改" />
      </van-cell-group>
      <p class="tip">手机号需保持唯一。修改后可用新手机号登录。</p>
      <div class="actions">
        <van-button round block type="primary" native-type="submit" :loading="saving">保存</van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import { PHONE_PATTERN } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const nickname = ref('')
const phone = ref('')
const saving = ref(false)

onMounted(async () => {
  if (!auth.profile) {
    await auth.loadProfile()
  }
  nickname.value = auth.profile?.nickname || ''
  phone.value = auth.profile?.phone || ''
})

async function onSave() {
  const nextPhone = phone.value.trim()
  if (nextPhone !== (auth.profile?.phone || '')) {
    try {
      await showConfirmDialog({
        title: '确认修改手机号',
        message: `确认将手机号修改为 ${nextPhone}？`,
      })
    } catch {
      return
    }
  }
  saving.value = true
  try {
    await auth.saveProfile(nickname.value.trim(), nextPhone)
    showSuccessToast('资料已更新')
    await router.replace({ name: 'mine' })
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--paper);
}

.panel {
  margin-top: 12px;
  overflow: hidden;
  border-radius: 16px;
}

.tip {
  margin: 12px 20px 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.actions {
  margin: 24px 16px;
}
</style>
