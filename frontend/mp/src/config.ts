/**
 * 小程序请求后端的地址。
 * 开发时在微信开发者工具勾选「不校验合法域名」，本机 127.0.0.1 即可；
 * 真机预览时改成电脑的局域网 IP；上线前换成已备案的 https 域名。
 */
export const API_BASE_URL = 'http://127.0.0.1:8080/api'

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
