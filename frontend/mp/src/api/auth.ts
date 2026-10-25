import type { LoginResult, ProfileUpdatePayload, UserProfile } from '@our-pact/shared'
import { API_BASE_URL } from '@/config'
import { getToken } from '@/utils/token'
import { http } from './http'

/** 小程序静默登录：wx.login 的 code 换 token，未注册自动开户。 */
export function wxappLogin(code: string): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/wxapp', { code })
}

/** 读取当前登录用户，对应后端 GET /api/auth/me。 */
export function fetchCurrentUser(): Promise<UserProfile> {
  return http.get<UserProfile>('/auth/me')
}

/** 修改昵称和手机号。 */
export function updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
  return http.post<UserProfile>('/auth/profile', payload)
}

/** 注销当前令牌。 */
export function logout(): Promise<null> {
  return http.post<null>('/auth/logout')
}

/** uni.uploadFile 上传头像，对应后端 POST /api/auth/avatar。 */
export function uploadAvatar(filePath: string): Promise<UserProfile> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/auth/avatar`,
      filePath,
      name: 'file',
      header: { Authorization: getToken() },
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as { code: number; message: string; data: UserProfile }
          if (body.code === 0) {
            resolve(body.data)
          } else {
            reject(new Error(body.message || '头像上传失败'))
          }
        } catch {
          reject(new Error('网络异常，请确认后端已启动'))
        }
      },
      fail: () => reject(new Error('网络异常，请确认后端已启动')),
    })
  })
}
