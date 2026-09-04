import { Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Resume } from './pages/Resume'
import { Events } from './pages/Events'
import { DotGridBackground } from './components/DotGridBackground'

function App() {
  return (
    <div className="min-h-screen">
      <DotGridBackground />
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
