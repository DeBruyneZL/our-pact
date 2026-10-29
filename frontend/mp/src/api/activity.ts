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
  /** 不填时后端按「谁发起的几月几号的小聚」生成默认名。 */
  name?: string
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

export function updateActivityPeople(id: number, peopleCount: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/people`, { peopleCount })
}

export function leaveActivity(id: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/leave`)
}

/** 管理端：全部活动分页。管理员看待确认时传 status=open。 */
export function pageManageActivities(status?: ActivityStatus): Promise<ActivityPage> {
  return http.post<ActivityPage>('/activity/manage/page', { pageNum: 1, pageSize: 50, status })
}

/** 管理员答复待确认活动。 */
export function replyActivity(id: number, replyNote: string): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/reply`, { replyNote })
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
