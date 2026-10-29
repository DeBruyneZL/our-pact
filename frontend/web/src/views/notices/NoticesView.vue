<template>
  <section>
    <div class="head">
      <div>
        <h2>消息记录</h2>
        <p>活动取消等通知。标成已读后仍保留在这里。</p>
      </div>
    </div>

    <el-table :data="notices" v-loading="loading" stripe>
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="内容" min-width="280">
        <template #default="{ row }">{{ row.message }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.read ? 'info' : 'warning'" effect="light">{{ row.read ? '已读' : '未读' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button v-if="!row.read" link type="primary" @click="markRead(row.id)">知道了</el-button>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDateTime, listActivityNotices, readActivityNotice, type AdminNotice } from '@our-pact/shared'

const notices = ref<AdminNotice[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    notices.value = await listActivityNotices()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function markRead(id: number) {
  try {
    await readActivityNotice(id)
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
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

.head p,
.muted {
  margin: 6px 0 0;
  color: #8a8680;
  font-size: 13px;
}
</style>
