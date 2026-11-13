<template>
  <section class="foods">
    <div class="foods-head">
      <h4>美食记录</h4>
      <div class="head-right">
        <span>{{ spot.foods.length }} 笔 · 可继续添加</span>
        <button
          v-if="spot.foods.length"
          class="ghost-btn"
          type="button"
          :disabled="posterBusy"
          @click="onMakePoster"
        >
          {{ posterBusy ? '生成中…' : '生成海报' }}
        </button>
      </div>
    </div>
    <p v-if="!spot.foods.length" class="empty">这一站吃了什么，记在这里，可以记多笔。</p>
    <ul v-else class="food-list">
      <li v-for="food in spot.foods" :key="food.id" class="food-card">
        <img v-if="food.photoUrl" class="food-photo" :src="food.photoUrl" alt="" loading="lazy" />
        <div v-else class="food-photo placeholder">食</div>
        <div class="food-body">
          <p class="food-title">
            <strong>{{ food.dishName }}</strong>
            <span v-if="food.shopName" class="shop">{{ food.shopName }}</span>
          </p>
          <p v-if="food.note" class="food-note">{{ food.note }}</p>
        </div>
        <button class="danger-link" type="button" @click="onDelete(food)">删除</button>
      </li>
    </ul>

    <div class="food-form">
      <div class="food-form-grid">
        <label class="field">
          <span class="label">吃了什么</span>
          <el-input v-model="addForm.dishName" maxlength="64" placeholder="例如 葱包桧" />
        </label>
        <label class="field">
          <span class="label">店名</span>
          <el-input v-model="addForm.shopName" maxlength="64" placeholder="可选" />
        </label>
        <label class="field wide">
          <span class="label">随记</span>
          <el-input v-model="addForm.note" maxlength="255" placeholder="可选" />
        </label>
        <div class="field wide">
          <span class="label">照片</span>
          <div class="photo-row">
            <div class="frame" :class="{ filled: !!photoDataUrl }">
              <img v-if="photoDataUrl" :src="photoDataUrl" alt="" />
              <span v-else>可选</span>
            </div>
            <div class="photo-actions">
              <el-upload :show-file-list="false" accept="image/*" :auto-upload="false" :on-change="onPhotoChange">
                <button class="ghost-btn" type="button">{{ photoDataUrl ? '更换' : '上传' }}</button>
              </el-upload>
              <button v-if="photoDataUrl" class="danger-link" type="button" @click="photoDataUrl = ''">移除</button>
            </div>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="primary-btn" type="button" :disabled="saving" @click="onAdd">
          {{ saving ? '保存中…' : '记一笔' }}
        </button>
      </div>
    </div>

    <el-dialog
      v-model="posterVisible"
      title="美食海报"
      width="440px"
      append-to-body
      class="poster-dialog"
    >
      <img v-if="posterUrl" class="poster-image" :src="posterUrl" alt="美食海报" />
      <template #footer>
        <div class="poster-actions">
          <button class="primary-btn" type="button" @click="onSavePoster">保存长图</button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import {
  addTravelFood,
  deleteTravelFood,
  fileFromDataUrl,
  readImageDataUrl,
  uploadTravelFoodPhoto,
  type TravelSpot,
} from '@our-pact/shared'
import { reactive, ref } from 'vue'
import { paintFoodPoster } from '../foodPoster'

const props = defineProps<{
  spot: TravelSpot
}>()

const emit = defineEmits<{
  (e: 'saved', spot: TravelSpot): void
}>()

const saving = ref(false)
const photoDataUrl = ref('')
const posterBusy = ref(false)
const posterVisible = ref(false)
const posterUrl = ref('')
const addForm = reactive({
  dishName: '',
  shopName: '',
  note: '',
})

/** 把这一站的美食记录画成纸本风长图，先预览再保存。 */
async function onMakePoster() {
  if (posterBusy.value) {
    return
  }
  posterBusy.value = true
  try {
    const canvas = document.createElement('canvas')
    await paintFoodPoster(canvas, {
      spotName: props.spot.name,
      regionText: [props.spot.province, props.spot.city, props.spot.district]
        .filter(Boolean)
        .join(' · '),
      visitedOn: props.spot.visitedOn || '',
      note: props.spot.note || '',
      coverUrl: props.spot.photoUrl || '',
      foods: props.spot.foods.map((food) => ({
        dishName: food.dishName,
        shopName: food.shopName || '',
        note: food.note || '',
        photoUrl: food.photoUrl || '',
      })),
    })
    posterUrl.value = canvas.toDataURL('image/png')
    posterVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '海报生成失败')
  } finally {
    posterBusy.value = false
  }
}

function onSavePoster() {
  if (!posterUrl.value) {
    return
  }
  const anchor = document.createElement('a')
  anchor.href = posterUrl.value
  anchor.download = `${props.spot.name}-美食.png`
  anchor.click()
}

async function onPhotoChange(file: UploadFile) {
  if (!file.raw) {
    return
  }
  try {
    photoDataUrl.value = await readImageDataUrl(file.raw)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '照片读取失败')
  }
}

async function onAdd() {
  if (!addForm.dishName.trim()) {
    ElMessage.error('请填写吃了什么')
    return
  }
  saving.value = true
  try {
    const before = new Set(props.spot.foods.map((food) => food.id))
    let spot = await addTravelFood(props.spot.id, {
      dishName: addForm.dishName.trim(),
      shopName: addForm.shopName.trim() || undefined,
      note: addForm.note.trim() || undefined,
    })
    const created = spot.foods.find((food) => !before.has(food.id))
    if (created && photoDataUrl.value) {
      spot = await uploadTravelFoodPhoto(created.id, await fileFromDataUrl(photoDataUrl.value, 'travel-food.jpg'))
    }
    emit('saved', spot)
    ElMessage.success('美食已记录')
    addForm.dishName = ''
    addForm.shopName = ''
    addForm.note = ''
    photoDataUrl.value = ''
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function onDelete(food: TravelSpot['foods'][number]) {
  try {
    await ElMessageBox.confirm(`删除「${food.dishName}」这条记录？`, '删除美食', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await deleteTravelFood(food.id)
    emit('saved', { ...props.spot, foods: props.spot.foods.filter((item) => item.id !== food.id) })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}
</script>

<style scoped>
.foods {
  display: grid;
  gap: 12px;
  padding-top: 4px;
  border-top: 1px solid var(--line);
}

.foods-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.foods-head h4 {
  margin: 0;
  font-size: 15px;
}

.head-right {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--muted);
  font-size: 12px;
}

.empty {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.food-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.food-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
}

.food-photo {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: contain;
  background: #f7f5f0;
  flex-shrink: 0;
}

.food-photo.placeholder {
  display: grid;
  place-items: center;
  background: #edf6f1;
  color: var(--brand);
  font-size: 14px;
  font-weight: 700;
}

.food-body {
  flex: 1;
  min-width: 0;
}

.food-title {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin: 0;
}

.shop {
  color: var(--muted);
  font-size: 12px;
}

.food-note {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.food-form {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: #f7fbf8;
  border: 1px solid #d8e5de;
}

.food-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.field.wide {
  grid-column: 1 / -1;
}

.label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.photo-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.frame {
  display: grid;
  place-items: center;
  width: 120px;
  height: 76px;
  border: 1px dashed #cfd9d3;
  border-radius: 12px;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  background: #fff;
}

.frame.filled {
  width: auto;
  height: auto;
  max-width: 160px;
  border-style: solid;
  color: transparent;
}

.frame img {
  display: block;
  width: auto;
  height: auto;
  max-width: 160px;
  max-height: 120px;
}

.photo-actions,
.form-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-actions {
  justify-content: flex-end;
}

.ghost-btn,
.primary-btn,
.danger-link {
  font: inherit;
  cursor: pointer;
}

.ghost-btn,
.primary-btn {
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.ghost-btn {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
}

.primary-btn {
  border: 0;
  background: var(--brand);
  color: #fff;
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.danger-link {
  border: 0;
  background: transparent;
  color: #c45656;
  font-size: 12px;
}

@media (max-width: 640px) {
  .food-form-grid {
    grid-template-columns: 1fr;
  }
}

.poster-image {
  display: block;
  width: 100%;
  border-radius: 10px;
}

.poster-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
