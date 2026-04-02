import { Download } from 'lucide-react'
import confetti from 'canvas-confetti'

export const Resume = () => {
  const handleDownloadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7C6C2B', '#A89545', '#655723', '#E8E2D8', '#D4C98A']
    })

    setTimeout(() => {
      window.open('/files/CV_Yuwen_Lu.pdf', '_blank', 'noopener,noreferrer')
    }, 800)
  }

  const handleResumeDownloadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#A89545', '#7C6C2B', '#655723', '#E8E2D8', '#D4C98A']
    })

    setTimeout(() => {
      window.open('/files/resume-yuwen-lu.pdf', '_blank', 'noopener,noreferrer')
    }, 800)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      <div className="text-center mb-12">
        <h1 className="title">Resume</h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            type="button"
            onClick={handleResumeDownloadClick}
            className="inline-flex items-center gap-2 bg-button text-white px-6 py-3 rounded-lg hover:bg-button-hover transition-colors no-underline"
          >
            <Download size={20} />
            Resume (1 page)
          </button>
        </div>


        <p className="text-sm opacity-60 mt-20">
          3-page academic CV with more details
        </p>

        <button
            type="button"
            onClick={handleDownloadClick}
            className="inline-flex items-center gap-2 bg-surface text-primary px-6 py-3 rounded-lg hover:bg-surface-hover transition-colors no-underline border border-rule"
          >
            <Download size={20} />
            Curriculum Vitae (3 pages)
          </button>
      </div>
    </div>
  )
}