<template>
  <div class="page">
    <van-nav-bar title="今天想吃什么">
      <template #left>
        <BrandLogo />
      </template>
    </van-nav-bar>

    <div v-if="step === 'menu'" class="menu-shell">
      <van-loading v-if="loading" class="center" />
      <van-empty v-else-if="!categories.length" description="暂无分类，等管理员配置" />
      <div v-else class="menu-tree">
        <aside class="cat-side">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="cat-item"
            :class="{ active: activeCategoryId === cat.id }"
            @click="activeCategoryId = cat.id"
          >
            {{ cat.name }}
          </button>
        </aside>

        <div class="dish-pane">
          <van-empty v-if="!filteredDishes.length" image-size="64" description="这个分类还没有菜" />
          <div
            v-for="dish in filteredDishes"
            :key="dish.id"
            class="dish-card"
            :class="{ selected: Boolean(selected[dish.id]) }"
            @click="toggleDish(dish)"
          >
            <div class="cover-wrap">
              <img v-if="dish.imageUrl" :src="dish.imageUrl" class="cover" :alt="dish.name" />
              <div v-else class="cover cover-placeholder">暂无封面</div>
              <van-checkbox
                class="cover-check"
                :model-value="Boolean(selected[dish.id])"
                @click.stop="toggleDish(dish)"
              />
            </div>
            <div class="dish-body">
              <h3>{{ dish.name }}</h3>
              <p>{{ dish.description || '家常味道' }}</p>
            </div>
            <div v-if="selected[dish.id]" class="options" @click.stop>
              <div v-for="group in dish.optionGroups" :key="group.id" class="group">
                <div class="group-label">{{ group.name }}（可选）</div>
                <van-space wrap>
                  <van-tag
                    :plain="selected[dish.id].options[group.id] != null"
                    :type="selected[dish.id].options[group.id] == null ? 'primary' : 'default'"
                    @click="setOption(dish.id, group.id, null)"
                  >
                    不选
                  </van-tag>
                  <van-tag
                    v-for="value in group.values"
                    :key="value.id"
                    :plain="selected[dish.id].options[group.id] !== value.id"
                    :type="selected[dish.id].options[group.id] === value.id ? 'primary' : 'default'"
                    @click="setOption(dish.id, group.id, value.id)"
                  >
                    {{ value.label }}
                  </van-tag>
                </van-space>
              </div>
              <van-field
                v-model="selected[dish.id].note"
                label="备注"
                placeholder="少油 / 不要香菜…"
                @click.stop
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedCount > 0" class="cart-bar">
        <span>已选 {{ selectedCount }} 道</span>
        <van-button size="small" type="primary" round @click="goSchedule">下一步</van-button>
      </div>
    </div>

    <div v-else class="content wizard">
      <van-steps :active="1" active-color="#5b8f7a">
        <van-step>选菜</van-step>
        <van-step>约时间</van-step>
        <van-step>提交</van-step>
      </van-steps>
      <p class="summary">
        已选 {{ selectedCount }} 道菜，发起人：
        <strong>{{ guest.user?.name || '未设置' }}</strong>
      </p>
      <van-field v-model="scheduledAt" type="datetime-local" label="约定时间" />
      <div class="actions">
        <van-button plain round @click="step = 'menu'">返回</van-button>
        <van-button type="primary" round :loading="submitting" @click="submit">提交活动</van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import { pactApi, type Dish, type DishCategory } from '@our-pact/shared'
import { useGuestStore } from '@/stores/guest'
import BrandLogo from '@/components/BrandLogo.vue'

interface Selection {
  dishId: number
  note: string
  options: Record<number, number | null>
}

const router = useRouter()
const guest = useGuestStore()
const dishes = ref<Dish[]>([])
const categories = ref<DishCategory[]>([])
const activeCategoryId = ref(0)
const loading = ref(false)
const submitting = ref(false)
const step = ref<'menu' | 'schedule'>('menu')
const selected = reactive<Record<number, Selection>>({})
const scheduledAt = ref(defaultSchedule())

const selectedCount = computed(() => Object.keys(selected).length)
const filteredDishes = computed(() =>
  dishes.value.filter((dish) => dish.categoryId === activeCategoryId.value),
)

function defaultSchedule() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(18, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function load() {
  loading.value = true
  try {
    const [dishList, categoryList] = await Promise.all([
      pactApi.listDishes(true),
      pactApi.listCategories(),
    ])
    dishes.value = dishList
    categories.value = categoryList
    if (!activeCategoryId.value && categoryList.length) {
      activeCategoryId.value = categoryList[0].id
    } else if (
      activeCategoryId.value &&
      !categoryList.some((item) => item.id === activeCategoryId.value)
    ) {
      activeCategoryId.value = categoryList[0]?.id || 0
    }
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '加载菜单失败')
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
  if (!selected[dishId]) return
  selected[dishId].options[groupId] = valueId
}

function goSchedule() {
  if (!guest.user) {
    showFailToast('请先在「我的」创建账号名')
    void router.push('/mine')
    return
  }
  if (!selectedCount.value) {
    showFailToast('请至少选择一道菜')
    return
  }
  step.value = 'schedule'
}

async function submit() {
  if (!guest.user) {
    showFailToast('请先在「我的」创建账号名')
    return
  }
  submitting.value = true
  try {
    const created = await pactApi.createActivity({
      userId: guest.user.id,
      scheduledAt: new Date(scheduledAt.value).toISOString(),
      items: Object.values(selected).map((item) => ({
        dishId: item.dishId,
        note: item.note.trim() || undefined,
        options: Object.entries(item.options)
          .filter(([, valueId]) => valueId != null)
          .map(([groupId, valueId]) => ({
            groupId: Number(groupId),
            valueId: valueId as number,
          })),
      })),
    })
    Object.keys(selected).forEach((key) => delete selected[Number(key)])
    step.value = 'menu'
    scheduledAt.value = defaultSchedule()
    showSuccessToast(`已发起，分享码 ${created.shareCode}`)
    await router.push('/activities')
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await guest.hydrate()
  await load()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 50px);
}

.menu-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 88px;
}

.menu-tree {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
}

.cat-side {
  width: 88px;
  flex-shrink: 0;
  background: #efeae2;
  overflow-y: auto;
  border-right: 1px solid #e5e1d8;
}

.cat-item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 16px 10px;
  font: inherit;
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
  overflow-y: auto;
  padding: 10px 10px 16px;
  background: #f7f5f0;
}

.center {
  display: flex;
  justify-content: center;
  padding: 40px;
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
  aspect-ratio: 16 / 10;
  background: #e8e2d8;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a958c;
  font-size: 13px;
  letter-spacing: 0.04em;
  background:
    linear-gradient(135deg, rgba(91, 143, 122, 0.08), transparent 55%),
    repeating-linear-gradient(
      -18deg,
      transparent,
      transparent 10px,
      rgba(44, 42, 38, 0.03) 10px,
      rgba(44, 42, 38, 0.03) 11px
    ),
    #ebe4da;
}

.cover-check {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 252, 247, 0.92);
  border-radius: 999px;
  padding: 4px;
}

.dish-body {
  padding: 10px 12px 12px;
}

.dish-body h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.dish-body p {
  margin: 0;
  color: #5c5852;
  font-size: 13px;
  line-height: 1.45;
}

.options {
  padding: 0 12px 12px;
  border-top: 1px dashed #e5e1d8;
  padding-top: 12px;
}

.group {
  margin-bottom: 10px;
}

.group-label {
  font-size: 12px;
  color: #8a8680;
  font-weight: 600;
  margin-bottom: 6px;
}

.cart-bar {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 72px;
  background: #2c2a26;
  color: #fff;
  border-radius: 999px;
  padding: 10px 10px 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 20;
}

.content.wizard {
  padding: 16px 12px 88px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary {
  margin: 0;
  color: #5c5852;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions .van-button {
  flex: 1;
}
</style>
