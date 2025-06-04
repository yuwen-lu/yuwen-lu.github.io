import { useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Check } from 'lucide-react'
import confetti from 'canvas-confetti'
import GithubIcon from '../resources/icons/github.svg'
import LinkedinIcon from '../resources/icons/linkedin.svg'
import TwitterIcon from '../resources/icons/twitter.svg'

export const Footer = () => {
  const [showCopiedBanner, setShowCopiedBanner] = useState(false)

  // Responsiveness, break point at tablet --> desktop
  const isDesktop = useMediaQuery({
    query: '(min-width: 769px)'
  })

  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('ylu23@nd.edu')
      
      // Trigger smaller confetti! 🎉
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.9 }, // Launch from bottom area
        colors: ['#E44C65', '#A58BF0']
      })
      
      setShowCopiedBanner(true)
      setTimeout(() => {
        setShowCopiedBanner(false)
      }, 2500)
    } catch (err) {
      console.error('Failed to copy email: ', err)
    }
  }

  return (
    <div className="text-center mt-40 px-4 sm:px-6 lg:px-8">
      {/* Copied email banner with subtle bouncy animation */}
      <AnimatePresence>
        {showCopiedBanner && (
          <motion.div
            initial={{ 
              opacity: 0, 
              y: 50, 
              scale: 0.8 
            }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            }}
            exit={{ 
              opacity: 0, 
              y: 20,
              scale: 0.9,
              transition: { duration: 0.2 }
            }}
            className="fixed bottom-6 left-0 right-0 mx-auto w-fit z-50 bg-[#E44C65] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <motion.div
              animate={{ 
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeInOut"
              }}
            >
              <Check size={16} />
            </motion.div>
            <span className="text-sm font-medium">Email copied!</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <p className="mb-6 text-lg">Contact</p>
      <div className="footer-icons mb-8 flex justify-center items-center gap-2 sm:gap-4">
        <motion.button 
          onClick={copyEmailToClipboard}
          className="inline-block cursor-pointer bg-transparent border-none p-2"
          title="Copy email to clipboard"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ cursor: "pointer" }}
        >
          <Mail 
            size={isDesktop ? 28 : 24} 
            className="text-white hover:text-[#E44C65] transition-colors"
          />
        </motion.button>
        <motion.a 
          target="_blank" 
          href="https://twitter.com/yuwen_lu_" 
          className="inline-block p-2"
          style={{ border: "none", cursor: "pointer", borderBottom: "none" }}
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <img 
            src={TwitterIcon} 
            alt="Twitter"
            className={`transition-all duration-200 hover:brightness-0 hover:saturate-100 hover:invert-0 hover:sepia-100 hover:hue-rotate-[320deg] ${isDesktop ? "w-7" : "w-6"}`}
            style={{
              filter: 'brightness(0) saturate(100%) invert(100%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(1500%) hue-rotate(320deg) brightness(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(100%)';
            }}
          />
        </motion.a>
        <motion.a 
          target="_blank" 
          href="https://github.com/yuwen-lu/" 
          className="inline-block p-2"
          style={{ border: "none", cursor: "pointer", borderBottom: "none" }}
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <img 
            src={GithubIcon} 
            alt="GitHub"
            className={`transition-all duration-200 ${isDesktop ? "w-7" : "w-6"}`}
            style={{
              filter: 'brightness(0) saturate(100%) invert(100%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(1500%) hue-rotate(320deg) brightness(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(100%)';
            }}
          />
        </motion.a>
        <motion.a 
          target="_blank" 
          href="https://www.linkedin.com/in/yuwen-lu/" 
          className="inline-block p-2"
          style={{ border: "none", cursor: "pointer", borderBottom: "none" }}
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <img 
            src={LinkedinIcon} 
            alt="LinkedIn"
            className={`transition-all duration-200 ${isDesktop ? "w-7" : "w-6"}`}
            style={{
              filter: 'brightness(0) saturate(100%) invert(100%)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(1500%) hue-rotate(320deg) brightness(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(100%)';
            }}
          />
        </motion.a>
      </div>
      <p className="text-base leading-6 opacity-80 max-w-md mx-auto">
        Last updated: June 2025
      </p>
    </div>
  )
} 