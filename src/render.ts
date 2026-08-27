import { brand } from './brand'
import type { FillingId, Particle, Roll, RollStyle } from './types'

const TAU = Math.PI * 2

export interface Camera {
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
  salmon: { fill: '#e85d4c', fillDark: '#c44536', accent: '#f4a698', seed: '#fff6e8' },
  avocado: { fill: '#7a9e3a', fillDark: '#4e6e22', accent: '#c4d96c', seed: '#5a3a18' },
  cucumber: { fill: '#4caf6a', fillDark: '#2e7d4a', accent: '#b7e3c0', seed: '#1e4d2c' },
  unagi: { fill: '#5c3317', fillDark: '#3d220f', accent: '#d4a017', seed: '#f0d060' },
  tuna: { fill: '#b71c2c', fillDark: '#8b1520', accent: '#ef9a9a', seed: '#fff6e8' },
  tamago: { fill: '#e8b83a', fillDark: '#c49214', accent: '#fff3c4', seed: '#8b1428' },
}

export const FILLING_CYCLE: FillingId[] = ['salmon', 'avocado', 'cucumber', 'unagi', 'tuna', 'tamago']

export function worldToScreen(cam: Camera, wx: number, wy: number): { x: number; y: number } {
  return {
    x: cam.w / 2 + wx * cam.scale + cam.shakeX,
    y: cam.h * 0.72 - (wy - cam.y) * cam.scale + cam.shakeY,
  }
}

export function screenToWorldX(cam: Camera, sx: number): number {
  return (sx - cam.w / 2 - cam.shakeX) / cam.scale
}

export function ellipseRy(w: number, scale: number): number {
  return Math.max(5, w * 0.17 * scale)
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, cam: Camera, t: number): void {
  const { w, h } = cam
  const g = ctx.createRadialGradient(w * 0.5, h * 0.78, 20, w * 0.5, h * 0.55, Math.max(w, h) * 0.85)
  g.addColorStop(0, '#2a1218')
  g.addColorStop(0.45, '#16090d')
  g.addColorStop(1, '#070405')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Distant lanterns
  const lanterns = [
    { x: 0.14, y: 0.18, r: 18, a: 0.22 },
    { x: 0.86, y: 0.22, r: 22, a: 0.2 },
    { x: 0.28, y: 0.1, r: 12, a: 0.14 },
    { x: 0.72, y: 0.08, r: 10, a: 0.12 },
    { x: 0.5, y: 0.14, r: 8, a: 0.1 },
  ]
  for (const L of lanterns) {
    const flicker = 0.85 + Math.sin(t * 2.1 + L.x * 8) * 0.15
    const x = L.x * w
    const y = L.y * h
    const glow = ctx.createRadialGradient(x, y, 0, x, y, L.r * 4)
    glow.addColorStop(0, `rgba(212, 160, 23, ${L.a * flicker})`)
    glow.addColorStop(0.4, `rgba(196, 30, 58, ${L.a * 0.25 * flicker})`)
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, L.r * 4, 0, TAU)
    ctx.fill()

    ctx.fillStyle = `rgba(230, 170, 50, ${0.55 * flicker})`
    ctx.beginPath()
    ctx.ellipse(x, y, L.r * 0.45, L.r * 0.7, 0, 0, TAU)
    ctx.fill()
    ctx.strokeStyle = 'rgba(139, 20, 40, 0.5)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Noren-like hanging bands
  ctx.globalAlpha = 0.18
  ctx.fillStyle = brand.colors.primaryDark
  ctx.fillRect(0, 0, w, 28)
  const bands = 7
  const bw = w / bands
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 === 0 ? brand.colors.primary : brand.colors.ink
    ctx.globalAlpha = 0.12
    ctx.fillRect(i * bw + 4, 0, bw - 8, 70 + (i % 3) * 8)
  }
  ctx.globalAlpha = 1

  // Dust motes
  ctx.fillStyle = 'rgba(240, 208, 96, 0.18)'
  for (let i = 0; i < 18; i++) {
    const mx = ((i * 97 + t * 8) % (w + 40)) - 20
    const my = (i * 53 + Math.sin(t * 0.4 + i) * 30) % h
    ctx.beginPath()
    ctx.arc(mx, my, 1 + (i % 3) * 0.4, 0, TAU)
    ctx.fill()
  }
}

export function drawBoard(ctx: CanvasRenderingContext2D, cam: Camera, boardW: number): void {
  const s = cam.scale
  const top = worldToScreen(cam, 0, 0)
  const bw = boardW * s
  const bh = 22 * s
  const rx = bw / 2
  const ry = 16 * s

  ctx.save()
  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.beginPath()
  ctx.ellipse(top.x + 6, top.y + 18, rx * 1.08, ry * 0.85, 0, 0, TAU)
  ctx.fill()

  const wood = ctx.createLinearGradient(top.x - rx, 0, top.x + rx, 0)
  wood.addColorStop(0, '#3a2012')
  wood.addColorStop(0.2, '#7a4a2c')
  wood.addColorStop(0.5, '#8d5734')
  wood.addColorStop(0.8, '#6b3f24')
  wood.addColorStop(1, '#2e180c')

  roundRect(ctx, top.x - rx, top.y - bh * 0.15, bw, bh + ry, 10 * s)
  ctx.fillStyle = wood
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(top.x, top.y + bh * 0.55, rx, ry, 0, 0, TAU)
  ctx.fillStyle = wood
  ctx.fill()

  // Grain
  ctx.strokeStyle = 'rgba(40, 20, 10, 0.28)'
  ctx.lineWidth = 1
  for (let i = 0; i < 9; i++) {
    const gx = top.x - rx * 0.85 + (i / 8) * rx * 1.7
    ctx.beginPath()
    ctx.moveTo(gx, top.y - 4)
    ctx.bezierCurveTo(gx + 4, top.y + bh * 0.4, gx - 3, top.y + bh * 0.7, gx + 2, top.y + bh + ry * 0.3)
    ctx.stroke()
  }

  // Rim highlight
  ctx.strokeStyle = 'rgba(240, 208, 96, 0.18)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.ellipse(top.x, top.y - bh * 0.05, rx * 0.92, 5 * s, 0, Math.PI, 0)
  ctx.stroke()

  ctx.restore()
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

export function drawRoll(ctx: CanvasRenderingContext2D, cam: Camera, roll: Roll): void {
  const s = cam.scale
  const squash = roll.squash
  const w = roll.w * squash
  const h = roll.h / squash
  const bottom = worldToScreen(cam, roll.x, roll.y)
  const topY = bottom.y - h * s
  const cx = bottom.x
  const rx = (w / 2) * s
  const ry = ellipseRy(w, s)

  ctx.save()
  ctx.globalAlpha *= roll.opacity
  ctx.translate(cx, (bottom.y + topY) / 2)
  ctx.rotate(roll.rot)
  ctx.translate(-cx, -(bottom.y + topY) / 2)

  // Contact shadow
  ctx.fillStyle = `rgba(0,0,0,${0.32 * roll.opacity})`
  ctx.beginPath()
  ctx.ellipse(cx + 3, bottom.y + 5, rx * 0.92, ry * 0.55, 0, 0, TAU)
  ctx.fill()

  const pal = FILLINGS[roll.type]
  drawCylinderBody(ctx, cx, topY, bottom.y, rx, ry, roll.style)
  drawRollTop(ctx, cx, topY, rx, ry, roll.style, pal)

  ctx.restore()
}

function drawCylinderBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  botY: number,
  rx: number,
  ry: number,
  style: RollStyle,
): void {
  const left = cx - rx
  const right = cx + rx

  const body = ctx.createLinearGradient(left, 0, right, 0)
  if (style === 'maki') {
    body.addColorStop(0, '#071208')
    body.addColorStop(0.18, '#2a4a2c')
    body.addColorStop(0.42, '#1a3320')
    body.addColorStop(0.7, '#102018')
    body.addColorStop(1, '#050a06')
  } else {
    body.addColorStop(0, '#d9d0be')
    body.addColorStop(0.2, '#f7f1e4')
    body.addColorStop(0.55, '#efe6d4')
    body.addColorStop(1, '#c4b79e')
  }

  ctx.beginPath()
  ctx.moveTo(left, topY)
  ctx.lineTo(left, botY)
  ctx.ellipse(cx, botY, rx, ry, 0, Math.PI, 0, true)
  ctx.lineTo(right, topY)
  ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI, true)
  ctx.closePath()
  ctx.fillStyle = body
  ctx.fill()

  // Bottom cap
  ctx.beginPath()
  ctx.ellipse(cx, botY, rx, ry, 0, 0, TAU)
  ctx.fillStyle = style === 'maki' ? '#0a140c' : '#c8bba4'
  ctx.fill()

  if (style === 'uramaki') {
    // sesame on the side
    ctx.fillStyle = 'rgba(90, 50, 20, 0.45)'
    for (let i = 0; i < 10; i++) {
      const px = left + rx * 0.25 + ((i * 37) % (rx * 1.5))
      const py = topY + 6 + ((i * 19) % Math.max(8, botY - topY - 10))
      ctx.beginPath()
      ctx.ellipse(px, py, 1.2, 0.7, 0.4, 0, TAU)
      ctx.fill()
    }
    // nori belt
    const belt = ctx.createLinearGradient(left, 0, right, 0)
    belt.addColorStop(0, '#0a160c')
    belt.addColorStop(0.3, '#244428')
    belt.addColorStop(1, '#071009')
    ctx.fillStyle = belt
    ctx.fillRect(left + 1, topY + (botY - topY) * 0.35, rx * 2 - 2, Math.max(6, (botY - topY) * 0.28))
  } else {
    // rice peeking at the top rim
    ctx.beginPath()
    ctx.ellipse(cx, topY + 3, rx * 0.96, ry * 0.85, 0, 0, TAU)
    ctx.fillStyle = 'rgba(243, 234, 216, 0.35)'
    ctx.fill()
  }

  // Specular streak
  ctx.strokeStyle = style === 'maki' ? 'rgba(180, 220, 180, 0.18)' : 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - rx * 0.55, topY + 8)
  ctx.lineTo(cx - rx * 0.5, botY - 6)
  ctx.stroke()
}

function drawRollTop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  rx: number,
  ry: number,
  style: RollStyle,
  pal: (typeof FILLINGS)[FillingId],
): void {
  // Outer ring
  ctx.beginPath()
  ctx.ellipse(cx, topY, rx, ry, 0, 0, TAU)
  ctx.fillStyle = style === 'maki' ? '#152616' : '#f4ecdc'
  ctx.fill()

  if (style === 'maki') {
    ctx.beginPath()
    ctx.ellipse(cx, topY, rx * 0.88, ry * 0.84, 0, 0, TAU)
    ctx.fillStyle = '#f3ead8'
    ctx.fill()

    // Rice texture dots
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.2
      ctx.beginPath()
      ctx.ellipse(cx + Math.cos(a) * rx * 0.62, topY + Math.sin(a) * ry * 0.55, 1.4, 0.8, a, 0, TAU)
      ctx.fill()
    }

    drawFilling(ctx, cx, topY, rx * 0.42, ry * 0.42, pal)
  } else {
    // rice outer already; nori ring then filling
    ctx.beginPath()
    ctx.ellipse(cx, topY, rx * 0.72, ry * 0.68, 0, 0, TAU)
    ctx.fillStyle = '#1a301c'
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, topY, rx * 0.58, ry * 0.54, 0, 0, TAU)
    ctx.fillStyle = '#f3ead8'
    ctx.fill()
    drawFilling(ctx, cx, topY, rx * 0.36, ry * 0.36, pal)

    // sesame
    ctx.fillStyle = pal.seed
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU
      ctx.beginPath()
      ctx.ellipse(cx + Math.cos(a) * rx * 0.86, topY + Math.sin(a) * ry * 0.78, 1.3, 0.7, a, 0, TAU)
      ctx.fill()
    }
  }

  // Soft top light
  ctx.beginPath()
  ctx.ellipse(cx - rx * 0.2, topY - ry * 0.25, rx * 0.55, ry * 0.28, -0.4, 0, TAU)
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fill()
}

function drawFilling(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  pal: (typeof FILLINGS)[FillingId],
): void {
  const g = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 1, cx, cy, rx)
  g.addColorStop(0, pal.accent)
  g.addColorStop(0.55, pal.fill)
  g.addColorStop(1, pal.fillDark)
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU)
  ctx.fillStyle = g
  ctx.fill()

  // Inner nori curl / avocado pit suggestion
  ctx.beginPath()
  ctx.ellipse(cx + rx * 0.15, cy, rx * 0.22, ry * 0.45, 0.3, 0, TAU)
  ctx.fillStyle = pal.fillDark
  ctx.globalAlpha *= 0.55
  ctx.fill()
  ctx.globalAlpha /= 0.55
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
  const ry = ellipseRy(w, cam.scale)
  const color =
    quality === 'perfect' ? 'rgba(212, 160, 23, 0.45)' : quality === 'good' ? 'rgba(143, 191, 58, 0.35)' : 'rgba(196, 30, 58, 0.4)'
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU)
  ctx.stroke()
  ctx.fillStyle = color.replace(/0\.\d+\)/, '0.12)')
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
      ctx.fillStyle = '#f7f1e4'
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.7, 0, 0, TAU)
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

export function drawWasabiFlash(ctx: CanvasRenderingContext2D, cam: Camera, amount: number): void {
  if (amount <= 0) return
  ctx.save()
  ctx.globalAlpha = amount * 0.28
  const g = ctx.createRadialGradient(cam.w / 2, cam.h * 0.45, 10, cam.w / 2, cam.h * 0.5, cam.w * 0.7)
  g.addColorStop(0, brand.colors.wasabi)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cam.w, cam.h)
  ctx.restore()
}

export function drawVignette(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const g = ctx.createRadialGradient(cam.w / 2, cam.h * 0.55, cam.h * 0.2, cam.w / 2, cam.h * 0.5, cam.h * 0.85)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cam.w, cam.h)
}

export function drawComboBanner(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  text: string,
  age: number,
): void {
  if (age <= 0 || age > 0.9) return
  const t = age / 0.9
  const alpha = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1
  const y = cam.h * 0.28 - (1 - Math.min(1, t * 3)) * 20
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = `800 ${Math.round(cam.w * 0.07)}px "Manrope", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = brand.colors.goldLight
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 12
  ctx.fillText(text, cam.w / 2, y)
  ctx.restore()
}
