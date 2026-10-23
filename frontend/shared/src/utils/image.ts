const MAX_EDGE = 960
const MAX_BYTES = 2 * 1024 * 1024

/** 把图片压成较短的 JPEG data URL，避免本地菜单和活动照片撑满存储。 */
export function readImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('请选择图片文件'))
  }
  if (file.size > MAX_BYTES) {
    return Promise.reject(new Error('图片请小于 2MB'))
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      const longest = Math.max(image.width, image.height)
      const scale = longest > 0 ? Math.min(1, MAX_EDGE / longest) : 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('图片处理失败'))
        return
      }
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    image.src = url
  })
}
