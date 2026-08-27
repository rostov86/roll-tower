import { brand } from './brand'
import {
  ACHIEVEMENT_ORDER,
  getRunUnlocks,
  getToasts,
  getUnlockedSet,
} from './achievements'
import { sfxUi } from './audio'
import type { AchievementId, ScreenId } from './types'
import { hasSeenDropHint, markDropHintSeen } from './storage'

export interface UiHandlers {
  onPlay: () => void
  onAgain: () => void
  onAchievements: () => void
  onBack: () => void
  onShare: () => void
}

let handlers: UiHandlers
let hintShown = false

export function mountUi(el: HTMLElement, h: UiHandlers): void {
  handlers = h
  el.innerHTML = `
    <div class="panel splash" id="panel-splash" data-ui>
      <div class="brand-mark" aria-hidden="true">
        <img src="./brand/apple-touch-icon.png" width="96" height="96" alt="" />
      </div>
      <div class="eyebrow">${escapeHtml(brand.name)}</div>
      <h1>${escapeHtml(brand.gameName)}</h1>
      <p class="slogan">${escapeHtml(brand.slogan)}</p>
      <div class="demo-badge">${escapeHtml(brand.copy.demoBadge)}</div>
      <p class="demo-note">${escapeHtml(brand.copy.demoNote)}</p>
      <button class="btn primary" id="btn-play" type="button">${escapeHtml(brand.copy.play)}</button>
      <button class="btn ghost" id="btn-ach" type="button">${escapeHtml(brand.copy.achievements)}</button>
      <p class="hint" id="tap-hint">${escapeHtml(brand.copy.tapHint)}</p>
      <p class="hint dim">${escapeHtml(brand.copy.touchHint)}</p>
    </div>

    <div class="hud" id="hud" hidden>
      <div class="hud-left">
        <div class="hud-label">${escapeHtml(brand.copy.score)}</div>
        <div class="hud-value" id="hud-score">0</div>
      </div>
      <div class="hud-center">
        <div class="hud-hearts" id="hud-hearts" aria-label="${escapeHtml(brand.copy.lives)}"></div>
        <div class="hud-combo" id="hud-combo"></div>
        <div class="hud-mult" id="hud-mult"></div>
      </div>
      <div class="hud-right">
        <div class="hud-label">${escapeHtml(brand.copy.height)}</div>
        <div class="hud-value" id="hud-floors">0</div>
      </div>
    </div>

    <div class="panel gameover" id="panel-gameover" hidden data-ui>
      <div class="eyebrow">${escapeHtml(brand.copy.gameOver)}</div>
      <div class="score-big" id="go-score">0</div>
      <div class="meta-row three">
        <div><span>${escapeHtml(brand.copy.best)}</span><strong id="go-best">0</strong></div>
        <div><span>${escapeHtml(brand.copy.height)}</span><strong id="go-floors">0</strong></div>
        <div><span>${escapeHtml(brand.copy.livesUsed)}</span><strong id="go-lives">0</strong></div>
      </div>
      <div class="run-achs" id="go-achs"></div>
      <div class="btn-row">
        <button class="btn primary" id="btn-again" type="button">${escapeHtml(brand.copy.again)}</button>
        <button class="btn gold" id="btn-share" type="button">${escapeHtml(brand.copy.share)}</button>
      </div>
      <button class="btn ghost" id="btn-go-ach" type="button">${escapeHtml(brand.copy.achievements)}</button>
    </div>

    <div class="panel achievements" id="panel-achievements" hidden data-ui data-scroll>
      <div class="eyebrow">${escapeHtml(brand.copy.achievements)}</div>
      <h2>${escapeHtml(brand.gameName)}</h2>
      <ul class="ach-list" id="ach-list"></ul>
      <button class="btn ghost" id="btn-back" type="button">${escapeHtml(brand.copy.back)}</button>
    </div>

    <div class="toasts" id="toasts" data-ui></div>
  `

  byId('btn-play').addEventListener('click', () => {
    sfxUi()
    handlers.onPlay()
  })
  byId('btn-again').addEventListener('click', () => {
    sfxUi()
    handlers.onAgain()
  })
  byId('btn-ach').addEventListener('click', () => {
    sfxUi()
    handlers.onAchievements()
  })
  byId('btn-go-ach').addEventListener('click', () => {
    sfxUi()
    handlers.onAchievements()
  })
  byId('btn-back').addEventListener('click', () => {
    sfxUi()
    handlers.onBack()
  })
  byId('btn-share').addEventListener('click', () => {
    sfxUi()
    handlers.onShare()
  })

  hintShown = !hasSeenDropHint()
}

function byId(id: string): HTMLElement {
  const el = document.getElementById(id)
  if (!el) throw new Error(`missing #${id}`)
  return el
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function setScreen(screen: ScreenId, _from: ScreenId | null = null): void {
  byId('panel-splash').hidden = screen !== 'splash'
  byId('panel-gameover').hidden = screen !== 'gameover'
  byId('panel-achievements').hidden = screen !== 'achievements'
  byId('hud').hidden = screen !== 'playing'

  if (screen === 'achievements') renderAchievements()
  if (screen === 'playing' && hintShown) {
    markDropHintSeen()
    hintShown = false
  }
}

export function updateHud(opts: {
  score: number
  floors: number
  combo: number
  multiplier: number
  lives: number
  maxLives?: number
}): void {
  byId('hud-score').textContent = String(opts.score)
  byId('hud-floors').textContent = String(opts.floors)
  const max = opts.maxLives ?? 3
  const hearts = byId('hud-hearts')
  hearts.innerHTML = Array.from({ length: max }, (_, i) => {
    const on = i < opts.lives
    const c = on ? '#ff3b4e' : '#8aa0b4'
    return `<svg class="heart ${on ? 'on' : 'off'}" viewBox="0 0 24 24" width="22" height="20" aria-hidden="true">
      <path fill="${c}" d="M12 21s-7.2-4.6-9.6-8.6C.4 9.2 1.1 5.2 4.4 3.6 6.8 2.4 9.6 3.1 12 6c2.4-2.9 5.2-3.6 7.6-2.4 3.3 1.6 4 5.6 2 8.8C19.2 16.4 12 21 12 21z"/>
    </svg>`
  }).join('')
  const combo = byId('hud-combo')
  const mult = byId('hud-mult')
  if (opts.combo >= 2) {
    combo.textContent = `×${opts.combo} ${brand.copy.combo}`
    combo.classList.add('hot')
  } else {
    combo.textContent = ''
    combo.classList.remove('hot')
  }
  mult.textContent = opts.multiplier > 1.05 ? `×${opts.multiplier.toFixed(1)}` : ''
}

export function showGameOver(opts: {
  score: number
  best: number
  floors: number
  livesLost: number
}): void {
  byId('go-score').textContent = String(opts.score)
  byId('go-best').textContent = String(opts.best)
  byId('go-floors').textContent = brand.copy.floorsLabel(opts.floors)
  byId('go-lives').textContent = String(opts.livesLost)

  const box = byId('go-achs')
  const run = getRunUnlocks()
  if (run.length === 0) {
    box.innerHTML = ''
  } else {
    box.innerHTML =
      `<div class="run-title">${escapeHtml(brand.copy.thisRun)}</div>` +
      run
        .map((id) => {
          const m = brand.achievements[id]
          return `<div class="chip">🏅 ${escapeHtml(m.title)}</div>`
        })
        .join('')
  }

  const shareBtn = byId('btn-share') as HTMLButtonElement
  shareBtn.hidden = typeof navigator.share !== 'function'
}

function renderAchievements(): void {
  const unlocked = getUnlockedSet()
  const list = byId('ach-list')
  if (ACHIEVEMENT_ORDER.every((id) => !unlocked.has(id))) {
    list.innerHTML = `<li class="empty">${escapeHtml(brand.copy.emptyAchievements)}</li>`
    return
  }
  list.innerHTML = ACHIEVEMENT_ORDER.map((id: AchievementId) => {
    const m = brand.achievements[id]
    const on = unlocked.has(id)
    return `<li class="${on ? 'on' : 'off'}">
      <div class="ach-ico">${on ? '🍣' : '🔒'}</div>
      <div>
        <strong>${escapeHtml(m.title)}</strong>
        <span>${escapeHtml(m.desc)}</span>
      </div>
    </li>`
  }).join('')
}

export function syncToasts(): void {
  const host = byId('toasts')
  const items = getToasts()
  host.innerHTML = items
    .map((t) => {
      const fade = t.age > 2.6 ? 'fade' : ''
      return `<div class="toast ${fade}" data-ui>
        <div class="toast-kicker">${escapeHtml(brand.copy.unlocked)}</div>
        <strong>${escapeHtml(t.title)}</strong>
        <span>${escapeHtml(t.desc)}</span>
      </div>`
    })
    .join('')
}
