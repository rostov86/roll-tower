export interface InputState {
  keys: { left: boolean; right: boolean }
  pointerDown: boolean
  dragging: boolean
  pointerX: number
  pointerY: number
  tapNudge: number
  gamma: number
  hasMotion: boolean
  motionPermission: 'unknown' | 'granted' | 'denied' | 'unsupported'
}

const TAP_MOVE_PX = 12

export const input: InputState = {
  keys: { left: false, right: false },
  pointerDown: false,
  dragging: false,
  pointerX: 0,
  pointerY: 0,
  tapNudge: 0,
  gamma: 0,
  hasMotion: false,
  motionPermission: 'unknown',
}

let startX = 0
let startY = 0
let moved = false

function onKey(e: KeyboardEvent, down: boolean): void {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    input.keys.left = down
    e.preventDefault()
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    input.keys.right = down
    e.preventDefault()
  }
}

export function bindInput(canvas: HTMLCanvasElement): void {
  window.addEventListener('keydown', (e) => onKey(e, true), { passive: false })
  window.addEventListener('keyup', (e) => onKey(e, false))

  const down = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-ui]')) return
    input.pointerDown = true
    input.dragging = false
    moved = false
    startX = e.clientX
    startY = e.clientY
    input.pointerX = e.clientX
    input.pointerY = e.clientY
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const move = (e: PointerEvent) => {
    if (!input.pointerDown) return
    input.pointerX = e.clientX
    input.pointerY = e.clientY
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.hypot(dx, dy) > TAP_MOVE_PX) {
      moved = true
      input.dragging = true
    }
  }

  const up = (e: PointerEvent) => {
    if (!input.pointerDown) return
    input.pointerDown = false
    input.dragging = false
    if (!moved) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      input.tapNudge = x < rect.width / 2 ? -1 : 1
    }
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

  // Prevent pinch-zoom / rubber-band on iOS Safari.
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

export function consumeTapNudge(): number {
  const n = input.tapNudge
  input.tapNudge = 0
  return n
}

export function keyDir(): number {
  return (input.keys.right ? 1 : 0) - (input.keys.left ? 1 : 0)
}
