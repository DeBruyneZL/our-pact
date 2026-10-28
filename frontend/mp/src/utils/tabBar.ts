type TabBarInstance = {
  setData: (data: { selected?: number; hidden?: boolean }) => void
}

type TabPage = {
  getTabBar?: () => TabBarInstance | undefined
}

function currentTabBar(): TabBarInstance | undefined {
  const pages = getCurrentPages() as TabPage[]
  const page = pages[pages.length - 1]
  return page?.getTabBar?.()
}

/** 同步自定义 tabBar 选中态（延迟重试，避免 switchTab 后实例未就绪）。 */
export function syncTabBar(selected: number) {
  const apply = () => {
    currentTabBar()?.setData({ selected, hidden: false })
  }
  apply()
  setTimeout(apply, 50)
  setTimeout(apply, 200)
}

/** 弹层打开时隐藏 tabBar，避免原生层遮挡。 */
export function setTabBarHidden(hidden: boolean) {
  currentTabBar()?.setData({ hidden })
}
