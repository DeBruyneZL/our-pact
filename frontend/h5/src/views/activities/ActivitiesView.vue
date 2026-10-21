<template>
  <div class="page">
    <van-nav-bar title="我的活动">
      <template #left>
        <BrandLogo />
      </template>
    </van-nav-bar>

    <div class="content">
      <div class="join-box">
        <van-field v-model="joinCode" maxlength="8" placeholder="输入分享码加入活动" clearable />
        <van-button size="small" type="primary" round :loading="joining" @click="onJoin">加入</van-button>
      </div>

      <van-loading v-if="loading || guest.loading" class="center" />
      <van-empty v-else-if="!guest.user" description="先去「我的」创建账号名，再来看活动" />
      <van-empty v-else-if="!activities.length" description="暂无活动，在菜单里发起或输入分享码加入" />
      <div v-else>
        <div v-for="item in activities" :key="item.id" class="card">
          <div class="card-head">
            <strong>活动 #{{ item.id }}</strong>
            <van-tag :type="tagType(item.status)">{{ statusLabel(item.status) }}</van-tag>
          </div>
          <div class="meta">
            发起人 {{ item.userName }} · 约定 {{ formatDateTime(item.scheduledAt) }} · 码
            {{ item.shareCode }}
          </div>
          <div v-if="item.replyNote" class="reply">答复：{{ item.replyNote }}</div>

          <div v-for="line in item.items" :key="line.id" class="line">
            <div class="line-main">
              <span>{{ line.dishName }}</span>
              <small class="who">{{ line.addedByUserName }}</small>
            </div>
            <small v-if="lineMeta(line)">{{ lineMeta(line) }}</small>
            <van-button
              v-if="canEdit(item) && line.addedByUserId === guest.user?.id"
              size="mini"
              plain
              type="danger"
              @click="onRemoveItem(item, line.id)"
            >
              移除
            </van-button>
          </div>

          <div v-if="item.status === 'completed'" class="photos">
            <div class="photos-head">手机先吃</div>
            <div v-if="item.photos.length" class="photo-grid">
              <div v-for="photo in item.photos" :key="photo.id" class="photo">
                <img :src="photo.imageDataUrl" :alt="photo.userName" />
                <span>{{ photo.userName }}</span>
              </div>
            </div>
            <van-empty v-else image-size="48" description="还没有照片，先上传一张吧" />
            <van-uploader :after-read="(file) => onUpload(item, file)" :max-count="1" accept="image/*">
              <van-button size="small" plain type="primary" round>上传照片</van-button>
            </van-uploader>
          </div>

          <div class="actions">
            <van-button size="mini" plain type="primary" @click="onShare(item)">分享</van-button>
            <van-button
              v-if="canEdit(item)"
              size="mini"
              plain
              type="primary"
              @click="openAddDish(item)"
            >
              加菜
            </van-button>
            <van-button
              v-if="item.userId === guest.user?.id && (item.status === 'open' || item.status === 'replied')"
              size="mini"
              plain
              type="warning"
              @click="onWithdraw(item)"
            >
              撤回
            </van-button>
            <van-button
              v-if="item.userId === guest.user?.id && item.status !== 'withdrawn' && item.status !== 'completed'"
              size="mini"
              plain
              @click="onComplete(item)"
            >
              完成
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <van-popup v-model:show="showAdd" position="bottom" round :style="{ height: '70%' }">
      <div class="add-panel">
        <h3>给活动 #{{ adding?.id }} 加菜</h3>
        <p class="hint">只能添加，不能改别人已选的菜</p>
        <van-checkbox-group v-model="pickedDishIds">
          <van-cell
            v-for="dish in dishes"
            :key="dish.id"
            clickable
            :title="dish.name"
            :label="dish.description"
            @click="togglePick(dish.id)"
          >
            <template #right-icon>
              <van-checkbox :name="dish.id" @click.stop />
            </template>
          </van-cell>
        </van-checkbox-group>
        <van-button block type="primary" round :loading="addingBusy" @click="submitAdd">确认加菜</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showConfirmDialog, showFailToast, showSuccessToast, type UploaderFileListItem } from 'vant'
import {
  formatDateTime,
  pactApi,
  type Activity,
  type ActivityItem,
  type ActivityStatus,
  type Dish,
} from '@our-pact/shared'
import { useGuestStore } from '@/stores/guest'
import BrandLogo from '@/components/BrandLogo.vue'

const guest = useGuestStore()
const activities = ref<Activity[]>([])
const dishes = ref<Dish[]>([])
const loading = ref(false)
const joining = ref(false)
const joinCode = ref('')
const showAdd = ref(false)
const adding = ref<Activity | null>(null)
const pickedDishIds = ref<number[]>([])
const addingBusy = ref(false)

function statusLabel(status: ActivityStatus) {
  return {
    open: '待答复',
    replied: '已答复',
    withdrawn: '已撤回',
    completed: '已完成',
  }[status]
}

function tagType(status: ActivityStatus) {
  return {
    open: 'warning',
    replied: 'primary',
    withdrawn: 'default',
    completed: 'success',
  }[status] as 'warning' | 'primary' | 'default' | 'success'
}

function canEdit(item: Activity) {
  return item.status === 'open'
}

function lineMeta(item: ActivityItem) {
  return [
    ...item.options.map((opt) => `${opt.groupName}：${opt.optionLabel}`),
    item.note ? `备注：${item.note}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

async function load() {
  if (!guest.user) {
    activities.value = []
    return
  }
  loading.value = true
  try {
    activities.value = await pactApi.listActivities({ userId: guest.user.id })
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '加载活动失败')
  } finally {
    loading.value = false
  }
}

async function onJoin() {
  if (!guest.user) {
    showFailToast('请先创建账号名')
    return
  }
  if (!joinCode.value.trim()) {
    showFailToast('请输入分享码')
    return
  }
  joining.value = true
  try {
    await pactApi.joinActivity(joinCode.value, guest.user.id)
    joinCode.value = ''
    showSuccessToast('已加入活动')
    await load()
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '加入失败')
  } finally {
    joining.value = false
  }
}

async function onShare(item: Activity) {
  const text = `饭否活动分享码：${item.shareCode}（发起人 ${item.userName}）`
  try {
    await navigator.clipboard.writeText(text)
    showSuccessToast(`已复制分享码 ${item.shareCode}`)
  } catch {
    showSuccessToast(`分享码：${item.shareCode}`)
  }
}

async function openAddDish(item: Activity) {
  if (!guest.user) return
  adding.value = item
  pickedDishIds.value = []
  if (!dishes.value.length) {
    dishes.value = await pactApi.listDishes(true)
  }
  showAdd.value = true
}

function togglePick(id: number) {
  const set = new Set(pickedDishIds.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  pickedDishIds.value = [...set]
}

async function submitAdd() {
  if (!guest.user || !adding.value) return
  if (!pickedDishIds.value.length) {
    showFailToast('请至少选一道菜')
    return
  }
  addingBusy.value = true
  try {
    await pactApi.addActivityItems(
      adding.value.id,
      guest.user.id,
      pickedDishIds.value.map((dishId) => ({ dishId })),
    )
    showAdd.value = false
    showSuccessToast('已加菜')
    await load()
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '加菜失败')
  } finally {
    addingBusy.value = false
  }
}

async function onRemoveItem(item: Activity, itemId: number) {
  if (!guest.user) return
  try {
    await pactApi.removeActivityItem(item.id, itemId, guest.user.id)
    showSuccessToast('已移除')
    await load()
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : '移除失败')
  }
}

async function onWithdraw(item: Activity) {
  if (!guest.user) return
  try {
    await showConfirmDialog({
      title: '撤回活动',
      message: '撤回后会通知管理员，确定吗？',
    })
    await pactApi.withdrawActivity(item.id, guest.user.id)
    showSuccessToast('已撤回，已通知管理员')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    showFailToast(error instanceof Error ? error.message : '撤回失败')
  }
}

async function onComplete(item: Activity) {
  if (!guest.user) return
  try {
    await showConfirmDialog({
      title: '完成活动',
      message: '完成后可在「手机先吃」里上传合照',
    })
    await pactApi.completeActivity(item.id, guest.user.id)
    showSuccessToast('活动已完成')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    showFailToast(error instanceof Error ? error.message : '操作失败')
  }
}

async function onUpload(item: Activity, file: UploaderFileListItem | UploaderFileListItem[]) {
  if (!guest.user) return
  const entry = Array.isArray(file) ? file[0] : file
  const raw = entry?.file
  if (!raw) {
    showFailToast('读取照片失败')
    return
  }
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      await pactApi.uploadActivityPhoto(item.id, guest.user!.id, String(reader.result))
      showSuccessToast('照片已上传')
      await load()
    } catch (error) {
      showFailToast(error instanceof Error ? error.message : '上传失败')
    }
  }
  reader.readAsDataURL(raw)
}

onMounted(async () => {
  await guest.hydrate()
  await load()
})
</script>

<style scoped>
.content {
  padding: 12px;
}

.join-box {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e5e1d8;
  border-radius: 12px;
  padding: 4px 8px 4px 0;
}

.join-box :deep(.van-cell) {
  padding: 8px 12px;
  background: transparent;
}

.center {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.card {
  background: #fff;
  border: 1px solid #e5e1d8;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.meta {
  font-size: 12px;
  color: #8a8680;
  margin-bottom: 8px;
}

.reply {
  font-size: 13px;
  color: #5b8f7a;
  margin-bottom: 8px;
  background: #eef5f1;
  border-radius: 8px;
  padding: 8px 10px;
}

.line {
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.line-main {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.who {
  color: #8a8680;
  font-size: 12px;
}

.line small {
  display: block;
  color: #8a8680;
  font-size: 12px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e1d8;
}

.photos {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e5e1d8;
}

.photos-head {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 8px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.photo img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

.photo span {
  display: block;
  font-size: 11px;
  color: #8a8680;
  margin-top: 4px;
  text-align: center;
}

.add-panel {
  padding: 16px;
}

.add-panel h3 {
  margin: 0 0 4px;
}

.hint {
  margin: 0 0 12px;
  color: #8a8680;
  font-size: 13px;
}

.add-panel .van-button {
  margin-top: 16px;
}
</style>
