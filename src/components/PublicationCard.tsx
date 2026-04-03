import type { ReactNode } from 'react'

interface PublicationCardProps {
  title: string
  authors?: string
  conference?: string
  award?: string
  /** Optional line after authors (e.g. context) when set */
  slotLead?: string
  note?: string
  links: Array<{ label: string; url: string }>
  image?: string
  isSystemPaper?: boolean
}

const HOVER_EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const SLOT_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
/** First metadata row delay; each following row adds {@link META_ROW_STAGGER_MS}. */
const META_FIRST_ROW_DELAY_MS = 180
const META_ROW_STAGGER_MS = 150

function openExternalUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function MetaRow({ children, delayMs }: { children: ReactNode; delayMs: number }) {
  return (
    <div
      className="opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
      style={{
        transitionProperty: 'opacity, transform',
        transitionDuration: '420ms',
        transitionTimingFunction: SLOT_EASE,
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {children}
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
  /** Fixed order: venue first, then authors, optional lead line, then note */
  const metaRows: Array<{ key: string; node: ReactNode }> = []
  if (conference) {
    metaRows.push({
      key: 'conference',
      node: (
        <p className="m-0 line-clamp-2 text-sm font-semibold leading-snug" style={{ color: 'var(--color-accent)' }}>
          {conference}
        </p>
      ),
    })
  }
  if (authors) {
    metaRows.push({
      key: 'authors',
      node: (
        <p className="m-0 line-clamp-4 text-sm font-medium leading-snug">{renderAuthors(authors)}</p>
      ),
    })
  }
  if (slotLead) {
    metaRows.push({
      key: 'slotLead',
      node: <p className="m-0 line-clamp-2 text-sm italic leading-snug text-white/90">{slotLead}</p>,
    })
  }
  if (note) {
    metaRows.push({
      key: 'note',
      node: <p className="m-0 line-clamp-2 text-sm italic leading-snug text-white/90">{note}</p>,
    })
  }

  const hasMeta = metaRows.length > 0

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
            className="mb-0 grid grid-rows-[0fr] group-hover:mb-3 group-hover:grid-rows-[1fr]"
            style={{ transition: `grid-template-rows 200ms ${HOVER_EASE}` }}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-1 pb-1">
                {metaRows.map((row, index) => (
                  <MetaRow key={row.key} delayMs={META_FIRST_ROW_DELAY_MS + index * META_ROW_STAGGER_MS}>
                    {row.node}
                  </MetaRow>
                ))}
              </div>
            </div>
          </div>
        )}

        {award && <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>{award}</p>}

        <h3 className="text-lg font-medium leading-snug">{title}</h3>

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

