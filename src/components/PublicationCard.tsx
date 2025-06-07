import { motion } from 'framer-motion'

interface PublicationCardProps {
  title: string
  authors: string
  conference?: string
  award?: string
  note?: string
  links: Array<{ label: string; url: string }>
  image?: string
  gradientFrom?: string
  gradientTo?: string
  isSystemPaper?: boolean
}

export const PublicationCard = ({ 
  title, 
  authors, 
  conference, 
  award,
  note, 
  links, 
  image,
  gradientFrom = "from-teal-500",
  gradientTo = "to-orange-400",
  isSystemPaper = false
}: PublicationCardProps) => {
  return (
    <div
      className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
      style={{ aspectRatio: '4/4' }}
    >
      {/* Full background image */}
      {image && (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Dark overlay for text readability - animated gradient */}
      <div className="absolute inset-0">
        {/* Base gradient - always visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 from-0% via-black/40 via-75% to-transparent to-100%"></div>
        {/* Darker gradient - appears on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 from-0% via-black/70 via-75% to-transparent to-100% opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"></div>
      </div>

      {/* System badge for system papers */}
      {isSystemPaper && (
        <div className="absolute top-3 right-3 z-10">
          <div className="px-4 py-1 rounded-full bg-black/80 backdrop-blur-sm border border-white/10 shadow-lg flex items-center">
            <span className="text-xs font-medium tracking-wider" style={{ color: '#a1db08' }}>
              SYSTEM
            </span>
          </div>
        </div>
      )}

      {/* Content overlay */}
      <div className="relative h-full flex flex-col justify-end p-6 text-white">

        {/* Main content - positioned at bottom with additional info above title */}
        <div className="space-y-4">
          {/* Additional info - appears on hover just above title */}
          <div className="space-y-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-600" style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
            {/* Authors */}
            <p className="text-sm font-medium drop-shadow-lg line-clamp-3" style={{ transitionDelay: '100ms' }}>
              {authors.split(/,\s*/).map((author, i) => {
                const trimmedAuthor = author.trim();
                if (trimmedAuthor.includes('Yuwen Lu')) {
                  return (
                    <span key={i}>
                      {i > 0 && ', '}
                      <span className="font-bold" style={{ color: '#a1db08' }}>{trimmedAuthor}</span>
                    </span>
                  );
                }
                return (
                  <span key={i}>
                    {i > 0 && ', '}
                    {trimmedAuthor}
                  </span>
                );
              })}
            </p>
            
            {/* Conference */}
            {conference && (
              <p className="font-semibold text-sm drop-shadow-lg line-clamp-2" style={{ transitionDelay: '200ms', color: '#a1db08' }}>
                {conference}
              </p>
            )}
            
            {/* Note */}
            {note && (
              <p className="text-sm italic drop-shadow-lg opacity-90 line-clamp-2" style={{ transitionDelay: '300ms' }}>
                {note}
              </p>
            )}
          </div>

          {/* Award - Always visible */}
          {award && (
            <div className="mb-2">
              <p className="text-sm font-semibold drop-shadow-lg" style={{ color: '#a1db08', marginBottom: '0px' }}>
                {award}
              </p>
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold leading-tight text-white drop-shadow-xl transition-all duration-500 group-hover:transform group-hover:-translate-y-1" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {title}
          </h3>

          {/* Action links */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-3 transform group-hover:-translate-y-0.5 transition-all duration-500 delay-150" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative overflow-hidden text-sm font-semibold px-4 py-2.5 rounded-lg backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-lg text-white/95 hover:text-white group/button"
                >
                  <span className="relative z-10">{link.label}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 