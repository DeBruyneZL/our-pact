import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  clearToken,
  fetchCurrentUser,
  getToken,
  logout as logoutApi,
  updateProfile,
  uploadAvatar,
  type UserProfile,
} from '@our-pact/shared'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken())
  const profile = ref<UserProfile | null>(null)
  let loadedFor = ''

  const displayName = computed(() => profile.value?.nickname || profile.value?.username || '用户')
  const isSuperAdmin = computed(() => Boolean(profile.value?.superAdmin))

  function syncToken() {
    token.value = getToken()
  }

  async function loadProfile() {
    profile.value = await fetchCurrentUser()
    loadedFor = getToken()
  }

  async function ensureProfile() {
    syncToken()
    if (!token.value) {
      profile.value = null
      loadedFor = ''
      return
    }
    if (profile.value && loadedFor === token.value) {
      return
    }
    await loadProfile()
  }

  async function saveProfile(nickname: string, phone: string) {
    profile.value = await updateProfile({ nickname, phone })
    loadedFor = getToken()
  }

  async function changeAvatar(file: File) {
    profile.value = await uploadAvatar(file)
    loadedFor = getToken()
  }

  async function logout() {
    try {
      if (token.value) {
        await logoutApi()
      }
    } finally {
      token.value = ''
      profile.value = null
      loadedFor = ''
      clearToken()
    }
  }

  return {
    token,
    profile,
    displayName,
    isSuperAdmin,
    syncToken,
    loadProfile,
    ensureProfile,
    saveProfile,
    changeAvatar,
    logout,
  }
})
