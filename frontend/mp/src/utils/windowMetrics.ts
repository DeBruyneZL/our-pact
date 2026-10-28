/** 安全读取窗口尺寸，避免开发者工具冷启动时 screenHeight 空指针。 */
export function readWindowMetrics() {
  const fallback = {
    statusBarHeight: 20,
    windowHeight: 667,
    navBarHeight: 44,
    safeAreaBottom: 0,
    /** 自定义 tabBar 内容区高度 */
    tabBarContent: 56,
  }
  try {
    let statusBarHeight = fallback.statusBarHeight
    let windowHeight = fallback.windowHeight
    let safeAreaBottom = fallback.safeAreaBottom

    try {
      const windowInfo = uni.getWindowInfo?.() as
        | {
            statusBarHeight?: number
            windowHeight?: number
            safeArea?: { bottom?: number }
            screenHeight?: number
          }
        | undefined
      if (windowInfo?.statusBarHeight) {
        statusBarHeight = windowInfo.statusBarHeight
      }
      if (windowInfo?.windowHeight) {
        windowHeight = windowInfo.windowHeight
      }
      if (windowInfo?.screenHeight && windowInfo?.safeArea?.bottom != null) {
        safeAreaBottom = Math.max(0, windowInfo.screenHeight - windowInfo.safeArea.bottom)
      }
    } catch {
      // getWindowInfo 在部分基础库冷启动会抛错，改走 systemInfo
    }

    try {
      const sys = uni.getSystemInfoSync?.() as
        | {
            statusBarHeight?: number
            windowHeight?: number
            safeAreaInsets?: { bottom?: number }
            screenHeight?: number
            safeArea?: { bottom?: number }
          }
        | undefined
      if (sys?.statusBarHeight) {
        statusBarHeight = sys.statusBarHeight
      }
      if (sys?.windowHeight) {
        windowHeight = sys.windowHeight
      }
      if (sys?.safeAreaInsets?.bottom != null) {
        safeAreaBottom = Math.max(safeAreaBottom, sys.safeAreaInsets.bottom)
      } else if (sys?.screenHeight && sys?.safeArea?.bottom != null) {
        safeAreaBottom = Math.max(0, sys.screenHeight - sys.safeArea.bottom)
      }
    } catch {
      // 保留兜底值
    }

    let navBarHeight = fallback.navBarHeight
    try {
      const menu = uni.getMenuButtonBoundingClientRect?.()
      if (menu?.height && menu.top) {
        navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height
      }
    } catch {
      // 保留兜底值
    }

    const tabBarHeight = fallback.tabBarContent + safeAreaBottom
    return {
      statusBarHeight,
      windowHeight,
      navBarHeight,
      safeAreaBottom,
      tabBarContent: fallback.tabBarContent,
      tabBarHeight,
    }
  } catch {
    return {
      ...fallback,
      tabBarHeight: fallback.tabBarContent + fallback.safeAreaBottom,
    }
  }
}
