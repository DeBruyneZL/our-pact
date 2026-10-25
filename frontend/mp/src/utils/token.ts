const TOKEN_KEY = 'our-pact-token'

/** 小程序端令牌存取，与 Web 管理端的 key 保持一致。 */
export function getToken(): string {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  uni.setStorageSync(TOKEN_KEY, token)
}

export function clearToken(): void {
  uni.removeStorageSync(TOKEN_KEY)
}
