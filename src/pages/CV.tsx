import { Download } from 'lucide-react'

export const CV = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="title">Curriculum Vitae</h1>
        <p className="opacity-80 mb-8">
          Academic and professional experience in Human-Computer Interaction
        </p>
        <a 
          href="/src/resources/files/CV_Yuwen_Lu.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#E44C65] text-white px-6 py-3 rounded-lg hover:bg-[#d63850] transition-colors no-underline"
          style={{ borderBottom: "none" }}
        >
          <Download size={20} />
          Download CV
        </a>
      </div>
    </div>
  )
} 