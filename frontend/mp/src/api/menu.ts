import type { Dish, DishCategory } from '@our-pact/shared'
import { http } from './http'

/** 菜单与分类，与 shared/api/menu 的端点保持一致。 */
export function listCategories(): Promise<DishCategory[]> {
  return http.get<DishCategory[]>('/menu/categories')
}

export function listDishes(activeOnly: boolean): Promise<Dish[]> {
  return http.get<Dish[]>(`/menu/dishes?activeOnly=${activeOnly ? 'true' : 'false'}`)
}
