<template>
  <el-dialog v-model="visible" width="640px" class="travel-dialog" @closed="reset">
    <template #header>
      <div v-if="spot" class="dialog-head">
        <div class="title-row">
          <h3>{{ spot.name }}</h3>
          <span class="badge" :class="spot.status">{{ travelStatusLabel(spot.status) }}</span>
        </div>
        <p class="region">{{ regionText }}</p>
      </div>
    </template>

    <div v-if="spot" v-loading="loading" class="body">
      <div v-if="spot.status === 'wish'" class="light-box">
        <div>
          <strong>准备点亮</strong>
          <p>到了就选个日期，把它点亮。</p>
        </div>
        <div class="light-actions">
          <el-date-picker v-model="lightDate" type="date" value-format="YYYY-MM-DD" placeholder="旅行时间" />
          <button class="primary-btn" type="button" :disabled="!lightDate || loading" @click="onLight">点亮</button>
        </div>
      </div>

      <template v-else>
        <div class="hero">
          <div class="frame" :class="{ filled: !!spot.photoUrl }">
            <img v-if="spot.photoUrl" :src="spot.photoUrl" alt="" />
            <div v-else class="empty-photo">
              <strong>还没有照片</strong>
              <span>补一张当地的画面</span>
            </div>
          </div>
          <el-upload :show-file-list="false" accept="image/*" :auto-upload="false" :on-change="onPhotoChange">
            <button class="ghost-btn" type="button">{{ spot.photoUrl ? '更换照片' : '上传照片' }}</button>
          </el-upload>
        </div>

        <div class="panel">
          <label class="field">
            <span class="label">地点名称</span>
            <el-input v-model="edit.name" maxlength="64" show-word-limit />
          </label>
          <label class="field">
            <span class="label">旅行时间</span>
            <el-date-picker v-model="edit.visitedOn" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </label>
          <label class="field">
            <span class="label">随记</span>
            <el-input v-model="edit.note" type="textarea" :rows="2" maxlength="255" show-word-limit />
          </label>
          <div class="panel-actions">
            <button class="primary-btn" type="button" :disabled="loading" @click="onSave">保存修改</button>
          </div>
        </div>
      </template>

      <SpotFoods :spot="spot" @saved="onSaved" />

      <div class="danger-zone">
        <div>
          <p class="danger-title">不再保留这个地点</p>
          <p class="danger-desc">点亮记录和美食会一起删掉</p>
        </div>
        <button class="danger-btn" type="button" @click="onDelete">删除地点</button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import {
  deleteTravelSpot,
  lightTravelSpot,
  travelStatusLabel,
  updateTravelSpot,
  uploadTravelSpotPhoto,
  type TravelSpot,
} from '@our-pact/shared'
import { computed, reactive, ref, watch } from 'vue'
import SpotFoods from './SpotFoods.vue'

const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  spot: TravelSpot | null
}>()

const emit = defineEmits<{
  (e: 'saved', spot: TravelSpot): void
  (e: 'lighted', spot: TravelSpot): void
  (e: 'deleted', id: number): void
}>()

const loading = ref(false)
const lightDate = ref('')
const edit = reactive({
  name: '',
  visitedOn: '',
  note: '',
})

const regionText = computed(() =>
  [props.spot?.province, props.spot?.city, props.spot?.district].filter(Boolean).join(' · ') || '位置待定',
)

watch(visible, (open) => {
  if (open && props.spot) {
    lightDate.value = ''
    edit.name = props.spot.name
    edit.visitedOn = props.spot.visitedOn || ''
    edit.note = props.spot.note || ''
  }
})

function reset() {
  lightDate.value = ''
}

async function onLight() {
  if (!props.spot || !lightDate.value) {
    return
  }
  loading.value = true
  try {
    const spot = await lightTravelSpot(props.spot.id, lightDate.value)
    emit('lighted', spot)
    ElMessage.success('点亮成功')
    visible.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '点亮失败')
  } finally {
    loading.value = false
  }
}

async function onPhotoChange(file: UploadFile) {
  if (!props.spot || !file.raw) {
    return
  }
  loading.value = true
  try {
    const spot = await uploadTravelSpotPhoto(props.spot.id, file.raw)
    emit('saved', spot)
    ElMessage.success('照片已更新')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '照片上传失败')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  if (!props.spot) {
    return
  }
  if (!edit.name.trim()) {
    ElMessage.error('地点名称不能为空')
    return
  }
  loading.value = true
  try {
    const spot = await updateTravelSpot(props.spot.id, {
      name: edit.name.trim(),
      visitedOn: edit.visitedOn || undefined,
      note: edit.note.trim() || undefined,
    })
    emit('saved', spot)
    ElMessage.success('已保存')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    loading.value = false
  }
}

function onSaved(spot: TravelSpot) {
  emit('saved', spot)
}

async function onDelete() {
  if (!props.spot) {
    return
  }
  try {
    await ElMessageBox.confirm(`取消「${props.spot.name}」？美食记录会一起删除。`, '取消地点', {
      type: 'warning',
      confirmButtonText: '取消地点',
      cancelButtonText: '先留着',
    })
  } catch {
    return
  }
  try {
    await deleteTravelSpot(props.spot.id)
    emit('deleted', props.spot.id)
    ElMessage.success('已取消')
    visible.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}
</script>

<style scoped>
.dialog-head .title-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dialog-head h3 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0.04em;
}

.badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.badge.lit {
  background: #fff1d6;
  color: #c56a00;
}

.badge.wish {
  background: #eef2ef;
  color: var(--muted);
}

.region {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.body {
  display: grid;
  gap: 18px;
}

.light-box {
  display: grid;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff6e8, #fffcf7);
  border: 1px solid #f0d4a2;
}

.light-box strong {
  display: block;
  margin-bottom: 4px;
  font-size: 15px;
}

.light-box p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.light-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.frame {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--line);
  background:
    linear-gradient(135deg, rgba(240, 140, 0, 0.12), transparent 55%),
    #f7f5f0;
}

.frame.filled {
  height: 220px;
  border-color: transparent;
  background: #f4efe6;
}

.frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.empty-photo {
  display: grid;
  place-content: center;
  gap: 4px;
  height: 100%;
  text-align: center;
  color: var(--muted);
}

.empty-photo strong {
  color: var(--ink);
  font-size: 15px;
}

.empty-photo span {
  font-size: 12px;
}

.panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background: #f7fbf8;
  border: 1px solid #d8e5de;
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
}

.danger-zone {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fbf6f5;
  border: 1px solid #efd7d4;
}

.danger-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #8a4440;
}

.danger-desc {
  margin: 4px 0 0;
  color: #a87874;
  font-size: 12px;
}

.ghost-btn,
.primary-btn,
.danger-btn {
  font: inherit;
  cursor: pointer;
}

.ghost-btn,
.primary-btn,
.danger-btn {
  padding: 9px 16px;
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
  cursor: not-allowed;
}

.danger-btn {
  flex-shrink: 0;
  border: 1px solid #e2b4af;
  background: #fff;
  color: #b44a43;
}

.danger-btn:hover {
  background: #f8ebe9;
}
</style>
