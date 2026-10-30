<template>
  <view class="shop" :class="{ shown: view.visible }">
    <view v-if="view.visible" class="lead">
      <image
        v-if="view.chefAvatarSrc"
        class="avatar"
        :src="view.chefAvatarSrc"
        mode="aspectFill"
        @tap.stop="previewAvatar"
        @error="onAvatarError"
      />
      <view v-else-if="view.showChef" class="avatar avatar-fallback">{{ view.chefInitial }}</view>
      <view class="who" @tap="openSheet">
        <view class="name-row">
          <template v-if="view.chefName">
            <text class="name">{{ view.chefName }}</text>
            <text v-if="view.chefTitle" class="role">{{ view.chefTitle }}</text>
          </template>
          <text v-else-if="view.slogan" class="name">{{ view.slogan }}</text>
          <text v-else-if="view.location" class="place-label">地址</text>
          <text v-else class="place-label">介绍</text>
        </view>
        <text v-if="view.chefName && view.slogan" class="slogan">{{ view.slogan }}</text>
        <text v-if="view.chefIntro" class="intro">{{ view.chefIntro }}</text>
        <text v-if="view.location" class="place">{{ view.location }}</text>
        <text v-if="view.extra" class="extra">{{ view.extra }}</text>
      </view>
    </view>
    <view v-if="view.visible && view.notice" class="notice" @tap="openSheet">
      <text class="notice-label">今日</text>
      <text class="notice-text">{{ view.notice }}</text>
    </view>

    <view v-if="sheet" class="mask" @tap="closeSheet">
      <view class="sheet" @tap.stop>
        <scroll-view scroll-y class="sheet-body">
          <image
            v-if="view.coverSrc"
            class="sheet-cover"
            :src="view.coverSrc"
            mode="aspectFill"
            @tap="previewCover"
            @error="onCoverError"
          />
          <view class="sheet-head">
            <image
              v-if="view.chefAvatarSrc"
              class="sheet-avatar"
              :src="view.chefAvatarSrc"
              mode="aspectFill"
              @tap="previewAvatar"
            />
            <view v-else-if="view.showChef" class="sheet-avatar avatar-fallback">{{ view.chefInitial }}</view>
            <view class="sheet-id">
              <text class="sheet-title">{{ view.sheetTitle }}</text>
              <text v-if="view.chefName && view.chefTitle" class="sheet-role">{{ view.chefTitle }}</text>
            </view>
          </view>
          <view v-if="view.location" class="fact">
            <text class="fact-label">地点</text>
            <text class="fact-value">{{ view.location }}</text>
          </view>
          <view v-if="view.openHours" class="fact">
            <text class="fact-label">接待</text>
            <text class="fact-value">{{ view.openHours }}</text>
          </view>
          <view v-if="view.seatsText" class="fact">
            <text class="fact-label">可坐</text>
            <text class="fact-value">{{ view.seatsText }}</text>
          </view>
          <view v-if="view.notice" class="fact">
            <text class="fact-label">今日</text>
            <text class="fact-value">{{ view.notice }}</text>
          </view>
          <view v-if="view.showChef && view.chefIntro" class="chef-block">
            <text class="chef-full">{{ view.chefIntro }}</text>
          </view>
        </scroll-view>
        <text class="close" @tap="closeSheet">知道了</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { ShopProfile } from '@our-pact/shared'
import { getShopProfile } from '@/api/shop'
import { absoluteUrl } from '@/config'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  sheet: boolean
}>()

const emit = defineEmits<{
  layout: [height: number]
  preview: []
  'preview-cancel': []
  'update:sheet': [open: boolean]
}>()

const auth = useAuthStore()

const profile = ref<ShopProfile | null>(null)
const coverFailed = ref(false)
const avatarFailed = ref(false)
const instance = getCurrentInstance()
let alive = true
let loadingProfile = false
let reportedHeight = -1

function text(value?: string | null) {
  return (value || '').trim()
}

const view = computed(() => {
  const slogan = text(profile.value?.slogan)
  const location = text(profile.value?.location)
  const openHours = text(profile.value?.openHours)
  const seatsText = text(profile.value?.seatsText)
  const notice = text(profile.value?.notice)
  const chefName = text(profile.value?.chefName)
  const chefTitle = text(profile.value?.chefTitle) || (chefName ? '主厨' : '')
  const chefIntro = text(profile.value?.chefIntro)
  const coverSrc = !coverFailed.value && profile.value?.coverUrl ? absoluteUrl(profile.value.coverUrl) : ''
  const chefAvatarSrc = !avatarFailed.value && profile.value?.chefAvatarUrl ? absoluteUrl(profile.value.chefAvatarUrl) : ''
  const showChef = Boolean(chefName || chefIntro || chefAvatarSrc)
  const extra = [openHours, seatsText].filter(Boolean).join(' · ')
  const visible = Boolean(
    slogan || location || openHours || seatsText || notice || coverSrc || showChef,
  )
  const chefInitial = (chefName || chefTitle || '厨').slice(0, 1)
  return {
    slogan,
    location,
    openHours,
    seatsText,
    notice,
    chefName,
    chefTitle,
    chefIntro,
    coverSrc,
    chefAvatarSrc,
    extra,
    showChef,
    visible,
    chefInitial,
    sheetTitle: chefName || slogan || '饭否',
  }
})

function reportLayout(retry = true) {
  nextTick(() => {
    const proxy = instance?.proxy
    const query = proxy ? uni.createSelectorQuery().in(proxy) : uni.createSelectorQuery()
    query
      .select('.shop')
      .boundingClientRect((result) => {
        const rect = (Array.isArray(result) ? result[0] : result) as { height?: number } | null
        const height = rect?.height || 0
        if (!alive) {
          return
        }
        if (height === 0 && view.value.visible && retry) {
          setTimeout(() => reportLayout(false), 50)
          return
        }
        if (height === reportedHeight) {
          return
        }
        reportedHeight = height
        emit('layout', height)
      })
      .exec()
  })
}

async function load() {
  if (!alive || loadingProfile) {
    return
  }
  loadingProfile = true
  try {
    await auth.ensureLogin()
    const next = await getShopProfile()
    if (!alive) {
      return
    }
    profile.value = next
    coverFailed.value = false
    avatarFailed.value = false
  } catch {
    if (!alive) {
      return
    }
    profile.value = null
  } finally {
    loadingProfile = false
    if (alive) {
      reportLayout()
    }
  }
}

function openSheet() {
  emit('update:sheet', true)
}

function closeSheet() {
  emit('update:sheet', false)
}

function onCoverError() {
  coverFailed.value = true
  reportLayout()
}

function onAvatarError() {
  avatarFailed.value = true
  reportLayout()
}

function previewAvatar() {
  const src = view.value.chefAvatarSrc
  if (!src) {
    return
  }
  emit('preview')
  uni.previewImage({
    current: src,
    urls: [src],
    fail: () => emit('preview-cancel'),
  })
}

function previewCover() {
  const src = view.value.coverSrc
  if (!src) {
    return
  }
  emit('preview')
  uni.previewImage({
    current: src,
    urls: [src],
    fail: () => emit('preview-cancel'),
  })
}

onMounted(() => {
  alive = true
  void load()
})

onShow(() => {
  void load()
})

onUnmounted(() => {
  alive = false
})
</script>

<style scoped>
.shop {
  box-sizing: border-box;
}

.shop.shown {
  padding: 10px 10px 0;
}

.lead {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
}

.who {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.name {
  flex-shrink: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  color: #2c2a26;
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.role {
  flex-shrink: 0;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 999px;
  background: #e6f0eb;
  color: #3d6f5c;
  font-size: 11px;
  font-weight: 600;
}

.place-label {
  flex-shrink: 0;
  color: #8a8680;
  font-size: 12px;
}

.slogan,
.intro,
.place,
.extra {
  display: block;
  margin-top: 2px;
  line-height: 1.4;
}

.slogan {
  color: #5c5852;
  font-size: 13px;
}

.intro,
.place,
.extra {
  color: #9a958c;
  font-size: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e6f0eb;
  flex-shrink: 0;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-size: 14px;
  font-weight: 700;
}

.notice {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0 0 8px 44px;
  padding: 6px 8px;
  border-radius: 8px;
  background: #e6f0eb;
}

.notice-label {
  flex-shrink: 0;
  color: #3d6f5c;
  font-size: 12px;
  font-weight: 700;
}

.notice-text {
  flex: 1;
  min-width: 0;
  color: #3d6f5c;
  font-size: 12px;
  line-height: 1.45;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(44, 42, 38, 0.5);
  z-index: 1100;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  max-height: 78vh;
  background: #fffcf7;
  border-radius: 20px 20px 0 0;
  padding: 0 16px calc(16px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.sheet-body {
  max-height: 62vh;
}

.sheet-cover {
  width: 100%;
  height: 200px;
  margin-top: 16px;
  border-radius: 12px;
  background: #e8e2d8;
  display: block;
}

.sheet-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0 12px;
}

.sheet-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e6f0eb;
  flex-shrink: 0;
}

.sheet-id {
  flex: 1;
  min-width: 0;
}

.sheet-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #2c2a26;
}

.sheet-role {
  display: inline-block;
  margin-top: 6px;
  padding: 0 8px;
  height: 20px;
  line-height: 20px;
  border-radius: 999px;
  background: #e6f0eb;
  color: #3d6f5c;
  font-size: 12px;
  font-weight: 600;
}

.fact {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid #efeae2;
}

.fact-label {
  width: 36px;
  flex-shrink: 0;
  color: #8a8680;
  font-size: 13px;
}

.fact-value {
  flex: 1;
  min-width: 0;
  color: #2c2a26;
  font-size: 14px;
  line-height: 1.5;
}

.chef-block {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #efeae2;
}

.chef-full {
  display: block;
  margin-top: 4px;
  color: #5c5852;
  font-size: 14px;
  line-height: 1.6;
}

.close {
  display: block;
  margin-top: 18px;
  text-align: center;
  color: #3d6f5c;
  font-size: 15px;
  font-weight: 700;
}
</style>
