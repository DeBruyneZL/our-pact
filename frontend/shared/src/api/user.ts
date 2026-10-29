import { http } from '../request'
import type { PageQuery, PageResult, UserProfile } from '../types'

export interface UserPageQuery extends PageQuery {
  keyword?: string
}

/** 管理端分页查询登录用户。 */
export function pageUsers(query: UserPageQuery): Promise<PageResult<UserProfile>> {
  return http.post<PageResult<UserProfile>>('/user/page', query)
}

/** 设置或取消超级管理员。 */
export function updateUserAdmin(id: number, superAdmin: boolean): Promise<UserProfile> {
  return http.post<UserProfile>(`/user/${id}/admin`, { superAdmin })
}
