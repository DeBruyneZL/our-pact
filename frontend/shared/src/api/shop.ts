import { http } from '../request'
import type { ShopProfile } from '../types/pact'

export interface ShopImageResult {
  url: string
}

/** 店铺介绍。管理端维护，小程序首页展示。 */
export const shopApi = {
  get(): Promise<ShopProfile> {
    return http.get('/shop')
  },

  save(profile: ShopProfile): Promise<ShopProfile> {
    return http.post('/shop', profile)
  },

  uploadImage(file: File): Promise<ShopImageResult> {
    const data = new FormData()
    data.append('file', file)
    return http.postForm('/shop/image', data)
  },
}
