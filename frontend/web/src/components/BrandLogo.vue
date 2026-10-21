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
    size: 'md',
    showName: true,
  },
)
</script>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 1;
}

.mark {
  display: block;
  flex-shrink: 0;
}

.name {
  color: #2c2a26;
  font-weight: 700;
}

.size-sm .mark {
  width: 24px;
  height: 24px;
}

.size-sm .name {
  font-size: 14px;
}

.size-md .mark {
  width: 36px;
  height: 36px;
}

.size-md .name {
  font-size: 22px;
}

.size-lg .mark {
  width: 72px;
  height: 72px;
}

.size-lg {
  flex-direction: column;
  gap: 10px;
}

.size-lg .name {
  font-size: 28px;
}
</style>
