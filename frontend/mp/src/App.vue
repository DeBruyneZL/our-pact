<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// 冷启动先换新 token；各页 ensureLogin 会等这次完成，避免旧令牌打出 401
onLaunch(() => {
  void auth.silentLogin().catch(() => {
    // 登录失败留给页面 ensureLogin 再试，避免打断启动
  })
})
</script>

<style>
page {
  background: #f7f5f0;
  color: #2c2a26;
  font-size: 14px;
}
</style>
