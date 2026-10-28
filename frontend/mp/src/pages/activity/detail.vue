<template>
  <view class="page">
    <view v-if="loading" class="center">加载中</view>
    <view v-else-if="errorMessage" class="center">{{ errorMessage }}</view>
    <template v-else-if="activity">
      <view class="card">
        <view class="row">
          <text class="name">{{ activity.name }}</text>
          <text class="status">{{ statusLabel(activity.status) }}</text>
        </view>
        <text class="meta">{{ formatWhen(activity.scheduledAt) }} · {{ activity.location }}</text>
        <text class="meta">{{ participantText }}</text>
        <text v-if="activity.replyNote" class="meta">答复：{{ activity.replyNote }}</text>
        <view class="share-row">
          <button class="ghost" hover-class="none" open-type="share">发给好友</button>
        </view>
      </view>

      <view v-if="showJoin" class="card">
        <text class="section">确认参加</text>
        <text class="meta">先看活动内容。确认后才能加菜。自己来填 1，有人一起就改人数。</text>
        <input v-model="joinCount" class="field" type="number" />
        <button class="primary" @tap="onJoin">确认参加</button>
      </view>

      <view v-if="activity.canEdit" class="card">
        <text class="section">修改活动</text>
        <input v-model="editName" class="field" placeholder="活动名称" />
        <picker mode="date" :value="editDate" @change="onDateChange">
          <view class="field">{{ editDate || '选择日期' }}</view>
        </picker>
        <picker mode="time" :value="editTime" @change="onTimeChange">
          <view class="field">{{ editTime || '选择时间' }}</view>
        </picker>
        <input v-model="editLocation" class="field" placeholder="地点" />
        <button class="primary" :disabled="saving" @tap="onSave">保存修改</button>
      </view>

      <view class="card">
        <text class="section">菜品</text>
        <view v-if="!activity.items.length" class="meta">
          {{ activity.canAdd ? '还没有菜，可以去加。' : '还没有菜，确认参加后可以加。' }}
        </view>
        <view v-for="row in dishCards" :key="row.id" class="dish">
          <image
            v-if="row.showCover"
            class="thumb"
            :src="row.coverSrc"
            mode="aspectFill"
            @error="onThumbError(row.id)"
          />
          <view v-else class="thumb thumb-empty">暂无</view>
          <view class="dish-main">
            <text class="dish-title">{{ row.title }}</text>
            <text v-if="row.extra" class="dish-meta">{{ row.extra }}</text>
          </view>
          <text v-if="row.canRemove" class="remove" @tap="onRemove(row.id)">移除</text>
        </view>
        <button v-if="activity.canAdd" class="primary" @tap="goAddDish">去加菜</button>
      </view>

      <view v-if="activity.photos.length || activity.canUpload" class="card">
        <text class="section">手机先吃</text>
        <view class="photos">
          <image
            v-for="photo in activity.photos"
            :key="photo.id"
            class="photo"
            :src="absoluteUrl(photo.url)"
            mode="aspectFill"
            @tap="preview(photo.url)"
          />
        </view>
        <button v-if="activity.canUpload" class="primary" @tap="onUpload">上传照片</button>
      </view>

      <view v-if="activity.canWithdraw || activity.canComplete" class="actions">
        <button v-if="activity.canComplete" class="primary" @tap="onComplete">手机先吃</button>
        <button v-if="activity.canWithdraw" class="danger" @tap="onWithdraw">撤回</button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import type { Activity, ActivityItem, ActivityStatus } from '@our-pact/shared'
import {
  completeActivity,
  deleteActivityItem,
  getActivity,
  getActivityByCode,
  joinActivity,
  updateActivity,
  uploadActivityPhoto,
  withdrawActivity,
} from '@/api/activity'
import { absoluteUrl } from '@/config'
import { useAuthStore } from '@/stores/auth'

const PENDING_KEY = 'our-pact.pending-activity'

const auth = useAuthStore()
const activity = ref<Activity | null>(null)
const failedThumbs = reactive<Record<number, boolean>>({})
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const editName = ref('')
const editDate = ref('')
const editTime = ref('')
const editLocation = ref('')
const joinCount = ref('1')
let activityId = 0
let shareCode = ''

const myId = computed(() => auth.profile?.id)
const participantText = computed(() => {
  const current = activity.value
  if (!current) {
    return ''
  }
  const names = current.participants.map((item) => `${item.name} ${item.peopleCount || 1}人`).join('、')
  return `${names} · 共 ${current.totalPeople} 人`
})
const dishCards = computed(() => {
  const current = activity.value
  if (!current) {
    return [] as Array<{
      id: number
      title: string
      extra: string
      coverSrc: string
      showCover: boolean
      canRemove: boolean
    }>
  }
  return current.items.map((item) => {
    const cover = typeof item.dishImageUrl === 'string' ? item.dishImageUrl : ''
    const failed = failedThumbs[item.id] === true
    const extra = [item.addedByUserName, itemText(item)].filter(Boolean).join(' · ')
    return {
      id: item.id,
      title: typeof item.dishName === 'string' && item.dishName ? item.dishName : '未命名菜品',
      extra,
      coverSrc: cover ? absoluteUrl(cover) : '',
      showCover: cover !== '' && !failed,
      canRemove: (current.status === 'open' || current.status === 'replied') && item.addedByUserId === myId.value,
    }
  })
})

function onThumbError(itemId: number) {
  failedThumbs[itemId] = true
}

const showJoin = computed(() => {
  const current = activity.value
  const me = myId.value
  if (!current || me == null) {
    return false
  }
  const joined = current.userId === me || current.participantIds.includes(me)
  return !joined && (current.status === 'open' || current.status === 'replied')
})

function statusLabel(status: ActivityStatus) {
  return { open: '待答复', replied: '已答复', withdrawn: '已撤回', completed: '已完成' }[status]
}

function formatWhen(value: string) {
  return value.replace('T', ' ').slice(0, 16)
}

function itemText(item: ActivityItem) {
  return [...item.options.map((opt) => `${opt.groupName}：${opt.optionLabel}`), item.note || ''].filter(Boolean).join(' · ')
}

function fillEdit(current: Activity) {
  const text = current.scheduledAt.replace('T', ' ')
  editName.value = current.name
  editDate.value = text.slice(0, 10)
  editTime.value = text.slice(11, 16)
  editLocation.value = current.location
}

async function load() {
  loading.value = !activity.value
  errorMessage.value = ''
  try {
    await auth.ensureLogin()
    await auth.loadProfile()
    if (shareCode && !activityId) {
      activity.value = await getActivityByCode(shareCode)
      activityId = activity.value.id
    } else {
      activity.value = await getActivity(activityId)
    }
    fillEdit(activity.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function onDateChange(event: { detail: { value: string } }) {
  editDate.value = event.detail.value
}

function onTimeChange(event: { detail: { value: string } }) {
  editTime.value = event.detail.value
}

async function onSave() {
  if (!activity.value || saving.value) {
    return
  }
  if (!editName.value.trim() || !editDate.value || !editTime.value || !editLocation.value.trim()) {
    uni.showToast({ title: '请填写名称、时间和地点', icon: 'none' })
    return
  }
  saving.value = true
  try {
    activity.value = await updateActivity(activity.value.id, {
      name: editName.value.trim(),
      scheduledAt: `${editDate.value}T${editTime.value}:00`,
      location: editLocation.value.trim(),
    })
    fillEdit(activity.value)
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function goAddDish() {
  if (!activity.value) {
    return
  }
  uni.setStorageSync(PENDING_KEY, { id: activity.value.id, title: activity.value.name })
  uni.switchTab({ url: '/pages/menu/menu' })
}

function onRemove(itemId: number) {
  if (!activity.value) {
    return
  }
  uni.showModal({
    title: '移除这道菜',
    content: '只会移除你自己加的菜',
    success: async (res) => {
      if (!res.confirm || !activity.value) {
        return
      }
      try {
        activity.value = await deleteActivityItem(activity.value.id, itemId)
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '移除失败', icon: 'none' })
      }
    },
  })
}

async function onJoin() {
  if (!activity.value) {
    return
  }
  const count = Number(joinCount.value)
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    uni.showToast({ title: '人数请填 1 到 20', icon: 'none' })
    return
  }
  try {
    activity.value = await joinActivity(activity.value.shareCode, count)
    uni.showToast({ title: '已确认参加', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' })
  }
}

function onWithdraw() {
  if (!activity.value) {
    return
  }
  uni.showModal({
    title: '撤回活动',
    content: '撤回后不能再加菜，管理员会收到通知',
    success: async (res) => {
      if (!res.confirm || !activity.value) {
        return
      }
      try {
        activity.value = await withdrawActivity(activity.value.id)
        uni.showToast({ title: '已撤回', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '撤回失败', icon: 'none' })
      }
    },
  })
}

function onComplete() {
  if (!activity.value) {
    return
  }
  uni.showModal({
    title: '手机先吃',
    content: '完成后不能再加菜，参与人可以上传照片',
    success: async (res) => {
      if (!res.confirm || !activity.value) {
        return
      }
      try {
        activity.value = await completeActivity(activity.value.id)
        uni.showToast({ title: '已完成', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '操作失败', icon: 'none' })
      }
    },
  })
}

function onUpload() {
  if (!activity.value) {
    return
  }
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const path = res.tempFilePaths[0]
      if (!path || !activity.value) {
        return
      }
      try {
        activity.value = await uploadActivityPhoto(activity.value.id, path)
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '上传失败', icon: 'none' })
      }
    },
  })
}

function preview(url?: string | null) {
  if (!activity.value || !url) {
    return
  }
  uni.previewImage({
    current: absoluteUrl(url),
    urls: activity.value.photos.map((item) => absoluteUrl(item.url)).filter(Boolean),
  })
}

function enableShare() {
  uni.showShareMenu({ menus: ['shareAppMessage'] })
}

onLoad((query) => {
  activityId = Number(query?.id) || 0
  shareCode = typeof query?.code === 'string' ? query.code : ''
  enableShare()
})

onShow(() => {
  enableShare()
  if (activityId || shareCode) {
    void load()
  }
})

onShareAppMessage(() => ({
  title: activity.value ? `${activity.value.name}，来加道菜` : '来加道菜',
  path: activity.value ? `/pages/activity/detail?code=${activity.value.shareCode}` : '/pages/activity/activity',
}))
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 12px 28px;
  box-sizing: border-box;
}

.center {
  padding: 80px 16px;
  text-align: center;
  color: #8a8680;
}

.card {
  background: #fffcf7;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
}

.row,
.share-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dish {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #efeae2;
}

.thumb {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  background: #efeae2;
  flex-shrink: 0;
}

.thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a958c;
  font-size: 12px;
}

.dish-meta {
  display: block;
  margin-top: 4px;
  color: #8a8680;
  font-size: 12px;
  line-height: 1.4;
}

.name,
.section,
.dish-title {
  font-weight: 700;
}

.section {
  display: block;
  margin-bottom: 10px;
}

.status,
.remove {
  color: #3d6f5c;
  font-size: 12px;
  flex-shrink: 0;
}

.remove {
  color: #b0654a;
}

.meta {
  display: block;
  margin-top: 6px;
  color: #8a8680;
  font-size: 13px;
}

.share-row {
  margin-top: 10px;
}

.dish-title {
  display: block;
  font-size: 15px;
  color: #2f2c28;
}

.dish-main {
  flex: 1;
  min-width: 0;
}

.field {
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f5f0;
  font-size: 14px;
}

.photos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.photo {
  width: 96px;
  height: 96px;
  border-radius: 10px;
  background: #e8e2d8;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.primary,
.ghost,
.danger {
  border-radius: 999px;
  font-size: 14px;
  margin: 8px 0 0;
}

.primary {
  background: #5b8f7a;
  color: #fff;
}

.ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  line-height: 36px;
  padding: 0 16px;
  background: #e6f0eb;
  color: #3d6f5c;
  margin: 0;
}

.ghost::after {
  border: none;
}

.danger {
  background: #fff;
  color: #b0654a;
  border: 1px solid #e7cfc6;
}
</style>
