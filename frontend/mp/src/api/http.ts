import { API_BASE_URL } from '@/config'
import { clearToken, getToken } from '@/utils/token'

interface ApiResult<T> {
  code: number
  message: string
  data: T
}

type UnauthorizedCallback = () => Promise<void>

/** 401 时由登录 store 注册的自愈回调：静默重登后重试一次。 */
let onUnauthorized: UnauthorizedCallback | null = null
/** 多个请求同时 401 时只清一次令牌、只登录一次。 */
let recovering: Promise<void> | null = null

export function setUnauthorizedCallback(callback: UnauthorizedCallback): void {
  onUnauthorized = callback
}

function recoverLogin(): Promise<void> {
  if (recovering) {
    return recovering
  }
  clearToken()
  const login = onUnauthorized
  if (!login) {
    return Promise.reject(new Error('未登录或登录已过期'))
  }
  recovering = login().finally(() => {
    recovering = null
  })
  return recovering
}

function isUnauthorized(statusCode: number, body: ApiResult<unknown> | null): boolean {
  if (statusCode === 401) {
    return true
  }
  return Boolean(body && body.code === 401)
}

function request<T>(method: 'GET' | 'POST', url: string, data: unknown, retried: boolean): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const token = getToken()
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: token ? { Authorization: token } : {},
      success: (res) => {
        const body = (res.data || null) as ApiResult<T> | null
        if (isUnauthorized(res.statusCode || 0, body) && !retried && onUnauthorized) {
          recoverLogin()
            .then(() => request<T>(method, url, data, true))
            .then(resolve, reject)
          return
        }
        if (!body || typeof body.code !== 'number') {
          reject(new Error('网络异常，请确认后端已启动'))
          return
        }
        if (body.code === 0) {
          resolve(body.data)
          return
        }
        reject(new Error(body.message || '请求失败'))
      },
      fail: (error) => reject(new Error(error.errMsg || '网络异常，请确认后端已启动')),
    })
  })
}

export const http = {
  get<T>(url: string): Promise<T> {
    return request<T>('GET', url, undefined, false)
  },
  post<T>(url: string, data?: unknown): Promise<T> {
    return request<T>('POST', url, data, false)
  },
}
