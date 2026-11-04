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
export function pageMyActivities(pageNum: number, pageSize: number, status?: ActivityStatus): Promise<ActivityPage> {
  return http.post<ActivityPage>('/activity/page', { pageNum, pageSize, status })
}

export function createActivity(payload: ActivitySavePayload): Promise<Activity> {
  return http.post<Activity>('/activity', payload)
}

export const OWN_OPEN_ACTIVITY_MESSAGE = '已有待确认的活动，请先撤回后再发起'

/** 自己发起的待确认活动还在时为 true。只看第一页，提交时后端仍会拦住。 */
export async function hasOwnOpenActivity(): Promise<boolean> {
  const page = await pageMyActivities(1, 20, 'open')
  return (page.list || []).some((item) => item.owner && item.status === 'open')
}

export function getActivity(id: number, shareCode?: string): Promise<Activity> {
  const code = shareCode ? `?code=${encodeURIComponent(shareCode)}` : ''
  return http.get<Activity>(`/activity/${id}${code}`)
}

export function joinActivity(id: number, peopleCount: number, shareCode?: string): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/join`, { peopleCount, shareCode: shareCode || undefined })
}

export function updateActivityPeople(id: number, peopleCount: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/people`, { peopleCount })
}

export function leaveActivity(id: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/leave`)
}

/** 管理端：全部活动分页。管理员看待确认时传 status=open。 */
export function pageManageActivities(pageNum: number, pageSize: number, status?: ActivityStatus): Promise<ActivityPage> {
  return http.post<ActivityPage>('/activity/manage/page', { pageNum, pageSize, status })
}

/** 管理员答复待确认活动。 */
export function replyActivity(id: number, replyNote: string): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/reply`, { replyNote })
}

/** 管理员驳回待确认活动。 */
export function rejectActivity(id: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/reject`)
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

/** 删除自己上传的活动照片。 */
export function deleteActivityPhoto(activityId: number, photoId: number): Promise<Activity> {
  return http.post<Activity>(`/activity/${activityId}/photos/${photoId}/delete`)
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
