import type { ReactNode } from 'react'

interface PublicationCardProps {
  title: string
  authors?: string
  conference?: string
  award?: string
  /** Shown as the first slot-reveal line (above authors) when set */
  slotLead?: string
  note?: string
  links: Array<{ label: string; url: string }>
  image?: string
  isSystemPaper?: boolean
}

const HOVER_EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const SLOT_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
/** Extra delay for authors/conference/note when slotLead occupies the first reveal slot (180ms). */
const SLOT_LEAD_STAGGER_MS = 150

function openExternalUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

interface SlotRevealProps {
  children: ReactNode
  faceHeight: number
  delay?: number
}

function SlotReveal({ children, faceHeight, delay = 0 }: SlotRevealProps) {
  const radius = faceHeight / 2
  const P = 500
  const shrink = (P - radius) / P
  return (
    <div
      style={{
        height: faceHeight,
        perspective: `${P}px`,
        overflow: 'hidden',
        width: '100%',
        flexShrink: 0,
      }}
    >
      <div
        className="[transform:rotateX(0deg)] group-hover:[transform:rotateX(90deg)]"
        style={{
          width: '100%',
          height: faceHeight,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: `transform 520ms ${SLOT_EASE} ${delay}ms`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: `rotateX(0deg) translateZ(${radius}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: `rotateX(-90deg) translateZ(${radius}px) scale(${shrink})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function renderAuthors(authors: string) {
  return authors.split(/,\s*/).map((author, i) => {
    const trimmed = author.trim()
    if (trimmed.includes('Yuwen Lu')) {
      return (
        <span key={i}>
          {i > 0 && ', '}
          <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{trimmed}</span>
        </span>
      )
    }
    return (
      <span key={i}>
        {i > 0 && ', '}
        {trimmed}
      </span>
    )
  })
}

export const PublicationCard = ({
  title,
  authors,
  conference,
  award,
  slotLead,
  note,
  links,
  image,
  isSystemPaper = false,
}: PublicationCardProps) => {
  const hasMeta = Boolean(slotLead || authors || conference || note)
  const metaStagger = slotLead ? SLOT_LEAD_STAGGER_MS : 0

  return (
    <div
      className="group relative overflow-hidden rounded-xl"
      style={{ aspectRatio: '4/4' }}
    >
      {image && (
        <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      )}

      {/* Always-visible bottom gradient for text readability */}
      <div
        className="absolute inset-x-0 bottom-0 z-[1] h-[70%]"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 70%, transparent 100%)' }}
      />

      {/* Full-card dark overlay on hover */}
      <div
        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100"
        style={{ transition: `opacity 300ms ${HOVER_EASE}` }}
      />

      {isSystemPaper && (
        <div className="absolute right-3 top-3 z-20">
          <div className="flex items-center rounded-full border border-white/10 bg-black/85 px-4 py-1">
            <span className="text-xs font-medium tracking-wider" style={{ color: 'var(--color-accent)' }}>SYSTEM</span>
          </div>
        </div>
      )}

      {/* Content pinned to bottom */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 text-white">
        {hasMeta && (
          <div
            className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr]"
            style={{ transition: `grid-template-rows 200ms ${HOVER_EASE}` }}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-1 pb-2">
                {slotLead && (
                  <SlotReveal faceHeight={44} delay={180}>
                    <p className="line-clamp-2 text-sm italic leading-snug text-white/90">
                      {slotLead}
                    </p>
                  </SlotReveal>
                )}
                {authors && (
                  <SlotReveal faceHeight={80} delay={180 + metaStagger}>
                    <p className="line-clamp-4 text-sm font-medium leading-5">
                      {renderAuthors(authors)}
                    </p>
                  </SlotReveal>
                )}
                {conference && (
                  <SlotReveal faceHeight={22} delay={330 + metaStagger}>
                    <p className="line-clamp-1 text-sm font-semibold leading-[22px]" style={{ color: 'var(--color-accent)' }}>
                      {conference}
                    </p>
                  </SlotReveal>
                )}
                {note && (
                  <SlotReveal faceHeight={22} delay={480 + metaStagger}>
                    <p className="line-clamp-1 text-sm italic leading-[22px] text-white/90">
                      {note}
                    </p>
                  </SlotReveal>
                )}
              </div>
            </div>
          </div>
        )}

        {award && <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>{award}</p>}

        <h3 className="text-xl font-medium leading-tight">{title}</h3>

        {links.length > 0 && (
          <div className="relative z-20 mt-3 flex flex-wrap gap-2">
            {links.map((link, index) => (
              <button
                key={index}
                type="button"
                onClick={() => openExternalUrl(link.url)}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

