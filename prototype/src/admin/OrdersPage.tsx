import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import type { AdminNotice, Order, OrderStatus } from "../types/shanyue";
import { formatDateTime } from "../utils/format";

interface OrdersPageProps {
  onNotify: (message: string) => void;
}

const FILTERS: Array<{ id: "all" | OrderStatus; label: string }> = [
  { id: "all", label: "全部" },
  { id: "open", label: "待答复" },
  { id: "replied", label: "已答复" },
  { id: "withdrawn", label: "已撤回" },
  { id: "completed", label: "已完成" },
];

/**
 * 管理端 · 活动答复。
 */
export function OrdersPage({ onNotify }: OrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await api.listOrders(filter === "all" ? undefined : { status: filter }));
      setNotices(await api.listNotices());
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [filter, onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  const reply = async (order: Order) => {
    const note = window.prompt("写一句答复（可选）", "") ?? null;
    if (note === null) return;
    try {
      await api.replyOrder(order.id, note);
      onNotify("已答复，活动不可再修改");
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "操作失败");
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.markNoticeRead(id);
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleDelete = async () => {
    if (!deleting) {
      return;
    }
    try {
      await api.deleteOrder(deleting.id);
      onNotify("活动已删除");
      setDeleting(null);
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "删除失败");
    }
  };

  const unread = notices.filter((item) => !item.read);

  return (
    <section>
      <div className="admin-main-head">
        <div>
          <h2>活动记录</h2>
          <p>答复活动、查看撤回通知。答复不等于审批，锁定后不可再改。</p>
        </div>
      </div>

      {unread.length > 0 ? (
        <div className="notice-list">
          {unread.map((notice) => (
            <div key={notice.id} className="notice-item">
              <span>{notice.message}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void markRead(notice.id)}>
                知道了
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="toolbar">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`filter-chip ${filter === item.id ? "active" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty">加载中…</p>
      ) : orders.length === 0 ? (
        <p className="empty">
          <strong>暂无活动</strong>
          朋友发起活动后会出现在这里
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>发起人</th>
              <th>约定时间</th>
              <th>菜品</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.userName}</strong>
                  <div style={{ color: "var(--mist)", fontSize: 12, marginTop: 4 }}>
                    提交于 {formatDateTime(order.createdAt)} · 码 {order.shareCode}
                  </div>
                </td>
                <td>{formatDateTime(order.scheduledAt)}</td>
                <td>
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item-line">
                      {item.dishName}
                      <small>
                        {[
                          item.addedByUserName,
                          ...item.options.map((opt) => `${opt.groupName}：${opt.optionLabel}`),
                          item.note ? `备注：${item.note}` : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </div>
                  ))}
                  {order.replyNote ? (
                    <div style={{ marginTop: 6, color: "var(--sage-deep)", fontSize: 12 }}>
                      答复：{order.replyNote}
                    </div>
                  ) : null}
                </td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
                <td>
                  <div className="row-actions">
                    {order.status === "open" ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => void reply(order)}
                      >
                        答复
                      </button>
                    ) : null}
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleting(order)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除活动"
        message={deleting ? `删除 ${deleting.userName} 的活动 #${deleting.id}？` : ""}
        confirmLabel="删除"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
      />
    </section>
  );
}
