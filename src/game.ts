import { brand } from './brand'
import { sfxCombo, sfxDrop, sfxLand, sfxMiss, sfxPerfect } from './audio'
import { checkAchievements, resetRunUnlocks, tickToasts } from './achievements'
import { consumeDrop, input, keyDir } from './input'
import { spawnMissDust, spawnSparkles, spawnWasabi, updateParticles } from './particles'
import {
  Camera,
  FILLING_CYCLE,
  drawBackdrop,
  drawBoard,
  drawComboBanner,
  drawCrane,
  drawFloatTexts,
  drawGhost,
  drawParticles,
  drawRoll,
  drawTapHint,
  drawVignette,
  drawWasabiFlash,
  worldToScreen,
} from './render'
import { getBest, hasSeenDropHint, setBest } from './storage'
import type { FillingId, FloatText, Particle, Roll, RollStyle, ScreenId } from './types'

const WORLD_W = 400
const BASE_W = 156
const ROLL_H = 38
const HANG_GAP = 132
const MIN_OVERLAP = 0.25
const PERFECT_RATIO = 0.06
const MAX_LIVES = 3
const BOARD_HALF = 128

type Phase = 'swinging' | 'dropping' | 'settling' | 'recovering' | 'failing'

export class Game {
  screen: ScreenId = 'splash'
  tower: Roll[] = []
  falling: Roll[] = []
  current: Roll | null = null
  particles: Particle[] = []
  floaters: FloatText[] = []
  cameraY = 0
  targetCamY = 0
  cameraX = 0
  targetCamX = 0
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
  lives = MAX_LIVES
  livesLost = 0
  time = 0
  failTimer = 0
  phase: Phase = 'swinging'
  hintAge = 0
  showHint = false
  trolleyX = 0
  private nextType = 0
  private settleT = 0
  private swingT = 0
  private pivotX = 0
  private wobble = 0
  private viewW = 400
  private viewH = 720

  start(): void {
    this.tower = []
    this.falling = []
    this.particles = []
    this.floaters = []
    this.score = 0
    this.combo = 0
    this.maxCombo = 0
    this.perfects = 0
    this.perfectStreak = 0
    this.floors = 0
    this.multiplier = 1
    this.lives = MAX_LIVES
    this.livesLost = 0
    this.shake = 0
    this.wasabi = 0
    this.banner = ''
    this.bannerAge = 0
    this.failTimer = 0
    this.cameraY = 24
    this.targetCamY = 24
    this.cameraX = 0
    this.targetCamX = 0
    this.nextType = 0
    this.wobble = 0
    this.hintAge = 0
    this.showHint = !hasSeenDropHint()
    resetRunUnlocks()
    this.screen = 'playing'
    consumeDrop()
    this.spawnCurrent()
    this.followCam()
    this.cameraY = this.targetCamY
    this.cameraX = this.targetCamX
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

  private hangY(): number {
    const prev = this.tower[this.tower.length - 1]
    return prev ? prev.y + prev.h + HANG_GAP : HANG_GAP
  }

  private spawnCurrent(): void {
    const prev = this.tower[this.tower.length - 1]
    const w = prev?.w ?? BASE_W
    this.pivotX = prev?.x ?? 0
    this.current = this.makeRoll(this.pivotX, this.hangY(), w, this.takeType(), this.takeStyle())
    this.phase = 'swinging'
    this.swingT = Math.random() < 0.5 ? 0 : Math.PI
    this.trolleyX = this.current.x
  }

  private swingSpeed(): number {
    const t = Math.min(this.floors / 48, 1)
    return 2.55 + t * 4.5
  }

  private swingAmp(): number {
    const t = Math.min(this.floors / 40, 1)
    return 72 + t * 90
  }

  update(dt: number): void {
    this.time += dt
    tickToasts(dt)
    updateParticles(this.particles, dt)
    this.shake = Math.max(0, this.shake - dt * 18)
    this.wasabi = Math.max(0, this.wasabi - dt * 2.4)
    if (this.bannerAge > 0) this.bannerAge += dt
    if (this.showHint && this.screen === 'playing') this.hintAge += dt

    for (const f of this.floaters) {
      f.age += dt
      f.y += 42 * dt
    }
    this.floaters = this.floaters.filter((f) => f.age < f.maxAge)

    for (const r of this.falling) {
      r.vy -= 560 * dt
      r.y += r.vy * dt
      r.x += r.vx * dt
      r.rot += r.vx * 0.014 * dt * 60
      r.opacity = Math.max(0, r.opacity - dt * 0.5)
    }
    this.falling = this.falling.filter((r) => r.opacity > 0 && r.y > -120)

    if (this.screen !== 'playing') {
      this.idleDecor(dt)
      return
    }

    this.updateLean()
    this.cameraX += (this.targetCamX - this.cameraX) * Math.min(1, dt * 3.4)
    this.cameraY += (this.targetCamY - this.cameraY) * Math.min(1, dt * 4.2)

    if (this.phase === 'settling') {
      consumeDrop()
      this.settleT += dt
      const top = this.tower[this.tower.length - 1]
      top.squash = 1 + Math.sin(Math.min(1, this.settleT / 0.16) * Math.PI) * 0.14
      if (this.settleT >= 0.18) {
        top.squash = 1
        this.spawnCurrent()
      }
      this.followCam()
      return
    }

    if (this.phase === 'recovering') {
      consumeDrop()
      this.failTimer += dt
      if (this.failTimer > 0.55) this.spawnCurrent()
      this.followCam()
      return
    }

    if (this.phase === 'failing') {
      consumeDrop()
      this.failTimer += dt
      if (this.failTimer > 0.9) this.endGame()
      this.followCam()
      return
    }

    if (this.phase === 'swinging' && this.current) {
      this.swingT += this.swingSpeed() * dt
      const amp = this.swingAmp()
      const tilt = input.hasMotion ? clamp(input.gamma * 0.85, -18, 18) : 0
      const keys = keyDir() * 12
      this.current.x = this.pivotX + Math.sin(this.swingT) * amp + tilt + keys
      this.current.y = this.hangY()
      this.current.rot = Math.cos(this.swingT) * 0.1
      this.trolleyX = this.current.x
      if (consumeDrop()) {
        this.phase = 'dropping'
        this.current.vy = 40
        this.current.vx = Math.cos(this.swingT) * amp * this.swingSpeed() * 0.035
        this.current.rot = 0
        this.showHint = false
        sfxDrop()
      }
    } else {
      consumeDrop()
    }

    if (this.phase === 'dropping' && this.current) {
      this.current.vy -= 1550 * dt
      this.current.y += this.current.vy * dt
      this.current.x += this.current.vx * dt
      const prev = this.tower[this.tower.length - 1]
      const targetY = prev ? prev.y + prev.h : 0
      if (this.current.y <= targetY) {
        this.current.y = targetY
        this.tryLand()
      }
    }

    this.followCam()
  }

  private followCam(): void {
    const top = this.tower[this.tower.length - 1]
    const hang =
      this.phase === "swinging" && this.current
        ? this.current.y + this.current.h
        : this.hangY() + ROLL_H
    const scale = Math.min(this.viewW / WORLD_W, this.viewH / 720) * 1.08
    this.targetCamY = hang - (0.6 * this.viewH) / Math.max(0.5, scale)
    this.targetCamX = top ? top.x : 0
  }

  private updateLean(): void {
    if (this.tower.length < 2) {
      this.wobble = 0
      return
    }
    const lean = Math.abs(this.tower[this.tower.length - 1].x - this.tower[0].x)
    this.wobble = lean > 70 ? Math.min(1, (lean - 70) / 90) : 0
  }

  private idleDecor(dt: number): void {
    if (this.tower.length === 0) {
      const types = FILLING_CYCLE
      let y = 0
      let x = 0
      for (let i = 0; i < 5; i++) {
        x += i % 2 === 0 ? -7 : 9
        this.tower.push(this.makeRoll(x, y, BASE_W - i * 2, types[i], i % 2 ? 'uramaki' : 'maki'))
        y += ROLL_H
      }
    }
    if (!this.current) {
      const top = this.tower[this.tower.length - 1]
      this.current = this.makeRoll(top.x, top.y + top.h + HANG_GAP, top.w, 'salmon', 'maki')
      this.swingT = 0
      this.pivotX = top.x
    }
    this.swingT += 1.8 * dt
    this.current.x = this.pivotX + Math.sin(this.swingT) * 70
    this.current.y = this.hangY()
    this.current.rot = Math.cos(this.swingT) * 0.08
    this.trolleyX = this.current.x
    this.targetCamY = 20
    this.targetCamX = 0
    this.cameraY = 20
    this.cameraX = 0
  }

  private tryLand(): void {
    const cur = this.current
    if (!cur) return

    if (this.tower.length === 0) {
      if (Math.abs(cur.x) > BOARD_HALF) {
        this.miss(cur, 0)
        return
      }
      this.plant(cur, Math.abs(cur.x) <= cur.w * PERFECT_RATIO, 1)
      return
    }

    const prev = this.tower[this.tower.length - 1]
    const leftA = prev.x - prev.w / 2
    const rightA = prev.x + prev.w / 2
    const leftB = cur.x - cur.w / 2
    const rightB = cur.x + cur.w / 2
    const overlap = Math.min(rightA, rightB) - Math.max(leftA, leftB)
    const ratio = overlap / cur.w

    if (ratio < MIN_OVERLAP) {
      this.miss(cur, prev.x)
      return
    }

    const offset = cur.x - prev.x
    const perfect = Math.abs(offset) <= cur.w * PERFECT_RATIO
    this.plant(cur, perfect, ratio)
  }

  private plant(cur: Roll, perfect: boolean, overlapRatio: number): void {
    cur.squash = 1.18
    cur.rot = 0
    cur.vx = 0
    cur.vy = 0
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
      spawnSparkles(this.particles, cur.x, cur.y + cur.h, cur.w)
      spawnWasabi(this.particles, cur.x, cur.y + cur.h)
      sfxPerfect()
      if (this.combo >= 2) sfxCombo(this.combo)
      this.haptic(18)
    } else {
      this.combo = 0
      this.perfectStreak = 0
      if (overlapRatio < 0.42) {
        this.banner = brand.copy.barely
        this.bannerAge = 0.001
      } else {
        this.banner = ''
      }
      sfxLand()
      this.haptic(6)
    }

    this.maxCombo = Math.max(this.maxCombo, this.combo)
    this.multiplier = 1 + Math.min(this.combo, 10) * 0.25
    const base = 10 + this.floors * 4
    const perfectBonus = perfect ? 50 + this.combo * 8 : 0
    const gained = Math.round((base + perfectBonus) * (perfect ? this.multiplier : 1))
    this.score += gained
    this.popScore(cur.x, cur.y + cur.h, gained, perfect)

    checkAchievements({
      floors: this.floors,
      combo: this.combo,
      perfects: this.perfects,
      perfectStreak: this.perfectStreak,
      score: this.score,
      lives: this.lives,
    })

    this.phase = 'settling'
    this.settleT = 0
  }

  private miss(cur: Roll, towardX: number): void {
    cur.falling = true
    cur.vx = cur.x >= towardX ? 110 : -110
    cur.vy = 50
    cur.rot = (Math.random() - 0.5) * 0.4
    this.falling.push(cur)
    this.current = null
    this.shake = 16
    this.combo = 0
    this.perfectStreak = 0
    this.multiplier = 1
    this.lives = Math.max(0, this.lives - 1)
    this.livesLost += 1
    spawnMissDust(this.particles, cur.x, cur.y)
    sfxMiss()
    this.haptic(40)
    this.banner = ''
    if (this.lives <= 0) {
      this.phase = 'failing'
      this.failTimer = 0
    } else {
      this.phase = 'recovering'
      this.failTimer = 0
    }
  }

  private popScore(x: number, y: number, amount: number, perfect: boolean): void {
    this.floaters.push({
      x,
      y,
      text: `+${amount}`,
      age: 0,
      maxAge: 0.95,
      color: perfect ? brand.colors.goldLight : '#ffffff',
      scale: perfect ? 1.25 : 1,
    })
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
    this.phase = 'swinging'
  }

  overlapQuality(): 'perfect' | 'good' | 'bad' | null {
    if (!this.current || this.phase !== 'swinging' || this.tower.length === 0) return null
    const prev = this.tower[this.tower.length - 1]
    const cur = this.current
    const leftA = prev.x - prev.w / 2
    const rightA = prev.x + prev.w / 2
    const leftB = cur.x - cur.w / 2
    const rightB = cur.x + cur.w / 2
    const overlap = Math.min(rightA, rightB) - Math.max(leftA, leftB)
    const ratio = overlap / cur.w
    if (ratio < MIN_OVERLAP) return 'bad'
    if (Math.abs(cur.x - prev.x) <= cur.w * PERFECT_RATIO) return 'perfect'
    return 'good'
  }

  draw(ctx: CanvasRenderingContext2D, cam: Camera): void {
    drawBackdrop(ctx, cam, this.time, this.screen === 'playing' ? undefined : 0)
    drawBoard(ctx, cam)

    const q = this.overlapQuality()
    if (q && this.current && this.tower.length) {
      const prev = this.tower[this.tower.length - 1]
      drawGhost(ctx, cam, this.current.x, prev.y + prev.h, this.current.w, q)
    }

    ctx.save()
    if (this.wobble > 0 && this.tower.length) {
      const base = worldToScreen(cam, this.tower[0].x, 0)
      const ang = Math.sin(this.time * 13) * this.wobble * 0.04
      ctx.translate(base.x, base.y)
      ctx.rotate(ang)
      ctx.translate(-base.x, -base.y)
    }
    for (const r of this.tower) drawRoll(ctx, cam, r)
    ctx.restore()

    if (this.current) drawRoll(ctx, cam, this.current)
    for (const r of this.falling) drawRoll(ctx, cam, r)
    drawParticles(ctx, cam, this.particles)
    drawFloatTexts(ctx, cam, this.floaters)

    const attached = this.phase === 'swinging' && !!this.current
    const hookY = this.current ? this.current.y + this.current.h : this.hangY() + ROLL_H
    drawCrane(ctx, cam, this.trolleyX, hookY, attached, this.time)

    drawWasabiFlash(ctx, cam, this.wasabi)
    drawVignette(ctx, cam)
    if (this.screen === 'playing' && this.banner) {
      drawComboBanner(ctx, cam, this.banner, this.bannerAge)
    }
    if (this.screen === 'playing' && this.showHint && this.hintAge < 5) {
      drawTapHint(ctx, cam, brand.copy.tapHint, this.hintAge)
    }
  }

  makeCamera(viewW: number, viewH: number): Camera {
    const scale = Math.min(viewW / WORLD_W, viewH / 720) * 1.08
    const ang = this.time * 28
    const wob = this.wobble * Math.sin(this.time * 14) * 4
    this.viewW = viewW
    this.viewH = viewH
    return {
      x: this.cameraX,
      y: this.cameraY,
      shakeX: Math.sin(ang) * this.shake + wob,
      shakeY: Math.cos(ang * 1.3) * this.shake * 0.7,
      scale,
      w: viewW,
      h: viewH,
    }
  }
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n))
}
