import { CANCEL_TEMPLATE_ID } from '@/config'

/**
 * 请求「活动取消通知」授权。
 * 参加后被撤回，或自己发起的活动被驳回时，才能收到这条模板。必须在点击回调里同步调用。
 */
export function requestCancelSubscribe() {
  if (!CANCEL_TEMPLATE_ID) {
    return
  }
  uni.requestSubscribeMessage({
    tmplIds: [CANCEL_TEMPLATE_ID],
    fail: () => {},
  })
}
