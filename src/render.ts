import { brand } from './brand'
import type { FillingId, FloatText, Particle, Roll } from './types'

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
  salmon: { fill: '#f2744a', fillDark: '#d94a2e', accent: '#ffc4a8', seed: '#fff6e8' },
  avocado: { fill: '#8fbf3a', fillDark: '#5c8a1c', accent: '#d4f06c', seed: '#6b3e18' },
  cucumber: { fill: '#6fbf7a', fillDark: '#3d8a4c', accent: '#c8ecc8', seed: '#1e4d2c' },
  unagi: { fill: '#c46a28', fillDark: '#7a3c12', accent: '#ffc938', seed: '#fff0c0' },
  tuna: { fill: '#d01e36', fillDark: '#8e1024', accent: '#ff8a9a', seed: '#fff6e8' },
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

function smooth(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
}

function viewWorld(cam: Camera): { xL: number; xR: number; yB: number; yT: number } {
  const s = Math.max(0.01, cam.scale)
  return {
    xL: cam.x - cam.w / 2 / s,
    xR: cam.x + cam.w / 2 / s,
    yB: cam.y - (cam.h * 0.22) / s,
    yT: cam.y + (cam.h * 0.78) / s,
  }
}

function hash2(i: number, j: number): number {
  const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexRgb(a)
  const B = hexRgb(b)
  const r = Math.round(lerp(A[0], B[0], t))
  const g = Math.round(lerp(A[1], B[1], t))
  const bl = Math.round(lerp(A[2], B[2], t))
  return `rgb(${r},${g},${bl})`
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, rr)
}

function fillWorld(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  wx: number,
  wy: number,
  ww: number,
  wh: number,
  color: string,
  r = 0,
): void {
  const tl = worldToScreen(cam, wx, wy + wh)
  const br = worldToScreen(cam, wx + ww, wy)
  ctx.fillStyle = color
  if (r > 0) {
    roundRect(ctx, tl.x, tl.y, br.x - tl.x, br.y - tl.y, r * cam.scale)
    ctx.fill()
  } else {
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y)
  }
}

function worldSize(cam: Camera, wx: number, wy: number, ww: number, wh: number): {
  x: number
  y: number
  w: number
  h: number
} {
  const tl = worldToScreen(cam, wx, wy + wh)
  const br = worldToScreen(cam, wx + ww, wy)
  return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y }
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  smooth(ctx)
  fillSky(ctx, cam)
  drawStars(ctx, cam, t)
  drawMoonOrSun(ctx, cam, t)
  drawFarClouds(ctx, cam, t)
  drawCityParallax(ctx, cam, t)
  drawWorldRooms(ctx, cam, t)
  drawKitchen(ctx, cam, t)
}

function altitude(cam: Camera): number {
  return cam.y
}

function fillSky(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const y = altitude(cam)
  const day = { a: '#c8edff', b: '#8fd4f5', c: '#5eb7e8' }
  const dusk = { a: '#ffc8a0', b: '#e878a8', c: '#6a5cc8' }
  const night = { a: '#2a2878', b: '#16144a', c: '#0a0a22' }
  let top: string
  let mid: string
  let bot: string
  if (y < 320) {
    const k = Math.max(0, (y - 160) / 160)
    top = mixHex(day.a, dusk.a, k * 0.35)
    mid = mixHex(day.b, dusk.b, k * 0.35)
    bot = mixHex(day.c, dusk.c, k * 0.35)
  } else if (y < 720) {
    const k = (y - 320) / 400
    top = mixHex(dusk.a, night.a, k)
    mid = mixHex(dusk.b, night.b, k)
    bot = mixHex(dusk.c, night.c, k)
  } else {
    const k = Math.min(1, (y - 720) / 500)
    top = mixHex(night.a, '#12103a', k)
    mid = mixHex(night.b, '#0a0a20', k)
    bot = mixHex(night.c, '#050510', k)
  }
  const g = ctx.createLinearGradient(0, 0, 0, cam.h)
  g.addColorStop(0, top)
  g.addColorStop(0.45, mid)
  g.addColorStop(1, bot)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cam.w, cam.h)
}

function drawStars(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const night = cam.y < 480 ? 0 : Math.min(1, (cam.y - 480) / 420)
  if (night <= 0) return
  const oy = cam.y * 0.08
  for (let i = 0; i < 56; i++) {
    const hx = hash2(i, 3)
    const hy = hash2(i, 9)
    const x = ((hx * cam.w * 1.2 + oy * 0.15) % cam.w + cam.w) % cam.w
    const y = ((hy * cam.h - oy * 0.2) % cam.h + cam.h) % cam.h
    const tw = 0.55 + 0.45 * Math.sin(t * 1.6 + i)
    const r = 0.7 + hash2(i, 5) * 1.4
    ctx.globalAlpha = night * tw * (0.45 + hash2(i, 7) * 0.55)
    ctx.fillStyle = hash2(i, 11) > 0.7 ? '#ffe27a' : '#fff6e8'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawMoonOrSun(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const x = cam.w * 0.78
  const y = cam.h * 0.14 - cam.y * 0.03
  if (cam.y < 380) {
    const pulse = 18 + Math.sin(t * 0.7) * 3
    const glow = ctx.createRadialGradient(x, y, 4, x, y, pulse * 3.2)
    glow.addColorStop(0, 'rgba(255, 244, 170, 0.85)')
    glow.addColorStop(0.35, 'rgba(255, 210, 90, 0.28)')
    glow.addColorStop(1, 'rgba(255, 180, 80, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, pulse * 3.2, 0, Math.PI * 2)
    ctx.fill()
    const sun = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, pulse)
    sun.addColorStop(0, '#fff6c8')
    sun.addColorStop(0.55, '#ffe566')
    sun.addColorStop(1, '#ffb84a')
    ctx.fillStyle = sun
    ctx.beginPath()
    ctx.arc(x, y, pulse, 0, Math.PI * 2)
    ctx.fill()
  } else if (cam.y > 560) {
    const k = Math.min(1, (cam.y - 560) / 200)
    ctx.globalAlpha = k
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 42)
    glow.addColorStop(0, 'rgba(255, 246, 232, 0.55)')
    glow.addColorStop(1, 'rgba(200, 210, 255, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, 42, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f4f0e4'
    ctx.beginPath()
    ctx.arc(x, y, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(180, 190, 220, 0.35)'
    ctx.beginPath()
    ctx.arc(x + 5, y - 4, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

function drawFarClouds(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  if (cam.y > 980) return
  const alpha = cam.y < 520 ? 0.85 : Math.max(0, 1 - (cam.y - 520) / 460)
  ctx.globalAlpha = alpha
  const drift = t * 6
  const oy = cam.y * 0.22
  for (let i = 0; i < 7; i++) {
    const x =
      ((hash2(i, 1) * (cam.w + 180) + drift * (0.35 + hash2(i, 2)) - oy * 0.04) % (cam.w + 180)) - 90
    const y = 28 + hash2(i, 4) * cam.h * 0.32 - (oy % (cam.h * 0.45))
    drawSoftCloud(ctx, x, y, 22 + hash2(i, 5) * 18)
  }
  ctx.globalAlpha = 1
}

function drawSoftCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.beginPath()
  ctx.ellipse(x, y, s * 1.1, s * 0.42, 0, 0, Math.PI * 2)
  ctx.ellipse(x - s * 0.55, y + s * 0.08, s * 0.55, s * 0.32, 0, 0, Math.PI * 2)
  ctx.ellipse(x + s * 0.5, y + s * 0.06, s * 0.62, s * 0.34, 0, 0, Math.PI * 2)
  ctx.ellipse(x - s * 0.1, y - s * 0.22, s * 0.5, s * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawCityParallax(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  if (cam.y < 340) return
  const alpha = Math.min(1, (cam.y - 340) / 260)
  ctx.globalAlpha = alpha
  const baseY = cam.h * 0.7 - cam.y * 0.18 + 80
  const bldg = [
    { x: 0.02, w: 0.09, h: 0.28, hue: 0 },
    { x: 0.12, w: 0.07, h: 0.18, hue: 1 },
    { x: 0.2, w: 0.12, h: 0.36, hue: 2 },
    { x: 0.34, w: 0.08, h: 0.24, hue: 0 },
    { x: 0.44, w: 0.14, h: 0.42, hue: 1 },
    { x: 0.6, w: 0.07, h: 0.2, hue: 2 },
    { x: 0.69, w: 0.11, h: 0.32, hue: 0 },
    { x: 0.82, w: 0.08, h: 0.22, hue: 1 },
    { x: 0.91, w: 0.07, h: 0.16, hue: 2 },
  ]
  const cols = ['#1a2a4a', '#121c38', '#243658']
  for (let i = 0; i < bldg.length; i++) {
    const b = bldg[i]
    const x = cam.w * b.x
    const h = cam.h * b.h
    const y = baseY - h
    const w = cam.w * b.w
    const g = ctx.createLinearGradient(x, y, x, y + h)
    g.addColorStop(0, mixHex(cols[b.hue], '#3a5080', 0.25))
    g.addColorStop(1, cols[b.hue])
    ctx.fillStyle = g
    roundRect(ctx, x, y, w, h, 3)
    ctx.fill()
    if (i % 3 === 0) {
      ctx.fillStyle = '#8aa0b8'
      ctx.fillRect(x + w * 0.45, y - 14, 2, 14)
    }
    const colsN = Math.max(2, Math.floor(w / 10))
    const rowsN = Math.max(3, Math.floor(h / 14))
    for (let wy = 0; wy < rowsN; wy++) {
      for (let wx = 0; wx < colsN; wx++) {
        const lit = hash2(i * 13 + wx, wy + Math.floor(t * 0.15 + cam.y / 90)) > 0.42
        ctx.fillStyle = lit ? 'rgba(255, 201, 56, 0.85)' : 'rgba(70, 100, 150, 0.35)'
        ctx.fillRect(x + 4 + wx * (w / colsN), y + 8 + wy * (h / rowsN), 4, 6)
      }
    }
  }
  ctx.globalAlpha = 1
}

function drawWorldRooms(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const v = viewWorld(cam)
  if (v.yB < 250 && v.yT > -90) drawKitchenWall(ctx, cam, v.xL, v.xR)
  if (v.yB < 640 && v.yT > 220) drawRestaurant(ctx, cam, t)
  if (v.yB < 1100 && v.yT > 600) drawUpperLounge(ctx, cam, t)
  if (v.yT > 1000) drawLanternStrings(ctx, cam, t)
  drawSparseWallDecor(ctx, cam)
}

/** Occasional brand fish + demo watermark on walls (not a full overlay). */
function drawSparseWallDecor(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const v = viewWorld(cam)
  const fishBands: { y0: number; y1: number; chance: number }[] = [
    { y0: 30, y1: 200, chance: 0.16 },
    { y0: 300, y1: 560, chance: 0.12 },
    { y0: 660, y1: 880, chance: 0.1 },
  ]
  const cellW = 96
  const cellH = 72
  for (const band of fishBands) {
    const iy0 = Math.floor(Math.max(v.yB, band.y0) / cellH)
    const iy1 = Math.ceil(Math.min(v.yT, band.y1) / cellH)
    const ix0 = Math.floor(v.xL / cellW) - 1
    const ix1 = Math.ceil(v.xR / cellW) + 1
    for (let iy = iy0; iy <= iy1; iy++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const roll = hash2(ix + 19, iy + 83)
        if (roll > band.chance) continue
        const wx = ix * cellW + 18 + hash2(ix, iy + 3) * 44
        const wy = iy * cellH + 12 + hash2(ix + 2, iy) * 28
        if (wy < band.y0 || wy > band.y1) continue
        const flip = hash2(ix, iy + 5) > 0.5
        const size = 13 + hash2(ix, iy + 7) * 11
        drawLogoFishMark(ctx, cam, wx, wy, size, flip, 0.11 + hash2(ix, iy + 9) * 0.1)
      }
    }
  }

  const wCellW = 240
  const wCellH = 180
  const wy0 = Math.floor(v.yB / wCellH) - 1
  const wy1 = Math.ceil(v.yT / wCellH) + 1
  const wx0 = Math.floor(v.xL / wCellW) - 1
  const wx1 = Math.ceil(v.xR / wCellW) + 1
  for (let iy = wy0; iy <= wy1; iy++) {
    for (let ix = wx0; ix <= wx1; ix++) {
      // ~6% of cells — rare, not a wallpaper
      if (hash2(ix + 401, iy + 777) > 0.06) continue
      const wx = ix * wCellW + 36 + hash2(ix, iy) * 90
      const wy = iy * wCellH + 40 + hash2(ix + 1, iy + 2) * 70
      if (wy < 40) continue
      const rot = hash2(ix, iy + 4) * 0.5 - 0.25
      drawDemoWatermark(ctx, cam, wx, wy, rot)
    }
  }
}

/** Fish mark from Sushi Market YOKO logo — no circle, just the fish. */
function drawLogoFishMark(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  wx: number,
  wy: number,
  size: number,
  flip: boolean,
  alpha: number,
): void {
  const p = worldToScreen(cam, wx, wy)
  const s = (cam.scale * size) / 20
  ctx.save()
  ctx.translate(p.x, p.y)
  if (flip) ctx.scale(-1, 1)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = Math.max(1.2, 2.1 * s)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.ellipse(5.5 * s, 0, 7.5 * s, 5.2 * s, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#e87a20'
  ctx.beginPath()
  ctx.arc(7.5 * s, 0, 2 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.moveTo(-1.5 * s, -2.4 * s)
  ctx.lineTo(-8 * s, -2.4 * s)
  ctx.moveTo(-1.5 * s, 2.4 * s)
  ctx.lineTo(-8 * s, 2.4 * s)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-8 * s, -2.4 * s)
  ctx.quadraticCurveTo(-15 * s, -7.5 * s, -17.5 * s, -3.5 * s)
  ctx.moveTo(-8 * s, 2.4 * s)
  ctx.quadraticCurveTo(-15 * s, 7.5 * s, -17.5 * s, 3.5 * s)
  ctx.stroke()
  ctx.restore()
}

function drawDemoWatermark(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  wx: number,
  wy: number,
  rot: number,
): void {
  const p = worldToScreen(cam, wx, wy)
  const fs = Math.max(9, 10.5 * cam.scale)
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(rot)
  ctx.globalAlpha = 0.16
  ctx.fillStyle = '#163056'
  ctx.font = `600 ${fs}px ${brand.font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(brand.copy.wallWatermark, 0, 0)
  ctx.restore()
}


function drawKitchenWall(ctx: CanvasRenderingContext2D, cam: Camera, xL: number, xR: number): void {
  fillWorld(ctx, cam, xL - 40, -8, xR - xL + 80, 248, '#f3e6d4')
  const warm = ctx.createLinearGradient(0, worldToScreen(cam, 0, 230).y, 0, worldToScreen(cam, 0, 0).y)
  warm.addColorStop(0, 'rgba(255, 236, 210, 0.0)')
  warm.addColorStop(1, 'rgba(255, 210, 160, 0.18)')
  const wall = worldSize(cam, xL - 40, -8, xR - xL + 80, 248)
  ctx.fillStyle = warm
  ctx.fillRect(wall.x, wall.y, wall.w, wall.h)
  drawSubwayTiles(ctx, cam, xL - 20, xR + 20, 8, 218)
  const span = xR - xL + 80
  fillWorld(ctx, cam, xL - 40, -72, span, 64, '#8a4e24')
  fillWorld(ctx, cam, xL - 40, -16, span, 8, '#6b3a18')
  const doors = 5
  const dw = span / doors
  for (let i = 0; i < doors; i++) {
    const dx = xL - 30 + i * dw
    fillWorld(ctx, cam, dx + 6, -62, dw - 16, 42, '#c9844a', 4)
    fillWorld(ctx, cam, dx + dw * 0.55, -44, 8, 3, '#ffc938', 2)
  }
}

function drawSubwayTiles(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): void {
  const tw = 30
  const th = 15
  const gap = 1.6
  fillWorld(ctx, cam, x0, y0, x1 - x0, y1 - y0, '#e8d7c2')
  const tx0 = Math.floor(x0 / tw)
  const tx1 = Math.ceil(x1 / tw)
  const ty0 = Math.floor(y0 / th)
  const ty1 = Math.ceil(y1 / th)
  for (let ty = ty0; ty < ty1; ty++) {
    const wy = ty * th
    if (wy < y0 - 1 || wy + th > y1 + 2) continue
    const shift = (ty & 1) === 0 ? 0 : tw * 0.5
    for (let tx = tx0 - 1; tx <= tx1; tx++) {
      const wx = tx * tw + shift
      const n = hash2(tx, ty)
      const cream = mixHex('#fbf4ea', '#f0e2d0', 0.12 + n * 0.22)
      fillWorld(ctx, cam, wx + gap * 0.5, wy + gap * 0.5, tw - gap, th - gap, cream, 1.4)
    }
  }
}

function drawRestaurant(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const v = viewWorld(cam)
  fillWorld(ctx, cam, v.xL - 30, 230, v.xR - v.xL + 60, 50, '#d9b08a')
  fillWorld(ctx, cam, v.xL - 30, 280, v.xR - v.xL + 60, 340, '#f0c8a8')
  const band = worldSize(cam, v.xL - 30, 280, v.xR - v.xL + 60, 340)
  const g = ctx.createLinearGradient(0, band.y, 0, band.y + band.h)
  g.addColorStop(0, 'rgba(255, 180, 140, 0.12)')
  g.addColorStop(1, 'rgba(160, 80, 90, 0.16)')
  ctx.fillStyle = g
  ctx.fillRect(band.x, band.y, band.w, band.h)
  fillWorld(ctx, cam, v.xL - 30, 268, v.xR - v.xL + 60, 10, '#b88858')
  const xs = [-150, -40, 70, 160]
  for (let i = 0; i < xs.length; i++) {
    drawRoundWindow(ctx, cam, xs[i], 330, i >= 2)
    drawPaperLantern(ctx, cam, xs[i] + 22, 470, i % 3, t)
  }
  fillWorld(ctx, cam, v.xL - 20, 610, v.xR - v.xL + 40, 8, '#8a5a32')
}

function drawUpperLounge(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const v = viewWorld(cam)
  const y0 = 620
  const h = 300
  if (v.yT < y0 || v.yB > y0 + h) return
  fillWorld(ctx, cam, v.xL - 40, y0, 36, h, '#3a2a58')
  fillWorld(ctx, cam, v.xR - 0, y0, 40, h, '#3a2a58')
  const openings = [-160, -20, 120]
  for (let i = 0; i < openings.length; i++) {
    const x = openings[i]
    fillWorld(ctx, cam, x, y0 + 40, 70, 110, '#24183a', 6)
    const pane = worldSize(cam, x + 6, y0 + 48, 58, 94)
    const g = ctx.createLinearGradient(pane.x, pane.y, pane.x, pane.y + pane.h)
    g.addColorStop(0, 'rgba(255, 160, 110, 0.45)')
    g.addColorStop(1, 'rgba(80, 70, 160, 0.5)')
    ctx.fillStyle = g
    roundRect(ctx, pane.x, pane.y, pane.w, pane.h, 8)
    ctx.fill()
    drawPaperLantern(ctx, cam, x + 28, y0 + 200, i, t)
  }
}

function drawRoundWindow(ctx: CanvasRenderingContext2D, cam: Camera, x: number, y: number, dusk: boolean): void {
  const s = worldSize(cam, x, y, 56, 70)
  ctx.fillStyle = '#6b4220'
  roundRect(ctx, s.x, s.y, s.w, s.h, 10)
  ctx.fill()
  const pane = worldSize(cam, x + 5, y + 6, 46, 58)
  const g = ctx.createLinearGradient(pane.x, pane.y, pane.x, pane.y + pane.h)
  if (dusk) {
    g.addColorStop(0, '#f0a070')
    g.addColorStop(1, '#7a68c8')
  } else {
    g.addColorStop(0, '#c8ecff')
    g.addColorStop(1, '#7ec8f0')
  }
  ctx.fillStyle = g
  roundRect(ctx, pane.x, pane.y, pane.w, pane.h, 7)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(pane.x + pane.w * 0.5, pane.y + 4)
  ctx.lineTo(pane.x + pane.w * 0.5, pane.y + pane.h - 4)
  ctx.moveTo(pane.x + 4, pane.y + pane.h * 0.5)
  ctx.lineTo(pane.x + pane.w - 4, pane.y + pane.h * 0.5)
  ctx.stroke()
}

function drawPaperLantern(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  x: number,
  y: number,
  kind: number,
  t: number,
): void {
  const flicker = 0.85 + 0.15 * Math.sin(t * 3 + kind)
  const p = worldToScreen(cam, x, y)
  const s = cam.scale
  ctx.save()
  ctx.globalAlpha = 0.55 * flicker
  const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 28 * s)
  const cols = ['#ffb24a', '#ff6d5a', '#ffd24a']
  glow.addColorStop(0, cols[kind % 3])
  glow.addColorStop(1, 'rgba(255, 160, 60, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(p.x, p.y, 28 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = '#5a3a22'
  ctx.fillRect(p.x - 1, p.y - 22 * s, 2, 10 * s)
  const body = ctx.createRadialGradient(p.x - 4 * s, p.y, 2, p.x, p.y, 12 * s)
  body.addColorStop(0, '#ffe7a0')
  body.addColorStop(0.45, cols[kind % 3])
  body.addColorStop(1, '#c45a28')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.ellipse(p.x, p.y + 2 * s, 11 * s, 13 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#6b4220'
  ctx.fillRect(p.x - 7 * s, p.y - 12 * s, 14 * s, 3 * s)
  ctx.fillRect(p.x - 6 * s, p.y + 13 * s, 12 * s, 3 * s)
  ctx.restore()
}

function drawLanternStrings(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const v = viewWorld(cam)
  if (v.yT < 1080) return
  for (let i = 0; i < 8; i++) {
    const x = v.xL + 30 + i * 48
    drawPaperLantern(ctx, cam, x, 1180 + (i % 3) * 18, i % 3, t)
  }
}

function drawKitchen(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const v = viewWorld(cam)
  if (v.yB > 250 || v.yT < -50) return
  drawKitchenWindow(ctx, cam, t)
  drawShelves(ctx, cam)
  drawFridge(ctx, cam)
  drawStove(ctx, cam, t)
  drawPlantPot(ctx, cam)
  drawClock(ctx, cam)
}

function drawKitchenWindow(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const x = -126
  const y = 72
  const w = 108
  const h = 86
  fillWorld(ctx, cam, x - 6, y - 6, w + 12, h + 18, '#8a5a32', 4)
  fillWorld(ctx, cam, x, y, w, h, '#6b4220', 3)
  const pane = worldSize(cam, x + 7, y + 7, w - 14, h - 14)
  const g = ctx.createLinearGradient(pane.x, pane.y, pane.x, pane.y + pane.h)
  g.addColorStop(0, '#d8f4ff')
  g.addColorStop(0.45, '#9edff8')
  g.addColorStop(1, '#7ec8f0')
  ctx.fillStyle = g
  roundRect(ctx, pane.x, pane.y, pane.w, pane.h, 4)
  ctx.fill()
  const sunX = pane.x + pane.w * 0.72
  const sunY = pane.y + pane.h * 0.28
  const sg = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 16)
  sg.addColorStop(0, '#fff6c0')
  sg.addColorStop(0.5, '#ffe566')
  sg.addColorStop(1, 'rgba(255, 200, 80, 0)')
  ctx.fillStyle = sg
  ctx.beginPath()
  ctx.arc(sunX, sunY, 16 + Math.sin(t) * 1.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.beginPath()
  ctx.ellipse(pane.x + pane.w * 0.28, pane.y + pane.h * 0.32, 16, 7, 0, 0, Math.PI * 2)
  ctx.ellipse(pane.x + pane.w * 0.38, pane.y + pane.h * 0.28, 10, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#8a5a32'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pane.x + pane.w * 0.5, pane.y)
  ctx.lineTo(pane.x + pane.w * 0.5, pane.y + pane.h)
  ctx.moveTo(pane.x, pane.y + pane.h * 0.5)
  ctx.lineTo(pane.x + pane.w, pane.y + pane.h * 0.5)
  ctx.stroke()
  fillWorld(ctx, cam, x - 8, y + h, w + 16, 8, '#c9844a', 2)
  fillWorld(ctx, cam, x + 10, y + h + 8, 12, 10, '#c46a28', 2)
  fillWorld(ctx, cam, x + 12, y + h + 16, 8, 14, '#5a8a1c', 3)
}

function drawShelves(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const sx = -196
  const ys = [40, 96, 152]
  for (const y of ys) {
    fillWorld(ctx, cam, sx, y, 58, 7, '#c9844a', 2)
    fillWorld(ctx, cam, sx, y, 58, 2.2, '#8a4e24', 1)
  }
  fillWorld(ctx, cam, sx + 6, 47, 12, 22, '#2a1810', 3)
  fillWorld(ctx, cam, sx + 24, 47, 12, 22, '#f2744a', 3)
  fillWorld(ctx, cam, sx + 42, 52, 10, 16, '#8fbf3a', 4)
  fillWorld(ctx, cam, sx + 8, 103, 14, 18, '#8fbf3a', 4)
  fillWorld(ctx, cam, sx + 28, 105, 18, 16, '#c46a28', 3)
  fillWorld(ctx, cam, sx + 10, 159, 16, 16, '#eef4f8', 3)
  fillWorld(ctx, cam, sx + 34, 158, 14, 18, '#1b3a22', 3)
}

function drawFridge(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const x = 128
  const y = 4
  fillWorld(ctx, cam, x + 6, y - 4, 50, 138, 'rgba(90,60,30,0.16)', 8)
  fillWorld(ctx, cam, x, y, 48, 136, '#d5e0e8', 10)
  fillWorld(ctx, cam, x + 3, y + 3, 42, 130, '#f4f8fb', 8)
  fillWorld(ctx, cam, x + 3, y + 86, 42, 3, '#c5d4de')
  fillWorld(ctx, cam, x + 7, y + 18, 5, 18, '#ffc938', 2)
  fillWorld(ctx, cam, x + 7, y + 52, 5, 26, '#ffc938', 2)
  fillWorld(ctx, cam, x + 20, y + 104, 10, 10, '#f2744a', 3)
  fillWorld(ctx, cam, x + 32, y + 100, 10, 10, '#8fbf3a', 3)
}

function drawStove(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const x = 58
  const y = 2
  fillWorld(ctx, cam, x, y, 62, 46, '#3a3a48', 8)
  fillWorld(ctx, cam, x + 5, y + 5, 52, 8, '#5a5a6a', 3)
  const flicker = 0.65 + 0.35 * Math.sin(t * 9)
  const b1 = worldToScreen(cam, x + 16, y + 28)
  const b2 = worldToScreen(cam, x + 44, y + 28)
  const s = cam.scale
  for (const b of [b1, b2]) {
    ctx.fillStyle = '#1a1a22'
    ctx.beginPath()
    ctx.arc(b.x, b.y, 8 * s, 0, Math.PI * 2)
    ctx.fill()
    const flame = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 6 * s)
    flame.addColorStop(0, `rgba(255, 230, 102, ${flicker})`)
    flame.addColorStop(0.5, `rgba(255, 107, 74, ${flicker * 0.8})`)
    flame.addColorStop(1, 'rgba(255, 80, 40, 0)')
    ctx.fillStyle = flame
    ctx.beginPath()
    ctx.arc(b.x, b.y, 6 * s, 0, Math.PI * 2)
    ctx.fill()
  }
  fillWorld(ctx, cam, x + 8, y + 30, 22, 18, '#c46a28', 4)
  fillWorld(ctx, cam, x + 4, y + 8, 8, 4, '#ffc938', 2)
}

function drawPlantPot(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const x = 112
  fillWorld(ctx, cam, x, 2, 16, 14, '#c46a28', 3)
  const p = worldToScreen(cam, x + 8, 22)
  const s = cam.scale
  ctx.fillStyle = '#5a8a1c'
  ctx.beginPath()
  ctx.ellipse(p.x, p.y, 5 * s, 10 * s, -0.4, 0, Math.PI * 2)
  ctx.ellipse(p.x + 5 * s, p.y + 2 * s, 5 * s, 11 * s, 0.35, 0, Math.PI * 2)
  ctx.ellipse(p.x - 2 * s, p.y + 6 * s, 4 * s, 8 * s, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#8fbf3a'
  ctx.beginPath()
  ctx.ellipse(p.x + 2 * s, p.y + 4 * s, 4 * s, 8 * s, 0.2, 0, Math.PI * 2)
  ctx.fill()
}

function drawClock(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const p = worldToScreen(cam, 22, 168)
  const s = cam.scale
  ctx.fillStyle = '#6b4220'
  ctx.beginPath()
  ctx.arc(p.x, p.y, 14 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff6e8'
  ctx.beginPath()
  ctx.arc(p.x, p.y, 11 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#163056'
  ctx.lineWidth = 1.6 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
  ctx.lineTo(p.x, p.y - 7 * s)
  ctx.moveTo(p.x, p.y)
  ctx.lineTo(p.x + 5 * s, p.y + 2 * s)
  ctx.stroke()
}

export function drawBoard(ctx: CanvasRenderingContext2D, cam: Camera): void {
  smooth(ctx)
  const origin = worldToScreen(cam, 0, 0)
  const y0 = origin.y
  const h = Math.max(18, 22 * cam.scale)
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h)
  g.addColorStop(0, '#f0d2a0')
  g.addColorStop(0.18, '#e0b878')
  g.addColorStop(0.5, '#c9844a')
  g.addColorStop(0.82, '#a86830')
  g.addColorStop(1, '#6b3a18')
  ctx.fillStyle = g
  ctx.fillRect(0, y0, cam.w, h)
  ctx.fillStyle = 'rgba(255, 244, 220, 0.55)'
  ctx.fillRect(0, y0, cam.w, 2.4)
  ctx.fillStyle = 'rgba(80, 40, 16, 0.18)'
  for (let i = 0; i < 7; i++) {
    const yy = y0 + 4 + i * (h / 7)
    ctx.fillRect(0, yy, cam.w, 0.8)
  }
  ctx.fillStyle = 'rgba(40, 20, 10, 0.22)'
  ctx.fillRect(0, y0 + h, cam.w, 10)
  const shade = ctx.createLinearGradient(0, y0 + h, 0, y0 + h + 28)
  shade.addColorStop(0, 'rgba(40, 20, 10, 0.18)')
  shade.addColorStop(1, 'rgba(40, 20, 10, 0)')
  ctx.fillStyle = shade
  ctx.fillRect(0, y0 + h, cam.w, 28)
}

export function drawRoll(ctx: CanvasRenderingContext2D, cam: Camera, roll: Roll): void {
  smooth(ctx)
  const squash = roll.squash
  const bw = roll.w * squash
  const bh = roll.h / squash
  const bottom = worldToScreen(cam, roll.x, roll.y)
  const cx = bottom.x
  const by = bottom.y
  const rx = Math.max(8, (bw / 2) * cam.scale)
  const ry = rx * 0.5
  const bodyH = Math.max(ry * 1.35, bh * cam.scale * 0.82)
  const topY = by - bodyH
  const pal = FILLINGS[roll.type]
  const maki = roll.style === 'maki'
  const nori = '#1a3d26'
  const noriHi = '#2f6340'
  const noriLo = '#0e2416'
  const rice = '#fff4e4'
  const riceSh = '#e8d5b8'

  ctx.save()
  ctx.globalAlpha *= roll.opacity
  if (roll.rot) {
    const pivY = (by + topY) / 2
    ctx.translate(cx, pivY)
    ctx.rotate(roll.rot)
    ctx.translate(-cx, -pivY)
  }

  ctx.fillStyle = 'rgba(50, 28, 12, 0.22)'
  ctx.beginPath()
  ctx.ellipse(cx + 3, by + 4, rx * 0.92, ry * 0.55, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = maki ? noriLo : riceSh
  ctx.beginPath()
  ctx.ellipse(cx, by, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()

  const side = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0)
  if (maki) {
    side.addColorStop(0, noriLo)
    side.addColorStop(0.22, nori)
    side.addColorStop(0.5, noriHi)
    side.addColorStop(0.8, nori)
    side.addColorStop(1, noriLo)
  } else {
    side.addColorStop(0, riceSh)
    side.addColorStop(0.35, rice)
    side.addColorStop(0.7, '#fffaf0')
    side.addColorStop(1, riceSh)
  }
  ctx.fillStyle = side
  ctx.fillRect(cx - rx, topY, rx * 2, bodyH)

  ctx.save()
  ctx.beginPath()
  ctx.rect(cx - rx, topY, rx * 2, bodyH)
  ctx.clip()
  if (maki) {
    ctx.strokeStyle = 'rgba(8, 20, 10, 0.35)'
    ctx.lineWidth = 1
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath()
      ctx.moveTo(cx + i * (rx / 3.2), topY)
      ctx.lineTo(cx + i * (rx / 3.2), by)
      ctx.stroke()
    }
  } else {
    for (let i = 0; i < 18; i++) {
      const sx = cx - rx * 0.86 + hash2(i, 2) * rx * 1.7
      const sy = topY + hash2(i, 4) * bodyH
      ctx.fillStyle = hash2(i, 6) > 0.45 ? '#3a2a18' : '#f4efe0'
      ctx.beginPath()
      ctx.ellipse(sx, sy, 1.3, 0.7, hash2(i, 8) * 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  ctx.fillStyle = maki ? nori : rice
  ctx.beginPath()
  ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()

  if (maki) {
    ctx.fillStyle = noriHi
    ctx.beginPath()
    ctx.ellipse(cx, topY, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = rice
    ctx.beginPath()
    ctx.ellipse(cx, topY, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillStyle = nori
    ctx.beginPath()
    ctx.ellipse(cx, topY, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = rice
    ctx.beginPath()
    ctx.ellipse(cx, topY, rx * 0.64, ry * 0.64, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.beginPath()
  ctx.ellipse(cx - rx * 0.28, topY - ry * 0.28, rx * 0.22, ry * 0.12, -0.5, 0, Math.PI * 2)
  ctx.fill()

  drawFillingArt(ctx, cx, topY, rx, ry, roll.type, pal)

  ctx.restore()
}

function drawFillingArt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  type: FillingId,
  pal: (typeof FILLINGS)[FillingId],
): void {
  const frx = rx * 0.46
  const fry = ry * 0.46
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy, frx * 1.15, fry * 1.15, 0, 0, Math.PI * 2)
  ctx.clip()

  if (type === 'salmon') {
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = i === 0 ? pal.fill : pal.fillDark
      ctx.beginPath()
      ctx.ellipse(cx + i * frx * 0.42, cy + i * fry * 0.12, frx * 0.55, fry * 0.95, -0.45 + i * 0.12, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = pal.accent
    ctx.globalAlpha = 0.65
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(cx - frx * 0.5, cy - fry * 0.15)
    ctx.quadraticCurveTo(cx, cy - fry * 0.4, cx + frx * 0.55, cy)
    ctx.stroke()
    ctx.globalAlpha = 1
  } else if (type === 'avocado') {
    ctx.fillStyle = pal.fill
    ctx.beginPath()
    ctx.ellipse(cx, cy, frx, fry, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pal.accent
    ctx.beginPath()
    ctx.ellipse(cx - frx * 0.15, cy - fry * 0.1, frx * 0.55, fry * 0.55, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pal.seed
    ctx.beginPath()
    ctx.ellipse(cx + frx * 0.12, cy + fry * 0.08, frx * 0.28, fry * 0.28, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (type === 'tuna') {
    ctx.fillStyle = pal.fillDark
    ctx.beginPath()
    ctx.ellipse(cx, cy, frx, fry, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pal.fill
    ctx.beginPath()
    ctx.ellipse(cx - frx * 0.08, cy - fry * 0.08, frx * 0.72, fry * 0.7, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = pal.accent
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 1
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(cx - frx, cy + i * fry * 0.28)
      ctx.lineTo(cx + frx, cy + i * fry * 0.18)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  } else if (type === 'cucumber') {
    ctx.fillStyle = pal.fill
    ctx.beginPath()
    ctx.ellipse(cx, cy, frx, fry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pal.accent
    ctx.beginPath()
    ctx.ellipse(cx, cy, frx * 0.62, fry * 0.62, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pal.seed
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(cx + Math.cos(a) * frx * 0.28, cy + Math.sin(a) * fry * 0.28, 1.4, 1.1, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'unagi') {
    ctx.fillStyle = pal.fillDark
    ctx.beginPath()
    ctx.ellipse(cx, cy, frx, fry, 0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pal.fill
    ctx.beginPath()
    ctx.ellipse(cx, cy, frx * 0.72, fry * 0.55, 0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = pal.accent
    ctx.globalAlpha = 0.7
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(cx - frx * 0.6, cy)
    ctx.quadraticCurveTo(cx, cy - fry * 0.5, cx + frx * 0.6, cy)
    ctx.stroke()
    ctx.globalAlpha = 1
  } else {
    ctx.fillStyle = pal.fill
    roundRect(ctx, cx - frx * 0.85, cy - fry * 0.7, frx * 1.7, fry * 1.4, 3)
    ctx.fill()
    ctx.fillStyle = pal.accent
    ctx.fillRect(cx - frx * 0.85, cy - fry * 0.18, frx * 1.7, fry * 0.22)
    ctx.fillStyle = pal.seed
    ctx.fillRect(cx - frx * 0.15, cy - fry * 0.55, frx * 0.3, fry * 0.35)
  }

  ctx.restore()
}

export function drawGhost(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  x: number,
  y: number,
  w: number,
  quality: 'perfect' | 'good' | 'bad',
): void {
  smooth(ctx)
  const p = worldToScreen(cam, x, y)
  const rx = Math.max(8, (w / 2) * cam.scale)
  const ry = rx * 0.5
  const color = quality === 'perfect' ? '#ffc938' : quality === 'good' ? '#8fbf3a' : '#ff3b4e'
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = color
  ctx.lineWidth = 2.4
  ctx.setLineDash([6, 5])
  ctx.beginPath()
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

export function drawCrane(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  trolleyWorldX: number,
  hookWorldX: number,
  hookWorldY: number,
  attached: boolean,
  t: number,
): void {
  smooth(ctx)
  const boomY = 32
  const mastW = 14
  const yellow = '#ffc938'
  const yellowDk = '#e09a10'
  const red = '#ff3b4e'
  const redDk = '#d01e36'
  const tx = cam.w / 2 + (trolleyWorldX - cam.x) * cam.scale + cam.shakeX
  const hook = worldToScreen(cam, hookWorldX, hookWorldY)

  const mastG = ctx.createLinearGradient(8, 0, 8 + mastW, 0)
  mastG.addColorStop(0, yellowDk)
  mastG.addColorStop(0.4, yellow)
  mastG.addColorStop(1, yellowDk)
  ctx.fillStyle = mastG
  roundRect(ctx, 8, 8, mastW, boomY + 10, 3)
  ctx.fill()
  ctx.fillStyle = red
  for (let i = 0; i < 4; i++) ctx.fillRect(8, 14 + i * 10, mastW, 4)
  roundRect(ctx, 4, boomY - 6, 22, 16, 4)
  ctx.fillStyle = red
  ctx.fill()
  ctx.fillStyle = '#b8f0ff'
  roundRect(ctx, 8, boomY - 2, 12, 8, 2)
  ctx.fill()

  const beamG = ctx.createLinearGradient(0, boomY, 0, boomY + 16)
  beamG.addColorStop(0, '#ffe27a')
  beamG.addColorStop(0.45, yellow)
  beamG.addColorStop(1, yellowDk)
  ctx.fillStyle = beamG
  roundRect(ctx, 24, boomY, cam.w - 36, 14, 4)
  ctx.fill()
  ctx.fillStyle = red
  ctx.fillRect(24, boomY + 12, cam.w - 36, 4)

  ctx.fillStyle = redDk
  roundRect(ctx, tx - 16, boomY - 8, 32, 22, 5)
  ctx.fill()
  ctx.fillStyle = yellow
  roundRect(ctx, tx - 12, boomY - 4, 24, 14, 3)
  ctx.fill()
  ctx.fillStyle = '#3a3a48'
  ctx.beginPath()
  ctx.arc(tx, boomY + 10, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#8a9aa8'
  ctx.beginPath()
  ctx.arc(tx, boomY + 10, 2.4, 0, Math.PI * 2)
  ctx.fill()

  const ropeTop = boomY + 14
  const ropeBot = attached ? hook.y : ropeTop + 52 + Math.sin(t * 1.1) * 2
  const ropeX1 = tx
  const ropeX2 = attached ? hook.x : tx + Math.sin(t * 1.1) * 3
  ctx.strokeStyle = '#5c4033'
  ctx.lineWidth = 2.15
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(ropeX1, ropeTop)
  ctx.lineTo(ropeX2, ropeBot)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(232, 200, 160, 0.45)'
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(ropeX1 + 1.1, ropeTop)
  ctx.lineTo(ropeX2 + 1.1, ropeBot)
  ctx.stroke()

  ctx.fillStyle = red
  roundRect(ctx, ropeX2 - 8, ropeBot - 2, 16, 7, 2)
  ctx.fill()
  ctx.strokeStyle = redDk
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.arc(ropeX2 - 4, ropeBot + 8, 5, -0.2, Math.PI * 0.9)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(ropeX2 + 4, ropeBot + 8, 5, Math.PI * 0.1, Math.PI * 1.2)
  ctx.stroke()
}

export function drawParticles(ctx: CanvasRenderingContext2D, cam: Camera, particles: Particle[]): void {
  smooth(ctx)
  for (const p of particles) {
    const s = worldToScreen(cam, p.x, p.y)
    const a = Math.max(0, p.life / p.maxLife)
    ctx.save()
    ctx.globalAlpha = a
    ctx.translate(s.x, s.y)
    ctx.rotate(p.rot)
    if (p.kind === 'rice') {
      ctx.fillStyle = '#fff6e8'
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()
    } else if (p.kind === 'star') {
      ctx.fillStyle = brand.colors.goldLight
      starPath(ctx, 0, 0, p.size * 0.45, p.size * 0.9, 5)
      ctx.fill()
    } else if (p.kind === 'spark') {
      ctx.fillStyle = brand.colors.goldLight
      ctx.beginPath()
      ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = brand.colors.wasabi
      ctx.beginPath()
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

function starPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  inner: number,
  outer: number,
  n: number,
): void {
  ctx.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i * Math.PI) / n - Math.PI / 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function uiFont(px: number, weight = 800): string {
  return `${weight} ${Math.round(px)}px ${brand.font}`
}

export function drawFloatTexts(ctx: CanvasRenderingContext2D, cam: Camera, items: FloatText[]): void {
  smooth(ctx)
  for (const f of items) {
    const p = worldToScreen(cam, f.x, f.y)
    const t = f.age / f.maxAge
    const alpha = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1
    ctx.save()
    ctx.globalAlpha = Math.max(0, alpha)
    ctx.font = uiFont(18 * f.scale)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(22, 48, 86, 0.28)'
    ctx.fillText(f.text, p.x + 1.5, p.y - t * 40 + 1.5)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, p.x, p.y - t * 40)
    ctx.restore()
  }
}

export function drawWasabiFlash(ctx: CanvasRenderingContext2D, cam: Camera, amount: number): void {
  if (amount <= 0) return
  smooth(ctx)
  const g = ctx.createRadialGradient(cam.w / 2, cam.h * 0.45, 20, cam.w / 2, cam.h * 0.45, cam.w * 0.7)
  g.addColorStop(0, `rgba(255, 226, 122, ${amount * 0.22})`)
  g.addColorStop(1, `rgba(255, 201, 56, 0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cam.w, cam.h)
}

export function drawVignette(ctx: CanvasRenderingContext2D, cam: Camera): void {
  smooth(ctx)
  const g = ctx.createRadialGradient(cam.w / 2, cam.h * 0.48, cam.h * 0.28, cam.w / 2, cam.h * 0.5, cam.h * 0.82)
  g.addColorStop(0, 'rgba(20, 16, 40, 0)')
  g.addColorStop(1, 'rgba(20, 16, 40, 0.22)')
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
  smooth(ctx)
  const tt = age / 1.05
  const alpha = tt < 0.12 ? tt / 0.12 : tt > 0.7 ? (1 - tt) / 0.3 : 1
  const y = cam.h * 0.27
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = uiFont(Math.max(22, cam.w * 0.055))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const tw = Math.min(cam.w - 32, Math.max(160, ctx.measureText(text).width + 48))
  const th = 48
  const x = cam.w / 2 - tw / 2
  ctx.fillStyle = 'rgba(22, 48, 86, 0.18)'
  roundRect(ctx, x, y - th / 2 + 3, tw, th, 24)
  ctx.fill()
  const g = ctx.createLinearGradient(x, y - th / 2, x, y + th / 2)
  g.addColorStop(0, '#ffe27a')
  g.addColorStop(1, '#ffc938')
  ctx.fillStyle = g
  roundRect(ctx, x, y - th / 2, tw, th, 24)
  ctx.fill()
  ctx.fillStyle = '#163056'
  ctx.fillText(text, cam.w / 2, y + 1)
  ctx.restore()
}

export function drawTapHint(ctx: CanvasRenderingContext2D, cam: Camera, text: string, age: number): void {
  smooth(ctx)
  const pulse = 0.88 + 0.12 * Math.sin(age * 4)
  const y = cam.h * 0.5
  ctx.save()
  ctx.globalAlpha = pulse
  ctx.font = uiFont(15, 700)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const tw = Math.min(cam.w - 40, ctx.measureText(text).width + 36)
  const x = cam.w / 2 - tw / 2
  const th = 40
  ctx.fillStyle = 'rgba(22, 48, 86, 0.82)'
  roundRect(ctx, x, y - th / 2, tw, th, 20)
  ctx.fill()
  ctx.fillStyle = '#fff6e8'
  ctx.fillText(text, cam.w / 2, y + 1)
  ctx.restore()
}
