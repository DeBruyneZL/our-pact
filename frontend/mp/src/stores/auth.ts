import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { UserProfile } from '@our-pact/shared'
import { fetchCurrentUser, logout as logoutApi, wxappLogin } from '@/api/auth'
import { setUnauthorizedCallback } from '@/api/http'
import { clearToken, getToken, setToken } from '@/utils/token'

/** 小程序登录态：冷启动静默登录，token 过期由请求层 401 自愈。 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken())
  const profile = ref<UserProfile | null>(null)
  let loadedFor = ''
  let logging = false

  const displayName = computed(() => profile.value?.nickname || profile.value?.username || '用户')
  /** 进行中的登录。并发调用共用这一次，避免后到的请求拿不到新令牌。 */
  let pendingLogin: Promise<void> | null = null

  function wxLoginCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (res) => {
          if (res.code) {
            resolve(res.code)
          } else {
            reject(new Error('微信登录失败，未获取到凭证'))
          }
        },
        fail: () => reject(new Error('微信登录失败')),
      })
    })
  }

  /** 静默登录：wx.login 换 code，后端换 token，用户无感知。 */
  function silentLogin(): Promise<void> {
    if (pendingLogin) {
      return pendingLogin
    }
    logging = true
    pendingLogin = (async () => {
      const code = await wxLoginCode()
      const result = await wxappLogin(code)
      setToken(result.token)
      token.value = result.token
      profile.value = await fetchCurrentUser()
      loadedFor = result.token
    })().finally(() => {
      logging = false
      pendingLogin = null
    })
    return pendingLogin
  }

  /** 确认已登录；页面取数据前调用。 */
  async function ensureLogin(): Promise<void> {
    if (!getToken()) {
      await silentLogin()
    }
  }

  async function loadProfile(force = false): Promise<void> {
    if (!force && profile.value && loadedFor === getToken()) {
      return
    }
    profile.value = await fetchCurrentUser()
    loadedFor = getToken()
  }

  async function logout(): Promise<void> {
    try {
      if (getToken()) {
        await logoutApi()
      }
    } finally {
      clearToken()
      token.value = ''
      profile.value = null
      loadedFor = ''
    }
  }

  setUnauthorizedCallback(async () => {
    clearToken()
    token.value = ''
    await silentLogin()
  })

  return {
    token,
    profile,
    displayName,
    silentLogin,
    ensureLogin,
    loadProfile,
    logout,
  }
})
