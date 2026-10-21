import { http } from '../request'
import type { LoginPayload, LoginResult, ProfileUpdatePayload, UserProfile } from '../types'

/** 用户名或手机号登录。 */
export function login(payload: LoginPayload): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/login', payload)
}

/** 读取当前登录用户，对应后端 GET /api/auth/me。 */
export function fetchCurrentUser(): Promise<UserProfile> {
  return http.get<UserProfile>('/auth/me')
}

/** 修改昵称和手机号。 */
export function updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
  return http.post<UserProfile>('/auth/profile', payload)
}

/** 上传头像。不要手动设置 Content-Type，否则会丢掉表单边界。 */
export function uploadAvatar(file: File): Promise<UserProfile> {
  const form = new FormData()
  form.append('file', file)
  return http.postForm<UserProfile>('/auth/avatar', form)
}

/** 注销当前令牌。 */
export function logout(): Promise<null> {
  return http.post<null>('/auth/logout')
}
