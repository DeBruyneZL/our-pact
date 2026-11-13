<template>
  <section class="travels">
    <div class="head">
      <h2>旅行记录</h2>
      <div class="head-actions">
        <button
          v-if="view !== 'map' && litSpots.length"
          class="memo-btn"
          type="button"
          :disabled="memoBusy"
          @click="onMakeMemo"
        >
          {{ memoBusy ? '生成中…' : '生成纪念长图' }}
        </button>
        <div class="view-tabs">
          <button
            v-for="option in viewOptions"
            :key="option.value"
            type="button"
            class="view-tab"
            :class="{ active: view === option.value }"
            @click="view = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-loading="loading" class="stats">
      <div class="progress">
        <div class="progress-top">
          <span class="progress-label">省份覆盖</span>
          <strong>{{ stats.provinceCount }}/34</strong>
        </div>
        <el-progress
          :percentage="Math.round((stats.provinceCount / 34) * 100)"
          :stroke-width="8"
          :show-text="false"
          color="#f08c00"
        />
      </div>
      <div class="chips">
        <span class="chip lit"><em>{{ stats.litCount }}</em>地点</span>
        <span class="chip"><em>{{ stats.districtCount }}</em>区县</span>
        <span class="chip"><em>{{ stats.cityCount }}</em>城市</span>
        <span class="chip wish"><em>{{ stats.wishCount }}</em>想去</span>
      </div>
    </div>

    <div v-if="wishSpots.length" class="wish-strip">
      <span class="strip-label">想去清单</span>
      <el-tag
        v-for="spot in wishSpots"
        :key="spot.id"
        class="wish-tag"
        effect="plain"
        @click="openDetail(spot)"
      >
        {{ spot.name }}
      </el-tag>
    </div>

    <div v-show="view === 'map'" class="map-wrap">
      <TravelMap
        ref="mapRef"
        :spots="spots"
        :picking="picking"
        @spot-click="openDetail"
        @district-click="onDistrictClick"
        @pick="onMapPick"
      />
      <div class="map-tools">
        <button class="tool-btn primary" type="button" @click="openForm()">添加地点</button>
        <button class="tool-btn" :class="{ active: picking }" type="button" @click="picking = !picking">
          {{ picking ? '点选中 · 取消' : '地图点选' }}
        </button>
      </div>
    </div>

    <div v-if="view === 'wall'" class="wall">
      <p v-if="!litSpots.length" class="wall-empty">还没有点亮的地方，先去地图上标记第一个吧。</p>
      <button
        v-for="spot in litSpots"
        :key="spot.id"
        type="button"
        class="wall-card"
        @click="flyToSpot(spot)"
      >
        <div class="wall-photo" :class="{ filled: !!spot.photoUrl }">
          <img v-if="spot.photoUrl" :src="spot.photoUrl" alt="" loading="lazy" />
          <span v-else>{{ spot.name }}</span>
        </div>
        <p class="wall-name">{{ spot.name }}</p>
        <p class="wall-meta">{{ spot.visitedOn }}<template v-if="spot.district"> · {{ spot.district }}</template></p>
      </button>
    </div>

    <div v-if="view === 'timeline'" class="timeline">
      <p v-if="!litSpots.length" class="timeline-empty">还没有点亮的地方，先去地图上标记第一个吧。</p>
      <button
        v-for="spot in litSpots"
        :key="spot.id"
        type="button"
        class="timeline-item"
        @click="flyToSpot(spot)"
      >
        <div class="timeline-rail">
          <span class="dot"></span>
        </div>
        <div class="timeline-card">
          <div class="timeline-photo" :class="{ filled: !!spot.photoUrl }">
            <img v-if="spot.photoUrl" :src="spot.photoUrl" alt="" loading="lazy" />
            <span v-else>{{ spot.name.slice(0, 1) }}</span>
          </div>
          <div class="timeline-copy">
            <p class="timeline-date">{{ spot.visitedOn || '时间未填' }}</p>
            <h3>{{ spot.name }}</h3>
            <p class="timeline-meta">
              {{ [spot.province, spot.city, spot.district].filter(Boolean).join(' · ') || '位置待定' }}
              <template v-if="spot.foods.length"> · {{ spot.foods.length }} 笔美食</template>
            </p>
            <p v-if="spot.note" class="timeline-note">{{ spot.note }}</p>
          </div>
        </div>
      </button>
    </div>

    <SpotFormDialog v-model="formVisible" :pick="pick" @saved="onSaved" />
    <SpotDetailDialog
      v-model="detailVisible"
      :spot="detailSpot"
      @saved="onSaved"
      @lighted="onLighted"
      @deleted="onDeleted"
    />
    <MilestoneOverlay :message="milestone" @done="milestone = null" />

    <el-dialog v-model="memoVisible" title="旅行纪念长图" width="440px">
      <img v-if="memoUrl" class="memo-image" :src="memoUrl" alt="旅行纪念长图" />
      <template #footer>
        <div class="memo-footer">
          <button class="memo-save" type="button" @click="onSaveMemo">保存长图</button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, ref } from 'vue'
import {
  getTravelStats,
  listTravelSpots,
  updateTravelSpot,
  type TravelSpot,
  type TravelStats,
} from '@our-pact/shared'
import { reverseGeocode, splitAdcode, type TravelPick } from './amap'
import { paintTravelPoster } from './travelPoster'
import MilestoneOverlay from './components/MilestoneOverlay.vue'
import SpotDetailDialog from './components/SpotDetailDialog.vue'
import SpotFormDialog from './components/SpotFormDialog.vue'
import TravelMap from './components/TravelMap.vue'

const loading = ref(false)
const view = ref<'map' | 'wall' | 'timeline'>('map')
const viewOptions = [
  { value: 'map', label: '地图' },
  { value: 'wall', label: '照片墙' },
  { value: 'timeline', label: '时间轴' },
] as const
const spots = ref<TravelSpot[]>([])
const stats = ref<TravelStats>({
  wishCount: 0,
  litCount: 0,
  districtCount: 0,
  cityCount: 0,
  provinceCount: 0,
})

const picking = ref(false)
const pick = ref<TravelPick | null>(null)
const mapRef = ref<InstanceType<typeof TravelMap> | null>(null)
const formVisible = ref(false)
const detailVisible = ref(false)
const detailSpot = ref<TravelSpot | null>(null)
const milestone = ref<string | null>(null)
const memoBusy = ref(false)
const memoVisible = ref(false)
const memoUrl = ref('')

const litSpots = computed(() =>
  spots.value
    .filter((spot) => spot.status === 'lit')
    .sort((a, b) => (b.visitedOn || '').localeCompare(a.visitedOn || '')),
)

const wishSpots = computed(() => spots.value.filter((spot) => spot.status === 'wish'))

onMounted(refresh)

async function refresh() {
  loading.value = true
  try {
    const [list, statsResult] = await Promise.all([listTravelSpots(), getTravelStats()])
    spots.value = list
    stats.value = statsResult
    // 补编码放后台，不挡住页面和保存
    void fillAdcodes(list)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function openForm() {
  pick.value = null
  formVisible.value = true
}

/** 旧数据只有名称没有行政区划编码，按坐标后台补一次，不阻塞页面。 */
async function fillAdcodes(list: TravelSpot[]) {
  const missing = list.filter((spot) => !spot.adcode)
  if (!missing.length) {
    return
  }
  let changed = false
  for (const spot of missing) {
    try {
      const region = await reverseGeocode({ lng: Number(spot.lng), lat: Number(spot.lat) })
      const codes = splitAdcode(region.adcode)
      const updated = await updateTravelSpot(spot.id, {
        province: region.province,
        city: region.city,
        district: region.district,
        adcode: codes.adcode,
        cityAdcode: codes.cityAdcode,
        provinceAdcode: codes.provinceAdcode,
      })
      spots.value = spots.value.map((item) => (item.id === updated.id ? updated : item))
      changed = true
    } catch {
      // 这一条补不上就先靠名称/坐标点亮，下次进入再试
    }
  }
  if (changed) {
    try {
      stats.value = await getTravelStats()
    } catch {
      // 统计刷新失败不影响点亮
    }
  }
}

async function onMapPick(lnglat: { lng: number; lat: number }) {
  picking.value = false
  try {
    const region = await reverseGeocode(lnglat)
    pick.value = {
      lng: lnglat.lng,
      lat: lnglat.lat,
      province: region.province,
      city: region.city,
      district: region.district,
      adcode: region.adcode,
    }
  } catch {
    pick.value = { lng: lnglat.lng, lat: lnglat.lat }
  }
  formVisible.value = true
}

function onDistrictClick(adcode: string) {
  const match = litSpots.value.find((spot) => spot.adcode === adcode)
  if (match) {
    openDetail(match)
  }
}

function openDetail(spot: TravelSpot) {
  detailSpot.value = spot
  detailVisible.value = true
}

function onSaved(spot: TravelSpot) {
  const exists = spots.value.some((item) => item.id === spot.id)
  spots.value = exists ? spots.value.map((item) => (item.id === spot.id ? spot : item)) : [spot, ...spots.value]
  if (detailSpot.value?.id === spot.id) {
    detailSpot.value = spot
  }
  void getTravelStats()
    .then((result) => {
      stats.value = result
    })
    .catch(() => undefined)
}

function onDeleted(id: number) {
  spots.value = spots.value.filter((item) => item.id !== id)
  void getTravelStats()
    .then((result) => {
      stats.value = result
    })
    .catch(() => undefined)
}

/** 里程碑判断发生在点亮后。刷新前的 spots 里没有这次的点亮，正好当基线。 */
async function onLighted(spot: TravelSpot) {
  const baseline = spots.value.filter((item) => item.status === 'lit' && item.id !== spot.id)
  const hasProvince = Boolean(spot.provinceAdcode || spot.province)
  const hasCity = Boolean(spot.cityAdcode || spot.city)
  const firstProvince = hasProvince && !baseline.some((item) => sameRegion(item, spot, 'province'))
  const firstCity = hasCity && !baseline.some((item) => sameRegion(item, spot, 'city'))
  await refresh()
  if (firstProvince) {
    milestone.value = `首次点亮 ${spot.province || '新省份'}！`
  } else if (firstCity) {
    milestone.value = `首次点亮 ${spot.city || '新城市'}！`
  } else if (stats.value.districtCount > 0 && stats.value.districtCount % 5 === 0) {
    milestone.value = `第 ${stats.value.districtCount} 个区县，继续走吧！`
  } else {
    milestone.value = `又点亮一个地方：${spot.name}`
  }
}

/** 同省同市优先比行政区划编码，缺编码才退回名称比较。 */
function sameRegion(a: TravelSpot, b: TravelSpot, kind: 'province' | 'city'): boolean {
  if (kind === 'province') {
    if (a.provinceAdcode && b.provinceAdcode) {
      return a.provinceAdcode === b.provinceAdcode
    }
    return Boolean(a.province && a.province === b.province)
  }
  if (a.cityAdcode && b.cityAdcode) {
    return a.cityAdcode === b.cityAdcode
  }
  return Boolean(a.city && a.city === b.city)
}

/** 照片墙和时间轴点卡片：切回地图并飞到那个点。 */
function flyToSpot(spot: TravelSpot) {
  view.value = 'map'
  void nextTick(() => {
    mapRef.value?.focus(Number(spot.lng), Number(spot.lat))
  })
}

/** 把整段旅程画成纪念长图：按时间串成足迹路线，先预览再保存。 */
async function onMakeMemo() {
  if (memoBusy.value || !litSpots.value.length) {
    return
  }
  memoBusy.value = true
  try {
    const stops = [...litSpots.value].sort((a, b) => (a.visitedOn || '').localeCompare(b.visitedOn || ''))
    const dates = stops.map((spot) => spot.visitedOn || '').filter(Boolean)
    const canvas = document.createElement('canvas')
    await paintTravelPoster(canvas, {
      stats: {
        spotCount: stops.length,
        districtCount: stats.value.districtCount,
        cityCount: stats.value.cityCount,
        provinceCount: stats.value.provinceCount,
      },
      rangeText: dates.length ? `${dates[0]} – ${dates[dates.length - 1]}` : '',
      yearText: dates.length
        ? `${dates[0].slice(0, 4)}–${dates[dates.length - 1].slice(0, 4)}`
        : `${stops.length} 站`,
      spots: stops.map((spot) => ({
        name: spot.name,
        regionText: [spot.province, spot.city, spot.district].filter(Boolean).join(' · '),
        visitedOn: spot.visitedOn || '',
        note: spot.note || '',
        photoUrl: spot.photoUrl || '',
        foodCount: spot.foods.length,
      })),
    })
    memoUrl.value = canvas.toDataURL('image/png')
    memoVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '生成失败')
  } finally {
    memoBusy.value = false
  }
}

function onSaveMemo() {
  if (!memoUrl.value) {
    return
  }
  const anchor = document.createElement('a')
  anchor.href = memoUrl.value
  anchor.download = '旅行纪念.png'
  anchor.click()
}
</script>

<style scoped>
.travels {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.head h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0.04em;
}

.view-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 5px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(44, 42, 38, 0.06);
}

.view-tab {
  padding: 9px 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.view-tab:hover {
  color: var(--brand-dark);
  background: rgba(91, 143, 122, 0.1);
}

.view-tab.active {
  background: linear-gradient(135deg, #74a98f, var(--brand));
  color: #fff;
  box-shadow: 0 3px 12px rgba(91, 143, 122, 0.4);
}

.head-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.memo-btn {
  padding: 9px 18px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #f2b45c, #e8973c);
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(232, 151, 60, 0.35);
}

.memo-btn:hover {
  background: linear-gradient(135deg, #f0a845, #dd8a28);
}

.memo-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.memo-image {
  display: block;
  width: 100%;
  border-radius: 10px;
}

.memo-footer {
  display: flex;
  justify-content: flex-end;
}

.memo-save {
  padding: 9px 18px;
  border: 0;
  border-radius: 999px;
  background: var(--brand);
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.memo-save:hover {
  background: var(--brand-dark);
}

.stats {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  align-items: center;
  padding: 16px 20px;
  border: 1px solid #d8e5de;
  border-radius: 16px;
  background: linear-gradient(135deg, #f7fbf8 0%, #fffcf7 100%);
}

.progress-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 13px;
  color: var(--muted);
}

.progress-top strong {
  font-size: 18px;
  color: #f08c00;
}

.chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 76px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e1d8;
  color: var(--muted);
  font-size: 12px;
}

.chip em {
  font-style: normal;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.chip.lit em {
  color: #f08c00;
}

.chip.wish em {
  color: var(--muted);
}

.wish-strip {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.strip-label {
  color: var(--muted);
  font-size: 13px;
}

.wish-tag {
  cursor: pointer;
}

.map-wrap {
  position: relative;
  height: calc(100vh - 300px);
  min-height: 420px;
}

.map-tools {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.tool-btn {
  padding: 9px 14px;
  border: 1px solid rgba(44, 42, 38, 0.12);
  border-radius: 999px;
  background: rgba(255, 252, 247, 0.94);
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(44, 42, 38, 0.1);
}

.tool-btn:hover {
  background: #fff;
}

.tool-btn.primary {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.tool-btn.primary:hover {
  background: var(--brand-dark);
}

.tool-btn.active {
  background: #fff4e0;
  border-color: #f08c00;
  color: #c56a00;
}

.wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.wall-empty {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.wall-card {
  display: grid;
  gap: 6px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  cursor: pointer;
  text-align: left;
  font: inherit;
}

.wall-card:hover {
  box-shadow: 0 4px 16px rgba(44, 42, 38, 0.12);
}

.wall-photo {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(135deg, #ffe3b0, #ffb02e);
  color: #fff;
  font-size: 16px;
  letter-spacing: 0.2em;
}

.wall-photo.filled {
  background: #f4efe6;
  color: transparent;
}

.wall-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.wall-name {
  margin: 0 12px 0;
  font-weight: 600;
}

.wall-meta {
  margin: 0 12px 12px;
  color: var(--muted);
  font-size: 12px;
}

.timeline {
  display: grid;
  gap: 0;
  max-width: 820px;
}

.timeline-empty {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.timeline-rail {
  position: relative;
  display: flex;
  justify-content: center;
}

.timeline-rail::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #d8e5de;
}

.timeline-item:first-child .timeline-rail::before {
  top: 18px;
}

.timeline-item:last-child .timeline-rail::before {
  bottom: calc(100% - 18px);
}

.dot {
  position: relative;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-top: 18px;
  border-radius: 50%;
  background: #f08c00;
  box-shadow: 0 0 0 4px rgba(240, 140, 0, 0.18);
}

.timeline-card {
  display: grid;
  grid-template-columns: 148px 1fr;
  gap: 16px;
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid #d8e5de;
  border-radius: 16px;
  background: #fff;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.timeline-item:hover .timeline-card {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(44, 42, 38, 0.08);
}

.timeline-photo {
  position: relative;
  display: grid;
  place-items: center;
  align-self: start;
  width: 148px;
  height: 110px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #ffe3b0, #ffb02e);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.timeline-photo.filled {
  background: #f4efe6;
  color: transparent;
}

.timeline-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.timeline-copy {
  min-width: 0;
  padding-top: 4px;
}

.timeline-date {
  margin: 0 0 4px;
  color: #f08c00;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.timeline-copy h3 {
  margin: 0;
  font-size: 18px;
}

.timeline-meta {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.timeline-note {
  margin: 10px 0 0;
  color: var(--ink);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .timeline-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
