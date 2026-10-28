<template>
  <view class="page-loading">
    <view class="stage">
      <image class="logo" src="/static/ourLogo.png" mode="aspectFit" />
      <view class="ring" />
    </view>
    <text class="tip">{{ tip }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tip?: string
  }>(),
  {
    tip: '加载中',
  },
)
</script>

<style scoped>
.page-loading {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #8a8680;
}

.stage {
  position: relative;
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  width: 52px;
  height: 52px;
  animation: pulse 1.2s ease-in-out infinite;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid #dce9e1;
  border-top-color: #5b8f7a;
  animation: spin 0.9s linear infinite;
}

.tip {
  font-size: 13px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(0.94);
    opacity: 0.75;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
