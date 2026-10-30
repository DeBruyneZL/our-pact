import type { ShopProfile } from '@our-pact/shared'
import { http } from './http'

/** 店铺介绍，与 shared/api/shop 的端点保持一致。 */
export function getShopProfile(): Promise<ShopProfile> {
  return http.get<ShopProfile>('/shop')
}
