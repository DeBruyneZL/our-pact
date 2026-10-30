/** 活动菜单长图。版式接近纸本私厨菜单：竖排主厨名、朱印、菜名，底部留一笔淡山。 */

const WIDTH = 375
const PAD = 36
const MAX_CANVAS_SIDE = 8192
const SONG = 'Songti SC, STSong, serif'
const PAPER = '#f3eee4'
const INK = '#2c2824'
const MUTED = '#8a8176'
const LINE = '#d5cdc0'
const SEAL = '#8f3d36'
const MOUNTAIN = '#e3dacd'
const RIDGE = '#efe8dc'

export interface PosterDish {
  title: string
  extra: string
  imageUrl: string
}

export interface MenuPosterInput {
  chefName: string
  chefTitle: string
  chefAvatarUrl: string
  shopLocation: string
  slogan: string
  activityName: string
  whenText: string
  peopleText: string
  dishes: PosterDish[]
}

interface PosterImage {
  width: number
  height: number
}

interface PosterCanvas {
  width: number
  height: number
  createImage: () => {
    src: string
    width: number
    height: number
    onload: (() => void) | null
    onerror: (() => void) | null
  }
  getContext: (type: '2d') => PosterContext
}

interface PosterContext {
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  font: string
  textBaseline: string
  fillRect: (x: number, y: number, w: number, h: number) => void
  fillText: (text: string, x: number, y: number) => void
  measureText: (text: string) => { width: number }
  drawImage: (image: PosterImage, x: number, y: number, w: number, h: number) => void
  save: () => void
  restore: () => void
  beginPath: () => void
  closePath: () => void
  clip: () => void
  fill: () => void
  stroke: () => void
  moveTo: (x: number, y: number) => void
  lineTo: (x: number, y: number) => void
  quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => void
  arc: (x: number, y: number, r: number, start: number, end: number) => void
  arcTo: (x1: number, y1: number, x2: number, y2: number, r: number) => void
  scale: (x: number, y: number) => void
}

interface DishLine {
  title: string
  extraLines: string[]
  row: number
  hasPhoto: boolean
}

interface Layout {
  height: number
  verticalName: string[]
  horizontalName: string
  seal: string
  activityLines: string[]
  metaLines: string[]
  rightX: number
  headerTop: number
  leftEnd: number
  splitY: number
  dishes: DishLine[]
  footerTop: number
}

export async function paintMenuPoster(canvas: PosterCanvas, input: MenuPosterInput) {
  const ctx = canvas.getContext('2d')
  canvas.width = WIDTH
  canvas.height = 200
  const measured = measure(ctx, input)
  const [avatar, covers] = await Promise.all([
    loadImage(canvas, input.chefAvatarUrl),
    Promise.all(input.dishes.map((dish) => loadImage(canvas, dish.imageUrl))),
  ])
  const scale = measured.height * 2 <= MAX_CANVAS_SIDE ? 2 : 1
  canvas.width = WIDTH * scale
  canvas.height = Math.ceil(measured.height * scale)
  ctx.scale(scale, scale)
  draw(ctx, input, measured, avatar, covers)
}

function measure(ctx: PosterContext, input: MenuPosterInput): Layout {
  const verticalName = nameColumn(input.chefName)
  const hasColumn = Boolean(input.chefAvatarUrl || verticalName.length || input.chefTitle.trim())
  const rightX = hasColumn ? 132 : PAD
  const rightW = WIDTH - PAD - rightX
  ctx.font = `600 22px ${SONG}`
  const activityLines = wrap(ctx, input.activityName || '小聚', rightW, 2)
  ctx.font = `13px sans-serif`
  const horizontalName = verticalName.length ? '' : ellipsis(ctx, input.chefName, rightW)
  const metaLines = metaOf(ctx, input, rightW)
  const textW = WIDTH - PAD - (PAD + 86)
  const dishes = input.dishes.map((dish) => {
    const hasPhoto = Boolean(dish.imageUrl)
    const column = hasPhoto ? textW : WIDTH - PAD * 2
    ctx.font = `600 18px ${SONG}`
    const title = ellipsis(ctx, dish.title || '未命名', column)
    ctx.font = `12px sans-serif`
    const extraLines = wrap(ctx, dish.extra, column, 2)
    const textHeight = 24 + extraLines.length * 18
    return { title, extraLines, row: Math.max(hasPhoto ? 76 : textHeight, textHeight), hasPhoto }
  })

  const headerTop = 86
  let leftEnd = headerTop
  if (verticalName.length) {
    leftEnd += verticalName.length * 40
  }
  if (input.chefTitle.trim()) {
    leftEnd += 8 + 26
  }
  if (input.chefAvatarUrl) {
    leftEnd += 14 + 48
  }
  const rightEnd = headerTop
    + (horizontalName ? 24 : 0)
    + activityLines.length * 32
    + 4
    + metaLines.length * 20
  const splitY = Math.max(leftEnd, rightEnd) + 22
  let body = splitY + 36
  if (!dishes.length) {
    body += 28
  }
  for (const dish of dishes) {
    body += dish.row + 18
  }
  const footerTop = body + 8
  return {
    height: footerTop + 108,
    verticalName,
    horizontalName,
    seal: Array.from(input.chefTitle.trim())[0] || '',
    activityLines,
    metaLines,
    rightX,
    headerTop,
    leftEnd,
    splitY,
    dishes,
    footerTop,
  }
}

function metaOf(ctx: PosterContext, input: MenuPosterInput, width: number) {
  const lines: string[] = []
  if (input.whenText.trim()) {
    lines.push(ellipsis(ctx, input.whenText.trim(), width))
  }
  if (input.peopleText.trim()) {
    lines.push(ellipsis(ctx, input.peopleText.trim(), width))
  }
  const place = input.shopLocation.trim()
  if (place && !input.whenText.includes(place)) {
    lines.push(...wrap(ctx, place, width, 2))
  }
  const slogan = input.slogan.trim()
  if (slogan) {
    lines.push(ellipsis(ctx, slogan, width))
  }
  return lines
}

function nameColumn(name: string) {
  const chars = Array.from(name.trim())
  if (!chars.length || chars.length > 4) {
    return [] as string[]
  }
  return chars
}

function draw(
  ctx: PosterContext,
  input: MenuPosterInput,
  layout: Layout,
  avatar: PosterImage | null,
  covers: Array<PosterImage | null>,
) {
  ctx.textBaseline = 'top'
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, WIDTH, layout.height)
  drawBrand(ctx)

  let leftY = layout.headerTop
  ctx.fillStyle = INK
  ctx.font = `600 32px ${SONG}`
  for (const char of layout.verticalName) {
    ctx.fillText(char, PAD, leftY)
    leftY += 40
  }
  if (layout.seal) {
    leftY += 8
    drawSeal(ctx, layout.seal, PAD + 2, leftY)
    leftY += 26
  }
  if (avatar) {
    leftY += 14
    drawCircleImage(ctx, avatar, PAD, leftY, 46)
  }

  if (layout.verticalName.length || layout.seal || avatar) {
    ctx.fillStyle = LINE
    ctx.fillRect(112, layout.headerTop, 1, Math.max(24, layout.splitY - layout.headerTop - 28))
  }

  let rightY = layout.headerTop
  if (layout.horizontalName) {
    ctx.fillStyle = INK
    ctx.font = `600 18px ${SONG}`
    ctx.fillText(layout.horizontalName, layout.rightX, rightY)
    rightY += 24
  }
  ctx.fillStyle = INK
  ctx.font = `600 22px ${SONG}`
  for (const line of layout.activityLines) {
    ctx.fillText(line, layout.rightX, rightY)
    rightY += 32
  }
  rightY += 4
  ctx.fillStyle = MUTED
  ctx.font = `13px sans-serif`
  for (const line of layout.metaLines) {
    ctx.fillText(line, layout.rightX, rightY)
    rightY += 20
  }

  drawSectionRule(ctx, layout.splitY)

  let y = layout.splitY + 28
  if (!layout.dishes.length) {
    ctx.fillStyle = MUTED
    ctx.font = `13px sans-serif`
    ctx.fillText('还没有菜', PAD, y)
  }
  layout.dishes.forEach((dish, index) => {
    const cover = covers[index]
    const textX = dish.hasPhoto ? PAD + 86 : PAD
    if (cover) {
      drawCover(ctx, cover, PAD, y + 2, 70)
    }
    ctx.fillStyle = INK
    ctx.font = `600 18px ${SONG}`
    ctx.fillText(dish.title, textX, y + 8)
    ctx.fillStyle = MUTED
    ctx.font = `12px sans-serif`
    dish.extraLines.forEach((line, lineIndex) => {
      ctx.fillText(line, textX, y + 32 + lineIndex * 18)
    })
    y += dish.row + 18
  })

  drawMountains(ctx, layout.footerTop + 28, layout.height)
  ctx.fillStyle = MUTED
  ctx.font = `12px ${SONG}`
  const foot = `共 ${input.dishes.length} 道  ·  ${input.peopleText}`
  const footWidth = ctx.measureText(foot).width
  ctx.fillText(foot, (WIDTH - footWidth) / 2, layout.footerTop)
}

function drawBrand(ctx: PosterContext) {
  ctx.fillStyle = INK
  ctx.font = `500 14px ${SONG}`
  const chars = ['饭', '否']
  const gap = 12
  const widths = chars.map((char) => ctx.measureText(char).width)
  const total = widths.reduce((sum, width) => sum + width, 0) + gap
  let x = (WIDTH - total) / 2
  chars.forEach((char, index) => {
    ctx.fillText(char, x, 40)
    x += widths[index] + gap
  })
}

function drawSeal(ctx: PosterContext, char: string, x: number, y: number) {
  ctx.fillStyle = SEAL
  ctx.fillRect(x, y, 26, 26)
  ctx.fillStyle = '#f6efe6'
  ctx.font = `600 14px ${SONG}`
  const width = ctx.measureText(char).width
  ctx.fillText(char, x + (26 - width) / 2, y + 5)
}

function drawSectionRule(ctx: PosterContext, y: number) {
  ctx.font = `500 12px ${SONG}`
  const label = '菜单'
  const labelWidth = ctx.measureText(label).width
  const mid = WIDTH / 2
  ctx.fillStyle = LINE
  ctx.fillRect(PAD, y, mid - labelWidth / 2 - 14 - PAD, 1)
  ctx.fillRect(mid + labelWidth / 2 + 14, y, WIDTH - PAD - (mid + labelWidth / 2 + 14), 1)
  ctx.fillStyle = MUTED
  ctx.fillText(label, mid - labelWidth / 2, y - 8)
}

function drawMountains(ctx: PosterContext, top: number, bottom: number) {
  const height = bottom - top
  ctx.fillStyle = RIDGE
  ctx.beginPath()
  ctx.moveTo(0, bottom)
  ctx.lineTo(0, top + height * 0.62)
  ctx.quadraticCurveTo(70, top + height * 0.28, 130, top + height * 0.55)
  ctx.quadraticCurveTo(190, top + height * 0.82, 250, top + height * 0.4)
  ctx.quadraticCurveTo(310, top + height * 0.12, WIDTH, top + height * 0.48)
  ctx.lineTo(WIDTH, bottom)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = MOUNTAIN
  ctx.beginPath()
  ctx.moveTo(0, bottom)
  ctx.lineTo(0, top + height * 0.78)
  ctx.quadraticCurveTo(80, top + height * 0.5, 150, top + height * 0.72)
  ctx.quadraticCurveTo(230, top + height * 0.95, 300, top + height * 0.58)
  ctx.quadraticCurveTo(340, top + height * 0.42, WIDTH, top + height * 0.66)
  ctx.lineTo(WIDTH, bottom)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#cfc4b4'
  ctx.fillRect(0, bottom - 8, WIDTH, 8)
}

function drawCircleImage(ctx: PosterContext, image: PosterImage, x: number, y: number, size: number) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.clip()
  drawImageCover(ctx, image, x, y, size, size)
  ctx.restore()
}

function drawCover(ctx: PosterContext, image: PosterImage, x: number, y: number, size: number) {
  ctx.save()
  clipRoundRect(ctx, x, y, size, size, 2)
  ctx.clip()
  drawImageCover(ctx, image, x, y, size, size)
  ctx.restore()
  ctx.strokeStyle = '#e4dccd'
  ctx.lineWidth = 1
  clipRoundRect(ctx, x + 0.5, y + 0.5, size - 1, size - 1, 2)
  ctx.stroke()
}

function drawImageCover(ctx: PosterContext, image: PosterImage, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height)
  if (!Number.isFinite(scale)) {
    return
  }
  const dw = image.width * scale
  const dh = image.height * scale
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

function clipRoundRect(ctx: PosterContext, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrap(ctx: PosterContext, text: string, maxWidth: number, maxLines: number) {
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

function ellipsis(ctx: PosterContext, text: string, maxWidth: number) {
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

function loadImage(canvas: PosterCanvas, src: string) {
  if (!src) {
    return Promise.resolve(null)
  }
  return new Promise<PosterImage | null>((resolve) => {
    const image = canvas.createImage()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}
