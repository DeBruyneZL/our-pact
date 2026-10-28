<template>
  <view class="brand-nav">
    <view class="status" :style="{ height: statusBarHeight + 'px' }" />
    <view class="bar" :style="{ height: navBarHeight + 'px' }" @tap="goMenu">
      <image class="logo" src="/static/ourLogo.png" mode="aspectFit" />
      <text class="brand">饭否</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { readWindowMetrics } from '@/utils/windowMetrics'

const statusBarHeight = ref(20)
const navBarHeight = ref(44)

onMounted(() => {
  const metrics = readWindowMetrics()
  statusBarHeight.value = metrics.statusBarHeight
  navBarHeight.value = metrics.navBarHeight
})

function goMenu() {
  uni.switchTab({ url: '/pages/menu/menu' })
}
</script>

<style scoped>
.brand-nav {
  background: #fffcf7;
  border-bottom: 1px solid #efeae2;
}

.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  padding-right: 96px;
  box-sizing: border-box;
}

.logo {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.brand {
  font-size: 22px;
  font-weight: 800;
  color: #2c2a26;
  letter-spacing: 0.06em;
}
</style>
