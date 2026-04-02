import { motion } from 'framer-motion'
import MistyPic from '../resources/images/misty.png'
import DarkPitaPic from '../resources/images/dark_pita_dalle.png'
import CHIWORK2022Pic from '../resources/images/CHIWORK22_approach.png'
import CHI2022WorkshopPic from '../resources/images/user-interface-workshop.jpeg'
import Lbw2022Pic from '../resources/images/chi-lbw-2022.png'
import Chi2022LbwPoster from '../resources/files/LBW CHI2022/Poster_YuwenLu_LBWCHI2022.pdf'
import { useMediaQuery } from 'react-responsive'
import { ProfileInteractive } from '../components/ProfileInteractive'
import { PublicationCard } from '../components/PublicationCard'
import FlowyPic from '../resources/images/flowy_card.png'
import CrepePic from '../resources/images/crepe.png'
export const Home = () => {
  // Responsiveness
  const isDesktop = useMediaQuery({
    query: "(min-width: 769px)",
  })

  const publications = [
    {
      title: "Misty: UI Prototyping Through Interactive Conceptual Blending",
      // authors: "Yuwen Lu, Alan Leung, Amanda Swearngin, Jeffrey Nichols, Titus Barik",
      conference: "CHI 2025",
      note: "Work done during internship at Apple AIML",
      links: [
        { label: "Paper", url: "https://machinelearning.apple.com/research/interactive-prototyping" },
        { label: "Code", url: "https://github.com/ND-SaNDwichLAB/Misty" },
        { label: "Video", url: "https://x.com/yuwen_lu_/status/1850574331539276198" },
      ],
      image: MistyPic,
      isSystemPaper: true
    },
    {
      title: "Dark Pita: Exploring End-User Interventions for Dark Patterns in UX",
      // authors: "Yuwen Lu*, Chao Zhang*, Yuewen Yang, Yaxing Yao, Toby Jia-Jun Li (* equal contribution)",
      conference: "CSCW 2024",
      award: "🏆 Best Paper Award (Top 1%)",
      note: "Image generated with DALL-E 2",
      links: [
        { label: "Paper", url: "https://dl.acm.org/doi/10.1145/3637336" },
        { label: "Code", url: "https://github.com/yuwen-lu/dark-pita" },
      ],
      image: DarkPitaPic,
      isSystemPaper: true
    },
    {
      title: "Flowy: Supporting UX Design Decisions With AI",
      authors: "Yuwen Lu, Ziang Tong, Qinyi Zhao, Yewon Oh, Bryan Wang, Toby Jia-Jun Li",
      note: "Use AI to meaningfully support design decisions",
      links: [
        { label: "Preprint", url: "https://arxiv.org/abs/2406.16177" },
        { label: "Demo", url: "https://flowy.design" },
      ],
      image: FlowyPic,
      isSystemPaper: true
    },
    {
      title: "Crepe: Mobile Screen Data Collector",
      authors: "Yuwen Lu, Meng Chen, Qi Zhao, Victor Cox, Yang Yang, Meng Jiang, Jay Brockman, Tamara Kay, Toby Jia-Jun Li",
      conference: "CHI 2026",
      award: "🏅 Honorable Mention Award (Top 5%)",
      slotLead: "Collecting mobile screen data for personalized AI agents",
      links: [
        { label: "Paper", url: "https://arxiv.org/abs/2406.16173" },
        { label: "Website", url: "https://crepe-website.vercel.app" },
      ],
      image: CrepePic,
      isSystemPaper: true
    },
    {
      title: "Using AI Agents To Empower Gig Workers against AI Inequality",
      authors: "Toby Jia-Jun Li, Yuwen Lu, Jaylexia Clark, Meng Chen, Victor Cox, Meng Jiang, Yang Yang, Tamara Kay, Danielle Wood, Jay Brockman",
      conference: "CHIWORK '22",
      note: "",
      links: [
        { label: "Paper", url: "https://dl.acm.org/doi/10.1145/3533406.3533418" },
        { label: "Video", url: "https://youtu.be/8zCOj9G3I_o" },
      ],
      image: CHIWORK2022Pic
    },
    {
      title: "Computational Approaches for User Interfaces",
      authors: "Yue Jiang*, Yuwen Lu*, Jeffrey Nichols, Wolfgang Stuerzlinger, Chun Yu, Christof Lutteroth, Yang Li, Ranjitha Kumar, Toby Jia-Jun Li (* equal contribution)",
      conference: "CHI '22 Workshop",
      note: "",
      links: [
        { label: "Paper", url: "https://yuejiang-nj.github.io/Publications/2022CHI_UserInterfaces/paper.pdf" },
        { label: "Workshop Website", url: "https://sites.google.com/nd.edu/computational-uichi22/home" },
      ],
      image: CHI2022WorkshopPic
    },
    {
      title: "Bridging the Gap Between UX Practitioners' Work Practices and AI-Enabled Design Support Tools",
      authors: "Yuwen Lu, Chengzhi Zhang, Iris Zhang, and Toby Jia-Jun Li",
      conference: "CHI '22 Late-Breaking Work",
      note: "",
      links: [
        { label: "Poster", url: Chi2022LbwPoster },
        { label: "Paper", url: "https://dl.acm.org/doi/10.1145/3491101.3519809" },
        { label: "Video", url: "https://www.youtube.com/watch?v=TJ16TIe29xw" },
      ],
      image: Lbw2022Pic
    }
  ]

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      {/* Hero Section - Original Bootstrap layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="grid lg:grid-cols-5 gap-4 lg:gap-16 items-center mb-4 lg:mb-64 max-lg:pt-1"
        style={{ marginTop: isDesktop ? "1rem" : 0 }}
      >
        <div className="space-y-6 lg:space-y-10 order-2 lg:order-1 lg:col-span-3">
          <div className="space-y-5 lg:space-y-4">
            <p className="geist-regular" style={{ fontSize: isDesktop ? "1.4rem" : "1.2rem", lineHeight: "1.5", letterSpacing: "-0.01em" }}>
              I am Yuwen, a Ph.D. Candidate in Computer Science and Engineering at the University of Notre Dame.
              I am a design engineer doing research in Human-AI Interaction. My advisor is{" "}
              <a href="https://toby.li/">Toby Li</a>.
            </p>
            <p className="geist-regular" style={{ fontSize: isDesktop ? "1.4rem" : "1.2rem", lineHeight: "1.5", letterSpacing: "-0.01em" }}>
              I explore user interfaces for AI. I build tools that{' '}
              <a
                href="https://machinelearning.apple.com/research/interactive-prototyping"
                target="_blank"
                rel="noopener noreferrer"
              >
                go beyond prompting {' '}
              </a>
              for UI prototyping, AI that{' '}
              <a href="https://arxiv.org/abs/2406.16177" target="_blank" rel="noopener noreferrer">
                supports design decision making
              </a>
              , and{' '}
              <a href="https://dl.acm.org/doi/10.1145/3637336" target="_blank" rel="noopener noreferrer">
                a browser extension
              </a>{' '}
              that supports users against dark patterns.
            </p>
            <p className="geist-regular" style={{ fontSize: isDesktop ? "1.4rem" : "1.2rem", lineHeight: "1.5", letterSpacing: "-0.01em" }}>
              Worked at{" "}
              <a href="https://www.krea.ai" target="_blank" rel="noopener noreferrer">
                Krea
              </a>{" "}
              (Design Engineer),{" "}
              <a href="https://www.midjourney.com" target="_blank" rel="noopener noreferrer">
                Midjourney
              </a>{" "}
              (Visiting Researcher),{" "}
              <a href="https://machinelearning.apple.com/research/interactive-prototyping" target="_blank" rel="noopener noreferrer">
                Apple
              </a>{" "}
              (AIML Research Intern), and{" "}
              <a href="https://m3.material.io" target="_blank" rel="noopener noreferrer">
                Google
              </a>{" "}
              (Student Researcher).
            </p>
          </div>
        </div>

        <ProfileInteractive />
      </motion.div>

      {/* Thesis proposal */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8 lg:mb-16 mt-6 lg:mt-16"
      >
        <div className="max-w-4xl mx-auto">
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="text-center lg:text-left mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl mb-2 lg:mb-4 geist-medium"
                  style={{ 
                    fontSize: isDesktop ? "1.8rem" : "1.4rem", 
                    lineHeight: "1.3",
                    letterSpacing: "-0.01em"
                  }}>
                Watch My Thesis Proposal
              </h2>
              <p className="geist-regular" 
                 style={{ 
                   fontSize: isDesktop ? "1rem" : "0.9rem", 
                   lineHeight: "1.6", 
                   opacity: 0.8
                 }}>
                April 2025. A summary of my previous research in user interfaces and human-AI interaction.
              </p>
            </div>
            
            <div className="w-full">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                  src="https://www.youtube.com/embed/_At0jvJ_N3A"
                  title="Thesis Proposal - Human-AI Interaction Research"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    border: 'none',
                    borderRadius: '12px'
                  }}
                />
              </div>
            </div>
          </motion.section>
        </div>
      </motion.div>

      {/* Publications Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8 lg:mb-16"
      >
        <div className="text-center mb-4 lg:mb-8">
          <h2 className="text-xl lg:text-2xl mb-4 lg:mb-6 geist-regular"
              style={{ 
                fontSize: isDesktop ? "2rem" : "1.6rem", 
                lineHeight: "1.3",
                letterSpacing: "-0.01em"
              }}>
            Publications
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 lg:px-8">
          {publications.map((pub, index) => (
            <PublicationCard
              key={index}
              title={pub.title}
              authors={pub.authors}
              conference={pub.conference}
              award={pub.award}
              slotLead={'slotLead' in pub ? pub.slotLead : undefined}
              note={pub.note}
              links={pub.links}
              image={pub.image}
              isSystemPaper={pub.isSystemPaper}
            />
          ))}
        </div>
      </motion.section>
    </div>
  )
} 