import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import ProfilePic from '../resources/images/me.png'
import MistyPic from '../resources/images/misty.png'
import DarkPitaPic from '../resources/images/dark_pita_dalle.png'
import CHIWORK2022Pic from '../resources/images/CHIWORK22_approach.png'
import CHI2022WorkshopPic from '../resources/images/user-interface-workshop.jpeg'
import Lbw2022Pic from '../resources/images/chi-lbw-2022.png'
import { useMediaQuery } from 'react-responsive'
import { AcrylicDisc } from '../components/AcrylicDisc'

export const Home = () => {
  // Typing animation hook
  const useTypewriter = (text: string, speed: number = 100) => {
    const [displayText, setDisplayText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayText(prev => prev + text[currentIndex])
          setCurrentIndex(prev => prev + 1)
        }, speed)

        return () => clearTimeout(timeout)
      } else {
        setIsComplete(true)
      }
    }, [currentIndex, text, speed])

    return { displayText, isComplete }
  }

  const { displayText, isComplete } = useTypewriter("I am \/almost\/ graduating", 100)

  // Function to render text with colored underscores
  const renderTextWithColoredUnderscores = (text: string) => {
    return text.split(/(\/almost\/)/).map((part, index) => {
      if (part === '\/almost\/') {
        return (
          <span key={index}>
            <span style={{ color: '#a1db08', fontWeight: '500' }}>/</span>
            <span style={{ fontWeight: '500' }}>almost</span>
            <span style={{ color: '#a1db08', fontWeight: '500' }}>/</span>
          </span>
        )
      }
      return part
    })
  }

  // Responsiveness
  const isDesktop = useMediaQuery({
    query: "(min-width: 769px)",
  })

  // 3D rotation effect for profile picture
  const profileImageRef = useRef<HTMLDivElement>(null)
  const [perspectiveRotation, setPerspectiveRotation] = useState({ x: 0, y: 0 }) // Global mouse perspective
  const [dragRotation, setDragRotation] = useState({ x: 0, y: 0 }) // User drag rotation
  const [totalRotation, setTotalRotation] = useState(0) // Click flip rotation
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false) // Track if actual dragging occurred

  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      // Enhanced perspective effect based on global mouse position
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      const mouseX = event.clientX - centerX
      const mouseY = event.clientY - centerY

      // More pronounced rotation for better visual feedback (max 20 degrees)
      const rotateY = (mouseX / (window.innerWidth / 2)) * 20
      const rotateX = -(mouseY / (window.innerHeight / 2)) * 20

      setPerspectiveRotation({ x: rotateX, y: rotateY })
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [])

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true)
    setHasDragged(false) // Reset drag flag
    setDragStart({ x: event.clientX, y: event.clientY })
    event.preventDefault() // Prevent text selection while dragging
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y

    // Consider it dragging if moved more than 5 pixels
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setHasDragged(true)
    }

    const newRotateX = dragRotation.x - deltaY * 0.6 
    const newRotateY = dragRotation.y + deltaX * 0.6 

    // Limit rotation ranges to prevent extreme positions
    const clampedRotateX = Math.max(-75, Math.min(75, newRotateX)) // Limit vertical tilt
    const clampedRotateY = Math.max(-90, Math.min(90, newRotateY)) // Limit horizontal spin

    setDragRotation({ x: clampedRotateX, y: clampedRotateY })
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleImageClick = (event: React.MouseEvent) => {
    // Only flip if there was no dragging
    if (!hasDragged) {
      // Do the flashy 540° animation (360° spin + 180° flip)
      setTotalRotation(prev => prev + 540)
      // Reset drag rotation for clean viewing position
      setDragRotation({ x: 0, y: 0 })
    }
    // Reset drag flag for next interaction
    setHasDragged(false)
  }

  // Global mouse up listener to handle drag end even outside component
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  // Combine all rotations
  const combinedRotation = {
    x: perspectiveRotation.x + dragRotation.x,
    y: perspectiveRotation.y + dragRotation.y + totalRotation
  }

  const publications = [
    {
      title: "Misty: UI Prototyping Through Interactive Conceptual Blending",
      authors: "Yuwen Lu, Alan Leung, Amanda Swearngin, Jeffrey Nichols, Titus Barik",
      conference: "CHI 2025",
      note: "Work done during internship at Apple AIML",
      links: [
        { label: "Paper", url: "https://machinelearning.apple.com/research/interactive-prototyping" },
        { label: "Code", url: "https://github.com/ND-SaNDwichLAB/Misty" },
        { label: "Video", url: "https://x.com/yuwen_lu_/status/1850574331539276198" },
      ],
      image: MistyPic
    },
    {
      title: "From Design Transparency to Malleable Interfaces: Exploring End-User Interventions for Dark Patterns in UX",
      authors: "Yuwen Lu*, Chao Zhang*, Yuewen Yang, Yaxing Yao, Toby Jia-Jun Li (* equal contribution)",
      conference: "CSCW 2023 🏆 Best Paper Award (Top 1%)",
      note: "Left image generated with DALL-E 2",
      links: [
        { label: "Paper", url: "https://dl.acm.org/doi/10.1145/3637336" },
        { label: "Code", url: "https://github.com/yuwen-lu/dark-pita" },
      ],
      image: DarkPitaPic
    },
    {
      title: "A Bottom-Up End-User Intelligent Assistant Approach to Empower Gig Workers against AI Inequality",
      authors: "Toby Jia-Jun Li, Yuwen Lu, Jaylexia Clark, Meng Chen, Victor Cox, Meng Jiang, Yang Yang, Tamara Kay, Danielle Wood, Jay Brockman",
      conference: "CHIWORK '22",
      note: "",
      links: [
        { label: "Preprint", url: "https://arxiv.org/abs/2204.13842" },
        { label: "Video", url: "https://youtu.be/8zCOj9G3I_o" },
      ],
      image: CHIWORK2022Pic
    },
    {
      title: "Computational Methods for Understanding How User Interface Design Affects User Decision Making",
      authors: "Yuwen Lu, Chao Zhang, Yuewen Yang, Yaxing Yao, Toby Jia-Jun Li",
      conference: "CHI '22 Workshop",
      note: "",
      links: [],
      image: CHI2022WorkshopPic
    },
    {
      title: "Supporting Gig Workers to Choose Gig Work Utilizing Personal AI Agents",
      authors: "Yuwen Lu, Meng Chen, Jaylexia Clark, Victor Cox, Toby Jia-Jun Li",
      conference: "CHI '22 Late-Breaking Work",
      note: "",
      links: [
        { label: "Poster", url: "#" }, // Add actual URL when available
        { label: "Preprint", url: "#" }, // Add actual URL when available
      ],
      image: Lbw2022Pic
    }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section - Original Bootstrap layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="grid lg:grid-cols-5 gap-8 lg:gap-8 items-center mb-16 lg:mb-16"
        style={{ marginTop: "1rem" }}
      >
        <div className="space-y-12 lg:space-y-6 order-2 lg:order-1 lg:col-span-3">
          <h1 className="title space-grotesk-medium relative" style={{ fontSize: isDesktop ? "3.5rem" : "2.8rem", letterSpacing: "-0.02em" }}>
            {/* Invisible placeholder to reserve space for full text */}
            <span className="invisible" aria-hidden="true">
              {renderTextWithColoredUnderscores("I am /almost/ graduating")}
            </span>
            
            {/* Actual typing animation positioned absolutely over the placeholder */}
            <span className="absolute top-0 left-0">
              {renderTextWithColoredUnderscores(displayText)}
              <span 
                className={`typing-cursor ${isComplete ? 'blink' : ''}`}
                style={{
                  animation: isComplete ? 'blink 1s infinite' : 'none',
                  borderBottom: '5px solid #a1db08',
                  marginLeft: '2px',
                  display: 'inline-block',
                  width: '16px',
                  height: '1em',
                  verticalAlign: 'baseline',
                  position: 'relative',
                  top: '0.1em'
                }}
              >
                &nbsp;
              </span>
            </span>
          </h1>
          <div className="space-y-12 lg:space-y-4">
            <p className="space-grotesk-regular" style={{ fontSize: isDesktop ? "1.4rem" : "1.2rem", lineHeight: "1.5", letterSpacing: "-0.01em" }}>
              I am Yuwen, a Ph.D. Candidate in Computer Science and Engineering at the
              University of Notre Dame.
            </p>
            <p className="space-grotesk-regular" style={{ fontSize: isDesktop ? "1.4rem" : "1.2rem", lineHeight: "1.5", letterSpacing: "-0.01em" }}>
              I am a design engineer doing research in Human-AI Interaction. My advisor is{" "}
              <a href="https://toby.li/">Toby Li</a>.
            </p>
            {/* <p>
              Previously, I graduated with a{" "}
              <a
                href="https://www.hcii.cmu.edu/academics/mhci"
                target="_blank"
                rel="noopener noreferrer"
              >
                Master of Human Computer Interaction
              </a>{" "}
              from Carnegie Mellon University. I have a background in Computer Science and UX design & research.
            </p> */}
          </div>
        </div>

        <div className="flex justify-center order-1 lg:order-2 lg:col-span-2">
          <div
            ref={profileImageRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleImageClick}
            className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} // Dynamic cursor based on drag state
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              zIndex: 0,
              userSelect: 'none', // Prevent text selection while dragging
            }}
          >
            <motion.div
              animate={{
                rotateX: combinedRotation.x,
                rotateY: combinedRotation.y,
              }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 20,
                mass: 1.2,
                duration: 1.5
              }}
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${combinedRotation.x}deg) rotateY(${combinedRotation.y}deg)`,
              }}
            >
              <img
                src={ProfilePic}
                alt="Yuwen Lu"
                className="w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-cover rounded-full shadow-lg transition-shadow duration-300 hover:shadow-2xl cursor-pointer"
                style={{ 
                  filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden'
                }}
              />
              {/* 3D Glass disc instead of CSS effect */}
              <AcrylicDisc 
                rotation={combinedRotation}
                totalRotation={0} // Rotation now handled in combinedRotation
                size={isDesktop ? 224 : 144} // Reduced to match new image sizes (was 320/192)
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Current Work Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-16 lg:mb-16"
      >
        <div className="text-center mb-8 lg:mb-8">
          <h2 className="text-xl lg:text-2xl mb-8 lg:mb-8 space-grotesk-medium" 
              style={{ 
                fontSize: isDesktop ? "2rem" : "1.6rem", 
                lineHeight: "1.3",
                letterSpacing: "-0.01em"
              }}>
            Currently Working On...
          </h2>
        </div>
        <div className="text-left lg:text-center space-y-6 lg:space-y-4 space-grotesk-regular" style={{ lineHeight: "1.8em" }}>
          <div style={{ fontSize: isDesktop ? "1.4rem" : "1.2rem", lineHeight: isDesktop ? "1.8em" : "1.6em", marginBottom: isDesktop ? "1rem" : "1.5rem" }}>
            Exploring the UI for AI (maybe{" "}
            <a
              href="https://machinelearning.apple.com/research/interactive-prototyping"
              target="_blank"
              rel="noopener noreferrer" 
            >
              more direct manipulation
            </a>
            ?),
          </div>
          <div style={{ fontSize: isDesktop ? "1.4rem" : "1.2rem", lineHeight: isDesktop ? "1.8em" : "1.6em", marginBottom: isDesktop ? "1rem" : "1.5rem" }}>
            Using AI to{" "}
            <a
              href="https://arxiv.org/abs/2406.16177"
              target="_blank"
              rel="noopener noreferrer"
            >
              support design
            </a>
            ,
          </div>
          <div style={{ fontSize: isDesktop ? "1.4rem" : "1.2rem", lineHeight: isDesktop ? "1.8em" : "1.6em", marginBottom: isDesktop ? "1rem" : "1.5rem" }}>
            Dealing with{" "}
            <a
              href="https://dl.acm.org/doi/10.1145/3637336"
              target="_blank"
              rel="noopener noreferrer"
            >
              dark patterns
            </a>
            {" "}and{" "}
            <a
              href="https://arxiv.org/abs/2406.16177"
              target="_blank"
              rel="noopener noreferrer"
            >
              support end users
            </a>
            .
          </div>
        </div>
      </motion.section>

      {/* Publications Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-12 lg:mb-16"
      >
        <div className="text-center mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl mb-6 lg:mb-8 space-grotesk-regular" 
              style={{ 
                fontSize: isDesktop ? "2rem" : "1.6rem", 
                lineHeight: "1.3",
                letterSpacing: "-0.01em"
              }}>
            Publications
          </h2>
        </div>
        <div className="space-y-8 lg:space-y-16">
          {publications.map((pub, index) => (
            <div
              key={index}
              className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 lg:p-8 card-hover rounded-lg"
            >
              {/* Mobile: Image and basic info in a row */}
              <div className="flex gap-4 items-center lg:hidden">
                {pub.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={pub.image}
                      alt={pub.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-light leading-tight mb-2" style={{ fontSize: "1.1rem", lineHeight: "1.4" }}>
                    {pub.title}
                  </h3>
                  <p className="text-[#a1db08] font-medium text-sm mb-2">{pub.conference}</p>
                </div>
              </div>
              
              {/* Mobile: Authors and links below */}
              <div className="lg:hidden space-y-2">
                <p className="text-sm opacity-80">
                  {pub.authors.includes('Yuwen Lu*') || pub.authors.includes('**Yuwen Lu**') ? (
                    <>
                      <strong>{pub.authors.split(',')[0]}</strong>
                      {pub.authors.substring(pub.authors.indexOf(','))}
                    </>
                  ) : (
                    pub.authors.replace('Yuwen Lu', '**Yuwen Lu**').split('**Yuwen Lu**').map((part, i) => 
                      i === 1 ? <><strong key={i}>Yuwen Lu</strong>{part}</> : part
                    )
                  )}
                </p>
                {pub.note && (
                  <p className="text-xs opacity-60 italic">{pub.note}</p>
                )}
                {pub.links.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {pub.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paper-link text-sm"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop: Fixed layout with proper spacing */}
              <div className="hidden lg:flex lg:flex-shrink-0">
                {pub.image && (
                  <img
                    src={pub.image}
                    alt={pub.title}
                    className="object-cover rounded-lg"
                    style={{
                      height: "12rem",
                      width: "16rem",
                      minWidth: "16rem"
                    }}
                  />
                )}
              </div>
              <div className="hidden lg:flex lg:flex-col lg:justify-center lg:flex-1 lg:min-w-0 space-y-4">
                <h3 className="text-xl font-light leading-relaxed space-grotesk-medium" style={{ fontSize: "1.6rem", lineHeight: "1.5", marginBottom: "0.5rem" }}>
                  {pub.title}
                </h3>
                <p className="text-lg opacity-80 leading-relaxed space-grotesk-regular" style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
                  {pub.authors.includes('Yuwen Lu*') || pub.authors.includes('**Yuwen Lu**') ? (
                    <>
                      <strong>{pub.authors.split(',')[0]}</strong>
                      {pub.authors.substring(pub.authors.indexOf(','))}
                    </>
                  ) : (
                    pub.authors.replace('Yuwen Lu', '**Yuwen Lu**').split('**Yuwen Lu**').map((part, i) => 
                      i === 1 ? <><strong key={i}>Yuwen Lu</strong>{part}</> : part
                    )
                  )}
                </p>
                <p className="text-[#a1db08] font-medium text-lg space-grotesk-medium" style={{ fontSize: "1.05rem" }}>{pub.conference}</p>
                {pub.note && (
                  <p className="text-base opacity-60 italic space-grotesk-regular" style={{ fontSize: "1rem" }}>{pub.note}</p>
                )}
                {pub.links.length > 0 && (
                  <div className="flex flex-wrap gap-4 pt-2">
                    {pub.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paper-link"
                        style={{ fontSize: "1.05rem" }}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  )
} 