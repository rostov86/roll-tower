/**
 * White-label kit. A delivery service swaps this file to rebrand the game.
 * No other source file should hard-code brand names, slogans or palette tokens.
 */

export const brand = {
  /** Shown in the header, splash, share text and PWA name. */
  name: 'Sushi Market YOKO',
  gameName: 'Башня роллов',
  slogan: 'Пока ждёшь заказ — тапай и строй башню.',
  shortSlogan: 'Тапни и строй.',

  /** Prefix for localStorage keys so two brands can share an origin. */
  storagePrefix: 'sushimarket-club.rolltower.',

  /** PWA / browser chrome. */
  themeColor: '#E31F24',
  backgroundColor: '#7ee7ff',

  /** Canvas / HUD type. */
  font: '"Nunito", "Manrope", system-ui, sans-serif',

  colors: {
    primary: '#E31F24',
    primaryDark: '#b01518',
    primaryLight: '#ff5a5f',
    gold: '#ffc938',
    goldLight: '#ffe27a',
    goldDim: '#e09a10',
    ink: '#163056',
    inkSoft: '#2a4a78',
    paper: '#ffffff',
    paperDim: '#d5ecf8',
    nori: '#1b3a22',
    rice: '#fff6e8',
    wood: '#c9844a',
    woodDark: '#8a4e24',
    wasabi: '#8fbf3a',
    sky: '#4ec6f5',
    skyDeep: '#1e8fd6',
    skyHi: '#b8f0ff',
  },

  copy: {
    demoBadge: 'ДЕМО',
    demoNote: 'Не для посадки на столы · Александр Ростов',
    wallWatermark: 'Это демо-игра · автор Александр Ростов',
    play: 'Играть',
    again: 'Ещё раз',
    share: 'Поделиться',
    achievements: 'Достижения',
    back: 'Назад',
    score: 'Счёт',
    best: 'Рекорд',
    height: 'Этажи',
    floors: 'этажей',
    floorOne: 'этаж',
    floorFew: 'этажа',
    combo: 'комбо',
    perfect: 'ИДЕАЛЬНО!',
    barely: 'ЕЛЕ-ЕЛЕ',
    gameOver: 'Жизни кончились',
    tapHint: 'Тапни, когда ролл над башней',
    touchHint: 'Тап или Пробел — ролл падает',
    thisRun: 'В этой партии',
    unlocked: 'Новое достижение',
    emptyAchievements: 'Пока пусто — поставьте первый ролл.',
    lives: 'Жизни',
    livesUsed: 'Потеряно',
    shareText: (score: number, floors: number, name: string, game: string) =>
      `${name}: ${score} очков, ${floors} эт. в игре «${game}»!`,
    floorsLabel: (n: number) => {
      const mod10 = n % 10
      const mod100 = n % 100
      if (mod10 === 1 && mod100 !== 11) return `${n} этаж`
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} этажа`
      return `${n} этажей`
    },
  },

  achievements: {
    firstFloor: { title: 'Первый этаж', desc: 'Поставьте первый ролл.' },
    floors10: { title: '10 этажей', desc: 'Соберите башню в 10 роллов.' },
    floors25: { title: '25 этажей', desc: 'Четверть сотни — уже ресторан.' },
    floors50: { title: '50 этажей', desc: 'Небоскрёб из роллов.' },
    perfect: { title: 'Идеальный ролл', desc: 'Точно в центр — вспышка и бонус.' },
    combo5: { title: 'Комбо ×5', desc: 'Пять идеалов подряд.' },
    gourmet: { title: 'Гурман', desc: 'Наберите 3 000 очков за партию.' },
    knifeMaster: { title: 'Мастер ножа', desc: '10 идеальных роллов подряд.' },
    survivor: { title: 'Три жизни', desc: 'Дойдите до 20 этажей, не потеряв ни одной жизни.' },
  },

  /** Score needed for the "gourmet" achievement. */
  gourmetScore: 3000,
} as const

export type Brand = typeof brand

/** Pushes palette tokens into CSS custom properties used by style.css */
export function applyBrandTheme(): void {
  const s = document.documentElement.style
  const c = brand.colors
  s.setProperty('--font', brand.font)
  s.setProperty('--bg', c.sky)
  s.setProperty('--paper', c.paper)
  s.setProperty('--paper-dim', c.paperDim)
  s.setProperty('--primary', c.primary)
  s.setProperty('--primary-dark', c.primaryDark)
  s.setProperty('--primary-light', c.primaryLight)
  s.setProperty('--gold', c.gold)
  s.setProperty('--gold-light', c.goldLight)
  s.setProperty('--ink', c.ink)
  s.setProperty('--ink-soft', c.inkSoft)
  s.setProperty('--sky', c.sky)
  s.setProperty('--sky-deep', c.skyDeep)
  s.setProperty('--sky-hi', c.skyHi)
}
