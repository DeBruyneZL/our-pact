/** 旅行纪念长图。夜间地图风：深松绿底、星点、金色站点编号、四格数据栏，与美食票据风完全区分。画布工具在 posterShared。 */

import {
  MAX_CANVAS_SIDE,
  PAD,
  SANS,
  SONG,
  WIDTH,
  clipRoundRect,
  drawImageCover,
  ellipsis,
  loadImage,
  wrap,
} from './posterShared'

/** 本图专属配色：深夜松绿底、米白字、暗金点缀 */
const BG = '#1c2a26'
const NODE_BG = '#263a34'
const PAPER = '#f4efe4'
const MUTED_LIGHT = '#93a89e'
const GOLD = '#d8b678'
const LINE_FAINT = 'rgba(244, 239, 228, 0.28)'
const NOTE_SOFT = 'rgba(244, 239, 228, 0.78)'

/** 旅程线中心的横坐标，站点文字从它右边开始 */
const LINE_X = PAD + 14
const TEXT_X = LINE_X + 30
/** 站点缩略图边长 */
const PHOTO_SIZE = 100
/** 数据栏顶边 */
const BAND_TOP = 122
/** 数据栏行高 */
const BAND_ROW = 56
/** 路线列表顶边 */
const LIST_TOP = 234

/** 星点固定位置，避免随机导致每次生成长得不一样 */
const STARS: Array<[number, number, number]> = [
  [52, 40, 1.2],
  [96, 26, 0.9],
  [150, 48, 1.4],
  [210, 30, 0.8],
  [268, 44, 1.2],
  [318, 22, 1.0],
  [340, 60, 0.8],
  [80, 70, 1.0],
  [190, 72, 1.3],
  [300, 74, 0.9],
  [36, 86, 1.0],
  [240, 86, 1.1],
]

export interface TravelPosterStats {
  /** 点亮的地点总数 */
  spotCount: number
  districtCount: number
  cityCount: number
  provinceCount: number
}

export interface TravelPosterSpot {
  name: string
  regionText: string
  visitedOn: string
  note: string
  photoUrl: string
  foodCount: number
}

export interface TravelPosterInput {
  stats: TravelPosterStats
  /** 例如「2021-08-12 – 2026-11-01」 */
  rangeText: string
  /** 年份跨度，例如「2021–2026」 */
  yearText: string
  spots: TravelPosterSpot[]
}

interface StopLine {
  dateText: string
  name: string
  regionText: string
  noteLines: string[]
  foodText: string
  hasPhoto: boolean
  row: number
}

interface Layout {
  height: number
  rangeText: string
  stops: StopLine[]
  lineEnd: number
  footerTop: number
}

/** 照片加载成功的站才留缩略图位，先加载再量版。 */
export async function paintTravelPoster(canvas: HTMLCanvasElement, input: TravelPosterInput) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('画布不可用')
  }
  canvas.width = WIDTH
  canvas.height = 200
  const photos = await Promise.all(input.spots.map((spot) => loadImage(spot.photoUrl)))
  const layout = measure(ctx, input, photos.map(Boolean))
  const scale = layout.height * 2 <= MAX_CANVAS_SIDE ? 2 : 1
  canvas.width = WIDTH * scale
  canvas.height = Math.ceil(layout.height * scale)
  ctx.scale(scale, scale)
  draw(ctx, input, layout, photos)
}

function measure(
  ctx: CanvasRenderingContext2D,
  input: TravelPosterInput,
  photoFlags: boolean[],
): Layout {
  ctx.font = `12px ${SANS}`
  const rangeText = ellipsis(ctx, input.rangeText.trim(), WIDTH - PAD * 2)

  let cursor = LIST_TOP
  const stops = input.spots.map((spot, index) => {
    const hasPhoto = photoFlags[index]
    const photoX = WIDTH - PAD - PHOTO_SIZE
    const textW = hasPhoto ? photoX - 14 - TEXT_X : WIDTH - PAD - TEXT_X
    ctx.font = `700 17px ${SONG}`
    const name = ellipsis(ctx, spot.name.trim() || '未命名', textW)
    ctx.font = `11px ${SANS}`
    const regionText = ellipsis(ctx, spot.regionText.trim(), textW)
    ctx.font = `12px ${SONG}`
    const noteLines = wrap(ctx, spot.note.trim(), textW, 2)
    const foodText = spot.foodCount > 0 ? `这一站吃了 ${spot.foodCount} 笔` : ''
    const textH = 16 + 24 + 18 + noteLines.length * 16 + (foodText ? 22 : 0)
    const row = Math.max(hasPhoto ? PHOTO_SIZE + 6 : 0, textH) + 24
    cursor += row
    return {
      dateText: (spot.visitedOn.trim() || '—').replace(/-/g, '.'),
      name,
      regionText,
      noteLines,
      foodText,
      hasPhoto,
      row,
    }
  })

  const lineEnd = stops.length ? cursor - 24 + 12 : LIST_TOP + 40
  const footerTop = lineEnd + 14
  return {
    height: footerTop + 74,
    rangeText,
    stops,
    lineEnd,
    footerTop,
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  input: TravelPosterInput,
  layout: Layout,
  photos: Array<HTMLImageElement | null>,
) {
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  // 夜色底 + 顶部微光
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, WIDTH, layout.height)
  const glow = ctx.createRadialGradient(WIDTH / 2, 30, 10, WIDTH / 2, 30, 340)
  glow.addColorStop(0, 'rgba(91, 143, 122, 0.32)')
  glow.addColorStop(1, 'rgba(91, 143, 122, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, 360)

  // 星点
  for (const [x, y, r] of STARS) {
    ctx.globalAlpha = 0.35 + (r - 0.8) * 0.3
    ctx.fillStyle = PAPER
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // 头部
  ctx.fillStyle = GOLD
  ctx.font = `600 10px ${SANS}`
  ctx.fillText('T R A V E L   L O G', PAD, 34)
  ctx.fillStyle = PAPER
  ctx.font = `700 30px ${SONG}`
  ctx.fillText('旅行纪念', PAD, 54)
  const yearText = input.yearText.trim()
  if (yearText) {
    ctx.fillStyle = MUTED_LIGHT
    ctx.font = `11px ${SANS}`
    ctx.fillText(yearText, WIDTH - PAD - ctx.measureText(yearText).width, 66)
  }
  ctx.fillStyle = MUTED_LIGHT
  ctx.font = `12px ${SANS}`
  ctx.fillText(layout.rangeText, PAD, 98)

  // 数据栏：地点 / 区县 / 城市 / 省份
  drawStatsBand(ctx, input.stats)

  // 分节：走过的地方
  ctx.fillStyle = PAPER
  ctx.font = `700 13px ${SANS}`
  ctx.fillText('走过的地方', PAD, BAND_TOP + BAND_ROW + 18)
  ctx.fillStyle = GOLD
  ctx.fillRect(PAD, BAND_TOP + BAND_ROW + 40, 26, 3)

  // 旅程虚线，先画在节点下面
  ctx.strokeStyle = LINE_FAINT
  ctx.lineWidth = 1.5
  ctx.setLineDash([2, 6])
  ctx.beginPath()
  ctx.moveTo(LINE_X, LIST_TOP + 6)
  ctx.lineTo(LINE_X, layout.lineEnd)
  ctx.stroke()
  ctx.setLineDash([])

  let stopTop = LIST_TOP
  if (!layout.stops.length) {
    ctx.fillStyle = MUTED_LIGHT
    ctx.font = `13px ${SANS}`
    ctx.fillText('还没有点亮的地方，先去地图上标记第一个吧。', TEXT_X, stopTop + 2)
  }
  layout.stops.forEach((stop, index) => {
    // 站点编号节点：深底金圈
    ctx.beginPath()
    ctx.arc(LINE_X, stopTop + 10, 11, 0, Math.PI * 2)
    ctx.fillStyle = NODE_BG
    ctx.fill()
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = GOLD
    ctx.font = `700 8px ${SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(index + 1).padStart(2, '0'), LINE_X, stopTop + 10.5)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    ctx.fillStyle = GOLD
    ctx.font = `700 11px ${SANS}`
    ctx.fillText(stop.dateText, TEXT_X, stopTop)
    ctx.fillStyle = PAPER
    ctx.font = `700 17px ${SONG}`
    ctx.fillText(stop.name, TEXT_X, stopTop + 16)
    ctx.fillStyle = MUTED_LIGHT
    ctx.font = `11px ${SANS}`
    ctx.fillText(stop.regionText, TEXT_X, stopTop + 40)
    let foodY = stopTop + 58 + 6
    if (stop.noteLines.length) {
      ctx.fillStyle = NOTE_SOFT
      ctx.font = `12px ${SONG}`
      let noteY = stopTop + 58
      for (const noteLine of stop.noteLines) {
        ctx.fillText(noteLine, TEXT_X, noteY)
        noteY += 16
      }
      foodY = noteY + 6
    }
    if (stop.foodText) {
      ctx.fillStyle = GOLD
      ctx.font = `11px ${SANS}`
      ctx.fillText(stop.foodText, TEXT_X, foodY)
    }

    // 站点缩略图：圆角淡边
    const photo = photos[index]
    if (stop.hasPhoto && photo) {
      const photoX = WIDTH - PAD - PHOTO_SIZE
      clipRoundRect(ctx, photoX, stopTop, PHOTO_SIZE, PHOTO_SIZE, 10)
      ctx.save()
      ctx.clip()
      drawImageCover(ctx, photo, photoX, stopTop, PHOTO_SIZE, PHOTO_SIZE)
      ctx.restore()
      ctx.strokeStyle = LINE_FAINT
      ctx.lineWidth = 1
      clipRoundRect(ctx, photoX + 0.5, stopTop + 0.5, PHOTO_SIZE - 1, PHOTO_SIZE - 1, 10)
      ctx.stroke()
    }
    stopTop += stop.row
  })

  // 收尾：虚线、下一站见、总站点数
  ctx.strokeStyle = LINE_FAINT
  ctx.setLineDash([3, 6])
  ctx.beginPath()
  ctx.moveTo(PAD, layout.footerTop)
  ctx.lineTo(WIDTH - PAD, layout.footerTop)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = PAPER
  ctx.font = `700 18px ${SONG}`
  ctx.fillText('下一站见', PAD, layout.footerTop + 18)
  ctx.fillStyle = MUTED_LIGHT
  ctx.font = `11px ${SANS}`
  const countText = `共 ${input.spots.length} 站`
  ctx.fillText(countText, WIDTH - PAD - ctx.measureText(countText).width, layout.footerTop + 24)
  ctx.textAlign = 'center'
  ctx.fillStyle = GOLD
  ctx.globalAlpha = 0.7
  ctx.font = `600 9px ${SANS}`
  ctx.fillText('F O O T P R I N T   M E M O', WIDTH / 2, layout.footerTop + 54)
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'
}

/** 四格数据栏：大数字在上、小标签在下，栏间细竖线。 */
function drawStatsBand(ctx: CanvasRenderingContext2D, stats: TravelPosterStats) {
  const innerW = WIDTH - PAD * 2
  const colW = innerW / 4
  const columns: Array<[number, string]> = [
    [stats.spotCount, '地点'],
    [stats.districtCount, '区县'],
    [stats.cityCount, '城市'],
    [stats.provinceCount, '省份'],
  ]
  columns.forEach(([value, label], index) => {
    const cx = PAD + colW * index + colW / 2
    ctx.textAlign = 'center'
    ctx.fillStyle = PAPER
    ctx.font = `700 22px ${SONG}`
    ctx.fillText(String(value), cx, BAND_TOP)
    ctx.fillStyle = MUTED_LIGHT
    ctx.font = `10px ${SANS}`
    ctx.fillText(label, cx, BAND_TOP + 30)
    if (index > 0) {
      ctx.strokeStyle = LINE_FAINT
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD + colW * index, BAND_TOP + 6)
      ctx.lineTo(PAD + colW * index, BAND_TOP + 40)
      ctx.stroke()
    }
  })
  ctx.textAlign = 'left'
}
