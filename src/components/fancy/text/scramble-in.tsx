import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

/** Alphanumeric only — less visually noisy than symbols during scramble. */
const RANDOM_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function randomChar() {
  return RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]
}

export interface ScrambleInHandle {
  start: () => void
}

export interface ScrambleInProps {
  text: string
  /**
   * Ms between scramble steps for a character. Lower → steps accumulate faster → that
   * character locks sooner after `scrambledLetterCount` steps.
   */
  scrambleSpeed?: number
  /**
   * Random frames each character shows before locking to the final glyph.
   * Lower = subtler (try 2–3). Higher = more “static” (try 5–8).
   */
  scrambledLetterCount?: number
  autoStart?: boolean
  className?: string
  /**
   * Delay before each successive character begins resolving (ms). Lower = faster cascade
   * across the line.
   */
  charStaggerMs?: number
  /** Render as block element (stacked lines). */
  block?: boolean
}

export const ScrambleIn = forwardRef<ScrambleInHandle, ScrambleInProps>(
  function ScrambleIn(
    {
      text,
      scrambleSpeed = 40,
      scrambledLetterCount = 3,
      autoStart = false,
      className,
      charStaggerMs = 28,
      block = false,
    },
    ref
  ) {
    const [display, setDisplay] = useState('')
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startTimeRef = useRef(0)

    const clear = useCallback(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, [])

    const run = useCallback(() => {
      clear()
      startTimeRef.current = Date.now()

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        const chars = text.split('')
        let allDone = true

        const out = chars.map((char, i) => {
          if (char === ' ') return ' '
          if (char === '\n') return '\n'
          const charStart = i * charStaggerMs
          if (elapsed < charStart) {
            allDone = false
            return randomChar()
          }
          const t = elapsed - charStart
          const steps = Math.floor(t / scrambleSpeed)
          if (steps >= scrambledLetterCount) return char
          allDone = false
          return randomChar()
        })

        setDisplay(out.join(''))

        if (allDone) {
          clear()
          setDisplay(text)
        }
      }, 16)
    }, [
      text,
      scrambleSpeed,
      scrambledLetterCount,
      charStaggerMs,
      clear,
    ])

    useImperativeHandle(ref, () => ({ start: run }), [run])

    useEffect(() => {
      if (autoStart) run()
      return () => clear()
    }, [autoStart, run, clear])

    const Tag = block ? 'div' : 'span'

    return (
      <Tag
        className={cn(
          'relative',
          block ? 'block w-full' : 'inline-block max-w-full align-baseline',
          className
        )}
      >
        <span className="sr-only">{text}</span>
        <span className="invisible block whitespace-pre-wrap break-words" aria-hidden>
          {text}
        </span>
        <span
          className="absolute left-0 top-0 block w-full whitespace-pre-wrap break-words"
          aria-hidden
        >
          {display}
        </span>
      </Tag>
    )
  }
)

export default ScrambleIn
