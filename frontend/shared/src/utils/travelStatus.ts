import type { TravelStatus } from '../types/travel'

/** 给用户看的旅行地点状态。内部取值仍是 wish / lit，与后端 BaseEnum 对齐。 */
const TRAVEL_STATUS_LABEL: Record<TravelStatus, string> = {
  wish: '想去',
  lit: '已点亮',
}

export function travelStatusLabel(status: TravelStatus): string {
  return TRAVEL_STATUS_LABEL[status]
}
