import type {
  Activity,
  ActivityStatus,
  ActivitySubmitItem,
  AdminNotice,
  Dish,
  DishCategory,
  DishDraft,
  GuestUser,
} from '../types/pact'

const STORAGE_KEY = 'fanfou.mock.v2'

interface MockDb {
  nextId: number
  users: GuestUser[]
  categories: DishCategory[]
  dishes: Dish[]
  activities: Activity[]
  notices: AdminNotice[]
}

function nowIso() {
  return new Date().toISOString()
}

function shareCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function seed(): MockDb {
  const categories: DishCategory[] = [
    { id: 1, name: '热菜', sortOrder: 1 },
    { id: 2, name: '凉菜', sortOrder: 2 },
    { id: 3, name: '汤羹', sortOrder: 3 },
    { id: 4, name: '主食', sortOrder: 4 },
    { id: 5, name: '甜品', sortOrder: 5 },
  ]

  const dishes: Dish[] = [
    {
      id: 1,
      categoryId: 1,
      name: '番茄牛腩',
      description: '慢炖入味，适合周末家人围坐',
      imageUrl: null,
      isActive: true,
      sortOrder: 1,
      optionGroups: [
        {
          id: 1,
          name: '份量',
          sortOrder: 1,
          values: [
            { id: 1, label: '小份', sortOrder: 1 },
            { id: 2, label: '中份', sortOrder: 2 },
            { id: 3, label: '大份', sortOrder: 3 },
          ],
        },
      ],
    },
    {
      id: 2,
      categoryId: 2,
      name: '清炒时蔬',
      description: '当季绿叶，清爽解腻',
      imageUrl: null,
      isActive: true,
      sortOrder: 2,
      optionGroups: [],
    },
    {
      id: 3,
      categoryId: 1,
      name: '麻婆豆腐',
      description: '川味家常，可选辣度',
      imageUrl: null,
      isActive: true,
      sortOrder: 3,
      optionGroups: [
        {
          id: 2,
          name: '辣度',
          sortOrder: 1,
          values: [
            { id: 4, label: '微辣', sortOrder: 1 },
            { id: 5, label: '中辣', sortOrder: 2 },
            { id: 6, label: '特辣', sortOrder: 3 },
          ],
        },
        {
          id: 3,
          name: '豆腐',
          sortOrder: 2,
          values: [
            { id: 7, label: '嫩豆腐', sortOrder: 1 },
            { id: 8, label: '老豆腐', sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 4,
      categoryId: 1,
      name: '蒜蓉蒸虾',
      description: '鲜甜蒜香，少油',
      imageUrl: null,
      isActive: true,
      sortOrder: 4,
      optionGroups: [
        {
          id: 4,
          name: '熟度',
          sortOrder: 1,
          values: [
            { id: 9, label: '七分熟', sortOrder: 1 },
            { id: 10, label: '全熟', sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 5,
      categoryId: 5,
      name: '银耳莲子羹',
      description: '餐后甜品，温润',
      imageUrl: null,
      isActive: true,
      sortOrder: 5,
      optionGroups: [],
    },
  ]

  return {
    nextId: 100,
    users: [
      { id: 1, name: '小明', createdAt: nowIso(), activityCount: 0 },
      { id: 2, name: '阿花', createdAt: nowIso(), activityCount: 0 },
    ],
    categories,
    dishes,
    activities: [],
    notices: [],
  }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const db = seed()
      save(db)
      return db
    }
    const db = JSON.parse(raw) as MockDb
    if (!db.notices) db.notices = []
    if (!db.categories?.length) {
      db.categories = seed().categories
    }
    db.dishes = db.dishes.map((dish) => ({
      ...dish,
      categoryId: dish.categoryId || db.categories[0]?.id || 1,
    }))
    return db
  } catch {
    const db = seed()
    save(db)
    return db
  }
}

function save(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function allocId(db: MockDb) {
  const id = db.nextId
  db.nextId += 1
  return id
}

function withCounts(db: MockDb): GuestUser[] {
  return db.users.map((user) => ({
    ...user,
    activityCount: db.activities.filter(
      (item) => item.userId === user.id || item.participantIds.includes(user.id),
    ).length,
  }))
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 60)
  })
}

function mapDraftGroups(db: MockDb, groups: DishDraft['optionGroups']) {
  return groups
    .map((group, gi) => {
      const name = group.name.trim()
      if (!name) {
        return null
      }
      const values = (group.values || [])
        .map((value, vi) => {
          const label = value.label.trim()
          if (!label) {
            return null
          }
          return { id: allocId(db), label, sortOrder: vi }
        })
        .filter(Boolean) as Array<{ id: number; label: string; sortOrder: number }>
      if (values.length === 0) {
        return null
      }
      return { id: allocId(db), name, sortOrder: gi, values }
    })
    .filter(Boolean) as Dish['optionGroups']
}

function buildItems(
  db: MockDb,
  user: GuestUser,
  payloadItems: ActivitySubmitItem[],
): Activity['items'] {
  return payloadItems.map((item) => {
    const dish = db.dishes.find((entry) => entry.id === item.dishId && entry.isActive)
    if (!dish) {
      throw new Error('菜品不可用')
    }
    const options = (item.options || [])
      .map((selected) => {
        const group = dish.optionGroups.find((entry) => entry.id === selected.groupId)
        const value = group?.values.find((entry) => entry.id === selected.valueId)
        if (!group || !value) {
          return null
        }
        return {
          id: allocId(db),
          groupId: group.id,
          valueId: value.id,
          groupName: group.name,
          optionLabel: value.label,
        }
      })
      .filter(Boolean) as Activity['items'][number]['options']

    return {
      id: allocId(db),
      dishId: dish.id,
      dishName: dish.name,
      note: item.note?.trim() || null,
      options,
      addedByUserId: user.id,
      addedByUserName: user.name,
    }
  })
}

function canModify(activity: Activity) {
  return activity.status === 'open'
}

function isMember(activity: Activity, userId: number) {
  return activity.userId === userId || activity.participantIds.includes(userId)
}

/** 本地 mock：菜单 / 活动 / 访客用户，数据在 localStorage。 */
export const pactApi = {
  listCategories: async () => {
    const list = [...load().categories].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    return delay(list)
  },

  createCategory: async (payload: { name: string; sortOrder?: number }) => {
    const db = load()
    const name = payload.name.trim()
    if (!name) {
      throw new Error('分类名称不能为空')
    }
    if (db.categories.some((item) => item.name === name)) {
      throw new Error('分类名称已存在')
    }
    const category: DishCategory = {
      id: allocId(db),
      name,
      sortOrder: payload.sortOrder ?? db.categories.length + 1,
    }
    db.categories.push(category)
    save(db)
    return delay(category)
  },

  updateCategory: async (id: number, payload: { name: string; sortOrder?: number }) => {
    const db = load()
    const index = db.categories.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('分类不存在')
    }
    const name = payload.name.trim()
    if (!name) {
      throw new Error('分类名称不能为空')
    }
    if (db.categories.some((item) => item.name === name && item.id !== id)) {
      throw new Error('分类名称已存在')
    }
    db.categories[index] = {
      ...db.categories[index],
      name,
      sortOrder: payload.sortOrder ?? db.categories[index].sortOrder,
    }
    save(db)
    return delay(db.categories[index])
  },

  deleteCategory: async (id: number) => {
    const db = load()
    if (db.dishes.some((dish) => dish.categoryId === id)) {
      throw new Error('该分类下还有菜品，无法删除')
    }
    const next = db.categories.filter((item) => item.id !== id)
    if (next.length === db.categories.length) {
      throw new Error('分类不存在')
    }
    db.categories = next
    save(db)
    return delay(undefined as void)
  },

  listDishes: async (activeOnly = false, categoryId?: number) => {
    const db = load()
    let dishes = [...db.dishes].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    if (categoryId != null) {
      dishes = dishes.filter((dish) => dish.categoryId === categoryId)
    }
    return delay(activeOnly ? dishes.filter((dish) => dish.isActive) : dishes)
  },

  getDish: async (id: number) => {
    const dish = load().dishes.find((item) => item.id === id)
    if (!dish) {
      throw new Error('菜品不存在')
    }
    return delay(dish)
  },

  createDish: async (draft: DishDraft) => {
    const db = load()
    const name = draft.name.trim()
    if (!name) {
      throw new Error('菜品名称不能为空')
    }
    if (!db.categories.some((item) => item.id === draft.categoryId)) {
      throw new Error('请选择分类')
    }
    const dish: Dish = {
      id: allocId(db),
      categoryId: draft.categoryId,
      name,
      description: draft.description.trim(),
      imageUrl: draft.imageUrl,
      isActive: draft.isActive,
      sortOrder: draft.sortOrder || 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      optionGroups: mapDraftGroups(db, draft.optionGroups || []),
    }
    db.dishes.push(dish)
    save(db)
    return delay(dish)
  },

  updateDish: async (id: number, draft: DishDraft) => {
    const db = load()
    const index = db.dishes.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('菜品不存在')
    }
    const name = draft.name.trim()
    if (!name) {
      throw new Error('菜品名称不能为空')
    }
    if (!db.categories.some((item) => item.id === draft.categoryId)) {
      throw new Error('请选择分类')
    }
    const dish: Dish = {
      ...db.dishes[index],
      categoryId: draft.categoryId,
      name,
      description: draft.description.trim(),
      imageUrl: draft.imageUrl,
      isActive: draft.isActive,
      sortOrder: draft.sortOrder || 0,
      updatedAt: nowIso(),
      optionGroups: mapDraftGroups(db, draft.optionGroups || []),
    }
    db.dishes[index] = dish
    save(db)
    return delay(dish)
  },

  deleteDish: async (id: number) => {
    const db = load()
    const next = db.dishes.filter((item) => item.id !== id)
    if (next.length === db.dishes.length) {
      throw new Error('菜品不存在')
    }
    db.dishes = next
    save(db)
    return delay(undefined as void)
  },

  listUsers: async () => delay(withCounts(load())),

  getUser: async (id: number) => {
    const user = withCounts(load()).find((item) => item.id === id)
    if (!user) {
      throw new Error('用户不存在')
    }
    return delay(user)
  },

  createUser: async (name: string) => {
    const db = load()
    const trimmed = name.trim()
    if (!trimmed) {
      throw new Error('账号名不能为空')
    }
    if (db.users.some((user) => user.name === trimmed)) {
      throw new Error('账号名已存在，请换一个')
    }
    const user: GuestUser = {
      id: allocId(db),
      name: trimmed,
      createdAt: nowIso(),
      activityCount: 0,
    }
    db.users.push(user)
    save(db)
    return delay(user)
  },

  updateUser: async (id: number, name: string) => {
    const db = load()
    const trimmed = name.trim()
    if (!trimmed) {
      throw new Error('账号名不能为空')
    }
    const index = db.users.findIndex((user) => user.id === id)
    if (index < 0) {
      throw new Error('用户不存在')
    }
    if (db.users.some((user) => user.name === trimmed && user.id !== id)) {
      throw new Error('账号名已存在，请换一个')
    }
    db.users[index] = { ...db.users[index], name: trimmed }
    save(db)
    return delay(withCounts(db).find((user) => user.id === id)!)
  },

  listActivities: async (params?: { status?: ActivityStatus; userId?: number }) => {
    const db = load()
    let list = [...db.activities]
    if (params?.status) {
      list = list.filter((item) => item.status === params.status)
    }
    if (params?.userId != null) {
      const uid = params.userId
      list = list.filter((item) => item.userId === uid || item.participantIds.includes(uid))
    }
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.id - a.id)
    return delay(list)
  },

  getActivity: async (id: number) => {
    const activity = load().activities.find((item) => item.id === id)
    if (!activity) {
      throw new Error('活动不存在')
    }
    return delay(activity)
  },

  getActivityByShareCode: async (code: string) => {
    const trimmed = code.trim().toUpperCase()
    const activity = load().activities.find((item) => item.shareCode === trimmed)
    if (!activity) {
      throw new Error('分享码无效')
    }
    return delay(activity)
  },

  createActivity: async (payload: {
    userId: number
    scheduledAt: string
    items: ActivitySubmitItem[]
  }) => {
    const db = load()
    const user = db.users.find((item) => item.id === payload.userId)
    if (!user) {
      throw new Error('请先创建账号名')
    }
    if (!payload.scheduledAt) {
      throw new Error('请选择约定时间')
    }
    if (!payload.items?.length) {
      throw new Error('请至少选择一道菜')
    }

    const activity: Activity = {
      id: allocId(db),
      shareCode: shareCode(),
      userId: user.id,
      userName: user.name,
      scheduledAt: new Date(payload.scheduledAt).toISOString(),
      status: 'open',
      createdAt: nowIso(),
      repliedAt: null,
      replyNote: null,
      withdrawnAt: null,
      completedAt: null,
      participantIds: [],
      items: buildItems(db, user, payload.items),
      photos: [],
    }
    db.activities.unshift(activity)
    save(db)
    return delay(activity)
  },

  /** 通过分享码加入活动（仅参与，不改他人内容） */
  joinActivity: async (shareCodeInput: string, userId: number) => {
    const db = load()
    const user = db.users.find((item) => item.id === userId)
    if (!user) {
      throw new Error('请先创建账号名')
    }
    const code = shareCodeInput.trim().toUpperCase()
    const index = db.activities.findIndex((item) => item.shareCode === code)
    if (index < 0) {
      throw new Error('分享码无效')
    }
    const activity = db.activities[index]
    if (activity.status === 'withdrawn') {
      throw new Error('活动已撤回')
    }
    if (activity.userId === userId) {
      return delay(activity)
    }
    if (!activity.participantIds.includes(userId)) {
      db.activities[index] = {
        ...activity,
        participantIds: [...activity.participantIds, userId],
      }
      save(db)
    }
    return delay(db.activities[index])
  },

  /** 参与人仅可追加自己的菜；答复后不可再改 */
  addActivityItems: async (activityId: number, userId: number, items: ActivitySubmitItem[]) => {
    const db = load()
    const user = db.users.find((item) => item.id === userId)
    if (!user) {
      throw new Error('请先创建账号名')
    }
    if (!items?.length) {
      throw new Error('请至少选择一道菜')
    }
    const index = db.activities.findIndex((item) => item.id === activityId)
    if (index < 0) {
      throw new Error('活动不存在')
    }
    const activity = db.activities[index]
    if (!canModify(activity)) {
      throw new Error(activity.status === 'replied' ? '已答复，不能再修改活动' : '当前状态不可加菜')
    }
    if (!isMember(activity, userId)) {
      throw new Error('请先通过分享码加入活动')
    }

    const nextItems = [...activity.items, ...buildItems(db, user, items)]
    db.activities[index] = { ...activity, items: nextItems }
    save(db)
    return delay(db.activities[index])
  },

  /** 只能删自己加的菜 */
  removeActivityItem: async (activityId: number, itemId: number, userId: number) => {
    const db = load()
    const index = db.activities.findIndex((item) => item.id === activityId)
    if (index < 0) {
      throw new Error('活动不存在')
    }
    const activity = db.activities[index]
    if (!canModify(activity)) {
      throw new Error('已答复或结束后不能修改')
    }
    const target = activity.items.find((item) => item.id === itemId)
    if (!target) {
      throw new Error('菜品记录不存在')
    }
    if (target.addedByUserId !== userId) {
      throw new Error('不能修改其他人添加的内容')
    }
    db.activities[index] = {
      ...activity,
      items: activity.items.filter((item) => item.id !== itemId),
    }
    save(db)
    return delay(db.activities[index])
  },

  /** 管理员答复：锁定修改，不影响此前已分享 */
  replyActivity: async (id: number, replyNote?: string) => {
    const db = load()
    const index = db.activities.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('活动不存在')
    }
    const activity = db.activities[index]
    if (activity.status === 'withdrawn') {
      throw new Error('活动已撤回')
    }
    if (activity.status === 'completed') {
      throw new Error('活动已完成')
    }
    if (activity.status === 'replied') {
      throw new Error('已答复过')
    }
    db.activities[index] = {
      ...activity,
      status: 'replied',
      repliedAt: nowIso(),
      replyNote: replyNote?.trim() || null,
    }
    save(db)
    return delay(db.activities[index])
  },

  /** 发起人撤回，通知管理员 */
  withdrawActivity: async (id: number, userId: number) => {
    const db = load()
    const index = db.activities.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('活动不存在')
    }
    const activity = db.activities[index]
    if (activity.userId !== userId) {
      throw new Error('只有发起人可以撤回')
    }
    if (activity.status === 'withdrawn') {
      throw new Error('活动已撤回')
    }
    if (activity.status === 'completed') {
      throw new Error('活动已完成，不能撤回')
    }
    db.activities[index] = {
      ...activity,
      status: 'withdrawn',
      withdrawnAt: nowIso(),
    }
    db.notices.unshift({
      id: allocId(db),
      type: 'withdrawn',
      activityId: activity.id,
      message: `${activity.userName} 撤回了活动 #${activity.id}（约定 ${activity.scheduledAt}）`,
      createdAt: nowIso(),
      read: false,
    })
    save(db)
    return delay(db.activities[index])
  },

  completeActivity: async (id: number, userId: number) => {
    const db = load()
    const index = db.activities.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('活动不存在')
    }
    const activity = db.activities[index]
    if (activity.userId !== userId) {
      throw new Error('只有发起人可以标记完成')
    }
    if (activity.status === 'withdrawn') {
      throw new Error('活动已撤回')
    }
    if (activity.status === 'completed') {
      return delay(activity)
    }
    db.activities[index] = {
      ...activity,
      status: 'completed',
      completedAt: nowIso(),
    }
    save(db)
    return delay(db.activities[index])
  },

  /** 手机先吃：完成后上传照片 */
  uploadActivityPhoto: async (activityId: number, userId: number, imageDataUrl: string) => {
    const db = load()
    const user = db.users.find((item) => item.id === userId)
    if (!user) {
      throw new Error('请先创建账号名')
    }
    if (!imageDataUrl?.trim()) {
      throw new Error('请选择照片')
    }
    const index = db.activities.findIndex((item) => item.id === activityId)
    if (index < 0) {
      throw new Error('活动不存在')
    }
    const activity = db.activities[index]
    if (activity.status !== 'completed') {
      throw new Error('活动完成后才能上传照片')
    }
    if (!isMember(activity, userId)) {
      throw new Error('只有参与人可以上传')
    }
    const photo = {
      id: allocId(db),
      userId: user.id,
      userName: user.name,
      imageDataUrl: imageDataUrl.trim(),
      createdAt: nowIso(),
    }
    db.activities[index] = {
      ...activity,
      photos: [photo, ...activity.photos],
    }
    save(db)
    return delay(db.activities[index])
  },

  listNotices: async () => {
    const list = [...load().notices].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    )
    return delay(list)
  },

  markNoticeRead: async (id: number) => {
    const db = load()
    const index = db.notices.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('通知不存在')
    }
    db.notices[index] = { ...db.notices[index], read: true }
    save(db)
    return delay(db.notices[index])
  },

  deleteActivity: async (id: number) => {
    const db = load()
    const next = db.activities.filter((item) => item.id !== id)
    if (next.length === db.activities.length) {
      throw new Error('活动不存在')
    }
    db.activities = next
    save(db)
    return delay(undefined as void)
  },
}
