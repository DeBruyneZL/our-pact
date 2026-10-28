/** open 可分享、可加菜、发起人可改；replied 已答复，不能改名称时间和地点，也不能删菜，仍可加菜和撤回；withdrawn 已撤回；completed 可上传手机先吃的照片 */
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
  /** 活动里可以重复点，并挂在点单人下面。 */
  allowRepeat?: boolean
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
  allowRepeat?: boolean
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
  dishImageUrl?: string | null
  note: string | null
  options: ActivityItemOption[]
  addedByUserId: number
  addedByUserName: string
  /** 允许重复添加时，这道菜挂在点单人下面。 */
  allowRepeat?: boolean
  addedByUserAvatar?: string | null
}

export interface ActivityPhoto {
  id: number
  userId: number
  userName: string
  imageDataUrl?: string
  url?: string | null
  createdAt: string
}

export interface ActivityParticipant {
  id: number
  name: string
  avatar?: string | null
  owner?: boolean
  peopleCount: number
}

export interface Activity {
  id: number
  name: string
  shareCode: string
  userId: number
  userName: string
  scheduledAt: string
  location: string
  peopleCount: number
  totalPeople: number
  status: ActivityStatus
  createdAt: string
  repliedAt: string | null
  replyNote: string | null
  withdrawnAt: string | null
  completedAt: string | null
  participantIds: number[]
  participants: ActivityParticipant[]
  items: ActivityItem[]
  photos: ActivityPhoto[]
  owner?: boolean
  canAdd?: boolean
  canEdit?: boolean
  canWithdraw?: boolean
  canComplete?: boolean
  canUpload?: boolean
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
