/** 人数选项：1～6，默认 1。 */
export const PEOPLE_OPTIONS = ['1人', '2人', '3人', '4人', '5人', '6人']

export function pad2(value: number) {
  return String(value).padStart(2, '0')
}

/** 本地当前日期 yyyy-MM-dd（无服务端时钟接口时用本机时间近似服务器）。 */
export function todayText(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/** 由 yyyy-MM-dd 生成默认活动名：mm月dd日小聚。 */
export function defaultActivityName(dateText: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText.trim())
  if (!match) {
    return ''
  }
  return `${Number(match[2])}月${Number(match[3])}日小聚`
}

export function peopleIndexOf(count: number | string) {
  const value = Number(count)
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    return 0
  }
  return value - 1
}

export function peopleCountOf(index: number) {
  const value = index + 1
  if (value < 1 || value > 6) {
    return 1
  }
  return value
}

/** 活动时间必须晚于当前时刻。 */
export function assertFutureSchedule(dateText: string, timeText: string, now = new Date()) {
  if (!dateText || !timeText) {
    throw new Error('请选择日期和时间')
  }
  const scheduled = new Date(`${dateText}T${timeText}:00`)
  if (Number.isNaN(scheduled.getTime())) {
    throw new Error('时间格式不正确')
  }
  if (scheduled.getTime() <= now.getTime()) {
    throw new Error('只能选择当前时间之后')
  }
}
