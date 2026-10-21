import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "../context/SessionContext";
import { formatDateTime } from "../utils/format";

interface MineTabProps {
  onNotify: (message: string) => void;
}

/**
 * C 端 · 我的账号名。
 */
export function MineTab({ onNotify }: MineTabProps) {
  const { user, loading, createOrUpdateName } = useSession();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createOrUpdateName(name);
      onNotify(user ? "账号名已更新" : "账号已创建");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="empty">加载中…</p>;
  }

  return (
    <div className="profile-card">
      <h2>{user ? `你好，${user.name}` : "创建你的账号"}</h2>
      <p>
        {user
          ? `发起活动时会带上这个名字。创建于 ${formatDateTime(user.createdAt)}，已有 ${user.orderCount} 场活动。`
          : "起一个好认的名字，家人们就知道是谁约的饭。"}
      </p>
      <form className="form-grid" onSubmit={(event) => void handleSave(event)}>
        <div className="field">
          <label htmlFor="user-name">账号名</label>
          <input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：阿花"
            maxLength={64}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "保存中…" : user ? "更新账号名" : "创建账号"}
        </button>
      </form>
    </div>
  );
}
