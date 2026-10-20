import { defineStore } from 'pinia'
import {
  clearToken,
  fetchCurrentUser,
  getToken,
  login as loginApi,
  logout as logoutApi,
  setToken,
  type UserProfile,
} from '@our-pact/shared'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    profile: null as UserProfile | null,
  }),
  actions: {
    async login(username: string, password: string) {
      const result = await loginApi({ username, password })
      this.token = result.token
      setToken(result.token)
    },
    async loadProfile() {
      this.profile = await fetchCurrentUser()
    },
    async logout() {
      try {
        await logoutApi()
      } finally {
        this.token = ''
        this.profile = null
        clearToken()
      }
    },
  },
})
