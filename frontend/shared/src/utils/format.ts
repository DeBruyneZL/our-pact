function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** 把后端时间格式化成 yyyy-MM-dd HH:mm:ss，空值显示为横线。 */
export function formatDateTime(value?: string | number | Date | null): string {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 展示用手机号脱敏，例如 138****0000。 */
export function maskPhone(phone?: string | null): string {
  if (!phone) {
    return '-'
  }
  const value = phone.trim()
  if (!/^1[3-9]\d{9}$/.test(value)) {
    return value
  }
  return `${value.slice(0, 3)}****${value.slice(7)}`
}
