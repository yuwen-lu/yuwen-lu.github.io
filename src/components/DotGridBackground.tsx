import { useEffect, useRef, useCallback } from 'react'

const DOT_SIZE = 2
const GRID_SPACING = 24
const PROXIMITY_RADIUS = 180
const BASE_OPACITY = 0.08
const MAX_OPACITY = 0.5

export const DotGridBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)
  const scrollRef = useRef(0)
  const colorRef = useRef('44, 40, 36')

  const updateColor = useCallback(() => {
    if (typeof window === 'undefined') return
    colorRef.current = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? '232, 226, 216'
      : '44, 40, 36'
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)

    const color = colorRef.current
    const mx = mouseRef.current.x
    const my = mouseRef.current.y

    const scrollY = scrollRef.current
    const scrollOffsetY = scrollY % GRID_SPACING

    const cols = Math.ceil(w / GRID_SPACING) + 1
    const rows = Math.ceil(h / GRID_SPACING) + 2
    const offsetX = (w % GRID_SPACING) / 2

    for (let row = 0; row < rows; row++) {
      const dy = -scrollOffsetY + row * GRID_SPACING
      for (let col = 0; col < cols; col++) {
        const dx = offsetX + col * GRID_SPACING
        const dist = Math.hypot(dx - mx, dy - my)
        const t = Math.max(0, 1 - dist / PROXIMITY_RADIUS)
        const opacity = BASE_OPACITY + (MAX_OPACITY - BASE_OPACITY) * t * t

        ctx.fillStyle = `rgba(${color}, ${opacity})`
        ctx.fillRect(
          Math.round(dx - DOT_SIZE / 2),
          Math.round(dy - DOT_SIZE / 2),
          DOT_SIZE,
          DOT_SIZE
        )
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      updateColor()
      draw()
    }

    const scheduleDraw = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(draw)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      scheduleDraw()
    }

    const onScroll = () => {
      scrollRef.current = window.scrollY
      scheduleDraw()
    }

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
      scheduleDraw()
    }

    const onColorSchemeChange = () => {
      updateColor()
      scheduleDraw()
    }

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    darkModeQuery.addEventListener('change', onColorSchemeChange)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseleave', onMouseLeave)
      darkModeQuery.removeEventListener('change', onColorSchemeChange)
    }
  }, [draw, updateColor])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
