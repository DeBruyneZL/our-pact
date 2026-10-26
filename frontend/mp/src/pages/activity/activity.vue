<template>
  <view class="page">
    <button class="join-btn block" @tap="showCreate = !showCreate">{{ showCreate ? '收起' : '发起活动' }}</button>
    <view v-if="showCreate" class="card">
      <input v-model="activityName" class="field" placeholder="活动名称" placeholder-class="placeholder" />
      <picker mode="date" :value="activityDate" @change="onDateChange">
        <view class="field">{{ activityDate || '选择日期' }}</view>
      </picker>
      <picker mode="time" :value="activityTime" @change="onTimeChange">
        <view class="field">{{ activityTime || '选择时间' }}</view>
      </picker>
      <input v-model="activityLocation" class="field" placeholder="地点" placeholder-class="placeholder" />
      <input v-model="activityPeople" class="field" type="number" placeholder="几个人，自己来填 1" placeholder-class="placeholder" />
      <button class="join-btn block" :disabled="submitting" @tap="onCreate">确认发起</button>
    </view>

    <view v-if="loading" class="center">{{ loadingText }}</view>
    <view v-else-if="statusText" class="center">{{ statusText }}</view>
    <view
      v-for="row in activityCards"
      :key="row.id"
      class="card"
      @tap="openDetail(row.id)"
    >
      <view class="row">
        <text class="title">{{ row.title }}</text>
        <text class="status">{{ row.status }}</text>
      </view>
      <text class="meta">{{ row.when }} · {{ row.location }}</text>
      <text class="meta">{{ row.summary }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import type { Activity, ActivityStatus } from '@our-pact/shared'
import { createActivity, pageMyActivities } from '@/api/activity'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const activities = ref<Activity[]>([])
const loading = ref(false)
const errorMessage = ref('')
const showCreate = ref(false)
const submitting = ref(false)
const activityName = ref('')
const activityDate = ref('')
const activityTime = ref('18:00')
const activityLocation = ref('')
const activityPeople = ref('1')

const loadingText = '加载中'
const emptyText = '还没有活动，可以先发起，菜之后大家一起加'

const statusText = computed(() => {
  if (errorMessage.value) {
    return errorMessage.value
  }
  if (!activities.value.length) {
    return emptyText
  }
  return ''
})

const activityCards = computed(() =>
  activities.value.map((item) => ({
    id: item.id,
    title: typeof item.name === 'string' && item.name ? item.name : '未命名活动',
    status: statusLabel(item.status),
    when: formatWhen(item.scheduledAt),
    location: typeof item.location === 'string' ? item.location : '',
    summary: `${typeof item.userName === 'string' ? item.userName : ''} 发起 · ${item.items?.length || 0} 道菜 · 共 ${item.totalPeople || 0} 人`,
  })),
)

function statusLabel(status: ActivityStatus) {
  return { open: '待答复', replied: '已答复', withdrawn: '已撤回', completed: '已完成' }[status]
}

function formatWhen(value: string) {
  return (value || '').replace('T', ' ').slice(0, 16)
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    await auth.ensureLogin()
    const page = await pageMyActivities()
    activities.value = Array.isArray(page?.list) ? page.list : []
  } catch (error) {
    activities.value = []
    errorMessage.value = error instanceof Error ? error.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function openDetail(id: number) {
  uni.navigateTo({ url: `/pages/activity/detail?id=${id}` })
}

function onDateChange(event: { detail: { value: string } }) {
  activityDate.value = event.detail.value
}

function onTimeChange(event: { detail: { value: string } }) {
  activityTime.value = event.detail.value
}

function todayText() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function readPeopleCount(value: string) {
  const count = Number(value)
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error('人数请填 1 到 20')
  }
  return count
}

async function onCreate() {
  if (submitting.value) {
    return
  }
  if (!activityName.value.trim() || !activityDate.value || !activityTime.value || !activityLocation.value.trim()) {
    uni.showToast({ title: '请填写名称、时间和地点', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await auth.ensureLogin()
    const created = await createActivity({
      name: activityName.value.trim(),
      scheduledAt: `${activityDate.value}T${activityTime.value}:00`,
      location: activityLocation.value.trim(),
      peopleCount: readPeopleCount(activityPeople.value),
      items: [],
    })
    showCreate.value = false
    activityName.value = ''
    activityLocation.value = ''
    activityPeople.value = '1'
    uni.navigateTo({ url: `/pages/activity/detail?id=${created.id}` })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '发起失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onShow(() => {
  if (!activityDate.value) {
    activityDate.value = todayText()
  }
  void load()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 12px 24px;
  box-sizing: border-box;
}

.center {
  padding: 80px 16px;
  text-align: center;
  color: #8a8680;
  font-size: 14px;
}

.placeholder {
  color: #b3ada2;
}

.join-btn {
  background: #5b8f7a;
  color: #fff;
  border-radius: 999px;
  margin: 0;
}

.join-btn.block {
  display: block;
  margin: 0 0 12px;
}

.field {
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f5f0;
  font-size: 14px;
}

.card {
  background: #fffcf7;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #2f2c28;
}

.status {
  color: #3d6f5c;
  font-size: 12px;
  flex-shrink: 0;
}

.meta {
  display: block;
  margin-top: 6px;
  color: #8a8680;
  font-size: 13px;
}
</style>
