import { brand } from './brand'
import type { AchievementId } from './types'

const k = (name: string) => brand.storagePrefix + name

export function getBest(): number {
  const raw = localStorage.getItem(k('best'))
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

export function setBest(score: number): void {
  localStorage.setItem(k('best'), String(score))
}

export function getUnlocked(): Set<AchievementId> {
  try {
    const raw = localStorage.getItem(k('achievements'))
    const arr = raw ? (JSON.parse(raw) as AchievementId[]) : []
    return new Set(arr)
  } catch {
    return new Set()
  }
}

export function saveUnlocked(ids: Set<AchievementId>): void {
  localStorage.setItem(k('achievements'), JSON.stringify([...ids]))
}

export function hasSeenTiltHint(): boolean {
  return localStorage.getItem(k('tiltHint')) === '1'
}

export function markTiltHintSeen(): void {
  localStorage.setItem(k('tiltHint'), '1')
}
