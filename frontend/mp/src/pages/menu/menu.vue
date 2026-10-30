<template>
  <view class="page">
    <BrandNav />
    <view class="stage" :style="stageStyle">
      <view v-if="loading || menuReady" class="cat-side" :style="stageStyle">
        <scroll-view v-if="menuReady" scroll-y class="cat-scroll" :style="stageStyle">
          <view
            v-for="cat in catCards"
            :key="cat.id"
            :class="cat.skin"
            @tap="activeCategoryId = cat.id"
          >
            {{ cat.title }}
          </view>
        </scroll-view>
      </view>

      <view class="stage-main">
        <ShopIntro
          :sheet="showShop"
          @update:sheet="showShop = $event"
          @layout="onShopLayout"
          @preview="onShopPreview"
          @preview-cancel="onShopPreviewCancel"
        />
        <PageLoading v-if="loading" :tip="loadingText" />
        <view v-else-if="loadError" class="center">{{ loadError }}</view>
        <view v-else-if="emptyMenuText" class="center">{{ emptyMenuText }}</view>
        <view v-else class="menu-wrap">
          <view v-if="addingBar" class="adding-bar">
            <text>{{ addingBar }}</text>
            <text class="adding-back" @tap="backToActivity">返回活动</text>
          </view>
          <scroll-view scroll-y :class="dishPaneSkin" :style="dishStyle">
        <view v-if="emptyPaneText" class="center small">{{ emptyPaneText }}</view>
        <view
          v-for="card in dishCards"
          :key="card.id"
          :class="card.skin"
        >
          <view class="dish-row" @tap="onDishTap(card.id)">
            <view class="cover-wrap">
              <image
                v-if="card.showCover"
                :src="card.coverSrc"
                mode="aspectFill"
                class="cover"
                @error="onCoverError(card.id)"
              />
              <view v-else class="cover cover-placeholder">暂无封面</view>
            </view>
            <view class="dish-info">
              <view class="dish-body">
                <text class="dish-name">{{ card.dishTitle }}</text>
                <text class="dish-desc">{{ card.dishDesc }}</text>
              </view>
              <view
                class="plus"
                :class="{ done: card.plusDone }"
                @tap.stop="onQuickAdd(card.id)"
              >
                <text class="plus-text">{{ card.plusText }}</text>
              </view>
            </view>
          </view>
          <view v-if="card.optionGroups.length" class="option-block" @tap.stop>
            <view v-for="group in card.optionGroups" :key="group.id" class="option-group">
              <text class="option-label">{{ group.groupName }}（可选）</text>
              <view class="chip-row">
                <view
                  class="chip"
                  :class="{ active: isOptionActive(card.id, group.id, null) }"
                  @tap="pickOption(card.id, group.id, null)"
                >
                  <text class="chip-text">不选</text>
                </view>
                <view
                  v-for="choice in group.choices"
                  :key="choice.id"
                  class="chip"
                  :class="{ active: isOptionActive(card.id, group.id, choice.id) }"
                  @tap="pickOption(card.id, group.id, choice.id)"
                >
                  <text class="chip-text">{{ choice.label }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <view v-if="showAddedFab" class="added-fab" :style="cartBarStyle" @tap="showAdded = true">
      <view class="fab-lines">
        <view class="fab-line" />
        <view class="fab-line" />
        <view class="fab-line short" />
      </view>
      <view v-if="addedBadge" class="fab-badge">{{ addedBadge }}</view>
    </view>

    <view v-if="cartText && !showList" class="cart-bar" :style="cartBarStyle">
      <view class="cart-main" @tap="openCartSheet">
        <text class="cart-count">{{ cartText }}</text>
        <text class="cart-hint">点此查看清单</text>
      </view>
      <button class="cart-btn" size="mini" @tap.stop="openCreateFromCart">提交</button>
    </view>

    <view v-if="showList" class="mask" @tap="showList = false">
      <view class="sheet" @tap.stop>
        <text class="sheet-title">{{ sheetTitle }}</text>
        <scroll-view scroll-y class="sheet-list">
          <view v-for="item in selectedList" :key="item.id" class="sheet-item">
            <view class="sheet-main">
              <text class="sheet-name">{{ item.title }}</text>
              <text v-if="item.extra" class="sheet-extra">{{ item.extra }}</text>
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
        <template v-else-if="createMode">
          <DateTimeField
            v-model:date="activityDate"
            v-model:time="activityTime"
            :min-date="minDate"
            @change="onDateTimeChange"
          />
          <input v-model="activityName" class="field" placeholder="活动名称" placeholder-class="note-placeholder" />
          <input v-model="activityLocation" class="field" placeholder="地点" placeholder-class="note-placeholder" />
          <picker mode="selector" :range="peopleOptions" :value="peopleIndex" @change="onPeopleChange">
            <view class="field">{{ peopleLabel }}</view>
          </picker>
          <button class="cart-btn sheet-btn" :disabled="submitting" @tap="onCreate">确认发起</button>
        </template>
        <button class="continue-pick" hover-class="none" @tap="showList = false">继续挑</button>
      </view>
    </view>

    <view v-if="showAdded" class="mask" @tap="showAdded = false">
      <view class="sheet added-sheet" @tap.stop>
        <view class="added-head">
          <text class="sheet-title">已经加入</text>
          <text class="added-count">{{ addedSummary }}</text>
        </view>
        <scroll-view scroll-y class="sheet-list">
          <view v-if="emptyAddedText" class="added-empty">{{ emptyAddedText }}</view>
          <view v-for="line in addedLines" :key="line.id" class="added-row">
            <image v-if="line.showCover" class="added-cover" :src="line.coverSrc" mode="aspectFill" />
            <view v-else class="added-cover added-cover-empty">菜</view>
            <view class="sheet-main">
              <text class="sheet-name">{{ line.title }}</text>
              <text class="sheet-note">{{ line.extra }}</text>
            </view>
            <text v-if="line.countText" class="added-times">{{ line.countText }}</text>
          </view>
        </scroll-view>
        <text class="added-close" @tap="showAdded = false">继续加菜</text>
      </view>
    </view>

    <view v-if="showDetail" class="mask" @tap="closeDetail">
      <view class="sheet detail-sheet" @tap.stop>
        <image
          v-if="detailView.showCover"
          class="detail-cover"
          :src="detailView.coverSrc"
          mode="aspectFill"
          @tap="previewDetail"
        />
        <view v-else class="detail-cover detail-cover-empty">暂无图片</view>
        <text class="sheet-title detail-title">{{ detailView.dishTitle }}</text>
        <text class="detail-desc">{{ detailView.dishDesc }}</text>
        <view v-if="detailView.optionGroups.length" class="option-block detail-options">
          <view v-for="group in detailView.optionGroups" :key="group.id" class="option-group">
            <text class="option-label">{{ group.groupName }}（可选）</text>
            <view class="chip-row">
              <view
                class="chip"
                :class="{ active: isOptionActive(detailView.dishId, group.id, null) }"
                @tap="pickOption(detailView.dishId, group.id, null)"
              >
                <text class="chip-text">不选</text>
              </view>
              <view
                v-for="choice in group.choices"
                :key="choice.id"
                class="chip"
                :class="{ active: isOptionActive(detailView.dishId, group.id, choice.id) }"
                @tap="pickOption(detailView.dishId, group.id, choice.id)"
              >
                <text class="chip-text">{{ choice.label }}</text>
              </view>
            </view>
          </view>
        </view>
        <button class="cart-btn detail-action" :disabled="detailView.actionOff" @tap="onDetailAction">
          {{ detailView.actionText }}
        </button>
        <text class="added-close" @tap="closeDetail">关闭</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, reactive, ref, watch } from 'vue'
import type { ActivityItem, Dish, DishCategory } from '@our-pact/shared'
import { addActivityItems, createActivity, getActivity } from '@/api/activity'
import type { ActivityItemPayload } from '@/api/activity'
import { listCategories, listDishes } from '@/api/menu'
import BrandNav from '@/components/BrandNav.vue'
import DateTimeField from '@/components/DateTimeField.vue'
import PageLoading from '@/components/PageLoading.vue'
import ShopIntro from '@/components/ShopIntro.vue'
import { absoluteUrl } from '@/config'
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
import { readWindowMetrics } from '@/utils/windowMetrics'

interface SelectedSummary {
  id: number
  title: string
  extra: string
}

/** 每道菜各组已选值；null 表示该组不选。 */
type OptionPickMap = Record<number, number | null>

/** 列表/详情用的特殊项视图，避开 values/name 在小程序里的字段冲突。 */
interface OptionChoiceView {
  id: number
  label: string
}

interface OptionGroupView {
  id: number
  groupName: string
  choices: OptionChoiceView[]
}

const PLUS_MARK = '+'
const CHECK_MARK = String.fromCharCode(0x2713)

function textOr(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const text = value.trim()
    return text || fallback
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return fallback
}

const auth = useAuthStore()
const dishes = ref<Dish[]>([])
const categories = ref<DishCategory[]>([])
const activeCategoryId = ref(0)
const loading = ref(false)
const loadError = ref('')
const showList = ref(false)
const showAdded = ref(false)
const detailId = ref(0)
/** 清单弹层是否进入「发起活动」表单。 */
const createMode = ref(false)
const submitting = ref(false)
const activityName = ref('')
const activityDate = ref('')
const activityTime = ref('18:00')
const activityLocation = ref(DEFAULT_ACTIVITY_LOCATION)
const peopleIndex = ref(0)
const autoName = ref('')
const peopleOptions = PEOPLE_OPTIONS
const minDate = computed(() => todayText())
const pendingActivity = ref<{ id: number; title: string } | null>(null)
const addedDishIds = ref<number[]>([])
const addedItems = ref<ActivityItem[]>([])
const addingDishId = ref(0)
const failedCovers = reactive<Record<number, boolean>>({})
const selected = reactive<Record<number, boolean>>({})
const optionPicks = reactive<Record<number, OptionPickMap>>({})
const paneHeight = ref(480)
const cartBarBottom = ref(66)
const shopHeight = ref(0)
const showShop = ref(false)
/** 预览图片也会触发 onShow，这次不要把介绍弹层关掉，也不要重载菜单。 */
const retainShopSheet = ref(false)
const PENDING_KEY = 'our-pact.pending-activity'
const loadingText = '加载中'
const stageStyle = computed(() => ({ height: `${paneHeight.value}px` }))
const dishStyle = computed(() => {
  const banner = pendingActivity.value ? 42 : 0
  return { height: `${Math.max(paneHeight.value - shopHeight.value - banner, 120)}px` }
})
const menuReady = computed(() => !loading.value && !loadError.value && !emptyMenuText.value)
const cartBarStyle = computed(() => ({ bottom: `${cartBarBottom.value}px` }))

const addingTitle = computed(() => pendingActivity.value?.title || '活动')
const addingBar = computed(() => {
  if (!pendingActivity.value) {
    return ''
  }
  return `给「${addingTitle.value}」加菜`
})
const addHint = computed(() => `加到「${addingTitle.value}」。只能加菜，不能改别人的内容。`)
const emptyMenuText = computed(() => (categories.value.length ? '' : '暂无分类，等管理员配置'))
const peopleLabel = computed(() => peopleOptions[peopleIndex.value] || '1人')

const selectedCount = computed(() => Object.keys(selected).length)
const cartText = computed(() => {
  if (pendingActivity.value || selectedCount.value <= 0) {
    return ''
  }
  return `已选 ${selectedCount.value} 道`
})
const dishPaneSkin = computed(() => (addingBar.value ? 'dish-pane roomy' : 'dish-pane'))
const showAddedFab = computed(() => Boolean(addingBar.value) && !showAdded.value && !showList.value)
const addedBadge = computed(() => {
  const total = addedItems.value.length
  if (total <= 0) {
    return ''
  }
  return total > 99 ? '99+' : String(total)
})
const addedSummary = computed(() => {
  const total = addedItems.value.length
  return total > 0 ? `共 ${total} 道` : '还没有菜'
})
const emptyAddedText = computed(() => (addedItems.value.length ? '' : '点右边的加号，菜会出现在这里'))
const addedLines = computed(() => {
  const me = auth.profile?.id
  const groups = new Map<string, { title: string; extra: string; coverSrc: string; count: number }>()
  for (const item of addedItems.value) {
    const dishId = item.dishId == null ? 0 : item.dishId
    const key = `${dishId}-${item.addedByUserId}`
    const current = groups.get(key)
    if (current) {
      current.count += 1
      continue
    }
    const menuDish = dishes.value.find((entry) => entry.id === dishId)
    const cover = item.dishImageUrl || menuDish?.imageUrl || ''
    const who = item.addedByUserId === me ? '你加的' : `${item.addedByUserName || '其他人'}加的`
    groups.set(key, {
      title: item.dishName || menuDish?.name || '未命名菜品',
      extra: who,
      coverSrc: cover ? absoluteUrl(cover) : '',
      count: 1,
    })
  }
  return [...groups.entries()].map(([id, line]) => ({
    id,
    title: line.title,
    extra: line.extra,
    coverSrc: line.coverSrc,
    showCover: Boolean(line.coverSrc),
    countText: line.count > 1 ? `×${line.count}` : '',
  }))
})
const sheetTitle = computed(() => {
  if (addingBar.value) {
    return '加菜清单'
  }
  if (createMode.value) {
    return '发起活动'
  }
  return '今日选菜清单'
})
const filteredDishes = computed(() =>
  dishes.value.filter((dish) => dish.categoryId === activeCategoryId.value),
)
const emptyPaneText = computed(() => (filteredDishes.value.length ? '' : '这个分类还没有菜'))
const selectedList = computed<SelectedSummary[]>(() =>
  Object.keys(selected).map(Number).map((id) => {
    const dish = dishes.value.find((entry) => entry.id === id)
    return {
      id,
      title: dish?.name || '',
      extra: optionSummaryText(dish),
    }
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

const showDetail = computed(() => detailId.value > 0)

function usableOptionGroups(dish?: Dish | null): OptionGroupView[] {
  if (!dish) {
    return []
  }
  return (dish.optionGroups || [])
    .filter((group) => group.id != null)
    .map((group) => {
      const choices = (group.values || [])
        .filter((value) => value.id != null && textOr(value.label, ''))
        .map((value) => ({
          id: value.id,
          label: textOr(value.label, ''),
        }))
      return {
        id: group.id,
        groupName: textOr(group.name, '特殊项'),
        choices,
      }
    })
    .filter((group) => group.choices.length > 0)
}

const detailView = computed(() => {
  const dish = dishes.value.find((item) => item.id === detailId.value)
  const coverSrc = dish?.imageUrl && !failedCovers[dish.id] ? absoluteUrl(dish.imageUrl) : ''
  const pending = Boolean(pendingActivity.value)
  const picked = Boolean(dish && selected[dish.id])
  const locked = Boolean(dish && addedDishIds.value.includes(dish.id) && !dish.allowRepeat)
  let actionText = picked ? '取消选择' : '选上这道'
  if (pending) {
    actionText = locked ? '已经加过' : '加上这道'
  }
  return {
    dishId: dish?.id || 0,
    dishTitle: textOr(dish?.name, ''),
    dishDesc: textOr(dish?.description, '家常味道'),
    coverSrc,
    showCover: Boolean(coverSrc),
    optionGroups: usableOptionGroups(dish),
    actionText,
    actionOff: !dish || (pending && locked) || addingDishId.value === detailId.value,
  }
})

const dishCards = computed(() => {
  const pending = Boolean(pendingActivity.value)
  return filteredDishes.value.map((dish) => {
    const picked = Boolean(selected[dish.id])
    const repeatable = Boolean(dish.allowRepeat)
    const added = addedDishIds.value.includes(dish.id)
    const locked = added && !repeatable
    const coverSrc = dish.imageUrl && !failedCovers[dish.id] ? absoluteUrl(dish.imageUrl) : ''
    const done = (pending && locked) || (!pending && picked)
    let skin = 'dish-card'
    if (pending && locked) {
      skin = 'dish-card added'
    } else if (!pending && picked) {
      skin = 'dish-card selected'
    }
    return {
      id: dish.id,
      dishTitle: textOr(dish.name, '未命名菜品'),
      dishDesc: textOr(dish.description, '家常味道'),
      coverSrc,
      showCover: Boolean(coverSrc),
      plusDone: done,
      plusText: done ? CHECK_MARK : PLUS_MARK,
      skin,
      optionGroups: usableOptionGroups(dish),
    }
  })
})

function ensureOptionPicks(dish: Dish) {
  if (optionPicks[dish.id]) {
    return
  }
  const picks: OptionPickMap = {}
  for (const group of dish.optionGroups || []) {
    if (group.id != null) {
      picks[group.id] = null
    }
  }
  optionPicks[dish.id] = picks
}

function isOptionActive(dishId: number, groupId: number, valueId: number | null) {
  const current = optionPicks[dishId]?.[groupId]
  if (current === undefined || current === null) {
    return valueId == null
  }
  return current === valueId
}

function pickOption(dishId: number, groupId: number, valueId: number | null) {
  const dish = dishes.value.find((entry) => entry.id === dishId)
  if (!dish) {
    return
  }
  ensureOptionPicks(dish)
  optionPicks[dishId][groupId] = valueId
  if (!pendingActivity.value && !selected[dishId]) {
    selected[dishId] = true
    updatePaneHeight()
  }
}

function optionSummaryText(dish?: Dish) {
  if (!dish) {
    return ''
  }
  ensureOptionPicks(dish)
  const picks = optionPicks[dish.id] || {}
  const parts: string[] = []
  for (const group of dish.optionGroups || []) {
    const valueId = picks[group.id]
    if (valueId == null) {
      continue
    }
    const value = group.values.find((entry) => entry.id === valueId)
    if (value) {
      parts.push(`${group.name}：${value.label}`)
    }
  }
  return parts.join(' · ')
}

function buildItemPayload(dishId: number): ActivityItemPayload {
  const dish = dishes.value.find((entry) => entry.id === dishId)
  if (dish) {
    ensureOptionPicks(dish)
  }
  const picks = optionPicks[dishId] || {}
  const options = Object.entries(picks)
    .filter(([, valueId]) => valueId != null)
    .map(([groupId, valueId]) => ({
      groupId: Number(groupId),
      valueId: valueId as number,
    }))
  return options.length ? { dishId, options } : { dishId }
}

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
    for (const dish of dishList) {
      ensureOptionPicks(dish)
    }
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
  }
}

/** 页面本身不能滚动，否则自定义 tabBar 会被顶上去。左侧分类通栏，右侧再扣掉店铺介绍。 */
function updatePaneHeight() {
  const { windowHeight, statusBarHeight, navBarHeight, tabBarHeight } = readWindowMetrics()
  cartBarBottom.value = tabBarHeight + 10
  const cart = cartText.value && !showList.value ? 58 : 0
  paneHeight.value = Math.max(
    windowHeight - statusBarHeight - navBarHeight - tabBarHeight - cart,
    200,
  )
}

function onShopLayout(height: number) {
  if (height === shopHeight.value) {
    return
  }
  shopHeight.value = height
  updatePaneHeight()
}

function onShopPreview() {
  retainShopSheet.value = true
}

function onShopPreviewCancel() {
  retainShopSheet.value = false
}

function onCoverError(dishId: number) {
  failedCovers[dishId] = true
}

function onDishTap(dishId: number) {
  detailId.value = dishId
}

function closeDetail() {
  detailId.value = 0
}

function previewDetail() {
  const src = detailView.value.coverSrc
  if (!src) {
    return
  }
  uni.previewImage({ current: src, urls: [src] })
}

function onDetailAction() {
  const dishId = detailId.value
  if (!dishId || detailView.value.actionOff) {
    return
  }
  if (pendingActivity.value) {
    void onPlus(dishId)
    return
  }
  const dish = dishes.value.find((entry) => entry.id === dishId)
  if (selected[dishId]) {
    delete selected[dishId]
  } else {
    if (dish) {
      ensureOptionPicks(dish)
    }
    selected[dishId] = true
  }
  updatePaneHeight()
}

/** 列表上的添加按钮：不打开详情，直接选上或加到活动。 */
function onQuickAdd(dishId: number) {
  if (pendingActivity.value) {
    void onPlus(dishId)
    return
  }
  if (selected[dishId]) {
    uni.showToast({ title: '已经选上了', icon: 'none' })
    return
  }
  const dish = dishes.value.find((entry) => entry.id === dishId)
  if (dish) {
    ensureOptionPicks(dish)
  }
  selected[dishId] = true
  updatePaneHeight()
  uni.showToast({ title: '已选上', icon: 'success' })
}

function openCartSheet() {
  createMode.value = false
  showList.value = true
}

function openCreateFromCart() {
  if (selectedCount.value <= 0) {
    uni.showToast({ title: '先选几道菜', icon: 'none' })
    return
  }
  if (!activityDate.value || activityDate.value < todayText()) {
    activityDate.value = todayText()
  }
  syncAutoName(activityDate.value)
  if (!activityLocation.value.trim()) {
    activityLocation.value = DEFAULT_ACTIVITY_LOCATION
  }
  createMode.value = true
  showList.value = true
}

function removeDish(dishId: number) {
  delete selected[dishId]
  delete optionPicks[dishId]
  if (!selectedCount.value) {
    showList.value = false
    createMode.value = false
  }
  updatePaneHeight()
}

function syncAutoName(dateText: string) {
  const next = defaultActivityName(dateText)
  if (!activityName.value || activityName.value === autoName.value) {
    activityName.value = next
  }
  autoName.value = next
}

function onDateTimeChange(payload: { date: string; time: string }) {
  if (payload.date) {
    syncAutoName(payload.date)
  }
}

function onPeopleChange(event: { detail: { value: string } }) {
  peopleIndex.value = Number(event.detail.value) || 0
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

function rememberAdded(items: ActivityItem[]) {
  addedItems.value = items
  addedDishIds.value = items
    .map((item) => item.dishId)
    .filter((dishId): dishId is number => dishId != null)
}

function readPending() {
  const value = uni.getStorageSync(PENDING_KEY) as { id?: number; title?: string; name?: string } | ''
  if (!value || typeof value !== 'object' || !value.id) {
    pendingActivity.value = null
    rememberAdded([])
    showAdded.value = false
    return
  }
  pendingActivity.value = { id: Number(value.id), title: storedTitle(value) }
}

async function loadAdded() {
  const pending = pendingActivity.value
  if (!pending) {
    rememberAdded([])
    return
  }
  try {
    const activity = await getActivity(pending.id)
    pendingActivity.value = { id: pending.id, title: activity.name || pending.title }
    rememberAdded(activity.items || [])
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
  if (dish) {
    ensureOptionPicks(dish)
  }
  addingDishId.value = dishId
  try {
    await auth.ensureLogin()
    const activity = await addActivityItems(pendingActivity.value.id, [buildItemPayload(dishId)])
    rememberAdded(activity.items || [])
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
  rememberAdded([])
  showAdded.value = false
  updatePaneHeight()
}

function buildItems(): ActivityItemPayload[] {
  return Object.keys(selected).map(Number).map((dishId) => buildItemPayload(dishId))
}

function clearSelection() {
  for (const key of Object.keys(selected)) {
    delete selected[Number(key)]
  }
  for (const key of Object.keys(optionPicks)) {
    delete optionPicks[Number(key)]
  }
  showList.value = false
  createMode.value = false
  updatePaneHeight()
}

watch([showList, showAdded, showDetail, showShop], () => {
  setTabBarHidden(showList.value || showAdded.value || showDetail.value || showShop.value)
  updatePaneHeight()
})

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
      items: buildItems(),
    })
    clearSelection()
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
  syncTabBar(0)
  const retainSheet = retainShopSheet.value
  retainShopSheet.value = false
  if (retainSheet) {
    setTabBarHidden(showList.value || showAdded.value || showDetail.value || showShop.value)
    return
  }
  showShop.value = false
  showList.value = false
  setTabBarHidden(false)
  readPending()
  updatePaneHeight()
  if (!activityDate.value || activityDate.value < todayText()) {
    activityDate.value = todayText()
  }
  syncAutoName(activityDate.value)
  void load().then(() => updatePaneHeight())
  void loadAdded().then(() => updatePaneHeight())
})
</script>

<style scoped>
.page {
  height: 100%;
  box-sizing: border-box;
  background: #f7f5f0;
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

.stage {
  display: flex;
  overflow: hidden;
}

.stage-main {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.menu-wrap {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
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

.cat-side {
  width: 88px;
  flex-shrink: 0;
  background: #efeae2;
  border-right: 1px solid #e5e1d8;
}

.cat-scroll {
  width: 100%;
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
  padding: 10px;
  box-sizing: border-box;
  background: #f7f5f0;
}

.dish-pane.roomy {
  padding-bottom: 88px;
}

.dish-card {
  position: relative;
  background: #fffcf7;
  border: 1px solid #e5e1d8;
  border-radius: 12px;
  margin-bottom: 8px;
  overflow: visible;
}

.dish-card.added {
  border-color: #5b8f7a;
  background: #f3f8f5;
}

.dish-row {
  display: flex;
  align-items: stretch;
}

.dish-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
}

.option-block {
  padding: 0 10px 10px;
  border-top: 1px solid #efeae2;
}

.option-group + .option-group {
  margin-top: 8px;
}

.option-label {
  display: block;
  margin-top: 8px;
  margin-bottom: 6px;
  color: #5c5852;
  font-size: 12px;
  font-weight: 600;
}

.chip-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 6px 6px 0;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid #e5e1d8;
  background: #f7f5f0;
  color: #5c5852;
  font-size: 12px;
  line-height: 1.3;
  box-sizing: border-box;
}

.chip.active {
  border-color: #5b8f7a;
  background: #e6f0eb;
  color: #3d6f5c;
  font-weight: 700;
}

.chip-text {
  font-size: 12px;
  line-height: 1.3;
  color: inherit;
}

.plus {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #aed2f0;
  color: #3f4951;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  box-sizing: border-box;
}

.plus.done {
  background: #aed2f0;
}

.plus-text {
  color: #3f4951;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.plus.done .plus-text {
  font-size: 16px;
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

.note-placeholder {
  color: #b3ada2;
}

.added-fab {
  position: fixed;
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2c2a26;
  box-shadow: 0 10px 24px rgba(44, 42, 38, 0.28);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-lines {
  width: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fab-line {
  height: 2px;
  border-radius: 2px;
  background: #fffcf7;
}

.fab-line.short {
  width: 12px;
}

.fab-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: 999px;
  background: #5b8f7a;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  border: 2px solid #f7f5f0;
}

.added-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.added-head .sheet-title {
  margin-bottom: 0;
}

.added-count {
  color: #8a8680;
  font-size: 13px;
}

.added-sheet .sheet-list {
  margin-top: 14px;
}

.added-empty {
  padding: 36px 12px;
  text-align: center;
  color: #8a8680;
  font-size: 13px;
}

.added-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #efeae2;
}

.added-cover {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #e8e2d8;
  flex-shrink: 0;
}

.added-cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a958c;
  font-size: 13px;
}

.added-times {
  flex-shrink: 0;
  min-width: 36px;
  height: 28px;
  padding: 0 8px;
  box-sizing: border-box;
  border-radius: 999px;
  background: #e6f0eb;
  color: #3d6f5c;
  font-size: 13px;
  font-weight: 700;
  line-height: 28px;
  text-align: center;
}

.added-close {
  margin-top: 14px;
  text-align: center;
  color: #3d6f5c;
  font-size: 14px;
  font-weight: 700;
}

.detail-sheet {
  padding-top: 0;
  overflow: hidden;
}

.detail-cover {
  width: calc(100% + 32px);
  height: 248px;
  margin-left: -16px;
  background: #e8e2d8;
  display: block;
}

.detail-cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a958c;
  font-size: 14px;
}

.detail-title {
  margin-top: 16px;
  margin-bottom: 6px;
}

.detail-desc {
  color: #5c5852;
  font-size: 14px;
  line-height: 1.6;
}

.detail-options {
  margin-top: 12px;
  padding: 0;
  border-top: none;
}

.detail-action {
  width: 100%;
  margin-top: 16px;
  height: 44px;
  line-height: 44px;
}

.detail-action::after {
  border: none;
}

.cart-bar {
  position: fixed;
  left: 12px;
  right: 12px;
  /* bottom 由 cartBarStyle 按 tabBar + 安全区动态计算 */
  bottom: calc(56px + env(safe-area-inset-bottom) + 10px);
  background: #2c2a26;
  color: #fff;
  border-radius: 999px;
  padding: 10px 10px 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 20;
  box-shadow: 0 8px 24px rgba(44, 42, 38, 0.28);
}

.cart-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cart-count {
  font-size: 15px;
  font-weight: 700;
}

.cart-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
}

.cart-btn {
  background: #5b8f7a;
  color: #fff;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  padding: 0 18px;
  height: 36px;
  line-height: 36px;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(44, 42, 38, 0.5);
  z-index: 1100;
  display: flex;
  align-items: flex-end;
}

.sheet {
  position: relative;
  z-index: 1;
  width: 100%;
  max-height: 78vh;
  background: #fffcf7;
  border-radius: 20px 20px 0 0;
  padding: 18px 16px calc(24px + env(safe-area-inset-bottom));
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

.sheet-extra {
  margin-top: 2px;
  font-size: 12px;
  color: #8a8680;
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

.continue-pick {
  width: 100%;
  margin: 12px 0 0;
  padding: 0;
  height: 44px;
  line-height: 44px;
  border-radius: 12px;
  background: #efeae2;
  color: #3d6f5c;
  font-size: 15px;
  font-weight: 600;
}

.continue-pick::after {
  border: none;
}
</style>

<style>
page {
  height: 100%;
}
</style>
