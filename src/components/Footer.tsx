import { useState, useEffect } from 'react'
import { useMediaQuery } from 'react-responsive'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Check, Heart, Zap, AlertTriangle, Twitter, Github, Linkedin, X, Send } from 'lucide-react'
import confetti from 'canvas-confetti'

export const Footer = () => {
  const [showCopiedBanner, setShowCopiedBanner] = useState(false)
  const [showNudgeBanner, setShowNudgeBanner] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'stale' | 'outdated'>('healthy')
  const [isLoadingCommitDate, setIsLoadingCommitDate] = useState(true)
  const [lastCommitDate, setLastCommitDate] = useState<Date | null>(null)
  const [showMessagePopup, setShowMessagePopup] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // Responsiveness, break point at tablet --> desktop
  const isDesktop = useMediaQuery({
    query: '(min-width: 769px)'
  })

  // Calculate detailed time difference with rolling seconds
  const calculateDetailedTime = (commitDate: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - commitDate.getTime())
    
    const seconds = Math.floor(diffTime / 1000) % 60
    const minutes = Math.floor(diffTime / (1000 * 60)) % 60
    const hours = Math.floor(diffTime / (1000 * 60 * 60)) % 24
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) % 30
    const months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))

    const parts = []
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`)

    const timeString = parts.join(', ') + ' ago'
    return timeString
  }

  // Real-time update every second
  useEffect(() => {
    if (!lastCommitDate) return

    const interval = setInterval(() => {
      const detailedTime = calculateDetailedTime(lastCommitDate)
      setLastUpdated(detailedTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [lastCommitDate])

  // Fetch last commit date from GitHub API and calculate health status
  useEffect(() => {
    const fetchLastCommitDate = async () => {
      try {
        setIsLoadingCommitDate(true)
        const response = await fetch('https://api.github.com/repos/yuwen-lu/yuwen-lu.github.io/commits?per_page=1')
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`)
        }
        
        const commits = await response.json()
        
        if (commits && commits.length > 0) {
          const commitDate = new Date(commits[0].commit.committer.date)
          setLastCommitDate(commitDate)
          calculateHealthStatus(commitDate)
        } else {
          // Fallback to current date if no commits found
          const fallbackDate = new Date()
          setLastCommitDate(fallbackDate)
          calculateHealthStatus(fallbackDate)
        }
      } catch (error) {
        console.error('Failed to fetch last commit date:', error)
        // Fallback to current date if API fails
        const fallbackDate = new Date()
        setLastCommitDate(fallbackDate)
        calculateHealthStatus(fallbackDate)
      } finally {
        setIsLoadingCommitDate(false)
      }
    }

    const calculateHealthStatus = (commitDate: Date) => {
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - commitDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Determine health status
      if (diffDays <= 7) {
        setHealthStatus('healthy')
      } else if (diffDays <= 30) {
        setHealthStatus('stale')
      } else {
        setHealthStatus('outdated')
      }
    }

    fetchLastCommitDate()
  }, [])

  // Preset messages for different states
  const getPresetMessages = () => {
    switch (healthStatus) {
      case 'healthy':
        return [
          "ok you ate with this site fr",
          "good try but need more work",
          "🐞 report: this part sucked (tell me more below)",
          "slayyyy but who even are you",
        ]
      case 'stale':
        return [
          "yo wyd it's been a minute",
          "🐞 report: btw this part didn't work",
          "this site giving 2022",
          "🫠 update when???",
          "😭 dead site check"
        ]
      case 'outdated':
        return [
          "💀 naur this is criminal",
          "🚩 this site older than me fr",
          "respectfully... update or delete ⚰️"
        ]
    }
  }

  const getButtonText = () => {
    switch (healthStatus) {
      case 'healthy':
        return "Say hi?"
        case 'stale':
        return "Send nudge"
      case 'outdated':
        return "NUDGE YUWEN"
    }
  }

  const getButtonColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return "bg-[#a1db08] hover:bg-[#8bc406] text-black"
      case 'stale':
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case 'outdated':
        return "bg-red-500 hover:bg-red-600 animate-pulse text-white"
    }
  }

  const handleSendMessage = async () => {
    const messageToSend = customMessage || selectedPreset
    if (!messageToSend.trim() || isSendingMessage) return

    setIsSendingMessage(true)

    try {
      // Placeholder - no actual sending logic for now
      console.log('Message would be sent:', messageToSend)
      console.log('Message type:', healthStatus)
      
      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Trigger confetti based on message type
      const colors = healthStatus === 'healthy' 
        ? ['#3b82f6', '#10b981'] 
        : healthStatus === 'stale' 
        ? ['#f59e0b', '#ef4444'] 
        : ['#ef4444', '#dc2626']
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors
      })

      // Show success banner
      setShowNudgeBanner(true)
      setTimeout(() => {
        setShowNudgeBanner(false)
      }, 3000)

      // Close popup and reset
      setShowMessagePopup(false)
      setCustomMessage('')
      setSelectedPreset('')
      setContactInfo('')

    } catch (error) {
      console.error('Placeholder error:', error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('ylu23@nd.edu')
      
      // Trigger smaller confetti! 🎉
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.9 }, // Launch from bottom area
        colors: ['#a1db08', '#A58BF0']
      })
      
      setShowCopiedBanner(true)
      setTimeout(() => {
        setShowCopiedBanner(false)
      }, 2500)
    } catch (err) {
      console.error('Failed to copy email: ', err)
    }
  }

  const getHealthIcon = () => {
    // Icons removed to match debug section
    return null
  }

  const getHealthText = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'up-to-date'
      case 'stale':
        return 'getting stale'
      case 'outdated':
        return 'needs some love'
    }
  }

  const getHealthColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'text-[#a1db08]'
      case 'stale':
        return 'text-yellow-400'
      case 'outdated':
        return 'text-red-400'
    }
  }

  return (
    <div className="text-center mt-40 px-4 sm:px-6 lg:px-8 space-grotesk-regular mb-20">
      {/* Message Popup Modal */}
      <AnimatePresence>
        {showMessagePopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
              onClick={() => setShowMessagePopup(false)}
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                className="bg-gray-900 p-6 rounded-lg shadow-2xl z-50 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white space-grotesk-medium">
                    {healthStatus === 'healthy' ? 'Introduce Yourself' : 'Send a Nudge'}
                  </h3>
                  <button
                    onClick={() => setShowMessagePopup(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Preset Messages */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quick Options:
                  </label>
                  <div className="space-y-2">
                    {getPresetMessages().map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPreset(preset)}
                        className={`w-full text-left p-2 rounded text-sm transition-colors ${
                          selectedPreset === preset
                            ? 'bg-[#a1db08] text-black'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Message */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Say more
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={selectedPreset.includes("🐞 report") ? "bugggs help me zap them" : "Add a custom message here..."}
                    className="w-full p-3 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:border-[#a1db08] focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* Contact Info */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    How should I keep in touch? (optional)
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="email, twitter, etc..."
                    className="w-full p-3 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:border-[#a1db08] focus:outline-none"
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!customMessage.trim() && !selectedPreset) || isSendingMessage}
                  className={`w-full py-2 px-4 rounded font-medium flex items-center justify-center gap-2 transition-colors ${
                    (customMessage.trim() || selectedPreset) && !isSendingMessage
                      ? getButtonColor() + ' text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSendingMessage ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
            className="fixed bottom-6 left-0 right-0 mx-auto w-fit z-50 bg-[#a1db08] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 space-grotesk-medium"
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

      {/* Message sent banner */}
      <AnimatePresence>
        {showNudgeBanner && (
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
            className="fixed bottom-6 left-0 right-0 mx-auto w-fit z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 space-grotesk-medium"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 0.6,
                ease: "easeInOut"
              }}
            >
              <Send size={16} />
            </motion.div>
            <span className="text-sm font-medium">Message sent to Yuwen! 📨</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <p className="mb-6 text-lg space-grotesk-medium">Contact</p>
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
            className="text-white hover:text-[#a1db08] transition-colors"
          />
        </motion.button>
        <motion.button 
          onClick={() => window.open("https://twitter.com/yuwen_lu_", "_blank", "noopener,noreferrer")}
          className="inline-block cursor-pointer bg-transparent border-none p-2"
          title="Visit Twitter profile"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ cursor: "pointer" }}
        >
          <Twitter 
            size={isDesktop ? 28 : 24} 
            className="text-white hover:text-[#a1db08] transition-colors"
          />
        </motion.button>
        <motion.button 
          onClick={() => window.open("https://github.com/yuwen-lu/", "_blank", "noopener,noreferrer")}
          className="inline-block cursor-pointer bg-transparent border-none p-2"
          title="Visit GitHub profile"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ cursor: "pointer" }}
        >
          <Github 
            size={isDesktop ? 28 : 24} 
            className="text-white hover:text-[#a1db08] transition-colors"
          />
        </motion.button>
        <motion.button 
          onClick={() => window.open("https://www.linkedin.com/in/yuwen-lu/", "_blank", "noopener,noreferrer")}
          className="inline-block cursor-pointer bg-transparent border-none p-2"
          title="Visit LinkedIn profile"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ cursor: "pointer" }}
        >
          <Linkedin 
            size={isDesktop ? 28 : 24} 
            className="text-white hover:text-[#a1db08] transition-colors"
          />
        </motion.button>
      </div>
      
      {/* Updated footer with health status and detailed time */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 text-base opacity-80">
          {isLoadingCommitDate ? (
            <span className="space-grotesk-regular">Loading last update...</span>
          ) : (
            <span className="space-grotesk-regular font-mono text-sm">
              <span className="text-[#a1db08] font-medium">Last updated</span> {lastUpdated}
            </span>
          )}
        </div>
        
        {!isLoadingCommitDate && (
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${getHealthColor()}`}>
              {getHealthIcon()}
              <span className="text-sm space-grotesk-regular">{getHealthText()}</span>
            </div>
            
            <motion.button
              onClick={() => setShowMessagePopup(true)}
              className={`${getButtonColor()} px-4 py-2 rounded-full text-sm space-grotesk-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#a1db08] focus:ring-offset-2 focus:ring-offset-gray-900`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`${getButtonText()} - Send a message to Yuwen`}
            >
              {getButtonText()}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
} 