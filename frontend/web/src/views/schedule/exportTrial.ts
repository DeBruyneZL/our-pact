/**
 * 试算结果导出为 Excel（仅浏览器下载，不落库）。
 *
 * @author zhangliang
 */
import * as XLSX from 'xlsx'
import { meetupResultLabel, type TrialResult } from './calcMeetup'

export function exportTrialExcel(trial: TrialResult): void {
  const rows = trial.days.map((d) => ({
    日期: d.date,
    [`${trial.nameA}班次`]: d.shiftA.raw || '-',
    [`${trial.nameB}班次`]: d.shiftB.raw || '-',
    结果: meetupResultLabel(d.result),
    法定休息日: d.holiday ? '是' : '否',
    共同休息日: d.commonRest ? '是' : '否',
  }))

  const sheet = XLSX.utils.json_to_sheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, '日程试算')
  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(book, `日程试算_${trial.nameA}_${trial.nameB}_${stamp}.xlsx`)
}
