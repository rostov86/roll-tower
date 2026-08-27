import type { Particle } from './types'

export function spawnRice(particles: Particle[], x: number, y: number, w: number): void {
  const n = 12 + Math.floor(Math.random() * 8)
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 40 + Math.random() * 90
    particles.push({
      x: x + (Math.random() - 0.5) * w * 0.6,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.4 + 40 + Math.random() * 50,
      life: 0.45 + Math.random() * 0.4,
      maxLife: 0.7,
      size: 2 + Math.random() * 2.4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 8,
      kind: 'rice',
    })
  }
}

export function spawnSparkles(particles: Particle[], x: number, y: number, w: number): void {
  spawnRice(particles, x, y, w)
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + Math.random() * 0.25
    const sp = 90 + Math.random() * 150
    particles.push({
      x: x + (Math.random() - 0.5) * w * 0.35,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.7 + 70,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.8,
      size: 3.5 + Math.random() * 4.5,
      rot: a,
      vr: (Math.random() - 0.5) * 12,
      kind: 'star',
    })
  }
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * w * 0.5,
      y,
      vx: (Math.random() - 0.5) * 70,
      vy: 40 + Math.random() * 90,
      life: 0.3 + Math.random() * 0.3,
      maxLife: 0.55,
      size: 3 + Math.random() * 5,
      rot: 0,
      vr: 0,
      kind: 'spark',
    })
  }
}

export function spawnWasabi(particles: Particle[], x: number, y: number): void {
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
    particles.push({
      x,
      y,
      vx: Math.cos(a) * (20 + Math.random() * 40),
      vy: Math.sin(a) * (30 + Math.random() * 50) + 20,
      life: 0.35 + Math.random() * 0.2,
      maxLife: 0.5,
      size: 6 + Math.random() * 8,
      rot: 0,
      vr: 0,
      kind: 'wasabi',
    })
  }
}

export function spawnMissDust(particles: Particle[], x: number, y: number): void {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2
    particles.push({
      x,
      y,
      vx: Math.cos(a) * (30 + Math.random() * 50),
      vy: 20 + Math.random() * 40,
      life: 0.3 + Math.random() * 0.25,
      maxLife: 0.5,
      size: 2 + Math.random() * 3,
      rot: 0,
      vr: 0,
      kind: 'spark',
    })
  }
}

export function updateParticles(particles: Particle[], dt: number): void {
  const g = 220
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.vy -= g * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.vr * dt
    p.life -= dt
    if (p.life <= 0) particles.splice(i, 1)
  }
}
