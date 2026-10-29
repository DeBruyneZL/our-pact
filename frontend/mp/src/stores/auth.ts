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

  const displayName = computed(() => profile.value?.nickname || profile.value?.username || '用户')
  const isSuperAdmin = computed(() => Boolean(profile.value?.superAdmin))
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
    pendingLogin = (async () => {
      const code = await wxLoginCode()
      const result = await wxappLogin(code)
      setToken(result.token)
      token.value = result.token
      profile.value = await fetchCurrentUser()
      loadedFor = result.token
    })().finally(() => {
      pendingLogin = null
    })
    return pendingLogin
  }

  /**
   * 确认已登录；页面取数据前调用。
   * 必须等待 App 冷启动中的 silentLogin，避免带着过期 token 先打菜单接口。
   */
  async function ensureLogin(): Promise<void> {
    if (pendingLogin) {
      await pendingLogin
      return
    }
    // 无令牌，或冷启动尚未换新会话：先静默登录再请求业务接口
    if (!getToken() || !profile.value) {
      await silentLogin()
    }
  }

  async function loadProfile(force = false): Promise<void> {
    await ensureLogin()
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
    profile.value = null
    loadedFor = ''
    await silentLogin()
  })

  return {
    token,
    profile,
    displayName,
    isSuperAdmin,
    silentLogin,
    ensureLogin,
    loadProfile,
    logout,
  }
})
