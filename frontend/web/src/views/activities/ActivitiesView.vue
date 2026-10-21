<template>
  <section>
    <div class="head">
      <div>
        <h2>活动记录</h2>
        <p>答复活动、查看撤回通知。答复后不可再改活动，不影响此前分享加菜。</p>
      </div>
    </div>

    <div v-if="unreadNotices.length" class="notices">
      <div v-for="notice in unreadNotices" :key="notice.id" class="notice">
        <span>{{ notice.message }}</span>
        <el-button link type="primary" @click="markRead(notice.id)">知道了</el-button>
      </div>
    </div>

    <div class="filters">
      <el-radio-group v-model="filter" @change="() => void load()">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="open">待答复</el-radio-button>
        <el-radio-button label="replied">已答复</el-radio-button>
        <el-radio-button label="withdrawn">已撤回</el-radio-button>
        <el-radio-button label="completed">已完成</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="activities" v-loading="loading" stripe>
      <el-table-column label="发起人" min-width="140">
        <template #default="{ row }">
          <strong>{{ row.userName }}</strong>
          <div class="muted">提交于 {{ formatDateTime(row.createdAt) }}</div>
          <div class="muted">分享码 {{ row.shareCode }}</div>
        </template>
      </el-table-column>
      <el-table-column label="约定时间" min-width="150">
        <template #default="{ row }">{{ formatDateTime(row.scheduledAt) }}</template>
      </el-table-column>
      <el-table-column label="菜品" min-width="240">
        <template #default="{ row }">
          <div v-for="item in row.items" :key="item.id" class="item-line">
            {{ item.dishName }}
            <small>{{ item.addedByUserName }}{{ itemMeta(item) ? ` · ${itemMeta(item)}` : '' }}</small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="答复" min-width="140">
        <template #default="{ row }">
          <span v-if="row.replyNote">{{ row.replyNote }}</span>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="row.status === 'open'" link type="primary" @click="onReply(row)">答复</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  formatDateTime,
  pactApi,
  type Activity,
  type ActivityItem,
  type ActivityStatus,
  type AdminNotice,
} from '@our-pact/shared'

const activities = ref<Activity[]>([])
const notices = ref<AdminNotice[]>([])
const loading = ref(false)
const filter = ref<'all' | ActivityStatus>('all')

const unreadNotices = computed(() => notices.value.filter((item) => !item.read))

function statusLabel(status: ActivityStatus) {
  return {
    open: '待答复',
    replied: '已答复',
    withdrawn: '已撤回',
    completed: '已完成',
  }[status]
}

function statusType(status: ActivityStatus) {
  return {
    open: 'warning',
    replied: 'primary',
    withdrawn: 'info',
    completed: 'success',
  }[status] as 'warning' | 'primary' | 'info' | 'success'
}

function itemMeta(item: ActivityItem) {
  return [
    ...item.options.map((opt) => `${opt.groupName}：${opt.optionLabel}`),
    item.note ? `备注：${item.note}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

async function loadNotices() {
  notices.value = await pactApi.listNotices()
}

async function load() {
  loading.value = true
  try {
    activities.value = await pactApi.listActivities(
      filter.value === 'all' ? undefined : { status: filter.value },
    )
    await loadNotices()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function onReply(row: Activity) {
  try {
    const { value } = await ElMessageBox.prompt('写一句答复（可选）', '答复活动', {
      confirmButtonText: '确认答复',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：好的，我来准备',
      inputValue: '',
    })
    await pactApi.replyActivity(row.id, value)
    ElMessage.success('已答复，活动不可再修改')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '答复失败')
  }
}

async function markRead(id: number) {
  try {
    await pactApi.markNoticeRead(id)
    await loadNotices()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  }
}

async function onDelete(row: Activity) {
  try {
    await ElMessageBox.confirm(`删除 ${row.userName} 的活动 #${row.id}？`, '删除活动', {
      type: 'warning',
    })
    await pactApi.deleteActivity(row.id)
    ElMessage.success('活动已删除')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
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

.filters {
  margin-bottom: 16px;
}

.notices {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff4e5;
  border: 1px solid #f0d7a8;
  font-size: 13px;
}

.item-line {
  margin-bottom: 6px;
  line-height: 1.4;
}

.item-line small {
  display: block;
  color: #8a8680;
}
</style>
