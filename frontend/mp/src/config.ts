/**
 * 小程序请求后端的地址。
 * 上线后用已备案的 https 域名，微信要求 request 域名必须是 https。
 * 本机调试时临时改成 http://127.0.0.1:8088/api，并在开发者工具勾选「不校验合法域名」。
 */
export const API_BASE_URL = 'https://kivenlpp.cn/api'

/** 「活动取消通知」订阅消息模板 id（模板编号 1104）。 */
export const CANCEL_TEMPLATE_ID = 'px4ixul8SRHEkuCkC3bHmoS8o08waXztZsPrXf1A2KA'

/** 「退出社团通知」订阅消息模板 id（模板编号 12183），发起人收信。 */
export const LEAVE_TEMPLATE_ID = 'a-OOVjTAYPrsywJ1dkb1Q5TxW5EpC8X51vs-6a133j0'

/** 「新活动发布提醒」订阅消息模板 id（模板编号 432），管理员收信。 */
export const CREATE_TEMPLATE_ID = 'RmvZNgaTHlDeXYC36srB21lYQRLVSEPLtSWgknfP3UE'

/** 后端返回的相对路径（/api/...）转成小程序可加载的绝对地址。 */
export function absoluteUrl(path?: string | null): string {
  if (!path) {
    return ''
  }
  if (/^https?:\/\//.test(path)) {
    return path
  }
  return `${API_BASE_URL.replace(/\/api\/?$/, '')}${path}`
}
