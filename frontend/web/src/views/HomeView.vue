<template>
  <div class="home">
    <section class="welcome">
      <div>
        <p class="eyebrow">超级管理端</p>
        <h2>{{ auth.displayName }}，你好</h2>
        <p class="desc">工作台只展示账号摘要。资料修改请进入个人中心。</p>
      </div>
      <el-button type="primary" size="large" @click="router.push({ name: 'profile' })">进入个人中心</el-button>
    </section>

    <div class="cards">
      <article class="card" v-for="item in cards" :key="item.label">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </div>

    <section class="panel">
      <div class="panel-head">
        <h3>使用说明</h3>
        <span>只读摘要</span>
      </div>
      <ul>
        <li>管理端仅超级管理员可进入，普通用户请使用用户端。</li>
        <li>昵称、手机号、头像在个人中心编辑；用户名与权限不可改。</li>
        <li>手机号唯一，修改后可用于登录。</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatDateTime, maskPhone } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const cards = computed(() => [
  { label: '登录账号', value: auth.profile?.username || '-' },
  { label: '绑定手机', value: maskPhone(auth.profile?.phone) },
  { label: '账号类型', value: '超级管理员' },
  { label: '注册时间', value: formatDateTime(auth.profile?.createTime) },
])

onMounted(() => {
  auth.ensureProfile().catch(() => undefined)
})
</script>

<style scoped>
.home {
  display: grid;
  gap: 18px;
}

.welcome {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 30px;
  border-radius: 22px;
  background:
    radial-gradient(circle at 88% 18%, rgba(90, 180, 130, 0.22), transparent 34%),
    linear-gradient(135deg, #102319, #1a3a2b 58%, #143224);
  color: #f4faf6;
  box-shadow: 0 16px 36px rgba(16, 35, 25, 0.18);
}

.eyebrow {
  margin: 0;
  color: #9fd0b4;
  font-size: 13px;
  letter-spacing: 0.08em;
}

.welcome h2 {
  margin: 10px 0 0;
  font-size: 30px;
  font-weight: 650;
}

.desc {
  max-width: 520px;
  margin: 12px 0 0;
  color: rgba(244, 250, 246, 0.78);
  line-height: 1.65;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.card,
.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
}

.card {
  padding: 18px 20px;
  box-shadow: 0 8px 20px rgba(20, 40, 30, 0.03);
}

.card span {
  color: var(--muted);
  font-size: 13px;
}

.card strong {
  display: block;
  margin-top: 12px;
  font-size: 18px;
  letter-spacing: 0.01em;
}

.panel {
  padding: 22px 24px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel h3 {
  margin: 0;
  font-size: 16px;
}

.panel-head span {
  color: var(--muted);
  font-size: 12px;
}

.panel ul {
  margin: 0;
  padding-left: 18px;
  color: #44534c;
  line-height: 1.85;
}

@media (max-width: 960px) {
  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .welcome {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
