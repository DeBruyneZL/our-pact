<template>
  <view class="page">
    <BrandNav />
    <view class="body">
    <PageLoading v-if="pageLoading" tip="加载中" />
    <view v-else-if="errorMessage" class="error">{{ errorMessage }}</view>

    <template v-else-if="hasProfile">
      <view class="sheet">
        <view v-if="editing" class="hero">
          <text class="hero-title">完善头像和昵称</text>
          <text class="hint">点下方区域，一次选好微信头像和昵称</text>

          <!-- 头像选择与昵称填写放同一授权区，点保存时一并提交 -->
          <view class="auth-block">
            <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
              <view class="avatar-ring">
                <image
                  v-if="previewAvatar"
                  class="avatar"
                  :src="previewAvatar"
                  mode="aspectFill"
                />
                <view v-else class="avatar avatar-fallback">{{ initial }}</view>
              </view>
              <text class="avatar-tip">选头像</text>
            </button>
            <input
              id="wx-nickname"
              class="name-input"
              type="nickname"
              :value="nameInput"
              placeholder="点此选微信昵称"
              placeholder-class="name-placeholder"
              @input="onNicknameInput"
              @blur="onNicknameBlur"
              @nicknamereview="onNicknameReview"
            />
          </view>
        </view>

        <view v-else class="hero">
          <view class="avatar-ring">
            <image
              v-if="hasAvatar"
              class="avatar"
              :src="avatarSrc"
              mode="aspectFill"
            />
            <view v-else class="avatar avatar-fallback">{{ initial }}</view>
          </view>
          <text class="nickname">{{ viewName }}</text>
          <text v-if="needProfile" class="hint">还差头像或昵称，点下面一次完善</text>
        </view>

        <view class="stats">
          <view class="stat">
            <text class="stat-num">{{ activityCount }}</text>
            <text class="stat-label">参加活动</text>
          </view>
          <view class="stat-split" />
          <view class="stat">
            <text class="stat-num">{{ dishCount }}</text>
            <text class="stat-label">点过的菜</text>
          </view>
        </view>

        <view class="phone-row">
          <text class="cell-label">手机号</text>
          <input
            v-if="editing"
            v-model="phoneInput"
            class="cell-input"
            type="number"
            maxlength="11"
            placeholder="选填"
            placeholder-class="cell-placeholder"
          />
          <text v-else :class="phoneInput ? 'cell-value' : 'cell-value is-empty'">{{ phoneText }}</text>
        </view>
      </view>

      <button v-if="editing" class="edit-btn" :disabled="saving" @tap="onSaveAll">保存</button>
      <button v-if="editing" class="text-btn" :disabled="saving" @tap="onCancelEdit">取消</button>
      <button v-else class="edit-btn" @tap="startEdit">
        {{ needProfile ? '完善头像和昵称' : '编辑资料' }}
      </button>
    </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, getCurrentInstance, ref } from 'vue'
import { PHONE_PATTERN } from '@our-pact/shared/pure'
import { updateProfile, uploadAvatar } from '@/api/auth'
import BrandNav from '@/components/BrandNav.vue'
import PageLoading from '@/components/PageLoading.vue'
import { absoluteUrl } from '@/config'
import { useAuthStore } from '@/stores/auth'
import { setTabBarHidden, syncTabBar } from '@/utils/tabBar'

interface FieldEvent {
  detail?: { value?: string; pass?: boolean }
}

interface ChooseAvatarEvent {
  detail: { avatarUrl: string }
}

const auth = useAuthStore()
const page = getCurrentInstance()
const nameInput = ref('')
const phoneInput = ref('')
const pendingAvatar = ref('')
const errorMessage = ref('')
const pageLoading = ref(false)
const editing = ref(false)
const saving = ref(false)

const hasProfile = computed(() => Boolean(auth.profile))
const avatarSrc = computed(() => absoluteUrl(auth.profile?.avatar))
const hasAvatar = computed(() => Boolean(avatarSrc.value))
const previewAvatar = computed(() => pendingAvatar.value || avatarSrc.value)
const initial = computed(() => {
  const name = auth.displayName || ''
  return name ? name.slice(0, 1) : '用'
})
const activityCount = computed(() => auth.profile?.activityCount ?? 0)
const dishCount = computed(() => auth.profile?.dishCount ?? 0)
const needProfile = computed(() => !hasAvatar.value || isPlaceholderName(auth.profile?.nickname))

const viewName = computed(() => {
  const nickname = auth.profile?.nickname
  return isPlaceholderName(nickname) ? '还没起名字' : nickname || ''
})

const phoneText = computed(() => phoneInput.value || '未绑定')

function isPlaceholderName(name?: string | null) {
  return !name || name === '微信用户'
}

async function loadProfile() {
  pageLoading.value = !hasProfile.value
  errorMessage.value = ''
  try {
    await auth.ensureLogin()
    await auth.loadProfile(true)
    syncFormFromProfile()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '获取用户失败'
  } finally {
    pageLoading.value = false
  }
}

function syncFormFromProfile() {
  nameInput.value = isPlaceholderName(auth.profile?.nickname) ? '' : auth.profile?.nickname || ''
  phoneInput.value = auth.profile?.phone || ''
  pendingAvatar.value = ''
}

function startEdit() {
  syncFormFromProfile()
  editing.value = true
}

function onCancelEdit() {
  syncFormFromProfile()
  editing.value = false
}

function onNicknameInput(event: FieldEvent) {
  nameInput.value = event.detail?.value || ''
}

/** 微信昵称快捷填充可能不回写受控值，失焦时读原生值到本地，等点保存再提交。 */
async function onNicknameBlur(event: FieldEvent) {
  await wait(200)
  let name = (event.detail?.value || nameInput.value || '').trim()
  if (isPlaceholderName(name)) {
    name = await readNativeNickname()
  }
  if (!isPlaceholderName(name)) {
    nameInput.value = name
  }
}

async function onNicknameReview(event: FieldEvent) {
  if (!event.detail?.pass) {
    return
  }
  await wait(200)
  const name = await readNativeNickname()
  if (!isPlaceholderName(name)) {
    nameInput.value = name
  }
}

function onChooseAvatar(event: ChooseAvatarEvent) {
  const url = event.detail?.avatarUrl
  if (url) {
    pendingAvatar.value = url
  }
}

function readNativeNickname(): Promise<string> {
  return new Promise((resolve) => {
    const query = uni.createSelectorQuery()
    if (page?.proxy) {
      query.in(page.proxy as never)
    }
    query.select('#wx-nickname').fields({ properties: ['value'] }).exec((res) => {
      const node = (res?.[0] || null) as { value?: string } | null
      resolve((node?.value || '').trim())
    })
  })
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 头像、昵称、手机号一次提交，避免分两次授权/保存。 */
async function onSaveAll() {
  if (saving.value) {
    return
  }
  await wait(200)
  let name = nameInput.value.trim()
  if (isPlaceholderName(name)) {
    name = await readNativeNickname()
  }
  if (isPlaceholderName(name)) {
    uni.showToast({ title: '请先选择昵称', icon: 'none' })
    return
  }
  if (!previewAvatar.value) {
    uni.showToast({ title: '请先选择头像', icon: 'none' })
    return
  }
  const tel = phoneInput.value.trim()
  if (tel && !PHONE_PATTERN.test(tel)) {
    uni.showToast({ title: '手机号格式不对', icon: 'none' })
    return
  }

  saving.value = true
  uni.showLoading({ title: '保存中', mask: true })
  try {
    if (pendingAvatar.value) {
      auth.profile = await uploadAvatar(pendingAvatar.value)
      pendingAvatar.value = ''
    }
    const latest = await updateProfile({ nickname: name, phone: tel })
    auth.profile = latest
    nameInput.value = isPlaceholderName(latest.nickname) ? name : latest.nickname
    phoneInput.value = latest.phone || ''
    editing.value = false
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    saving.value = false
  }
}

onShow(() => {
  syncTabBar(2)
  setTabBarHidden(false)
  editing.value = false
  void loadProfile()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
}

.body {
  padding: 16px 16px calc(20px + 56px + env(safe-area-inset-bottom));
}

.error {
  padding: 40px 16px;
  color: #b0654a;
  text-align: center;
  font-size: 14px;
}

.sheet {
  overflow: hidden;
  border-radius: 24px;
  background: linear-gradient(180deg, #e5f2ea 0%, #fffcf7 168px);
  box-shadow: 0 12px 32px rgba(61, 111, 92, 0.08);
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px 8px;
}

.hero-title {
  font-size: 17px;
  font-weight: 700;
  color: #2c2a26;
}

.auth-block {
  margin-top: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 252, 247, 0.82);
  box-sizing: border-box;
}

.avatar-btn {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  line-height: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar-btn::after {
  border: none;
}

.avatar-ring {
  width: 96px;
  height: 96px;
  padding: 4px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 8px 18px rgba(61, 111, 92, 0.16);
  box-sizing: border-box;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #dce9e1;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-size: 28px;
  font-weight: 600;
}

.avatar-tip {
  font-size: 12px;
  color: #5b8f7a;
}

.hint {
  margin-top: 10px;
  color: #8a8680;
  font-size: 12px;
  text-align: center;
}

.nickname {
  margin-top: 14px;
  font-size: 22px;
  font-weight: 700;
  color: #2c2a26;
  line-height: 1.3;
}

.stats {
  display: flex;
  align-items: stretch;
  margin: 18px 18px 0;
  padding: 16px 0 14px;
  border-top: 1px solid rgba(44, 42, 38, 0.08);
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.stat-split {
  width: 1px;
  margin: 4px 0;
  background: #ece7df;
}

.stat-num {
  font-size: 30px;
  font-weight: 800;
  color: #3d6f5c;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #8a8680;
}

.edit-btn {
  width: 100%;
  margin-top: 20px;
  height: 48px;
  line-height: 48px;
  background: #4f866f;
  color: #fff;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.06em;
  box-shadow: 0 8px 18px rgba(79, 134, 111, 0.28);
}

.edit-btn::after,
.text-btn::after {
  border: none;
}

.edit-btn[disabled] {
  opacity: 0.6;
}

.text-btn {
  margin-top: 2px;
  background: transparent;
  color: #8a8680;
  font-size: 14px;
  line-height: 40px;
}

.name-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #2c2a26;
  background: #f7f5f0;
  border-radius: 12px;
  box-sizing: border-box;
}

.name-placeholder {
  color: #b3ada2;
  font-weight: 400;
  font-size: 15px;
}

.phone-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 18px 8px;
  padding: 0 2px;
  border-top: 1px solid rgba(44, 42, 38, 0.08);
}

.cell-label {
  color: #8a8680;
  font-size: 14px;
  flex-shrink: 0;
}

.cell-input {
  flex: 1;
  height: 48px;
  text-align: right;
  font-size: 15px;
}

.cell-placeholder {
  color: #b3ada2;
}

.cell-value {
  flex: 1;
  height: 48px;
  line-height: 48px;
  text-align: right;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #2c2a26;
}

.cell-value.is-empty {
  color: #b3ada2;
  font-weight: 400;
  letter-spacing: 0;
}
</style>
