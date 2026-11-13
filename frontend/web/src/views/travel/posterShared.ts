/** 两张长图共用的画布底料：配色、字型、裁剪和文字排版工具。 */

export const WIDTH = 375
export const PAD = 30
export const MAX_CANVAS_SIDE = 8192
export const SONG = 'Songti SC, STSong, serif'
export const SANS = 'PingFang SC, Microsoft YaHei, sans-serif'
export const CREAM = '#fbf7ef'
export const INK = '#2c2a26'
export const MUTED = '#9b958b'
export const AMBER = '#e8973c'
export const AMBER_DEEP = '#cf7a1d'
export const GREEN = '#5b8f7a'
export const DASH = '#d9d0c2'
export const CARD_LINE = '#e9e2d5'

/** 顶部行程色条：琥珀渐到品牌绿，代替任何品牌字样。 */
export function drawTopStrip(ctx: CanvasRenderingContext2D) {
  const strip = ctx.createLinearGradient(0, 0, WIDTH, 0)
  strip.addColorStop(0, AMBER)
  strip.addColorStop(1, GREEN)
  ctx.fillStyle = strip
  ctx.fillRect(0, 0, WIDTH, 8)
}

/** 撕票线：通栏虚线加两侧半圆缺口。 */
export function drawPerforation(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = DASH
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(WIDTH, y)
  ctx.stroke()
  ctx.setLineDash([])
  for (const x of [0, WIDTH]) {
    ctx.fillStyle = CREAM
    ctx.strokeStyle = CARD_LINE
    ctx.beginPath()
    ctx.arc(x, y, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

/** 打卡章：双圈加最多两行字，盖的时候带点倾斜。 */
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  line1: string,
  line2: string,
) {
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(-0.16)
  ctx.globalAlpha = 0.82
  ctx.strokeStyle = AMBER_DEEP
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, 38, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(0, 0, 30, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = AMBER_DEEP
  ctx.textAlign = 'center'
  ctx.font = `600 13px ${SANS}`
  if (line2.trim()) {
    ctx.fillText(line1, 0, -13)
    ctx.font = `10px ${SANS}`
    ctx.fillText(line2, 0, 8)
  } else {
    ctx.fillText(line1, 0, -6)
  }
  ctx.restore()
}

/** 按长边裁满，避免拉伸变形。 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / image.width, h / image.height)
  if (!Number.isFinite(scale)) {
    return
  }
  const dw = image.width * scale
  const dh = image.height * scale
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

export function clipRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** 逐字换行，超出行数在末行加省略号。 */
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const source = text.trim()
  if (!source || maxLines <= 0) {
    return [] as string[]
  }
  const chars = Array.from(source)
  const lines: string[] = []
  let current = ''
  for (let index = 0; index < chars.length; index += 1) {
    const next = current + chars[index]
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = chars[index]
      if (lines.length === maxLines) {
        break
      }
    } else {
      current = next
    }
  }
  if (lines.length < maxLines && current) {
    lines.push(current)
  }
  const consumed = lines.join('').length
  if (consumed < chars.length && lines.length) {
    lines[lines.length - 1] = ellipsis(ctx, lines[lines.length - 1], maxWidth)
  }
  return lines
}

export function ellipsis(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const source = text.trim()
  if (!source || ctx.measureText(source).width <= maxWidth) {
    return source
  }
  let value = source
  while (value && ctx.measureText(`${value}…`).width > maxWidth) {
    value = Array.from(value).slice(0, -1).join('')
  }
  return value ? `${value}…` : '…'
}

/** 加载图片，失败返回 null，不阻塞整张图。 */
export function loadImage(src: string) {
  const url = src.trim()
  if (!url) {
    return Promise.resolve(null)
  }
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = url
  })
}
