<template>
  <section>
    <div class="head">
      <div>
        <h2>店铺介绍</h2>
        <p>显示在小程序点菜页顶部。地点、主厨和氛围图没填时，这一块不会出现。</p>
      </div>
      <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
    </div>

    <div v-loading="loading" class="layout">
      <el-form class="form" label-width="96px" @submit.prevent="onSave">
        <el-form-item label="一句话">
          <el-input v-model="form.slogan" maxlength="64" show-word-limit placeholder="例如：家里这桌，想来就坐" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" maxlength="128" show-word-limit placeholder="例如：朝阳公园南门，进门左转" />
        </el-form-item>
        <el-form-item label="接待时间">
          <el-input v-model="form.openHours" maxlength="64" show-word-limit placeholder="例如：周五到周日 18:00 后" />
        </el-form-item>
        <el-form-item label="可坐">
          <el-input v-model="form.seatsText" maxlength="32" show-word-limit placeholder="例如：一桌 6–8 人" />
        </el-form-item>
        <el-form-item label="今日说明">
          <el-input
            v-model="form.notice"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="例如：本周菌子看季节，不一定有"
          />
        </el-form-item>
        <el-form-item label="氛围图">
          <div class="photo">
            <div class="frame wide" :class="{ filled: !!form.coverUrl }">
              <img v-if="form.coverUrl" :src="form.coverUrl" alt="" />
              <span v-else>桌子、厨房或门面</span>
            </div>
            <div class="photo-actions">
              <el-upload :show-file-list="false" accept="image/*" :auto-upload="false" :on-change="onCoverChange">
                <el-button size="small">{{ form.coverUrl ? '更换' : '上传' }}</el-button>
              </el-upload>
              <el-button v-if="form.coverUrl" size="small" link type="danger" @click="form.coverUrl = ''">移除</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="主厨称呼">
          <el-input v-model="form.chefTitle" maxlength="16" show-word-limit placeholder="例如：主厨" />
        </el-form-item>
        <el-form-item label="主厨名字">
          <el-input v-model="form.chefName" maxlength="32" show-word-limit placeholder="例如：阿花" />
        </el-form-item>
        <el-form-item label="主厨头像">
          <div class="photo">
            <div class="frame avatar" :class="{ filled: !!form.chefAvatarUrl }">
              <img v-if="form.chefAvatarUrl" :src="form.chefAvatarUrl" alt="" />
              <span v-else>头像</span>
            </div>
            <div class="photo-actions">
              <el-upload :show-file-list="false" accept="image/*" :auto-upload="false" :on-change="onAvatarChange">
                <el-button size="small">{{ form.chefAvatarUrl ? '更换' : '上传' }}</el-button>
              </el-upload>
              <el-button v-if="form.chefAvatarUrl" size="small" link type="danger" @click="form.chefAvatarUrl = ''">
                移除
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="主厨介绍">
          <el-input
            v-model="form.chefIntro"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="例如：家常味道，少油，跟着当季食材走"
          />
        </el-form-item>
      </el-form>

      <aside class="preview">
        <p class="preview-label">点菜页上的样子</p>
        <div v-if="preview.visible" class="phone-card">
          <div class="phone-main">
            <img v-if="form.coverUrl" class="phone-cover" :src="form.coverUrl" alt="" />
            <div class="phone-copy">
              <strong>{{ preview.headline }}</strong>
              <span v-if="preview.meta">{{ preview.meta }}</span>
              <div v-if="preview.showChef" class="phone-chef">
                <img v-if="form.chefAvatarUrl" :src="form.chefAvatarUrl" alt="" />
                <i v-else>{{ preview.initial }}</i>
                <div>
                  <b>{{ preview.chefLabel }}</b>
                  <em v-if="form.chefIntro.trim()">{{ form.chefIntro.trim() }}</em>
                </div>
              </div>
            </div>
          </div>
          <p v-if="form.notice.trim()" class="phone-notice">今日 {{ form.notice.trim() }}</p>
        </div>
        <p v-else class="preview-empty">还是空的，小程序上先不显示。</p>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type UploadFile } from 'element-plus'
import { fileFromDataUrl, readImageDataUrl, shopApi, type ShopProfile } from '@our-pact/shared'

const loading = ref(false)
const saving = ref(false)
const form = reactive({
  slogan: '',
  location: '',
  openHours: '',
  seatsText: '',
  notice: '',
  coverUrl: '',
  chefName: '',
  chefTitle: '',
  chefIntro: '',
  chefAvatarUrl: '',
})

const preview = computed(() => {
  const slogan = form.slogan.trim()
  const location = form.location.trim()
  const openHours = form.openHours.trim()
  const seatsText = form.seatsText.trim()
  const chefName = form.chefName.trim()
  const chefTitle = form.chefTitle.trim() || (chefName ? '主厨' : '')
  const chefLabel = [chefTitle, chefName].filter(Boolean).join(' ')
  const headline = slogan || location || chefLabel || '饭否'
  const meta = [location, openHours, seatsText].filter((part) => part && part !== headline).join(' · ')
  const showChef = Boolean(chefName || form.chefIntro.trim() || form.chefAvatarUrl)
  const visible = Boolean(
    slogan || location || openHours || seatsText || form.notice.trim() || form.coverUrl || showChef,
  )
  return {
    headline,
    meta,
    showChef,
    visible,
    chefLabel,
    initial: (chefName || chefTitle || '厨').slice(0, 1),
  }
})

function apply(profile: ShopProfile) {
  form.slogan = profile.slogan || ''
  form.location = profile.location || ''
  form.openHours = profile.openHours || ''
  form.seatsText = profile.seatsText || ''
  form.notice = profile.notice || ''
  form.coverUrl = profile.coverUrl || ''
  form.chefName = profile.chefName || ''
  form.chefTitle = profile.chefTitle || ''
  form.chefIntro = profile.chefIntro || ''
  form.chefAvatarUrl = profile.chefAvatarUrl || ''
}

async function load() {
  loading.value = true
  try {
    apply(await shopApi.get())
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function upload(file: UploadFile, target: 'coverUrl' | 'chefAvatarUrl') {
  const raw = file.raw
  if (!raw) {
    return
  }
  try {
    const saved = await shopApi.uploadImage(fileFromDataUrl(await readImageDataUrl(raw), 'shop.jpg'))
    form[target] = saved.url
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '图片读取失败')
  }
}

function onCoverChange(file: UploadFile) {
  void upload(file, 'coverUrl')
}

function onAvatarChange(file: UploadFile) {
  void upload(file, 'chefAvatarUrl')
}

async function onSave() {
  saving.value = true
  try {
    const saved = await shopApi.save({
      slogan: form.slogan.trim(),
      location: form.location.trim(),
      openHours: form.openHours.trim(),
      seatsText: form.seatsText.trim(),
      notice: form.notice.trim(),
      coverUrl: form.coverUrl || null,
      chefName: form.chefName.trim(),
      chefTitle: form.chefTitle.trim(),
      chefIntro: form.chefIntro.trim(),
      chefAvatarUrl: form.chefAvatarUrl || null,
    })
    apply(saved)
    ElMessage.success('店铺介绍已保存')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.head h2 {
  margin: 0;
  font-size: 26px;
}

.head p {
  margin: 6px 0 0;
  color: #8a8680;
  font-size: 13px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 28px;
  align-items: start;
}

.form {
  min-width: 0;
  padding: 8px 8px 0 0;
}

.photo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.frame {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f7f5f0;
  color: #8a8680;
  border: 1px dashed #d5cfc6;
  border-radius: 12px;
  font-size: 12px;
}

.frame.wide {
  width: 148px;
  height: 96px;
}

.frame.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
}

.frame.filled {
  border-style: solid;
  border-color: #e5e1d8;
}

.frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-label,
.preview-empty {
  margin: 0;
  color: #8a8680;
  font-size: 13px;
}

.phone-card {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #e5e1d8;
  border-radius: 16px;
  background: #fffcf7;
}

.phone-main {
  display: flex;
  gap: 10px;
}

.phone-cover {
  width: 84px;
  height: 84px;
  border-radius: 10px;
  object-fit: cover;
  background: #e8e2d8;
  flex-shrink: 0;
}

.phone-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phone-copy strong {
  font-size: 15px;
  line-height: 1.35;
}

.phone-copy span,
.phone-chef em {
  color: #5c5852;
  font-size: 12px;
  line-height: 1.45;
  font-style: normal;
}

.phone-chef {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.phone-chef img,
.phone-chef i {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e6f0eb;
  flex-shrink: 0;
  object-fit: cover;
}

.phone-chef i {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}

.phone-chef b,
.phone-chef em {
  display: block;
}

.phone-chef em {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 160px;
}

.phone-notice {
  margin: 10px 0 0;
  padding: 6px 8px;
  border-radius: 8px;
  background: #e6f0eb;
  color: #3d6f5c;
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
