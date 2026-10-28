import { getCurrentInstance } from 'vue'

/** 同步自定义 tabBar 选中态。 */
export function syncTabBar(selected: number) {
  const proxy = getCurrentInstance()?.proxy as { getTabBar?: () => { setData: (data: { selected: number }) => void } } | undefined
  const tabBar = proxy?.getTabBar?.()
  tabBar?.setData({ selected })
}
