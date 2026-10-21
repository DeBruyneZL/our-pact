import { useEffect, useState } from "react";
import { AdminApp } from "./admin/AdminApp";
import { ClientApp } from "./client/ClientApp";
import { SessionProvider } from "./context/SessionContext";

type AppSide = "client" | "admin";

function readSide(): AppSide {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin") {
    return "admin";
  }
  return "client";
}

/**
 * 饭否入口：C 端 `/`，管理端 `/admin`。
 */
export default function App() {
  const [side, setSide] = useState<AppSide>(() => readSide());

  useEffect(() => {
    const onPop = () => setSide(readSide());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = (next: AppSide) => {
    const path = next === "admin" ? "/admin" : "/";
    window.history.pushState({}, "", path);
    setSide(next);
  };

  if (side === "admin") {
    return <AdminApp onSwitchClient={() => go("client")} />;
  }

  return (
    <SessionProvider>
      <ClientApp onSwitchAdmin={() => go("admin")} />
    </SessionProvider>
  );
}
