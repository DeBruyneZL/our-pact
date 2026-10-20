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
  username: string
  password: string
}

export interface LoginResult {
  token: string
  userId: number
  username: string
  nickname: string
}

export interface UserProfile {
  id: number
  username: string
  nickname: string
  createTime: string
}
