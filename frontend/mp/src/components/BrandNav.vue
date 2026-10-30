<template>
  <view class="brand-nav">
    <view class="status" :style="{ height: statusBarHeight + 'px' }" />
    <view class="bar" :style="{ height: navBarHeight + 'px' }">
      <view v-if="showBack" class="back" hover-class="back-hover" @tap="goBack">
        <view class="chevron" />
      </view>
      <view class="brand-home" @tap="goMenu">
        <image class="logo" src="/static/ourLogo.png" mode="aspectFit" />
        <text class="brand">饭否</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { readWindowMetrics } from '@/utils/windowMetrics'

withDefaults(defineProps<{
  showBack?: boolean
}>(), {
  showBack: false,
})

const statusBarHeight = ref(20)
const navBarHeight = ref(44)

onMounted(() => {
  const metrics = readWindowMetrics()
  statusBarHeight.value = metrics.statusBarHeight
  navBarHeight.value = metrics.navBarHeight
})

function goBack() {
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.switchTab({ url: '/pages/activity/activity' })
    },
  })
}

function goMenu() {
  uni.switchTab({ url: '/pages/menu/menu' })
}
</script>

<style scoped>
.brand-nav {
  flex-shrink: 0;
  background: #fffcf7;
  border-bottom: 1px solid #efeae2;
}

.bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 8px 0 4px;
  box-sizing: border-box;
}

.back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  background: rgba(255, 252, 247, 0.01);
}

.back-hover {
  opacity: 0.55;
}

.chevron {
  width: 10px;
  height: 10px;
  margin-left: 4px;
  border-left: 2px solid #2c2a26;
  border-bottom: 2px solid #2c2a26;
  transform: rotate(45deg);
  pointer-events: none;
}

.brand-home {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 44px;
  min-width: 0;
  padding-right: 96px;
  box-sizing: border-box;
}

.logo {
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
  display: block;
  flex-shrink: 0;
}

.brand {
  font-size: 22px;
  font-weight: 800;
  color: #2c2a26;
  letter-spacing: 0.06em;
}
</style>
