<template>
  <section>
    <div class="head">
      <div>
        <h2>用户列表</h2>
        <p>约饭昵称列表（活动分享用的本地昵称）。登录账号在个人中心管理。</p>
      </div>
    </div>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column prop="name" label="账号名" min-width="160" />
      <el-table-column label="创建时间" min-width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column prop="activityCount" label="活动数" width="100" />
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDateTime, pactApi, type GuestUser } from '@our-pact/shared'

const users = ref<GuestUser[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    users.value = await pactApi.listUsers()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.head {
  margin-bottom: 16px;
}

.head h2 {
  margin: 0;
  font-size: 26px;
}

.head p {
  margin: 6px 0 0;
  color: #8a8680;
}
</style>
