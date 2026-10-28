<template>
  <view class="page">
    <BrandNav />
    <view class="body">
    <PageLoading v-if="pageLoading" tip="加载中" />
    <view v-else-if="errorMessage" class="error">{{ errorMessage }}</view>

    <template v-else-if="hasProfile">
      <template v-if="editing">
        <view class="hero">
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image
              v-if="hasAvatar"
              class="avatar"
              :src="avatarSrc"
              mode="aspectFill"
            />
            <view v-else class="avatar avatar-fallback">{{ initial }}</view>
          </button>
          <text class="hint">点头像，使用微信头像</text>
          <text v-if="savedName" class="name-input saved-name">{{ savedName }}</text>
          <input
            v-else
            id="wx-nickname"
            class="name-input"
            type="nickname"
            placeholder="点此使用微信昵称"
            placeholder-class="name-placeholder"
            @blur="onNicknameBlur"
            @nicknamereview="onNicknameReview"
          />
        </view>

        <view class="panel">
          <text class="cell-label">手机号</text>
          <input
            v-model="phoneInput"
            class="cell-input"
            type="number"
            maxlength="11"
            placeholder="选填"
            placeholder-class="cell-placeholder"
            @blur="onPhoneBlur"
          />
        </view>

        <button class="edit-btn" @tap="onFinishEdit">完成</button>
      </template>

      <template v-else>
        <view class="hero">
          <image
            v-if="hasAvatar"
            class="avatar"
            :src="avatarSrc"
            mode="aspectFill"
          />
          <view v-else class="avatar avatar-fallback">{{ initial }}</view>
          <text class="nickname">{{ viewName }}</text>
        </view>

        <view class="panel">
          <text class="cell-label">手机号</text>
          <text class="cell-value">{{ phoneText }}</text>
        </view>

        <button class="edit-btn" @tap="editing = true">编辑资料</button>
      </template>
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
import { syncTabBar } from '@/utils/tabBar'

interface FieldEvent {
  detail?: { value?: string; pass?: boolean }
}

interface ChooseAvatarEvent {
  detail: { avatarUrl: string }
}

const auth = useAuthStore()
const page = getCurrentInstance()
const savedName = ref('')
const phoneInput = ref('')
const errorMessage = ref('')
const pageLoading = ref(false)
/** 默认只读展示，点「编辑资料」才进入编辑。 */
const editing = ref(false)
let saving = false

const hasProfile = computed(() => Boolean(auth.profile))
const avatarSrc = computed(() => absoluteUrl(auth.profile?.avatar))
const hasAvatar = computed(() => Boolean(avatarSrc.value))
const initial = computed(() => {
  const name = auth.displayName || ''
  return name ? name.slice(0, 1) : '用'
})

/** 展示用昵称：没设置过就提示去编辑。 */
const viewName = computed(() => {
  if (savedName.value) {
    return savedName.value
  }
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
    savedName.value = isPlaceholderName(auth.profile?.nickname) ? '' : auth.profile?.nickname || ''
    phoneInput.value = auth.profile?.phone || ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '获取用户失败'
  } finally {
    pageLoading.value = false
  }
}

/** 不绑定 value。微信昵称快捷填充不会回写受控值，绑定旧昵称时失焦读到的仍是「微信用户」。 */
async function onNicknameBlur(event: FieldEvent) {
  await wait(200)
  await commitNickname(event.detail?.value || '')
}

async function onNicknameReview(event: FieldEvent) {
  if (!event.detail?.pass) {
    return
  }
  await commitNickname('')
}

async function commitNickname(raw: string) {
  let name = raw.trim()
  if (isPlaceholderName(name)) {
    name = await readNativeNickname()
  }
  if (isPlaceholderName(name) || name === auth.profile?.nickname) {
    return
  }
  await save(name, phoneInput.value)
  savedName.value = isPlaceholderName(auth.profile?.nickname) ? name : auth.profile?.nickname || name
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

async function onPhoneBlur() {
  const tel = phoneInput.value.trim()
  if (tel === (auth.profile?.phone || '')) {
    return
  }
  if (tel && !PHONE_PATTERN.test(tel)) {
    uni.showToast({ title: '手机号格式不对', icon: 'none' })
    phoneInput.value = auth.profile?.phone || ''
    return
  }
  const name = savedName.value || auth.profile?.nickname || ''
  if (isPlaceholderName(name)) {
    uni.showToast({ title: '请先填写昵称', icon: 'none' })
    return
  }
  await save(name, tel)
}

async function save(name: string, tel: string) {
  if (saving || !name) {
    return
  }
  saving = true
  try {
    const latest = await updateProfile({ nickname: name, phone: tel })
    auth.profile = latest
    savedName.value = isPlaceholderName(latest.nickname) ? savedName.value : latest.nickname
    phoneInput.value = latest.phone || ''
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' })
  } finally {
    saving = false
  }
}

function onChooseAvatar(event: ChooseAvatarEvent) {
  if (event.detail?.avatarUrl) {
    void changeAvatar(event.detail.avatarUrl)
  }
}

/** 结束编辑：回只读展示，并刷新一次资料。 */
async function onFinishEdit() {
  editing.value = false
  await loadProfile()
}

async function changeAvatar(filePath: string) {
  uni.showLoading({ title: '上传中' })
  try {
    auth.profile = await uploadAvatar(filePath)
    uni.showToast({ title: '头像已更新', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '头像上传失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

onShow(() => {
  syncTabBar(2)
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
  padding: 24px 16px calc(24px + 56px + env(safe-area-inset-bottom));
}

.error {
  padding: 40px 16px;
  color: #b0654a;
  text-align: center;
  font-size: 14px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px 22px;
  border-radius: 20px;
  border: 1px solid #e5e1d8;
  background: linear-gradient(145deg, #e6f0eb, #fffcf7 60%);
}

.avatar-btn {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  line-height: 1;
  width: 84px;
  height: 84px;
}

.avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: #dce9e1;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-size: 28px;
  font-weight: 650;
}

.hint {
  margin-top: 10px;
  color: #8a8680;
  font-size: 12px;
}

.nickname {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #2c2a26;
}

.edit-btn {
  margin-top: 16px;
  background: #5b8f7a;
  color: #fff;
  border-radius: 999px;
  font-size: 15px;
}

.name-input {
  margin-top: 8px;
  width: 220px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #2c2a26;
}

.name-placeholder {
  color: #b3ada2;
  font-weight: 400;
  font-size: 16px;
}

.saved-name {
  display: block;
}

.panel {
  margin-top: 16px;
  padding: 4px 16px;
  border-radius: 16px;
  border: 1px solid #e5e1d8;
  background: #fffcf7;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cell-label {
  color: #5c5852;
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
  font-size: 15px;
  color: #2c2a26;
}
</style>
