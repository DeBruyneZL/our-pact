<template>
  <view class="page">
    <view v-if="loading" class="center">加载中…</view>
    <view v-else-if="loadError" class="center">{{ loadError }}</view>
    <view v-else-if="!categories.length" class="center">暂无分类，等管理员配置</view>

    <view v-else class="menu-tree">
      <scroll-view scroll-y class="cat-side">
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

      <scroll-view scroll-y class="dish-pane">
        <view v-if="!filteredDishes.length" class="center small">这个分类还没有菜</view>
        <view
          v-for="dish in filteredDishes"
          :key="dish.id"
          class="dish-card"
          :class="{ selected: Boolean(selected[dish.id]) }"
          @tap="toggleDish(dish)"
        >
          <view class="cover-wrap">
            <image
              v-if="dish.imageUrl"
              :src="absoluteUrl(dish.imageUrl)"
              mode="aspectFill"
              class="cover"
            />
            <view v-else class="cover cover-placeholder">暂无封面</view>
          </view>
          <view class="dish-body">
            <text class="dish-name">{{ dish.name }}</text>
            <text class="dish-desc">{{ dish.description || '家常味道' }}</text>
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

    <view v-if="selectedCount > 0" class="cart-bar">
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
        <button class="cart-btn" @tap="showList = false">继续挑</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import type { Dish, DishCategory } from '@our-pact/shared'
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
const selected = reactive<Record<number, Selection>>({})

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
  }
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

onShow(() => {
  void load()
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

.menu-tree {
  flex: 1;
  min-height: 0;
  display: flex;
}

.cat-side {
  width: 88px;
  flex-shrink: 0;
  height: 100%;
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
  height: 100%;
  padding: 10px 10px 72px;
  box-sizing: border-box;
}

.dish-card {
  background: #fffcf7;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
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
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
}

.dish-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.dish-desc {
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
</style>
