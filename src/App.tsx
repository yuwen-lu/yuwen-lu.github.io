import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Resume } from './pages/Resume'
import { Events } from './pages/Events'
import { GrainOverlay } from './components/GrainOverlay'

const ROUTE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'yuwen lu · human-ai interaction & design',
    description:
      'yuwen lu — creative ai research at contra labs. cs phd from notre dame. previously krea, midjourney, apple, and google.',
  },
  '/resume': {
    title: 'resume · yuwen lu',
    description: "yuwen lu's resume and academic cv.",
  },
  '/events': {
    title: 'events · yuwen lu',
    description: 'talks, conferences, milestones, and moves — a life timeline.',
  },
}

function usePageMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const meta = ROUTE_META[pathname] ?? ROUTE_META['/']
    document.title = meta.title
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', meta.description)
  }, [pathname])
}

function App() {
  usePageMeta()

  return (
    <div className="min-h-screen">

      <GrainOverlay />

      <Navigation />
      <main className="w-full px-1 sm:px-2 lg:px-8 py-4 lg:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/events" element={<Events />} />
        </Routes>
      </main>
      <Footer />
      <Analytics />
    </div>
  )
}

export default App
