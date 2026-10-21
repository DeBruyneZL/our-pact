/** open 可分享加菜；replied 已答复不可再改；withdrawn 已撤回；completed 可手机先吃 */
export type OrderStatus = "open" | "replied" | "withdrawn" | "completed";

export interface DishCategory {
  id: number;
  name: string;
  sortOrder: number;
}

export interface DishOptionValue {
  id: number;
  label: string;
  sortOrder: number;
}

export interface DishOptionGroup {
  id: number;
  name: string;
  sortOrder: number;
  values: DishOptionValue[];
}

export interface Dish {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  optionGroups: DishOptionGroup[];
}

export interface DishDraft {
  categoryId: number;
  name: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  optionGroups: Array<{
    name: string;
    values: Array<{ label: string }>;
  }>;
}

export interface User {
  id: number;
  name: string;
  createdAt: string;
  orderCount: number;
}

export interface OrderItemOption {
  id: number;
  groupId: number | null;
  valueId: number | null;
  groupName: string;
  optionLabel: string;
}

export interface OrderItem {
  id: number;
  dishId: number | null;
  dishName: string;
  note: string | null;
  options: OrderItemOption[];
  addedByUserId: number;
  addedByUserName: string;
}

export interface OrderPhoto {
  id: number;
  userId: number;
  userName: string;
  imageDataUrl: string;
  createdAt: string;
}

export interface Order {
  id: number;
  shareCode: string;
  userId: number;
  userName: string;
  scheduledAt: string;
  status: OrderStatus;
  createdAt: string;
  repliedAt: string | null;
  replyNote: string | null;
  withdrawnAt: string | null;
  completedAt: string | null;
  participantIds: number[];
  items: OrderItem[];
  photos: OrderPhoto[];
}

export interface OrderSubmitItem {
  dishId: number;
  note?: string;
  options?: Array<{ groupId: number; valueId: number }>;
}

export interface CartDishSelection {
  dishId: number;
  note: string;
  options: Record<number, number | null>;
}

export interface AdminNotice {
  id: number;
  type: "withdrawn";
  activityId: number;
  message: string;
  createdAt: string;
  read: boolean;
}
