<template>
  <div class="page">
    <section class="hero">
      <div>
        <p>你好，{{ auth.displayName }}</p>
        <h1>饭否</h1>
      </div>
      <span>{{ auth.profile?.superAdmin ? '超级管理员' : '普通用户' }}</span>
    </section>

    <van-cell-group inset class="panel">
      <van-cell title="登录账号" :value="auth.profile?.username || '-'" />
      <van-cell title="绑定手机" :value="maskPhone(auth.profile?.phone)" />
      <van-cell title="注册时间" :value="formatDateTime(auth.profile?.createTime)" />
    </van-cell-group>

    <div class="tip">首页只展示摘要。修改资料请到「我的」再编辑。</div>

    <van-tabbar route safe-area-inset-bottom>
      <van-tabbar-item replace to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { formatDateTime, maskPhone } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  auth.ensureProfile().catch(() => undefined)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 72px;
  background: var(--paper);
}

.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 16px;
  padding: 24px;
  border-radius: 22px;
  background:
    radial-gradient(circle at 90% 10%, rgba(120, 200, 160, 0.25), transparent 36%),
    linear-gradient(145deg, #0f3d2c, #1f6b4a);
  color: #fff;
  box-shadow: 0 12px 28px rgba(16, 50, 35, 0.18);
}

.hero p {
  margin: 0;
  opacity: 0.86;
}

.hero h1 {
  margin: 8px 0 0;
  font-size: 30px;
  font-weight: 680;
}

.hero span {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  white-space: nowrap;
}

.panel {
  overflow: hidden;
  border-radius: 16px;
}

.tip {
  margin: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #e8f1eb;
  color: #456055;
  line-height: 1.55;
  font-size: 13px;
}
</style>
