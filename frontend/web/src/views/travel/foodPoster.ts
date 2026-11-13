/** 旅行美食长图。票据风：打卡章、撕票虚线、拍立得照片，落款「下一站见」。画布工具在 posterShared。 */

import {
  AMBER,
  AMBER_DEEP,
  CARD_LINE,
  CREAM,
  DASH,
  GREEN,
  INK,
  MAX_CANVAS_SIDE,
  MUTED,
  PAD,
  SANS,
  SONG,
  WIDTH,
  clipRoundRect,
  drawImageCover,
  drawPerforation,
  drawStamp,
  drawTopStrip,
  ellipsis,
  loadImage,
  wrap,
} from './posterShared'

/** 地点照片条高度，照片加载失败不占位 */
const HERO_HEIGHT = 150

export interface FoodPosterItem {
  dishName: string
  shopName: string
  note: string
  photoUrl: string
}

export interface FoodPosterInput {
  spotName: string
  regionText: string
  visitedOn: string
  note: string
  coverUrl: string
  foods: FoodPosterItem[]
}

interface FoodLine {
  title: string
  extraLines: string[]
  row: number
  hasPhoto: boolean
  initial: string
}

interface Layout {
  height: number
  nameLines: string[]
  metaLines: string[]
  noteLines: string[]
  headerEnd: number
  heroTop: number
  labelY: number
  listTop: number
  foods: FoodLine[]
  footerTop: number
  stampDate: string
}

/** 先加载图片再量版：照片有没有加载成功决定照片条和拍立得占不占位。 */
export async function paintFoodPoster(canvas: HTMLCanvasElement, input: FoodPosterInput) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('画布不可用')
  }
  canvas.width = WIDTH
  canvas.height = 200
  const [cover, photos] = await Promise.all([
    loadImage(input.coverUrl),
    Promise.all(input.foods.map((food) => loadImage(food.photoUrl))),
  ])
  const layout = measure(ctx, input, Boolean(cover))
  const scale = layout.height * 2 <= MAX_CANVAS_SIDE ? 2 : 1
  canvas.width = WIDTH * scale
  canvas.height = Math.ceil(layout.height * scale)
  ctx.scale(scale, scale)
  draw(ctx, input, layout, cover, photos)
}

function measure(ctx: CanvasRenderingContext2D, input: FoodPosterInput, hasHero: boolean): Layout {
  const name = input.spotName.trim() || '这一站'
  ctx.font = `700 28px ${SONG}`
  const nameLines = wrap(ctx, name, WIDTH - PAD * 2, 2)

  const metaSource = [input.visitedOn.trim(), input.regionText.trim()].filter(Boolean).join(' · ')
  ctx.font = `12px ${SANS}`
  const metaLines = wrap(ctx, metaSource, WIDTH - PAD * 2, 2)

  ctx.font = `13px ${SONG}`
  const noteLines = input.note.trim() ? wrap(ctx, input.note.trim(), WIDTH - PAD * 2, 2) : []

  let headerEnd = 70 + nameLines.length * 36 + 8 + metaLines.length * 18
  if (noteLines.length) {
    headerEnd += 6 + noteLines.length * 19
  }

  let heroTop = 0
  let labelY = headerEnd + 26
  if (hasHero) {
    heroTop = headerEnd + 14
    labelY = heroTop + HERO_HEIGHT + 18
  }
  const listTop = labelY + 22

  const foods = input.foods.map((food) => {
    const hasPhoto = Boolean(food.photoUrl.trim())
    const column = hasPhoto ? WIDTH - PAD * 2 - 90 : WIDTH - PAD * 2
    ctx.font = `700 16px ${SANS}`
    const title = ellipsis(ctx, food.dishName.trim() || '未命名', column)
    ctx.font = `12px ${SANS}`
    const extra = [food.shopName.trim(), food.note.trim()].filter(Boolean).join(' · ')
    const extraLines = wrap(ctx, extra, column, 2)
    const textH = 24 + extraLines.length * 18
    return {
      title,
      extraLines,
      row: hasPhoto ? Math.max(86, textH + 12) : Math.max(textH, 42),
      hasPhoto,
      initial: Array.from(food.dishName.trim())[0] || '食',
    }
  })

  let listEnd = listTop
  if (!foods.length) {
    listEnd += 30
  }
  for (const food of foods) {
    listEnd += food.row + 14
  }

  const footerTop = listEnd + 6
  const stampDate = (input.visitedOn.trim() || '').replace(/-/g, '.')
  return {
    height: footerTop + 118,
    nameLines,
    metaLines,
    noteLines,
    headerEnd,
    heroTop,
    labelY,
    listTop,
    foods,
    footerTop,
    stampDate,
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  input: FoodPosterInput,
  layout: Layout,
  cover: HTMLImageElement | null,
  photos: Array<HTMLImageElement | null>,
) {
  ctx.textBaseline = 'top'
  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, WIDTH, layout.height)
  drawTopStrip(ctx)

  // 眉题
  ctx.fillStyle = AMBER_DEEP
  ctx.font = `600 10px ${SANS}`
  ctx.fillText('T R A V E L   F O O D   L O G', PAD, 42)

  // 地点名与行程信息
  ctx.fillStyle = INK
  ctx.font = `700 28px ${SONG}`
  let y = 70
  for (const line of layout.nameLines) {
    ctx.fillText(line, PAD, y)
    y += 36
  }
  y += 8
  ctx.fillStyle = MUTED
  ctx.font = `12px ${SANS}`
  for (const line of layout.metaLines) {
    ctx.fillText(line, PAD, y)
    y += 18
  }
  if (layout.noteLines.length) {
    y += 6
    ctx.fillStyle = GREEN
    ctx.font = `13px ${SONG}`
    for (const line of layout.noteLines) {
      ctx.fillText(line, PAD, y)
      y += 19
    }
  }

  // 地点照片条 + 位置小签
  if (cover) {
    drawRounded(ctx, PAD, layout.heroTop, WIDTH - PAD * 2, HERO_HEIGHT, 10)
    ctx.save()
    clipRoundRect(ctx, PAD, layout.heroTop, WIDTH - PAD * 2, HERO_HEIGHT, 10)
    ctx.clip()
    drawImageCover(ctx, cover, PAD, layout.heroTop, WIDTH - PAD * 2, HERO_HEIGHT)
    ctx.restore()
    const chipText = ellipsis(ctx, input.regionText.split(' · ').pop() || input.spotName, 170)
    ctx.font = `600 11px ${SANS}`
    const chipWidth = ctx.measureText(chipText).width + 22
    ctx.fillStyle = 'rgba(232, 151, 60, 0.92)'
    clipRoundRect(ctx, PAD + 10, layout.heroTop + HERO_HEIGHT - 30, chipWidth, 22, 11)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText(chipText, PAD + 21, layout.heroTop + HERO_HEIGHT - 24)
  }

  // 分节：这一站吃了什么
  ctx.fillStyle = INK
  ctx.font = `700 13px ${SANS}`
  const label = layout.foods.length ? '这一站吃了什么' : '这一站还没开动'
  ctx.fillText(label, PAD, layout.labelY)
  const labelWidth = ctx.measureText(label).width
  ctx.strokeStyle = DASH
  ctx.lineWidth = 1
  ctx.setLineDash([4, 5])
  ctx.beginPath()
  ctx.moveTo(PAD + labelWidth + 12, layout.labelY + 7)
  ctx.lineTo(WIDTH - PAD, layout.labelY + 7)
  ctx.stroke()
  ctx.setLineDash([])

  // 美食列表：拍立得照片或琥珀字牌
  let listY = layout.listTop
  layout.foods.forEach((food, index) => {
    const photo = photos[index]
    const textX = food.hasPhoto ? PAD + 90 : PAD
    if (food.hasPhoto) {
      ctx.fillStyle = '#fff'
      clipRoundRect(ctx, PAD, listY, 78, 78, 6)
      ctx.fill()
    }
    if (photo) {
      ctx.save()
      clipRoundRect(ctx, PAD + 4, listY + 4, 70, 70, 4)
      ctx.clip()
      drawImageCover(ctx, photo, PAD + 4, listY + 4, 70, 70)
      ctx.restore()
      ctx.strokeStyle = CARD_LINE
      ctx.lineWidth = 1
      clipRoundRect(ctx, PAD + 4.5, listY + 4.5, 69, 69, 4)
      ctx.stroke()
    } else if (food.hasPhoto) {
      ctx.fillStyle = AMBER
      clipRoundRect(ctx, PAD + 4, listY + 4, 70, 70, 4)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `700 26px ${SONG}`
      ctx.fillText(food.initial, PAD + 4 + (70 - ctx.measureText(food.initial).width) / 2, listY + 22)
    }
    ctx.fillStyle = INK
    ctx.font = `700 16px ${SANS}`
    ctx.fillText(food.title, textX, listY + 4)
    ctx.fillStyle = MUTED
    ctx.font = `12px ${SANS}`
    food.extraLines.forEach((line, lineIndex) => {
      ctx.fillText(line, textX, listY + 28 + lineIndex * 18)
    })
    listY += food.row + 14
    if (index < layout.foods.length - 1) {
      ctx.strokeStyle = DASH
      ctx.setLineDash([4, 5])
      ctx.beginPath()
      ctx.moveTo(PAD, listY - 7)
      ctx.lineTo(WIDTH - PAD, listY - 7)
      ctx.stroke()
      ctx.setLineDash([])
    }
  })
  if (!layout.foods.length) {
    ctx.fillStyle = MUTED
    ctx.font = `13px ${SANS}`
    ctx.fillText('记一笔再来看，长图会更热闹。', PAD, listY)
  }

  // 撕票收尾
  drawPerforation(ctx, layout.footerTop)
  ctx.fillStyle = AMBER_DEEP
  ctx.font = `700 18px ${SONG}`
  ctx.fillText('下一站见', PAD, layout.footerTop + 24)
  ctx.fillStyle = MUTED
  ctx.font = `11px ${SANS}`
  const countText = `共 ${input.foods.length} 笔`
  ctx.fillText(countText, WIDTH - PAD - ctx.measureText(countText).width, layout.footerTop + 30)
  drawStamp(
    ctx,
    WIDTH - PAD - 44,
    layout.footerTop + 66,
    layout.stampDate ? '到此一游' : '路 过',
    layout.stampDate,
  )
}

function drawRounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  clipRoundRect(ctx, x, y, w, h, r)
  ctx.fillStyle = 'rgba(233, 226, 213, 0.6)'
  ctx.fill()
}
