/**
 * 排班 Excel 解析与班次归一。
 *
 * @author zhangliang
 */
import * as XLSX from 'xlsx'

export type ShiftKind = 'rest' | 'early' | 'late' | 'unknown'

export type DayShift = {
  raw: string
  kind: ShiftKind
}

export type PersonSchedule = {
  name: string
  /** YYYY-MM-DD -> 班次 */
  days: Record<string, DayShift>
}

export type ParsedWorkbook = {
  fileName: string
  people: PersonSchedule[]
}

const WEEKDAY_CELLS = new Set(['日', '一', '二', '三', '四', '五', '六'])

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** 输出 YYYY-MM-DD */
export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function excelSerialToDateKey(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 80000) {
    return null
  }
  // Excel 1900 日期系统（SheetJS 常用）
  const utc = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000
  const d = new Date(utc)
  if (Number.isNaN(d.getTime())) {
    return null
  }
  return toDateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

function parseDateCell(value: unknown, fallbackYear: number): string | null {
  if (value == null || value === '') {
    return null
  }
  if (typeof value === 'number') {
    return excelSerialToDateKey(value)
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toDateKey(value.getFullYear(), value.getMonth() + 1, value.getDate())
  }
  const text = String(value).trim()
  if (!text || WEEKDAY_CELLS.has(text)) {
    return null
  }

  let m = text.match(/^(\d{4})[年\-/.](\d{1,2})[月\-/.](\d{1,2})日?$/)
  if (m) {
    return toDateKey(Number(m[1]), Number(m[2]), Number(m[3]))
  }
  m = text.match(/^(\d{1,2})月(\d{1,2})日$/)
  if (m) {
    return toDateKey(fallbackYear, Number(m[1]), Number(m[2]))
  }
  m = text.match(/^(\d{1,2})[\/\-.](\d{1,2})$/)
  if (m) {
    return toDateKey(fallbackYear, Number(m[1]), Number(m[2]))
  }
  return null
}

/** 去掉括号备注后归一班次 */
export function normalizeShift(rawInput: unknown): DayShift {
  const raw = String(rawInput ?? '')
    .replace(/\s+/g, '')
    .replace(/（.*?）|\(.*?\)/g, '')
    .trim()
  if (!raw) {
    return { raw: '', kind: 'unknown' }
  }
  if (/休/.test(raw) || raw === '年假' || raw === '事假' || raw === '病假') {
    return { raw, kind: 'rest' }
  }
  if (raw === '早' || raw === '溜' || /^A\d*/i.test(raw)) {
    return { raw, kind: 'early' }
  }
  if (raw === '晚' || /^C\d*/i.test(raw)) {
    return { raw, kind: 'late' }
  }
  return { raw, kind: 'unknown' }
}

function cellText(value: unknown): string {
  if (value == null) {
    return ''
  }
  if (value instanceof Date) {
    return ''
  }
  return String(value).trim()
}

function guessYearFromSheet(rows: unknown[][]): number {
  for (const row of rows.slice(0, 8)) {
    for (const cell of row) {
      if (typeof cell === 'number') {
        const key = excelSerialToDateKey(cell)
        if (key) {
          return Number(key.slice(0, 4))
        }
      }
      const text = cellText(cell)
      const m = text.match(/^(\d{4})/)
      if (m) {
        return Number(m[1])
      }
    }
  }
  return new Date().getFullYear()
}

function findDateHeader(rows: unknown[][], year: number): { rowIndex: number; columns: { col: number; dateKey: string }[] } | null {
  let best: { rowIndex: number; columns: { col: number; dateKey: string }[] } | null = null
  const scanLimit = Math.min(rows.length, 12)
  for (let r = 0; r < scanLimit; r++) {
    const row = rows[r] || []
    const columns: { col: number; dateKey: string }[] = []
    for (let c = 0; c < row.length; c++) {
      const dateKey = parseDateCell(row[c], year)
      if (dateKey) {
        columns.push({ col: c, dateKey })
      }
    }
    if (columns.length >= 3 && (!best || columns.length > best.columns.length)) {
      best = { rowIndex: r, columns }
    }
  }
  return best
}

function isLikelyName(text: string): boolean {
  if (!text || text.length > 20) {
    return false
  }
  if (WEEKDAY_CELLS.has(text)) {
    return false
  }
  if (/月|日|双十一|期间|备注|姓名|名字|排班|班次/.test(text)) {
    return false
  }
  if (/^\d+$/.test(text)) {
    return false
  }
  return true
}

/**
 * 解析排班工作簿（取第一张表）。
 */
export async function parseScheduleFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Excel 中没有工作表')
  }
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  }) as unknown[][]

  const year = guessYearFromSheet(rows)
  const header = findDateHeader(rows, year)
  if (!header) {
    throw new Error('未识别到日期表头，请确认格式类似「11月1日」横向排班表')
  }

  const nameCol = Math.max(0, Math.min(...header.columns.map((c) => c.col)) - 1)
  const people: PersonSchedule[] = []

  for (let r = header.rowIndex + 1; r < rows.length; r++) {
    const row = rows[r] || []
    const name = cellText(row[nameCol])
    if (!isLikelyName(name)) {
      continue
    }
    // 跳过纯星期行
    const sample = header.columns.slice(0, 5).map((c) => cellText(row[c.col]))
    if (sample.every((v) => !v || WEEKDAY_CELLS.has(v))) {
      continue
    }
    const days: Record<string, DayShift> = {}
    let hit = 0
    for (const col of header.columns) {
      const raw = row[col.col]
      const text = cellText(raw)
      if (!text) {
        continue
      }
      days[col.dateKey] = normalizeShift(text)
      hit += 1
    }
    if (hit === 0) {
      continue
    }
    people.push({ name, days })
  }

  if (people.length === 0) {
    throw new Error('未识别到人员排班行，请确认首列为人名')
  }

  return { fileName: file.name, people }
}
