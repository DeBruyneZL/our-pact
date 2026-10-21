<template>
  <span class="brand-logo" :class="[`size-${size}`]">
    <img src="/logo.svg" alt="饭否" class="mark" />
    <span v-if="showName" class="name">饭否</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    showName?: boolean
  }>(),
  {
    size: 'sm',
    showName: true,
  },
)
</script>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}

.mark {
  display: block;
  flex-shrink: 0;
}

.name {
  color: #5b8f7a;
  font-weight: 700;
}

.size-sm .mark {
  width: 22px;
  height: 22px;
}

.size-sm .name {
  font-size: 14px;
}

.size-md .mark {
  width: 36px;
  height: 36px;
}

.size-md .name {
  font-size: 18px;
}

.size-lg .mark {
  width: 64px;
  height: 64px;
}

.size-lg .name {
  font-size: 28px;
}
</style>
