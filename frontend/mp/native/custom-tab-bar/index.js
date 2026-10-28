Component({
  data: {
    selected: 0,
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
  methods: {
    onSwitch(event) {
      const { index, path } = event.currentTarget.dataset
      this.setData({ selected: Number(index) })
      wx.switchTab({ url: path })
    },
  },
})
