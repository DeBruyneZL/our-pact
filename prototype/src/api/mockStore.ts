import type {
  AdminNotice,
  Dish,
  DishCategory,
  DishDraft,
  Order,
  OrderStatus,
  OrderSubmitItem,
  User,
} from "../types/shanyue";

const STORAGE_KEY = "fanfou.mock.v2";

interface MockDb {
  nextId: number;
  users: User[];
  categories: DishCategory[];
  dishes: Dish[];
  orders: Order[];
  notices: AdminNotice[];
}

function nowIso() {
  return new Date().toISOString();
}

function makeShareCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function seed(): MockDb {
  const categories: DishCategory[] = [
    { id: 1, name: "热菜", sortOrder: 1 },
    { id: 2, name: "凉菜", sortOrder: 2 },
    { id: 3, name: "汤羹", sortOrder: 3 },
    { id: 4, name: "主食", sortOrder: 4 },
    { id: 5, name: "甜品", sortOrder: 5 },
  ];

  const dishes: Dish[] = [
    {
      id: 1,
      categoryId: 1,
      name: "番茄牛腩",
      description: "慢炖入味，适合周末家人围坐",
      imageUrl: null,
      isActive: true,
      sortOrder: 1,
      optionGroups: [
        {
          id: 1,
          name: "份量",
          sortOrder: 1,
          values: [
            { id: 1, label: "小份", sortOrder: 1 },
            { id: 2, label: "中份", sortOrder: 2 },
            { id: 3, label: "大份", sortOrder: 3 },
          ],
        },
      ],
    },
    {
      id: 2,
      categoryId: 2,
      name: "清炒时蔬",
      description: "当季绿叶，清爽解腻",
      imageUrl: null,
      isActive: true,
      sortOrder: 2,
      optionGroups: [],
    },
    {
      id: 3,
      categoryId: 1,
      name: "麻婆豆腐",
      description: "川味家常，可选辣度",
      imageUrl: null,
      isActive: true,
      sortOrder: 3,
      optionGroups: [
        {
          id: 2,
          name: "辣度",
          sortOrder: 1,
          values: [
            { id: 4, label: "微辣", sortOrder: 1 },
            { id: 5, label: "中辣", sortOrder: 2 },
            { id: 6, label: "特辣", sortOrder: 3 },
          ],
        },
        {
          id: 3,
          name: "豆腐",
          sortOrder: 2,
          values: [
            { id: 7, label: "嫩豆腐", sortOrder: 1 },
            { id: 8, label: "老豆腐", sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 4,
      categoryId: 1,
      name: "蒜蓉蒸虾",
      description: "鲜甜蒜香，少油",
      imageUrl: null,
      isActive: true,
      sortOrder: 4,
      optionGroups: [
        {
          id: 4,
          name: "熟度",
          sortOrder: 1,
          values: [
            { id: 9, label: "七分熟", sortOrder: 1 },
            { id: 10, label: "全熟", sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 5,
      categoryId: 5,
      name: "银耳莲子羹",
      description: "餐后甜品，温润",
      imageUrl: null,
      isActive: true,
      sortOrder: 5,
      optionGroups: [],
    },
  ];

  return {
    nextId: 100,
    users: [
      { id: 1, name: "小明", createdAt: nowIso(), orderCount: 0 },
      { id: 2, name: "阿花", createdAt: nowIso(), orderCount: 0 },
    ],
    categories,
    dishes,
    orders: [],
    notices: [],
  };
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const db = seed();
      save(db);
      return db;
    }
    const db = JSON.parse(raw) as MockDb;
    if (!db.notices) db.notices = [];
    if (!db.categories?.length) db.categories = seed().categories;
    db.dishes = db.dishes.map((dish) => ({
      ...dish,
      categoryId: dish.categoryId || db.categories[0]?.id || 1,
    }));
    return db;
  } catch {
    const db = seed();
    save(db);
    return db;
  }
}

function save(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function allocId(db: MockDb) {
  const id = db.nextId;
  db.nextId += 1;
  return id;
}

function withOrderCounts(db: MockDb): User[] {
  return db.users.map((user) => ({
    ...user,
    orderCount: db.orders.filter(
      (order) => order.userId === user.id || order.participantIds.includes(user.id),
    ).length,
  }));
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 80);
  });
}

function mapDraftGroups(db: MockDb, groups: DishDraft["optionGroups"]) {
  return groups
    .map((group, gi) => {
      const name = group.name.trim();
      if (!name) {
        return null;
      }
      const values = (group.values || [])
        .map((value, vi) => {
          const label = value.label.trim();
          if (!label) {
            return null;
          }
          return { id: allocId(db), label, sortOrder: vi };
        })
        .filter(Boolean) as Array<{ id: number; label: string; sortOrder: number }>;
      if (values.length === 0) {
        return null;
      }
      return { id: allocId(db), name, sortOrder: gi, values };
    })
    .filter(Boolean) as Dish["optionGroups"];
}

function buildItems(db: MockDb, user: User, payloadItems: OrderSubmitItem[]): Order["items"] {
  return payloadItems.map((item) => {
    const dish = db.dishes.find((entry) => entry.id === item.dishId && entry.isActive);
    if (!dish) {
      throw new Error("菜品不可用");
    }
    const options = (item.options || [])
      .map((selected) => {
        const group = dish.optionGroups.find((entry) => entry.id === selected.groupId);
        const value = group?.values.find((entry) => entry.id === selected.valueId);
        if (!group || !value) {
          return null;
        }
        return {
          id: allocId(db),
          groupId: group.id,
          valueId: value.id,
          groupName: group.name,
          optionLabel: value.label,
        };
      })
      .filter(Boolean) as Order["items"][number]["options"];

    return {
      id: allocId(db),
      dishId: dish.id,
      dishName: dish.name,
      note: item.note?.trim() || null,
      options,
      addedByUserId: user.id,
      addedByUserName: user.name,
    };
  });
}

function isMember(order: Order, userId: number) {
  return order.userId === userId || order.participantIds.includes(userId);
}

/**
 * 本地 mock：不建库也能跑通双端流程，数据存在 localStorage。
 */
export const mockApi = {
  listCategories: async () => {
    const list = [...load().categories].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return delay(list);
  },

  createCategory: async (payload: { name: string; sortOrder?: number }) => {
    const db = load();
    const name = payload.name.trim();
    if (!name) throw new Error("分类名称不能为空");
    if (db.categories.some((item) => item.name === name)) throw new Error("分类名称已存在");
    const category: DishCategory = {
      id: allocId(db),
      name,
      sortOrder: payload.sortOrder ?? db.categories.length + 1,
    };
    db.categories.push(category);
    save(db);
    return delay(category);
  },

  updateCategory: async (id: number, payload: { name: string; sortOrder?: number }) => {
    const db = load();
    const index = db.categories.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("分类不存在");
    const name = payload.name.trim();
    if (!name) throw new Error("分类名称不能为空");
    if (db.categories.some((item) => item.name === name && item.id !== id)) {
      throw new Error("分类名称已存在");
    }
    db.categories[index] = {
      ...db.categories[index],
      name,
      sortOrder: payload.sortOrder ?? db.categories[index].sortOrder,
    };
    save(db);
    return delay(db.categories[index]);
  },

  deleteCategory: async (id: number) => {
    const db = load();
    if (db.dishes.some((dish) => dish.categoryId === id)) {
      throw new Error("该分类下还有菜品，无法删除");
    }
    const next = db.categories.filter((item) => item.id !== id);
    if (next.length === db.categories.length) throw new Error("分类不存在");
    db.categories = next;
    save(db);
    return delay(undefined);
  },

  listDishes: async (activeOnly = false, categoryId?: number) => {
    const db = load();
    let dishes = [...db.dishes].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    if (categoryId != null) {
      dishes = dishes.filter((dish) => dish.categoryId === categoryId);
    }
    return delay(activeOnly ? dishes.filter((dish) => dish.isActive) : dishes);
  },

  getDish: async (id: number) => {
    const dish = load().dishes.find((item) => item.id === id);
    if (!dish) {
      throw new Error("菜品不存在");
    }
    return delay(dish);
  },

  createDish: async (draft: DishDraft) => {
    const db = load();
    const name = draft.name.trim();
    if (!name) {
      throw new Error("菜品名称不能为空");
    }
    if (!db.categories.some((item) => item.id === draft.categoryId)) {
      throw new Error("请选择分类");
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
    };
    db.dishes.push(dish);
    save(db);
    return delay(dish);
  },

  updateDish: async (id: number, draft: DishDraft) => {
    const db = load();
    const index = db.dishes.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("菜品不存在");
    }
    const name = draft.name.trim();
    if (!name) {
      throw new Error("菜品名称不能为空");
    }
    if (!db.categories.some((item) => item.id === draft.categoryId)) {
      throw new Error("请选择分类");
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
    };
    db.dishes[index] = dish;
    save(db);
    return delay(dish);
  },

  deleteDish: async (id: number) => {
    const db = load();
    const next = db.dishes.filter((item) => item.id !== id);
    if (next.length === db.dishes.length) {
      throw new Error("菜品不存在");
    }
    db.dishes = next;
    save(db);
    return delay(undefined);
  },

  listUsers: async () => delay(withOrderCounts(load())),

  getUser: async (id: number) => {
    const user = withOrderCounts(load()).find((item) => item.id === id);
    if (!user) {
      throw new Error("用户不存在");
    }
    return delay(user);
  },

  createUser: async (name: string) => {
    const db = load();
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("账号名不能为空");
    }
    if (db.users.some((user) => user.name === trimmed)) {
      throw new Error("账号名已存在，请换一个");
    }
    const user: User = {
      id: allocId(db),
      name: trimmed,
      createdAt: nowIso(),
      orderCount: 0,
    };
    db.users.push(user);
    save(db);
    return delay(user);
  },

  updateUser: async (id: number, name: string) => {
    const db = load();
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("账号名不能为空");
    }
    const index = db.users.findIndex((user) => user.id === id);
    if (index < 0) {
      throw new Error("用户不存在");
    }
    if (db.users.some((user) => user.name === trimmed && user.id !== id)) {
      throw new Error("账号名已存在，请换一个");
    }
    db.users[index] = { ...db.users[index], name: trimmed };
    save(db);
    return delay(withOrderCounts(db).find((user) => user.id === id)!);
  },

  listOrders: async (params?: { status?: OrderStatus; userId?: number }) => {
    const db = load();
    let orders = [...db.orders];
    if (params?.status) {
      orders = orders.filter((order) => order.status === params.status);
    }
    if (params?.userId != null) {
      const uid = params.userId;
      orders = orders.filter((order) => order.userId === uid || order.participantIds.includes(uid));
    }
    orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.id - a.id);
    return delay(orders);
  },

  createOrder: async (payload: { userId: number; scheduledAt: string; items: OrderSubmitItem[] }) => {
    const db = load();
    const user = db.users.find((item) => item.id === payload.userId);
    if (!user) {
      throw new Error("请先创建账号名");
    }
    if (!payload.scheduledAt) {
      throw new Error("请选择约定时间");
    }
    if (!payload.items?.length) {
      throw new Error("请至少选择一道菜");
    }

    const order: Order = {
      id: allocId(db),
      shareCode: makeShareCode(),
      userId: user.id,
      userName: user.name,
      scheduledAt: new Date(payload.scheduledAt).toISOString(),
      status: "open",
      createdAt: nowIso(),
      repliedAt: null,
      replyNote: null,
      withdrawnAt: null,
      completedAt: null,
      participantIds: [],
      items: buildItems(db, user, payload.items),
      photos: [],
    };
    db.orders.unshift(order);
    save(db);
    return delay(order);
  },

  joinOrder: async (shareCodeInput: string, userId: number) => {
    const db = load();
    const user = db.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("请先创建账号名");
    }
    const code = shareCodeInput.trim().toUpperCase();
    const index = db.orders.findIndex((item) => item.shareCode === code);
    if (index < 0) {
      throw new Error("分享码无效");
    }
    const order = db.orders[index];
    if (order.status === "withdrawn") {
      throw new Error("活动已撤回");
    }
    if (order.userId === userId) {
      return delay(order);
    }
    if (!order.participantIds.includes(userId)) {
      db.orders[index] = { ...order, participantIds: [...order.participantIds, userId] };
      save(db);
    }
    return delay(db.orders[index]);
  },

  addOrderItems: async (orderId: number, userId: number, items: OrderSubmitItem[]) => {
    const db = load();
    const user = db.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("请先创建账号名");
    }
    if (!items?.length) {
      throw new Error("请至少选择一道菜");
    }
    const index = db.orders.findIndex((item) => item.id === orderId);
    if (index < 0) {
      throw new Error("活动不存在");
    }
    const order = db.orders[index];
    if (order.status !== "open") {
      throw new Error(order.status === "replied" ? "已答复，不能再修改活动" : "当前状态不可加菜");
    }
    if (!isMember(order, userId)) {
      throw new Error("请先通过分享码加入活动");
    }
    db.orders[index] = { ...order, items: [...order.items, ...buildItems(db, user, items)] };
    save(db);
    return delay(db.orders[index]);
  },

  removeOrderItem: async (orderId: number, itemId: number, userId: number) => {
    const db = load();
    const index = db.orders.findIndex((item) => item.id === orderId);
    if (index < 0) {
      throw new Error("活动不存在");
    }
    const order = db.orders[index];
    if (order.status !== "open") {
      throw new Error("已答复或结束后不能修改");
    }
    const target = order.items.find((item) => item.id === itemId);
    if (!target) {
      throw new Error("菜品记录不存在");
    }
    if (target.addedByUserId !== userId) {
      throw new Error("不能修改其他人添加的内容");
    }
    db.orders[index] = { ...order, items: order.items.filter((item) => item.id !== itemId) };
    save(db);
    return delay(db.orders[index]);
  },

  replyOrder: async (id: number, replyNote?: string) => {
    const db = load();
    const index = db.orders.findIndex((order) => order.id === id);
    if (index < 0) {
      throw new Error("活动不存在");
    }
    const order = db.orders[index];
    if (order.status !== "open") {
      throw new Error("当前状态不可答复");
    }
    db.orders[index] = {
      ...order,
      status: "replied",
      repliedAt: nowIso(),
      replyNote: replyNote?.trim() || null,
    };
    save(db);
    return delay(db.orders[index]);
  },

  withdrawOrder: async (id: number, userId: number) => {
    const db = load();
    const index = db.orders.findIndex((order) => order.id === id);
    if (index < 0) {
      throw new Error("活动不存在");
    }
    const order = db.orders[index];
    if (order.userId !== userId) {
      throw new Error("只有发起人可以撤回");
    }
    if (order.status === "withdrawn" || order.status === "completed") {
      throw new Error("当前状态不可撤回");
    }
    db.orders[index] = { ...order, status: "withdrawn", withdrawnAt: nowIso() };
    db.notices.unshift({
      id: allocId(db),
      type: "withdrawn",
      activityId: order.id,
      message: `${order.userName} 撤回了活动 #${order.id}`,
      createdAt: nowIso(),
      read: false,
    });
    save(db);
    return delay(db.orders[index]);
  },

  completeOrder: async (id: number, userId: number) => {
    const db = load();
    const index = db.orders.findIndex((order) => order.id === id);
    if (index < 0) {
      throw new Error("活动不存在");
    }
    const order = db.orders[index];
    if (order.userId !== userId) {
      throw new Error("只有发起人可以标记完成");
    }
    if (order.status === "withdrawn") {
      throw new Error("活动已撤回");
    }
    db.orders[index] = { ...order, status: "completed", completedAt: nowIso() };
    save(db);
    return delay(db.orders[index]);
  },

  uploadOrderPhoto: async (orderId: number, userId: number, imageDataUrl: string) => {
    const db = load();
    const user = db.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("请先创建账号名");
    }
    const index = db.orders.findIndex((order) => order.id === orderId);
    if (index < 0) {
      throw new Error("活动不存在");
    }
    const order = db.orders[index];
    if (order.status !== "completed") {
      throw new Error("活动完成后才能上传照片");
    }
    if (!isMember(order, userId)) {
      throw new Error("只有参与人可以上传");
    }
    const photo = {
      id: allocId(db),
      userId: user.id,
      userName: user.name,
      imageDataUrl,
      createdAt: nowIso(),
    };
    db.orders[index] = { ...order, photos: [photo, ...order.photos] };
    save(db);
    return delay(db.orders[index]);
  },

  listNotices: async () => {
    const list = [...load().notices].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
    return delay(list);
  },

  markNoticeRead: async (id: number) => {
    const db = load();
    const index = db.notices.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("通知不存在");
    }
    db.notices[index] = { ...db.notices[index], read: true };
    save(db);
    return delay(db.notices[index]);
  },

  deleteOrder: async (id: number) => {
    const db = load();
    const next = db.orders.filter((order) => order.id !== id);
    if (next.length === db.orders.length) {
      throw new Error("活动不存在");
    }
    db.orders = next;
    save(db);
    return delay(undefined);
  },
};
