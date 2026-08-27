import { applyBrandTheme, brand } from './brand'
import { enableAudio } from './audio'
import { Game } from './game'
import { bindInput, input, requestMotionPermission } from './input'
import { mountUi, setScreen, showGameOver, syncToasts, updateHud } from './ui'
import './style.css'

applyBrandTheme()

const canvas = document.getElementById('game') as HTMLCanvasElement
const uiRoot = document.getElementById('ui') as HTMLElement
const ctx = canvas.getContext('2d', { alpha: false })
if (!ctx) throw new Error('Canvas 2D unavailable')

const game = new Game()
let lastScreen = game.screen
let last = performance.now()
let dpr = 1

function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, 2.5)
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
}

bindInput(canvas)
mountUi(uiRoot, {
  onPlay: () => void startGame(),
  onAgain: () => void startGame(),
  onAchievements: () => {
    lastScreen = game.screen
    game.screen = 'achievements'
    setScreen('achievements', lastScreen)
  },
  onBack: () => {
    game.screen = lastScreen === 'achievements' ? 'splash' : lastScreen
    if (game.screen === 'playing') game.screen = 'gameover'
    setScreen(game.screen)
  },
  onShare: () => void shareScore(),
})

setScreen('splash')
resize()
window.addEventListener('resize', resize)
window.addEventListener('orientationchange', () => setTimeout(resize, 120))

async function startGame(): Promise<void> {
  enableAudio()
  await requestMotionPermission()
  game.start()
  setScreen('playing')
}

async function shareScore(): Promise<void> {
  const text = brand.copy.shareText(game.score, game.floors, brand.name, brand.gameName)
  try {
    if (navigator.share) {
      await navigator.share({ title: brand.gameName, text, url: location.href })
    }
  } catch {
    /* user cancelled */
  }
}

function frame(now: number): void {
  const dt = Math.min(0.033, (now - last) / 1000)
  last = now

  const viewW = window.innerWidth
  const viewH = window.innerHeight
  const cam = game.makeCamera(viewW, viewH)
  game.update(dt, cam, input.pointerX)
  game.draw(ctx!, cam)

  if (game.screen === 'playing') {
    updateHud({
      score: game.score,
      floors: game.floors,
      combo: game.combo,
      multiplier: game.multiplier,
    })
  }

  if (game.screen === 'gameover' && lastScreen !== 'gameover') {
    showGameOver({ score: game.score, best: game.best, floors: game.floors })
    setScreen('gameover')
  }
  lastScreen = game.screen === 'achievements' ? lastScreen : game.screen

  syncToasts()
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)

// Register service worker for offline PWA.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js').catch(() => {
      /* preview may lack sw */
    })
  })
}

document.title = `${brand.gameName} — ${brand.name}`
const theme = document.querySelector('meta[name="theme-color"]')
if (theme) theme.setAttribute('content', brand.themeColor)
