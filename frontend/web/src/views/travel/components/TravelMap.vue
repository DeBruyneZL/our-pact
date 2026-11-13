<template>
  <div ref="containerRef" class="travel-map" :class="{ picking }"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { TravelSpot } from '@our-pact/shared'
import {
  loadMap,
  searchBoundary,
  type AMapCircle,
  type AMapLngLatLike,
  type AMapMap,
  type AMapNamespace,
  type AMapOverlay,
  type AMapPolygon,
} from '../amap'

const props = defineProps<{
  spots: TravelSpot[]
  /** 选点模式：点击地图把坐标抛给父级 */
  picking?: boolean
}>()

const emit = defineEmits<{
  (e: 'spot-click', spot: TravelSpot): void
  (e: 'district-click', districtKey: string): void
  (e: 'pick', lnglat: AMapLngLatLike): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let amap: AMapNamespace | null = null
let map: AMapMap | null = null
const markers = new Map<number, AMapOverlay>()
const polygons = new Map<string, AMapOverlay[]>()
/** 边界缓存，同一区县只查一次 */
const boundaryCache = new Map<string, Promise<Array<Array<[number, number]>>>>()
/** 参与呼吸动效的点亮面 */
const breathing = new Set<AMapPolygon | AMapCircle>()
let breatheHandle: number | undefined

onMounted(async () => {
  try {
    amap = await loadMap()
  } catch {
    return
  }
  if (!containerRef.value) {
    return
  }
  map = new amap.Map(containerRef.value, {
    center: [104.2, 35.5],
    zoom: 4.2,
    viewMode: '2D',
    // 不看路网：只留底面、地名和行政区，路网整层关掉
    features: ['bg', 'point', 'area'],
  })
  // 聚焦中国，拖出范围会弹回来
  map.setLimitBounds(new amap.Bounds([72, 15], [136, 55]))
  map.setBounds(new amap.Bounds([73, 18], [135, 54]))
  try {
    // 行政边界图层：depth 2 = 国 + 省 + 市，市界也画出来
    map.add(
      new amap.DistrictLayer.Country({
        zIndex: 8,
        SOC: 'CHN',
        depth: 2,
        styles: {
          'nation-stroke': '#5b8f7a',
          'coastline-stroke': '#5b8f7a',
          'province-stroke': '#3d6f5c',
          'city-stroke': 'rgba(61,111,92,0.55)',
          'city-stroke-width': 1,
          'county-stroke': 'rgba(91,143,122,0.3)',
          'county-stroke-width': 0.6,
          fill: 'rgba(0,0,0,0)',
        },
      }),
    )
  } catch (error) {
    console.warn('行政区划图层加载失败', error)
  }
  map.on('click', (event) => {
    if (props.picking && map) {
      emit('pick', { lng: event.lnglat.lng, lat: event.lnglat.lat })
    }
  })
  syncOverlays()
  startBreathing()
})

onBeforeUnmount(() => {
  if (breatheHandle !== undefined) {
    cancelAnimationFrame(breatheHandle)
    breatheHandle = undefined
  }
  breathing.clear()
  if (map) {
    map.destroy()
    map = null
  }
  markers.clear()
  polygons.clear()
})

watch(
  () => props.spots,
  () => syncOverlays(),
)

function markerContent(spot: TravelSpot): string {
  const kind = spot.status === 'lit' ? 'lit' : 'wish'
  const label = spot.name.length > 6 ? `${spot.name.slice(0, 6)}…` : spot.name
  return `<div class="travel-pin ${kind}"><span>${escapeHtml(label)}</span></div>`
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function litKey(spot: TravelSpot): string {
  return spot.adcode || `${spot.province || ''}|${spot.city || ''}|${spot.district || spot.name}`
}

function syncOverlays() {
  if (!amap || !map) {
    return
  }
  for (const marker of markers.values()) {
    map.remove(marker)
  }
  markers.clear()

  const litKeys = new Set<string>()
  for (const spot of props.spots) {
    const marker = new amap.Marker({
      position: [Number(spot.lng), Number(spot.lat)],
      content: markerContent(spot),
      offset: new amap.Pixel(-8, -8),
      anchor: 'bottom-center',
      zIndex: spot.status === 'lit' ? 120 : 100,
    })
    marker.on('click', () => emit('spot-click', spot))
    map.add(marker)
    markers.set(spot.id, marker)
    if (spot.status === 'lit') {
      litKeys.add(litKey(spot))
    }
  }
  syncDistricts(litKeys)
}

function syncDistricts(litKeys: Set<string>) {
  if (!amap || !map) {
    return
  }
  for (const [key, overlays] of polygons) {
    if (!litKeys.has(key)) {
      overlays.forEach((overlay) => breathing.delete(overlay as AMapPolygon | AMapCircle))
      map.remove(overlays)
      polygons.delete(key)
    }
  }
  for (const key of litKeys) {
    if (!polygons.has(key)) {
      polygons.set(key, [])
      void drawLit(key)
    }
  }
}

/** 点亮区县：按编码取边界；失败再用名称；再失败就画一个发光圆，保证看得见。 */
async function drawLit(key: string) {
  if (!amap || !map) {
    return
  }
  const spot = props.spots.find((item) => litKey(item) === key)
  if (!spot) {
    polygons.delete(key)
    return
  }
  const overlays: AMapOverlay[] = []
  try {
    const paths = await cachedBoundary(spot)
    for (const path of paths) {
      const polygon = new amap.Polygon({
        path,
        // 低饱和琥珀色，别整块橙红糊在地图上
        fillColor: '#f0ad4e',
        fillOpacity: 0.5,
        strokeColor: '#dd8f2f',
        strokeWeight: 2,
        strokeOpacity: 0.9,
        cursor: 'pointer',
        zIndex: 60,
      })
      polygon.on('click', () => emit('district-click', key))
      map.add(polygon)
      overlays.push(polygon)
      breathing.add(polygon)
    }
    if (!overlays.length) {
      throw new Error('边界为空')
    }
    if (map) {
      polygons.set(key, overlays)
    }
  } catch (error) {
    console.warn('区县板块点亮失败，改用光圈', key, error)
    overlays.forEach((overlay) => breathing.delete(overlay as AMapPolygon))
    if (amap && map) {
      const glow = new amap.Circle({
        center: [Number(spot.lng), Number(spot.lat)],
        radius: 28000,
        fillColor: '#f0ad4e',
        fillOpacity: 0.4,
        strokeColor: '#dd8f2f',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        zIndex: 55,
      })
      glow.on('click', () => emit('district-click', key))
      map.add(glow)
      breathing.add(glow)
      polygons.set(key, [glow])
    } else {
      polygons.delete(key)
    }
    if (overlays.length && map) {
      map.remove(overlays)
    }
  }
}

/** 点亮面的呼吸动效：填充透明度在 0.38–0.62 间缓慢起伏。 */
function startBreathing() {
  if (breatheHandle !== undefined) {
    return
  }
  const startedAt = performance.now()
  const step = (now: number) => {
    const phase = (now - startedAt) / 2600
    const opacity = 0.38 + 0.24 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2))
    for (const overlay of breathing) {
      overlay.setOptions({ fillOpacity: opacity })
    }
    breatheHandle = requestAnimationFrame(step)
  }
  breatheHandle = requestAnimationFrame(step)
}

/** 照片墙和时间轴点卡片用：飞到某个地点。 */
function focus(lng: number, lat: number) {
  map?.setZoomAndCenter?.(10, [lng, lat])
}

defineExpose({ focus })

function cachedBoundary(spot: TravelSpot): Promise<Array<Array<[number, number]>>> {
  const cacheKey = spot.adcode || litKey(spot)
  const cached = boundaryCache.get(cacheKey)
  if (cached) {
    return cached
  }
  const pending = searchBoundary({
    adcode: spot.adcode,
    name: spot.district || spot.name,
    city: spot.city,
  })
  boundaryCache.set(cacheKey, pending)
  void pending.catch(() => boundaryCache.delete(cacheKey))
  return pending
}
</script>

<style scoped>
.travel-map {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border-radius: 14px;
  overflow: hidden;
}
</style>

<style>
.travel-pin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 2px 3px rgba(44, 42, 38, 0.25));
  pointer-events: none;
}

.travel-pin span {
  order: -1;
  margin-bottom: 3px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
  background: #fffcf7;
  color: #2c2a26;
  border: 1px solid #e5e1d8;
}

.travel-pin::after {
  content: '';
  width: 18px;
  height: 18px;
  transform: rotate(45deg);
  border-radius: 50% 50% 50% 0;
  margin-top: -8px;
}

.travel-pin.lit::after {
  background: radial-gradient(circle at 30% 30%, #ffd166, #f08c00);
  box-shadow: 0 0 12px 4px rgba(255, 106, 0, 0.75);
  animation: travel-pin-glow 2.2s ease-in-out infinite;
}

.travel-pin.wish::after {
  background: #c7c3ba;
}

@keyframes travel-pin-glow {
  0%,
  100% {
    box-shadow: 0 0 8px 2px rgba(255, 106, 0, 0.45);
  }
  50% {
    box-shadow: 0 0 16px 6px rgba(255, 106, 0, 0.9);
  }
}

.travel-map.picking {
  cursor: crosshair;
}
</style>
