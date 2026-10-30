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
        <div v-if="preview.visible" class="phone">
          <div class="phone-hero" />
          <div class="phone-card">
            <img v-if="form.chefAvatarUrl" class="phone-avatar" :src="form.chefAvatarUrl" alt="" />
            <i v-else-if="preview.showChef" class="phone-avatar">{{ preview.initial }}</i>
            <div class="phone-copy">
              <div class="phone-name">
                <strong>{{ preview.chefName || preview.slogan || '饭否' }}</strong>
                <span v-if="preview.tag" class="role">{{ preview.tag }}</span>
              </div>
              <span v-if="preview.subtitle" class="quiet">{{ preview.subtitle }}</span>
              <span v-if="preview.address" class="quiet">{{ preview.address }}</span>
            </div>
          </div>
          <p class="phone-menu-label">菜单</p>
          <div class="phone-menu">
            <div class="phone-rail"><span>硬菜</span><span>热菜</span></div>
            <div class="phone-col">
              <p class="phone-cat">硬菜</p>
              <div class="phone-dish" />
            </div>
          </div>
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
  const extra = [openHours, seatsText].filter(Boolean).join(' · ')
  const showChef = Boolean(chefName || form.chefIntro.trim() || form.chefAvatarUrl)
  const visible = Boolean(
    slogan || location || openHours || seatsText || form.notice.trim() || form.coverUrl || showChef,
  )
  const tag = chefName && chefTitle ? chefTitle : ''
  const subtitle = chefName && slogan ? slogan : ''
  const address = location && location !== subtitle ? location : ''
  return {
    slogan,
    location,
    extra,
    chefName,
    chefTitle,
    tag,
    subtitle,
    address,
    showChef,
    visible,
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

.phone {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  border: 1px solid #e5e1d8;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.phone-hero {
  height: 84px;
  margin-bottom: -18px;
  background: #d7e6df url('https://aiyy.obs.cn-south-1.myhuaweicloud.com/template/bj.png') center / cover no-repeat;
}

.phone-menu-label,
.phone-cat {
  margin: 0;
  font-weight: 700;
  color: #2c2a26;
}

.phone-menu-label {
  padding: 0 10px 6px;
  font-size: 14px;
}

.phone-cat {
  padding: 8px 10px 0;
  font-size: 13px;
}

.phone-col {
  flex: 1;
  min-width: 0;
}

.phone-menu {
  display: flex;
  min-height: 96px;
  border-top: 1px solid #efeae2;
}

.phone-rail {
  width: 52px;
  flex-shrink: 0;
  padding: 8px 0;
  background: #fff;
  border-right: 1px solid #f0eeea;
  color: #8a8680;
  font-size: 12px;
  text-align: center;
}

.phone-rail span {
  display: block;
  padding: 8px 0;
}

.phone-rail span:first-child {
  color: #3d6f5c;
  font-weight: 700;
  box-shadow: inset 3px 0 0 #5b8f7a;
}

.phone-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px;
  padding: 10px;
  background: #fff;
  border-radius: 14px 14px 0 0;
}

.phone-dish {
  height: 52px;
  margin: 8px 10px 10px;
  border-radius: 10px;
  background: #efeae2;
}

.phone-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  background: #e6f0eb;
  flex-shrink: 0;
}

i.phone-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d6f5c;
  font-style: normal;
  font-size: 15px;
  font-weight: 700;
}

.phone-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.phone-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.phone-name strong {
  font-size: 16px;
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.phone-name .role {
  flex-shrink: 0;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 999px;
  background: #e6f0eb;
  color: #3d6f5c;
  font-size: 11px;
  font-style: normal;
  font-weight: 600;
}

.phone-copy span {
  color: #5c5852;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.phone-copy span.quiet {
  color: #9a958c;
  font-size: 12px;
}

.phone-notice {
  margin: 0 10px 8px 54px;
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
