<template>
  <section v-loading="loading">
    <button class="back" type="button" @click="back">返回活动记录</button>

    <div v-if="errorMessage" class="empty">{{ errorMessage }}</div>

    <template v-else-if="activity">
      <header class="hero">
        <div class="hero-main">
          <div class="title-row">
            <h2>{{ activity.name }}</h2>
            <el-tag :type="statusType(activity.status)" effect="light">{{ statusLabel(activity.status) }}</el-tag>
          </div>
          <p class="lead">{{ activity.userName }} 发起 · 创建于 {{ formatDateTime(activity.createdAt) }}</p>
        </div>
        <div class="hero-actions">
          <el-button v-if="activity.status === 'open'" type="primary" @click="onReply">答复</el-button>
          <el-button v-if="activity.status === 'open'" type="danger" plain @click="onReject">驳回</el-button>
          <el-button type="danger" plain @click="onDelete">删除</el-button>
        </div>
        <dl class="facts">
          <div v-for="fact in facts" :key="fact.label">
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
      </header>

      <div class="sheet">
        <div id="seats" class="primary">
          <h3>这一桌</h3>
          <p class="section-note">{{ seats.length }} 位参与，合计 {{ activity.totalPeople || seats.length }} 人到场，已点 {{ activity.items.length }} 道菜。</p>
          <article v-for="seat in seats" :key="seat.id" class="seat">
            <div class="seat-head">
              <el-avatar :size="44" :src="seat.avatar || undefined">{{ initial(seat.name) }}</el-avatar>
              <div class="seat-name">
                <strong>{{ seat.name }}</strong>
                <span>{{ seat.owner ? '发起人' : '参与人' }} · 这一方 {{ seat.peopleCount || 1 }} 人</span>
              </div>
              <em>{{ seat.items.length }} 道</em>
            </div>
            <p v-if="!seat.items.length" class="quiet">还没有加菜</p>
            <div v-else class="mini-list">
              <div v-for="item in seat.items" :key="item.id" class="mini">
                <el-image
                  v-if="item.dishImageUrl"
                  :src="item.dishImageUrl"
                  :preview-src-list="[item.dishImageUrl]"
                  fit="cover"
                  class="mini-cover"
                  preview-teleported
                />
                <div v-else class="mini-cover empty-cover">菜</div>
                <div class="mini-text">
                  <strong>{{ item.dishName }}</strong>
                  <span>{{ itemMeta(item) || '没有特殊项' }}</span>
                </div>
              </div>
            </div>
          </article>
          <p v-if="!seats.length" class="quiet">还没有参与人</p>
        </div>

        <aside class="side">
          <h3>过程</h3>
          <ol class="rail">
            <li v-for="mark in marks" :key="mark.label">
              <strong>{{ mark.label }}</strong>
              <span v-if="mark.time">{{ formatDateTime(mark.time) }}</span>
              <p>{{ mark.note }}</p>
            </li>
          </ol>
        </aside>
      </div>

      <section id="photos" class="photos">
        <h3>照片</h3>
        <p v-if="!activity.photos.length" class="quiet">
          {{ activity.status === 'completed' ? '完成后还没有人上传照片。' : '活动完成后，参与人可以上传照片。' }}
        </p>
        <div v-else class="photo-grid">
          <figure v-for="photo in activity.photos" :key="photo.id">
            <el-image
              v-if="photo.url"
              :src="photo.url"
              :preview-src-list="photoUrls"
              :initial-index="photoIndex(photo.url)"
              fit="cover"
              preview-teleported
            />
            <figcaption>
              <strong>{{ photo.userName }}</strong>
              <span>{{ formatDateTime(photo.createdAt) }}</span>
            </figcaption>
          </figure>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  activityStatusLabel,
  deleteActivity,
  formatDateTime,
  getActivity,
  rejectActivity,
  replyActivity,
  type Activity,
  type ActivityItem,
  type ActivityParticipant,
  type ActivityStatus,
} from '@our-pact/shared'

interface Seat extends ActivityParticipant {
  items: ActivityItem[]
}

interface Mark {
  label: string
  time: string | null
  note: string
}

const route = useRoute()
const router = useRouter()
const activity = ref<Activity | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const activityId = computed(() => Number(route.params.id))

const facts = computed(() => {
  const current = activity.value
  if (!current) return []
  return [
    { label: '活动时间', value: formatDateTime(current.scheduledAt) },
    { label: '地点', value: current.location || '-' },
    { label: '发起方人数', value: `${current.peopleCount || 1} 人` },
    { label: '到场合计', value: `${current.totalPeople || current.participants.length} 人` },
    { label: '分享码', value: current.shareCode || '-' },
  ]
})

const seats = computed(() => {
  const current = activity.value
  if (!current) return [] as Seat[]
  const map = new Map<number, Seat>()
  for (const person of current.participants || []) {
    map.set(person.id, { ...person, owner: Boolean(person.owner), items: [] })
  }
  for (const item of current.items || []) {
    const seat = map.get(item.addedByUserId)
    if (seat) {
      seat.items.push(item)
      continue
    }
    map.set(item.addedByUserId, {
      id: item.addedByUserId,
      name: item.addedByUserName || '未知',
      avatar: item.addedByUserAvatar,
      owner: false,
      peopleCount: 1,
      items: [item],
    })
  }
  return [...map.values()].sort((a, b) => Number(Boolean(b.owner)) - Number(Boolean(a.owner)))
})

const marks = computed(() => {
  const current = activity.value
  if (!current) return [] as Mark[]
  const list: Mark[] = [
    { label: '发起', time: current.createdAt, note: `${current.userName} 发起了这场活动` },
  ]
  if (current.repliedAt || current.replyNote) {
    list.push({
      label: '答复',
      time: current.repliedAt,
      note: current.replyNote || '已确认，名称、时间和地点不能再改',
    })
  }
  if (current.status === 'withdrawn') {
    list.push({ label: '取消', time: current.withdrawnAt, note: '发起人取消了活动，不计入点菜次数' })
  }
  if (current.status === 'rejected') {
    list.push({ label: '驳回', time: null, note: '管理员驳回了待确认活动，并通知了发起人' })
  }
  if (current.status === 'completed' || current.completedAt) {
    list.push({ label: '完成', time: current.completedAt, note: '这场活动会计入菜品被点次数' })
  }
  return list
})

const photoUrls = computed(() =>
  (activity.value?.photos || []).map((item) => item.url).filter((item): item is string => Boolean(item)),
)

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

function initial(name?: string | null) {
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

function photoIndex(url?: string | null) {
  const index = photoUrls.value.indexOf(url || '')
  return index < 0 ? 0 : index
}

function back() {
  void router.push({ name: 'activities' })
}

function scrollToHash() {
  const hash = typeof route.hash === 'string' ? route.hash.replace(/^#/, '') : ''
  if (!hash || !activity.value) {
    return
  }
  const target = document.getElementById(hash)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function load() {
  const id = activityId.value
  if (!Number.isFinite(id) || id <= 0) {
    activity.value = null
    errorMessage.value = '活动不存在'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    activity.value = await getActivity(id)
    await nextTick()
    scrollToHash()
  } catch (error) {
    activity.value = null
    errorMessage.value = error instanceof Error ? error.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function onReply() {
  const current = activity.value
  if (!current) return
  try {
    const { value } = await ElMessageBox.prompt('写一句答复（可选）', '答复活动', {
      confirmButtonText: '确认答复',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：好的，我来准备',
      inputValue: current.replyNote || '',
    })
    activity.value = await replyActivity(current.id, value)
    ElMessage.success('已确认，活动改为待参加')
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '答复失败')
  }
}

async function onReject() {
  const current = activity.value
  if (!current) return
  try {
    await ElMessageBox.confirm(`驳回活动「${current.name}」？发起人会收到活动取消通知。`, '驳回活动', {
      type: 'warning',
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
    })
    activity.value = await rejectActivity(current.id)
    ElMessage.success('已驳回，并通知发起人')
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '驳回失败')
  }
}

async function onDelete() {
  const current = activity.value
  if (!current) return
  try {
    await ElMessageBox.confirm(`删除活动「${current.name}」？`, '删除活动', { type: 'warning' })
    await deleteActivity(current.id)
    ElMessage.success('活动已删除')
    back()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

watch(activityId, () => {
  void load()
}, { immediate: true })

watch(
  () => route.hash,
  () => {
    void nextTick(scrollToHash)
  },
)
</script>

<style scoped>
.back {
  padding: 0;
  border: 0;
  background: transparent;
  color: #3d6f5c;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.empty {
  margin-top: 24px;
  padding: 48px 16px;
  text-align: center;
  color: #8a8680;
  background: #f7f5f0;
  border-radius: 16px;
}

.hero {
  margin-top: 14px;
  padding: 22px 24px 8px;
  border: 1px solid #d7e6df;
  border-radius: 18px;
  background: linear-gradient(180deg, #e7f3ec 0%, #fffcf7 120px);
}

.title-row,
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 20px;
}

.hero-main {
  min-width: 0;
  flex: 1;
}

.title-row {
  align-items: center;
}

.title-row h2,
.primary,
.photos {
  scroll-margin-top: 20px;
}

.primary h3,
.side h3,
.photos h3 {
  margin: 0;
  color: #2c2a26;
}

.title-row h2 {
  font-size: 28px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.lead,
.section-note,
.quiet,
.rail span,
.rail p,
.seat-name span,
.mini-text span,
figcaption span {
  color: #8a8680;
}

.lead {
  margin: 8px 0 0;
  font-size: 14px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  width: 100%;
  margin: 18px 0 8px;
  padding: 0;
}

.facts div {
  min-width: 0;
  padding: 14px 16px 14px 0;
}

.facts dt {
  color: #8a8680;
  font-size: 12px;
}

.facts dd {
  margin: 6px 0 0;
  color: #2c2a26;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.sheet {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.7fr);
  gap: 28px;
  margin-top: 28px;
}

.section-note {
  margin: 6px 0 14px;
  font-size: 13px;
}

.seat + .seat {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #efeae2;
}

.seat-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seat-name {
  min-width: 0;
  flex: 1;
}

.seat-name strong,
.mini-text strong,
figcaption strong {
  display: block;
  overflow-wrap: anywhere;
  color: #2c2a26;
}

.seat-name span {
  display: block;
  margin-top: 2px;
  font-size: 12px;
}

.seat-head em {
  flex-shrink: 0;
  color: #3d6f5c;
  font-style: normal;
  font-size: 13px;
  font-weight: 700;
}

.mini-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.mini {
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 8px;
  border-radius: 12px;
  background: #f7f5f0;
}

.mini-cover,
.mini-cover :deep(.el-image) {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 8px;
}

.empty-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e2d8;
  color: #9a958c;
  font-size: 13px;
}

.mini-text {
  min-width: 0;
  padding-top: 2px;
}

.mini-text span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
}

.rail {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.rail li {
  position: relative;
  padding: 0 0 18px 16px;
  border-left: 2px solid #d7e6df;
}

.rail li:last-child {
  padding-bottom: 0;
  border-left-color: transparent;
}

.rail li::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5b8f7a;
}

.rail strong {
  display: block;
  color: #2c2a26;
}

.rail span,
.rail p {
  display: block;
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
}

.photos {
  margin-top: 32px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 14px;
}

figure {
  margin: 0;
}

.photo-grid :deep(.el-image) {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  background: #efeae2;
}

figcaption {
  margin-top: 8px;
}

figcaption span {
  display: block;
  margin-top: 2px;
  font-size: 12px;
}

.quiet {
  margin: 8px 0 0;
  font-size: 13px;
}

@media (max-width: 980px) {
  .facts,
  .sheet,
  .mini-list {
    grid-template-columns: 1fr;
  }
}
</style>
