import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { useSession } from "../context/SessionContext";
import type { Dish, Order } from "../types/shanyue";
import { formatDateTime } from "../utils/format";

interface OrdersTabProps {
  onNotify: (message: string) => void;
  refreshKey: number;
}

/**
 * C 端 · 我的活动：分享、加菜、撤回、手机先吃。
 */
export function OrdersTab({ onNotify, refreshKey }: OrdersTabProps) {
  const { user, loading: sessionLoading } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [picked, setPicked] = useState<number[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      setOrders(await api.listOrders({ userId: user.id }));
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "加载活动失败");
    } finally {
      setLoading(false);
    }
  }, [onNotify, user]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const onJoin = async () => {
    if (!user) {
      onNotify("请先创建账号名");
      return;
    }
    setJoining(true);
    try {
      await api.joinOrder(joinCode, user.id);
      setJoinCode("");
      onNotify("已加入活动");
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "加入失败");
    } finally {
      setJoining(false);
    }
  };

  const onShare = async (order: Order) => {
    const text = `饭否活动分享码：${order.shareCode}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`已复制分享码 ${order.shareCode}`);
    } catch {
      onNotify(`分享码：${order.shareCode}`);
    }
  };

  const openAdd = async (order: Order) => {
    if (!dishes.length) {
      setDishes(await api.listDishes(true));
    }
    setPicked([]);
    setAddingId(order.id);
  };

  const submitAdd = async () => {
    if (!user || addingId == null) return;
    if (!picked.length) {
      onNotify("请至少选一道菜");
      return;
    }
    try {
      await api.addOrderItems(
        addingId,
        user.id,
        picked.map((dishId) => ({ dishId })),
      );
      setAddingId(null);
      onNotify("已加菜");
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "加菜失败");
    }
  };

  const onWithdraw = async (order: Order) => {
    if (!user) return;
    if (!window.confirm("撤回后会通知管理员，确定吗？")) return;
    try {
      await api.withdrawOrder(order.id, user.id);
      onNotify("已撤回，已通知管理员");
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "撤回失败");
    }
  };

  const onComplete = async (order: Order) => {
    if (!user) return;
    if (!window.confirm("完成后可在「手机先吃」上传合照")) return;
    try {
      await api.completeOrder(order.id, user.id);
      onNotify("活动已完成");
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "操作失败");
    }
  };

  const onUpload = async (order: Order, event: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.uploadOrderPhoto(order.id, user.id, String(reader.result));
        onNotify("照片已上传");
        await load();
      } catch (error) {
        onNotify(error instanceof Error ? error.message : "上传失败");
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  if (sessionLoading) {
    return <p className="empty">加载中…</p>;
  }

  if (!user) {
    return (
      <p className="empty">
        <strong>还没有账号</strong>
        先去「我的」创建账号名，再来看活动
      </p>
    );
  }

  return (
    <div>
      <div className="join-row">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="输入分享码加入"
          maxLength={8}
        />
        <button type="button" className="btn btn-primary btn-sm" disabled={joining} onClick={() => void onJoin()}>
          加入
        </button>
      </div>

      {loading ? (
        <p className="empty">加载活动…</p>
      ) : orders.length === 0 ? (
        <p className="empty">
          <strong>暂无活动</strong>
          在菜单里发起，或输入分享码加入
        </p>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="order-card">
            <div className="order-card-head">
              <strong>活动 #{order.id}</strong>
              <StatusBadge status={order.status} />
            </div>
            <div className="order-meta">
              发起人 {order.userName} · 约定 {formatDateTime(order.scheduledAt)}
            </div>
            {order.replyNote ? <div className="reply-note">答复：{order.replyNote}</div> : null}
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

            {order.status === "completed" ? (
              <div className="phone-eat">
                <strong>手机先吃</strong>
                <div className="photo-grid">
                  {order.photos.map((photo) => (
                    <div key={photo.id} className="photo-cell">
                      <img src={photo.imageDataUrl} alt={photo.userName} />
                      <span>{photo.userName}</span>
                    </div>
                  ))}
                </div>
                <label className="btn btn-secondary btn-sm">
                  上传照片
                  <input type="file" accept="image/*" hidden onChange={(e) => void onUpload(order, e)} />
                </label>
              </div>
            ) : null}

            <div className="row-actions" style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void onShare(order)}>
                分享
              </button>
              {order.status === "open" ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void openAdd(order)}>
                  加菜
                </button>
              ) : null}
              {order.userId === user.id && (order.status === "open" || order.status === "replied") ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void onWithdraw(order)}>
                  撤回
                </button>
              ) : null}
              {order.userId === user.id && order.status !== "withdrawn" && order.status !== "completed" ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void onComplete(order)}>
                  完成
                </button>
              ) : null}
            </div>
          </article>
        ))
      )}

      {addingId != null ? (
        <div className="modal-mask">
          <div className="modal-panel">
            <h3>加菜</h3>
            <p style={{ color: "var(--mist)", fontSize: 13 }}>只能添加，不能改别人的菜</p>
            <div className="pick-list">
              {dishes.map((dish) => (
                <label key={dish.id} className="pick-row">
                  <input
                    type="checkbox"
                    checked={picked.includes(dish.id)}
                    onChange={() =>
                      setPicked((current) =>
                        current.includes(dish.id)
                          ? current.filter((id) => id !== dish.id)
                          : [...current, dish.id],
                      )
                    }
                  />
                  {dish.name}
                </label>
              ))}
            </div>
            <div className="row-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAddingId(null)}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void submitAdd()}>
                确认
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
