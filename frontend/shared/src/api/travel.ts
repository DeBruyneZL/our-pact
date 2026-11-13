import { http } from '../request'
import type { TravelFoodPayload, TravelSavePayload, TravelSpot, TravelStats, TravelUpdatePayload } from '../types/travel'

/** 添加地点。直接点亮时必须带旅行时间。 */
export function addTravelSpot(payload: TravelSavePayload): Promise<TravelSpot> {
  return http.post<TravelSpot>('/travels/add', payload)
}

/** 把想去的地点点亮。 */
export function lightTravelSpot(id: number, visitedOn: string): Promise<TravelSpot> {
  return http.post<TravelSpot>(`/travels/${id}/light`, { visitedOn })
}

/** 改名称、旅行时间和随记。 */
export function updateTravelSpot(id: number, payload: TravelUpdatePayload): Promise<TravelSpot> {
  return http.post<TravelSpot>(`/travels/${id}/update`, payload)
}

/** 上传地点照片，替换旧照片。 */
export function uploadTravelSpotPhoto(id: number, file: File): Promise<TravelSpot> {
  const form = new FormData()
  form.append('file', file)
  return http.postForm<TravelSpot>(`/travels/${id}/photo`, form)
}

/** 取消地点，连同美食记录一起删。 */
export function deleteTravelSpot(id: number): Promise<void> {
  return http.post<void>(`/travels/${id}/delete`)
}

/** 全量地点，给地图和照片墙渲染。 */
export function listTravelSpots(): Promise<TravelSpot[]> {
  return http.get<TravelSpot[]>('/travels/list')
}

/** 点亮统计。 */
export function getTravelStats(): Promise<TravelStats> {
  return http.get<TravelStats>('/travels/stats')
}

/** 在地点下添加美食记录。 */
export function addTravelFood(spotId: number, payload: TravelFoodPayload): Promise<TravelSpot> {
  return http.post<TravelSpot>(`/travels/${spotId}/foods/add`, payload)
}

/** 上传美食照片，替换旧照片。 */
export function uploadTravelFoodPhoto(foodId: number, file: File): Promise<TravelSpot> {
  const form = new FormData()
  form.append('file', file)
  return http.postForm<TravelSpot>(`/travels/foods/${foodId}/photo`, form)
}

/** 删除一条美食记录。 */
export function deleteTravelFood(foodId: number): Promise<void> {
  return http.post<void>(`/travels/foods/${foodId}/delete`)
}
