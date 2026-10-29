<template>
  <section>
    <div class="head">
      <div>
        <h2>用户列表</h2>
        <p>登录用户，包含账号注册和小程序静默登录。</p>
      </div>
    </div>

    <div class="toolbar">
      <el-input
        v-model="keyword"
        clearable
        placeholder="用户名、昵称或手机号"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-button type="primary" @click="onSearch">查询</el-button>
    </div>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column label="用户" min-width="220">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="36" :src="row.avatar || undefined">{{ initial(row) }}</el-avatar>
            <div>
              <strong>{{ row.nickname || '未设置昵称' }}</strong>
              <div class="muted">{{ row.username }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="手机号" min-width="140">
        <template #default="{ row }">{{ row.phone || '—' }}</template>
      </el-table-column>
      <el-table-column label="管理员" width="120">
        <template #default="{ row }">
          <el-switch
            :model-value="Boolean(row.superAdmin)"
            :loading="switchingId === row.id"
            inline-prompt
            active-text="是"
            inactive-text="否"
            @change="(value: string | number | boolean) => onToggleAdmin(row, Boolean(value))"
          />
        </template>
      </el-table-column>
      <el-table-column label="注册时间" min-width="180">
        <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
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
import { ElMessage } from 'element-plus'
import { formatDateTime, pageUsers, updateUserAdmin, type UserProfile } from '@our-pact/shared'

const users = ref<UserProfile[]>([])
const loading = ref(false)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const switchingId = ref(0)

function initial(row: UserProfile) {
  return (row.nickname || row.username || '用').slice(0, 1)
}

async function load() {
  loading.value = true
  try {
    const result = await pageUsers({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
    })
    users.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (pageNum.value !== 1) {
    pageNum.value = 1
    return
  }
  void load()
}

function onSizeChange() {
  if (pageNum.value !== 1) {
    pageNum.value = 1
    return
  }
  void load()
}

async function onToggleAdmin(row: UserProfile, superAdmin: boolean) {
  if (Boolean(row.superAdmin) === superAdmin || switchingId.value) {
    return
  }
  switchingId.value = row.id
  try {
    const updated = await updateUserAdmin(row.id, superAdmin)
    const index = users.value.findIndex((item) => item.id === row.id)
    if (index >= 0) {
      users.value[index] = { ...users.value[index], ...updated }
    }
    ElMessage.success(superAdmin ? '已设为管理员' : '已取消管理员')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '设置失败')
  } finally {
    switchingId.value = 0
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

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.toolbar .el-input {
  width: 280px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.muted {
  color: #8a8680;
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
