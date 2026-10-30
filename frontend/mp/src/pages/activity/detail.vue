<template>
  <view class="page">
    <BrandNav show-back />
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
          <view class="share-end">
            <button v-if="activity.canEdit && !editing" class="text-action inline-action" @tap="startEdit">修改活动</button>
            <view
              v-if="posterDishes.length"
              class="poster-icon"
              :class="{ busy: posterBusy }"
              @tap="onMakePoster"
            >
              <view class="poster-frame">
                <view class="poster-sun" />
                <view class="poster-peak" />
              </view>
            </view>
          </view>
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

      <view v-if="showMemberTools" class="card">
        <text class="section">我的参加</text>
        <text class="meta">可以改你这边几个人来；退出后你加的菜会一并移除。</text>
        <picker
          v-if="activity.canUpdatePeople"
          mode="selector"
          :range="peopleOptions"
          :value="myPeopleIndex"
          @change="onMyPeopleChange"
        >
          <view class="field">{{ myPeopleLabel }}</view>
        </picker>
        <view class="member-actions">
          <button
            v-if="activity.canUpdatePeople"
            class="save-action member-save"
            :disabled="savingPeople"
            @tap="onSavePeople"
          >
            保存人数
          </button>
          <button v-if="activity.canLeave" class="leave-action" :disabled="leaving" @tap="onLeave">退出活动</button>
        </view>
      </view>

      <view v-if="activity.canReply" class="card reply-card">
        <text class="section">确认活动</text>
        <text class="meta">确认后活动进入待参加，大家仍可继续加菜。</text>
        <input v-model="replyNote" class="field" placeholder="可选：答复备注" placeholder-class="placeholder" />
        <button class="primary" :disabled="replying" @tap="onReply">确认活动</button>
      </view>

      <view v-if="activity.canEdit && editing" class="card">
        <text class="section">修改活动</text>
        <DateTimeField
          v-model:date="editDate"
          v-model:time="editTime"
          :min-date="minDate"
          @change="onEditDateTimeChange"
        />
        <input v-model="editName" class="field" placeholder="活动名称" />
        <input v-model="editLocation" class="field" placeholder="地点" />
        <view class="edit-actions">
          <button class="text-action inline-action muted-action" :disabled="saving" @tap="cancelEdit">取消</button>
          <button class="save-action" :disabled="saving" @tap="onSave">保存</button>
        </view>
      </view>

      <view class="card">
        <view class="section-head">
          <text class="section">菜品</text>
          <button v-if="canAddDish" class="text-action section-action" @tap="goAddDish">＋ 添加菜品</button>
        </view>
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
          <view class="dish dish-in-repeat">
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
      </view>

      <view v-if="showEatFirst" class="card">
        <view class="section-head">
          <text class="section">手机先吃</text>
          <button v-if="activity.canUpload" class="text-action section-action" @tap="onUpload">上传照片</button>
        </view>
        <view v-if="activity.photos.length" class="photos">
          <view v-for="photo in activity.photos" :key="photo.id" class="photo-wrap">
            <image
              class="photo"
              :src="absoluteUrl(photo.url)"
              mode="aspectFill"
              @tap="preview(photo.url)"
            />
            <view v-if="photo.userId === myId" class="photo-remove" @tap.stop="onRemovePhoto(photo.id)">×</view>
          </view>
        </view>
        <view v-else class="empty-photo">
          <text class="meta">还没有照片，先上传一张吧</text>
        </view>
      </view>

      <view v-if="activity.canWithdraw || activity.canComplete" class="activity-actions">
        <button v-if="activity.canWithdraw" class="withdraw-action" @tap="onWithdraw">取消活动</button>
        <button v-if="activity.canComplete" class="complete-action" @tap="onComplete">确认已参加</button>
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

      <canvas id="menuPoster" type="2d" class="poster-canvas" />
      <view v-if="posterPath" class="mask poster-mask" @tap="posterPath = ''">
        <view class="poster-sheet" @tap.stop>
          <scroll-view scroll-y class="poster-scroll">
            <image class="poster-image" :src="posterPath" mode="widthFix" />
          </scroll-view>
          <button class="save-action poster-save" @tap="onSavePoster">保存到相册</button>
          <text class="text-link" @tap="posterPath = ''">关闭</text>
        </view>
      </view>
    </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app'
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import { activityStatusLabel, type Activity, type ActivityItem, type ActivityStatus } from '@our-pact/shared'
import {
  completeActivity,
  deleteActivityItem,
  deleteActivityPhoto,
  getActivity,
  joinActivity,
  leaveActivity,
  replyActivity,
  updateActivity,
  updateActivityPeople,
  uploadActivityPhoto,
  withdrawActivity,
} from '@/api/activity'
import BrandNav from '@/components/BrandNav.vue'
import DateTimeField from '@/components/DateTimeField.vue'
import PageLoading from '@/components/PageLoading.vue'
import { absoluteUrl, CANCEL_TEMPLATE_ID, LEAVE_TEMPLATE_ID } from '@/config'
import { getShopProfile } from '@/api/shop'
import { useAuthStore } from '@/stores/auth'
import {
  PEOPLE_OPTIONS,
  assertFutureSchedule,
  defaultActivityName,
  peopleCountOf,
  peopleIndexOf,
  todayText,
} from '@/utils/activityForm'
import { paintMenuPoster } from '@/utils/menuPoster'

const PENDING_KEY = 'our-pact.pending-activity'

const auth = useAuthStore()
const page = getCurrentInstance()
const activity = ref<Activity | null>(null)
const failedThumbs = reactive<Record<number, boolean>>({})
const loading = ref(false)
const saving = ref(false)
const editing = ref(false)
const errorMessage = ref('')
const editName = ref('')
const editDate = ref('')
const editTime = ref('')
const editLocation = ref('')
const joinIndex = ref(0)
const myPeopleIndex = ref(0)
const savingPeople = ref(false)
const leaving = ref(false)
const posterBusy = ref(false)
const posterPath = ref('')
const replying = ref(false)
const replyNote = ref('')
const showPeople = ref(false)
const peopleOptions = PEOPLE_OPTIONS
const minDate = computed(() => todayText())
const joinPeopleLabel = computed(() => peopleOptions[joinIndex.value] || '1人')
const myPeopleLabel = computed(() => peopleOptions[myPeopleIndex.value] || '1人')
const editAutoName = ref('')
let activityId = 0

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

const posterDishes = computed(() => {
  const shared = sharedCards.value.map((row) => ({
    title: row.title,
    extra: row.extra,
    imageUrl: row.showCover ? row.coverSrc : '',
  }))
  const repeats = repeatCards.value.map((row) => {
    const count = row.moreText
      ? Number(row.moreText.replace(/\D/g, '')) || row.avatars.length
      : row.avatars.length
    const countText = count > 1 ? `${count} 人点了` : ''
    return {
      title: row.title,
      extra: [countText, row.extra].filter(Boolean).join(' · '),
      imageUrl: row.showCover ? row.coverSrc : '',
    }
  })
  return [...shared, ...repeats]
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

const showMemberTools = computed(() => {
  const current = activity.value
  return Boolean(current && (current.canUpdatePeople || current.canLeave))
})

function statusLabel(status: ActivityStatus) {
  return activityStatusLabel(status)
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
    activity.value = await getActivity(activityId)
    fillEdit(activity.value)
    syncMyPeopleIndex(activity.value)
    requestOwnerLeaveSubscribe(activity.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function syncMyPeopleIndex(current: Activity) {
  myPeopleIndex.value = peopleIndexOf(current.myPeopleCount || current.peopleCount || 1)
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

function onMyPeopleChange(event: { detail: { value: string } }) {
  myPeopleIndex.value = Number(event.detail.value) || 0
}

async function onSavePeople() {
  if (!activity.value || savingPeople.value || !activity.value.canUpdatePeople) {
    return
  }
  savingPeople.value = true
  try {
    activity.value = await updateActivityPeople(activity.value.id, peopleCountOf(myPeopleIndex.value))
    syncMyPeopleIndex(activity.value)
    uni.showToast({ title: '人数已更新', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' })
  } finally {
    savingPeople.value = false
  }
}

function onLeave() {
  if (!activity.value || leaving.value || !activity.value.canLeave) {
    return
  }
  uni.showModal({
    title: '退出活动',
    content: '退出后你加的菜会移除，并发消息给发起人',
    success: async (res) => {
      if (!res.confirm || !activity.value) {
        return
      }
      leaving.value = true
      try {
        activity.value = await leaveActivity(activity.value.id)
        syncMyPeopleIndex(activity.value)
        uni.showToast({ title: '已退出', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '退出失败', icon: 'none' })
      } finally {
        leaving.value = false
      }
    },
  })
}

async function onReply() {
  if (!activity.value || replying.value || !activity.value.canReply) {
    return
  }
  replying.value = true
  try {
    activity.value = await replyActivity(activity.value.id, replyNote.value.trim())
    replyNote.value = ''
    uni.showToast({ title: '已确认', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '确认失败', icon: 'none' })
  } finally {
    replying.value = false
  }
}

function startEdit() {
  if (!activity.value) {
    return
  }
  fillEdit(activity.value)
  editing.value = true
}

function cancelEdit() {
  if (activity.value) {
    fillEdit(activity.value)
  }
  editing.value = false
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
    editing.value = false
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
  requestCancelSubscribe()
  try {
    activity.value = await joinActivity(activity.value.id, peopleCountOf(joinIndex.value))
    uni.showToast({ title: '已确认参加', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' })
  }
}

/** 参加时请求「活动撤回」订阅授权。用户允许后，活动被撤回时才能收到微信服务通知。 */
function requestCancelSubscribe() {
  if (!CANCEL_TEMPLATE_ID) {
    return
  }
  uni.requestSubscribeMessage({
    tmplIds: [CANCEL_TEMPLATE_ID],
    fail: () => {},
  })
}

/** 发起人授权「退出社团通知」后，才有人退出时能收到服务通知。 */
function requestOwnerLeaveSubscribe(current: Activity) {
  if (!LEAVE_TEMPLATE_ID || !current.owner) {
    return
  }
  uni.requestSubscribeMessage({
    tmplIds: [LEAVE_TEMPLATE_ID],
    fail: () => {},
  })
}

function onWithdraw() {
  if (!activity.value) {
    return
  }
  uni.showModal({
    title: '取消活动',
    content: '取消后不能再加菜，管理员会收到通知',
    success: async (res) => {
      if (!res.confirm || !activity.value) {
        return
      }
      try {
        activity.value = await withdrawActivity(activity.value.id)
        uni.showToast({ title: '已取消', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '取消失败', icon: 'none' })
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

function onRemovePhoto(photoId: number) {
  if (!activity.value) {
    return
  }
  uni.showModal({
    title: '删除这张照片',
    content: '只会删除你自己上传的照片',
    success: async (res) => {
      if (!res.confirm || !activity.value) {
        return
      }
      try {
        activity.value = await deleteActivityPhoto(activity.value.id, photoId)
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '删除失败', icon: 'none' })
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

async function onMakePoster() {
  const current = activity.value
  if (!current || posterBusy.value) {
    return
  }
  posterBusy.value = true
  uni.showLoading({ title: '正在生成', mask: true })
  try {
    const shop = await getShopProfile().catch(() => null)
    const canvas = await posterCanvas()
    await paintMenuPoster(canvas, {
      chefName: (shop?.chefName || '').trim(),
      chefTitle: (shop?.chefTitle || '').trim(),
      chefAvatarUrl: shop?.chefAvatarUrl ? absoluteUrl(shop.chefAvatarUrl) : '',
      shopLocation: (shop?.location || '').trim(),
      slogan: (shop?.slogan || '').trim(),
      activityName: current.name,
      whenText: whenText.value,
      peopleText: peopleText.value,
      dishes: posterDishes.value,
    })
    posterPath.value = await exportPoster(canvas)
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '生成失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    posterBusy.value = false
  }
}

function posterCanvas() {
  return new Promise<Parameters<typeof paintMenuPoster>[0]>((resolve, reject) => {
    const query = uni.createSelectorQuery()
    if (page?.proxy) {
      query.in(page.proxy as never)
    }
    query.select('#menuPoster').fields({ node: true, size: true }).exec((result) => {
      const node = (result?.[0] as { node?: Parameters<typeof paintMenuPoster>[0] } | undefined)?.node
      if (!node) {
        reject(new Error('画布还没准备好'))
        return
      }
      resolve(node)
    })
  })
}

function exportPoster(canvas: Parameters<typeof paintMenuPoster>[0]) {
  return new Promise<string>((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvas: canvas as never,
      fileType: 'png',
      success: (result) => resolve(result.tempFilePath),
      fail: () => reject(new Error('生成失败')),
    })
  })
}

function onSavePoster() {
  const path = posterPath.value
  if (!path) {
    return
  }
  uni.authorize({
    scope: 'scope.writePhotosAlbum',
    success: () => writePoster(path),
    fail: () => {
      uni.showModal({
        title: '需要相册权限',
        content: '保存菜单图片需要允许访问相册',
        confirmText: '去设置',
        success: (result) => {
          if (result.confirm) {
            uni.openSetting({})
          }
        },
      })
    },
  })
}

function writePoster(path: string) {
  uni.saveImageToPhotosAlbum({
    filePath: path,
    success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
    fail: () => uni.showToast({ title: '保存失败', icon: 'none' }),
  })
}

function enableShare() {
  uni.showShareMenu({ menus: ['shareAppMessage'] })
}

onLoad((query) => {
  activityId = Number(query?.id) || 0
  enableShare()
})

onShow(() => {
  enableShare()
  if (!activityId) {
    errorMessage.value = '活动不存在'
    return
  }
  void load()
})

onShareAppMessage(() => ({
  title: activity.value ? `${activity.value.name}，来加道菜` : '来加道菜',
  path: activity.value ? `/pages/activity/detail?id=${activity.value.id}` : '/pages/activity/activity',
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
  overflow: hidden;
}

.row,
.share-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.row {
  align-items: flex-start;
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

.name {
  flex: 1;
  min-width: 0;
  display: block;
  line-height: 1.4;
  word-break: break-all;
}

.section {
  display: block;
  margin-bottom: 10px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
}

.section-head .section {
  margin-bottom: 0;
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
  line-height: 1.45;
  word-break: break-all;
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
  height: 32px;
  padding-left: 8px;
  margin-top: 4px;
  flex-shrink: 0;
}

.people-btn {
  margin-left: 8px;
  color: #3d6f5c;
  font-size: 13px;
  font-weight: 700;
  line-height: 32px;
}

.empty-photo {
  padding: 8px 0 4px;
}

.repeat-dish {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #efeae2;
}

.avatar-stack {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 32px;
  padding-left: 8px;
}

.dish-in-repeat {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  border-top: none;
}

.stack-item {
  margin-left: -8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
}

.stack-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fffcf7;
  background: #dce9e1;
  box-sizing: border-box;
  display: block;
  flex-shrink: 0;
}

.stack-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.stack-more {
  margin-left: 8px;
  color: #8a8680;
  font-size: 12px;
  font-weight: 600;
  line-height: 32px;
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

.photo-wrap {
  position: relative;
  width: 96px;
  height: 96px;
}

.photo {
  width: 96px;
  height: 96px;
  border-radius: 10px;
  background: #e8e2d8;
}

.photo-remove {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 0 10px 0 12px;
  background: rgba(47, 44, 40, 0.72);
  color: #fff;
  font-size: 18px;
  line-height: 32px;
  text-align: center;
}

.activity-actions {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
  margin-top: 4px;
}

.primary,
.ghost,
.save-action {
  border-radius: 999px;
  font-size: 14px;
}

.primary::after,
.text-action::after,
.save-action::after,
.complete-action::after,
.withdraw-action::after,
.ghost::after {
  border: none;
}

.primary {
  height: 44px;
  line-height: 44px;
  border-radius: 12px;
  background: #5b8f7a;
  color: #fff;
  font-size: 15px;
  margin: 12px 0 0;
}

/* 卡片内操作仅保留文字，不再形成横向色块。 */
.text-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  min-height: 44px;
  line-height: 1;
  padding: 0 4px;
  background: transparent;
  color: #3d6f5c;
  font-size: 13px;
  font-weight: 600;
  margin: 4px 0 0 auto;
}

.section-action {
  margin: -4px -4px -4px 0;
}

.inline-action {
  margin: 0;
}

.muted-action {
  color: #8a8680;
}

.edit-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.save-action {
  height: 42px;
  line-height: 42px;
  padding: 0 22px;
  margin: 0;
  border-radius: 12px;
  background: #5b8f7a;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.withdraw-action,
.complete-action {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  display: block;
  box-sizing: border-box;
  height: 44px;
  line-height: 44px;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
}

.complete-action {
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

.share-end {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.poster-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.poster-icon.busy {
  opacity: 0.4;
}

.poster-frame {
  width: 18px;
  height: 15px;
  border: 1.5px solid #3d6f5c;
  border-radius: 3px;
  position: relative;
  box-sizing: border-box;
}

.poster-sun {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #3d6f5c;
}

.poster-peak {
  position: absolute;
  left: 3px;
  bottom: 2px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 5px solid #3d6f5c;
}

.poster-canvas {
  position: fixed;
  left: -2000px;
  top: 0;
  width: 375px;
  height: 200px;
}

.poster-mask {
  z-index: 40;
}

.poster-sheet {
  width: 100%;
  max-height: 86vh;
  background: #fffcf7;
  border-radius: 20px 20px 0 0;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.poster-scroll {
  height: 62vh;
  width: 100%;
}

.poster-image {
  width: 100%;
  display: block;
}

.poster-save {
  display: block;
  width: 100%;
  margin-top: 12px;
}

.withdraw-action {
  background: #fff;
  color: #b0654a;
  border: 1px solid #e7cfc6;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.member-save {
  flex: 1;
}

.leave-action {
  flex: 1;
  height: 42px;
  line-height: 42px;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  background: #fff;
  color: #b0654a;
  border: 1px solid #e7cfc6;
  font-size: 14px;
  font-weight: 600;
}

.leave-action::after {
  border: none;
}
</style>
