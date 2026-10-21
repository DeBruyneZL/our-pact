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
import { mockApi } from "./mockStore";

/**
 * 默认走本地 mock（不建库也能看页面、跑通流程）。
 */
const useMock = import.meta.env.VITE_USE_MOCK !== "0";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || "请求失败");
  }
  return data as T;
}

const remoteApi = {
  listCategories: () => request<DishCategory[]>("/api/categories"),
  createCategory: (payload: { name: string; sortOrder?: number }) =>
    request<DishCategory>("/api/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id: number, payload: { name: string; sortOrder?: number }) =>
    request<DishCategory>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCategory: (id: number) => request<void>(`/api/categories/${id}`, { method: "DELETE" }),

  listDishes: (activeOnly = false, categoryId?: number) => {
    const search = new URLSearchParams();
    if (activeOnly) search.set("active", "1");
    if (categoryId != null) search.set("categoryId", String(categoryId));
    const qs = search.toString();
    return request<Dish[]>(`/api/dishes${qs ? `?${qs}` : ""}`);
  },
  getDish: (id: number) => request<Dish>(`/api/dishes/${id}`),
  createDish: (draft: DishDraft) =>
    request<Dish>("/api/dishes", { method: "POST", body: JSON.stringify(draft) }),
  updateDish: (id: number, draft: DishDraft) =>
    request<Dish>(`/api/dishes/${id}`, { method: "PUT", body: JSON.stringify(draft) }),
  deleteDish: (id: number) => request<void>(`/api/dishes/${id}`, { method: "DELETE" }),

  listUsers: () => request<User[]>("/api/users"),
  getUser: (id: number) => request<User>(`/api/users/${id}`),
  createUser: (name: string) =>
    request<User>("/api/users", { method: "POST", body: JSON.stringify({ name }) }),
  updateUser: (id: number, name: string) =>
    request<User>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),

  listOrders: (params?: { status?: OrderStatus; userId?: number }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.userId) search.set("userId", String(params.userId));
    const qs = search.toString();
    return request<Order[]>(`/api/orders${qs ? `?${qs}` : ""}`);
  },
  createOrder: (payload: { userId: number; scheduledAt: string; items: OrderSubmitItem[] }) =>
    request<Order>("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
  joinOrder: (shareCode: string, userId: number) =>
    request<Order>("/api/orders/join", {
      method: "POST",
      body: JSON.stringify({ shareCode, userId }),
    }),
  addOrderItems: (orderId: number, userId: number, items: OrderSubmitItem[]) =>
    request<Order>(`/api/orders/${orderId}/items`, {
      method: "POST",
      body: JSON.stringify({ userId, items }),
    }),
  removeOrderItem: (orderId: number, itemId: number, userId: number) =>
    request<Order>(`/api/orders/${orderId}/items/${itemId}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),
  replyOrder: (id: number, replyNote?: string) =>
    request<Order>(`/api/orders/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ replyNote }),
    }),
  withdrawOrder: (id: number, userId: number) =>
    request<Order>(`/api/orders/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  completeOrder: (id: number, userId: number) =>
    request<Order>(`/api/orders/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  uploadOrderPhoto: (orderId: number, userId: number, imageDataUrl: string) =>
    request<Order>(`/api/orders/${orderId}/photos`, {
      method: "POST",
      body: JSON.stringify({ userId, imageDataUrl }),
    }),
  listNotices: () => request<AdminNotice[]>("/api/notices"),
  markNoticeRead: (id: number) =>
    request<AdminNotice>(`/api/notices/${id}/read`, { method: "POST" }),
  deleteOrder: (id: number) => request<void>(`/api/orders/${id}`, { method: "DELETE" }),
};

export const api = useMock ? mockApi : remoteApi;
