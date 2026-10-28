<template>
  <view class="datetime">
    <view class="field" @tap="expanded = !expanded">
      <text>{{ display }}</text>
      <text class="hint">{{ expanded ? '收起' : '选择' }}</text>
    </view>
    <view v-if="expanded" class="panel">
      <picker mode="date" :value="date" :start="minDate" @change="onDateChange">
        <view class="sub-field">日期 {{ date || '未选' }}</view>
      </picker>
      <picker mode="time" :value="time" @change="onTimeChange">
        <view class="sub-field">时间 {{ time || '未选' }}</view>
      </picker>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { defaultActivityName, todayText } from '@/utils/activityForm'

const props = withDefaults(
  defineProps<{
    date: string
    time: string
    minDate?: string
  }>(),
  {
    minDate: '',
  },
)

const emit = defineEmits<{
  'update:date': [value: string]
  'update:time': [value: string]
  change: [payload: { date: string; time: string }]
}>()

const expanded = ref(false)
const minDate = computed(() => props.minDate || todayText())

const display = computed(() => {
  if (!props.date || !props.time) {
    return '约定时间'
  }
  return `${props.date.replace(/-/g, '/')} ${props.time}`
})

function onDateChange(event: { detail: { value: string } }) {
  emit('update:date', event.detail.value)
  emit('change', { date: event.detail.value, time: props.time })
}

function onTimeChange(event: { detail: { value: string } }) {
  emit('update:time', event.detail.value)
  emit('change', { date: props.date, time: event.detail.value })
  if (props.date) {
    expanded.value = false
  }
}

watch(
  () => props.date,
  (value) => {
    if (value && !props.time) {
      emit('update:time', '18:00')
    }
  },
)

// 供外部在需要时拼默认活动名
defineExpose({ defaultActivityName })
</script>

<style scoped>
.field {
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f5f0;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hint {
  flex-shrink: 0;
  color: #8a8680;
  font-size: 12px;
}

.panel {
  margin: -2px 0 8px;
  padding: 8px;
  border-radius: 10px;
  background: #f3efe7;
}

.sub-field {
  margin-bottom: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fffcf7;
  font-size: 14px;
}

.sub-field:last-child {
  margin-bottom: 0;
}
</style>
