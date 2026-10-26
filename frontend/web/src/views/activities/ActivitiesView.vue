<template>
  <section>
    <div class="head">
      <div>
        <h2>活动记录</h2>
        <p>答复不是审批，不挡住分享和加菜。答复之后不能再改名称、时间、地点，也不能删菜。发起人仍可撤回。</p>
      </div>
    </div>

    <div v-if="unreadNotices.length" class="notices">
      <div v-for="notice in unreadNotices" :key="notice.id" class="notice">
        <span>{{ notice.message }}</span>
        <el-button link type="primary" @click="markRead(notice.id)">知道了</el-button>
      </div>
    </div>

    <div class="filters">
      <el-radio-group v-model="filter" @change="onFilter">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="open">待答复</el-radio-button>
        <el-radio-button label="replied">已答复</el-radio-button>
        <el-radio-button label="withdrawn">已撤回</el-radio-button>
        <el-radio-button label="completed">已完成</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="activities" v-loading="loading" stripe>
      <el-table-column label="活动" min-width="180">
        <template #default="{ row }">
          <strong>{{ row.name }}</strong>
          <div class="muted">{{ row.userName }} · {{ formatDateTime(row.scheduledAt) }}</div>
          <div class="muted">{{ row.location }}</div>
        </template>
      </el-table-column>
      <el-table-column label="参与人" min-width="140">
        <template #default="{ row }">{{ participantNames(row) }}</template>
      </el-table-column>
      <el-table-column label="菜品" min-width="220">
        <template #default="{ row }">
          <span v-if="!row.items.length" class="muted">还没有菜</span>
          <div v-for="item in row.items" :key="item.id" class="item-line">
            {{ item.dishName }}
            <small>{{ item.addedByUserName }}{{ itemMeta(item) ? ` · ${itemMeta(item)}` : '' }}</small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="照片" width="88">
        <template #default="{ row }">
          <el-image
            v-if="row.photos.length"
            :src="row.photos[0].url"
            :preview-src-list="photoUrls(row)"
            fit="cover"
            class="thumb"
            preview-teleported
          />
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
          <span v-if="row.replyNote">{{ row.replyNote }}</span>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button v-if="row.status === 'open'" link type="primary" @click="onReply(row)">答复</el-button>
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
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteActivity,
  formatDateTime,
  listActivityNotices,
  pageManageActivities,
  readActivityNotice,
  replyActivity,
  type Activity,
  type ActivityItem,
  type ActivityStatus,
  type AdminNotice,
} from '@our-pact/shared'

const activities = ref<Activity[]>([])
const notices = ref<AdminNotice[]>([])
const loading = ref(false)
const filter = ref<'all' | ActivityStatus>('all')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

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

function participantNames(row: Activity) {
  const names = row.participants.map((item) => `${item.name} ${item.peopleCount || 1}人`).join('、')
  return names ? `${names}（共 ${row.totalPeople || row.participants.length} 人）` : '—'
}

function photoUrls(row: Activity) {
  return row.photos.map((item) => item.url).filter((item): item is string => Boolean(item))
}

async function loadNotices() {
  notices.value = await listActivityNotices()
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
    await loadNotices()
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
    ElMessage.success('已答复。名称、时间和地点不能再改，已分享的加菜不受影响')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '答复失败')
  }
}

async function markRead(id: number) {
  try {
    await readActivityNotice(id)
    await loadNotices()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
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

.thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
