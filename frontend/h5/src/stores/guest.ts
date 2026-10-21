import { defineStore } from 'pinia'
import { pactApi, type GuestUser } from '@our-pact/shared'

const STORAGE_KEY = 'our-pact.guestUserId'

export const useGuestStore = defineStore('guest', {
  state: () => ({
    user: null as GuestUser | null,
    loading: false,
  }),
  actions: {
    async hydrate() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        this.user = null
        return
      }
      this.loading = true
      try {
        this.user = await pactApi.getUser(Number(raw))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
        this.user = null
      } finally {
        this.loading = false
      }
    },
    async saveName(name: string) {
      const trimmed = name.trim()
      if (!trimmed) {
        throw new Error('请输入账号名')
      }
      if (this.user) {
        this.user = await pactApi.updateUser(this.user.id, trimmed)
      } else {
        this.user = await pactApi.createUser(trimmed)
      }
      localStorage.setItem(STORAGE_KEY, String(this.user.id))
      return this.user
    },
  },
})
