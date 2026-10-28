<template>
  <section>
    <div class="head">
      <div>
        <h2>菜单维护</h2>
        <p>管理分类与菜品，小程序按这里的分类展示。</p>
      </div>
      <div class="head-actions">
        <el-button @click="openCategoryDialog">分类管理</el-button>
        <el-button type="primary" @click="openCreate">新建菜品</el-button>
      </div>
    </div>

    <div class="filters">
      <el-radio-group v-model="filterCategoryId" @change="() => undefined">
        <el-radio-button :label="0">全部</el-radio-button>
        <el-radio-button v-for="cat in categories" :key="cat.id" :label="cat.id">
          {{ cat.name }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="menu-table">
      <el-table :data="filteredDishes" v-loading="loading" :row-class-name="rowClass">
        <el-table-column label="菜品" min-width="280">
          <template #default="{ row }">
            <div class="dish-cell">
              <img v-if="row.imageUrl" :src="row.imageUrl" class="thumb" alt="" />
              <span v-else class="thumb placeholder">{{ row.name.slice(0, 1) }}</span>
              <div class="dish-text">
                <div class="dish-title">
                  <strong>{{ row.name }}</strong>
                  <span class="status" :class="row.isActive ? 'on' : 'off'">
                    {{ row.isActive ? '上架' : '下架' }}
                  </span>
                  <span v-if="row.allowRepeat" class="status repeat">可重复</span>
                </div>
                <div class="muted">{{ row.description || '暂无描述' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="110">
          <template #default="{ row }">
            <span class="cat-tag">{{ categoryName(row.categoryId) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="特殊项" min-width="260">
          <template #default="{ row }">
            <div v-if="row.optionGroups.length" class="chips">
              <span v-for="group in row.optionGroups" :key="group.id" class="chip">
                {{ group.name }}
                <em>{{ optionSummary(group) }}</em>
              </span>
            </div>
            <span v-else class="empty">无</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="168" align="right">
          <template #default="{ row }">
            <div class="ops">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="onDelete(row)">删除</el-button>
              <el-button
                link
                :type="row.isActive ? 'warning' : 'success'"
                :loading="togglingId === row.id"
                @click="onToggleActive(row)"
              >
                {{ row.isActive ? '下架' : '上架' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑菜品' : '新建菜品'"
      width="720px"
      class="dish-dialog"
      align-center
      destroy-on-close
    >
      <el-form class="dish-form" label-position="top">
        <div class="basic">
          <div class="photo">
            <div class="photo-frame" :class="{ filled: !!form.imageUrl }">
              <img v-if="form.imageUrl" :src="form.imageUrl" alt="" />
              <template v-else>
                <span class="photo-initial">{{ form.name.trim().slice(0, 1) || '菜' }}</span>
                <span class="photo-tip">上传菜品照片</span>
              </template>
            </div>
            <div class="photo-actions">
              <el-upload :show-file-list="false" accept="image/*" :auto-upload="false" :on-change="onImageChange">
                <el-button size="small" type="primary" plain>
                  {{ form.imageUrl ? '更换图片' : '上传图片' }}
                </el-button>
              </el-upload>
              <el-button v-if="form.imageUrl" size="small" link type="danger" @click="form.imageUrl = ''">移除</el-button>
            </div>
          </div>
          <div class="basic-fields">
            <div class="field-row">
              <el-form-item label="菜名">
                <el-input v-model="form.name" maxlength="64" placeholder="如：番茄牛腩" />
              </el-form-item>
              <el-form-item label="分类" required>
                <el-select v-model="form.categoryId" placeholder="选择分类">
                  <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="描述" class="desc-item">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="口味、适合的场合"
              />
            </el-form-item>
          </div>
        </div>

        <div class="meta">
          <div class="meta-card">
            <span class="meta-label">排序</span>
            <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" />
            <span class="meta-hint">数字越小越靠前</span>
          </div>
          <div class="meta-card">
            <span class="meta-label">上架</span>
            <el-switch v-model="form.isActive" />
            <span class="meta-hint">{{ form.isActive ? '小程序可见' : '小程序隐藏' }}</span>
          </div>
          <div class="meta-card">
            <span class="meta-label">可以重复添加</span>
            <el-switch v-model="form.allowRepeat" />
            <span class="meta-hint">{{ form.allowRepeat ? '活动里可点多份，挂在点单人下' : '同一活动只能出现一次' }}</span>
          </div>
        </div>

        <section class="options">
          <div class="option-head">
            <div>
              <strong>特殊项</strong>
              <p>点餐时供用户选择，例如辣度、份量。</p>
            </div>
            <el-button size="small" @click="addGroup">添加一组</el-button>
          </div>
          <p v-if="!form.optionGroups.length" class="option-empty">还没有特殊项</p>
          <div v-for="(group, index) in form.optionGroups" :key="index" class="option-box">
            <label class="mini">
              <span>项名</span>
              <el-input v-model="group.name" maxlength="32" placeholder="如：辣度" />
            </label>
            <label class="mini">
              <span>可选值，用顿号或逗号分隔</span>
              <el-input v-model="group.valuesText" placeholder="微辣、中辣、特辣" />
            </label>
            <el-button link type="danger" @click="form.optionGroups.splice(index, 1)">移除</el-button>
          </div>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryDialogVisible" title="分类管理" width="520px" destroy-on-close>
      <div class="cat-add">
        <el-input v-model="categoryForm.name" placeholder="新分类名称，如：小吃" maxlength="32" />
        <el-button type="primary" :loading="categorySaving" @click="onCreateCategory">添加</el-button>
      </div>
      <p class="cat-hint">按住一行拖动，松手后保存顺序。</p>
      <ul class="cat-list">
        <li
          v-for="(row, index) in categories"
          :key="row.id"
          class="cat-row"
          :class="{ over: dragOverId === row.id }"
          :draggable="editingCategoryId !== row.id && !categorySorting"
          @dragstart="onCategoryDragStart(row.id)"
          @dragover.prevent="dragOverId = row.id"
          @drop="onCategoryDrop(row.id)"
          @dragend="dragOverId = null"
        >
          <span class="grip">{{ index + 1 }}</span>
          <el-input v-if="editingCategoryId === row.id" v-model="editingCategoryName" size="small" />
          <span v-else class="cat-name">{{ row.name }}</span>
          <span class="cat-ops">
            <template v-if="editingCategoryId === row.id">
              <el-button link type="primary" @click="onSaveCategory(row.id)">保存</el-button>
              <el-button link @click="editingCategoryId = null">取消</el-button>
            </template>
            <template v-else>
              <el-button link type="primary" @click="startEditCategory(row)">编辑</el-button>
              <el-button link type="danger" @click="onDeleteCategory(row)">删除</el-button>
            </template>
          </span>
        </li>
      </ul>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import {
  fileFromDataUrl,
  menuApi,
  readImageDataUrl,
  type Dish,
  type DishCategory,
  type DishOptionGroup,
} from '@our-pact/shared'

const dishes = ref<Dish[]>([])
const categories = ref<DishCategory[]>([])
const loading = ref(false)
const saving = ref(false)
const togglingId = ref<number | null>(null)
const dialogVisible = ref(false)
const editing = ref<Dish | null>(null)
const filterCategoryId = ref(0)

function optionSummary(group: DishOptionGroup) {
  return group.values.map((value) => value.label).join(' / ')
}

const categoryDialogVisible = ref(false)
const categorySaving = ref(false)
const categoryForm = reactive({ name: '' })
const editingCategoryId = ref<number | null>(null)
const editingCategoryName = ref('')
const draggingCategoryId = ref<number | null>(null)
const dragOverId = ref<number | null>(null)
const categorySorting = ref(false)

const form = reactive({
  categoryId: 0,
  name: '',
  description: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
  allowRepeat: false,
  optionGroups: [] as Array<{
    id?: number
    name: string
    valuesText: string
    knownValues: Array<{ id: number; label: string }>
  }>,
})

const filteredDishes = computed(() => {
  if (!filterCategoryId.value) return dishes.value
  return dishes.value.filter((dish) => dish.categoryId === filterCategoryId.value)
})

function categoryName(id: number) {
  return categories.value.find((item) => item.id === id)?.name || '—'
}

function rowClass({ row }: { row: Dish }) {
  return row.isActive ? '' : 'row-off'
}

async function load() {
  loading.value = true
  try {
    const [dishList, categoryList] = await Promise.all([menuApi.listDishes(), menuApi.listCategories()])
    dishes.value = dishList
    categories.value = categoryList
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function resetForm(dish?: Dish | null) {
  form.categoryId = dish?.categoryId || categories.value[0]?.id || 0
  form.name = dish?.name || ''
  form.description = dish?.description || ''
  form.imageUrl = dish?.imageUrl || ''
  form.sortOrder = dish?.sortOrder || 0
  form.isActive = dish?.isActive ?? true
  form.allowRepeat = dish?.allowRepeat ?? false
  form.optionGroups = (dish?.optionGroups || []).map((group) => ({
    id: group.id,
    name: group.name,
    valuesText: group.values.map((value) => value.label).join('、'),
    knownValues: group.values.map((value) => ({ id: value.id, label: value.label })),
  }))
}

function openCreate() {
  if (!categories.value.length) {
    ElMessage.warning('请先添加分类')
    openCategoryDialog()
    return
  }
  editing.value = null
  resetForm(null)
  dialogVisible.value = true
}

function openEdit(dish: Dish) {
  editing.value = dish
  resetForm(dish)
  dialogVisible.value = true
}

function addGroup() {
  form.optionGroups.push({ name: '', valuesText: '', knownValues: [] })
}

async function onImageChange(file: UploadFile) {
  const raw = file.raw
  if (!raw) return
  try {
    form.imageUrl = (await menuApi.uploadDishImage(fileFromDataUrl(await readImageDataUrl(raw), 'dish.jpg'))).url
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '图片读取失败')
  }
}

function draftValues(group: (typeof form.optionGroups)[number]) {
  const used = new Set<number>()
  return group.valuesText
    .split(/[,，、]/)
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => {
      const known = group.knownValues.find((value) => value.label === label && !used.has(value.id))
      if (!known) {
        return { label }
      }
      used.add(known.id)
      return { id: known.id, label }
    })
}

async function onSave() {
  if (!form.categoryId) {
    ElMessage.warning('请选择分类')
    return
  }
  saving.value = true
  try {
    const draft = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
      allowRepeat: form.allowRepeat,
      sortOrder: form.sortOrder || 0,
      optionGroups: form.optionGroups
        .map((group) => ({
          id: group.id,
          name: group.name.trim(),
          values: draftValues(group),
        }))
        .filter((group) => group.name && group.values.length > 0),
    }
    if (editing.value) {
      await menuApi.updateDish(editing.value.id, draft)
      ElMessage.success('菜品已更新')
    } else {
      await menuApi.createDish(draft)
      ElMessage.success('菜品已创建')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function onToggleActive(dish: Dish) {
  togglingId.value = dish.id
  try {
    const updated = await menuApi.updateDish(dish.id, {
      categoryId: dish.categoryId,
      name: dish.name,
      description: dish.description,
      imageUrl: dish.imageUrl,
      isActive: !dish.isActive,
      sortOrder: dish.sortOrder,
      optionGroups: dish.optionGroups.map((group) => ({
        id: group.id,
        name: group.name,
        values: group.values.map((value) => ({ id: value.id, label: value.label })),
      })),
    })
    const index = dishes.value.findIndex((item) => item.id === dish.id)
    if (index >= 0) {
      dishes.value[index] = updated
    }
    ElMessage.success(updated.isActive ? '已上架' : '已下架')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  } finally {
    togglingId.value = null
  }
}

async function onDelete(dish: Dish) {
  try {
    await ElMessageBox.confirm(`删除「${dish.name}」后不可恢复。`, '删除菜品', { type: 'warning' })
    await menuApi.deleteDish(dish.id)
    ElMessage.success('已删除')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

function onCategoryDragStart(id: number) {
  draggingCategoryId.value = id
}

async function onCategoryDrop(targetId: number) {
  const fromId = draggingCategoryId.value
  draggingCategoryId.value = null
  dragOverId.value = null
  if (fromId == null || fromId === targetId || categorySorting.value) {
    return
  }
  const next = [...categories.value]
  const fromIndex = next.findIndex((item) => item.id === fromId)
  const toIndex = next.findIndex((item) => item.id === targetId)
  if (fromIndex < 0 || toIndex < 0) {
    return
  }
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  const previous = categories.value
  categories.value = next
  categorySorting.value = true
  try {
    categories.value = await menuApi.sortCategories(next.map((item) => item.id))
    ElMessage.success('顺序已更新')
  } catch (error) {
    categories.value = previous
    ElMessage.error(error instanceof Error ? error.message : '排序失败')
  } finally {
    categorySorting.value = false
  }
}

function openCategoryDialog() {
  categoryForm.name = ''
  editingCategoryId.value = null
  categoryDialogVisible.value = true
}

async function onCreateCategory() {
  categorySaving.value = true
  try {
    await menuApi.createCategory({ name: categoryForm.name })
    categoryForm.name = ''
    ElMessage.success('分类已添加')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '添加失败')
  } finally {
    categorySaving.value = false
  }
}

function startEditCategory(row: DishCategory) {
  editingCategoryId.value = row.id
  editingCategoryName.value = row.name
}

async function onSaveCategory(id: number) {
  try {
    await menuApi.updateCategory(id, { name: editingCategoryName.value })
    editingCategoryId.value = null
    ElMessage.success('分类已更新')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  }
}

async function onDeleteCategory(row: DishCategory) {
  try {
    await ElMessageBox.confirm(`删除分类「${row.name}」？`, '删除分类', { type: 'warning' })
    await menuApi.deleteCategory(row.id)
    ElMessage.success('已删除')
    if (filterCategoryId.value === row.id) filterCategoryId.value = 0
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

onMounted(load)
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.head h2 {
  margin: 0;
  font-size: 26px;
}

.head p,
.muted {
  margin: 6px 0 0;
  color: #8a8680;
  font-size: 13px;
}

.filters {
  margin-bottom: 16px;
}

.dish-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.dish-form :deep(.el-form-item__label) {
  padding-bottom: 6px;
  color: #5c564e;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.dish-form :deep(.desc-item) {
  margin-bottom: 0;
}

.dish-form :deep(.el-select) {
  width: 100%;
}

.basic {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 20px;
  align-items: start;
}

.photo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 160px;
  height: 200px;
  overflow: hidden;
  border: 1.5px dashed #c6d8cd;
  border-radius: 16px;
  background: #f4faf6;
}

.photo-frame.filled {
  border: 1px solid var(--line);
  border-style: solid;
  background: #fff;
}

.photo-frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.photo-initial {
  color: var(--brand);
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
}

.photo-tip {
  color: var(--muted);
  font-size: 12px;
}

.photo-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 168px;
  gap: 12px;
}

.meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
}

.meta-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f7f4ee;
}

.meta-label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
}

.meta-hint {
  margin-left: auto;
  color: var(--muted);
  font-size: 12px;
}

.options {
  padding: 14px;
  border-radius: 14px;
  background: #f7f4ee;
}

.option-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.option-head p,
.option-empty {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.option-empty {
  margin: 10px 0 0;
  padding: 18px;
  border-radius: 10px;
  background: #fff;
  text-align: center;
  font-size: 13px;
}

.option-box {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 10px;
  align-items: end;
  margin-top: 10px;
  padding: 10px;
  border-radius: 10px;
  background: #fff;
}

.mini {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: #6d6860;
  font-size: 12px;
}

.cat-add {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.cat-hint {
  margin: 0 0 10px;
  color: #8a8680;
  font-size: 12px;
}

.cat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.cat-row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid #e5e1d8;
  border-radius: 8px;
  background: #fff;
  cursor: grab;
}

.cat-row.over {
  border-color: #5b8f7a;
  background: rgba(91, 143, 122, 0.08);
}

.grip {
  color: #8a8680;
  font-size: 12px;
  text-align: center;
}

.cat-name {
  min-width: 0;
}

.cat-ops {
  display: flex;
  gap: 4px;
}

.menu-table {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}

.menu-table :deep(.el-table) {
  --el-table-header-bg-color: #f6f3ec;
  --el-table-header-text-color: #6d6860;
  --el-table-row-hover-bg-color: #f4faf6;
  --el-table-border-color: transparent;
  --el-table-bg-color: #fff;
}

.menu-table :deep(.el-table th.el-table__cell) {
  font-size: 13px;
  font-weight: 600;
}

.menu-table :deep(.el-table td.el-table__cell) {
  padding: 14px 0;
  border-bottom: 1px solid #f0ece4;
}

.menu-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.menu-table :deep(.row-off) {
  --el-table-tr-bg-color: #faf8f5;
}

.menu-table :deep(.row-off .dish-title strong),
.menu-table :deep(.row-off .muted) {
  color: #8a8680;
}

.dish-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dish-text {
  min-width: 0;
}

.dish-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dish-title strong {
  font-size: 15px;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status.on {
  color: #2f7d57;
  background: #e5f4ec;
}

.status.repeat {
  color: #4a6f94;
  background: #e3ecf4;
}

.status.off {
  color: #8a8680;
  background: #efece6;
}

.cat-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f3efe7;
  color: #5c564e;
  font-size: 12px;
  line-height: 20px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: 8px;
  background: #f7f4ee;
  color: var(--ink);
  font-size: 12px;
  line-height: 18px;
}

.chip em {
  color: var(--muted);
  font-style: normal;
}

.empty {
  color: #b7b2aa;
  font-size: 13px;
}

.ops {
  display: flex;
  justify-content: flex-end;
}

.thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
  background: #f0ebe3;
}

.thumb.placeholder {
  display: grid;
  place-items: center;
  color: var(--brand-dark);
  background: #e7f0eb;
  font-weight: 700;
}

@media (max-width: 760px) {
  .basic,
  .field-row,
  .meta,
  .option-box {
    grid-template-columns: 1fr;
  }
}
</style>
