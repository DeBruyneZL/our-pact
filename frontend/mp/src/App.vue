<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// 小程序冷启动即静默登录，用户无感知
onLaunch(() => {
  void auth.silentLogin()
})
</script>

<style>
page {
  background: #f7f5f0;
  color: #2c2a26;
  font-size: 14px;
}
</style>
