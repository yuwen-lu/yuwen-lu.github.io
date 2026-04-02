import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/resume', label: 'Resume' },
    { path: '/events', label: 'Events' },
  ]

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  return (
    <nav style={{
      display: "flex",
      height: "10vh",
      padding: "2vw 4vw",
      alignItems: "center",
      justifyContent: "flex-end",
      position: "relative",
      zIndex: 100,
      width: "100%"
    }}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex geist-regular" style={{ position: "relative", zIndex: 100 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="nav-link"
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden" ref={buttonRef}>
        <motion.button
          onClick={toggleMenu}
          className="inline-flex items-center justify-center p-2 rounded-md text-nav hover:text-accent transition-colors geist-medium"
          aria-expanded={isMenuOpen}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 90, opacity: 1 }}
                exit={{ rotate: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3
            }}
            className="md:hidden absolute top-16 right-4 z-50 geist-regular"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-rule)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              padding: '1.5rem',
              minWidth: '160px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="nav-link block text-center py-3 px-4 rounded-lg transition-all duration-200 hover:bg-surface-hover"
                  style={{
                    margin: '0',
                    fontSize: '1rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    border: 'none'
                  }}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
} 