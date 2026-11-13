import AMapLoader from '@amap/amap-jsapi-loader'

// 高德开放平台 Key 与安全密钥，来自环境变量 VITE_AMAP_KEY / VITE_AMAP_SECURITY_CODE（放 .env.local，不进仓库）。
// 部署时记得在高德控制台把正式域名加进 Key 白名单。
const KEY = import.meta.env.VITE_AMAP_KEY
const SECURITY_JS_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE

/** 2.0 矢量底图，只加载旅行记录需要的服务插件。 */
const AMAP_PLUGINS = ['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.DistrictSearch', 'AMap.DistrictLayer']

const AMAP_TIMEOUT_MS = 8000

/* 高德 JS API 没有官方 d.ts，下面只声明旅行模块用到的最小接口。 */

export interface AMapLngLatLike {
  lng: number
  lat: number
}

/** 地图点选的结果，打开添加弹窗时作为初始值。 */
export interface TravelPick {
  lng: number
  lat: number
  name?: string
  province?: string
  city?: string
  district?: string
  adcode?: string
}

export interface AMapOverlay {
  on(event: string, handler: (e?: unknown) => void): void
  setMap?(map: AMapMap | null): void
}

export interface AMapMap {
  destroy(): void
  on(event: string, handler: (e: { lnglat: AMapLngLatLike }) => void): void
  add(overlay: unknown): void
  remove(overlay: unknown): void
  setBounds(bounds: unknown): void
  setLimitBounds(bounds: unknown): void
  setZoomAndCenter?(zoom: number, center: [number, number]): void
}

export interface AMapPoi {
  name: string
  pname?: string
  cityname?: string
  adname?: string
  adcode?: string
  location?: { lng: number; lat: number; getLng?: () => number; getLat?: () => number }
}

export interface AMapPlaceResult {
  poiList?: { pois: AMapPoi[] }
}

export interface AMapRegeoResult {
  regeocode?: {
    formattedAddress?: string
    addressComponent?: {
      province?: string
      city?: string | string[]
      district?: string
      adcode?: string
    }
  }
}

export interface AMapDistrictResult {
  districtList?: Array<{
    name?: string
    level?: string
    adcode?: string
    boundaries?: unknown
  }>
}

export interface AMapMapOptions {
  center?: [number, number]
  zoom?: number
  viewMode?: string
  mapStyle?: string
  /** 显示哪些地图元素：bg 底面，point 地名，road 路网，area 行政区 */
  features?: string[]
}

export interface AMapMarkerOptions {
  position: [number, number]
  content?: string
  offset?: [number, number] | unknown
  anchor?: string
  title?: string
  zIndex?: number
}

export interface AMapPolygonOptions {
  path: Array<[number, number]> | Array<Array<[number, number]>>
  fillColor?: string
  fillOpacity?: number
  strokeColor?: string
  strokeWeight?: number
  strokeOpacity?: number
  cursor?: string
  zIndex?: number
}

export interface AMapPolygon extends AMapOverlay {
  setOptions(options: Partial<AMapPolygonOptions>): void
}

export interface AMapCircle extends AMapOverlay {
  setOptions(options: Partial<AMapCircleOptions>): void
}

export interface AMapCircleOptions {
  center: [number, number]
  radius: number
  fillColor?: string
  fillOpacity?: number
  strokeColor?: string
  strokeWeight?: number
  strokeOpacity?: number
  zIndex?: number
}

export interface AMapNamespace {
  Map: new (container: HTMLElement, options: AMapMapOptions) => AMapMap
  Marker: new (options: AMapMarkerOptions) => AMapOverlay
  Polygon: new (options: AMapPolygonOptions) => AMapPolygon
  Circle: new (options: AMapCircleOptions) => AMapCircle
  Pixel: new (x: number, y: number) => unknown
  Geocoder: new (options?: { city?: string }) => {
    getAddress(lnglat: [number, number], callback: (status: string, result: AMapRegeoResult) => void): void
  }
  PlaceSearch: new (options: { city?: string; pageSize?: number; extensions?: string }) => {
    search(keyword: string, callback: (status: string, result: AMapPlaceResult) => void): void
  }
  DistrictSearch: new (options: { level?: string; subdistrict?: number; extensions?: string }) => {
    search(keyword: string, callback: (status: string, result: AMapDistrictResult) => void): void
  }
  Bounds: new (southWest: [number, number], northEast: [number, number]) => unknown
  DistrictLayer: {
    Country: new (options: {
      zIndex?: number
      SOC?: string
      depth?: number
      styles?: Record<string, unknown>
    }) => unknown
  }
}

declare global {
  interface Window {
    AMap?: AMapNamespace
    _AMapSecurityConfig?: { securityJsCode: string }
  }
}

function ensureSecurityConfig() {
  window._AMapSecurityConfig = {
    securityJsCode: SECURITY_JS_CODE,
  }
}

let pending: Promise<AMapNamespace> | null = null

/** 懒加载高德 JS API，重复调用拿到的是同一个实例。 */
export function loadMap(): Promise<AMapNamespace> {
  if (!KEY || !SECURITY_JS_CODE) {
    return Promise.reject(new Error('缺少高德密钥，请在 frontend/web/.env.local 配置 VITE_AMAP_KEY 和 VITE_AMAP_SECURITY_CODE'))
  }
  ensureSecurityConfig()
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }
  if (!pending) {
    pending = AMapLoader.load({
      key: KEY,
      version: '2.0',
      plugins: AMAP_PLUGINS,
    }) as Promise<AMapNamespace>
  }
  return pending
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label}超时，请重试`)), AMAP_TIMEOUT_MS)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

/** LngLat 实例或普通对象都读成 [经度, 纬度]。高德 2.0 覆盖物统一用这个格式。 */
export function toLngLat(source: unknown): [number, number] {
  const holder = source as { lng?: number; lat?: number; getLng?: () => number; getLat?: () => number }
  if (typeof holder?.getLng === 'function' && typeof holder?.getLat === 'function') {
    return [holder.getLng(), holder.getLat()]
  }
  return [Number(holder?.lng), Number(holder?.lat)]
}

/** 区县边界兼容 2.0 的点数组和旧版的折线字符串。 */
export function readBoundaries(boundaries: unknown): Array<Array<[number, number]>> {
  if (!Array.isArray(boundaries)) {
    return []
  }
  return boundaries
    .map((group) => {
      if (typeof group === 'string') {
        return group
          .split(';')
          .map((pair) => {
            const [lng, lat] = pair.split(',').map(Number)
            return [lng, lat] as [number, number]
          })
          .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))
      }
      if (Array.isArray(group)) {
        return group
          .map((item) => toLngLat(item))
          .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))
      }
      return null
    })
    .filter((path): path is Array<[number, number]> => Array.isArray(path) && path.length > 1)
}

const MUNICIPALITIES = new Set(['11', '12', '31', '50'])

/** 由区县编码推出省、市编码。直辖市的城市编码就是省级编码。 */
export function splitAdcode(adcode: string): { provinceAdcode: string; cityAdcode: string; adcode: string } {
  const code = String(adcode).trim()
  const provinceAdcode = `${code.slice(0, 2)}0000`
  if (MUNICIPALITIES.has(code.slice(0, 2))) {
    return { provinceAdcode, cityAdcode: provinceAdcode, adcode: code }
  }
  return { provinceAdcode, cityAdcode: `${code.slice(0, 4)}00`, adcode: code }
}

function levelOf(adcode: string): 'province' | 'city' | 'district' {
  if (adcode.endsWith('0000')) {
    return 'province'
  }
  if (adcode.endsWith('00')) {
    return 'city'
  }
  return 'district'
}

async function districtSearchOnce(keyword: string, level: string): Promise<Array<Array<[number, number]>>> {
  const amap = await loadMap()
  const search = new amap.DistrictSearch({ level, subdistrict: 0, extensions: 'all' })
  return withTimeout(
    new Promise<Array<Array<[number, number]>>>((resolve, reject) => {
      search.search(keyword, (status, result) => {
        const boundaries = result.districtList?.[0]?.boundaries
        const paths = boundaries ? readBoundaries(boundaries) : []
        if (status === 'complete' && paths.length) {
          resolve(paths)
          return
        }
        reject(new Error(`没有查到行政区划 ${keyword} 的边界`))
      })
    }),
    '行政区边界查询',
  )
}

/**
 * 按行政区划编码取边界。失败时再用区县名称兜底。
 */
export async function searchBoundary(options: {
  adcode?: string | null
  name?: string | null
  city?: string | null
}): Promise<Array<Array<[number, number]>>> {
  const adcode = options.adcode?.trim()
  if (adcode) {
    try {
      return await districtSearchOnce(adcode, levelOf(adcode))
    } catch {
      // 编码查不到再走名称
    }
  }
  const name = options.name?.trim()
  if (!name) {
    throw new Error('缺少行政区划编码和名称，无法取边界')
  }
  const city = options.city?.trim()
  const keywords = city && city !== name ? [`${city}${name}`, name] : [name]
  let lastError: unknown
  for (const keyword of keywords) {
    try {
      return await districtSearchOnce(keyword, 'district')
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('区县边界查询失败')
}

/** 坐标反查省市区和行政区划编码。有超时，避免一直挂住。 */
export async function reverseGeocode(lnglat: AMapLngLatLike): Promise<{
  province: string
  city: string
  district: string
  adcode: string
  address: string
}> {
  const amap = await loadMap()
  const geocoder = new amap.Geocoder()
  return withTimeout(
    new Promise((resolve, reject) => {
      geocoder.getAddress([lnglat.lng, lnglat.lat], (status, result) => {
        const component = result.regeocode?.addressComponent
        if (status === 'complete' && component?.adcode) {
          const city = typeof component.city === 'string' && component.city ? component.city : component.province || ''
          resolve({
            province: component.province || '',
            city,
            district: component.district || '',
            adcode: String(component.adcode),
            address: result.regeocode?.formattedAddress || '',
          })
          return
        }
        reject(new Error('没有查到这个位置属于哪个城市，换个位置试试'))
      })
    }),
    '逆地理编码',
  )
}

/** 按关键字搜地点。 */
export async function searchPlaces(keyword: string): Promise<AMapPoi[]> {
  const amap = await loadMap()
  const placeSearch = new amap.PlaceSearch({ pageSize: 8, extensions: 'base' })
  return withTimeout(
    new Promise((resolve, reject) => {
      placeSearch.search(keyword, (status, result) => {
        if (status === 'complete' && result.poiList?.pois.length) {
          resolve(
            result.poiList.pois.map((poi) => ({
              ...poi,
              location: poi.location
                ? { lng: toLngLat(poi.location)[0], lat: toLngLat(poi.location)[1] }
                : undefined,
            })),
          )
          return
        }
        reject(new Error('没有搜到相关地点'))
      })
    }),
    '地点搜索',
  )
}
