import { brand } from './brand'
import { sfxCombo, sfxLand, sfxMiss, sfxPerfect } from './audio'
import { checkAchievements, resetRunUnlocks, tickToasts } from './achievements'
import { consumeTapNudge, input, keyDir } from './input'
import { spawnRice, spawnWasabi, updateParticles } from './particles'
import {
  Camera,
  FILLING_CYCLE,
  drawBackdrop,
  drawBoard,
  drawComboBanner,
  drawGhost,
  drawParticles,
  drawRoll,
  drawVignette,
  drawWasabiFlash,
  screenToWorldX,
  worldToScreen,
} from './render'
import { getBest, setBest } from './storage'
import type { FillingId, Particle, Roll, RollStyle, ScreenId } from './types'

const WORLD_W = 400
const BASE_W = 168
const ROLL_H = 34
const DROP_GAP = 150
const MIN_OVERLAP_RATIO = 0.16
const MIN_OVERLAP_PX = 14
const PERFECT_PX = 5
const PERFECT_RATIO = 0.035

type Phase = 'idle' | 'dropping' | 'settling' | 'failing'

export class Game {
  screen: ScreenId = 'splash'
  tower: Roll[] = []
  falling: Roll[] = []
  current: Roll | null = null
  particles: Particle[] = []
  cameraY = 0
  targetCamY = 0
  shake = 0
  wasabi = 0
  banner = ''
  bannerAge = 0
  score = 0
  best = getBest()
  combo = 0
  maxCombo = 0
  perfects = 0
  perfectStreak = 0
  floors = 0
  multiplier = 1
  initialW = BASE_W
  time = 0
  failTimer = 0
  phase: Phase = 'idle'
  private nextType = 0
  private settleT = 0

  start(): void {
    this.tower = []
    this.falling = []
    this.particles = []
    this.score = 0
    this.combo = 0
    this.maxCombo = 0
    this.perfects = 0
    this.perfectStreak = 0
    this.floors = 0
    this.multiplier = 1
    this.shake = 0
    this.wasabi = 0
    this.banner = ''
    this.bannerAge = 0
    this.failTimer = 0
    this.cameraY = 20
    this.targetCamY = 20
    this.nextType = 0
    this.initialW = BASE_W
    resetRunUnlocks()
    this.tower.push(this.makeRoll(0, 0, BASE_W, this.takeType(), 'maki'))
    this.screen = 'playing'
    this.phase = 'dropping'
    this.spawnCurrent()
  }

  private takeType(): FillingId {
    const t = FILLING_CYCLE[this.nextType % FILLING_CYCLE.length]
    this.nextType++
    return t
  }

  private takeStyle(): RollStyle {
    return this.nextType % 2 === 0 ? 'uramaki' : 'maki'
  }

  private makeRoll(x: number, y: number, w: number, type: FillingId, style: RollStyle): Roll {
    return {
      x,
      y,
      w,
      h: ROLL_H,
      type,
      style,
      squash: 1,
      vx: 0,
      vy: 0,
      rot: 0,
      falling: false,
      opacity: 1,
      isFragment: false,
    }
  }

  private spawnCurrent(): void {
    const prev = this.tower[this.tower.length - 1]
    const side = Math.random() < 0.5 ? -1 : 1
    const offset = (36 + Math.random() * 70) * side
    const startX = this.clampX(prev.x + offset, prev.w)
    this.current = this.makeRoll(
      startX,
      prev.y + prev.h + DROP_GAP,
      prev.w,
      this.takeType(),
      this.takeStyle(),
    )
    this.phase = 'dropping'
  }

  private clampX(x: number, w: number): number {
    const lim = WORLD_W * 0.42 - w / 2
    return Math.max(-lim, Math.min(lim, x))
  }

  private fallSpeed(): number {
    // ~2.1s early, ~0.75s late. 40–70 floors ≈ 45–80s.
    const t = Math.min(this.floors / 55, 1)
    return 72 + t * 128
  }

  update(dt: number, cam: Camera, pointerScreenX: number): void {
    this.time += dt
    tickToasts(dt)
    updateParticles(this.particles, dt)
    this.shake = Math.max(0, this.shake - dt * 18)
    this.wasabi = Math.max(0, this.wasabi - dt * 2.4)
    if (this.bannerAge > 0) this.bannerAge += dt

    this.cameraY += (this.targetCamY - this.cameraY) * Math.min(1, dt * 4.2)

    for (const r of this.falling) {
      r.vy -= 520 * dt
      r.y += r.vy * dt
      r.x += r.vx * dt
      r.rot += r.vx * 0.012 * dt * 60
      r.opacity = Math.max(0, r.opacity - dt * 0.55)
    }
    this.falling = this.falling.filter((r) => r.opacity > 0 && r.y > -80)

    if (this.screen !== 'playing') {
      this.idleDecor(dt)
      return
    }

    if (this.phase === 'settling') {
      this.settleT += dt
      const top = this.tower[this.tower.length - 1]
      top.squash = 1 + Math.sin(Math.min(1, this.settleT / 0.16) * Math.PI) * 0.12
      if (this.settleT >= 0.18) {
        top.squash = 1
        this.spawnCurrent()
      }
      return
    }

    if (this.phase === 'failing') {
      this.failTimer += dt
      if (this.failTimer > 0.95) this.endGame()
      return
    }

    if (this.phase === 'dropping' && this.current) {
      this.steer(dt, cam, pointerScreenX)
      this.current.y -= this.fallSpeed() * dt
      const prev = this.tower[this.tower.length - 1]
      if (this.current.y <= prev.y + prev.h) {
        this.current.y = prev.y + prev.h
        this.tryLand()
      }
    }

    const top = this.tower[this.tower.length - 1]
    this.targetCamY = top.y + top.h * 0.35
  }

  private idleDecor(dt: number): void {
    if (this.tower.length === 0) {
      this.tower.push(this.makeRoll(0, 0, BASE_W, 'salmon', 'maki'))
      this.tower.push(this.makeRoll(-8, ROLL_H, BASE_W * 0.92, 'avocado', 'uramaki'))
      this.tower.push(this.makeRoll(6, ROLL_H * 2, BASE_W * 0.8, 'tuna', 'maki'))
    }
    this.targetCamY = 28
    this.cameraY += (this.targetCamY - this.cameraY) * Math.min(1, dt * 2)
  }

  private steer(dt: number, cam: Camera, pointerScreenX: number): void {
    if (!this.current) return
    const nudge = consumeTapNudge()
    if (nudge) this.current.x += nudge * 22

    if (input.dragging) {
      this.current.x = this.clampX(screenToWorldX(cam, pointerScreenX), this.current.w)
    } else {
      const motion = input.hasMotion ? (input.gamma / 22) * 210 : 0
      const keys = keyDir() * 200
      this.current.x += (motion + keys) * dt
      this.current.x = this.clampX(this.current.x, this.current.w)
    }
  }

  private tryLand(): void {
    const prev = this.tower[this.tower.length - 1]
    const cur = this.current
    if (!cur) return

    const leftA = prev.x - prev.w / 2
    const rightA = prev.x + prev.w / 2
    const leftB = cur.x - cur.w / 2
    const rightB = cur.x + cur.w / 2
    const overlapL = Math.max(leftA, leftB)
    const overlapR = Math.min(rightA, rightB)
    const overlap = overlapR - overlapL
    const minNeed = Math.max(MIN_OVERLAP_PX, prev.w * MIN_OVERLAP_RATIO)

    if (overlap <= minNeed) {
      this.fail(cur, prev)
      return
    }

    const newX = (overlapL + overlapR) / 2
    const newW = overlap
    const dx = cur.x - prev.x
    const perfectCut = Math.max(PERFECT_PX, prev.w * PERFECT_RATIO)
    const perfect = Math.abs(dx) <= perfectCut

    if (!perfect) {
      const fragW = cur.w - newW
      if (fragW > 4) {
        const dir = dx >= 0 ? 1 : -1
        const fragX = dir > 0 ? overlapR + fragW / 2 : overlapL - fragW / 2
        const frag = this.makeRoll(fragX, cur.y, fragW, cur.type, cur.style)
        frag.falling = true
        frag.vx = dir * (70 + Math.random() * 50);
        frag.vy = 40
        this.falling.push(frag)
      }
    }

    cur.x = newX
    cur.w = newW
    cur.squash = 1.16
    this.tower.push(cur)
    this.current = null
    this.floors += 1

    if (perfect) {
      this.combo += 1
      this.perfects += 1
      this.perfectStreak += 1
      this.wasabi = 1
      this.banner = this.combo >= 2 ? `КОМБО ×${this.combo}` : brand.copy.perfect
      this.bannerAge = 0.001
      spawnRice(this.particles, cur.x, cur.y + cur.h, cur.w)
      spawnWasabi(this.particles, cur.x, cur.y + cur.h)
      sfxPerfect()
      if (this.combo >= 2) sfxCombo(this.combo)
      this.haptic(perfect ? 18 : 8)
    } else {
      this.combo = 0
      this.perfectStreak = 0
      this.banner = ''
      sfxLand()
      this.haptic(6)
    }

    this.maxCombo = Math.max(this.maxCombo, this.combo)
    this.multiplier = 1 + Math.min(this.combo, 8) * 0.35
    const areaBonus = Math.round((cur.w / this.initialW) * 50)
    const gained = Math.round((12 + this.floors * 3 + areaBonus) * this.multiplier)
    this.score += gained

    checkAchievements({
      floors: this.floors,
      combo: this.combo,
      perfects: this.perfects,
      perfectStreak: this.perfectStreak,
      score: this.score,
    })

    this.phase = 'settling'
    this.settleT = 0
  }

  private fail(cur: Roll, prev: Roll): void {
    cur.falling = true
    cur.vx = cur.x >= prev.x ? 90 : -90
    cur.vy = 30
    this.falling.push(cur)
    this.current = null
    this.shake = 14
    this.combo = 0
    this.perfectStreak = 0
    this.phase = 'failing'
    this.failTimer = 0
    sfxMiss()
    this.haptic(40)
  }

  private haptic(ms: number): void {
    try {
      if (navigator.vibrate) navigator.vibrate(ms)
    } catch {
      /* ignore */
    }
  }

  private endGame(): void {
    if (this.score > this.best) {
      this.best = this.score
      setBest(this.score)
    }
    this.screen = 'gameover'
    this.phase = 'idle'
  }

  overlapQuality(): 'perfect' | 'good' | 'bad' | null {
    if (!this.current || this.phase !== 'dropping' || this.tower.length === 0) return null
    const prev = this.tower[this.tower.length - 1]
    const cur = this.current
    const leftA = prev.x - prev.w / 2
    const rightA = prev.x + prev.w / 2
    const leftB = cur.x - cur.w / 2
    const rightB = cur.x + cur.w / 2
    const overlap = Math.min(rightA, rightB) - Math.max(leftA, leftB)
    const minNeed = Math.max(MIN_OVERLAP_PX, prev.w * MIN_OVERLAP_RATIO)
    if (overlap <= minNeed) return 'bad'
    const perfectCut = Math.max(PERFECT_PX, prev.w * PERFECT_RATIO)
    if (Math.abs(cur.x - prev.x) <= perfectCut) return 'perfect'
    return 'good'
  }

  draw(ctx: CanvasRenderingContext2D, cam: Camera): void {
    drawBackdrop(ctx, cam, this.time)
    drawBoard(ctx, cam, 220)

    const q = this.overlapQuality()
    if (q && this.current && this.tower.length) {
      const prev = this.tower[this.tower.length - 1]
      drawGhost(ctx, cam, this.current.x, prev.y + prev.h, this.current.w, q)
    }

    for (const r of this.tower) drawRoll(ctx, cam, r)
    if (this.current) drawRoll(ctx, cam, this.current)
    for (const r of this.falling) drawRoll(ctx, cam, r)
    drawParticles(ctx, cam, this.particles)
    drawWasabiFlash(ctx, cam, this.wasabi)
    drawVignette(ctx, cam)
    if (this.screen === 'playing' && this.banner) {
      drawComboBanner(ctx, cam, this.banner, this.bannerAge)
    }
  }

  makeCamera(viewW: number, viewH: number): Camera {
    const scale = Math.min(viewW / WORLD_W, viewH / 720) * 1.05
    const ang = this.time * 28
    return {
      y: this.cameraY,
      shakeX: Math.sin(ang) * this.shake,
      shakeY: Math.cos(ang * 1.3) * this.shake * 0.7,
      scale,
      w: viewW,
      h: viewH,
    }
  }

  worldPointerX(cam: Camera, sx: number): number {
    return screenToWorldX(cam, sx)
  }

  topScreenY(cam: Camera): number {
    const top = this.tower[this.tower.length - 1]
    if (!top) return cam.h * 0.5
    return worldToScreen(cam, 0, top.y + top.h).y
  }
}
