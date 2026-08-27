export interface InputState {
  keys: { left: boolean; right: boolean }
  pointerDown: boolean
  pointerX: number
  pointerY: number
  dropQueued: boolean
  gamma: number
  hasMotion: boolean
  motionPermission: 'unknown' | 'granted' | 'denied' | 'unsupported'
}

export const input: InputState = {
  keys: { left: false, right: false },
  pointerDown: false,
  pointerX: 0,
  pointerY: 0,
  dropQueued: false,
  gamma: 0,
  hasMotion: false,
  motionPermission: 'unknown',
}

function onKey(e: KeyboardEvent, down: boolean): void {
  if (e.repeat) return
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    input.keys.left = down
    e.preventDefault()
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    input.keys.right = down
    e.preventDefault()
  }
  if (down && (e.code === 'Space' || e.code === 'Enter')) {
    input.dropQueued = true
    e.preventDefault()
  }
}

function isUiTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && !!target.closest('[data-ui]')
}

export function bindInput(canvas: HTMLCanvasElement): void {
  window.addEventListener('keydown', (e) => onKey(e, true), { passive: false })
  window.addEventListener('keyup', (e) => onKey(e, false))

  const down = (e: PointerEvent) => {
    if (isUiTarget(e.target)) return
    input.pointerDown = true
    input.pointerX = e.clientX
    input.pointerY = e.clientY
    input.dropQueued = true
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const move = (e: PointerEvent) => {
    input.pointerX = e.clientX
    input.pointerY = e.clientY
  }

  const up = () => {
    input.pointerDown = false
  }

  canvas.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)

  window.addEventListener('deviceorientation', (e: DeviceOrientationEvent) => {
    if (typeof e.gamma === 'number' && Number.isFinite(e.gamma)) {
      input.gamma = e.gamma
      input.hasMotion = true
    }
  })

  document.addEventListener('gesturestart', (e) => e.preventDefault())
  document.addEventListener(
    'touchmove',
    (e) => {
      if ((e.target as HTMLElement).closest('[data-scroll]')) return
      e.preventDefault()
    },
    { passive: false },
  )
}

export async function requestMotionPermission(): Promise<void> {
  const DOE = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<string>
  }
  if (typeof DOE.requestPermission === 'function') {
    try {
      const res = await DOE.requestPermission()
      input.motionPermission = res === 'granted' ? 'granted' : 'denied'
    } catch {
      input.motionPermission = 'denied'
    }
  } else {
    input.motionPermission = 'unsupported'
  }
}

export function consumeDrop(): boolean {
  const d = input.dropQueued
  input.dropQueued = false
  return d
}

export function keyDir(): number {
  return (input.keys.right ? 1 : 0) - (input.keys.left ? 1 : 0)
}
