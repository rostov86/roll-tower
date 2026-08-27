/**
 * White-label kit. A delivery service swaps this file to rebrand the game.
 * No other source file should hard-code brand names, slogans or palette tokens.
 */

export const brand = {
  /** Shown in the header, splash, share text and PWA name. */
  name: 'СушиМаркет',
  gameName: 'Башня роллов',
  slogan: 'Собери башню. Съешь заказ.',
  shortSlogan: 'Собери. Съешь.',

  /** Prefix for localStorage keys so two brands can share an origin. */
  storagePrefix: 'sushimarket.rolltower.',

  /** PWA / browser chrome. */
  themeColor: '#12080a',
  backgroundColor: '#12080a',

  colors: {
    primary: '#c41e3a',
    primaryDark: '#8b1428',
    primaryLight: '#e23a54',
    gold: '#d4a017',
    goldLight: '#f0d060',
    goldDim: '#8a6a12',
    ink: '#12080a',
    inkSoft: '#1c1014',
    paper: '#f6efe4',
    paperDim: '#cfc3b0',
    nori: '#14301a',
    rice: '#f3ead8',
    wood: '#6b3f24',
    woodDark: '#3e2416',
    wasabi: '#8fbf3a',
  },

  copy: {
    play: 'Играть',
    again: 'Ещё раз',
    share: 'Поделиться',
    achievements: 'Достижения',
    back: 'Назад',
    score: 'Счёт',
    best: 'Рекорд',
    height: 'Высота',
    floors: 'этажей',
    floorOne: 'этаж',
    floorFew: 'этажа',
    combo: 'комбо',
    perfect: 'Идеально!',
    gameOver: 'Башня упала',
    tiltHint: 'Наклони телефон',
    touchHint: 'Веди пальцем · нажми слева или справа',
    thisRun: 'В этой партии',
    unlocked: 'Новое достижение',
    emptyAchievements: 'Пока пусто — соберите первый ролл.',
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
    perfect: { title: 'Идеальный ролл', desc: 'Идеальное совпадение.' },
    combo5: { title: 'Комбо ×5', desc: 'Пять идеальных подряд.' },
    gourmet: { title: 'Гурман', desc: 'Наберите 3 000 очков за партию.' },
    knifeMaster: { title: 'Мастер ножа', desc: '10 идеальных роллов подряд.' },
  },

  /** Score needed for the "gourmet" achievement. */
  gourmetScore: 3000,
} as const

export type Brand = typeof brand

/** Pushes palette tokens into CSS custom properties used by style.css */
export function applyBrandTheme(): void {
  const s = document.documentElement.style
  const c = brand.colors
  s.setProperty('--bg', c.ink)
  s.setProperty('--paper', c.paper)
  s.setProperty('--paper-dim', c.paperDim)
  s.setProperty('--primary', c.primary)
  s.setProperty('--primary-dark', c.primaryDark)
  s.setProperty('--gold', c.gold)
  s.setProperty('--gold-light', c.goldLight)
  s.setProperty('--ink', c.ink)
}
