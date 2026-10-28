<template>
  <view class="page">
    <BrandNav />
    <view class="body">
    <PageLoading v-if="loading" />
    <view v-else-if="errorMessage" class="center">{{ errorMessage }}</view>
    <template v-else-if="activity">
      <view class="card">
        <view class="row">
          <text class="name">{{ activity.name }}</text>
          <text class="status">{{ statusLabel(activity.status) }}</text>
        </view>
        <text class="meta">{{ whenText }}</text>
        <view class="people-row">
          <text class="meta">{{ peopleText }}</text>
          <view class="people-avatars" @tap="showPeople = true">
            <view
              v-for="(person, index) in participantAvatars"
              :key="person.id"
              class="stack-item"
              :style="{ zIndex: participantAvatars.length - index }"
            >
              <image v-if="person.showAvatar" class="stack-avatar" :src="person.avatarSrc" mode="aspectFill" />
              <view v-else class="stack-avatar stack-fallback">{{ person.initial }}</view>
            </view>
            <text v-if="participantMoreText" class="stack-more">{{ participantMoreText }}</text>
            <text v-else class="people-btn">参加人</text>
          </view>
        </view>
        <text v-if="activity.replyNote" class="meta">答复：{{ activity.replyNote }}</text>
        <view class="share-row">
          <button class="ghost" hover-class="none" open-type="share">发给好友</button>
        </view>
      </view>

      <view v-if="showJoin" class="card">
        <text class="section">确认参加</text>
        <text class="meta">先看活动内容。确认后才能加菜。选择你这边几个人来。</text>
        <picker mode="selector" :range="peopleOptions" :value="joinIndex" @change="onJoinPeopleChange">
          <view class="field">{{ joinPeopleLabel }}</view>
        </picker>
        <button class="primary" @tap="onJoin">确认参加</button>
      </view>

      <view v-if="activity.canEdit" class="card">
        <text class="section">修改活动</text>
        <DateTimeField
          v-model:date="editDate"
          v-model:time="editTime"
          :min-date="minDate"
          @change="onEditDateTimeChange"
        />
        <input v-model="editName" class="field" placeholder="活动名称" />
        <input v-model="editLocation" class="field" placeholder="地点" />
        <button class="primary" :disabled="saving" @tap="onSave">保存修改</button>
      </view>

      <view class="card">
        <text class="section">菜品</text>
        <view v-if="emptyDishText" class="meta">{{ emptyDishText }}</view>
        <view v-for="row in sharedCards" :key="'s-' + row.id" class="dish">
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
        <view v-for="row in repeatCards" :key="'r-' + row.key" class="repeat-dish">
          <view class="avatar-stack">
            <view v-for="(person, index) in row.avatars" :key="person.id" class="stack-item" :style="{ zIndex: row.avatars.length - index }">
              <image v-if="person.showAvatar" class="stack-avatar" :src="person.avatarSrc" mode="aspectFill" />
              <view v-else class="stack-avatar stack-fallback">{{ person.initial }}</view>
            </view>
            <text v-if="row.moreText" class="stack-more">{{ row.moreText }}</text>
          </view>
          <view class="dish">
            <image
              v-if="row.showCover"
              class="thumb"
              :src="row.coverSrc"
              mode="aspectFill"
              @error="onThumbError(row.thumbId)"
            />
            <view v-else class="thumb thumb-empty">暂无</view>
            <view class="dish-main">
              <text class="dish-title">{{ row.title }}</text>
              <text v-if="row.extra" class="dish-meta">{{ row.extra }}</text>
            </view>
            <text v-if="row.canRemove && row.myItemId" class="remove" @tap="onRemove(row.myItemId)">移除</text>
          </view>
        </view>
        <button v-if="canAddDish" class="primary" @tap="goAddDish">去加菜</button>
      </view>

      <view v-if="showEatFirst" class="card">
        <text class="section">手机先吃</text>
        <view v-if="activity.photos.length" class="photos">
          <image
            v-for="photo in activity.photos"
            :key="photo.id"
            class="photo"
            :src="absoluteUrl(photo.url)"
            mode="aspectFill"
            @tap="preview(photo.url)"
          />
        </view>
        <view v-else class="empty-photo">
          <text class="meta">还没有照片，先上传一张吧</text>
        </view>
        <button v-if="activity.canUpload" class="primary" @tap="onUpload">上传照片</button>
      </view>

      <view v-if="activity.canWithdraw || activity.canComplete" class="actions">
        <button v-if="activity.canComplete" class="primary" @tap="onComplete">已参加</button>
        <button v-if="activity.canWithdraw" class="danger" @tap="onWithdraw">撤回</button>
      </view>

      <view v-if="showPeople" class="mask" @tap="showPeople = false">
        <view class="sheet" @tap.stop>
          <text class="sheet-title">参加人</text>
          <scroll-view scroll-y class="sheet-list">
            <view v-for="person in personCards" :key="person.id" class="person">
              <image v-if="person.showAvatar" class="person-avatar" :src="person.avatarSrc" mode="aspectFill" />
              <view v-else class="person-avatar person-fallback">{{ person.initial }}</view>
              <text class="person-name">{{ person.title }}</text>
              <text class="person-count">{{ person.countText }}</text>
            </view>
          </scroll-view>
          <text class="text-link" @tap="showPeople = false">关闭</text>
        </view>
      </view>
    </template>
    </view>
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
import BrandNav from '@/components/BrandNav.vue'
import DateTimeField from '@/components/DateTimeField.vue'
import PageLoading from '@/components/PageLoading.vue'
import { absoluteUrl } from '@/config'
import { useAuthStore } from '@/stores/auth'
import {
  PEOPLE_OPTIONS,
  assertFutureSchedule,
  defaultActivityName,
  peopleCountOf,
  todayText,
} from '@/utils/activityForm'

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
const joinIndex = ref(0)
const showPeople = ref(false)
const peopleOptions = PEOPLE_OPTIONS
const minDate = computed(() => todayText())
const joinPeopleLabel = computed(() => peopleOptions[joinIndex.value] || '1人')
const editAutoName = ref('')
let activityId = 0
let shareCode = ''

interface DishCard {
  id: number
  title: string
  extra: string
  coverSrc: string
  showCover: boolean
  canRemove: boolean
}

interface StackPerson {
  id: number
  title: string
  avatarSrc: string
  showAvatar: boolean
  initial: string
}

interface RepeatDishCard {
  key: string
  thumbId: number
  title: string
  extra: string
  coverSrc: string
  showCover: boolean
  canRemove: boolean
  myItemId: number | null
  avatars: StackPerson[]
  moreText: string
}

const myId = computed(() => auth.profile?.id)
const whenText = computed(() => {
  const current = activity.value
  if (!current) {
    return ''
  }
  const when = (current.scheduledAt || '').replace('T', ' ').slice(0, 16)
  const place = current.location || ''
  return place ? `${when} · ${place}` : when
})
const peopleText = computed(() => {
  const current = activity.value
  if (!current) {
    return ''
  }
  return `共 ${current.totalPeople || 0} 人`
})
const canAddDish = computed(() => Boolean(activity.value?.canAdd))
/** 邀请阶段不展示手机先吃；点「已参加」完成活动后才出现。 */
const showEatFirst = computed(() => {
  const current = activity.value
  if (!current) {
    return false
  }
  return current.status === 'completed' && (current.photos.length > 0 || Boolean(current.canUpload))
})
const personCards = computed(() => {
  const current = activity.value
  if (!current) {
    return [] as Array<{ id: number; title: string; countText: string; avatarSrc: string; showAvatar: boolean; initial: string }>
  }
  return current.participants.map((person) => {
    const title = person.name || '未命名'
    const avatarSrc = person.avatar ? absoluteUrl(person.avatar) : ''
    return {
      id: person.id,
      title,
      countText: `${person.peopleCount || 1} 人`,
      avatarSrc,
      showAvatar: Boolean(avatarSrc),
      initial: title.slice(0, 1),
    }
  })
})
const participantAvatars = computed(() => personCards.value.slice(0, 6).map((person) => ({
  id: person.id,
  avatarSrc: person.avatarSrc,
  showAvatar: person.showAvatar,
  initial: person.initial,
})))
const participantMoreText = computed(() => {
  const total = personCards.value.length
  return total > 6 ? `...等${total}人` : ''
})
const emptyDishText = computed(() => {
  const current = activity.value
  if (!current || current.items.length) {
    return ''
  }
  return current.canAdd ? '还没有菜，可以去加。' : '还没有菜，确认参加后可以加。'
})
const sharedCards = computed(() => {
  const current = activity.value
  if (!current) {
    return [] as DishCard[]
  }
  return current.items.filter((item) => !item.allowRepeat).map((item) => toDishCard(current, item, true))
})
const repeatCards = computed(() => {
  const current = activity.value
  if (!current) {
    return [] as RepeatDishCard[]
  }
  const groups = new Map<string, ActivityItem[]>()
  for (const item of current.items) {
    if (!item.allowRepeat) {
      continue
    }
    const key = item.dishId != null ? `dish-${item.dishId}` : `item-${item.id}`
    const list = groups.get(key) || []
    list.push(item)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([key, items]) => {
    const first = items[0]
    const people = new Map<number, StackPerson>()
    for (const item of items) {
      if (people.has(item.addedByUserId)) {
        continue
      }
      const person = current.participants.find((entry) => entry.id === item.addedByUserId)
      const title = person?.name || item.addedByUserName || '未命名'
      const avatar = person?.avatar || item.addedByUserAvatar
      const avatarSrc = avatar ? absoluteUrl(avatar) : ''
      people.set(item.addedByUserId, {
        id: item.addedByUserId,
        title,
        avatarSrc,
        showAvatar: Boolean(avatarSrc),
        initial: title.slice(0, 1),
      })
    }
    const allPeople = [...people.values()]
    const visible = allPeople.slice(0, 5)
    const mine = items.find((item) => item.addedByUserId === myId.value)
    const cover = typeof first.dishImageUrl === 'string' ? first.dishImageUrl : ''
    const failed = failedThumbs[first.id] === true
    return {
      key,
      thumbId: first.id,
      title: typeof first.dishName === 'string' && first.dishName ? first.dishName : '未命名菜品',
      extra: itemText(first),
      coverSrc: cover ? absoluteUrl(cover) : '',
      showCover: cover !== '' && !failed,
      canRemove: Boolean(
        mine && (current.status === 'open' || current.status === 'replied'),
      ),
      myItemId: mine?.id ?? null,
      avatars: visible,
      moreText: allPeople.length > 5 ? `...等${allPeople.length}人` : '',
    }
  })
})

function toDishCard(current: Activity, item: ActivityItem, withWho: boolean): DishCard {
  const cover = typeof item.dishImageUrl === 'string' ? item.dishImageUrl : ''
  const failed = failedThumbs[item.id] === true
  const detail = itemText(item)
  const who = withWho ? item.addedByUserName : ''
  return {
    id: item.id,
    title: typeof item.dishName === 'string' && item.dishName ? item.dishName : '未命名菜品',
    extra: [who, detail].filter(Boolean).join(' · '),
    coverSrc: cover ? absoluteUrl(cover) : '',
    showCover: cover !== '' && !failed,
    canRemove: (current.status === 'open' || current.status === 'replied') && item.addedByUserId === myId.value,
  }
}

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
  editAutoName.value = defaultActivityName(editDate.value)
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

function onEditDateTimeChange(payload: { date: string; time: string }) {
  if (!payload.date) {
    return
  }
  const next = defaultActivityName(payload.date)
  if (!editName.value || editName.value === editAutoName.value) {
    editName.value = next
  }
  editAutoName.value = next
}

function onJoinPeopleChange(event: { detail: { value: string } }) {
  joinIndex.value = Number(event.detail.value) || 0
}

async function onSave() {
  if (!activity.value || saving.value) {
    return
  }
  if (!editName.value.trim() || !editDate.value || !editTime.value || !editLocation.value.trim()) {
    uni.showToast({ title: '请填写名称、时间和地点', icon: 'none' })
    return
  }
  try {
    assertFutureSchedule(editDate.value, editTime.value)
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '时间无效', icon: 'none' })
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
  try {
    activity.value = await joinActivity(activity.value.shareCode, peopleCountOf(joinIndex.value))
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
    title: '确认已参加',
    content: '确认后不能再加菜，可以上传「手机先吃」照片',
    success: async (res) => {
      if (!res.confirm || !activity.value) {
        return
      }
      try {
        activity.value = await completeActivity(activity.value.id)
        uni.showToast({ title: '已参加', icon: 'success' })
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
  box-sizing: border-box;
}

.body {
  padding: 12px 12px 28px;
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

.people-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.people-row .meta {
  margin-top: 6px;
}

.people-avatars {
  display: flex;
  align-items: center;
  padding-left: 8px;
  margin-top: 4px;
  flex-shrink: 0;
}

.people-btn {
  margin-left: 8px;
  color: #3d6f5c;
  font-size: 13px;
  font-weight: 700;
}

.empty-photo {
  padding: 8px 0 4px;
}

.repeat-dish {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #efeae2;
}

.avatar-stack {
  display: flex;
  align-items: center;
  padding-left: 8px;
  margin-bottom: 6px;
}

.stack-item {
  margin-left: -8px;
  position: relative;
}

.stack-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fffcf7;
  background: #dce9e1;
  box-sizing: border-box;
}

.stack-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-size: 12px;
  font-weight: 700;
}

.stack-more {
  margin-left: 8px;
  color: #8a8680;
  font-size: 12px;
  font-weight: 600;
}

.person-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dce9e1;
  flex-shrink: 0;
}

.person-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-size: 16px;
  font-weight: 700;
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
}

.sheet-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.sheet-list {
  max-height: 50vh;
}

.person {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #efeae2;
}

.person-avatar {
  width: 40px;
  height: 40px;
  font-size: 16px;
}

.person-name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2f2c28;
}

.person-count {
  flex-shrink: 0;
  color: #5c5852;
  font-size: 13px;
}

.text-link {
  display: block;
  margin-top: 14px;
  text-align: center;
  color: #8a8680;
  font-size: 13px;
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
