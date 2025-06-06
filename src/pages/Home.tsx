import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import ProfilePic from '../resources/images/me.png'
import MistyPic from '../resources/images/misty.png'
import DarkPitaPic from '../resources/images/dark_pita_dalle.png'
import CHIWORK2022Pic from '../resources/images/CHIWORK22_approach.png'
import CHI2022WorkshopPic from '../resources/images/user-interface-workshop.jpeg'
import Lbw2022Pic from '../resources/images/chi-lbw-2022.png'
import Chi2022LbwPoster from '../resources/files/LBW CHI2022/Poster_YuwenLu_LBWCHI2022.pdf'
import { useMediaQuery } from 'react-responsive'
import { AcrylicDisc } from '../components/AcrylicDisc'
import { PublicationCard } from '../components/PublicationCard'
import FlowyPic from '../resources/images/flowy_card.png'
import CrepePic from '../resources/images/crepe.png'

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

  const handleImageClick = () => {
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
      // authors: "Yuwen Lu, Alan Leung, Amanda Swearngin, Jeffrey Nichols, Titus Barik",
      conference: "CHI 2025",
      note: "Work done during internship at Apple AIML",
      links: [
        { label: "Paper", url: "https://machinelearning.apple.com/research/interactive-prototyping" },
        { label: "Code", url: "https://github.com/ND-SaNDwichLAB/Misty" },
        { label: "Video", url: "https://x.com/yuwen_lu_/status/1850574331539276198" },
      ],
      image: MistyPic,
      isSystemPaper: true
    },
    {
      title: "Dark Pita: Exploring End-User Interventions for Dark Patterns in UX",
      // authors: "Yuwen Lu*, Chao Zhang*, Yuewen Yang, Yaxing Yao, Toby Jia-Jun Li (* equal contribution)",
      conference: "CSCW 2024",
      award: "🏆 Best Paper Award (Top 1%)",
      note: "Image generated with DALL-E 2",
      links: [
        { label: "Paper", url: "https://dl.acm.org/doi/10.1145/3637336" },
        { label: "Code", url: "https://github.com/yuwen-lu/dark-pita" },
      ],
      image: DarkPitaPic,
      isSystemPaper: true
    },
    {
      title: "Flowy: Supporting UX Design Decisions With AI",
      authors: "Yuwen Lu, Ziang Tong, Qinyi Zhao, Yewon Oh, Bryan Wang, Toby Jia-Jun Li",
      note: "Use AI to meaningfully support UI/UX design decisions",
      links: [
        { label: "Preprint", url: "https://arxiv.org/abs/2406.16177" },
        { label: "Demo", url: "https://flowy.design" },
      ],
      image: FlowyPic,
      isSystemPaper: true
    },
    {
      title: "Crepe: Mobile Screen Data Collector",
      authors: "Yuwen Lu, Meng Chen, Qi Zhao, Victor Cox, Yang Yang, Meng Jiang, Jay Brockman, Tamara Kay, Toby Jia-Jun Li",
      note: "Collecting mobile screen data for personalized AI agents",
      links: [
        { label: "Paper", url: "https://arxiv.org/abs/2406.16173" },
      ],
      image: CrepePic,
      isSystemPaper: true
    },
    {
      title: "Using AI Agents To Empower Gig Workers against AI Inequality",
      authors: "Toby Jia-Jun Li, Yuwen Lu, Jaylexia Clark, Meng Chen, Victor Cox, Meng Jiang, Yang Yang, Tamara Kay, Danielle Wood, Jay Brockman",
      conference: "CHIWORK '22",
      note: "",
      links: [
        { label: "Paper", url: "https://dl.acm.org/doi/10.1145/3533406.3533418" },
        { label: "Video", url: "https://youtu.be/8zCOj9G3I_o" },
      ],
      image: CHIWORK2022Pic
    },
    {
      title: "Computational Approaches for User Interfaces",
      authors: "Yue Jiang*, Yuwen Lu*, Jeffrey Nichols, Wolfgang Stuerzlinger, Chun Yu, Christof Lutteroth, Yang Li, Ranjitha Kumar, Toby Jia-Jun Li (* equal contribution)",
      conference: "CHI '22 Workshop",
      note: "",
      links: [
        { label: "Paper", url: "https://yuejiang-nj.github.io/Publications/2022CHI_UserInterfaces/paper.pdf" },
        { label: "Workshop Website", url: "https://sites.google.com/nd.edu/computational-uichi22/home" },
      ],
      image: CHI2022WorkshopPic
    },
    {
      title: "Bridging the Gap Between UX Practitioners' Work Practices and AI-Enabled Design Support Tools",
      authors: "Yuwen Lu, Chengzhi Zhang, Iris Zhang, and Toby Jia-Jun Li",
      conference: "CHI '22 Late-Breaking Work",
      note: "",
      links: [
        { label: "Poster", url: Chi2022LbwPoster },
        { label: "Paper", url: "https://dl.acm.org/doi/10.1145/3491101.3519809" },
        { label: "Video", url: "https://www.youtube.com/watch?v=TJ16TIe29xw" },
      ],
      image: Lbw2022Pic
    }
  ]

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      {/* Hero Section - Original Bootstrap layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center mb-8 lg:mb-64"
        style={{ marginTop: "1rem" }}
      >
        <div className="space-y-12 lg:space-y-10 order-2 lg:order-1 lg:col-span-3">
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
              This summer, I will be a visiting researcher at{" "}
              <a 
                href="https://mj-storytelling.github.io" 
                target="_blank" 
                rel="noopener noreferrer"
              >
               Midjourney Storytelling Lab
              </a>
              {" "}in San Francisco.
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
            className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} flex items-center justify-center`} // Added centering classes
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              zIndex: 0,
              userSelect: 'none', // Prevent text selection while dragging
              width: isDesktop ? '600px' : '320px', // Reduced mobile from 450px to 320px
              height: isDesktop ? '600px' : '320px', // Reduced mobile from 450px to 320px
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
                className="w-48 h-48 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-72 lg:h-72 object-cover rounded-full shadow-lg transition-shadow duration-300 hover:shadow-2xl cursor-pointer"
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
                size={isDesktop ? 288 : 240} // Increased mobile size from 192 to 240
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Thesis Proposal & Current Work - Two Column Layout */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8 lg:mb-16 mt-8 lg:mt-16"
      >
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Current Work Section */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="text-center lg:text-left mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl mb-2 lg:mb-4 space-grotesk-medium"
                  style={{ 
                    fontSize: isDesktop ? "1.8rem" : "1.4rem", 
                    lineHeight: "1.3",
                    letterSpacing: "-0.01em"
                  }}>
                Currently Working On
              </h2>
            </div>
            <div className="text-left space-y-3 lg:space-y-4 space-grotesk-regular" style={{ lineHeight: "1.6em" }}>
              <div style={{ fontSize: isDesktop ? "1.1rem" : "1rem", lineHeight: isDesktop ? "1.6em" : "1.5em", marginBottom: isDesktop ? "1rem" : "0.8rem" }}>
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
              <div style={{ fontSize: isDesktop ? "1.1rem" : "1rem", lineHeight: isDesktop ? "1.6em" : "1.5em", marginBottom: isDesktop ? "1rem" : "0.8rem" }}>
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
              <div style={{ fontSize: isDesktop ? "1.1rem" : "1rem", lineHeight: isDesktop ? "1.6em" : "1.5em", marginBottom: isDesktop ? "1rem" : "0.8rem" }}>
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

          {/* Thesis Proposal Section */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center lg:text-left mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl mb-2 lg:mb-4 space-grotesk-medium"
                  style={{ 
                    fontSize: isDesktop ? "1.8rem" : "1.4rem", 
                    lineHeight: "1.3",
                    letterSpacing: "-0.01em"
                  }}>
                Watch My Thesis Proposal
              </h2>
              <p className="space-grotesk-regular" 
                 style={{ 
                   fontSize: isDesktop ? "1rem" : "0.9rem", 
                   lineHeight: "1.6", 
                   opacity: 0.8
                 }}>
                April 2025. A summary of my previous research in user interfaces and human-AI interaction.
              </p>
            </div>
            
            <div className="w-full">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                  src="https://www.youtube.com/embed/_At0jvJ_N3A"
                  title="Thesis Proposal - Human-AI Interaction Research"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    border: 'none',
                    borderRadius: '12px'
                  }}
                />
              </div>
            </div>
          </motion.section>
        </div>
      </motion.div>

      {/* Publications Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8 lg:mb-16"
      >
        <div className="text-center mb-4 lg:mb-8">
          <h2 className="text-xl lg:text-2xl mb-4 lg:mb-6 space-grotesk-regular"
              style={{ 
                fontSize: isDesktop ? "2rem" : "1.6rem", 
                lineHeight: "1.3",
                letterSpacing: "-0.01em"
              }}>
            Publications
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 lg:px-8">
          {publications.map((pub, index) => (
            <PublicationCard
              key={index}
              title={pub.title}
              authors={pub.authors}
              conference={pub.conference}
              award={pub.award}
              note={pub.note}
              links={pub.links}
              image={pub.image}
              isSystemPaper={pub.isSystemPaper}
            />
          ))}
        </div>
      </motion.section>
    </div>
  )
} 