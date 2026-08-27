import { brand } from './brand'
import type { FillingId, FloatText, Particle, Roll } from './types'

const TAU = Math.PI * 2

export interface Camera {
  x: number
  y: number
  shakeX: number
  shakeY: number
  scale: number
  w: number
  h: number
}

export const FILLINGS: Record<
  FillingId,
  { fill: string; fillDark: string; accent: string; seed: string }
> = {
  salmon: { fill: '#ff6b4a', fillDark: '#d4452e', accent: '#ffb199', seed: '#fff6e8' },
  avocado: { fill: '#8fc63a', fillDark: '#5a8a1c', accent: '#d4f06c', seed: '#5a3a18' },
  cucumber: { fill: '#4caf6a', fillDark: '#2e7d4a', accent: '#b7e3c0', seed: '#1e4d2c' },
  unagi: { fill: '#c46a28', fillDark: '#7a3c12', accent: '#ffc938', seed: '#fff0c0' },
  tuna: { fill: '#e0233a', fillDark: '#9b1024', accent: '#ff8a9a', seed: '#fff6e8' },
  tamago: { fill: '#ffd24a', fillDark: '#e09a10', accent: '#fff3c4', seed: '#c41e3a' },
}

export const FILLING_CYCLE: FillingId[] = ['salmon', 'avocado', 'cucumber', 'unagi', 'tuna', 'tamago']

export function worldToScreen(cam: Camera, wx: number, wy: number): { x: number; y: number } {
  return {
    x: cam.w / 2 + (wx - cam.x) * cam.scale + cam.shakeX,
    y: cam.h * 0.78 - (wy - cam.y) * cam.scale + cam.shakeY,
  }
}

export function screenToWorldX(cam: Camera, sx: number): number {
  return (sx - cam.w / 2 - cam.shakeX) / cam.scale + cam.x
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

const PX = {
  wallA: '#f7e4c6',
  wallB: '#f0c8a0',
  grout: '#e2b07a',
  wood: '#c9844a',
  woodDk: '#8a4e24',
  woodMd: '#a86830',
  woodLt: '#e8b878',
  woodHi: '#f4d4a0',
  sky: '#7ee7ff',
  skyHi: '#d8f6ff',
  skyMid: '#4ec6f5',
  sun: '#ffe566',
  sunHi: '#fff6b0',
  cloud: '#ffffff',
  frame: '#6b4220',
  frameLt: '#a86a34',
  fridge: '#eef4f8',
  fridgeDk: '#c5d4de',
  fridgeHi: '#ffffff',
  handle: '#ffc938',
  plant: '#8fbf3a',
  plantDk: '#5a8a1c',
  pot: '#c46a28',
  soy: '#2a1810',
  nori: '#1b3a22',
  rice: '#fff6e8',
  salmon: '#ff6b4a',
  avocado: '#8fc63a',
  wasabi: '#8fbf3a',
}

function pixelUnit(cam: Camera): number {
  return Math.max(8, Math.round(Math.min(cam.w, cam.h) / 56))
}

function pset(
  ctx: CanvasRenderingContext2D,
  P: number,
  gx: number,
  gy: number,
  gw: number,
  gh: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.fillRect(gx * P, gy * P, gw * P, gh * P)
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const P = pixelUnit(cam)
  const cols = Math.ceil(cam.w / P) + 1
  const rows = Math.ceil(cam.h / P) + 1
  drawTiledWall(ctx, P, cols, rows)
  drawCeiling(ctx, P, cols)
  drawWindow(ctx, P, cols, rows, t)
  drawCity(ctx, cam)
}

function drawTiledWall(ctx: CanvasRenderingContext2D, P: number, cols: number, rows: number): void {
  const tile = 4
  for (let ty = 0; ty < Math.ceil(rows / tile) + 1; ty++) {
    for (let tx = 0; tx < Math.ceil(cols / tile) + 1; tx++) {
      const even = (tx + ty) % 2 === 0
      pset(ctx, P, tx * tile, ty * tile, tile, tile, even ? PX.wallA : PX.wallB)
    }
  }
  ctx.fillStyle = PX.grout
  for (let ty = 0; ty <= Math.ceil(rows / tile); ty++) {
    ctx.fillRect(0, ty * tile * P, cols * P, Math.max(1, P / 8))
  }
  for (let tx = 0; tx <= Math.ceil(cols / tile); tx++) {
    ctx.fillRect(tx * tile * P, 0, Math.max(1, P / 8), rows * P)
  }
}

function drawCeiling(ctx: CanvasRenderingContext2D, P: number, cols: number): void {
  pset(ctx, P, 0, 0, cols, 3, PX.wood)
  pset(ctx, P, 0, 0, cols, 1, PX.woodDk)
  pset(ctx, P, 0, 2, cols, 1, PX.woodMd)
  for (let x = 2; x < cols; x += 6) {
    pset(ctx, P, x, 1, 1, 1, PX.woodHi)
  }
}

function drawWindow(ctx: CanvasRenderingContext2D, P: number, cols: number, rows: number, t: number): void {
  const ww = 16
  const wh = 12
  const wx = Math.max(6, Math.floor(cols * 0.22) - 4)
  const wy = Math.max(5, Math.min(8, Math.floor(rows * 0.08)))
  pset(ctx, P, wx, wy, ww, wh, PX.frame)
  pset(ctx, P, wx + 1, wy + 1, ww - 2, wh - 2, PX.frameLt)
  const innerX = wx + 2
  const innerY = wy + 2
  const innerW = ww - 4
  const innerH = wh - 4
  const paneW = Math.floor((innerW - 2) / 2)
  const paneH = Math.floor((innerH - 2) / 2)
  const panes = [
    { x: innerX, y: innerY },
    { x: innerX + paneW + 2, y: innerY },
    { x: innerX, y: innerY + paneH + 2 },
    { x: innerX + paneW + 2, y: innerY + paneH + 2 },
  ]
  for (let i = 0; i < 4; i++) {
    const p = panes[i]
    pset(ctx, P, p.x, p.y, paneW, paneH, i === 1 ? PX.skyHi : PX.sky)
    pset(ctx, P, p.x, p.y + paneH - 2, paneW, 2, PX.skyMid)
  }
  // sun in top-right pane
  const sun = panes[1]
  pset(ctx, P, sun.x + paneW - 4, sun.y + 1, 3, 3, PX.sun)
  pset(ctx, P, sun.x + paneW - 3, sun.y + 2, 1, 1, Math.sin(t * 2.2) > 0 ? PX.sunHi : PX.sun)
  // cloud in top-left
  const cl = panes[0]
  pset(ctx, P, cl.x + 1, cl.y + 2, 3, 1, PX.cloud)
  pset(ctx, P, cl.x + 2, cl.y + 1, 2, 1, PX.cloud)
  // mullions
  pset(ctx, P, wx + Math.floor(ww / 2) - 1, wy + 1, 2, wh - 2, PX.frameLt)
  pset(ctx, P, wx + 1, wy + Math.floor(wh / 2) - 1, ww - 2, 2, PX.frameLt)
  pset(ctx, P, wx + Math.floor(ww / 2), wy + 1, 1, wh - 2, PX.frame)
  pset(ctx, P, wx + 1, wy + Math.floor(wh / 2), ww - 2, 1, PX.frame)
  // sill
  pset(ctx, P, wx - 1, wy + wh, ww + 2, 1, PX.woodLt)
  pset(ctx, P, wx - 1, wy + wh + 1, ww + 2, 1, PX.wood)
}

function drawCity(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const P = pixelUnit(cam)
  const cols = Math.ceil(cam.w / P) + 1
  const rows = Math.ceil(cam.h / P) + 1
  drawShelves(ctx, P, cols, rows)
  drawFridge(ctx, P, cols, rows)
  drawPlant(ctx, P, cols, rows)
}

function drawShelves(ctx: CanvasRenderingContext2D, P: number, _cols: number, rows: number): void {
  const sx = 1
  const sy = Math.max(16, Math.floor(rows * 0.22))
  const sw = 8
  for (let i = 0; i < 3; i++) {
    const y = sy + i * 6
    pset(ctx, P, sx, y + 3, sw, 1, PX.woodDk)
    pset(ctx, P, sx, y + 2, sw, 1, PX.wood)
    pset(ctx, P, sx, y + 2, 1, 2, PX.woodDk)
    pset(ctx, P, sx + sw - 1, y + 2, 1, 2, PX.woodDk)
  }
  // jars / bottles
  pset(ctx, P, sx + 1, sy + 0, 2, 2, PX.soy)
  pset(ctx, P, sx + 1, sy - 1, 2, 1, PX.nori)
  pset(ctx, P, sx + 4, sy + 0, 2, 2, PX.salmon)
  pset(ctx, P, sx + 4, sy - 1, 2, 1, PX.woodLt)
  pset(ctx, P, sx + 1, sy + 6, 2, 2, PX.avocado)
  pset(ctx, P, sx + 1, sy + 5, 2, 1, PX.woodHi)
  pset(ctx, P, sx + 4, sy + 6, 2, 2, PX.wasabi)
  pset(ctx, P, sx + 4, sy + 5, 1, 1, PX.nori)
  pset(ctx, P, sx + 2, sy + 12, 3, 2, PX.pot)
  pset(ctx, P, sx + 3, sy + 11, 1, 1, PX.woodDk)
}

function drawFridge(ctx: CanvasRenderingContext2D, P: number, cols: number, rows: number): void {
  const fw = 8
  const fh = 20
  const fx = cols - fw - 1
  const fy = Math.max(14, rows - fh - 10)
  pset(ctx, P, fx - 1, fy + 1, 1, fh, 'rgba(90, 60, 30, 0.12)')
  pset(ctx, P, fx, fy, fw, fh, PX.fridgeDk)
  pset(ctx, P, fx + 1, fy + 1, fw - 2, fh - 2, PX.fridge)
  pset(ctx, P, fx + 1, fy + 1, fw - 2, 1, PX.fridgeHi)
  // freezer split
  pset(ctx, P, fx + 1, fy + 7, fw - 2, 1, PX.fridgeDk)
  // handle
  pset(ctx, P, fx + 1, fy + 9, 1, 4, PX.handle)
  pset(ctx, P, fx + 1, fy + 3, 1, 2, PX.handle)
  // magnets
  pset(ctx, P, fx + 4, fy + 3, 1, 1, PX.salmon)
  pset(ctx, P, fx + 5, fy + 4, 1, 1, PX.avocado)
  // feet
  pset(ctx, P, fx + 1, fy + fh, 1, 1, PX.woodDk)
  pset(ctx, P, fx + fw - 2, fy + fh, 1, 1, PX.woodDk)
}

function drawPlant(ctx: CanvasRenderingContext2D, P: number, cols: number, rows: number): void {
  const fx = cols - 11
  const fy = Math.max(14, rows - 31)
  pset(ctx, P, fx - 3, fy + 18, 3, 2, PX.pot)
  pset(ctx, P, fx - 2, fy + 16, 1, 2, PX.plantDk)
  pset(ctx, P, fx - 3, fy + 15, 1, 2, PX.plant)
  pset(ctx, P, fx - 1, fy + 15, 1, 2, PX.plant)
  pset(ctx, P, fx - 2, fy + 14, 1, 1, PX.plant)
}

export function drawBoard(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const P = pixelUnit(cam)
  const origin = worldToScreen(cam, 0, 0)
  const s = cam.scale
  const half = 148 * s
  const x0 = Math.round((origin.x - half) / P) * P
  const y0 = Math.round((origin.y - P) / P) * P
  const w = Math.max(P * 12, Math.round((half * 2) / P) * P)
  const h = Math.max(P * 4, Math.round((28 * s) / P) * P)

  ctx.fillStyle = 'rgba(90, 50, 20, 0.18)'
  ctx.fillRect(x0 + P, y0 + h, w, P * 2)

  const bands = [PX.woodDk, PX.woodMd, PX.wood, PX.woodLt, PX.wood, PX.woodMd]
  const rows = Math.max(1, Math.round(h / P))
  for (let i = 0; i < rows; i++) {
    ctx.fillStyle = bands[i % bands.length]
    ctx.fillRect(x0, y0 + i * P, w, P)
  }
  ctx.fillStyle = PX.woodHi
  for (let i = 0; i < 10; i++) {
    const gx = x0 + ((i * 5 + 2) % Math.max(2, Math.round(w / P) - 2)) * P
    ctx.fillRect(gx, y0 + P, P, P)
  }
  ctx.fillStyle = PX.woodDk
  ctx.fillRect(x0, y0 + h - P, w, P)
  ctx.fillRect(x0, y0, P, h)
  ctx.fillRect(x0 + w - P, y0, P, h)

  // soy dish
  const dx = x0 + w - P * 5
  const dy = y0 + P
  ctx.fillStyle = PX.soy
  ctx.fillRect(dx, dy, P * 3, P * 2)
  ctx.fillStyle = '#3a1a10'
  ctx.fillRect(dx + P, dy, P, P)
}

export function drawRoll(ctx: CanvasRenderingContext2D, cam: Camera, roll: Roll): void {
  const s = cam.scale
  const squash = roll.squash
  const bw = roll.w * squash
  const bh = roll.h / squash
  const bottom = worldToScreen(cam, roll.x, roll.y)
  const cx = bottom.x
  const rx = Math.max(8, (bw / 2) * s)
  const ry = Math.max(6, rx * 0.4)
  const bodyH = Math.max(ry * 1.35, bh * s)
  const topCy = bottom.y - bodyH
  const pal = FILLINGS[roll.type]
  const maki = roll.style === 'maki'
  const nori = '#163820'
  const noriHi = '#2f6340'
  const noriLo = '#0c1c12'
  const rice = '#fff4e0'

  ctx.save()
  ctx.globalAlpha *= roll.opacity
  const midY = (bottom.y + topCy) / 2
  ctx.translate(cx, midY)
  ctx.rotate(roll.rot)
  ctx.translate(-cx, -midY)

  ctx.fillStyle = `rgba(90, 50, 20, ${0.2 * roll.opacity})`
  ctx.beginPath()
  ctx.ellipse(cx + 3, bottom.y + ry * 0.35, rx * 0.9, ry * 0.5, 0, 0, TAU)
  ctx.fill()

  const side = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0)
  if (maki) {
    side.addColorStop(0, noriLo)
    side.addColorStop(0.12, noriHi)
    side.addColorStop(0.45, nori)
    side.addColorStop(0.8, noriLo)
    side.addColorStop(1, '#08140c')
  } else {
    side.addColorStop(0, '#cfc3ae')
    side.addColorStop(0.18, '#fff8ec')
    side.addColorStop(0.55, rice)
    side.addColorStop(0.85, '#e8dcc4')
    side.addColorStop(1, '#c4b79e')
  }
  ctx.fillStyle = side
  ctx.beginPath()
  ctx.rect(cx - rx, topCy, rx * 2, bodyH)
  ctx.ellipse(cx, bottom.y, rx, ry, 0, 0, Math.PI)
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(cx, bottom.y, rx, ry, 0, 0, TAU)
  ctx.fill()

  if (!maki) {
    ctx.fillStyle = 'rgba(90,50,20,0.5)'
    for (let i = 0; i < 14; i++) {
      const sx = cx - rx + 5 + ((i * 17) % Math.max(10, rx * 2 - 10))
      const sy = topCy + 6 + ((i * 13) % Math.max(8, bodyH - 10))
      ctx.beginPath()
      ctx.ellipse(sx, sy, 1.7, 1.0, 0.5, 0, TAU)
      ctx.fill()
    }
  }

  ctx.beginPath()
  ctx.ellipse(cx, topCy, rx, ry, 0, 0, TAU)
  ctx.fillStyle = maki ? nori : rice
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(cx, topCy, rx * 0.76, ry * 0.76, 0, 0, TAU)
  ctx.fillStyle = rice
  ctx.fill()

  if (!maki) {
    ctx.beginPath()
    ctx.ellipse(cx, topCy, rx * 0.56, ry * 0.56, 0, 0, TAU)
    ctx.fillStyle = nori
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, topCy, rx * 0.44, ry * 0.44, 0, 0, TAU)
    ctx.fillStyle = rice
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255, 248, 232, 0.55)'
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.4
    ctx.beginPath()
    ctx.ellipse(
      cx + Math.cos(a) * rx * 0.58,
      topCy + Math.sin(a) * ry * 0.58,
      1.6,
      1.0,
      a,
      0,
      TAU,
    )
    ctx.fill()
  }

  drawMakiFilling(ctx, cx, topCy, rx, ry, roll.type, pal)

  ctx.strokeStyle = maki ? 'rgba(180, 220, 180, 0.28)' : 'rgba(255,255,255,0.45)'
  ctx.lineWidth = Math.max(1.4, rx * 0.04)
  ctx.beginPath()
  ctx.ellipse(cx, topCy, rx * 0.94, ry * 0.94, 0, Math.PI * 1.05, Math.PI * 1.55)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(cx, topCy, rx, ry, 0, 0, TAU)
  ctx.stroke()

  ctx.restore()
}

function drawMakiFilling(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  type: FillingId,
  pal: (typeof FILLINGS)[FillingId],
): void {
  ctx.fillStyle = pal.fill
  if (type === 'salmon' || type === 'tuna' || type === 'unagi') {
    ctx.beginPath()
    ctx.ellipse(cx + rx * 0.02, cy, rx * 0.4, ry * 0.34, 0.4, 0, TAU)
    ctx.fill()
    ctx.fillStyle = pal.fillDark
    ctx.beginPath()
    ctx.ellipse(cx + rx * 0.1, cy, rx * 0.16, ry * 0.24, 0.4, 0, TAU)
    ctx.fill()
    ctx.strokeStyle = pal.accent
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(cx - rx * 0.2, cy - ry * 0.06)
    ctx.quadraticCurveTo(cx, cy + ry * 0.12, cx + rx * 0.24, cy - ry * 0.02)
    ctx.stroke()
  } else if (type === 'avocado') {
    ctx.beginPath()
    ctx.ellipse(cx - rx * 0.04, cy, rx * 0.4, ry * 0.34, -0.45, 0, TAU)
    ctx.fill()
    ctx.fillStyle = pal.seed
    ctx.beginPath()
    ctx.ellipse(cx + rx * 0.1, cy, rx * 0.14, ry * 0.16, 0, 0, TAU)
    ctx.fill()
  } else if (type === 'cucumber') {
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx * 0.34, ry * 0.34, 0, 0, TAU)
    ctx.fill()
    ctx.fillStyle = pal.seed
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU
      ctx.beginPath()
      ctx.ellipse(cx + Math.cos(a) * rx * 0.14, cy + Math.sin(a) * ry * 0.14, 1.6, 1.6, 0, 0, TAU)
      ctx.fill()
    }
  } else {
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx * 0.36, ry * 0.28, 0.2, 0, TAU)
    ctx.fill()
    ctx.fillStyle = pal.accent
    ctx.beginPath()
    ctx.ellipse(cx - rx * 0.06, cy - ry * 0.05, rx * 0.14, ry * 0.1, 0.2, 0, TAU)
    ctx.fill()
  }
}

export function drawGhost(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  x: number,
  y: number,
  w: number,
  quality: 'perfect' | 'good' | 'bad',
): void {
  const p = worldToScreen(cam, x, y)
  const rx = (w / 2) * cam.scale
  const ry = Math.max(5, rx * 0.4)
  const color =
    quality === 'perfect'
      ? 'rgba(255, 201, 56, 0.7)'
      : quality === 'good'
        ? 'rgba(143, 191, 58, 0.55)'
        : 'rgba(255, 59, 78, 0.55)'
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.setLineDash([6, 5])
  ctx.beginPath()
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU)
  ctx.stroke()
  ctx.fillStyle = color.replace(/0\.\d+\)/, '0.12)')
  ctx.fill()
  ctx.restore()
}


export function drawCrane(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  trolleyWorldX: number,
  hookWorldY: number,
  attached: boolean,
  t: number,
): void {
  const boomY = 58
  const hook = worldToScreen(cam, trolleyWorldX, hookWorldY)
  const tx = hook.x
  const sway = Math.sin(t * 1.3) * 1.5

  ctx.save()
  // mast
  const mastX = 22
  const mg = ctx.createLinearGradient(mastX, 0, mastX + 18, 0)
  mg.addColorStop(0, '#ffe27a')
  mg.addColorStop(0.5, '#ffc938')
  mg.addColorStop(1, '#e09a10')
  ctx.fillStyle = mg
  roundRect(ctx, mastX, 8, 18, boomY + 8, 4)
  ctx.fill()
  ctx.fillStyle = brand.colors.primary
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(mastX, 14 + i * 12, 18, 5)
  }

  // cabin
  ctx.fillStyle = '#ff3b4e'
  roundRect(ctx, mastX - 6, boomY - 28, 36, 22, 6)
  ctx.fill()
  ctx.fillStyle = '#b8f0ff'
  roundRect(ctx, mastX + 6, boomY - 22, 16, 12, 3)
  ctx.fill()

  // boom
  ctx.fillStyle = '#ffd54a'
  roundRect(ctx, mastX + 10, boomY - 8, cam.w - 48, 16, 7)
  ctx.fill()
  ctx.fillStyle = '#ff3b4e'
  ctx.fillRect(mastX + 16, boomY - 2, cam.w - 60, 4)

  // trolley
  ctx.fillStyle = '#ff3b4e'
  roundRect(ctx, tx - 18 + sway, boomY - 14, 36, 26, 6)
  ctx.fill()
  ctx.fillStyle = '#ffe27a'
  roundRect(ctx, tx - 10 + sway, boomY - 8, 20, 14, 3)
  ctx.fill()

  const hookY = attached ? hook.y : boomY + 64
  ctx.strokeStyle = '#5a4a3a'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(tx + sway, boomY + 12)
  ctx.quadraticCurveTo(tx + sway + 4, (boomY + 12 + hookY) / 2 + 10, tx, hookY)
  ctx.stroke()

  // hook / chopsticks claw
  ctx.strokeStyle = '#c41e3a'
  ctx.lineWidth = 3.2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(tx - 10, hookY)
  ctx.lineTo(tx - 4, hookY + 14)
  ctx.moveTo(tx + 10, hookY)
  ctx.lineTo(tx + 4, hookY + 14)
  ctx.stroke()
  ctx.fillStyle = '#ffc938'
  ctx.beginPath()
  ctx.arc(tx, hookY, 5, 0, TAU)
  ctx.fill()

  ctx.restore()
}

export function drawParticles(ctx: CanvasRenderingContext2D, cam: Camera, particles: Particle[]): void {
  for (const p of particles) {
    const s = worldToScreen(cam, p.x, p.y)
    const a = Math.max(0, p.life / p.maxLife)
    ctx.save()
    ctx.translate(s.x, s.y)
    ctx.rotate(p.rot)
    ctx.globalAlpha = a
    if (p.kind === 'rice') {
      ctx.fillStyle = '#fff6e8'
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.7, 0, 0, TAU)
      ctx.fill()
    } else if (p.kind === 'star') {
      ctx.fillStyle = brand.colors.goldLight
      starPath(ctx, 0, 0, p.size, p.size * 0.42, 4)
      ctx.fill()
    } else if (p.kind === 'spark') {
      ctx.fillStyle = brand.colors.goldLight
      ctx.beginPath()
      ctx.arc(0, 0, p.size, 0, TAU)
      ctx.fill()
    } else {
      ctx.fillStyle = brand.colors.wasabi
      ctx.beginPath()
      ctx.arc(0, 0, p.size, 0, TAU)
      ctx.fill()
    }
    ctx.restore()
  }
}

function starPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  ir: number,
  n: number,
): void {
  ctx.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? r : ir
    const a = (i / (n * 2)) * TAU - Math.PI / 2
    const px = x + Math.cos(a) * rad
    const py = y + Math.sin(a) * rad
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

export function drawFloatTexts(ctx: CanvasRenderingContext2D, cam: Camera, items: FloatText[]): void {
  for (const f of items) {
    const p = worldToScreen(cam, f.x, f.y)
    const t = f.age / f.maxAge
    const alpha = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1
    ctx.save()
    ctx.globalAlpha = Math.max(0, alpha)
    ctx.translate(p.x, p.y - t * 36)
    ctx.scale(f.scale, f.scale)
    ctx.font = `800 ${Math.round(22 * f.scale)}px ${brand.font}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 5
    ctx.strokeStyle = 'rgba(22, 48, 86, 0.45)'
    ctx.strokeText(f.text, 0, 0)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, 0, 0)
    ctx.restore()
  }
}

export function drawWasabiFlash(ctx: CanvasRenderingContext2D, cam: Camera, amount: number): void {
  if (amount <= 0) return
  ctx.save()
  ctx.globalAlpha = amount * 0.22
  const g = ctx.createRadialGradient(cam.w / 2, cam.h * 0.4, 10, cam.w / 2, cam.h * 0.45, cam.w * 0.7)
  g.addColorStop(0, brand.colors.goldLight)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cam.w, cam.h)
  ctx.restore()
}

export function drawVignette(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const g = ctx.createRadialGradient(cam.w / 2, cam.h * 0.5, cam.h * 0.35, cam.w / 2, cam.h * 0.5, cam.h * 0.95)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(180, 120, 70, 0.07)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cam.w, cam.h)
}

export function drawComboBanner(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  text: string,
  age: number,
): void {
  if (age <= 0 || age > 1.05) return
  const t = age / 1.05
  const alpha = t < 0.12 ? t / 0.12 : t > 0.7 ? (1 - t) / 0.3 : 1
  const pop = t < 0.18 ? 0.7 + t * 1.8 : 1
  const y = cam.h * 0.3 - (1 - Math.min(1, t * 3)) * 18
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(cam.w / 2, y)
  ctx.scale(pop, pop)
  ctx.font = `800 ${Math.round(cam.w * 0.09)}px ${brand.font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 8
  ctx.strokeStyle = 'rgba(22, 48, 86, 0.55)'
  ctx.strokeText(text, 0, 0)
  ctx.fillStyle = brand.colors.goldLight
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

export function drawTapHint(ctx: CanvasRenderingContext2D, cam: Camera, text: string, age: number): void {
  const pulse = 0.85 + 0.15 * Math.sin(age * 6)
  ctx.save()
  ctx.globalAlpha = 0.92
  ctx.font = `700 ${Math.round(16 * pulse)}px ${brand.font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const y = cam.h * 0.48
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  roundRect(ctx, cam.w / 2 - 160, y - 22, 320, 44, 22)
  ctx.fill()
  ctx.fillStyle = brand.colors.ink
  ctx.fillText(text, cam.w / 2, y)
  ctx.restore()
}
