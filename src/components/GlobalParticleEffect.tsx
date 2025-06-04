import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useMediaQuery } from 'react-responsive'

interface Particle {
  id: number;
  angle: number;
  velocity: number;
  size: number;
  duration: number;
  delay: number;
}

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  particles: Particle[];
  color: string;
}

// Background blur block colors from the site
const PARTICLE_COLORS = [
  '#A58BF0', // purple
  '#f8b6f2', // pink  
  '#d8f0aa', // green
  '#FBF2D2'  // yellow
]

const getRandomColor = () => PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]

// Convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const useGlobalParticleEffect = () => {
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([])
  const isDesktop = useMediaQuery({ query: "(min-width: 769px)" })

  const createParticleEffect = useCallback((clientX: number, clientY: number) => {
    const randomColor = getRandomColor()
    
    const newEffect: ClickEffect = {
      id: Date.now(),
      x: clientX,
      y: clientY,
      color: randomColor,
      particles: Array.from({ length: 12 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3
        const velocity = isDesktop ? 80 + Math.random() * 40 : 60 + Math.random() * 30
        const size = isDesktop ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2.5
        return {
          id: i,
          angle,
          velocity,
          size,
          duration: 0.8 + Math.random() * 0.4,
          delay: Math.random() * 0.1
        }
      })
    }

    setClickEffects(prev => [...prev, newEffect])

    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id))
    }, 1500)
  }, [isDesktop])

  const handleGlobalClick = useCallback((event: MouseEvent | TouchEvent) => {
    let clientX: number, clientY: number

    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else if ('changedTouches' in event && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX
      clientY = event.changedTouches[0].clientY
    } else {
      const mouseEvent = event as MouseEvent
      clientX = mouseEvent.clientX
      clientY = mouseEvent.clientY
    }

    createParticleEffect(clientX, clientY)
  }, [createParticleEffect])

  return { clickEffects, handleGlobalClick }
}

interface GlobalParticleEffectProps {
  clickEffects: ClickEffect[]
}

export const GlobalParticleEffect: React.FC<GlobalParticleEffectProps> = ({ clickEffects }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {clickEffects.map((effect) => (
        <div 
          key={effect.id} 
          className="absolute pointer-events-none" 
          style={{ left: effect.x, top: effect.y }}
        >
          {effect.particles.map((particle) => {
            const endX = Math.cos(particle.angle) * particle.velocity
            const endY = Math.sin(particle.angle) * particle.velocity
            
            return (
              <motion.div
                key={particle.id}
                initial={{ 
                  scale: 0,
                  x: 0, 
                  y: 0, 
                  opacity: 1
                }}
                animate={{ 
                  scale: [0, 1, 0.8, 0],
                  x: endX, 
                  y: endY, 
                  opacity: [1, 0.8, 0.3, 0]
                }}
                transition={{ 
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="absolute rounded-full"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  left: `-${particle.size / 2}px`,
                  top: `-${particle.size / 2}px`,
                  boxShadow: `0 0 ${particle.size * 2}px ${hexToRgba(effect.color, 0.6)}`,
                  backgroundColor: hexToRgba(effect.color, 0.8),
                  background: `radial-gradient(circle, ${hexToRgba(effect.color, 0.9)} 0%, ${hexToRgba(effect.color, 0.6)} 70%, ${hexToRgba(effect.color, 0.3)} 100%)`
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
} 