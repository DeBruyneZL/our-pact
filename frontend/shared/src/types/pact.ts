/** open 可分享加菜；replied 已答复不可再改；withdrawn 已撤回；completed 可手机先吃 */
export type ActivityStatus = 'open' | 'replied' | 'withdrawn' | 'completed'

export interface DishCategory {
  id: number
  name: string
  sortOrder: number
}

export interface DishOptionValue {
  id: number
  label: string
  sortOrder: number
}

export interface DishOptionGroup {
  id: number
  name: string
  sortOrder: number
  values: DishOptionValue[]
}

export interface Dish {
  id: number
  categoryId: number
  name: string
  description: string
  /** 本地上传后的图片（data URL） */
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
  optionGroups: DishOptionGroup[]
}

export interface DishDraft {
  categoryId: number
  name: string
  description: string
  /** 本地上传后的图片（data URL） */
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
  optionGroups: Array<{
    id?: number
    name: string
    values: Array<{ id?: number; label: string }>
  }>
}

export interface GuestUser {
  id: number
  name: string
  createdAt: string
  activityCount: number
}

export interface ActivityItemOption {
  id: number
  groupId: number | null
  valueId: number | null
  groupName: string
  optionLabel: string
}

export interface ActivityItem {
  id: number
  dishId: number | null
  dishName: string
  note: string | null
  options: ActivityItemOption[]
  addedByUserId: number
  addedByUserName: string
}

export interface ActivityPhoto {
  id: number
  userId: number
  userName: string
  imageDataUrl: string
  createdAt: string
}

export interface Activity {
  id: number
  shareCode: string
  userId: number
  userName: string
  scheduledAt: string
  status: ActivityStatus
  createdAt: string
  repliedAt: string | null
  replyNote: string | null
  withdrawnAt: string | null
  completedAt: string | null
  participantIds: number[]
  items: ActivityItem[]
  photos: ActivityPhoto[]
}

export interface ActivitySubmitItem {
  dishId: number
  note?: string
  options?: Array<{ groupId: number; valueId: number; groupName?: string; optionLabel?: string }>
  /** 菜单改走服务端后，活动快照直接带上菜名 */
  dishName?: string
}

export interface AdminNotice {
  id: number
  type: 'withdrawn'
  activityId: number
  message: string
  createdAt: string
  read: boolean
}
