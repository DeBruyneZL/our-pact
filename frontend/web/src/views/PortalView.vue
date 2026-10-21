<template>
  <main class="portal">
    <section class="panel">
      <p class="eyebrow">登录成功</p>
      <h1>选择要进入的端</h1>
      <p class="desc">你好，{{ auth.displayName }}。你是超级管理员，可以进入管理端或用户端。</p>
      <div class="choices">
        <button class="choice admin" type="button" @click="enterAdmin">
          <strong>管理端</strong>
          <span>账号与后台工作台</span>
        </button>
        <button class="choice h5" type="button" @click="enterH5">
          <strong>用户端</strong>
          <span>移动端页面体验</span>
        </button>
      </div>
      <button class="logout" type="button" @click="onLogout">退出登录</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { goH5 } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  auth.ensureProfile().catch(() => undefined)
})

function enterAdmin() {
  router.push({ name: 'home' })
}

function enterH5() {
  goH5(auth.token)
}

async function onLogout() {
  await auth.logout()
  await router.replace({ name: 'login' })
}
</script>

<style scoped>
.portal {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 18% 20%, rgba(45, 140, 98, 0.18), transparent 36%),
    linear-gradient(160deg, #0d1a14, #15261d 48%, #101f18);
}

.panel {
  width: min(720px, 100%);
  padding: 40px 36px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.22);
}

.eyebrow {
  margin: 0;
  color: var(--brand);
  letter-spacing: 0.14em;
  font-size: 12px;
}

.panel h1 {
  margin: 12px 0 0;
  font-size: 32px;
}

.desc {
  margin: 12px 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 28px;
}

.choice {
  display: grid;
  gap: 8px;
  padding: 22px 20px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: #f7faf7;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.choice:hover {
  transform: translateY(-2px);
  border-color: #b7d2c4;
  box-shadow: 0 12px 24px rgba(20, 40, 30, 0.08);
}

.choice strong {
  font-size: 20px;
  color: var(--ink);
}

.choice span {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.choice.admin {
  background: linear-gradient(160deg, #edf7f1, #f8fbf9);
}

.logout {
  display: block;
  margin: 24px auto 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

@media (max-width: 700px) {
  .choices {
    grid-template-columns: 1fr;
  }
}
</style>
