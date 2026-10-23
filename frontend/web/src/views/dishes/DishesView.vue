<template>
  <section>
    <div class="head">
      <div>
        <h2>菜单维护</h2>
        <p>管理分类与菜品，两端菜单按分类同步展示。</p>
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

    <el-table :data="filteredDishes" v-loading="loading" stripe>
      <el-table-column label="菜品" min-width="240">
        <template #default="{ row }">
          <div class="dish-cell">
            <img v-if="row.imageUrl" :src="row.imageUrl" class="thumb" alt="" />
            <div>
              <strong>{{ row.name }}</strong>
              <div class="muted">{{ row.description }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="100">
        <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
      </el-table-column>
      <el-table-column label="特殊项" min-width="240">
        <template #default="{ row }">
          {{ formatOptions(row) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">{{ row.isActive ? '上架' : '下架' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑菜品' : '新建菜品'" width="560px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="分类" required>
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="菜品图片（可选）">
          <div class="image-upload">
            <el-upload
              :show-file-list="false"
              accept="image/*"
              :auto-upload="false"
              :on-change="onImageChange"
            >
              <el-button>{{ form.imageUrl ? '更换图片' : '本地上传' }}</el-button>
            </el-upload>
            <el-button v-if="form.imageUrl" link type="danger" @click="form.imageUrl = ''">清除</el-button>
          </div>
          <img v-if="form.imageUrl" :src="form.imageUrl" class="preview" alt="预览" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="上架可见">
          <el-switch v-model="form.isActive" />
        </el-form-item>
        <div class="option-head">
          <strong>特殊项</strong>
          <el-button size="small" @click="addGroup">添加一组</el-button>
        </div>
        <div v-for="(group, index) in form.optionGroups" :key="index" class="option-box">
          <div class="option-head">
            <span>第 {{ index + 1 }} 组</span>
            <el-button link type="danger" @click="form.optionGroups.splice(index, 1)">移除</el-button>
          </div>
          <el-form-item label="项名">
            <el-input v-model="group.name" placeholder="如：辣度" />
          </el-form-item>
          <el-form-item label="可选值（顿号或逗号分隔）">
            <el-input v-model="group.valuesText" placeholder="微辣、中辣、特辣" />
          </el-form-item>
        </div>
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
      <el-table :data="categories" size="small">
        <el-table-column label="名称" min-width="140">
          <template #default="{ row }">
            <el-input v-if="editingCategoryId === row.id" v-model="editingCategoryName" size="small" />
            <span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="100">
          <template #default="{ row }">{{ row.sortOrder }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <template v-if="editingCategoryId === row.id">
              <el-button link type="primary" @click="onSaveCategory(row.id)">保存</el-button>
              <el-button link @click="editingCategoryId = null">取消</el-button>
            </template>
            <template v-else>
              <el-button link type="primary" @click="startEditCategory(row)">编辑</el-button>
              <el-button link type="danger" @click="onDeleteCategory(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import { pactApi, readImageDataUrl, type Dish, type DishCategory } from '@our-pact/shared'

const dishes = ref<Dish[]>([])
const categories = ref<DishCategory[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref<Dish | null>(null)
const filterCategoryId = ref(0)

const categoryDialogVisible = ref(false)
const categorySaving = ref(false)
const categoryForm = reactive({ name: '' })
const editingCategoryId = ref<number | null>(null)
const editingCategoryName = ref('')

const form = reactive({
  categoryId: 0,
  name: '',
  description: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
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

function formatOptions(dish: Dish) {
  if (!dish.optionGroups.length) return '—'
  return dish.optionGroups
    .map((group) => `${group.name}（${group.values.map((v) => v.label).join('/')}）`)
    .join('；')
}

async function load() {
  loading.value = true
  try {
    const [dishList, categoryList] = await Promise.all([pactApi.listDishes(), pactApi.listCategories()])
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
    form.imageUrl = await readImageDataUrl(raw)
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
      await pactApi.updateDish(editing.value.id, draft)
      ElMessage.success('菜品已更新')
    } else {
      await pactApi.createDish(draft)
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

async function onDelete(dish: Dish) {
  try {
    await ElMessageBox.confirm(`删除「${dish.name}」后不可恢复。`, '删除菜品', { type: 'warning' })
    await pactApi.deleteDish(dish.id)
    ElMessage.success('已删除')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
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
    await pactApi.createCategory({ name: categoryForm.name })
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
    await pactApi.updateCategory(id, { name: editingCategoryName.value })
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
    await pactApi.deleteCategory(row.id)
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

.option-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
}

.option-box {
  border: 1px dashed #e5e1d8;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.cat-add {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.dish-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  background: #f0ebe3;
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview {
  display: block;
  margin-top: 12px;
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e1d8;
}
</style>
