<template>
  <main class="portal">
    <section class="panel">
      <div class="hero">
        <BrandLogo size="md" />
      </div>
      <p class="eyebrow">登录成功</p>
      <h1>选择要进入的端</h1>
      <p class="desc">你好，{{ auth.displayName }}。你是超级管理员，可以进入管理端或用户端。</p>
      <div class="choices">
        <button class="choice admin" type="button" @click="enterAdmin">
          <strong>管理端</strong>
          <span>菜单、活动与用户管理</span>
        </button>
        <button class="choice h5" type="button" @click="enterH5">
          <strong>用户端</strong>
          <span>选菜约饭与活动分享</span>
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
import BrandLogo from '@/components/BrandLogo.vue'

const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  auth.ensureProfile().catch(() => undefined)
})

function enterAdmin() {
  router.push({ name: 'dishes' })
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
    radial-gradient(circle at 18% 20%, rgba(91, 143, 122, 0.18), transparent 36%),
    linear-gradient(160deg, #f7f5f0, #ebe4da);
}

.panel {
  width: min(720px, 100%);
  padding: 40px 36px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: rgba(255, 252, 247, 0.96);
  box-shadow: 0 18px 40px rgba(44, 42, 38, 0.08);
}

.hero {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.eyebrow {
  margin: 0;
  color: var(--brand);
  letter-spacing: 0.14em;
  font-size: 12px;
  text-align: center;
}

.panel h1 {
  margin: 12px 0 0;
  font-size: 28px;
  text-align: center;
}

.desc {
  margin: 12px 0 0;
  color: var(--muted);
  line-height: 1.6;
  text-align: center;
}

.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 28px;
}

.choice {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 22px 18px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.choice strong {
  display: block;
  font-size: 18px;
  color: var(--ink);
}

.choice span {
  display: block;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
}

.choice.admin:hover {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(91, 143, 122, 0.12);
}

.choice.h5:hover {
  border-color: #b8954a;
  box-shadow: 0 0 0 3px rgba(184, 149, 74, 0.12);
}

.logout {
  display: block;
  margin: 24px auto 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}

@media (max-width: 640px) {
  .choices {
    grid-template-columns: 1fr;
  }
}
</style>
