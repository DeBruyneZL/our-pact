<template>
  <el-dialog
    v-model="visible"
    width="560px"
    :close-on-click-modal="false"
    class="travel-dialog"
    @closed="reset"
  >
    <template #header>
      <div class="dialog-head">
        <p class="eyebrow">旅行足迹</p>
        <h3>添加地点</h3>
      </div>
    </template>

    <div class="panel">
      <label class="field">
        <span class="label">搜索地点</span>
        <el-select
          v-model="poiId"
          filterable
          remote
          clearable
          placeholder="搜景区、餐厅或城市，例如 西湖"
          :remote-method="onSearch"
          :loading="searching"
          @change="onPoiChange"
        >
          <el-option v-for="poi in pois" :key="poiKey(poi)" :value="poiKey(poi)" :label="poi.name">
            <span>{{ poi.name }}</span>
            <span class="poi-region">{{ regionOf(poi) }}</span>
          </el-option>
        </el-select>
      </label>

      <label class="field">
        <span class="label">地点名称</span>
        <el-input v-model="form.name" maxlength="64" show-word-limit placeholder="例如 杭州西湖" />
      </label>

      <div class="coords-card" :class="{ ready: form.lng !== null }">
        <span class="coords-label">坐标</span>
        <span v-if="form.lng !== null" class="coords-value">
          {{ form.lng.toFixed(5) }}, {{ form.lat?.toFixed(5) }}
          <template v-if="regionHint"> · {{ regionHint }}</template>
        </span>
        <span v-else class="coords-value muted">在地图上点选，或搜索后自动填入</span>
      </div>

      <div class="status-row">
        <button
          type="button"
          class="status-card"
          :class="{ active: form.status === 'wish' }"
          @click="form.status = 'wish'"
        >
          <strong>想去</strong>
          <span>先记在清单里</span>
        </button>
        <button
          type="button"
          class="status-card lit"
          :class="{ active: form.status === 'lit' }"
          @click="form.status = 'lit'"
        >
          <strong>现在点亮</strong>
          <span>补上时间与照片</span>
        </button>
      </div>

      <template v-if="form.status === 'lit'">
        <label class="field">
          <span class="label">旅行时间</span>
          <el-date-picker
            v-model="form.visitedOn"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="哪天到的"
            style="width: 100%"
          />
        </label>

        <div class="field">
          <span class="label">照片</span>
          <div class="photo-row">
            <div class="frame" :class="{ filled: !!photoDataUrl }">
              <img v-if="photoDataUrl" :src="photoDataUrl" alt="" />
              <span v-else>当地的一张照片</span>
            </div>
            <div class="photo-actions">
              <el-upload :show-file-list="false" accept="image/*" :auto-upload="false" :on-change="onPhotoChange">
                <button class="ghost-btn" type="button">{{ photoDataUrl ? '更换' : '上传' }}</button>
              </el-upload>
              <button v-if="photoDataUrl" class="ghost-btn danger" type="button" @click="onPhotoRemove">移除</button>
            </div>
          </div>
        </div>
      </template>

      <label class="field">
        <span class="label">随记</span>
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          maxlength="255"
          show-word-limit
          placeholder="想去理由，或一句话记录"
        />
      </label>
    </div>

    <template #footer>
      <div class="footer">
        <button class="ghost-btn" type="button" @click="visible = false">取消</button>
        <button class="primary-btn" type="button" :disabled="saving" @click="onSubmit">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, type UploadFile } from 'element-plus'
import {
  addTravelSpot,
  fileFromDataUrl,
  readImageDataUrl,
  uploadTravelSpotPhoto,
  type TravelSpot,
  type TravelStatus,
} from '@our-pact/shared'
import { computed, ref, watch } from 'vue'
import { reverseGeocode, searchPlaces, splitAdcode, type AMapPoi, type TravelPick } from '../amap'

const visible = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'saved', spot: TravelSpot): void
}>()

const props = defineProps<{
  pick?: TravelPick | null
}>()

const pois = ref<AMapPoi[]>([])
const poiId = ref('')
const searching = ref(false)
const saving = ref(false)
const photoDataUrl = ref('')
const form = ref({
  name: '',
  province: '',
  city: '',
  district: '',
  adcode: '',
  lng: null as number | null,
  lat: null as number | null,
  status: 'wish' as TravelStatus,
  visitedOn: '',
  note: '',
})

const regionHint = computed(() =>
  [form.value.province, form.value.city, form.value.district].filter(Boolean).join(' · '),
)

watch(
  () => props.pick,
  (pick) => {
    if (pick) {
      form.value.lng = pick.lng
      form.value.lat = pick.lat
      form.value.name = pick.name || ''
      form.value.province = pick.province || ''
      form.value.city = pick.city || ''
      form.value.district = pick.district || ''
      form.value.adcode = pick.adcode || ''
    }
  },
  { immediate: true },
)

watch(visible, (open) => {
  if (open && props.pick) {
    form.value.status = 'lit'
  }
})

async function onSearch(keyword: string) {
  if (!keyword.trim()) {
    pois.value = []
    return
  }
  searching.value = true
  try {
    pois.value = await searchPlaces(keyword.trim())
  } catch {
    pois.value = []
  } finally {
    searching.value = false
  }
}

function onPoiChange(key: string) {
  const poi = pois.value.find((item) => poiKey(item) === key)
  if (!poi) {
    return
  }
  if (poi.location) {
    form.value.lng = poi.location.lng
    form.value.lat = poi.location.lat
  }
  form.value.name = poi.name
  form.value.province = poi.pname || ''
  form.value.city = poi.cityname || ''
  form.value.district = poi.adname || ''
  form.value.adcode = poi.adcode || ''
}

function poiKey(poi: AMapPoi): string {
  return `${poi.name}|${regionOf(poi)}`
}

function regionOf(poi: AMapPoi): string {
  return [poi.pname, poi.cityname, poi.adname].filter(Boolean).join(' ')
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

function onPhotoRemove() {
  photoDataUrl.value = ''
}

function reset() {
  pois.value = []
  poiId.value = ''
  photoDataUrl.value = ''
  form.value = {
    name: '',
    province: '',
    city: '',
    district: '',
    adcode: '',
    lng: null,
    lat: null,
    status: 'wish',
    visitedOn: '',
    note: '',
  }
}

async function onSubmit() {
  const data = form.value
  if (!data.name.trim()) {
    ElMessage.error('请填写地点名称')
    return
  }
  if (data.lng === null || data.lat === null) {
    ElMessage.error('请先搜索地点或在地图上点选')
    return
  }
  if (data.status === 'lit' && !data.visitedOn) {
    ElMessage.error('请选择旅行时间')
    return
  }
  saving.value = true
  try {
    let province = data.province
    let city = data.city
    let district = data.district
    let adcode = data.adcode
    if (!adcode) {
      try {
        const region = await reverseGeocode({ lng: data.lng, lat: data.lat })
        province = province || region.province
        city = city || region.city
        district = district || region.district
        adcode = region.adcode
      } catch {
        // 忽略，后面照常保存
      }
    }
    const codes = adcode ? splitAdcode(adcode) : null
    let spot = await addTravelSpot({
      name: data.name.trim(),
      province: province || undefined,
      city: city || undefined,
      district: district || undefined,
      adcode: codes?.adcode,
      cityAdcode: codes?.cityAdcode,
      provinceAdcode: codes?.provinceAdcode,
      lng: data.lng,
      lat: data.lat,
      status: data.status,
      visitedOn: data.status === 'lit' ? data.visitedOn : undefined,
      note: data.note.trim() || undefined,
    })
    if (data.status === 'lit' && photoDataUrl.value) {
      spot = await uploadTravelSpotPhoto(spot.id, await fileFromDataUrl(photoDataUrl.value, 'travel.jpg'))
    }
    emit('saved', spot)
    ElMessage.success(data.status === 'lit' ? '点亮成功' : '已加入想去清单')
    visible.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.dialog-head .eyebrow {
  margin: 0 0 4px;
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.dialog-head h3 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0.04em;
}

.panel {
  display: grid;
  gap: 16px;
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

.el-select {
  width: 100%;
}

.poi-region {
  float: right;
  color: var(--muted);
  font-size: 12px;
}

.coords-card {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f3f7f4;
  border: 1px solid #d8e5de;
}

.coords-card.ready {
  background: linear-gradient(135deg, #fff7ea, #fff);
  border-color: #f0d4a2;
}

.coords-label {
  color: var(--muted);
  font-size: 12px;
}

.coords-value {
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
}

.coords-value.muted {
  font-weight: 400;
  color: var(--muted);
}

.status-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.status-card {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.status-card strong {
  font-size: 15px;
  color: var(--ink);
}

.status-card span {
  color: var(--muted);
  font-size: 12px;
}

.status-card.active {
  border-color: var(--brand);
  background: #edf6f1;
  box-shadow: inset 0 0 0 1px var(--brand);
}

.status-card.lit.active {
  border-color: #f08c00;
  background: #fff6e8;
  box-shadow: inset 0 0 0 1px #f08c00;
}

.status-card.lit.active strong {
  color: #c56a00;
}

.photo-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.frame {
  display: grid;
  place-items: center;
  width: 180px;
  height: 112px;
  border: 1px dashed #cfd9d3;
  border-radius: 14px;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  background:
    linear-gradient(135deg, rgba(91, 143, 122, 0.08), transparent 60%),
    #f7fbf8;
}

.frame.filled {
  width: auto;
  height: auto;
  max-width: 240px;
  border-style: solid;
  border-color: var(--line);
  color: transparent;
}

.frame img {
  display: block;
  width: auto;
  height: auto;
  max-width: 240px;
  max-height: 180px;
}

.photo-actions {
  display: grid;
  gap: 8px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ghost-btn,
.primary-btn {
  padding: 9px 16px;
  border-radius: 999px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.ghost-btn {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
}

.ghost-btn.danger {
  border-color: transparent;
  color: #c45656;
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
</style>

<style>
.travel-dialog.el-dialog {
  border-radius: 18px;
  overflow: hidden;
}

.travel-dialog .el-dialog__header {
  margin: 0;
  padding: 22px 24px 8px;
}

.travel-dialog .el-dialog__body {
  padding: 8px 24px 8px;
}

.travel-dialog .el-dialog__footer {
  padding: 12px 24px 22px;
}
</style>
