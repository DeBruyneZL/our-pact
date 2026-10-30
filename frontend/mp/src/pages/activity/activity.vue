<template>
  <view class="page">
    <BrandNav />
    <view class="body">
      <view class="page-head">
        <text class="head-title">活动</text>
        <text v-if="countText" class="head-count">{{ countText }}</text>
        <view class="create-btn" @tap="openCreate">发起</view>
      </view>

      <view v-if="isAdmin" class="mode-tabs">
        <view :class="listMode === 'mine' ? 'mode-tab active' : 'mode-tab'" @tap="switchMode('mine')">我的</view>
        <view :class="listMode === 'pending' ? 'mode-tab active' : 'mode-tab'" @tap="switchMode('pending')">
          待确认
          <text v-if="pendingBadge" class="mode-badge">{{ pendingBadge }}</text>
        </view>
      </view>

      <PageLoading v-if="loading" :tip="loadingText" />
      <view v-else-if="statusText" class="center">{{ statusText }}</view>
      <template v-else>
        <view
          v-for="row in activityCards"
          :key="row.id"
          :class="row.cardSkin"
          @tap="openDetail(row.id)"
        >
          <view class="row">
            <text class="title">{{ row.title }}</text>
            <text :class="row.statusSkin">{{ row.status }}</text>
          </view>
          <text class="meta">{{ row.when }}</text>
          <text class="meta">{{ row.summary }}</text>
          <text v-if="row.showConfirm" class="confirm-hint">点进去可直接确认</text>
        </view>
        <view v-if="loadingMore" class="more">加载中</view>
        <view v-else-if="noMore" class="more">没有更多了</view>
      </template>
    </view>

    <view v-if="showCreate" class="mask" @tap="showCreate = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">发起活动</text>
        <DateTimeField
          v-model:date="activityDate"
          v-model:time="activityTime"
          :min-date="minDate"
          @change="onDateTimeChange"
        />
        <input v-model="activityName" class="field" placeholder="活动名称" placeholder-class="placeholder" />
        <input v-model="activityLocation" class="field" placeholder="地点" placeholder-class="placeholder" />
        <picker mode="selector" :range="peopleOptions" :value="peopleIndex" @change="onPeopleChange">
          <view class="field">{{ peopleLabel }}</view>
        </picker>
        <text class="sheet-note">先填活动信息，发起后再去点菜。</text>
        <button class="create-btn block" :disabled="submitting" @tap="onCreate">确认发起</button>
        <text class="text-link" @tap="showCreate = false">先不发了</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onReachBottom, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { activityStatusLabel, type Activity, type ActivityStatus } from '@our-pact/shared'
import { createActivity, pageManageActivities, pageMyActivities } from '@/api/activity'
import BrandNav from '@/components/BrandNav.vue'
import DateTimeField from '@/components/DateTimeField.vue'
import PageLoading from '@/components/PageLoading.vue'
import { CREATE_TEMPLATE_ID } from '@/config'
import { useAuthStore } from '@/stores/auth'
import {
  DEFAULT_ACTIVITY_LOCATION,
  PEOPLE_OPTIONS,
  assertFutureSchedule,
  defaultActivityName,
  peopleCountOf,
  todayText,
} from '@/utils/activityForm'
import { setTabBarHidden, syncTabBar } from '@/utils/tabBar'

type ListMode = 'mine' | 'pending'

const auth = useAuthStore()
const activities = ref<Activity[]>([])
const pendingCount = ref(0)
const listMode = ref<ListMode>('mine')
const PAGE_SIZE = 10

const loading = ref(false)
const loadingMore = ref(false)
const pageNum = ref(1)
const total = ref(0)
const reachedEnd = ref(false)
const errorMessage = ref('')
const showCreate = ref(false)
const submitting = ref(false)
const activityName = ref('')
const activityDate = ref('')
const activityTime = ref('18:00')
const activityLocation = ref(DEFAULT_ACTIVITY_LOCATION)
const peopleIndex = ref(0)
const autoName = ref('')

const loadingText = '加载中'
const peopleOptions = PEOPLE_OPTIONS
const minDate = computed(() => todayText())
const isAdmin = computed(() => auth.isSuperAdmin)

const emptyText = computed(() =>
  listMode.value === 'pending' ? '没有待确认的活动' : '还没有活动，可以先发起，菜之后大家一起加',
)

const statusText = computed(() => {
  if (errorMessage.value) {
    return errorMessage.value
  }
  if (!activities.value.length) {
    return emptyText.value
  }
  return ''
})

const countText = computed(() => (total.value > 0 ? `${total.value} 个` : ''))

const noMore = computed(() => reachedEnd.value && activities.value.length > PAGE_SIZE)

const pendingBadge = computed(() => {
  if (pendingCount.value <= 0) {
    return ''
  }
  return pendingCount.value > 99 ? '99+' : String(pendingCount.value)
})

const peopleLabel = computed(() => peopleOptions[peopleIndex.value] || '1人')

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
      cardSkin: `card ${statusClass(item.status)}`,
      when: place ? `${when} · ${place}` : when,
      summary: `${who} 发起 · ${dishCount} 道菜 · 共 ${people} 人`,
      showConfirm: listMode.value === 'pending' && item.status === 'open',
    }
  }),
)

function statusLabel(status: ActivityStatus) {
  return activityStatusLabel(status)
}

function statusClass(status: ActivityStatus) {
  return { open: 'open', replied: 'replied', withdrawn: 'withdrawn', completed: 'completed' }[status]
}

function formatWhen(value: string) {
  return (value || '').replace('T', ' ').slice(0, 16)
}

function syncAutoName(dateText: string) {
  const next = defaultActivityName(dateText)
  if (!activityName.value || activityName.value === autoName.value) {
    activityName.value = next
  }
  autoName.value = next
}

function openCreate() {
  if (!activityDate.value || activityDate.value < minDate.value) {
    activityDate.value = minDate.value
  }
  syncAutoName(activityDate.value)
  if (!activityLocation.value.trim()) {
    activityLocation.value = DEFAULT_ACTIVITY_LOCATION
  }
  peopleIndex.value = 0
  showCreate.value = true
}

function switchMode(mode: ListMode) {
  if (listMode.value === mode) {
    return
  }
  listMode.value = mode
  void load()
}

let loadSeq = 0

function rowsOf(page: { list?: Activity[]; total?: number } | null) {
  return {
    list: Array.isArray(page?.list) ? page.list : [],
    total: Number(page?.total ?? 0),
  }
}

function currentPage(page: number) {
  if (listMode.value === 'pending') {
    return pageManageActivities(page, PAGE_SIZE, 'open')
  }
  return pageMyActivities(page, PAGE_SIZE)
}

async function load() {
  const seq = ++loadSeq
  loading.value = true
  errorMessage.value = ''
  pageNum.value = 1
  reachedEnd.value = false
  try {
    await auth.ensureLogin()
    await auth.loadProfile()
    if (seq !== loadSeq) {
      return
    }
    if (!auth.isSuperAdmin && listMode.value === 'pending') {
      listMode.value = 'mine'
    }
    if (auth.isSuperAdmin) {
      requestAdminCreateSubscribe()
    }
    const page = rowsOf(await currentPage(1))
    if (seq !== loadSeq) {
      return
    }
    activities.value = page.list
    total.value = page.total
    reachedEnd.value = page.list.length >= page.total
    if (!auth.isSuperAdmin) {
      pendingCount.value = 0
    } else if (listMode.value === 'pending') {
      pendingCount.value = page.total
    } else {
      const pending = rowsOf(await pageManageActivities(1, 1, 'open'))
      if (seq !== loadSeq) {
        return
      }
      pendingCount.value = pending.total
    }
  } catch (error) {
    if (seq !== loadSeq) {
      return
    }
    activities.value = []
    total.value = 0
    reachedEnd.value = true
    errorMessage.value = error instanceof Error ? error.message : '加载失败'
  } finally {
    if (seq === loadSeq) {
      loading.value = false
    }
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value || reachedEnd.value || activities.value.length >= total.value) {
    return
  }
  const seq = loadSeq
  loadingMore.value = true
  try {
    const next = pageNum.value + 1
    const page = rowsOf(await currentPage(next))
    if (seq !== loadSeq) {
      return
    }
    const seen = new Set(activities.value.map((item) => item.id))
    const fresh = page.list.filter((item) => !seen.has(item.id))
    if (fresh.length === 0) {
      reachedEnd.value = true
      return
    }
    activities.value = activities.value.concat(fresh)
    total.value = page.total
    pageNum.value = next
    reachedEnd.value = activities.value.length >= total.value
  } catch (error) {
    if (seq !== loadSeq) {
      return
    }
    uni.showToast({ title: error instanceof Error ? error.message : '加载失败', icon: 'none' })
  } finally {
    if (seq === loadSeq) {
      loadingMore.value = false
    }
  }
}

/** 管理员授权后，才有新活动时能收到「新活动发布提醒」。 */
function requestAdminCreateSubscribe() {
  if (!CREATE_TEMPLATE_ID || !auth.isSuperAdmin) {
    return
  }
  uni.requestSubscribeMessage({
    tmplIds: [CREATE_TEMPLATE_ID],
    fail: () => {},
  })
}

function openDetail(id: number) {
  uni.navigateTo({ url: `/pages/activity/detail?id=${id}` })
}

function onDateTimeChange(payload: { date: string; time: string }) {
  if (payload.date) {
    syncAutoName(payload.date)
  }
}

function onPeopleChange(event: { detail: { value: string } }) {
  peopleIndex.value = Number(event.detail.value) || 0
}

async function onCreate() {
  if (submitting.value) {
    return
  }
  if (!activityDate.value || !activityTime.value || !activityLocation.value.trim()) {
    uni.showToast({ title: '请填写时间和地点', icon: 'none' })
    return
  }
  try {
    assertFutureSchedule(activityDate.value, activityTime.value)
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '时间无效', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await auth.ensureLogin()
    const created = await createActivity({
      name: activityName.value.trim() || defaultActivityName(activityDate.value),
      scheduledAt: `${activityDate.value}T${activityTime.value}:00`,
      location: activityLocation.value.trim(),
      peopleCount: peopleCountOf(peopleIndex.value),
      items: [],
    })
    showCreate.value = false
    activityName.value = ''
    autoName.value = ''
    activityLocation.value = DEFAULT_ACTIVITY_LOCATION
    peopleIndex.value = 0
    uni.navigateTo({ url: `/pages/activity/detail?id=${created.id}` })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '发起失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onShow(() => {
  syncTabBar(1)
  setTabBarHidden(false)
  if (!activityDate.value || activityDate.value < todayText()) {
    activityDate.value = todayText()
  }
  void load()
})

onReachBottom(() => {
  void loadMore()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
}

.body {
  padding: 12px 12px calc(24px + 56px + env(safe-area-inset-bottom));
}

.page-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 12px;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  margin: 0 4px 12px;
}

.mode-tab {
  position: relative;
  flex: 1;
  height: 34px;
  line-height: 34px;
  text-align: center;
  border-radius: 999px;
  background: #efeae2;
  color: #5c5852;
  font-size: 13px;
  font-weight: 600;
}

.mode-tab.active {
  background: #e6f0eb;
  color: #3d6f5c;
}

.mode-badge {
  margin-left: 4px;
  padding: 0 6px;
  border-radius: 999px;
  background: #5b8f7a;
  color: #fff;
  font-size: 11px;
  line-height: 16px;
}

.confirm-hint {
  display: block;
  margin-top: 6px;
  color: #3d6f5c;
  font-size: 12px;
  font-weight: 600;
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

.more {
  padding: 8px 0 16px;
  text-align: center;
  color: #8a8680;
  font-size: 12px;
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
  border: 1px solid #c9ddd3;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
}

.card.completed {
  border-color: #d5cfc6;
  background: #f8f6f2;
}

.card.withdrawn {
  border-color: #e4dfd6;
  background: #f4f1eb;
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

.sheet-note {
  display: block;
  margin: 4px 0 8px;
  color: #8a8680;
  font-size: 12px;
  line-height: 1.5;
}

.text-link {
  margin-top: 14px;
  text-align: center;
  color: #8a8680;
  font-size: 13px;
}
</style>
