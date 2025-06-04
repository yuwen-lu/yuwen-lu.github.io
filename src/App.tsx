import { Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { CV } from './pages/CV'
import { Events } from './pages/Events'

function App() {
  return (
    <div className="min-h-screen">
      {/* Original blur blocks for background ambiance */}
      <div className="blur-block" id="blur-purple"></div>
      <div className="blur-block" id="blur-pink"></div>
      <div className="blur-block" id="blur-green"></div>
      <div className="blur-block" id="blur-yellow"></div>
      
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cv" element={<CV />} />
          <Route path="/events" element={<Events />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App 