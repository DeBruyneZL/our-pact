import { useState, type FormEvent } from "react";
import type { Dish, DishCategory, DishDraft } from "../types/shanyue";

interface OptionGroupDraft {
  name: string;
  valuesText: string;
}

interface DishFormProps {
  initial?: Dish | null;
  categories: DishCategory[];
  onCancel: () => void;
  onSubmit: (draft: DishDraft) => Promise<void>;
}

function toGroups(dish?: Dish | null): OptionGroupDraft[] {
  if (!dish?.optionGroups?.length) {
    return [];
  }
  return dish.optionGroups.map((group) => ({
    name: group.name,
    valuesText: group.values.map((value) => value.label).join("、"),
  }));
}

/**
 * 菜品详情表单：支持多组特殊项。
 */
export function DishForm({ initial, categories, onCancel, onSubmit }: DishFormProps) {
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[0]?.id || 0);
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [groups, setGroups] = useState<OptionGroupDraft[]>(toGroups(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateGroup = (index: number, patch: Partial<OptionGroupDraft>) => {
    setGroups((current) => current.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (!categoryId) {
        throw new Error("请选择分类");
      }
      const draft: DishDraft = {
        categoryId,
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl || null,
        isActive,
        sortOrder: Number(sortOrder) || 0,
        optionGroups: groups
          .map((group) => ({
            name: group.name.trim(),
            values: group.valuesText
              .split(/[,，、]/)
              .map((label) => label.trim())
              .filter(Boolean)
              .map((label) => ({ label })),
          }))
          .filter((group) => group.name && group.values.length > 0),
      };
      await onSubmit(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="dish-category">分类</label>
        <select
          id="dish-category"
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="dish-name">菜名</label>
        <input id="dish-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="dish-desc">描述</label>
        <textarea id="dish-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="dish-image">菜品图片（可选）</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            id="dish-image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) {
                setError("图片请小于 2MB");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setImageUrl(String(reader.result || ""));
              reader.readAsDataURL(file);
            }}
          />
          {imageUrl ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImageUrl("")}>
              清除
            </button>
          ) : null}
        </div>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="预览"
            style={{ marginTop: 10, width: 120, height: 120, objectFit: "cover", borderRadius: 10 }}
          />
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="dish-sort">排序</label>
        <input
          id="dish-sort"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        上架可见
      </label>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <strong>特殊项</strong>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setGroups((current) => [...current, { name: "", valuesText: "" }])}
          >
            添加一组
          </button>
        </div>
        {groups.length === 0 ? (
          <p className="empty" style={{ padding: 16 }}>
            暂无特殊项。例如「辣度」：微辣、中辣、特辣
          </p>
        ) : (
          groups.map((group, index) => (
            <div className="option-editor" key={index} style={{ marginBottom: 10 }}>
              <div className="option-editor-head">
                <strong>第 {index + 1} 组</strong>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setGroups((current) => current.filter((_, i) => i !== index))}
                >
                  移除
                </button>
              </div>
              <div className="field">
                <label>项名</label>
                <input
                  value={group.name}
                  placeholder="如：辣度"
                  onChange={(e) => updateGroup(index, { name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>可选值（用顿号或逗号分隔）</label>
                <input
                  value={group.valuesText}
                  placeholder="微辣、中辣、特辣"
                  onChange={(e) => updateGroup(index, { valuesText: e.target.value })}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {error ? <p style={{ color: "var(--reject)", margin: 0 }}>{error}</p> : null}

      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
