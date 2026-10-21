import { defineStore } from 'pinia'
import {
  clearToken,
  fetchCurrentUser,
  getToken,
  logout as logoutApi,
  updateProfile,
  uploadAvatar,
  type UserProfile,
} from '@our-pact/shared'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    profile: null as UserProfile | null,
  }),
  getters: {
    displayName(state): string {
      return state.profile?.nickname || state.profile?.username || '用户'
    },
    isSuperAdmin(state): boolean {
      return Boolean(state.profile?.superAdmin)
    },
  },
  actions: {
    syncToken() {
      this.token = getToken()
    },
    async loadProfile() {
      this.profile = await fetchCurrentUser()
    },
    async ensureProfile() {
      this.syncToken()
      if (this.profile || !this.token) {
        return
      }
      await this.loadProfile()
    },
    async saveProfile(nickname: string, phone: string) {
      this.profile = await updateProfile({ nickname, phone })
    },
    async changeAvatar(file: File) {
      this.profile = await uploadAvatar(file)
    },
    async logout() {
      try {
        if (this.token) {
          await logoutApi()
        }
      } finally {
        this.token = ''
        this.profile = null
        clearToken()
      }
    },
  },
})
