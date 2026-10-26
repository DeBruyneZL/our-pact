<template>
  <view class="page">
    <view v-if="loading" class="center">加载中…</view>
    <view v-else-if="loadError" class="center">{{ loadError }}</view>
    <view v-else-if="!categories.length" class="center">暂无分类，等管理员配置</view>

    <view v-else class="menu-wrap">
    <view v-if="pendingActivity" class="adding-bar">
      <text>给「{{ addingTitle }}」加菜</text>
      <text class="adding-back" @tap="backToActivity">返回活动</text>
    </view>
    <view class="menu-tree">
      <scroll-view scroll-y class="cat-side" :style="paneStyle">
        <view
          v-for="cat in categories"
          :key="cat.id"
          class="cat-item"
          :class="{ active: activeCategoryId === cat.id }"
          @tap="activeCategoryId = cat.id"
        >
          {{ cat.name }}
        </view>
      </scroll-view>

      <scroll-view scroll-y class="dish-pane" :style="paneStyle">
        <view v-if="!filteredDishes.length" class="center small">这个分类还没有菜</view>
        <view
          v-for="dish in filteredDishes"
          :key="dish.id"
          class="dish-card"
          :class="{
            selected: !pendingActivity && Boolean(selected[dish.id]),
            added: Boolean(pendingActivity) && isAdded(dish.id),
            adding: Boolean(pendingActivity),
          }"
          @tap="onDishTap(dish)"
        >
          <view class="cover-wrap">
            <image
              v-if="dish.imageUrl && !failedCovers[dish.id]"
              :src="absoluteUrl(dish.imageUrl)"
              mode="aspectFill"
              class="cover"
              @error="onCoverError(dish.id)"
            />
            <view v-else class="cover cover-placeholder">暂无封面</view>
          </view>
          <view class="dish-info">
            <view class="dish-body">
              <text class="dish-name">{{ dish.name }}</text>
              <text class="dish-desc">{{ dish.description || '家常味道' }}</text>
            </view>
            <view
              v-if="pendingActivity"
              class="plus"
              :class="{ done: isAdded(dish.id) }"
              @tap.stop="onPlus(dish)"
            >
              {{ plusLabel(dish.id) }}
            </view>
          </view>

          <view v-if="selected[dish.id]" class="options" @tap.stop>
            <view v-for="group in dish.optionGroups" :key="group.id" class="group">
              <text class="group-label">{{ group.name }}（可选）</text>
              <view class="tag-row">
                <view
                  class="tag"
                  :class="{ on: selected[dish.id].options[group.id] == null }"
                  @tap="setOption(dish.id, group.id, null)"
                >
                  不选
                </view>
                <view
                  v-for="value in group.values"
                  :key="value.id"
                  class="tag"
                  :class="{ on: selected[dish.id].options[group.id] === value.id }"
                  @tap="setOption(dish.id, group.id, value.id)"
                >
                  {{ value.label }}
                </view>
              </view>
            </view>
            <input
              v-model="selected[dish.id].note"
              class="note"
              placeholder="备注：少油 / 不要香菜…"
              placeholder-class="note-placeholder"
            />
          </view>
        </view>
      </scroll-view>
    </view>
    </view>

    <view v-if="!pendingActivity && selectedCount > 0" class="cart-bar">
      <text>已选 {{ selectedCount }} 道</text>
      <button class="cart-btn" size="mini" @tap="showList = true">看清单</button>
    </view>

    <view v-if="showList" class="mask" @tap="showList = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">今日选菜清单</text>
        <scroll-view scroll-y class="sheet-list">
          <view v-for="item in selectedList" :key="item.dishId" class="sheet-item">
            <view class="sheet-main">
              <text class="sheet-name">{{ item.name }}</text>
              <text class="sheet-note">{{ item.summary }}</text>
            </view>
            <text class="sheet-remove" @tap="removeDish(item.dishId)">移除</text>
          </view>
          <view v-if="!selectedList.length" class="center small">还没有选菜</view>
        </scroll-view>
        <template v-if="pendingActivity">
          <text class="sheet-note">加到「{{ addingTitle }}」。只能加菜，不能改别人的内容。</text>
          <button class="cart-btn sheet-btn" :disabled="submitting" @tap="onAddToActivity">加到活动</button>
          <button class="text-btn" @tap="clearPending">取消加菜</button>
        </template>
        <template v-else>
          <input v-model="activityName" class="field" placeholder="活动名称" placeholder-class="note-placeholder" />
          <picker mode="date" :value="activityDate" @change="onDateChange">
            <view class="field">{{ activityDate || '选择日期' }}</view>
          </picker>
          <picker mode="time" :value="activityTime" @change="onTimeChange">
            <view class="field">{{ activityTime || '选择时间' }}</view>
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

interface Selection {
  dishId: number
  note: string
  options: Record<number, number | null>
}

interface SelectedSummary {
  dishId: number
  name: string
  summary: string
}

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
const selected = reactive<Record<number, Selection>>({})
const PENDING_KEY = 'our-pact.pending-activity'
const addingTitle = computed(() => pendingActivity.value?.title || '活动')
const paneStyle = computed(() => ({ height: `${paneHeight.value}px` }))

const selectedCount = computed(() => Object.keys(selected).length)
const filteredDishes = computed(() =>
  dishes.value.filter((dish) => dish.categoryId === activeCategoryId.value),
)
const selectedList = computed<SelectedSummary[]>(() =>
  Object.values(selected).map((item) => {
    const dish = dishes.value.find((entry) => entry.id === item.dishId)
    if (!dish) {
      return { dishId: item.dishId, name: '', summary: '' }
    }
    const labels = Object.entries(item.options)
      .filter(([, valueId]) => valueId != null)
      .map(([groupId, valueId]) => {
        const group = dish.optionGroups.find((entry) => entry.id === Number(groupId))
        return group?.values.find((entry) => entry.id === valueId)?.label
      })
      .filter(Boolean)
    const parts = [labels.join('、'), item.note.trim()]
    return {
      dishId: item.dishId,
      name: dish.name,
      summary: parts.filter(Boolean).join(' · ') || '不辣不淡刚刚好',
    }
  }),
)

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

function isAdded(dishId: number) {
  return addedDishIds.value.includes(dishId)
}

function plusLabel(dishId: number) {
  // 用符号：未加 +，已加 ✓
  return isAdded(dishId) ? String.fromCharCode(0x2713) : '+'
}

function onDishTap(dish: Dish) {
  if (pendingActivity.value) {
    return
  }
  toggleDish(dish)
}

function toggleDish(dish: Dish) {
  if (selected[dish.id]) {
    delete selected[dish.id]
    return
  }
  const options: Record<number, number | null> = {}
  for (const group of dish.optionGroups) {
    options[group.id] = null
  }
  selected[dish.id] = { dishId: dish.id, note: '', options }
}

function setOption(dishId: number, groupId: number, valueId: number | null) {
  if (!selected[dishId]) {
    return
  }
  selected[dishId].options[groupId] = valueId
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

async function onPlus(dish: Dish) {
  if (!pendingActivity.value || addingDishId.value) {
    return
  }
  if (isAdded(dish.id)) {
    uni.showToast({ title: '这道菜已经加过了', icon: 'none' })
    return
  }
  addingDishId.value = dish.id
  try {
    await auth.ensureLogin()
    const activity = await addActivityItems(pendingActivity.value.id, [{ dishId: dish.id }])
    addedDishIds.value = activity.items
      .map((item) => item.dishId)
      .filter((dishId): dishId is number => dishId != null)
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
  return Object.values(selected).map((item) => ({
    dishId: item.dishId,
    note: item.note.trim(),
    options: Object.entries(item.options)
      .filter((entry): entry is [string, number] => entry[1] != null)
      .map(([groupId, valueId]) => ({ groupId: Number(groupId), valueId })),
  }))
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
  background: #fffcf7;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
}

.dish-card.added {
  border-color: #5b8f7a;
  background: #f3f8f5;
}

.dish-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 12px;
}

.plus {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #5b8f7a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
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
  width: 100%;
  height: 210px;
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
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.dish-desc {
  display: block;
  color: #5c5852;
  font-size: 13px;
  line-height: 1.45;
}

.options {
  padding: 12px;
  border-top: 1px dashed #e5e1d8;
}

.group {
  margin-bottom: 10px;
}

.group-label {
  display: block;
  font-size: 12px;
  color: #8a8680;
  font-weight: 600;
  margin-bottom: 6px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #d9d4ca;
  color: #5c5852;
  font-size: 12px;
  background: #fff;
}

.tag.on {
  border-color: #5b8f7a;
  color: #3d6f5c;
  background: #e6f0eb;
  font-weight: 600;
}

.note {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f7f5f0;
  font-size: 13px;
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
