<template>
  <section>
    <div class="head">
      <div>
        <h2>日程试算</h2>
        <p>导入两人排班表，试算共同休息日与可约晚饭日。结果仅本次展示，不保存。</p>
      </div>
      <div class="head-actions">
        <el-button :disabled="!trial" @click="onClear">清空</el-button>
        <el-button type="primary" :disabled="!trial" @click="onExport">导出结果</el-button>
      </div>
    </div>

    <div class="import-grid">
      <div class="import-card">
        <h3>表 1</h3>
        <el-upload
          :show-file-list="false"
          accept=".xlsx,.xls"
          :auto-upload="false"
          :on-change="onFile1Change"
        >
          <el-button>选择 Excel</el-button>
        </el-upload>
        <p v-if="file1" class="file-name">{{ file1.fileName }}</p>
        <el-select
          v-if="file1 && file1.people.length"
          v-model="personIndex1"
          placeholder="选择人员"
          class="person-select"
        >
          <el-option
            v-for="(p, i) in file1.people"
            :key="`a-${p.name}-${i}`"
            :label="p.name"
            :value="i"
          />
        </el-select>
      </div>

      <div class="import-card">
        <h3>表 2</h3>
        <el-upload
          :show-file-list="false"
          accept=".xlsx,.xls"
          :auto-upload="false"
          :on-change="onFile2Change"
        >
          <el-button>选择 Excel</el-button>
        </el-upload>
        <p v-if="file2" class="file-name">{{ file2.fileName }}</p>
        <el-select
          v-if="file2 && file2.people.length"
          v-model="personIndex2"
          placeholder="选择人员"
          class="person-select"
        >
          <el-option
            v-for="(p, i) in file2.people"
            :key="`b-${p.name}-${i}`"
            :label="p.name"
            :value="i"
          />
        </el-select>
      </div>
    </div>

    <div class="toolbar">
      <el-button type="primary" :loading="parsing" :disabled="!canTrial" @click="onTrial">试算</el-button>
      <div class="legend">
        <span class="lg holiday">假 · 法定休息日（节假日/双休）</span>
        <span class="lg rest">休 · 共同休息</span>
        <span class="lg ok">可约</span>
        <span class="lg no">不可约</span>
        <span class="lg unknown">未知</span>
      </div>
    </div>

    <template v-if="trial">
      <div class="month-bar">
        <el-button link :disabled="monthIndex <= 0" @click="monthIndex -= 1">上一月</el-button>
        <strong>{{ currentMonthLabel }}</strong>
        <el-button link :disabled="monthIndex >= months.length - 1" @click="monthIndex += 1">下一月</el-button>
      </div>

      <div class="calendar">
        <div v-for="w in weekLabels" :key="w" class="weekday">{{ w }}</div>
        <div
          v-for="(cell, idx) in calendarCells"
          :key="`${currentMonth.key}-${idx}`"
          class="day-cell"
          :class="[
            !cell ? 'empty' : cell.meetup ? `res-${cell.meetup.result}` : 'plain',
            { holiday: cell?.holiday },
          ]"
        >
          <template v-if="cell">
            <div class="day-top">
              <span class="day-num">{{ cell.day }}</span>
              <span v-if="cell.holiday" class="badge-holiday">假</span>
            </div>
            <template v-if="cell.meetup">
              <div class="day-result">{{ meetupResultLabel(cell.meetup.result) }}</div>
              <div class="day-shifts">
                <span>{{ trial.nameA }} {{ cell.meetup.shiftA.raw || '-' }}</span>
                <span>{{ trial.nameB }} {{ cell.meetup.shiftB.raw || '-' }}</span>
              </div>
            </template>
          </template>
        </div>
      </div>

      <div class="lists">
        <div class="list-card">
          <h3>共同休息日（{{ commonRestDays.length }}）</h3>
          <p v-if="!commonRestDays.length" class="muted">无</p>
          <ul v-else>
            <li v-for="d in commonRestDays" :key="`rest-${d.date}`">
              {{ d.date }}
              <span v-if="d.holiday" class="tag-holiday">假</span>
            </li>
          </ul>
        </div>
        <div class="list-card">
          <h3>可约日（{{ okDays.length }}）</h3>
          <p v-if="!okDays.length" class="muted">无</p>
          <ul v-else>
            <li v-for="d in okDays" :key="`ok-${d.date}`">
              {{ d.date }} · {{ trial.nameA }} {{ d.shiftA.raw || '-' }} / {{ trial.nameB }}
              {{ d.shiftB.raw || '-' }}
              <span v-if="d.holiday" class="tag-holiday">假</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { isCnHoliday } from './cnHolidays'
import { calcMeetup, listMonths, meetupResultLabel, type DayMeetup, type TrialResult } from './calcMeetup'
import { exportTrialExcel } from './exportTrial'
import { parseScheduleFile, type ParsedWorkbook } from './parseSchedule'

const file1 = ref<ParsedWorkbook | null>(null)
const file2 = ref<ParsedWorkbook | null>(null)
const personIndex1 = ref(0)
const personIndex2 = ref(0)
const parsing = ref(false)
const trial = ref<TrialResult | null>(null)
const monthIndex = ref(0)

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

const canTrial = computed(() => Boolean(file1.value?.people.length && file2.value?.people.length))

const months = computed(() => (trial.value ? listMonths(trial.value.days) : []))

const currentMonth = computed(() => months.value[monthIndex.value] || { year: 0, month: 0, key: '' })

const currentMonthLabel = computed(() => {
  if (!currentMonth.value.key) {
    return ''
  }
  return `${currentMonth.value.year}年${currentMonth.value.month}月`
})

const dayMap = computed(() => {
  const map = new Map<string, DayMeetup>()
  for (const d of trial.value?.days || []) {
    map.set(d.date, d)
  }
  return map
})

const calendarCells = computed(() => {
  const { year, month, key } = currentMonth.value
  if (!key) {
    return [] as Array<{ day: number; meetup: DayMeetup | null; holiday: boolean } | null>
  }
  const first = new Date(year, month - 1, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: Array<{ day: number; meetup: DayMeetup | null; holiday: boolean } | null> = []
  for (let i = 0; i < startPad; i++) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${key}-${String(day).padStart(2, '0')}`
    cells.push({
      day,
      meetup: dayMap.value.get(dateKey) || null,
      holiday: isCnHoliday(dateKey),
    })
  }
  return cells
})

const commonRestDays = computed(() => trial.value?.days.filter((d) => d.commonRest) || [])

const okDays = computed(() => trial.value?.days.filter((d) => d.result === 'ok' || d.result === 'rest') || [])

async function onFile(which: 1 | 2, upload: UploadFile) {
  const raw = upload.raw
  if (!raw) {
    return
  }
  parsing.value = true
  try {
    const parsed = await parseScheduleFile(raw)
    if (which === 1) {
      file1.value = parsed
      personIndex1.value = 0
    } else {
      file2.value = parsed
      personIndex2.value = 0
    }
    trial.value = null
    ElMessage.success(`已导入表${which}：${parsed.people.length} 人`)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '解析失败')
  } finally {
    parsing.value = false
  }
}

function onFile1Change(upload: UploadFile) {
  void onFile(1, upload)
}

function onFile2Change(upload: UploadFile) {
  void onFile(2, upload)
}

function onTrial() {
  if (!file1.value || !file2.value) {
    return
  }
  const a = file1.value.people[personIndex1.value]
  const b = file2.value.people[personIndex2.value]
  if (!a || !b) {
    ElMessage.warning('请选择双方人员')
    return
  }
  const result = calcMeetup(a, b)
  if (!result.days.length) {
    ElMessage.warning('两人排班没有重叠日期')
    trial.value = null
    return
  }
  trial.value = result
  monthIndex.value = 0
  ElMessage.success(`试算完成，共 ${result.days.length} 天`)
}

function onClear() {
  file1.value = null
  file2.value = null
  personIndex1.value = 0
  personIndex2.value = 0
  trial.value = null
  monthIndex.value = 0
}

function onExport() {
  if (!trial.value) {
    return
  }
  exportTrialExcel(trial.value)
  ElMessage.success('已开始下载')
}
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
  margin: 0 0 6px;
  font-size: 22px;
}

.head p {
  margin: 0;
  color: var(--muted, #8a8680);
  font-size: 13px;
}

.head-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.import-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.import-card {
  padding: 16px;
  border: 1px solid #e5e1d8;
  border-radius: 12px;
  background: #faf8f3;
}

.import-card h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.file-name {
  margin: 10px 0 0;
  font-size: 12px;
  color: #5b8f7a;
  word-break: break-all;
}

.person-select {
  margin-top: 12px;
  width: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #5a5650;
}

.lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f3f1ec;
}

.lg.holiday {
  background: #ffe8cc;
  color: #b45f06;
}

.lg.rest {
  background: #fde8e8;
  color: #c0392b;
}

.lg.ok {
  background: #e5f6ea;
  color: #1f7a45;
}

.lg.no {
  background: #e8eef5;
  color: #3a5f8a;
}

.lg.unknown {
  background: #eee;
  color: #777;
}

.month-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 24px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #8a8680;
  padding: 4px 0;
}

.day-cell {
  min-height: 92px;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid #e5e1d8;
  background: #fff;
}

.day-cell.empty {
  background: transparent;
  border-color: transparent;
}

.day-cell.plain {
  background: #fafafa;
  opacity: 0.7;
}

.day-cell.holiday {
  box-shadow: inset 0 0 0 1px #f0b27a;
}

.day-cell.res-rest {
  background: #fff5f5;
}

.day-cell.res-ok {
  background: #f3fbf6;
}

.day-cell.res-no {
  background: #f5f8fc;
}

.day-cell.res-unknown {
  background: #f7f7f7;
  opacity: 0.55;
}

.day-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.day-num {
  font-weight: 700;
  font-size: 13px;
}

.badge-holiday {
  font-size: 11px;
  color: #b45f06;
  background: #ffe8cc;
  padding: 0 5px;
  border-radius: 4px;
}

.day-result {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
}

.res-rest .day-result {
  color: #c0392b;
}

.res-ok .day-result {
  color: #1f7a45;
}

.res-no .day-result {
  color: #3a5f8a;
}

.day-shifts {
  display: grid;
  gap: 2px;
  font-size: 11px;
  color: #6b6760;
  line-height: 1.35;
}

.lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.list-card {
  padding: 16px;
  border: 1px solid #e5e1d8;
  border-radius: 12px;
  background: #fff;
}

.list-card h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.list-card ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
}

.muted {
  margin: 0;
  color: #8a8680;
  font-size: 13px;
}

.tag-holiday {
  margin-left: 6px;
  font-size: 11px;
  color: #b45f06;
}

@media (max-width: 860px) {
  .import-grid,
  .lists {
    grid-template-columns: 1fr;
  }

  .head {
    flex-direction: column;
  }

  .day-cell {
    min-height: 78px;
    padding: 6px;
  }
}
</style>
