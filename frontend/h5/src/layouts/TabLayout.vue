<template>
  <div class="shell">
    <div class="body">
      <router-view />
    </div>
    <van-tabbar route safe-area-inset-bottom>
      <van-tabbar-item replace to="/menu" icon="shop-o">菜单</van-tabbar-item>
      <van-tabbar-item replace to="/activities" icon="orders-o">活动</van-tabbar-item>
      <van-tabbar-item replace to="/mine" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  background: #f7f5f0;
}

.body {
  padding-bottom: 60px;
}
</style>
