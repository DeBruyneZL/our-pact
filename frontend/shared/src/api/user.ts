import { http } from '../request'
import type { PageQuery, PageResult, UserProfile } from '../types'

export interface UserPageQuery extends PageQuery {
  keyword?: string
}

/** 管理端分页查询登录用户。 */
export function pageUsers(query: UserPageQuery): Promise<PageResult<UserProfile>> {
  return http.post<PageResult<UserProfile>>('/user/page', query)
}
