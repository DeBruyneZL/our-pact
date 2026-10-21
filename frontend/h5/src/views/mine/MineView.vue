<template>
  <div class="page">
    <van-nav-bar title="我的">
      <template #left>
        <BrandLogo />
      </template>
      <template #right>
        <span class="exit" @click="onLogout">退出</span>
      </template>
    </van-nav-bar>

    <van-empty v-if="errorMessage" :description="errorMessage" />
    <template v-else-if="auth.profile">
      <section class="hero">
        <van-image round width="64" height="64" fit="cover" :src="auth.profile.avatar || undefined">
          <template #error>
            <div class="avatar-fallback">{{ initial }}</div>
          </template>
          <template #loading>
            <div class="avatar-fallback">{{ initial }}</div>
          </template>
        </van-image>
        <div>
          <strong>{{ auth.displayName }}</strong>
          <p>{{ auth.profile.superAdmin ? '超级管理员' : '普通用户' }} · {{ auth.profile.username }}</p>
        </div>
      </section>

      <van-cell-group inset class="panel">
        <van-cell title="手机号" :value="maskPhone(auth.profile.phone)" />
        <van-cell title="注册时间" :value="formatDateTime(auth.profile.createTime)" />
        <van-cell title="编辑资料" is-link to="/profile/edit" />
        <van-cell title="更换头像" is-link @click="pickAvatar" />
        <van-cell
          v-if="auth.isSuperAdmin"
          title="进入管理端"
          is-link
          :url="adminPortalUrl"
        />
      </van-cell-group>
    </template>

    <div class="card">
      <h2>{{ guest.user ? `约饭昵称：${guest.user.name}` : '设置约饭昵称' }}</h2>
      <p v-if="guest.user">
        发起/加入活动时用这个名字。创建于 {{ formatDateTime(guest.user.createdAt) }}，已有
        {{ guest.user.activityCount }} 场活动。
      </p>
      <p v-else>起一个唯一好认的名字，家人们就知道是谁约的饭。</p>

      <van-field v-model="name" label="约饭昵称" maxlength="64" placeholder="例如：阿花" />
      <van-button block round type="primary" :loading="saving" @click="onSaveGuest">
        {{ guest.user ? '更新昵称' : '创建昵称' }}
      </van-button>
    </div>

    <input
      ref="fileInput"
      class="file-input"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import {
  assertAvatarFile,
  formatDateTime,
  getToken,
  goLogin,
  maskPhone,
  portalUrl,
} from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import BrandLogo from '@/components/BrandLogo.vue'

const auth = useAuthStore()
const guest = useGuestStore()
const name = ref('')
const saving = ref(false)
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const initial = computed(() => auth.displayName.slice(0, 1) || '用')
const adminPortalUrl = computed(() => portalUrl(auth.token))

watch(
  () => guest.user,
  (user) => {
    name.value = user?.name || ''
  },
)

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

async function onSaveGuest() {
  saving.value = true
  try {
    const isCreate = !guest.user
    await guest.saveName(name.value)
    showSuccessToast(isCreate ? '昵称已创建' : '昵称已更新')
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function pickAvatar() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
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

onMounted(async () => {
  await loadProfile()
  await guest.hydrate()
  name.value = guest.user?.name || ''
})
</script>

<style scoped>
.exit {
  color: #8a8680;
  font-size: 13px;
}

.hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 16px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(145deg, #e6f0eb, #fffcf7 60%);
  border: 1px solid var(--line);
}

.avatar-fallback {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dce9e1;
  color: var(--brand-dark);
  font-size: 22px;
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
  margin-bottom: 8px;
}

.card {
  margin: 16px;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: linear-gradient(145deg, #e6f0eb, #fffcf7 60%);
}

.card h2 {
  margin: 0 0 6px;
  font-size: 18px;
}

.card p {
  margin: 0 0 16px;
  color: #5c5852;
  font-size: 14px;
  line-height: 1.5;
}

.card .van-button {
  margin-top: 12px;
}

.file-input {
  display: none;
}
</style>
