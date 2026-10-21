import { useCallback, useState } from "react";
import { ClipboardList, Soup, Users } from "lucide-react";
import { Toast } from "../components/Toast";
import { DishesPage } from "./DishesPage";
import { OrdersPage } from "./OrdersPage";
import { UsersPage } from "./UsersPage";

type AdminTab = "dishes" | "orders" | "users";

interface AdminAppProps {
  onSwitchClient: () => void;
}

/**
 * 管理端壳：菜单 / 活动 / 用户。
 */
export function AdminApp({ onSwitchClient }: AdminAppProps) {
  const [tab, setTab] = useState<AdminTab>("dishes");
  const [toast, setToast] = useState<string | null>(null);
  const notify = useCallback((message: string) => setToast(message), []);

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-brand">
          <div className="mark">Admin</div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <img src="/logo.svg" alt="" width={32} height={32} />
            饭否
          </h1>
        </div>
        <button type="button" className={tab === "dishes" ? "active" : ""} onClick={() => setTab("dishes")}>
          <Soup size={18} /> 菜单维护
        </button>
        <button type="button" className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
          <ClipboardList size={18} /> 活动记录
        </button>
        <button type="button" className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          <Users size={18} /> 用户列表
        </button>
        <div className="nav-foot">
          开发切换：
          <button type="button" onClick={onSwitchClient}>
            打开 C 端
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {tab === "dishes" ? <DishesPage onNotify={notify} /> : null}
        {tab === "orders" ? <OrdersPage onNotify={notify} /> : null}
        {tab === "users" ? <UsersPage onNotify={notify} /> : null}
      </main>
      <Toast message={toast} onClear={() => setToast(null)} />
    </div>
  );
}
