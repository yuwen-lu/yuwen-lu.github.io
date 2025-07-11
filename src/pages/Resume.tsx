import { Download } from 'lucide-react'
import confetti from 'canvas-confetti'

export const Resume = () => {
  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault() // Prevent immediate navigation
    
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a1db08', '#8bc406', '#6ba104', '#ffffff', '#ffd700']
    })

    // Wait for confetti to be visible, then open the PDF
    setTimeout(() => {
      window.open('/files/CV_Yuwen_Lu.pdf', '_blank', 'noopener,noreferrer')
    }, 800) // 800ms delay to see the confetti
  }

  const handleResumeDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault() // Prevent immediate navigation
    
    // Trigger confetti animation with slightly different colors
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8bc406', '#a1db08', '#6ba104', '#ffffff', '#ffd700']
    })

    // Wait for confetti to be visible, then open the PNG
    setTimeout(() => {
      window.open('/files/resume-yuwen-lu.pdf', '_blank', 'noopener,noreferrer')
    }, 800) // 800ms delay to see the confetti
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      <div className="text-center mb-12">
        <h1 className="title">Resume</h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a 
            href="/files/resume-yuwen-lu.pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleResumeDownloadClick}
            className="inline-flex items-center gap-2 bg-[#a1db08] text-black px-6 py-3 rounded-lg hover:bg-[#8bc406] transition-colors no-underline"
            style={{ borderBottom: "none" }}
          >
            <Download size={20} />
            Resume (1 page)
          </a>
        </div>


        <p className="text-sm opacity-60 mt-20">
          3-page academic CV with more details
        </p>

        <a 
            href="/files/CV_Yuwen_Lu.pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownloadClick}
            className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors no-underline border border-white/20"
            style={{ borderBottom: "none" }}
          >
            <Download size={20} />
            Curriculum Vitae (3 pages)
          </a>
      </div>
    </div>
  )
}