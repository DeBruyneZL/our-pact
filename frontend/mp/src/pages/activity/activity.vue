<template>
  <view class="page">
    <view class="page-head">
      <text class="head-title">活动</text>
      <text v-if="countText" class="head-count">{{ countText }}</text>
      <view class="create-btn" @tap="showCreate = true">发起</view>
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
        <text :class="row.statusSkin">{{ row.status }}</text>
      </view>
      <text class="meta">{{ row.when }}</text>
      <text class="meta">{{ row.summary }}</text>
    </view>

    <view v-if="showCreate" class="mask" @tap="showCreate = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">发起活动</text>
        <input v-model="activityName" class="field" placeholder="活动名称（不填自动起名）" placeholder-class="placeholder" />
        <picker mode="date" :value="activityDate" @change="onDateChange">
          <view class="field">{{ dateLabel }}</view>
        </picker>
        <picker mode="time" :value="activityTime" @change="onTimeChange">
          <view class="field">{{ timeLabel }}</view>
        </picker>
        <input v-model="activityLocation" class="field" placeholder="地点" placeholder-class="placeholder" />
        <input v-model="activityPeople" class="field" type="number" placeholder="几个人，自己来填 1" placeholder-class="placeholder" />
        <button class="create-btn block" :disabled="submitting" @tap="onCreate">确认发起</button>
        <text class="text-link" @tap="showCreate = false">先不发了</text>
      </view>
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

/** 数量预拼成字符串，模板里不要写 .length。 */
const countText = computed(() => {
  const total = activities.value.length
  return total > 0 ? `${total} 个` : ''
})

const dateLabel = computed(() => activityDate.value || '选择日期')
const timeLabel = computed(() => activityTime.value || '选择时间')

const activityCards = computed(() =>
  activities.value.map((item) => {
    const title = typeof item.name === 'string' && item.name ? item.name : '未命名活动'
    const place = typeof item.location === 'string' ? item.location : ''
    const when = formatWhen(item.scheduledAt)
    const who = typeof item.userName === 'string' ? item.userName : ''
    const dishCount = item.items ? item.items.length : 0
    const people = item.totalPeople || 0
    return {
      id: item.id,
      title,
      status: statusLabel(item.status),
      statusSkin: `status ${statusClass(item.status)}`,
      when: place ? `${when} · ${place}` : when,
      summary: `${who} 发起 · ${dishCount} 道菜 · 共 ${people} 人`,
    }
  }),
)

function statusLabel(status: ActivityStatus) {
  return { open: '待答复', replied: '已答复', withdrawn: '已撤回', completed: '已完成' }[status]
}

/** 状态标色：待答复最醒目，已撤回置灰。 */
function statusClass(status: ActivityStatus) {
  return { open: 'open', replied: 'replied', withdrawn: 'withdrawn', completed: 'completed' }[status]
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
  if (!activityDate.value || !activityTime.value || !activityLocation.value.trim()) {
    uni.showToast({ title: '请填写时间和地点', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await auth.ensureLogin()
    const created = await createActivity({
      name: activityName.value.trim() || undefined,
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

.page-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 12px;
}

.head-title {
  font-size: 17px;
  font-weight: 700;
  color: #2f2c28;
  flex: 1;
}

.head-count {
  color: #8a8680;
  font-size: 12px;
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

.create-btn {
  background: #5b8f7a;
  color: #fff;
  border-radius: 999px;
  font-size: 13px;
  margin: 0;
  padding: 0 14px;
  line-height: 30px;
  height: 30px;
  flex-shrink: 0;
  text-align: center;
}

.create-btn.block {
  display: block;
  margin: 12px 0 0;
  height: 42px;
  line-height: 42px;
  font-size: 15px;
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
  flex: 1;
  min-width: 0;
}

.status {
  flex-shrink: 0;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  background: #e6f0eb;
  color: #3d6f5c;
}

.status.replied {
  background: #e3ecf4;
  color: #4a6f94;
}

.status.withdrawn {
  background: #f0ece6;
  color: #9a958c;
}

.status.completed {
  background: #e9e4dc;
  color: #5c5852;
}

.meta {
  display: block;
  margin-top: 6px;
  color: #8a8680;
  font-size: 13px;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(44, 42, 38, 0.5);
  z-index: 30;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: #fffcf7;
  border-radius: 20px 20px 0 0;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.sheet-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.text-link {
  margin-top: 14px;
  text-align: center;
  color: #8a8680;
  font-size: 13px;
}
</style>
