import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/cv', label: 'CV' },
    { path: '/events', label: 'Events' },
  ]

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <nav style={{ 
      display: "flex", 
      height: "10vh", 
      padding: "4vw", 
      alignItems: "center", 
      justifyContent: "flex-end" 
    }}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex">
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
      <div className="md:hidden">
        <motion.button
          onClick={toggleMenu}
          className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-[#E44C65] transition-colors"
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
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="md:hidden absolute top-16 right-4 z-50"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              padding: '1.5rem',
              minWidth: '160px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="space-y-1">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  <NavLink
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="nav-link block text-center py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-sm"
                    style={{
                      margin: '0',
                      fontSize: '1rem',
                      fontWeight: '400',
                      textDecoration: 'none',
                      border: 'none',
                      mixBlendMode: 'difference'
                    }}
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>
            
            {/* Decorative elements */}
            <div 
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full opacity-20"
              style={{
                background: 'linear-gradient(45deg, #E44C65, #A58BF0)',
                filter: 'blur(8px)'
              }}
            />
            <div 
              className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full opacity-15"
              style={{
                background: 'linear-gradient(45deg, #A58BF0, #f8b6f2)',
                filter: 'blur(6px)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
} 