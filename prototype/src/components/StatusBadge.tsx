import type { OrderStatus } from "../types/shanyue";

const LABEL: Record<OrderStatus, string> = {
  open: "待答复",
  replied: "已答复",
  withdrawn: "已撤回",
  completed: "已完成",
};

/**
 * 活动状态徽章。
 */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge badge-${status}`}>{LABEL[status]}</span>;
}
