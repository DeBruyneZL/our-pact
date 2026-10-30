<template>
  <view class="shop" :class="{ shown: view.visible }">
    <view v-if="view.visible && expanded" class="card" @tap="openSheet">
      <view class="main">
        <image
          v-if="view.coverSrc"
          class="cover"
          :src="view.coverSrc"
          mode="aspectFill"
          @error="onCoverError"
        />
        <view class="copy">
          <view class="title-row">
            <text class="slogan">{{ view.headline }}</text>
            <text class="fold" @tap.stop="fold">收起</text>
          </view>
          <text v-if="view.meta" class="meta">{{ view.meta }}</text>
          <view v-if="view.showChef" class="chef">
            <image
              v-if="view.chefAvatarSrc"
              class="avatar"
              :src="view.chefAvatarSrc"
              mode="aspectFill"
              @error="onAvatarError"
            />
            <view v-else class="avatar avatar-fallback">{{ view.chefInitial }}</view>
            <view class="chef-copy">
              <text class="chef-name">{{ view.chefLabel }}</text>
              <text v-if="view.chefIntro" class="chef-intro">{{ view.chefIntro }}</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="view.notice" class="notice">
        <text class="notice-label">今日</text>
        <text class="notice-text">{{ view.notice }}</text>
      </view>
    </view>

    <view v-else-if="view.visible" class="slim" @tap="unfold">
      <text class="slim-text">{{ view.slim }}</text>
      <text class="fold">展开</text>
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
          />
          <text class="sheet-title">{{ view.sheetTitle }}</text>
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
          <view v-if="view.showChef" class="chef-block">
            <image
              v-if="view.chefAvatarSrc"
              class="avatar large"
              :src="view.chefAvatarSrc"
              mode="aspectFill"
            />
            <view v-else class="avatar large avatar-fallback">{{ view.chefInitial }}</view>
            <view class="chef-copy">
              <text class="chef-name">{{ view.chefLabel }}</text>
              <text v-if="view.chefIntro" class="chef-full">{{ view.chefIntro }}</text>
            </view>
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
const expanded = ref(true)
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
  const chefLabel = [chefTitle, chefName].filter(Boolean).join(' ')
  const headline = slogan || location || chefLabel || '饭否'
  const meta = [location, openHours, seatsText].filter((part) => part && part !== headline).join(' · ')
  const showChef = Boolean(chefName || chefIntro || chefAvatarSrc)
  const visible = Boolean(
    slogan || location || openHours || seatsText || notice || coverSrc || showChef,
  )
  const slim = [location || slogan, chefLabel].filter(Boolean).join(' · ') || headline
  const chefInitial = (chefName || chefTitle || '厨').slice(0, 1)
  return {
    slogan,
    location,
    openHours,
    seatsText,
    notice,
    chefIntro,
    coverSrc,
    chefAvatarSrc,
    chefLabel,
    headline,
    meta,
    showChef,
    visible,
    slim,
    chefInitial,
    sheetTitle: slogan || '饭否',
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

function fold() {
  expanded.value = false
  reportLayout()
}

function unfold() {
  expanded.value = true
  reportLayout()
}

function onCoverError() {
  coverFailed.value = true
  reportLayout()
}

function onAvatarError() {
  avatarFailed.value = true
  reportLayout()
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

.card,
.slim {
  background: #fffcf7;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  overflow: hidden;
}

.main {
  display: flex;
  gap: 10px;
  padding: 10px;
}

.cover {
  width: 92px;
  height: 92px;
  border-radius: 10px;
  flex-shrink: 0;
  background: #e8e2d8;
}

.copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.slogan {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2c2a26;
  line-height: 1.35;
}

.fold {
  flex-shrink: 0;
  color: #3d6f5c;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.meta {
  color: #5c5852;
  font-size: 12px;
  line-height: 1.45;
}

.chef {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e6f0eb;
  flex-shrink: 0;
}

.avatar.large {
  width: 44px;
  height: 44px;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-size: 12px;
  font-weight: 700;
}

.avatar.large.avatar-fallback {
  font-size: 16px;
}

.chef-copy {
  flex: 1;
  min-width: 0;
}

.chef-name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #2c2a26;
}

.chef-intro {
  display: block;
  width: 100%;
  margin-top: 1px;
  color: #8a8680;
  font-size: 12px;
  line-height: 1.35;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.notice {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0 10px 10px;
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

.slim {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
}

.slim-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: #2c2a26;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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

.sheet-title {
  display: block;
  margin-top: 16px;
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #2c2a26;
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
  display: flex;
  gap: 12px;
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
