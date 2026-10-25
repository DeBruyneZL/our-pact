import { setToken } from './token'

/** 管理端登录页。 */
export function unifiedLoginUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/login'
  }
  return '/login'
}

/** 管理端首页。 */
export function adminHomeUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/dishes'
  }
  return '/dishes'
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

/** 打开管理端登录页。 */
export function goLogin(): void {
  window.location.assign(unifiedLoginUrl())
}
