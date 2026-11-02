/**
 * 两人排班可约试算。
 *
 * @author zhangliang
 */
import { isCnHoliday } from './cnHolidays'
import type { DayShift, PersonSchedule, ShiftKind } from './parseSchedule'

export type MeetupResult = 'rest' | 'ok' | 'no' | 'unknown'

export type DayMeetup = {
  date: string
  shiftA: DayShift
  shiftB: DayShift
  result: MeetupResult
  commonRest: boolean
  holiday: boolean
}

export type TrialResult = {
  nameA: string
  nameB: string
  days: DayMeetup[]
}

const RESULT_LABEL: Record<MeetupResult, string> = {
  rest: '休',
  ok: '可约',
  no: '不可约',
  unknown: '未知',
}

export function meetupResultLabel(result: MeetupResult): string {
  return RESULT_LABEL[result]
}

/** 按日合并两人班次 */
export function decideMeetup(a: ShiftKind, b: ShiftKind): MeetupResult {
  if (a === 'unknown' || b === 'unknown') {
    return 'unknown'
  }
  if (a === 'rest' && b === 'rest') {
    return 'rest'
  }
  if (a === 'late' || b === 'late') {
    return 'no'
  }
  const earlyCount = (a === 'early' ? 1 : 0) + (b === 'early' ? 1 : 0)
  if (earlyCount >= 1) {
    // 恰好一人早班，或双方都早班 → 可约
    return 'ok'
  }
  return 'no'
}

/**
 * 对两人日期交集试算。
 */
export function calcMeetup(personA: PersonSchedule, personB: PersonSchedule): TrialResult {
  const dates = Object.keys(personA.days)
    .filter((d) => personB.days[d])
    .sort()

  const days: DayMeetup[] = dates.map((date) => {
    const shiftA = personA.days[date]
    const shiftB = personB.days[date]
    const result = decideMeetup(shiftA.kind, shiftB.kind)
    return {
      date,
      shiftA,
      shiftB,
      result,
      commonRest: result === 'rest',
      holiday: isCnHoliday(date),
    }
  })

  return {
    nameA: personA.name,
    nameB: personB.name,
    days,
  }
}

/** 从试算结果收集涉及的年月 */
export function listMonths(days: DayMeetup[]): { year: number; month: number; key: string }[] {
  const seen = new Set<string>()
  const out: { year: number; month: number; key: string }[] = []
  for (const day of days) {
    const key = day.date.slice(0, 7)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    const [y, m] = key.split('-').map(Number)
    out.push({ year: y, month: m, key })
  }
  return out
}
