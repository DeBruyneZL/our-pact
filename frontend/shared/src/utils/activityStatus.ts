import type { ActivityStatus } from '../types/pact'

/** 给用户看的活动状态。内部取值仍是 open / replied / withdrawn / completed。 */
const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  open: '待确认',
  replied: '待参加',
  withdrawn: '已取消',
  completed: '已完成',
}

export function activityStatusLabel(status: ActivityStatus): string {
  return ACTIVITY_STATUS_LABEL[status]
}
