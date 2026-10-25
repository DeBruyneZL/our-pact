import { http } from '../request'
import type { Dish, DishCategory, DishDraft } from '../types/pact'

export interface DishImageResult {
  url: string
}

/** 菜单与分类。数据在服务端，管理端和小程序共用。 */
export const menuApi = {
  listCategories(): Promise<DishCategory[]> {
    return http.get('/menu/categories')
  },

  createCategory(payload: { name: string; sortOrder?: number }): Promise<DishCategory> {
    return http.post('/menu/categories', payload)
  },

  updateCategory(id: number, payload: { name: string; sortOrder?: number }): Promise<DishCategory> {
    return http.post(`/menu/categories/${id}`, payload)
  },

  deleteCategory(id: number): Promise<void> {
    return http.post(`/menu/categories/${id}/delete`)
  },

  sortCategories(ids: number[]): Promise<DishCategory[]> {
    return http.post('/menu/categories/sort', { ids })
  },

  listDishes(activeOnly = false, categoryId?: number): Promise<Dish[]> {
    const params = new URLSearchParams()
    if (activeOnly) {
      params.set('activeOnly', 'true')
    }
    if (categoryId != null) {
      params.set('categoryId', String(categoryId))
    }
    const query = params.toString()
    return http.get(`/menu/dishes${query ? `?${query}` : ''}`)
  },

  createDish(draft: DishDraft): Promise<Dish> {
    return http.post('/menu/dishes', draft)
  },

  updateDish(id: number, draft: DishDraft): Promise<Dish> {
    return http.post(`/menu/dishes/${id}`, draft)
  },

  deleteDish(id: number): Promise<void> {
    return http.post(`/menu/dishes/${id}/delete`)
  },

  uploadDishImage(file: File): Promise<DishImageResult> {
    const data = new FormData()
    data.append('file', file)
    return http.postForm('/menu/dishes/image', data)
  },
}

/** 把压缩后的 data URL 还原成可上传的文件。 */
export function fileFromDataUrl(dataUrl: string, filename: string): File {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], filename, { type: mime })
}
