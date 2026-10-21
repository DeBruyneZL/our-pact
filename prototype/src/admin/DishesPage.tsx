import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { Dish, DishCategory, DishDraft } from "../types/shanyue";
import { DishForm } from "./DishForm";

interface DishesPageProps {
  onNotify: (message: string) => void;
}

/**
 * 管理端 · 菜单维护（含分类）。
 */
export function DishesPage({ onNotify }: DishesPageProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Dish | null | "new">(null);
  const [deleting, setDeleting] = useState<Dish | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dishList, categoryList] = await Promise.all([api.listDishes(), api.listCategories()]);
      setDishes(dishList);
      setCategories(categoryList);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!filterCategoryId) return dishes;
    return dishes.filter((dish) => dish.categoryId === filterCategoryId);
  }, [dishes, filterCategoryId]);

  const categoryName = (id: number) => categories.find((item) => item.id === id)?.name || "—";

  const handleSave = async (draft: DishDraft) => {
    if (editing && editing !== "new") {
      await api.updateDish(editing.id, draft);
      onNotify("菜品已更新");
    } else {
      await api.createDish(draft);
      onNotify("菜品已创建");
    }
    setEditing(null);
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteDish(deleting.id);
      onNotify("已删除");
      setDeleting(null);
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "删除失败");
    }
  };

  const addCategory = async () => {
    try {
      await api.createCategory({ name: newCategoryName });
      setNewCategoryName("");
      onNotify("分类已添加");
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "添加失败");
    }
  };

  const removeCategory = async (cat: DishCategory) => {
    if (!window.confirm(`删除分类「${cat.name}」？`)) return;
    try {
      await api.deleteCategory(cat.id);
      if (filterCategoryId === cat.id) setFilterCategoryId(0);
      onNotify("分类已删除");
      await load();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "删除失败");
    }
  };

  if (editing !== null) {
    return (
      <section>
        <div className="admin-main-head">
          <div>
            <h2>{editing === "new" ? "新建菜品" : "编辑菜品"}</h2>
            <p>选择分类，维护名称、描述与特殊项。</p>
          </div>
        </div>
        <DishForm
          initial={editing === "new" ? null : editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSubmit={handleSave}
        />
      </section>
    );
  }

  return (
    <section>
      <div className="admin-main-head">
        <div>
          <h2>菜单维护</h2>
          <p>管理分类与菜品，两端菜单按分类同步展示。</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => setManagingCategories(true)}>
            分类管理
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (!categories.length) {
                onNotify("请先添加分类");
                setManagingCategories(true);
                return;
              }
              setEditing("new");
            }}
          >
            新建菜品
          </button>
        </div>
      </div>

      <div className="toolbar">
        <button
          type="button"
          className={`filter-chip ${filterCategoryId === 0 ? "active" : ""}`}
          onClick={() => setFilterCategoryId(0)}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`filter-chip ${filterCategoryId === cat.id ? "active" : ""}`}
            onClick={() => setFilterCategoryId(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty">加载中…</p>
      ) : filtered.length === 0 ? (
        <p className="empty">
          <strong>还没有菜品</strong>
          先新建几道家常菜吧
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>菜品</th>
              <th>分类</th>
              <th>特殊项</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((dish) => (
              <tr key={dish.id}>
                <td>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt=""
                        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }}
                      />
                    ) : null}
                    <div>
                      <strong>{dish.name}</strong>
                      <div style={{ color: "var(--mist)", fontSize: 13, marginTop: 4 }}>{dish.description}</div>
                    </div>
                  </div>
                </td>
                <td>{categoryName(dish.categoryId)}</td>
                <td>
                  {dish.optionGroups.length === 0
                    ? "—"
                    : dish.optionGroups
                        .map((group) => `${group.name}（${group.values.map((v) => v.label).join("/")}）`)
                        .join("；")}
                </td>
                <td>{dish.isActive ? "上架" : "下架"}</td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(dish)}>
                      编辑
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleting(dish)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {managingCategories ? (
        <div className="modal-mask">
          <div className="modal-panel">
            <h3>分类管理</h3>
            <div className="join-row">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="新分类名称"
                maxLength={32}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void addCategory()}>
                添加
              </button>
            </div>
            {categories.map((cat) => (
              <div key={cat.id} className="pick-row" style={{ justifyContent: "space-between" }}>
                <span>
                  {cat.name} <small style={{ color: "var(--mist)" }}>排序 {cat.sortOrder}</small>
                </span>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => void removeCategory(cat)}>
                  删除
                </button>
              </div>
            ))}
            <div className="row-actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setManagingCategories(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除菜品"
        message={deleting ? `删除「${deleting.name}」后不可恢复。` : ""}
        confirmLabel="删除"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
      />
    </section>
  );
}
