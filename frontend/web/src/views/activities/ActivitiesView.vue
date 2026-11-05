<template>
  <section>
    <div class="head">
      <div>
        <h2>活动记录</h2>
        <p>确认不是审批，不挡住分享和加菜。确认之后不能再改名称、时间、地点。待确认的活动可以驳回，驳回后活动结束，并用活动取消通知告诉发起人。</p>
      </div>
    </div>

    <div class="filters">
      <el-radio-group v-model="filter" @change="onFilter">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="open">{{ activityStatusLabel('open') }}</el-radio-button>
        <el-radio-button label="replied">{{ activityStatusLabel('replied') }}</el-radio-button>
        <el-radio-button label="withdrawn">{{ activityStatusLabel('withdrawn') }}</el-radio-button>
        <el-radio-button label="rejected">{{ activityStatusLabel('rejected') }}</el-radio-button>
        <el-radio-button label="completed">{{ activityStatusLabel('completed') }}</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="activities" v-loading="loading" stripe>
      <el-table-column label="活动" min-width="180">
        <template #default="{ row }">
          <div class="activity-cell">
            <RouterLink class="name-link" :to="detailTo(row)">
              {{ row.name }}
            </RouterLink>
            <div class="muted">{{ row.userName }} · {{ formatDateTime(row.scheduledAt) }}</div>
            <div class="muted">{{ row.location }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="参与人" width="100">
        <template #default="{ row }">
          <RouterLink class="cell-link" :to="detailTo(row, 'seats')">
            {{ row.totalPeople || row.participants.length || 0 }} 人
          </RouterLink>
        </template>
      </el-table-column>
      <el-table-column label="菜品" width="100">
        <template #default="{ row }">
          <RouterLink class="cell-link" :to="detailTo(row, 'seats')">
            {{ row.items.length }} 道
          </RouterLink>
        </template>
      </el-table-column>
      <el-table-column label="照片" width="88">
        <template #default="{ row }">
          <RouterLink v-if="row.photos.length" class="thumb-link" :to="detailTo(row, 'photos')">
            <el-image :src="row.photos[0].url" fit="cover" class="thumb" />
          </RouterLink>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="答复" min-width="140">
        <template #default="{ row }">
          <span v-if="row.replyNote" class="break-text">{{ row.replyNote }}</span>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button v-if="row.status === 'open'" link type="primary" @click="onReply(row)">答复</el-button>
          <el-button v-if="row.status === 'open'" link type="danger" @click="onReject(row)">驳回</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="load"
        @size-change="onSizeChange"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  activityStatusLabel,
  deleteActivity,
  formatDateTime,
  pageManageActivities,
  rejectActivity,
  replyActivity,
  type Activity,
  type ActivityStatus,
} from '@our-pact/shared'

const router = useRouter()

const activities = ref<Activity[]>([])
const loading = ref(false)
const filter = ref<'all' | ActivityStatus>('all')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

function statusLabel(status: ActivityStatus) {
  return activityStatusLabel(status)
}

function statusType(status: ActivityStatus) {
  return {
    open: 'warning',
    replied: 'primary',
    withdrawn: 'info',
    rejected: 'danger',
    completed: 'success',
  }[status] as 'warning' | 'primary' | 'info' | 'success' | 'danger'
}

function detailTo(row: Activity, hash?: 'seats' | 'photos') {
  return {
    name: 'activity-detail' as const,
    params: { id: row.id },
    hash: hash ? `#${hash}` : undefined,
  }
}

function openDetail(row: Activity) {
  void router.push(detailTo(row))
}

async function load() {
  loading.value = true
  try {
    const result = await pageManageActivities({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      status: filter.value === 'all' ? undefined : filter.value,
    })
    activities.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function onFilter() {
  if (pageNum.value === 1) {
    void load()
    return
  }
  pageNum.value = 1
}

function onSizeChange() {
  if (pageNum.value === 1) {
    void load()
    return
  }
  pageNum.value = 1
}

async function onReply(row: Activity) {
  try {
    const { value } = await ElMessageBox.prompt('写一句答复（可选）', '答复活动', {
      confirmButtonText: '确认答复',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：好的，我来准备',
      inputValue: '',
    })
    await replyActivity(row.id, value)
    ElMessage.success('已确认，活动改为待参加。名称、时间和地点不能再改')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '答复失败')
  }
}

async function onReject(row: Activity) {
  try {
    await ElMessageBox.confirm(`驳回活动「${row.name}」？发起人会收到活动取消通知。`, '驳回活动', {
      type: 'warning',
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
    })
    await rejectActivity(row.id)
    ElMessage.success('已驳回，并通知发起人')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '驳回失败')
  }
}

async function onDelete(row: Activity) {
  try {
    await ElMessageBox.confirm(`删除活动「${row.name}」？`, '删除活动', { type: 'warning' })
    await deleteActivity(row.id)
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

.thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.thumb-link {
  display: inline-flex;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.activity-cell,
.break-text {
  overflow-wrap: anywhere;
}

.activity-cell {
  min-width: 0;
  max-width: 100%;
}

.name-link,
.cell-link {
  color: inherit;
  font-weight: 700;
  text-decoration: none;
}

.cell-link {
  color: #3d6f5c;
  font-weight: 600;
}

.name-link:hover,
.cell-link:hover {
  color: #2f5a49;
}

:deep(.el-table .cell) {
  overflow-wrap: anywhere;
}
</style>
