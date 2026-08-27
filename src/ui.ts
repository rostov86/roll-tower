import { brand } from './brand'
import {
  ACHIEVEMENT_ORDER,
  getRunUnlocks,
  getToasts,
  getUnlockedSet,
} from './achievements'
import { sfxUi } from './audio'
import type { AchievementId, ScreenId } from './types'
import { hasSeenTiltHint, markTiltHintSeen } from './storage'

export interface UiHandlers {
  onPlay: () => void
  onAgain: () => void
  onAchievements: () => void
  onBack: () => void
  onShare: () => void
}

let root: HTMLElement
let handlers: UiHandlers
let tiltShown = false

export function mountUi(el: HTMLElement, h: UiHandlers): void {
  root = el
  handlers = h
  root.innerHTML = `
    <div class="panel splash" id="panel-splash" data-ui>
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" width="88" height="88">
          <defs>
            <radialGradient id="g1" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#f0d060"/>
              <stop offset="55%" stop-color="#c41e3a"/>
              <stop offset="100%" stop-color="#8b1428"/>
            </radialGradient>
          </defs>
          <circle cx="48" cy="48" r="44" fill="url(#g1)"/>
          <ellipse cx="48" cy="48" rx="30" ry="30" fill="#14301a"/>
          <ellipse cx="48" cy="48" rx="22" ry="22" fill="#f3ead8"/>
          <ellipse cx="48" cy="48" rx="12" ry="12" fill="#e85d4c"/>
          <ellipse cx="48" cy="48" rx="4" ry="7" fill="#c44536" transform="rotate(20 48 48)"/>
        </svg>
      </div>
      <div class="eyebrow">${escapeHtml(brand.name)}</div>
      <h1>${escapeHtml(brand.gameName)}</h1>
      <p class="slogan">${escapeHtml(brand.slogan)}</p>
      <button class="btn primary" id="btn-play" type="button">${escapeHtml(brand.copy.play)}</button>
      <button class="btn ghost" id="btn-ach" type="button">${escapeHtml(brand.copy.achievements)}</button>
      <p class="hint" id="tilt-hint" hidden>${escapeHtml(brand.copy.tiltHint)}</p>
      <p class="hint dim">${escapeHtml(brand.copy.touchHint)}</p>
    </div>

    <div class="hud" id="hud" hidden data-ui>
      <div class="hud-left">
        <div class="hud-label">${escapeHtml(brand.copy.score)}</div>
        <div class="hud-value" id="hud-score">0</div>
      </div>
      <div class="hud-center">
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
      <div class="meta-row">
        <div><span>${escapeHtml(brand.copy.best)}</span><strong id="go-best">0</strong></div>
        <div><span>${escapeHtml(brand.copy.height)}</span><strong id="go-floors">0</strong></div>
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

  if (!hasSeenTiltHint()) {
    const hint = byId('tilt-hint')
    hint.hidden = false
    tiltShown = true
  }
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
  if (screen === 'playing' && tiltShown) {
    markTiltHintSeen()
    tiltShown = false
    byId('tilt-hint').hidden = true
  }
}

export function updateHud(opts: {
  score: number
  floors: number
  combo: number
  multiplier: number
}): void {
  byId('hud-score').textContent = String(opts.score)
  byId('hud-floors').textContent = String(opts.floors)
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
}): void {
  byId('go-score').textContent = String(opts.score)
  byId('go-best').textContent = String(opts.best)
  byId('go-floors').textContent = brand.copy.floorsLabel(opts.floors)

  const box = byId('go-achs')
  const run = getRunUnlocks()
  if (run.length === 0) {
    box.innerHTML = ''
    return
  }
  box.innerHTML =
    `<div class="run-title">${escapeHtml(brand.copy.thisRun)}</div>` +
    run
      .map((id) => {
        const m = brand.achievements[id]
        return `<div class="chip">🏅 ${escapeHtml(m.title)}</div>`
      })
      .join('')

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
