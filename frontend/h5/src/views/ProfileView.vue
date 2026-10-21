<template>
  <div class="page">
    <van-nav-bar title="我的" right-text="退出登录" @click-right="onLogout" />
    <van-empty v-if="errorMessage" :description="errorMessage" />
    <template v-else-if="auth.profile">
      <section class="hero">
        <van-image round width="72" height="72" fit="cover" :src="auth.profile.avatar || undefined">
          <template #error>
            <div class="avatar-fallback">{{ initial }}</div>
          </template>
          <template #loading>
            <div class="avatar-fallback">{{ initial }}</div>
          </template>
        </van-image>
        <div>
          <strong>{{ auth.profile.nickname }}</strong>
          <p>{{ auth.profile.superAdmin ? '超级管理员' : '普通用户' }}</p>
        </div>
      </section>

      <van-cell-group inset title="账号信息" class="panel">
        <van-cell title="用户名" :value="auth.profile.username" label="不可修改" />
        <van-cell title="昵称" :value="auth.profile.nickname" />
        <van-cell title="手机号" :value="maskPhone(auth.profile.phone)" />
        <van-cell title="注册时间" :value="formatDateTime(auth.profile.createTime)" />
      </van-cell-group>

      <van-cell-group inset class="panel actions-group">
        <van-cell title="编辑资料" is-link to="/profile/edit" />
        <van-cell title="更换头像" is-link @click="pickAvatar" />
        <van-cell
          v-if="auth.isSuperAdmin"
          title="进入管理端"
          is-link
          :url="adminPortalUrl"
        />
        <van-cell title="退出登录" is-link @click="onLogout" />
      </van-cell-group>
      <input
        ref="fileInput"
        class="file-input"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        @change="onFileChange"
      />
    </template>
    <div v-else class="logout-wrap">
      <van-button block round type="danger" plain @click="onLogout">退出登录</van-button>
    </div>

    <van-tabbar route safe-area-inset-bottom>
      <van-tabbar-item replace to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import { assertAvatarFile, formatDateTime, getToken, goLogin, maskPhone, portalUrl } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const initial = computed(() => auth.profile?.nickname?.slice(0, 1) || '用')
const adminPortalUrl = computed(() => portalUrl(auth.token))

async function loadProfile() {
  errorMessage.value = ''
  try {
    await auth.loadProfile()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '获取用户失败'
    if (!getToken()) {
      auth.token = ''
      goLogin()
    }
  }
}

function pickAvatar() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  try {
    assertAvatarFile(file)
    await auth.changeAvatar(file)
    showSuccessToast('头像已更新')
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '头像上传失败')
  }
}

async function onLogout() {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确认退出当前账号？',
    })
  } catch {
    return
  }
  await auth.logout()
  goLogin()
}

onMounted(loadProfile)
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 72px;
  background: var(--paper);
}

.hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 16px;
  padding: 18px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: 0 8px 18px rgba(20, 40, 30, 0.04);
}

.avatar-fallback {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #dce9e1;
  color: var(--brand-dark);
  font-size: 24px;
  font-weight: 650;
}

.hero strong {
  display: block;
  font-size: 18px;
}

.hero p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.panel {
  overflow: hidden;
  border-radius: 16px;
}

.actions-group {
  margin-top: 12px;
}

.logout-wrap {
  margin: 24px 16px;
}

.file-input {
  display: none;
}
</style>
