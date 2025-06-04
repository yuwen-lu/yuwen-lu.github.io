import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

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
        <button
          onClick={toggleMenu}
          className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-[#E44C65] transition-colors"
          aria-expanded="false"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-[10vh] right-4 bg-black/80 backdrop-blur-md rounded-lg p-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="nav-link block text-center"
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
} 