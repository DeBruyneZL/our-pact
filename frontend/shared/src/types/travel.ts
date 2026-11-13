/** wish 想去，提前标记的愿望；lit 已点亮，真的去过并补上了照片和时间 */
export type TravelStatus = 'wish' | 'lit'

export interface TravelFood {
  id: number
  spotId: number
  shopName: string | null
  dishName: string
  photoUrl: string | null
  note: string | null
  createdAt: string
}

export interface TravelSpot {
  id: number
  name: string
  province: string | null
  city: string | null
  district: string | null
  /** 区县行政区划编码，点亮边界用这个查 */
  adcode: string | null
  cityAdcode: string | null
  provinceAdcode: string | null
  lng: number
  lat: number
  photoUrl: string | null
  status: TravelStatus
  /** 旅行时间，想去的地点还没有 */
  visitedOn: string | null
  note: string | null
  createdAt: string
  foods: TravelFood[]
}

export interface TravelStats {
  wishCount: number
  litCount: number
  districtCount: number
  cityCount: number
  provinceCount: number
}

export interface TravelSavePayload {
  name: string
  province?: string
  city?: string
  district?: string
  adcode?: string
  cityAdcode?: string
  provinceAdcode?: string
  lng: number
  lat: number
  status: TravelStatus
  visitedOn?: string
  note?: string
}

export interface TravelUpdatePayload {
  name?: string
  visitedOn?: string
  note?: string
  province?: string
  city?: string
  district?: string
  adcode?: string
  cityAdcode?: string
  provinceAdcode?: string
}

export interface TravelFoodPayload {
  shopName?: string
  dishName: string
  note?: string
}
