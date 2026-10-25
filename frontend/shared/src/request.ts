import axios, { type AxiosResponse, isAxiosError } from 'axios'
import type { ApiResult } from './types'
import { goLogin } from './utils/portal'
import { clearToken, getToken } from './utils/token'

/** Web 管理端的 axios 实例，开发时由 Vite 把 /api 转到 8080。 */
export const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

function isAuthEntry(url?: string) {
  return Boolean(url && (url.includes('/auth/login') || url.includes('/auth/logout')))
}

function onUnauthorized(url?: string) {
  clearToken()
  const path = window.location.pathname
  if (isAuthEntry(url) || path === '/login' || path.endsWith('/login')) {
    return
  }
  goLogin()
}

function handleBody<T>(body: ApiResult<T>, url?: string): T {
  if (body.code === 401) {
    onUnauthorized(url)
    throw new Error(body.message || '未登录或登录已过期')
  }
  if (body.code !== 0) {
    throw new Error(body.message || '请求失败')
  }
  return body.data
}

function readErrorMessage(error: unknown, url?: string): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as ApiResult<unknown> | undefined
    if (error.response?.status === 401 || body?.code === 401) {
      onUnauthorized(url || error.config?.url)
    }
    if (body?.message) {
      return body.message
    }
    return '网络异常，请确认后端已启动'
  }
  if (error instanceof Error) {
    return error.message
  }
  return '网络异常'
}

async function unwrap<T>(promise: Promise<AxiosResponse<ApiResult<T>>>): Promise<T> {
  try {
    const response = await promise
    return handleBody(response.data, response.config.url)
  } catch (error) {
    const url = isAxiosError(error) ? error.config?.url : undefined
    throw new Error(readErrorMessage(error, url))
  }
}

export const http = {
  get<T>(url: string): Promise<T> {
    return unwrap<T>(request.get<ApiResult<T>>(url))
  },
  post<T>(url: string, data?: unknown): Promise<T> {
    return unwrap<T>(request.post<ApiResult<T>>(url, data))
  },
  postForm<T>(url: string, data: FormData): Promise<T> {
    return unwrap<T>(request.post<ApiResult<T>>(url, data))
  },
}
