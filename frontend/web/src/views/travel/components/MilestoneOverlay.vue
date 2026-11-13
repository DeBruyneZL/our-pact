<template>
  <Transition name="milestone">
    <div v-if="message" class="milestone-overlay" @click="done">
      <div class="badge">
        <span class="spark"></span>
        <span class="spark spark-2"></span>
        <p class="title">点亮啦</p>
        <p class="text">{{ message }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  message: string | null
}>()

const emit = defineEmits<{
  (e: 'done'): void
}>()

let timer: number | undefined

watch(
  () => props.message,
  (message) => {
    if (timer) {
      window.clearTimeout(timer)
    }
    if (message) {
      timer = window.setTimeout(done, 3200)
    }
  },
)

onBeforeUnmount(() => {
  if (timer) {
    window.clearTimeout(timer)
  }
})

function done() {
  if (timer) {
    window.clearTimeout(timer)
    timer = undefined
  }
  emit('done')
}
</script>

<style scoped>
.milestone-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  background: rgba(44, 42, 38, 0.35);
  cursor: pointer;
}

.badge {
  position: relative;
  display: grid;
  justify-items: center;
  padding: 34px 52px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 18px 48px rgba(44, 42, 38, 0.28);
  text-align: center;
}

.title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #f08c00;
  letter-spacing: 0.1em;
}

.text {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--ink);
}

.spark {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffd166;
  box-shadow: 0 0 12px 4px rgba(255, 176, 46, 0.75);
  animation: orbit 2.6s linear infinite;
}

.spark-2 {
  animation-direction: reverse;
  animation-duration: 3.4s;
}

.milestone-enter-active {
  transition: opacity 0.25s ease;
}

.milestone-enter-from {
  opacity: 0;
}

.milestone-enter-active .badge {
  animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.milestone-leave-active {
  transition: opacity 0.3s ease;
}

.milestone-leave-to {
  opacity: 0;
}

@keyframes orbit {
  from {
    transform: rotate(0deg) translateX(150px) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(150px) rotate(-360deg);
  }
}

@keyframes pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
