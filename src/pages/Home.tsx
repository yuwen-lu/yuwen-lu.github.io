import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import ProfilePic from '../resources/images/me.png'
import MistyPic from '../resources/images/misty.png'
import DarkPitaPic from '../resources/images/dark_pita_dalle.png'
import CHIWORK2022Pic from '../resources/images/CHIWORK22_approach.png'
import CHI2022WorkshopPic from '../resources/images/user-interface-workshop.jpeg'
import Lbw2022Pic from '../resources/images/chi-lbw-2022.png'
import { useMediaQuery } from 'react-responsive'

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
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!profileImageRef.current) return

    const rect = profileImageRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Calculate mouse position relative to the center of the container
    const mouseX = event.clientX - centerX
    const mouseY = event.clientY - centerY

    // Convert to rotation values (limit rotation to make it realistic)
    const rotateY = (mouseX / (rect.width / 2)) * 60 // Max 60 degrees - more dramatic rotation
    const rotateX = -(mouseY / (rect.height / 2)) * 60 // Max 60 degrees - more dramatic rotation

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!profileImageRef.current || event.touches.length === 0) return

    const touch = event.touches[0]
    const rect = profileImageRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const touchX = touch.clientX - centerX
    const touchY = touch.clientY - centerY

    const rotateY = (touchX / (rect.width / 2)) * 60
    const rotateX = -(touchY / (rect.height / 2)) * 60

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  const handleTouchEnd = () => {
    setRotation({ x: 0, y: 0 })
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
        className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-center mb-16 lg:mb-16"
        style={{ marginTop: "1rem" }}
      >
        <div className="space-y-12 lg:space-y-6 order-2 lg:order-1">
          <h1 className="title space-grotesk-medium" style={{ fontSize: isDesktop ? "3.5rem" : "2.8rem", letterSpacing: "-0.02em" }}>
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

        <div className="flex justify-center order-1 lg:order-2">
          <div
            ref={profileImageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative"
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              padding: isDesktop ? '120px' : '60px', // Reduced padding
              margin: isDesktop ? '-120px' : '-60px', // Corresponding negative margin
              zIndex: 1 // Lower z-index
            }}
          >
            <motion.div
              animate={{
                rotateX: rotation.x,
                rotateY: rotation.y,
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 0.8
              }}
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              }}
            >
              <img
                src={ProfilePic}
                alt="Yuwen Lu"
                className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 object-cover rounded-full shadow-lg transition-shadow duration-300 hover:shadow-2xl"
                style={{ 
                  filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
                  transformStyle: 'preserve-3d'
                }}
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