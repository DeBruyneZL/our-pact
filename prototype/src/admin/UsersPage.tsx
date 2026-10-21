import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { User } from "../types/shanyue";
import { formatDateTime } from "../utils/format";

interface UsersPageProps {
  onNotify: (message: string) => void;
}

/**
 * 管理端 · 用户列表。
 */
export function UsersPage({ onNotify }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api.listUsers());
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section>
      <div className="admin-main-head">
        <div>
          <h2>用户列表</h2>
          <p>C 端创建的账号名会出现在这里。</p>
        </div>
      </div>

      {loading ? (
        <p className="empty">加载中…</p>
      ) : users.length === 0 ? (
        <p className="empty">
          <strong>还没有用户</strong>
          朋友在「我的」里创建账号后可见
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>账号名</th>
              <th>创建时间</th>
              <th>活动数</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                </td>
                <td>{formatDateTime(user.createdAt)}</td>
                <td>{user.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
