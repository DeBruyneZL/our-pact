<template>
  <div class="profile-page">
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" />

    <template v-else-if="auth.profile">
      <section class="hero">
        <el-avatar :size="84" :src="auth.profile.avatar || undefined">{{ initial }}</el-avatar>
        <div class="hero-text">
          <div class="title-row">
            <h2>{{ auth.profile.nickname }}</h2>
            <el-tag v-if="auth.profile.superAdmin" type="danger" effect="plain">超级管理员</el-tag>
            <el-tag v-else type="info" effect="plain">普通账号</el-tag>
          </div>
          <p>用户名 {{ auth.profile.username }} · 注册于 {{ formatDateTime(auth.profile.createTime) }}</p>
        </div>
        <div class="hero-actions">
          <el-button :loading="uploading" @click="pickAvatar">更换头像</el-button>
          <el-button type="primary" @click="openEdit">编辑资料</el-button>
          <input
            ref="fileInput"
            class="file-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            @change="onFileChange"
          />
        </div>
      </section>

      <section class="panel">
        <h3>账号信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">
            {{ auth.profile.username }}
            <span class="hint">不可修改</span>
          </el-descriptions-item>
          <el-descriptions-item label="昵称">{{ auth.profile.nickname }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ maskPhone(auth.profile.phone) }}</el-descriptions-item>
          <el-descriptions-item label="账号类型">
            {{ auth.profile.superAdmin ? '超级管理员' : '普通账号' }}
            <span class="hint">不可修改</span>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDateTime(auth.profile.createTime) }}</el-descriptions-item>
        </el-descriptions>
      </section>
    </template>

    <el-dialog v-model="editVisible" title="编辑资料" width="460px" destroy-on-close @closed="resetEdit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="72px">
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="form.nickname"
            maxlength="10"
            show-word-limit
            placeholder="最多 10 个字"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <p class="dialog-tip">手机号需保持唯一。用户名和超级管理员身份不支持在此修改。</p>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { NICKNAME_MAX_LENGTH, PHONE_PATTERN, assertAvatarFile, formatDateTime, getToken, maskPhone } from '@our-pact/shared'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const fileInput = ref<HTMLInputElement | null>(null)
const editVisible = ref(false)
const saving = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const form = reactive({
  nickname: '',
  phone: '',
})
const rules: FormRules = {
  nickname: [
    { required: true, message: '请填写昵称', trigger: 'blur' },
    { max: NICKNAME_MAX_LENGTH, message: '昵称不能超过 10 个字', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请填写手机号', trigger: 'blur' },
    { pattern: PHONE_PATTERN, message: '手机号格式不正确', trigger: 'blur' },
  ],
}
const initial = computed(() => auth.profile?.nickname?.slice(0, 1) || '用')

async function loadProfile() {
  errorMessage.value = ''
  try {
    await auth.loadProfile()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '获取用户失败'
    if (!getToken()) {
      auth.token = ''
      await router.replace({ name: 'login' })
    }
  }
}

function openEdit() {
  form.nickname = auth.profile?.nickname || ''
  form.phone = auth.profile?.phone || ''
  editVisible.value = true
}

function resetEdit() {
  form.nickname = ''
  form.phone = ''
}

async function onSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  const nextPhone = form.phone.trim()
  if (nextPhone !== (auth.profile?.phone || '')) {
    try {
      await ElMessageBox.confirm(
        `确认将手机号修改为 ${nextPhone}？修改后可用新手机号登录。`,
        '确认修改手机号',
        {
          type: 'warning',
          confirmButtonText: '确认修改',
          cancelButtonText: '取消',
        },
      )
    } catch {
      return
    }
  }
  saving.value = true
  try {
    await auth.saveProfile(form.nickname.trim(), nextPhone)
    editVisible.value = false
    ElMessage.success('资料已更新')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function pickAvatar() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  uploading.value = true
  try {
    assertAvatarFile(file)
    await auth.changeAvatar(file)
    ElMessage.success('头像已更新')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '头像上传失败')
  } finally {
    uploading.value = false
  }
}

onMounted(loadProfile)
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: 18px;
}

.hero,
.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(20, 40, 30, 0.03);
}

.hero {
  display: grid;
  grid-template-columns: 84px 1fr auto;
  gap: 18px;
  align-items: center;
  padding: 24px;
}

.hero-text h2 {
  margin: 0;
  font-size: 24px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-text p {
  margin: 8px 0 0;
  color: var(--muted);
}

.hero-actions {
  display: flex;
  gap: 10px;
}

.panel {
  padding: 22px 24px;
}

.panel h3 {
  margin: 0 0 16px;
  font-size: 16px;
}

.hint {
  margin-left: 10px;
  color: #98a59e;
  font-size: 12px;
}

.dialog-tip {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.file-input {
  display: none;
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    justify-content: flex-start;
  }
}
</style>
