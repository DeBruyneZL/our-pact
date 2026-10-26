import { http } from '../request'
import type { PageQuery, PageResult } from '../types'
import type { Activity, ActivityStatus, AdminNotice } from '../types/pact'

export interface ActivityPageQuery extends PageQuery {
  status?: ActivityStatus | ''
}

/** 管理端分页查看全部活动。 */
export function pageManageActivities(query: ActivityPageQuery): Promise<PageResult<Activity>> {
  return http.post<PageResult<Activity>>('/activity/manage/page', query)
}

/** 管理员答复。答复不是审批。 */
export function replyActivity(id: number, replyNote: string): Promise<Activity> {
  return http.post<Activity>(`/activity/${id}/reply`, { replyNote })
}

/** 管理员删除活动。 */
export function deleteActivity(id: number): Promise<void> {
  return http.post<void>(`/activity/${id}/delete`)
}

/** 撤回通知。 */
export function listActivityNotices(): Promise<AdminNotice[]> {
  return http.get<AdminNotice[]>('/activity/notices')
}

/** 把撤回通知标成已读。 */
export function readActivityNotice(id: number): Promise<void> {
  return http.post<void>(`/activity/notices/${id}/read`)
}
