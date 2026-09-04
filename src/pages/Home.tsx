import { motion } from 'framer-motion'
import MistyPic from '../resources/images/misty.png'
import DarkPitaPic from '../resources/images/dark_pita_dalle.png'
import CHIWORK2022Pic from '../resources/images/CHIWORK22_approach.png'
import CHI2022WorkshopPic from '../resources/images/user-interface-workshop.jpeg'
import Lbw2022Pic from '../resources/images/chi-lbw-2022.png'
import Chi2022LbwPoster from '../resources/files/LBW CHI2022/Poster_YuwenLu_LBWCHI2022.pdf'
import { ProfileInteractive } from '../components/ProfileInteractive'
import { PublicationCard } from '../components/PublicationCard'
import FlowyPic from '../resources/images/flowy_card.png'
import CrepePic from '../resources/images/crepe.png'

const heroNameClass =
  'text-4xl sm:text-5xl md:text-[3.2rem] leading-[1.15] tracking-tight text-[var(--color-text)] lowercase'

const heroBodyClass =
  'geist-regular text-[1.1rem] sm:text-[1.15rem] md:text-[1.25rem] leading-[1.5] tracking-[-0.01em] text-[var(--color-text)]'

const publications = [
    {
      title: "Crepe: Mobile Screen Data Collector",
      authors: "Yuwen Lu, Meng Chen, Qi Zhao, Victor Cox, Yang Yang, Meng Jiang, Jay Brockman, Tamara Kay, Toby Jia-Jun Li",
      conference: "CHI 2026",
      award: "🏅 Honorable Mention Award (Top 5%)",
      links: [
        { label: "Paper", url: "https://arxiv.org/abs/2406.16173" },
        { label: "Website", url: "https://crepe-website.vercel.app" },
      ],
      image: CrepePic,
      isSystemPaper: true
    },
    {
      title: "Misty: UI Prototyping Through Interactive Conceptual Blending",
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
      title: "Workshop: Computational Approaches for User Interfaces",
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

export const Home = () => {
  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      {/* Hero */}
      <motion.section
        id="hero"
        aria-label="Introduction"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="pt-8 md:pt-16 lg:pt-20 pb-12 md:pb-24 lg:pb-28"
      >
        <div className="grid lg:grid-cols-5 gap-4 lg:gap-16 items-center lg:mt-0">
          <div className="space-y-6 lg:space-y-6 order-2 lg:order-1 lg:col-span-3">
            <div className="space-y-5 lg:space-y-4">
              <div className="space-y-4">
                <h1 className={`${heroNameClass} geo`}>yuwen lu</h1>
                <br />
                <p className={`${heroBodyClass} mb-0`}>
                  Head of Research at{" "}
                  <a
                    href="https://contralabs.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contra Labs
                  </a>
                  <br />
                  Human data and evaluation for creative AI
                  <br />
                  <br />
                </p>
                <p className={`${heroBodyClass} mb-0`}>
                  I am a design engineer doing research in human-AI interaction.
                  I recently
                  completed my Ph.D. in Computer Science at{" "}
                  <a href="https://www.nd.edu/" target="_blank" rel="noopener noreferrer">
                    Notre Dame
                  </a>. My
                  PhD work focused on:
                </p>
              </div>
              <div className="space-y-2">
                <ul
                  className="geist-regular mb-0 list-disc space-y-2 pl-5 text-[1.1rem] leading-[1.5] tracking-[-0.01em] sm:pl-6 md:text-[1.25rem]"
                >
                  <li>
                    <a
                      href="https://machinelearning.apple.com/research/interactive-prototyping"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      go beyond prompting
                    </a>
                    {" "}for UI prototyping
                  </li>
                  <li>
                    AI that{" "}
                    <a href="https://arxiv.org/abs/2406.16177" target="_blank" rel="noopener noreferrer">
                      helps with design decision making
                    </a>
                  </li>
                  <li>
                    <a href="https://dl.acm.org/doi/10.1145/3637336" target="_blank" rel="noopener noreferrer">
                      a browser extension
                    </a>
                    {" "}that supports users against dark patterns
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <ProfileInteractive />
        </div>
      </motion.section>

      {/* Publications Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8 lg:mb-16"
      >
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="geist-regular mb-0 text-[1.6rem] leading-[1.3] tracking-[-0.01em] lowercase md:text-[2rem]">
            publications
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {publications.map((pub) => (
            <PublicationCard
              key={pub.title}
              title={pub.title}
              authors={pub.authors}
              conference={pub.conference}
              award={pub.award}
              slotLead={'slotLead' in pub ? (pub.slotLead as string) : undefined}
              note={pub.note}
              links={pub.links}
              image={pub.image}
              isSystemPaper={pub.isSystemPaper}
            />
          ))}
        </div>
      </motion.section>

      {/* Thesis proposal */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8 lg:mb-16 mt-10 lg:mt-14"
      >
        <div className="w-full max-w-3xl mx-auto">
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="text-center mb-4 lg:mb-6">
              <h2
                className="geist-medium mb-2 text-[1.4rem] leading-[1.3] tracking-[-0.01em] lowercase md:text-[1.8rem] lg:mb-4"
              >
                watch my thesis proposal
              </h2>
              <p
                className="geist-regular text-[0.9rem] leading-[1.6] opacity-80 md:text-[1rem]"
              >
                April 2025. A summary of my previous research in user interfaces and human-AI interaction.
              </p>
            </div>

            <div className="w-full">
              <div className="relative aspect-video w-full">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                  src="https://www.youtube.com/embed/_At0jvJ_N3A"
                  title="Thesis Proposal - Human-AI Interaction Research"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </motion.section>
        </div>
      </motion.div>
    </div>
  )
}
