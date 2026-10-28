<template>
  <section>
    <div class="head">
      <div>
        <h2>活动记录</h2>
        <p>答复不是审批，不挡住分享和加菜。答复之后不能再改名称、时间、地点。自己加的菜仍可删除。发起人仍可撤回。</p>
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
      <el-table-column label="参与人" width="100">
        <template #default="{ row }">
          <el-button link type="primary" @click="openParticipants(row)">
            {{ row.totalPeople || row.participants.length || 0 }} 人
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="菜品" width="100">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDishes(row)">
            {{ row.items.length }} 道
          </el-button>
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

    <el-dialog
      v-model="participantVisible"
      :title="participantTitle"
      width="560px"
      class="detail-dialog"
      destroy-on-close
    >
      <div v-if="!detailParticipants.length" class="empty-box">还没有参与人</div>
      <template v-else>
        <div class="summary-bar">
          <span>{{ detailParticipants.length }} 位参与</span>
          <span>共 {{ detailTotalPeople }} 人到场</span>
        </div>
        <div class="person-grid">
          <article v-for="item in detailParticipants" :key="item.id" class="person-card">
            <el-avatar :size="52" :src="item.avatar || undefined">{{ nameInitial(item.name) }}</el-avatar>
            <div class="person-body">
              <div class="person-top">
                <strong>{{ item.name }}</strong>
                <el-tag v-if="item.owner" size="small" effect="plain" type="success">发起人</el-tag>
              </div>
              <div class="person-meta">这一方 {{ item.peopleCount || 1 }} 人</div>
            </div>
          </article>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dishVisible"
      :title="dishTitle"
      width="680px"
      class="detail-dialog"
      destroy-on-close
    >
      <div v-if="!detailDishes.length" class="empty-box">还没有菜</div>
      <template v-else>
        <div class="summary-bar">
          <span>已点 {{ detailDishes.length }} 道菜</span>
        </div>
        <div class="dish-grid">
          <article v-for="item in detailDishes" :key="item.id" class="dish-card">
            <div class="dish-cover">
              <el-image
                v-if="item.dishImageUrl"
                :src="item.dishImageUrl"
                :preview-src-list="[item.dishImageUrl]"
                fit="cover"
                preview-teleported
              />
              <div v-else class="dish-cover-empty">暂无封面</div>
            </div>
            <div class="dish-body">
              <strong class="dish-title">{{ item.dishName }}</strong>
              <p v-if="itemMeta(item)" class="dish-options">{{ itemMeta(item) }}</p>
              <div class="dish-adder">
                <el-avatar :size="28" :src="item.addedByUserAvatar || undefined">
                  {{ nameInitial(item.addedByUserName) }}
                </el-avatar>
                <span>{{ item.addedByUserName }} 加的</span>
              </div>
            </div>
          </article>
        </div>
      </template>
    </el-dialog>
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
const participantVisible = ref(false)
const dishVisible = ref(false)
const detailActivity = ref<Activity | null>(null)

const unreadNotices = computed(() => notices.value.filter((item) => !item.read))
const detailParticipants = computed(() => detailActivity.value?.participants || [])
const detailDishes = computed(() => detailActivity.value?.items || [])
const detailTotalPeople = computed(
  () => detailActivity.value?.totalPeople || detailParticipants.value.length,
)
const participantTitle = computed(() =>
  detailActivity.value ? `参与人 · ${detailActivity.value.name}` : '参与人',
)
const dishTitle = computed(() =>
  detailActivity.value ? `菜品 · ${detailActivity.value.name}` : '菜品',
)

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

function nameInitial(name?: string | null) {
  return (name || '用').slice(0, 1)
}

function itemMeta(item: ActivityItem) {
  return [
    ...item.options.map((opt) => `${opt.groupName}：${opt.optionLabel}`),
    item.note ? `备注：${item.note}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function photoUrls(row: Activity) {
  return row.photos.map((item) => item.url).filter((item): item is string => Boolean(item))
}

function openParticipants(row: Activity) {
  detailActivity.value = row
  participantVisible.value = true
}

function openDishes(row: Activity) {
  detailActivity.value = row
  dishVisible.value = true
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

.empty-box {
  padding: 36px 16px;
  text-align: center;
  color: #8a8680;
  background: #f7f5f0;
  border-radius: 12px;
}

.summary-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #eef5f1;
  color: #3d6f5c;
  font-size: 13px;
  font-weight: 600;
}

.person-grid {
  display: grid;
  gap: 10px;
}

.person-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  background: #fffcf7;
}

.person-body {
  min-width: 0;
  flex: 1;
}

.person-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.person-top strong {
  font-size: 15px;
  color: #2f2c28;
}

.person-meta {
  margin-top: 4px;
  color: #8a8680;
  font-size: 13px;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dish-card {
  overflow: hidden;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  background: #fffcf7;
}

.dish-cover {
  width: 100%;
  height: 148px;
  background: #efeae2;
}

.dish-cover :deep(.el-image),
.dish-cover-empty {
  width: 100%;
  height: 100%;
}

.dish-cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a958c;
  font-size: 13px;
}

.dish-body {
  padding: 12px 14px 14px;
}

.dish-title {
  display: block;
  font-size: 15px;
  color: #2f2c28;
}

.dish-options {
  margin: 6px 0 0;
  color: #5c5852;
  font-size: 12px;
  line-height: 1.45;
}

.dish-adder {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: #8a8680;
  font-size: 12px;
}

@media (max-width: 720px) {
  .dish-grid {
    grid-template-columns: 1fr;
  }
}
</style>
