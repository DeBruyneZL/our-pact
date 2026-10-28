<template>
  <view class="page">
    <view v-if="loading" class="center">{{ loadingText }}</view>
    <view v-else-if="loadError" class="center">{{ loadError }}</view>
    <view v-else-if="emptyMenuText" class="center">{{ emptyMenuText }}</view>

    <view v-else class="menu-wrap">
    <view v-if="addingBar" class="adding-bar">
      <text>{{ addingBar }}</text>
      <text class="adding-back" @tap="backToActivity">返回活动</text>
    </view>
    <view class="menu-tree">
      <scroll-view scroll-y class="cat-side" :style="paneStyle">
        <view
          v-for="cat in catCards"
          :key="cat.id"
          :class="cat.skin"
          @tap="activeCategoryId = cat.id"
        >
          {{ cat.title }}
        </view>
      </scroll-view>

      <scroll-view scroll-y class="dish-pane" :style="paneStyle">
        <view v-if="emptyPaneText" class="center small">{{ emptyPaneText }}</view>
        <view
          v-for="card in dishCards"
          :key="card.id"
          :class="card.skin"
          @tap="onDishTap(card.id)"
        >
          <view class="cover-wrap">
            <image
              v-if="card.showCover"
              :src="card.coverSrc"
              mode="aspectFill"
              class="cover"
              @error="onCoverError(card.id)"
            />
            <view v-else class="cover cover-placeholder">暂无封面</view>
            <view v-if="card.showPick" class="pick-badge">{{ checkMark }}</view>
          </view>
          <view class="dish-info">
            <view class="dish-body">
              <text class="dish-name">{{ card.title }}</text>
              <text class="dish-desc">{{ card.extra }}</text>
            </view>
            <view
              v-if="card.showPlus"
              :class="card.plusSkin"
              @tap.stop="onPlus(card.id)"
            >
              {{ card.plusText }}
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
    </view>

    <view v-if="cartText" class="cart-bar">
      <text>{{ cartText }}</text>
      <button class="cart-btn" size="mini" @tap="showList = true">看清单</button>
    </view>

    <view v-if="showList" class="mask" @tap="showList = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">今日选菜清单</text>
        <scroll-view scroll-y class="sheet-list">
          <view v-for="item in selectedList" :key="item.id" class="sheet-item">
            <view class="sheet-main">
              <text class="sheet-name">{{ item.title }}</text>
            </view>
            <text class="sheet-remove" @tap="removeDish(item.id)">移除</text>
          </view>
          <view v-if="emptySheetText" class="center small">{{ emptySheetText }}</view>
        </scroll-view>
        <template v-if="addingBar">
          <text class="sheet-note">{{ addHint }}</text>
          <button class="cart-btn sheet-btn" :disabled="submitting" @tap="onAddToActivity">加到活动</button>
          <button class="text-btn" @tap="clearPending">取消加菜</button>
        </template>
        <template v-else>
          <input v-model="activityName" class="field" placeholder="活动名称（不填自动起名）" placeholder-class="note-placeholder" />
          <picker mode="date" :value="activityDate" @change="onDateChange">
            <view class="field">{{ dateLabel }}</view>
          </picker>
          <picker mode="time" :value="activityTime" @change="onTimeChange">
            <view class="field">{{ timeLabel }}</view>
          </picker>
          <input v-model="activityLocation" class="field" placeholder="地点" placeholder-class="note-placeholder" />
          <input v-model="activityPeople" class="field" type="number" placeholder="几个人，自己来填 1" placeholder-class="note-placeholder" />
          <button class="cart-btn sheet-btn" :disabled="submitting" @tap="onCreate">发起活动</button>
        </template>
        <button class="text-btn" @tap="showList = false">继续挑</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import type { Dish, DishCategory } from '@our-pact/shared'
import { addActivityItems, createActivity, getActivity } from '@/api/activity'
import { listCategories, listDishes } from '@/api/menu'
import { absoluteUrl } from '@/config'
import { useAuthStore } from '@/stores/auth'

interface SelectedSummary {
  id: number
  title: string
}

const CHECK_MARK = String.fromCharCode(0x2713)
const PLUS_MARK = '+'

const auth = useAuthStore()
const dishes = ref<Dish[]>([])
const categories = ref<DishCategory[]>([])
const activeCategoryId = ref(0)
const loading = ref(false)
const loadError = ref('')
const showList = ref(false)
const submitting = ref(false)
const activityName = ref('')
const activityDate = ref('')
const activityTime = ref('18:00')
const activityLocation = ref('')
const activityPeople = ref('1')
const pendingActivity = ref<{ id: number; title: string } | null>(null)
const addedDishIds = ref<number[]>([])
const addingDishId = ref(0)
const failedCovers = reactive<Record<number, boolean>>({})
const paneHeight = ref(600)
const selected = reactive<Record<number, boolean>>({})
const PENDING_KEY = 'our-pact.pending-activity'
const loadingText = '加载中'
const checkMark = CHECK_MARK
const paneStyle = computed(() => ({ height: `${paneHeight.value}px` }))

const addingTitle = computed(() => pendingActivity.value?.title || '活动')
const addingBar = computed(() => {
  if (!pendingActivity.value) {
    return ''
  }
  return `给「${addingTitle.value}」加菜`
})
const addHint = computed(() => `加到「${addingTitle.value}」。只能加菜，不能改别人的内容。`)
const emptyMenuText = computed(() => (categories.value.length ? '' : '暂无分类，等管理员配置'))
const dateLabel = computed(() => activityDate.value || '选择日期')
const timeLabel = computed(() => activityTime.value || '选择时间')

const selectedCount = computed(() => Object.keys(selected).length)
const cartText = computed(() => {
  if (pendingActivity.value || selectedCount.value <= 0) {
    return ''
  }
  return `已选 ${selectedCount.value} 道`
})
const filteredDishes = computed(() =>
  dishes.value.filter((dish) => dish.categoryId === activeCategoryId.value),
)
const emptyPaneText = computed(() => (filteredDishes.value.length ? '' : '这个分类还没有菜'))
const selectedList = computed<SelectedSummary[]>(() =>
  Object.keys(selected).map(Number).map((id) => {
    const dish = dishes.value.find((entry) => entry.id === id)
    return { id, title: dish?.name || '' }
  }),
)
const emptySheetText = computed(() => (selectedList.value.length ? '' : '还没有选菜'))

const catCards = computed(() =>
  categories.value.map((cat) => ({
    id: cat.id,
    title: cat.name,
    skin: cat.id === activeCategoryId.value ? 'cat-item active' : 'cat-item',
  })),
)

const dishCards = computed(() => {
  const pending = Boolean(pendingActivity.value)
  return filteredDishes.value.map((dish) => {
    const picked = Boolean(selected[dish.id])
    const repeatable = Boolean(dish.allowRepeat)
    const added = addedDishIds.value.includes(dish.id)
    const locked = added && !repeatable
    const coverSrc = dish.imageUrl && !failedCovers[dish.id] ? absoluteUrl(dish.imageUrl) : ''
    let skin = 'dish-card'
    if (pending && locked) {
      skin = 'dish-card added'
    } else if (!pending && picked) {
      skin = 'dish-card selected'
    }
    return {
      id: dish.id,
      title: dish.name || '',
      extra: dish.description || '家常味道',
      coverSrc,
      showCover: Boolean(coverSrc),
      showPick: !pending && picked,
      showPlus: pending,
      plusText: locked ? CHECK_MARK : PLUS_MARK,
      plusSkin: locked ? 'plus done' : 'plus',
      skin,
    }
  })
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    await auth.ensureLogin()
    const [dishList, categoryList] = await Promise.all([
      listDishes(true),
      listCategories(),
    ])
    dishes.value = dishList
    categories.value = categoryList
    if (!categoryList.length) {
      return
    }
    if (!activeCategoryId.value || !categoryList.some((item) => item.id === activeCategoryId.value)) {
      activeCategoryId.value = categoryList[0].id
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '加载菜单失败'
  } finally {
    loading.value = false
    updatePaneHeight()
  }
}

function updatePaneHeight() {
  const windowHeight = uni.getSystemInfoSync().windowHeight
  const banner = pendingActivity.value ? 42 : 0
  paneHeight.value = Math.max(windowHeight - banner, 200)
}

function onCoverError(dishId: number) {
  failedCovers[dishId] = true
}

function onDishTap(dishId: number) {
  if (pendingActivity.value) {
    return
  }
  if (selected[dishId]) {
    delete selected[dishId]
    return
  }
  selected[dishId] = true
}

function removeDish(dishId: number) {
  delete selected[dishId]
  if (!selectedCount.value) {
    showList.value = false
  }
}

function onDateChange(event: { detail: { value: string } }) {
  activityDate.value = event.detail.value
}

function onTimeChange(event: { detail: { value: string } }) {
  activityTime.value = event.detail.value
}

function storedTitle(value: { title?: unknown; name?: unknown }) {
  if (typeof value.title === 'string' && value.title) {
    return value.title
  }
  if (typeof value.name === 'string' && value.name) {
    return value.name
  }
  return ''
}

function readPending() {
  const value = uni.getStorageSync(PENDING_KEY) as { id?: number; title?: string; name?: string } | ''
  if (!value || typeof value !== 'object' || !value.id) {
    pendingActivity.value = null
    addedDishIds.value = []
    return
  }
  pendingActivity.value = { id: Number(value.id), title: storedTitle(value) }
}

async function loadAdded() {
  const pending = pendingActivity.value
  if (!pending) {
    addedDishIds.value = []
    return
  }
  try {
    const activity = await getActivity(pending.id)
    pendingActivity.value = { id: pending.id, title: activity.name || pending.title }
    addedDishIds.value = activity.items
      .map((item) => item.dishId)
      .filter((dishId): dishId is number => dishId != null)
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '活动加载失败', icon: 'none' })
  }
}

async function onPlus(dishId: number) {
  if (!pendingActivity.value || addingDishId.value) {
    return
  }
  const dish = dishes.value.find((item) => item.id === dishId)
  if (!dish?.allowRepeat && addedDishIds.value.includes(dishId)) {
    uni.showToast({ title: '这道菜已经加过了', icon: 'none' })
    return
  }
  addingDishId.value = dishId
  try {
    await auth.ensureLogin()
    const activity = await addActivityItems(pendingActivity.value.id, [{ dishId }])
    addedDishIds.value = activity.items
      .map((item) => item.dishId)
      .filter((id): id is number => id != null)
    uni.showToast({ title: '已加上', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加菜失败', icon: 'none' })
  } finally {
    addingDishId.value = 0
  }
}

function backToActivity() {
  const id = pendingActivity.value?.id
  clearPending()
  if (!id) {
    return
  }
  uni.navigateTo({ url: `/pages/activity/detail?id=${id}` })
}

function clearPending() {
  uni.removeStorageSync(PENDING_KEY)
  pendingActivity.value = null
}

function todayText() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function buildItems() {
  return Object.keys(selected).map(Number).map((dishId) => ({ dishId }))
}

function clearSelection() {
  for (const key of Object.keys(selected)) {
    delete selected[Number(key)]
  }
  showList.value = false
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
      items: buildItems(),
    })
    clearSelection()
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

async function onAddToActivity() {
  if (!pendingActivity.value || submitting.value) {
    return
  }
  submitting.value = true
  try {
    await auth.ensureLogin()
    const id = pendingActivity.value.id
    await addActivityItems(id, buildItems())
    clearPending()
    clearSelection()
    uni.navigateTo({ url: `/pages/activity/detail?id=${id}` })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加菜失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onShow(() => {
  readPending()
  updatePaneHeight()
  if (!activityDate.value) {
    activityDate.value = todayText()
  }
  void load()
  void loadAdded()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.center {
  display: flex;
  justify-content: center;
  padding: 80px 16px;
  color: #8a8680;
  font-size: 14px;
}

.center.small {
  padding: 40px 16px;
  font-size: 13px;
}

.menu-wrap {
  flex: 1;
  height: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.adding-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 42px;
  padding: 0 14px;
  box-sizing: border-box;
  background: #e6f0eb;
  color: #3d6f5c;
  font-size: 13px;
}

.adding-back {
  flex-shrink: 0;
  font-weight: 700;
}

.menu-tree {
  flex: 1;
  height: 0;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.cat-side {
  width: 88px;
  flex-shrink: 0;
  background: #efeae2;
  border-right: 1px solid #e5e1d8;
}

.cat-item {
  padding: 16px 10px;
  font-size: 13px;
  color: #5c5852;
  text-align: center;
  line-height: 1.35;
  position: relative;
}

.cat-item.active {
  background: #f7f5f0;
  color: #3d6f5c;
  font-weight: 700;
}

.cat-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: #5b8f7a;
}

.dish-pane {
  flex: 1;
  min-width: 0;
  padding: 10px 10px 72px;
  box-sizing: border-box;
}

.dish-card {
  position: relative;
  display: flex;
  align-items: stretch;
  background: #fffcf7;
  border: 1px solid #e5e1d8;
  border-radius: 12px;
  margin-bottom: 8px;
  overflow: hidden;
}

.dish-card.added {
  border-color: #5b8f7a;
  background: #f3f8f5;
}

.dish-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
}

.plus {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #5b8f7a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  box-sizing: border-box;
}

.plus.done {
  background: #8aa89a;
  font-size: 18px;
}

.dish-card.selected {
  border-color: #5b8f7a;
  box-shadow: 0 0 0 3px rgba(91, 143, 122, 0.12);
}

.cover-wrap {
  position: relative;
  width: 92px;
  height: 92px;
  flex-shrink: 0;
  background: #e8e2d8;
}

.cover {
  width: 100%;
  height: 100%;
  display: block;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a958c;
  font-size: 13px;
}

.dish-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dish-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

.dish-desc {
  display: block;
  color: #5c5852;
  font-size: 13px;
  line-height: 1.45;
}

.pick-badge {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #5b8f7a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
}

.note-placeholder {
  color: #b3ada2;
}

.cart-bar {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 16px;
  background: #2c2a26;
  color: #fff;
  border-radius: 999px;
  padding: 10px 10px 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 20;
}

.cart-btn {
  background: #5b8f7a;
  color: #fff;
  border-radius: 999px;
  font-size: 13px;
  margin: 0;
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
  max-height: 70vh;
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

.sheet-list {
  max-height: 45vh;
  margin-bottom: 12px;
}

.sheet-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #efeae2;
}

.sheet-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sheet-name {
  font-size: 15px;
  font-weight: 600;
}

.sheet-note {
  font-size: 12px;
  color: #8a8680;
  margin-top: 2px;
}

.sheet-remove {
  color: #b0654a;
  font-size: 13px;
  flex-shrink: 0;
}

.field {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f5f0;
  font-size: 14px;
}

.sheet-btn {
  margin-top: 12px;
}

.text-btn {
  margin-top: 8px;
  background: transparent;
  color: #5c5852;
  font-size: 13px;
}
</style>
