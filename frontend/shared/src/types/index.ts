export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export interface PageQuery {
  pageNum?: number
  pageSize?: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

export interface LoginPayload {
  account: string
  password: string
}

export interface LoginResult {
  token: string
  userId: number
  username: string
  nickname: string
  phone: string | null
  avatar: string | null
  superAdmin: boolean
}

export interface UserProfile {
  id: number
  username: string
  nickname: string
  phone: string | null
  avatar: string | null
  superAdmin: boolean
  createTime: string
  /** 参加过的活动次数（发起 + 加入） */
  activityCount?: number
  /** 点过的菜数量 */
  dishCount?: number
}

export interface ProfileUpdatePayload {
  nickname: string
  phone: string
}
