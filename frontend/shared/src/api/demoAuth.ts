import { setToken } from '../utils/token'
import type { LoginResult, UserProfile } from '../types'

export const DEMO_TOKEN = 'our-pact-demo-token'

export const DEMO_PROFILE: UserProfile = {
  id: 1,
  username: 'admin',
  nickname: '管理员',
  phone: '13800000000',
  avatar: null,
  superAdmin: true,
  createTime: '2026-01-01T00:00:00',
}

export function isDemoToken(token: string | null | undefined) {
  return token === DEMO_TOKEN
}

/** 无后端时进入本地演示。 */
export function enterDemoSession(): LoginResult {
  setToken(DEMO_TOKEN)
  return {
    token: DEMO_TOKEN,
    userId: DEMO_PROFILE.id,
    username: DEMO_PROFILE.username,
    nickname: DEMO_PROFILE.nickname,
    phone: DEMO_PROFILE.phone,
    avatar: DEMO_PROFILE.avatar,
    superAdmin: DEMO_PROFILE.superAdmin,
  }
}
