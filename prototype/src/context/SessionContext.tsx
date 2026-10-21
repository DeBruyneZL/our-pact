import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/client";
import type { User } from "../types/shanyue";

const STORAGE_KEY = "shanyue.currentUserId";

interface SessionContextValue {
  user: User | null;
  loading: boolean;
  setCurrentUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  createOrUpdateName: (name: string) => Promise<User>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * C 端会话：仅本地记住当前用户 ID，资料在 MySQL。
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentUser = useCallback((next: User | null) => {
    setUser(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, String(next.id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const next = await api.getUser(Number(raw));
      setUser(next);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const createOrUpdateName = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error("请输入账号名");
      }
      if (user) {
        const next = await api.updateUser(user.id, trimmed);
        setCurrentUser(next);
        return next;
      }
      const next = await api.createUser(trimmed);
      setCurrentUser(next);
      return next;
    },
    [setCurrentUser, user],
  );

  const value = useMemo(
    () => ({ user, loading, setCurrentUser, refreshUser, createOrUpdateName }),
    [user, loading, setCurrentUser, refreshUser, createOrUpdateName],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
