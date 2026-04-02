import { useState, useEffect, useRef } from 'react'
import { useMediaQuery } from 'react-responsive'
import ProfilePic from '../resources/images/me.png'
import { AcrylicDisc } from './AcrylicDisc'

/**
 * Isolated from Home so document mousemove + WebGL disc updates do not re-render
 * the full publications list (major scroll/jank source).
 */
export const ProfileInteractive = () => {
  const isDesktop = useMediaQuery({ query: '(min-width: 769px)' })
  /** Touch / coarse-pointer devices: skip tilt + drag (no mouse parallax). */
  const disablePerspective = useMediaQuery({ query: '(pointer: coarse)' })
  const [perspectiveRotation, setPerspectiveRotation] = useState({ x: 0, y: 0 })
  const [dragRotation, setDragRotation] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const rafRef = useRef<number | null>(null)
  const pendingPerspective = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (disablePerspective) {
      setPerspectiveRotation({ x: 0, y: 0 })
      setDragRotation({ x: 0, y: 0 })
      return
    }

    const handleGlobalMouseMove = (event: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const mouseX = event.clientX - centerX
      const mouseY = event.clientY - centerY
      const rotateY = (mouseX / (window.innerWidth / 2)) * 20
      const rotateX = -(mouseY / (window.innerHeight / 2)) * 20
      pendingPerspective.current = { x: rotateX, y: rotateY }
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          setPerspectiveRotation(pendingPerspective.current)
        })
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [disablePerspective])

  const handleMouseDown = (event: React.MouseEvent) => {
    if (disablePerspective) return
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
    event.preventDefault()
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (disablePerspective || !isDragging) return

    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y

    const newRotateX = dragRotation.x - deltaY * 0.6
    const newRotateY = dragRotation.y + deltaX * 0.6
    const clampedRotateX = Math.max(-75, Math.min(75, newRotateX))
    const clampedRotateY = Math.max(-90, Math.min(90, newRotateY))

    setDragRotation({ x: clampedRotateX, y: clampedRotateY })
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const combinedRotation = disablePerspective
    ? { x: 0, y: 0 }
    : {
        x: perspectiveRotation.x + dragRotation.x,
        y: perspectiveRotation.y + dragRotation.y,
      }

  const mobileSize = isDesktop ? 600 : 252

  return (
    <div className="flex justify-center order-1 lg:order-2 lg:col-span-2 max-lg:-my-1">
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`group relative ${
          disablePerspective ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } flex items-center justify-center`}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          zIndex: 0,
          userSelect: 'none',
          width: `${mobileSize}px`,
          height: `${mobileSize}px`,
        }}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${combinedRotation.x}deg) rotateY(${combinedRotation.y}deg)`,
          }}
        >
          <img
            src={ProfilePic}
            alt="Yuwen Lu"
            className="w-40 h-40 sm:w-44 sm:h-44 md:w-60 md:h-60 lg:w-72 lg:h-72 object-cover rounded-full shadow-lg transition-shadow duration-300 group-hover:shadow-2xl pointer-events-none select-none"
            style={{
              filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
          />
          <AcrylicDisc
            rotation={combinedRotation}
            totalRotation={0}
            size={isDesktop ? 288 : 200}
          />
        </div>
      </div>
    </div>
  )
}
