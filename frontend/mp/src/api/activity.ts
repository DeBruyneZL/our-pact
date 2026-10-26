import type { Activity, ActivityStatus } from '@our-pact/shared'
import { API_BASE_URL } from '@/config'
import { http } from '@/api/http'
import { getToken } from '@/utils/token'

export interface ActivityItemPayload {
  dishId: number
  note?: string
  options?: Array<{ groupId: number; valueId: number }>
}

export interface ActivitySavePayload {
  name: string
  scheduledAt: string
  location: string
  peopleCount?: number
  items?: ActivityItemPayload[]
}

export interface ActivityUpdatePayload {
  name: string
  scheduledAt: string
  location: string
}

interface ActivityPage {
  list: Activity[]
  total: number
}

/** 我发起或参与的活动。 */
export function pageMyActivities(status?: ActivityStatus): Promise<ActivityPage> {
  return http.post<ActivityPage>('/activity/page', { pageNum: 1, pageSize: 50, status })
}

export function createActivity(payload: ActivitySavePayload): Promise<Activity> {
  return http.post<Activity>('/activity', payload)
}

export function getActivity(id: number): Promise<Activity> {
  return http.get<Activity>(`/activity/${id}`)
}

export function getActivityByCode(shareCode: string): Promise<Activity> {
  return http.get<Activity>(`/activity/code/${encodeURIComponent(shareCode)}`)
}

export function joinActivity(shareCode: string, peopleCount: number): Promise<Activity> {
  return http.post<Activity>(`/activity/code/${encodeURIComponent(shareCode)}/join`, { peopleCount })
}

export function updateActivity(id: number, payload: ActivityUpdatePayload): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/update`, payload)
}

export function addActivityItems(id: number, items: ActivityItemPayload[]): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/items`, { items })
}

export function deleteActivityItem(activityId: number, itemId: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${activityId}/items/${itemId}/delete`)
}

export function withdrawActivity(id: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/withdraw`)
}

export function completeActivity(id: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/complete`)
}

/** 完成后上传一张照片。 */
export function uploadActivityPhoto(activityId: number, filePath: string): Promise<Activity> {
  return new Promise((resolve, reject) => {
    const token = getToken()
    uni.uploadFile({
      url: `${API_BASE_URL}/activity/${activityId}/photos`,
      filePath,
      name: 'file',
      header: token ? { Authorization: token } : {},
      success: (res) => {
        let body: { code?: number; message?: string; data?: Activity }
        try {
          body = JSON.parse(res.data) as { code?: number; message?: string; data?: Activity }
        } catch {
          reject(new Error('上传失败'))
          return
        }
        if (body.code !== 0 || !body.data) {
          reject(new Error(body.message || '上传失败'))
          return
        }
        resolve(body.data)
      },
      fail: () => reject(new Error('上传失败')),
    })
  })
}
