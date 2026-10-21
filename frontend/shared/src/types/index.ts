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
}

export interface ProfileUpdatePayload {
  nickname: string
  phone: string
}
