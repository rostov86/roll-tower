import { brand } from './brand'
import type { FillingId, FloatText, Particle, Roll, RollStyle } from './types'

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

const CITY: { x: number; w: number; h: number; c: string; roof: string }[] = [
  { x: -190, w: 34, h: 72, c: '#ff9eb5', roof: '#ff3b4e' },
  { x: -154, w: 26, h: 108, c: '#7ed0ff', roof: '#1e8fd6' },
  { x: -122, w: 40, h: 64, c: '#ffe27a', roof: '#ff9f2e' },
  { x: -78, w: 22, h: 92, c: '#b8f08a', roof: '#5aa024' },
  { x: -52, w: 48, h: 56, c: '#ffb07a', roof: '#e85d4c' },
  { x: 8, w: 30, h: 120, c: '#c9b6ff', roof: '#7a5ad8' },
  { x: 42, w: 36, h: 70, c: '#7ee7c0', roof: '#2aa87a' },
  { x: 84, w: 28, h: 96, c: '#ff8aa0', roof: '#d01e36' },
  { x: 118, w: 44, h: 60, c: '#fff4c2', roof: '#ffc938' },
  { x: 166, w: 24, h: 84, c: '#8ad4ff', roof: '#4ec6f5' },
  { x: 196, w: 38, h: 52, c: '#f4a6d8', roof: '#e0233a' },
]

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

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ra = (pa >> 16) & 255
  const ga = (pa >> 8) & 255
  const ba = pa & 255
  const rb = (pb >> 16) & 255
  const gb = (pb >> 8) & 255
  const bb = pb & 255
  const r = Math.round(lerp(ra, rb, t))
  const g = Math.round(lerp(ga, gb, t))
  const bl = Math.round(lerp(ba, bb, t))
  return `rgb(${r},${g},${bl})`
}

/** 0 day → dusk → night. Night only after a very tall tower. */
export function altitudeOf(cam: Camera): number {
  return clamp01(Math.max(0, cam.y) / 4200)
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, cam: Camera, t: number, altOverride?: number): void {
  const { w, h } = cam
  const alt = altOverride !== undefined ? clamp01(altOverride) : altitudeOf(cam)
  const dusk = clamp01((alt - 0.55) / 0.25)
  const night = clamp01((alt - 0.78) / 0.22)

  const top = lerpHex(lerpHex('#9befff', '#c9b6ff', dusk), '#0b1638', night)
  const mid = lerpHex(lerpHex('#4ec6f5', '#ff8a6a', dusk), '#1a0a40', night)
  const bot = lerpHex(lerpHex('#b8f06a', '#ff5e8a', dusk), '#12082a', night)

  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, top)
  g.addColorStop(0.45, mid)
  g.addColorStop(1, bot)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  drawSunMoon(ctx, cam, t, dusk, night)
  drawStars(ctx, cam, t, night)
  drawClouds(ctx, cam, t, 1 - night * 0.85)
  drawCity(ctx, cam, t, dusk, night)
}

function drawSunMoon(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  t: number,
  dusk: number,
  night: number,
): void {
  const x = cam.w * 0.82
  const y = cam.h * (0.14 + dusk * 0.08)
  const r = Math.min(cam.w, cam.h) * 0.07
  ctx.save()
  if (night < 0.55) {
    ctx.globalAlpha = 1 - night
    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.2)
    glow.addColorStop(0, `rgba(255, 236, 140, ${0.7 - dusk * 0.3})`)
    glow.addColorStop(1, 'rgba(255, 200, 80, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, r * 3.2, 0, TAU)
    ctx.fill()
    ctx.fillStyle = dusk > 0.4 ? '#ffb36a' : '#ffe566'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath()
    ctx.arc(x - r * 0.22, y - r * 0.22, r * 0.42, 0, TAU)
    ctx.fill()
    const rays = 10
    ctx.strokeStyle = `rgba(255, 230, 90, ${0.35 - dusk * 0.15})`
    ctx.lineWidth = 3
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * TAU + t * 0.15
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25)
      ctx.lineTo(x + Math.cos(a) * r * 1.85, y + Math.sin(a) * r * 1.85)
      ctx.stroke()
    }
  }
  if (night > 0.25) {
    ctx.globalAlpha = clamp01((night - 0.25) / 0.5)
    const mx = cam.w * 0.78
    const my = cam.h * 0.12
    const mr = r * 0.85
    ctx.fillStyle = '#f4f1de'
    ctx.beginPath()
    ctx.arc(mx, my, mr, 0, TAU)
    ctx.fill()
    ctx.fillStyle = 'rgba(180, 190, 210, 0.35)'
    ctx.beginPath()
    ctx.arc(mx + mr * 0.25, my - mr * 0.1, mr * 0.22, 0, TAU)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(mx - mr * 0.3, my + mr * 0.2, mr * 0.14, 0, TAU)
    ctx.fill()
  }
  ctx.restore()
}

function drawStars(ctx: CanvasRenderingContext2D, cam: Camera, t: number, night: number): void {
  if (night <= 0.05) return
  ctx.save()
  ctx.globalAlpha = night
  for (let i = 0; i < 48; i++) {
    const x = ((i * 97) % 400) / 400 * cam.w
    const y = ((i * 53) % 280) / 280 * cam.h * 0.55
    const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.4 + i))
    ctx.fillStyle = `rgba(255,255,255,${tw})`
    ctx.beginPath()
    ctx.arc(x, y, i % 5 === 0 ? 1.8 : 1.1, 0, TAU)
    ctx.fill()
  }
  ctx.restore()
}

function drawClouds(ctx: CanvasRenderingContext2D, cam: Camera, t: number, alpha: number): void {
  if (alpha <= 0.04) return
  ctx.save()
  ctx.globalAlpha = alpha * 0.92
  const parallax = cam.y * 0.04
  for (let i = 0; i < 7; i++) {
    const speed = 8 + i * 3
    const x = ((i * 173 + t * speed) % (cam.w + 220)) - 110
    const y = 40 + ((i * 67) % 160) - parallax * (0.4 + (i % 3) * 0.2)
    puff(ctx, x, y, 28 + (i % 3) * 8, i % 2 === 0 ? '#ffffff' : '#eef9ff')
  }
  ctx.restore()
}

function puff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.arc(x + r * 0.9, y + 4, r * 0.75, 0, TAU)
  ctx.arc(x - r * 0.85, y + 6, r * 0.7, 0, TAU)
  ctx.arc(x + r * 0.15, y - r * 0.45, r * 0.65, 0, TAU)
  ctx.fill()
}

function drawCity(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  t: number,
  dusk: number,
  night: number,
): void {
  const ground = worldToScreen(cam, 0, -6)
  if (ground.y > cam.h + 160) return
  const s = cam.scale

  // distant hills
  ctx.fillStyle = lerpHex(lerpHex('#8ed96a', '#5a8a40', dusk), '#2a1848', night)
  ctx.beginPath()
  ctx.moveTo(-20, ground.y + 40)
  for (let i = 0; i <= 8; i++) {
    const hx = (i / 8) * cam.w
    const hy = ground.y - (18 + (i % 3) * 16) * s - Math.sin(i * 1.4) * 10
    ctx.lineTo(hx, hy)
  }
  ctx.lineTo(cam.w + 20, ground.y + 80)
  ctx.closePath()
  ctx.fill()

  for (const b of CITY) {
    const p = worldToScreen(cam, b.x, 0)
    const bw = b.w * s
    const bh = b.h * s
    const x = p.x - bw / 2
    const y = ground.y - bh + 8
    ctx.fillStyle = night > 0.4 ? shade(b.c, 0.45) : b.c
    roundRect(ctx, x, y, bw, bh, 3)
    ctx.fill()
    ctx.fillStyle = night > 0.4 ? shade(b.roof, 0.55) : b.roof
    ctx.beginPath()
    ctx.moveTo(x - 3, y + 4)
    ctx.lineTo(x + bw / 2, y - 12 * s)
    ctx.lineTo(x + bw + 3, y + 4)
    ctx.closePath()
    ctx.fill()

    const cols = Math.max(2, Math.floor(b.w / 12))
    const rows = Math.max(2, Math.floor(b.h / 16))
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = night > 0.25 && (Math.sin(t * 0.7 + r * 3 + c * 5 + b.x) > 0.15)
        ctx.fillStyle = lit ? '#ffe27a' : 'rgba(255,255,255,0.35)'
        ctx.fillRect(x + 5 + c * (bw - 10) / cols, y + 10 + r * (bh - 16) / rows, 4 * s, 5 * s)
      }
    }
  }

  // sushi shop sign
  const shop = worldToScreen(cam, -52, 0)
  ctx.fillStyle = brand.colors.primary
  ctx.beginPath()
  ctx.arc(shop.x + 4, ground.y - 70 * s, 11 * s, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(shop.x + 4, ground.y - 70 * s, 6 * s, 0, TAU)
  ctx.fill()
}

function shade(hex: string, k: number): string {
  const p = parseInt(hex.slice(1), 16)
  const r = Math.round(((p >> 16) & 255) * k)
  const g = Math.round(((p >> 8) & 255) * k)
  const b = Math.round((p & 255) * k)
  return `rgb(${r},${g},${b})`
}

export function drawBoard(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const s = cam.scale
  const top = worldToScreen(cam, 0, 0)
  const bw = 268 * s
  const bh = 28 * s
  const rx = bw / 2

  ctx.save()
  ctx.fillStyle = 'rgba(40, 60, 30, 0.28)'
  ctx.beginPath()
  ctx.ellipse(top.x, top.y + 26 * s, rx * 1.05, 14 * s, 0, 0, TAU)
  ctx.fill()

  const wood = ctx.createLinearGradient(top.x - rx, 0, top.x + rx, 0)
  wood.addColorStop(0, '#8a4e24')
  wood.addColorStop(0.2, '#e0a05a')
  wood.addColorStop(0.5, '#f0c078')
  wood.addColorStop(0.8, '#c9844a')
  wood.addColorStop(1, '#6b3a18')
  roundRect(ctx, top.x - rx, top.y - 6, bw, bh + 18 * s, 12 * s)
  ctx.fillStyle = wood
  ctx.fill()

  ctx.strokeStyle = 'rgba(90, 40, 16, 0.28)'
  ctx.lineWidth = 1.2
  for (let i = 0; i < 8; i++) {
    const gx = top.x - rx * 0.82 + (i / 7) * rx * 1.64
    ctx.beginPath()
    ctx.moveTo(gx, top.y)
    ctx.bezierCurveTo(gx + 5, top.y + bh * 0.4, gx - 4, top.y + bh * 0.8, gx + 2, top.y + bh + 10)
    ctx.stroke()
  }

  // cutting-board inlay
  ctx.fillStyle = 'rgba(255, 246, 232, 0.18)'
  roundRect(ctx, top.x - rx * 0.62, top.y + 4, bw * 0.62, 10 * s, 4)
  ctx.fill()

  // tiny soy dish
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.ellipse(top.x + rx * 0.72, top.y + 10, 10 * s, 5 * s, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#3a1a10'
  ctx.beginPath()
  ctx.ellipse(top.x + rx * 0.72, top.y + 9, 7 * s, 3 * s, 0, 0, TAU)
  ctx.fill()

  ctx.restore()
}

export function drawRoll(ctx: CanvasRenderingContext2D, cam: Camera, roll: Roll): void {
  const s = cam.scale
  const squash = roll.squash
  const bw = roll.w * squash
  const bh = roll.h / squash
  const bottom = worldToScreen(cam, roll.x, roll.y)
  const topY = bottom.y - bh * s
  const cx = bottom.x
  const left = cx - (bw / 2) * s
  const right = cx + (bw / 2) * s
  const depth = Math.max(11, Math.min(28, bw * 0.17)) * s
  const ix = depth * 0.62
  const iy = depth * 0.48
  const pal = FILLINGS[roll.type]
  const fh = bottom.y - topY

  ctx.save()
  ctx.globalAlpha *= roll.opacity
  const midY = (bottom.y + topY) / 2
  ctx.translate(cx, midY)
  ctx.rotate(roll.rot)
  ctx.translate(-cx, -midY)

  ctx.fillStyle = `rgba(20, 40, 70, ${0.22 * roll.opacity})`
  ctx.beginPath()
  ctx.ellipse(cx + 4, bottom.y + 6, (bw / 2) * s * 0.92, 7 * s, 0, 0, TAU)
  ctx.fill()

  const noriDark = roll.style === 'maki' ? '#0f2416' : '#c4b79e'
  ctx.beginPath()
  ctx.moveTo(right, topY)
  ctx.lineTo(right + ix, topY - iy)
  ctx.lineTo(right + ix, bottom.y - iy)
  ctx.lineTo(right, bottom.y)
  ctx.closePath()
  ctx.fillStyle = noriDark
  ctx.fill()

  const fg = ctx.createLinearGradient(left, 0, right, 0)
  if (roll.style === 'maki') {
    fg.addColorStop(0, '#14261a')
    fg.addColorStop(0.18, '#2f6340')
    fg.addColorStop(0.5, '#1e3d28')
    fg.addColorStop(0.85, '#163022')
    fg.addColorStop(1, '#0c1810')
  } else {
    fg.addColorStop(0, '#d4cbb8')
    fg.addColorStop(0.2, '#fff8ec')
    fg.addColorStop(0.6, '#f3ead8')
    fg.addColorStop(1, '#cfc3ae')
  }
  ctx.fillStyle = fg
  ctx.fillRect(left, topY, right - left, fh)

  const stripeY = topY + fh * 0.34
  const stripeH = fh * 0.32
  const sg = ctx.createLinearGradient(left, 0, right, 0)
  sg.addColorStop(0, pal.fillDark)
  sg.addColorStop(0.35, pal.accent)
  sg.addColorStop(0.55, pal.fill)
  sg.addColorStop(1, pal.fillDark)

  if (roll.style === 'uramaki') {
    ctx.fillStyle = '#1a3320'
    ctx.fillRect(left, topY + fh * 0.28, right - left, fh * 0.44)
    ctx.fillStyle = sg
    ctx.fillRect(left + 4, stripeY, right - left - 8, stripeH * 0.72)
    ctx.fillStyle = 'rgba(90,50,20,0.5)'
    for (let i = 0; i < 12; i++) {
      ctx.beginPath()
      ctx.ellipse(
        left + 8 + ((i * 19) % Math.max(8, right - left - 16)),
        topY + 6 + ((i * 11) % Math.max(8, fh - 12)),
        1.6,
        0.9,
        0.5,
        0,
        TAU,
      )
      ctx.fill()
    }
  } else {
    ctx.fillStyle = 'rgba(243,234,216,0.62)'
    ctx.fillRect(left + 3, topY + fh * 0.12, right - left - 6, fh * 0.16)
    ctx.fillStyle = sg
    ctx.fillRect(left + 2, stripeY, right - left - 4, stripeH)
    ctx.fillStyle = 'rgba(243,234,216,0.5)'
    ctx.fillRect(left + 3, topY + fh * 0.7, right - left - 6, fh * 0.14)
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.16)'
  ctx.lineWidth = 1
  ctx.strokeRect(left + 0.5, topY + 0.5, right - left - 1, fh - 1)

  ctx.strokeStyle = roll.style === 'maki' ? 'rgba(180, 220, 180, 0.22)' : 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(left + (right - left) * 0.18, topY + 6)
  ctx.lineTo(left + (right - left) * 0.2, bottom.y - 6)
  ctx.stroke()

  drawRollTop(ctx, left, right, topY, ix, iy, roll.style, pal)

  ctx.restore()
}

function drawRollTop(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  topY: number,
  ix: number,
  iy: number,
  style: RollStyle,
  pal: (typeof FILLINGS)[FillingId],
): void {
  ctx.beginPath()
  ctx.moveTo(left, topY)
  ctx.lineTo(right, topY)
  ctx.lineTo(right + ix, topY - iy)
  ctx.lineTo(left + ix, topY - iy)
  ctx.closePath()
  ctx.fillStyle = style === 'maki' ? '#244a30' : '#f7f1e4'
  ctx.fill()

  const inset = 5
  ctx.beginPath()
  ctx.moveTo(left + inset, topY - 1)
  ctx.lineTo(right - inset, topY - 1)
  ctx.lineTo(right + ix - inset, topY - iy + 2)
  ctx.lineTo(left + ix + inset, topY - iy + 2)
  ctx.closePath()
  ctx.fillStyle = '#fff4e4'
  ctx.fill()

  const mx = (left + right) / 2
  ctx.beginPath()
  ctx.moveTo(mx - 9, topY)
  ctx.lineTo(mx + 9, topY)
  ctx.lineTo(mx + 9 + ix * 0.12, topY - iy + 3)
  ctx.lineTo(mx - 9 + ix * 0.12, topY - iy + 3)
  ctx.closePath()
  ctx.fillStyle = pal.fill
  ctx.fill()
  ctx.fillStyle = pal.fillDark
  ctx.globalAlpha *= 0.45
  ctx.beginPath()
  ctx.moveTo(mx - 3, topY)
  ctx.lineTo(mx + 3, topY)
  ctx.lineTo(mx + 3 + ix * 0.12, topY - iy + 3)
  ctx.lineTo(mx - 3 + ix * 0.12, topY - iy + 3)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha /= 0.45

  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(left + 8, topY - 2)
  ctx.lineTo(left + ix + 6, topY - iy + 3)
  ctx.stroke()
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
  const hw = (w / 2) * cam.scale
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
  ctx.strokeRect(p.x - hw, p.y - 4, hw * 2, 8)
  ctx.fillStyle = color.replace(/0\.\d+\)/, '0.12)')
  ctx.fillRect(p.x - hw, p.y - 4, hw * 2, 8)
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
  const g = ctx.createRadialGradient(cam.w / 2, cam.h * 0.5, cam.h * 0.25, cam.w / 2, cam.h * 0.5, cam.h * 0.9)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(30, 120, 180, 0.08)')
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
