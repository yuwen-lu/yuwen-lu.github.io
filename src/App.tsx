import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Resume } from './pages/Resume'
import { Events } from './pages/Events'
import { useGlobalParticleEffect, GlobalParticleEffect } from './components/GlobalParticleEffect'

function App() {
  const { clickEffects, handleGlobalClick } = useGlobalParticleEffect()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => handleGlobalClick(event)
    const handleTouch = (event: TouchEvent) => handleGlobalClick(event)

    document.addEventListener('click', handleClick)
    document.addEventListener('touchend', handleTouch)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchend', handleTouch)
    }
  }, [handleGlobalClick])

  return (
    <div className="min-h-screen">
      {/* Original blur blocks for background ambiance */}
      <div className="blur-block" id="blur-purple"></div>
      <div className="blur-block" id="blur-pink"></div>
      <div className="blur-block" id="blur-green"></div>
      <div className="blur-block" id="blur-yellow"></div>
      
      {/* Global particle effect */}
      <GlobalParticleEffect clickEffects={clickEffects} />
      
      <Navigation />
      <main className="w-full px-1 sm:px-2 lg:px-8 py-4 lg:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/events" element={<Events />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App 