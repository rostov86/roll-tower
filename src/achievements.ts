import { brand } from './brand'
import { getUnlocked, saveUnlocked } from './storage'
import { sfxUnlock } from './audio'
import type { AchievementId, Toast } from './types'

export const ACHIEVEMENT_ORDER: AchievementId[] = [
  'firstFloor',
  'floors10',
  'floors25',
  'floors50',
  'perfect',
  'combo5',
  'gourmet',
  'knifeMaster',
]

let unlocked = getUnlocked()
const toasts: Toast[] = []
let toastSeq = 1
const newlyThisRun = new Set<AchievementId>()

export function resetRunUnlocks(): void {
  newlyThisRun.clear()
}

export function getUnlockedSet(): Set<AchievementId> {
  return unlocked
}

export function getRunUnlocks(): AchievementId[] {
  return ACHIEVEMENT_ORDER.filter((id) => newlyThisRun.has(id))
}

export function getToasts(): Toast[] {
  return toasts
}

export function tickToasts(dt: number): void {
  for (const t of toasts) t.age += dt
  for (let i = toasts.length - 1; i >= 0; i--) {
    if (toasts[i].age > 3.2) toasts.splice(i, 1)
  }
}

function unlock(id: AchievementId): void {
  if (unlocked.has(id)) return
  unlocked.add(id)
  newlyThisRun.add(id)
  saveUnlocked(unlocked)
  const meta = brand.achievements[id]
  toasts.push({ id: toastSeq++, title: meta.title, desc: meta.desc, age: 0 })
  sfxUnlock()
}

export function checkAchievements(opts: {
  floors: number
  combo: number
  perfects: number
  perfectStreak: number
  score: number
}): void {
  if (opts.floors >= 1) unlock('firstFloor')
  if (opts.floors >= 10) unlock('floors10')
  if (opts.floors >= 25) unlock('floors25')
  if (opts.floors >= 50) unlock('floors50')
  if (opts.perfects >= 1) unlock('perfect')
  if (opts.combo >= 5) unlock('combo5')
  if (opts.score >= brand.gourmetScore) unlock('gourmet')
  if (opts.perfectStreak >= 10) unlock('knifeMaster')
}
