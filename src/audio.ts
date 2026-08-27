let ctx: AudioContext | null = null
let enabled = false

export function enableAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
  }
  void ctx.resume()
  enabled = true
}

function now(): number {
  return ctx?.currentTime ?? 0
}

function tone(
  freq: number,
  dur: number,
  gain = 0.08,
  type: OscillatorType = 'sine',
  freqEnd?: number,
): void {
  if (!enabled || !ctx) return
  const t = now()
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export function sfxDrop(): void {
  tone(420, 0.12, 0.045, 'sine', 180)
  tone(180, 0.1, 0.03, 'triangle', 90)
}

export function sfxLand(): void {
  tone(160, 0.1, 0.08, 'triangle')
  tone(90, 0.14, 0.05, 'sine')
}

export function sfxPerfect(): void {
  tone(660, 0.12, 0.08, 'sine')
  tone(990, 0.16, 0.05, 'triangle')
  tone(1320, 0.22, 0.035, 'sine')
}

export function sfxCombo(n: number): void {
  const base = 520 + Math.min(n, 8) * 60
  tone(base, 0.1, 0.07, 'triangle')
  tone(base * 1.5, 0.16, 0.045, 'sine')
}

export function sfxMiss(): void {
  tone(220, 0.28, 0.09, 'sawtooth', 70)
  tone(110, 0.32, 0.07, 'sine', 55)
}

export function sfxUi(): void {
  tone(480, 0.06, 0.045, 'sine')
  tone(720, 0.08, 0.035, 'triangle')
}

export function sfxUnlock(): void {
  tone(523, 0.12, 0.05, 'sine')
  tone(659, 0.16, 0.05, 'sine')
  tone(784, 0.22, 0.05, 'triangle')
}
