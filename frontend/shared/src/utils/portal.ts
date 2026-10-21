import { getToken, setToken } from './token'

/** 统一登录入口。开发时 web 在 3000，生产走站点根路径。 */
export function unifiedLoginUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/login'
  }
  return '/login'
}

/** 管理端入口。 */
export function adminHomeUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/home'
  }
  return '/home'
}

/** 超管选择端页面。开发跨端口时附带 token。 */
export function portalUrl(token?: string): string {
  const value = token || getToken()
  const base = import.meta.env.DEV ? 'http://localhost:3000/portal' : '/portal'
  if (!value || !import.meta.env.DEV) {
    return base
  }
  return `${base}?token=${encodeURIComponent(value)}`
}

/**
 * 用户端入口。跨端口开发时带上 token，生产同域靠 localStorage 共享。
 */
export function h5HomeUrl(token?: string): string {
  const value = token || getToken()
  const base = import.meta.env.DEV ? 'http://localhost:3001/home' : '/h5/home'
  if (!value || !import.meta.env.DEV) {
    return base
  }
  return `${base}?token=${encodeURIComponent(value)}`
}

/** 从地址栏接手一次性 token，并清掉 query，避免泄露。 */
export function consumeHandoffToken(): void {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (!token) {
    return
  }
  setToken(token)
  params.delete('token')
  const query = params.toString()
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', next)
}

/** 离开当前端，打开用户端。 */
export function goH5(token?: string): void {
  window.location.assign(h5HomeUrl(token))
}

/** 离开当前端，打开统一登录。 */
export function goLogin(): void {
  window.location.assign(unifiedLoginUrl())
}
