export { http, request } from './request'
export { fetchCurrentUser, login, logout, updateProfile, uploadAvatar } from './api/auth'
export {
  AVATAR_MAX_BYTES,
  PHONE_PATTERN,
  adminHomeUrl,
  assertAvatarFile,
  clearToken,
  consumeHandoffToken,
  formatDateTime,
  getToken,
  goH5,
  goLogin,
  h5HomeUrl,
  maskPhone,
  portalUrl,
  setToken,
  unifiedLoginUrl,
} from './utils'
export type { ApiResult, LoginPayload, LoginResult, PageQuery, PageResult, ProfileUpdatePayload, UserProfile } from './types'
