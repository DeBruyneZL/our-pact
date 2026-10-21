import { ClipboardList, Soup, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { Toast } from "../components/Toast";
import { MenuTab } from "./MenuTab";
import { MineTab } from "./MineTab";
import { OrdersTab } from "./OrdersTab";

type ClientTab = "menu" | "orders" | "mine";

interface ClientAppProps {
  onSwitchAdmin: () => void;
}

/**
 * C 端手机壳：菜单 / 活动 / 我的。
 */
export function ClientApp({ onSwitchAdmin }: ClientAppProps) {
  const [tab, setTab] = useState<ClientTab>("menu");
  const [toast, setToast] = useState<string | null>(null);
  const [ordersKey, setOrdersKey] = useState(0);
  const notify = useCallback((message: string) => setToast(message), []);

  const titles: Record<ClientTab, string> = {
    menu: "今天想吃什么",
    orders: "我的活动",
    mine: "我的",
  };

  return (
    <div className="client-stage">
      <div className="phone-shell">
        <header className="phone-header">
          <div className="brand">
            <img src="/logo.svg" alt="" width={22} height={22} />
            饭否
          </div>
          <h1>{titles[tab]}</h1>
        </header>
        <div className="phone-body">
          {tab === "menu" ? (
            <MenuTab
              onNotify={notify}
              onSubmitted={() => {
                setOrdersKey((key) => key + 1);
                setTab("orders");
              }}
            />
          ) : null}
          {tab === "orders" ? <OrdersTab onNotify={notify} refreshKey={ordersKey} /> : null}
          {tab === "mine" ? <MineTab onNotify={notify} /> : null}
        </div>
        <nav className="phone-tabs">
          <button type="button" className={`phone-tab ${tab === "menu" ? "active" : ""}`} onClick={() => setTab("menu")}>
            <Soup size={18} />
            菜单
          </button>
          <button
            type="button"
            className={`phone-tab ${tab === "orders" ? "active" : ""}`}
            onClick={() => setTab("orders")}
          >
            <ClipboardList size={18} />
            活动
          </button>
          <button type="button" className={`phone-tab ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>
            <UserRound size={18} />
            我的
          </button>
        </nav>
      </div>
      <div className="switch-link">
        开发切换：
        <button type="button" onClick={onSwitchAdmin}>
          打开管理端
        </button>
      </div>
      <Toast message={toast} onClear={() => setToast(null)} />
    </div>
  );
}
