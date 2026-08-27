export type ScreenId = 'splash' | 'playing' | 'gameover' | 'achievements'

export type FillingId = 'salmon' | 'avocado' | 'cucumber' | 'unagi' | 'tuna' | 'tamago'

export type RollStyle = 'maki' | 'uramaki'

export interface Roll {
  x: number
  y: number
  w: number
  h: number
  type: FillingId
  style: RollStyle
  squash: number
  vx: number
  vy: number
  rot: number
  falling: boolean
  opacity: number
  isFragment: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  rot: number
  vr: number
  kind: 'rice' | 'spark' | 'wasabi'
}

export interface Toast {
  id: number
  title: string
  desc: string
  age: number
}

export type AchievementId =
  | 'firstFloor'
  | 'floors10'
  | 'floors25'
  | 'floors50'
  | 'perfect'
  | 'combo5'
  | 'gourmet'
  | 'knifeMaster'

export interface GameStats {
  score: number
  best: number
  floors: number
  combo: number
  maxCombo: number
  perfects: number
  multiplier: number
}
