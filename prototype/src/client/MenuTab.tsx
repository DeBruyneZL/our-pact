import { Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useSession } from "../context/SessionContext";
import type { CartDishSelection, Dish, DishCategory } from "../types/shanyue";
import { defaultScheduleValue } from "../utils/format";

interface MenuTabProps {
  onNotify: (message: string) => void;
  onSubmitted: () => void;
}

/**
 * C 端 · 菜单选菜与下单。
 */
export function MenuTab({ onNotify, onSubmitted }: MenuTabProps) {
  const { user } = useSession();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<number, CartDishSelection>>({});
  const [step, setStep] = useState<"menu" | "schedule">("menu");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleValue());
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dishList, categoryList] = await Promise.all([api.listDishes(true), api.listCategories()]);
      setDishes(dishList);
      setCategories(categoryList);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "加载菜单失败");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedList = useMemo(() => Object.values(selected), [selected]);
  const selectedCount = selectedList.length;
  const filteredDishes = useMemo(() => {
    if (!activeCategoryId) return dishes;
    return dishes.filter((dish) => dish.categoryId === activeCategoryId);
  }, [activeCategoryId, dishes]);

  const toggleDish = (dish: Dish) => {
    setSelected((current) => {
      if (current[dish.id]) {
        const next = { ...current };
        delete next[dish.id];
        return next;
      }
      const options: Record<number, number | null> = {};
      for (const group of dish.optionGroups) {
        options[group.id] = null;
      }
      return {
        ...current,
        [dish.id]: { dishId: dish.id, note: "", options },
      };
    });
  };

  const updateSelection = (dishId: number, patch: Partial<CartDishSelection>) => {
    setSelected((current) => {
      const prev = current[dishId];
      if (!prev) {
        return current;
      }
      return { ...current, [dishId]: { ...prev, ...patch } };
    });
  };

  const goSchedule = () => {
    if (!user) {
      onNotify("请先在「我的」创建账号名");
      return;
    }
    if (selectedCount === 0) {
      onNotify("请至少选择一道菜");
      return;
    }
    setStep("schedule");
  };

  const submit = async () => {
    if (!user) {
      onNotify("请先在「我的」创建账号名");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createOrder({
        userId: user.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        items: selectedList.map((item) => ({
          dishId: item.dishId,
          note: item.note.trim() || undefined,
          options: Object.entries(item.options)
            .filter(([, valueId]) => valueId != null)
            .map(([groupId, valueId]) => ({
              groupId: Number(groupId),
              valueId: valueId as number,
            })),
        })),
      });
      setSelected({});
      setStep("menu");
      setScheduledAt(defaultScheduleValue());
      onNotify(`已发起，分享码 ${created.shareCode}`);
      onSubmitted();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "schedule") {
    return (
      <div className="wizard">
        <div className="wizard-steps">
          <span>1 选菜</span>
          <span className="active">2 约时间</span>
          <span>3 提交</span>
        </div>
        <div className="panel" style={{ padding: 16 }}>
          <p style={{ marginTop: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            已选 {selectedCount} 道菜，发起人：<strong>{user?.name}</strong>
          </p>
          <div className="field">
            <label htmlFor="schedule">约定日期和时间</label>
            <input
              id="schedule"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setStep("menu")} disabled={submitting}>
            返回
          </button>
          <button type="button" className="btn btn-wood" style={{ flex: 1 }} onClick={() => void submit()} disabled={submitting}>
            {submitting ? "提交中…" : "提交活动"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {categories.length > 0 ? (
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={`filter-chip ${activeCategoryId === 0 ? "active" : ""}`}
            onClick={() => setActiveCategoryId(0)}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`filter-chip ${activeCategoryId === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="empty">加载菜单…</p>
      ) : filteredDishes.length === 0 ? (
        <p className="empty">
          <strong>菜单空空</strong>
          等管理员上架几道家常菜
        </p>
      ) : (
        filteredDishes.map((dish) => {
          const isSelected = Boolean(selected[dish.id]);
          const selection = selected[dish.id];
          return (
            <article key={dish.id} className={`dish-card ${isSelected ? "selected" : ""}`}>
              <button
                type="button"
                className="dish-card-top"
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  padding: 0,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
                onClick={() => toggleDish(dish)}
              >
                <span className="dish-check">{isSelected ? <Check size={14} /> : null}</span>
                {dish.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt=""
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                  />
                ) : null}
                <div>
                  <h3>{dish.name}</h3>
                  <p>{dish.description || "家常味道"}</p>
                </div>
              </button>
              {isSelected && selection ? (
                <div className="dish-options">
                  {dish.optionGroups.map((group) => (
                    <div key={group.id}>
                      <div className="option-group-label">{group.name}（可选）</div>
                      <div className="chip-row">
                        <button
                          type="button"
                          className={`chip ${selection.options[group.id] == null ? "active" : ""}`}
                          onClick={() =>
                            updateSelection(dish.id, {
                              options: { ...selection.options, [group.id]: null },
                            })
                          }
                        >
                          不选
                        </button>
                        {group.values.map((value) => (
                          <button
                            key={value.id}
                            type="button"
                            className={`chip ${selection.options[group.id] === value.id ? "active" : ""}`}
                            onClick={() =>
                              updateSelection(dish.id, {
                                options: { ...selection.options, [group.id]: value.id },
                              })
                            }
                          >
                            {value.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="field">
                    <label>备注（可选）</label>
                    <input
                      value={selection.note}
                      placeholder="少油 / 不要香菜…"
                      onChange={(e) => updateSelection(dish.id, { note: e.target.value })}
                    />
                  </div>
                </div>
              ) : null}
            </article>
          );
        })
      )}

      {selectedCount > 0 ? (
        <div className="cart-bar">
          <span>已选 {selectedCount} 道</span>
          <button type="button" className="btn btn-sm" onClick={goSchedule}>
            下一步
          </button>
        </div>
      ) : null}
    </div>
  );
}
