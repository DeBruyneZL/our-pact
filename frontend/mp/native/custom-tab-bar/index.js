function readSafeBottom() {
  try {
    const info = wx.getWindowInfo()
    if (info && info.screenHeight && info.safeArea && info.safeArea.bottom != null) {
      return Math.max(0, info.screenHeight - info.safeArea.bottom)
    }
  } catch (error) {
    // 冷启动读不到窗口时再试系统信息
  }
  try {
    const sys = wx.getSystemInfoSync()
    if (sys.safeAreaInsets && sys.safeAreaInsets.bottom) {
      return sys.safeAreaInsets.bottom
    }
    if (sys.screenHeight && sys.safeArea && sys.safeArea.bottom != null) {
      return Math.max(0, sys.screenHeight - sys.safeArea.bottom)
    }
  } catch (error) {
    // 保留 0，下次页面显示再量
  }
  return 0
}

Component({
  data: {
    selected: 0,
    hidden: false,
    safeBottom: readSafeBottom(),
    list: [
      {
        pagePath: '/pages/menu/menu',
        text: '点菜',
        iconPath: '/static/tab/menu.png',
        selectedIconPath: '/static/tab/menu-active.png',
      },
      {
        pagePath: '/pages/activity/activity',
        text: '活动',
        iconPath: '/static/tab/activity.png',
        selectedIconPath: '/static/tab/activity-active.png',
      },
      {
        pagePath: '/pages/mine/mine',
        text: '我的',
        iconPath: '/static/tab/mine.png',
        selectedIconPath: '/static/tab/mine-active.png',
      },
    ],
  },
  lifetimes: {
    attached() {
      this.applySafeBottom()
    },
  },
  pageLifetimes: {
    show() {
      this.applySafeBottom()
    },
  },
  methods: {
    applySafeBottom() {
      const safeBottom = readSafeBottom()
      if (safeBottom !== this.data.safeBottom) {
        this.setData({ safeBottom })
      }
    },
    onSwitch(event) {
      const { index, path } = event.currentTarget.dataset
      this.setData({ selected: Number(index) })
      wx.switchTab({ url: path })
    },
  },
})
