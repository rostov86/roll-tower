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

const PX = {
  wallA: '#f7e4c6',
  wallB: '#f0c8a0',
  grout: '#e2b07a',
  wall2A: '#e4d0f0',
  wall2B: '#cbb4dc',
  wall3A: '#7ec8c0',
  wall3B: '#5aa8a0',
  brickA: '#c45a48',
  brickB: '#a04032',
  brickG: '#6a3028',
  nightA: '#2a3060',
  nightB: '#1c2248',
  floorA: '#d4b078',
  floorB: '#c09860',
  cab: '#8a4e24',
  cabDk: '#6a3818',
  cabLt: '#c9844a',
  wood: '#c9844a',
  woodDk: '#8a4e24',
  woodMd: '#a86830',
  woodLt: '#e8b878',
  woodHi: '#f4d4a0',
  skyDay1: '#d8f6ff',
  skyDay2: '#7ee7ff',
  skyDay3: '#4ec6f5',
  skyDay4: '#3aa8e0',
  skyDusk1: '#ffc090',
  skyDusk2: '#e878a0',
  skyDusk3: '#7a6ad6',
  skyDusk4: '#3a3888',
  skyNight1: '#2a2870',
  skyNight2: '#181848',
  skyNight3: '#0c1030',
  skyNight4: '#080818',
  sun: '#ffe566',
  sunHi: '#fff6b0',
  moon: '#fff6e8',
  moonSh: '#d0d8f0',
  cloud: '#ffffff',
  cloudSh: '#d5ecf8',
  star: '#fff6e8',
  starDim: '#ffe27a',
  frame: '#6b4220',
  frameLt: '#a86a34',
  fridge: '#eef4f8',
  fridgeDk: '#c5d4de',
  fridgeHi: '#ffffff',
  handle: '#ffc938',
  stove: '#3a3a48',
  stoveHi: '#5a5a6a',
  burner: '#1a1a22',
  flame: '#ff6b4a',
  flameHi: '#ffe566',
  plant: '#8fbf3a',
  plantDk: '#5a8a1c',
  pot: '#c46a28',
  potDk: '#8a3a12',
  soy: '#2a1810',
  nori: '#163820',
  rice: '#fff6e8',
  salmon: '#ff6b4a',
  avocado: '#8fc63a',
  wasabi: '#8fbf3a',
  pipe: '#8a9aa8',
  pipeDk: '#5a6a78',
  pipeHi: '#c8d4dc',
  lamp: '#ffc938',
  lampDk: '#e09a10',
  lampGlow: '#ffe27a',
  bldg1: '#163056',
  bldg2: '#0e1c38',
  bldg3: '#2a4a78',
  winLit: '#ffc938',
  winDim: '#4a68a0',
  antenna: '#8a9aa8',
}

export function pixelUnit(cam: Camera): number {
  return Math.max(4, Math.min(8, Math.round(Math.min(cam.w, cam.h) / 90) || 4))
}

function snap(n: number, P: number): number {
  return Math.round(n / P) * P
}

function pfill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function fillWorld(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  P: number,
  wx: number,
  wy: number,
  ww: number,
  wh: number,
  color: string,
): void {
  const tl = worldToScreen(cam, wx, wy + wh)
  const br = worldToScreen(cam, wx + ww, wy)
  const x = snap(tl.x, P)
  const y = snap(tl.y, P)
  const w = Math.max(P, snap(br.x, P) - x)
  const h = Math.max(P, snap(br.y, P) - y)
  pfill(ctx, x, y, w, h, color)
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

function fillDisk(
  ctx: CanvasRenderingContext2D,
  P: number,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  const gx0 = Math.floor((cx - r) / P)
  const gx1 = Math.ceil((cx + r) / P)
  const gy0 = Math.floor((cy - r) / P)
  const gy1 = Math.ceil((cy + r) / P)
  const rr = (r / P) * (r / P)
  const ccx = cx / P
  const ccy = cy / P
  ctx.fillStyle = color
  for (let gy = gy0; gy <= gy1; gy++) {
    let run = -1
    for (let gx = gx0; gx <= gx1 + 1; gx++) {
      const dx = gx + 0.5 - ccx
      const dy = gy + 0.5 - ccy
      const inside = gx <= gx1 && dx * dx + dy * dy <= rr
      if (inside) {
        if (run < 0) run = gx
      } else if (run >= 0) {
        ctx.fillRect(run * P, gy * P, (gx - run) * P, P)
        run = -1
      }
    }
  }
}

function pixelLine(
  ctx: CanvasRenderingContext2D,
  P: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
): void {
  let gx0 = Math.round(x0 / P)
  let gy0 = Math.round(y0 / P)
  const gx1 = Math.round(x1 / P)
  const gy1 = Math.round(y1 / P)
  const dx = Math.abs(gx1 - gx0)
  const dy = Math.abs(gy1 - gy0)
  const sx = gx0 < gx1 ? 1 : -1
  const sy = gy0 < gy1 ? 1 : -1
  let err = dx - dy
  ctx.fillStyle = color
  while (true) {
    ctx.fillRect(gx0 * P, gy0 * P, P, P)
    if (gx0 === gx1 && gy0 === gy1) break
    const e2 = err * 2
    if (e2 > -dy) {
      err -= dy
      gx0 += sx
    }
    if (e2 < dx) {
      err += dx
      gy0 += sy
    }
  }
}

function crisp(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = false
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  crisp(ctx)
  const P = pixelUnit(cam)
  fillSky(ctx, cam, P)
  drawStars(ctx, cam, P, t)
  drawFarClouds(ctx, cam, P, t)
  drawMoonOrSun(ctx, cam, P, t)
  drawCityParallax(ctx, cam, P)
  drawWorldWalls(ctx, cam, P)
  drawWorldDecor(ctx, cam, P, t)
  drawKitchen(ctx, cam, P, t)
}

function skyPalette(camY: number): string[] {
  if (camY < 280) return [PX.skyDay1, PX.skyDay2, PX.skyDay3, PX.skyDay4]
  if (camY < 620) return [PX.skyDusk1, PX.skyDusk2, PX.skyDusk3, PX.skyDusk4]
  return [PX.skyNight1, PX.skyNight2, PX.skyNight3, PX.skyNight4]
}

function fillSky(ctx: CanvasRenderingContext2D, cam: Camera, P: number): void {
  const cols = skyPalette(cam.y)
  const band = Math.max(P * 4, snap(cam.h / cols.length, P))
  for (let i = 0; i < cols.length; i++) {
    pfill(ctx, 0, i * band, cam.w, band + P, cols[i])
  }
}

function drawStars(ctx: CanvasRenderingContext2D, cam: Camera, P: number, t: number): void {
  const night = cam.y < 420 ? 0 : Math.min(1, (cam.y - 420) / 500)
  if (night <= 0) return
  ctx.globalAlpha = 0.35 + night * 0.65
  const oy = cam.y * 0.12
  const cols = Math.ceil(cam.w / P) + 2
  const rows = Math.ceil(cam.h / P) + 2
  for (let i = 0; i < 48; i++) {
    const hx = hash2(i, 3)
    const hy = hash2(i, 9)
    const gx = Math.floor(((hx * cols * 3 + oy * 0.02) % cols + cols) % cols)
    const gy = Math.floor(((hy * rows * 3 - oy / P) % rows + rows) % rows)
    const twinkle = hash2(i, Math.floor(t * 2)) > 0.35
    pfill(ctx, gx * P, gy * P, P, P, twinkle ? PX.star : PX.starDim)
    if (hash2(i, 11) > 0.82) {
      pfill(ctx, gx * P - P, gy * P, P, P, PX.starDim)
      pfill(ctx, gx * P + P, gy * P, P, P, PX.starDim)
      pfill(ctx, gx * P, gy * P - P, P, P, PX.starDim)
      pfill(ctx, gx * P, gy * P + P, P, P, PX.starDim)
    }
  }
  ctx.globalAlpha = 1
}

function drawFarClouds(ctx: CanvasRenderingContext2D, cam: Camera, P: number, t: number): void {
  if (cam.y > 900) return
  const alpha = cam.y < 500 ? 0.9 : Math.max(0, 1 - (cam.y - 500) / 400)
  ctx.globalAlpha = alpha
  const drift = t * 8
  const oy = cam.y * 0.28
  for (let i = 0; i < 6; i++) {
    const x = ((hash2(i, 1) * (cam.w + 160) + drift * (0.4 + hash2(i, 2)) - oy * 0.05) % (cam.w + 160)) - 80
    const y = 20 + hash2(i, 4) * cam.h * 0.35 - (oy % (cam.h * 0.5))
    drawPixelCloud(ctx, P, x, y, 4 + Math.floor(hash2(i, 5) * 4))
  }
  ctx.globalAlpha = 1
}

function drawPixelCloud(ctx: CanvasRenderingContext2D, P: number, x: number, y: number, s: number): void {
  const ox = snap(x, P)
  const oy = snap(y, P)
  pfill(ctx, ox + P * 2, oy, P * (s + 2), P, PX.cloud)
  pfill(ctx, ox + P, oy + P, P * (s + 4), P, PX.cloud)
  pfill(ctx, ox, oy + P * 2, P * (s + 6), P, PX.cloud)
  pfill(ctx, ox + P, oy + P * 3, P * (s + 4), P, PX.cloudSh)
}

function drawMoonOrSun(ctx: CanvasRenderingContext2D, cam: Camera, P: number, t: number): void {
  const x = snap(cam.w * 0.78, P)
  const y = snap(cam.h * 0.12 - cam.y * 0.04, P)
  if (cam.y < 360) {
    fillDisk(ctx, P, x, y, P * 4, PX.sun)
    fillDisk(ctx, P, x, y, P * 2, Math.sin(t * 2) > 0 ? PX.sunHi : PX.sun)
  } else if (cam.y > 520) {
    fillDisk(ctx, P, x, y, P * 4, PX.moon)
    fillDisk(ctx, P, x + P, y - P, P * 2, PX.moonSh)
    pfill(ctx, x - P, y + P, P, P, PX.moonSh)
  }
}

function drawCityParallax(ctx: CanvasRenderingContext2D, cam: Camera, P: number): void {
  if (cam.y < 380) return
  const alpha = Math.min(1, (cam.y - 380) / 280)
  ctx.globalAlpha = alpha
  const baseY = snap(cam.h * 0.62 - cam.y * 0.45 + 220, P)
  const bldg = [
    { x: 0.02, w: 8, h: 18 },
    { x: 0.12, w: 6, h: 12 },
    { x: 0.22, w: 10, h: 22 },
    { x: 0.38, w: 7, h: 16 },
    { x: 0.5, w: 12, h: 26 },
    { x: 0.68, w: 6, h: 14 },
    { x: 0.78, w: 9, h: 20 },
    { x: 0.9, w: 7, h: 11 },
  ]
  for (let i = 0; i < bldg.length; i++) {
    const b = bldg[i]
    const x = snap(cam.w * b.x, P)
    const h = b.h * P
    const y = baseY - h
    const col = i % 3 === 0 ? PX.bldg2 : i % 2 === 0 ? PX.bldg1 : PX.bldg3
    pfill(ctx, x, y, b.w * P, h, col)
    if (i % 2 === 0) pfill(ctx, x + P * 2, y - P * 4, P, P * 4, PX.antenna)
    for (let wy = 2; wy < b.h - 1; wy += 2) {
      for (let wx = 1; wx < b.w - 1; wx += 2) {
        const lit = hash2(i + wx, wy + Math.floor(cam.y / 80)) > 0.45
        pfill(ctx, x + wx * P, y + wy * P, P, P, lit ? PX.winLit : PX.winDim)
      }
    }
  }
  ctx.globalAlpha = 1
}

const TILE = 16

function tileColor(tx: number, ty: number, wy: number): string | null {
  const even = ((tx + ty) & 1) === 0
  const wx = Math.abs(tx * TILE)
  if (wy < -8) return even ? PX.floorA : PX.floorB
  if (wy < 200) return even ? PX.wallA : PX.wallB
  if (wy < 460) return even ? PX.wall2A : PX.wall2B
  if (wy < 720) return even ? PX.wall3A : PX.wall3B
  if (wy < 1100) {
    if (wx < 96) return null
    const rowShift = (ty & 1) === 0 ? tx : tx + 1
    return (rowShift & 1) === 0 ? PX.brickA : PX.brickB
  }
  if (wy < 1420) {
    if (wx < 130) return null
    return even ? PX.nightA : PX.nightB
  }
  return null
}

function drawWorldWalls(ctx: CanvasRenderingContext2D, cam: Camera, P: number): void {
  const v = viewWorld(cam)
  const tx0 = Math.floor(v.xL / TILE) - 1
  const tx1 = Math.ceil(v.xR / TILE) + 1
  const ty0 = Math.floor(v.yB / TILE) - 1
  const ty1 = Math.ceil(v.yT / TILE) + 1
  for (let ty = ty0; ty < ty1; ty++) {
    const wy = ty * TILE
    for (let tx = tx0; tx < tx1; tx++) {
      const col = tileColor(tx, ty, wy)
      if (!col) continue
      fillWorld(ctx, cam, P, tx * TILE, wy, TILE, TILE, col)
    }
  }
  if (v.yB < 210 && v.yT > -20) {
    ctx.fillStyle = PX.grout
    for (let ty = Math.max(ty0, 0); ty < Math.min(ty1, Math.ceil(200 / TILE)); ty++) {
      const a = worldToScreen(cam, v.xL, ty * TILE)
      const b = worldToScreen(cam, v.xR, ty * TILE)
      pfill(ctx, snap(a.x, P), snap(a.y, P), Math.max(P, snap(b.x, P) - snap(a.x, P)), Math.max(1, P / 4), PX.grout)
    }
  }
  if (v.yB < -4) {
    fillWorld(ctx, cam, P, v.xL - 20, -36, v.xR - v.xL + 40, 28, PX.cab)
    fillWorld(ctx, cam, P, v.xL - 20, -12, v.xR - v.xL + 40, 4, PX.cabDk)
    fillWorld(ctx, cam, P, v.xL - 20, -36, v.xR - v.xL + 40, 3, PX.cabLt)
    for (let k = 0; k < 6; k++) {
      const wx = v.xL + 30 + k * 70
      fillWorld(ctx, cam, P, wx, -30, 3, 16, PX.cabDk)
      fillWorld(ctx, cam, P, wx + 18, -24, 8, 3, PX.handle)
    }
  }
}

function drawWorldDecor(ctx: CanvasRenderingContext2D, cam: Camera, P: number, t: number): void {
  const v = viewWorld(cam)
  for (let floor = 1; floor <= 18; floor++) {
    const baseY = 200 + (floor - 1) * 150
    if (baseY > v.yT + 40 || baseY + 150 < v.yB) continue
    drawFloorWindows(ctx, cam, P, baseY, floor)
    drawFloorLamp(ctx, cam, P, baseY, floor, t)
    if (floor % 2 === 0) drawFloorPipes(ctx, cam, P, baseY, floor)
    if (floor % 3 === 0 && baseY < 700) drawFloorRail(ctx, cam, P, baseY)
  }
  if (v.yT > 1380 && v.yB < 1600) {
    fillWorld(ctx, cam, P, -40, 1420, 28, 50, PX.nightB)
    fillWorld(ctx, cam, P, -34, 1468, 16, 8, PX.pipe)
    fillWorld(ctx, cam, P, 80, 1420, 6, 80, PX.antenna)
    fillWorld(ctx, cam, P, 76, 1496, 14, 6, PX.pipeDk)
  }
}

function drawFloorWindows(ctx: CanvasRenderingContext2D, cam: Camera, P: number, baseY: number, floor: number): void {
  const xs = baseY >= 700 ? [-170, 150] : [-150, -50, 50, 150]
  const night = floor >= 8
  for (let i = 0; i < xs.length; i++) {
    if (hash2(floor, i) < 0.18) continue
    const x = xs[i]
    const y = baseY + 40
    fillWorld(ctx, cam, P, x, y, 44, 56, PX.frame)
    fillWorld(ctx, cam, P, x + 4, y + 4, 36, 48, PX.frameLt)
    const pane = night ? (hash2(floor * 3, i) > 0.4 ? PX.skyNight2 : PX.skyNight3) : floor >= 5 ? PX.skyDusk3 : PX.skyDay3
    fillWorld(ctx, cam, P, x + 6, y + 6, 14, 20, pane)
    fillWorld(ctx, cam, P, x + 24, y + 6, 14, 20, floor >= 5 ? PX.skyDusk2 : PX.skyDay1)
    fillWorld(ctx, cam, P, x + 6, y + 28, 14, 20, pane)
    fillWorld(ctx, cam, P, x + 24, y + 28, 14, 20, pane)
    if (night && hash2(floor, i + 7) > 0.5) {
      fillWorld(ctx, cam, P, x + 8, y + 10, 4, 4, PX.winLit)
      fillWorld(ctx, cam, P, x + 26, y + 32, 4, 4, PX.winLit)
    }
    fillWorld(ctx, cam, P, x + 20, y + 4, 4, 48, PX.frameLt)
    fillWorld(ctx, cam, P, x + 4, y + 26, 36, 4, PX.frameLt)
    fillWorld(ctx, cam, P, x - 2, y, 48, 4, PX.woodLt)
  }
}

function drawFloorLamp(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  P: number,
  baseY: number,
  floor: number,
  t: number,
): void {
  const x = floor % 2 === 0 ? -170 : 170
  const y = baseY + 120
  fillWorld(ctx, cam, P, x, y, 4, 24, PX.pipeDk)
  fillWorld(ctx, cam, P, x - 8, y, 20, 6, PX.lampDk)
  const glow = Math.sin(t * 3 + floor) > -0.4
  fillWorld(ctx, cam, P, x - 6, y + 6, 16, 10, glow ? PX.lamp : PX.lampDk)
  if (glow) fillWorld(ctx, cam, P, x - 2, y + 8, 8, 4, PX.lampGlow)
}

function drawFloorPipes(ctx: CanvasRenderingContext2D, cam: Camera, P: number, baseY: number, floor: number): void {
  const x = floor % 4 === 0 ? -190 : 186
  fillWorld(ctx, cam, P, x, baseY + 10, 8, 130, PX.pipe)
  fillWorld(ctx, cam, P, x + 2, baseY + 10, 2, 130, PX.pipeHi)
  fillWorld(ctx, cam, P, x - 4, baseY + 40, 16, 8, PX.pipeDk)
  fillWorld(ctx, cam, P, x - 4, baseY + 90, 16, 8, PX.pipeDk)
}

function drawFloorRail(ctx: CanvasRenderingContext2D, cam: Camera, P: number, baseY: number): void {
  const v = viewWorld(cam)
  fillWorld(ctx, cam, P, v.xL - 10, baseY + 8, v.xR - v.xL + 20, 6, PX.woodDk)
  fillWorld(ctx, cam, P, v.xL - 10, baseY + 12, v.xR - v.xL + 20, 3, PX.wood)
}

function drawKitchen(ctx: CanvasRenderingContext2D, cam: Camera, P: number, t: number): void {
  const v = viewWorld(cam)
  if (v.yB > 220 || v.yT < -40) return

  drawKitchenWindow(ctx, cam, P, t)
  drawShelves(ctx, cam, P)
  drawFridge(ctx, cam, P)
  drawStove(ctx, cam, P, t)
  drawPlantPot(ctx, cam, P)
  drawClock(ctx, cam, P)
}

function drawKitchenWindow(ctx: CanvasRenderingContext2D, cam: Camera, P: number, t: number): void {
  const x = -120
  const y = 70
  const w = 88
  const h = 72
  fillWorld(ctx, cam, P, x, y, w, h, PX.frame)
  fillWorld(ctx, cam, P, x + 4, y + 4, w - 8, h - 8, PX.frameLt)
  fillWorld(ctx, cam, P, x + 8, y + 8, 32, 26, PX.skyDay2)
  fillWorld(ctx, cam, P, x + 48, y + 8, 32, 26, PX.skyDay1)
  fillWorld(ctx, cam, P, x + 8, y + 38, 32, 26, PX.skyDay3)
  fillWorld(ctx, cam, P, x + 48, y + 38, 32, 26, PX.skyDay3)
  fillWorld(ctx, cam, P, x + 62, y + 12, 12, 12, PX.sun)
  fillWorld(ctx, cam, P, x + 66, y + 16, 4, 4, Math.sin(t * 2.2) > 0 ? PX.sunHi : PX.sun)
  fillWorld(ctx, cam, P, x + 12, y + 16, 16, 6, PX.cloud)
  fillWorld(ctx, cam, P, x + 16, y + 12, 10, 4, PX.cloud)
  fillWorld(ctx, cam, P, x + 40, y + 4, 8, h - 8, PX.frameLt)
  fillWorld(ctx, cam, P, x + 4, y + 34, w - 8, 8, PX.frameLt)
  fillWorld(ctx, cam, P, x - 4, y, w + 8, 6, PX.woodLt)
  fillWorld(ctx, cam, P, x - 4, y + h, w + 8, 6, PX.wood)
  fillWorld(ctx, cam, P, x + 8, y + h + 6, 10, 10, PX.pot)
  fillWorld(ctx, cam, P, x + 10, y + h + 14, 6, 4, PX.plant)
  fillWorld(ctx, cam, P, x + 6, y + h + 18, 4, 6, PX.plantDk)
  fillWorld(ctx, cam, P, x + 14, y + h + 18, 4, 8, PX.plant)
}

function drawShelves(ctx: CanvasRenderingContext2D, cam: Camera, P: number): void {
  const sx = -190
  const ys = [36, 88, 140]
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i]
    fillWorld(ctx, cam, P, sx, y, 56, 6, PX.wood)
    fillWorld(ctx, cam, P, sx, y, 56, 2, PX.woodDk)
    fillWorld(ctx, cam, P, sx, y + 4, 4, 8, PX.woodDk)
    fillWorld(ctx, cam, P, sx + 52, y + 4, 4, 8, PX.woodDk)
  }
  fillWorld(ctx, cam, P, sx + 6, 42, 12, 18, PX.soy)
  fillWorld(ctx, cam, P, sx + 6, 58, 12, 4, PX.nori)
  fillWorld(ctx, cam, P, sx + 24, 42, 12, 18, PX.salmon)
  fillWorld(ctx, cam, P, sx + 24, 58, 12, 4, PX.woodLt)
  fillWorld(ctx, cam, P, sx + 40, 46, 10, 14, PX.avocado)
  fillWorld(ctx, cam, P, sx + 8, 94, 14, 16, PX.wasabi)
  fillWorld(ctx, cam, P, sx + 8, 108, 14, 4, PX.woodHi)
  fillWorld(ctx, cam, P, sx + 28, 96, 16, 14, PX.pot)
  fillWorld(ctx, cam, P, sx + 32, 108, 8, 4, PX.potDk)
  fillWorld(ctx, cam, P, sx + 10, 148, 18, 14, '#e8f0f4')
  fillWorld(ctx, cam, P, sx + 14, 158, 10, 4, PX.handle)
  fillWorld(ctx, cam, P, sx + 34, 146, 12, 16, PX.nori)
}

function drawFridge(ctx: CanvasRenderingContext2D, cam: Camera, P: number): void {
  const x = 132
  const y = 0
  fillWorld(ctx, cam, P, x + 4, y + 4, 48, 132, 'rgba(90,60,30,0.18)')
  fillWorld(ctx, cam, P, x, y, 48, 136, PX.fridgeDk)
  fillWorld(ctx, cam, P, x + 4, y + 4, 40, 128, PX.fridge)
  fillWorld(ctx, cam, P, x + 4, y + 120, 40, 6, PX.fridgeHi)
  fillWorld(ctx, cam, P, x + 4, y + 88, 40, 4, PX.fridgeDk)
  fillWorld(ctx, cam, P, x + 8, y + 20, 6, 16, PX.handle)
  fillWorld(ctx, cam, P, x + 8, y + 56, 6, 24, PX.handle)
  fillWorld(ctx, cam, P, x + 22, y + 100, 8, 8, PX.salmon)
  fillWorld(ctx, cam, P, x + 32, y + 96, 8, 8, PX.avocado)
  fillWorld(ctx, cam, P, x + 8, y, 8, 6, PX.woodDk)
  fillWorld(ctx, cam, P, x + 32, y, 8, 6, PX.woodDk)
}

function drawStove(ctx: CanvasRenderingContext2D, cam: Camera, P: number, t: number): void {
  const x = 64
  const y = 0
  fillWorld(ctx, cam, P, x, y, 60, 44, PX.stove)
  fillWorld(ctx, cam, P, x + 4, y + 4, 52, 8, PX.stoveHi)
  fillWorld(ctx, cam, P, x + 8, y + 16, 16, 16, PX.burner)
  fillWorld(ctx, cam, P, x + 36, y + 16, 16, 16, PX.burner)
  fillWorld(ctx, cam, P, x + 12, y + 20, 8, 8, PX.stoveHi)
  fillWorld(ctx, cam, P, x + 40, y + 20, 8, 8, PX.stoveHi)
  const flicker = Math.sin(t * 14) > 0
  fillWorld(ctx, cam, P, x + 14, y + 22, 4, 4, flicker ? PX.flameHi : PX.flame)
  fillWorld(ctx, cam, P, x + 42, y + 22, 4, 4, flicker ? PX.flame : PX.flameHi)
  fillWorld(ctx, cam, P, x + 10, y + 32, 20, 18, PX.pot)
  fillWorld(ctx, cam, P, x + 14, y + 46, 12, 4, PX.potDk)
  fillWorld(ctx, cam, P, x + 6, y + 38, 6, 4, PX.potDk)
  fillWorld(ctx, cam, P, x + 28, y + 38, 6, 4, PX.potDk)
  fillWorld(ctx, cam, P, x + 4, y + 8, 8, 4, PX.handle)
  fillWorld(ctx, cam, P, x + 4, y, 10, 6, PX.woodDk)
  fillWorld(ctx, cam, P, x + 46, y, 10, 6, PX.woodDk)
}

function drawPlantPot(ctx: CanvasRenderingContext2D, cam: Camera, P: number): void {
  const x = 118
  const y = 0
  fillWorld(ctx, cam, P, x, y, 16, 12, PX.pot)
  fillWorld(ctx, cam, P, x + 2, y + 10, 12, 4, PX.potDk)
  fillWorld(ctx, cam, P, x + 6, y + 12, 4, 16, PX.plantDk)
  fillWorld(ctx, cam, P, x + 2, y + 20, 6, 12, PX.plant)
  fillWorld(ctx, cam, P, x + 8, y + 22, 6, 14, PX.plant)
  fillWorld(ctx, cam, P, x + 4, y + 28, 4, 8, PX.plantDk)
}

function drawClock(ctx: CanvasRenderingContext2D, cam: Camera, P: number): void {
  fillWorld(ctx, cam, P, 20, 150, 24, 24, PX.frame)
  fillWorld(ctx, cam, P, 24, 154, 16, 16, PX.rice)
  fillWorld(ctx, cam, P, 30, 158, 4, 8, PX.soy)
  fillWorld(ctx, cam, P, 30, 162, 8, 4, PX.salmon)
}

export function drawBoard(ctx: CanvasRenderingContext2D, cam: Camera): void {
  crisp(ctx)
  const P = pixelUnit(cam)
  const origin = worldToScreen(cam, 0, 0)
  const y0 = snap(origin.y, P)
  const x0 = snap(cam.shakeX, P) - P * 4
  const w = cam.w + P * 8
  const h = Math.max(P * 5, snap(20 * cam.scale, P))
  pfill(ctx, x0, y0 + h, w, P * 2, 'rgba(40, 20, 10, 0.28)')
  const bands = [PX.woodDk, PX.woodMd, PX.wood, PX.woodLt, PX.wood, PX.woodMd, PX.woodDk]
  const rows = Math.max(1, Math.round(h / P))
  for (let i = 0; i < rows; i++) {
    pfill(ctx, x0, y0 + i * P, w, P, bands[i % bands.length])
  }
  ctx.fillStyle = PX.woodHi
  const cells = Math.ceil(w / P)
  for (let i = 0; i < cells; i += 5) {
    ctx.fillRect(x0 + i * P, y0 + P, P, P)
  }
  pfill(ctx, x0, y0, w, P, PX.woodHi)
  pfill(ctx, x0, y0 + h - P, w, P, PX.woodDk)
}

export function drawRoll(ctx: CanvasRenderingContext2D, cam: Camera, roll: Roll): void {
  crisp(ctx)
  const P = pixelUnit(cam)
  const squash = roll.squash
  const bw = roll.w * squash
  const bh = roll.h / squash
  const bottom = worldToScreen(cam, roll.x, roll.y)
  const cx = snap(bottom.x, P)
  const r = Math.max(P * 4, (bw / 2) * cam.scale)
  const bodyH = Math.max(P * 4, bh * cam.scale)
  const by = snap(bottom.y, P)
  const topCy = snap(bottom.y - bodyH, P)
  const pal = FILLINGS[roll.type]
  const maki = roll.style === 'maki'
  const nori = '#163820'
  const noriHi = '#2f6340'
  const noriLo = '#0c1c12'
  const rice = '#fff4e0'

  ctx.save()
  ctx.globalAlpha *= roll.opacity

  fillDisk(ctx, P, cx + P, by + P, r * 0.92, 'rgba(40, 24, 12, 0.28)')
  fillDisk(ctx, P, cx, by, r, noriLo)
  const bodyTop = Math.min(by, topCy)
  const bodyBot = Math.max(by, topCy)
  pfill(ctx, snap(cx - r, P), bodyTop, Math.max(P, snap(r * 2, P)), Math.max(P, bodyBot - bodyTop), maki ? nori : rice)
  fillDisk(ctx, P, cx, topCy, r, maki ? nori : rice)
  if (maki) {
    fillDisk(ctx, P, cx, topCy, r - P, noriHi)
    fillDisk(ctx, P, cx, topCy, Math.max(P * 2, r * 0.72), rice)
  } else {
    fillDisk(ctx, P, cx, topCy, Math.max(P * 2, r * 0.78), nori)
    fillDisk(ctx, P, cx, topCy, Math.max(P * 2, r * 0.62), rice)
  }
  drawPixelFilling(ctx, P, cx, topCy, r, roll.type, pal)
  pfill(ctx, cx - P * 2, topCy - r + P, P * 2, P, 'rgba(255,255,255,0.35)')

  ctx.restore()
}

function drawPixelFilling(
  ctx: CanvasRenderingContext2D,
  P: number,
  cx: number,
  cy: number,
  r: number,
  type: FillingId,
  pal: (typeof FILLINGS)[FillingId],
): void {
  const fr = Math.max(P * 2, r * 0.38)
  fillDisk(ctx, P, cx, cy, fr, pal.fill)
  if (type === 'salmon' || type === 'tuna' || type === 'unagi') {
    pfill(ctx, snap(cx - P, P), snap(cy - P, P), P * 3, P, pal.fillDark)
    pfill(ctx, snap(cx - P * 2, P), snap(cy, P), P * 5, P, pal.accent)
  } else if (type === 'avocado') {
    fillDisk(ctx, P, cx + P, cy, Math.max(P, fr * 0.35), pal.seed)
  } else if (type === 'cucumber') {
    pfill(ctx, snap(cx - P, P), snap(cy - P, P), P, P, pal.seed)
    pfill(ctx, snap(cx + P, P), snap(cy, P), P, P, pal.seed)
    pfill(ctx, snap(cx, P), snap(cy + P, P), P, P, pal.seed)
  } else {
    pfill(ctx, snap(cx - P, P), snap(cy - P, P), P * 2, P, pal.accent)
    pfill(ctx, snap(cx + P, P), cy, P, P, pal.fillDark)
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
  crisp(ctx)
  const P = pixelUnit(cam)
  const p = worldToScreen(cam, x, y)
  const r = Math.max(P * 3, (w / 2) * cam.scale)
  const color = quality === 'perfect' ? '#ffc938' : quality === 'good' ? '#8fbf3a' : '#ff3b4e'
  const cx = snap(p.x, P)
  const cy = snap(p.y, P)
  const cells = Math.max(8, Math.round((r * 2) / P))
  ctx.fillStyle = color
  ctx.globalAlpha = 0.7
  for (let i = 0; i < cells; i++) {
    if (i % 2 === 1) continue
    const a = (i / cells) * Math.PI * 2
    const gx = snap(cx + Math.cos(a) * r, P)
    const gy = snap(cy + Math.sin(a) * r, P)
    ctx.fillRect(gx, gy, P, P)
  }
  ctx.globalAlpha = 1
}

export function drawCrane(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  trolleyWorldX: number,
  hookWorldY: number,
  attached: boolean,
  t: number,
): void {
  crisp(ctx)
  const P = pixelUnit(cam)
  const hook = worldToScreen(cam, trolleyWorldX, hookWorldY)
  const tx = snap(hook.x, P)
  const sway = snap(Math.sin(t * 1.3) * P, P)
  const boomY = P * 7
  const mastX = P * 2
  const yellow = '#ffc938'
  const yellowDk = '#e09a10'
  const red = '#ff3b4e'
  const redDk = '#d01e36'

  pfill(ctx, mastX, P, P * 3, boomY + P, yellow)
  pfill(ctx, mastX, P, P, boomY + P, yellowDk)
  for (let i = 0; i < 6; i++) pfill(ctx, mastX, P * 2 + i * P * 2, P * 3, P, red)
  pfill(ctx, mastX - P, boomY - P * 4, P * 5, P * 3, red)
  pfill(ctx, mastX + P, boomY - P * 3, P * 2, P * 2, '#b8f0ff')
  pfill(ctx, mastX + P * 2, boomY - P, cam.w - P * 6, P * 2, yellow)
  pfill(ctx, mastX + P * 2, boomY, cam.w - P * 6, P, red)
  pfill(ctx, tx - P * 2 + sway, boomY - P * 2, P * 5, P * 3, red)
  pfill(ctx, tx - P + sway, boomY - P, P * 3, P, yellow)
  pfill(ctx, tx + sway, boomY - P * 2, P, P, redDk)

  const hookY = attached ? snap(hook.y, P) : boomY + P * 8
  pixelLine(ctx, P, tx + sway, boomY + P, tx, hookY, '#5a4a3a')
  pfill(ctx, tx - P * 2, hookY, P * 4, P, red)
  pfill(ctx, tx - P * 2, hookY, P, P * 2, redDk)
  pfill(ctx, tx + P, hookY, P, P * 2, redDk)
  pfill(ctx, tx, hookY, P, P, yellow)
}

export function drawParticles(ctx: CanvasRenderingContext2D, cam: Camera, particles: Particle[]): void {
  crisp(ctx)
  const P = pixelUnit(cam)
  for (const p of particles) {
    const s = worldToScreen(cam, p.x, p.y)
    const a = Math.max(0, p.life / p.maxLife)
    const sz = Math.max(P, snap(p.size, P))
    const x = snap(s.x, P)
    const y = snap(s.y, P)
    ctx.globalAlpha = a
    if (p.kind === 'rice') {
      pfill(ctx, x, y, sz, P, '#fff6e8')
    } else if (p.kind === 'star') {
      pfill(ctx, x, y, P, P, brand.colors.goldLight)
      pfill(ctx, x - P, y, P, P, brand.colors.gold)
      pfill(ctx, x + P, y, P, P, brand.colors.gold)
      pfill(ctx, x, y - P, P, P, brand.colors.gold)
      pfill(ctx, x, y + P, P, P, brand.colors.gold)
    } else if (p.kind === 'spark') {
      pfill(ctx, x, y, sz, sz, brand.colors.goldLight)
    } else {
      pfill(ctx, x, y, sz, sz, brand.colors.wasabi)
    }
    ctx.globalAlpha = 1
  }
}

function pixelFont(px: number): string {
  const s = Math.max(8, Math.round(px / 8) * 8)
  return `${s}px ${brand.font}`
}

export function drawFloatTexts(ctx: CanvasRenderingContext2D, cam: Camera, items: FloatText[]): void {
  crisp(ctx)
  for (const f of items) {
    const p = worldToScreen(cam, f.x, f.y)
    const t = f.age / f.maxAge
    const alpha = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1
    ctx.save()
    ctx.globalAlpha = Math.max(0, alpha)
    ctx.font = pixelFont(16 * f.scale)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#163056'
    ctx.fillText(f.text, Math.round(p.x) + 2, Math.round(p.y - t * 36) + 2)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, Math.round(p.x), Math.round(p.y - t * 36))
    ctx.restore()
  }
}

export function drawWasabiFlash(ctx: CanvasRenderingContext2D, cam: Camera, amount: number): void {
  if (amount <= 0) return
  crisp(ctx)
  const P = pixelUnit(cam)
  ctx.globalAlpha = amount * 0.18
  ctx.fillStyle = brand.colors.goldLight
  const cols = Math.ceil(cam.w / P)
  const rows = Math.ceil(cam.h / P)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (((x + y) & 1) === 0) ctx.fillRect(x * P, y * P, P, P)
    }
  }
  ctx.globalAlpha = 1
}

export function drawVignette(ctx: CanvasRenderingContext2D, cam: Camera): void {
  crisp(ctx)
  const P = pixelUnit(cam)
  ctx.fillStyle = 'rgba(20, 16, 40, 0.35)'
  pfill(ctx, 0, 0, cam.w, P, 'rgba(20,16,40,0.25)')
  pfill(ctx, 0, cam.h - P, cam.w, P, 'rgba(20,16,40,0.25)')
  pfill(ctx, 0, 0, P, cam.h, 'rgba(20,16,40,0.25)')
  pfill(ctx, cam.w - P, 0, P, cam.h, 'rgba(20,16,40,0.25)')
}

export function drawComboBanner(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  text: string,
  age: number,
): void {
  if (age <= 0 || age > 1.05) return
  crisp(ctx)
  const P = pixelUnit(cam)
  const t = age / 1.05
  const alpha = t < 0.12 ? t / 0.12 : t > 0.7 ? (1 - t) / 0.3 : 1
  const y = snap(cam.h * 0.28, P)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = pixelFont(Math.max(16, cam.w * 0.05))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const tw = Math.min(cam.w - P * 4, Math.max(P * 20, ctx.measureText(text).width + P * 6))
  const th = P * 6
  const x = snap(cam.w / 2 - tw / 2, P)
  pfill(ctx, x, y - th / 2, tw, th, '#163056')
  pfill(ctx, x + P, y - th / 2 + P, tw - P * 2, th - P * 2, '#ffc938')
  ctx.fillStyle = '#163056'
  ctx.fillText(text, Math.round(cam.w / 2), y + 1)
  ctx.restore()
}

export function drawTapHint(ctx: CanvasRenderingContext2D, cam: Camera, text: string, age: number): void {
  crisp(ctx)
  const P = pixelUnit(cam)
  const pulse = Math.sin(age * 6) > 0
  const y = snap(cam.h * 0.48, P)
  ctx.font = pixelFont(8)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const tw = Math.min(cam.w - P * 4, ctx.measureText(text).width + P * 6)
  const x = snap(cam.w / 2 - tw / 2, P)
  const th = P * 5
  pfill(ctx, x, y - th / 2, tw, th, '#163056')
  pfill(ctx, x + P, y - th / 2 + P, tw - P * 2, th - P * 2, pulse ? '#fff6e8' : '#ffe27a')
  ctx.fillStyle = '#163056'
  ctx.fillText(text, Math.round(cam.w / 2), y + 1)
}
