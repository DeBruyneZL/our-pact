import { http } from '../request'
import type { LoginPayload, LoginResult, UserProfile } from '../types'

/** 账号密码登录。 */
export function login(payload: LoginPayload): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/login', payload)
}

/** 读取当前登录用户，对应后端 GET /api/auth/me。 */
export function fetchCurrentUser(): Promise<UserProfile> {
  return http.get<UserProfile>('/auth/me')
}

/** 注销当前令牌。 */
export function logout(): Promise<null> {
  return http.post<null>('/auth/logout')
}
