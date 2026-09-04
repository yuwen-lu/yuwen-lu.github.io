import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

const lifeEvents = [
    {
      date: "June 2026",
      location: "San Francisco, CA",
      showLocation: true,
      content: (
        <>
          Joined <a className='paper-link' target="_blank" href="https://contralabs.com/" rel="noopener noreferrer">Contra Labs</a> as Head of Research, leading work on human data and evaluation for creative AI
        </>
      )
    },
    {
      date: "May 2026",
      location: "Notre Dame, IN",
      showLocation: true,
      content: (
        <>
          Graduated from Notre Dame with a Ph.D.
        </>
      )
    },
    {
      date: "Mar 2026",
      location: "Notre Dame, IN",
      showLocation: true,
      content: (
        <>
          Defended my Ph.D. Thesis!
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    },
    {
      date: "May 2025",
      location: "San Francisco, CA",
      showLocation: true,
      content: (
        <>
          Started internship at Midjourney, working on AI-powered storytelling
        </>
      )
    },

    {
      date: "Apr 2025",
      location: "Yokohama, Japan",
      showLocation: true,
      content: (
        <>
          Attended CHI 2024 in Yokohama, presented the <a className='paper-link' target="_blank" href="https://machinelearning.apple.com/research/interactive-prototyping" rel="noopener noreferrer">Misty paper</a> and hosted a workshop on computational user interfaces
        </>
      )
    },
    {
      date: "Apr 2025",
      location: "Notre Dame, IN",
      showLocation: true,
      content: (
        <>
          Passed PhD thesis proposal and became a PhD candidate! <a className='paper-link' target="_blank" href="https://www.youtube.com/watch?v=_At0jvJ_N3A&pp=ygUIeXV3ZW4gbHU%3D" rel="noopener noreferrer">Watch the proposal talk</a>
        </>
      )
    },
    {
      date: "Apr 2025",
      location: "New York, NY",
      showLocation: true,
      content: (
        <>
          Gave a talk at Columbia University <a className='paper-link' target="_blank" href="https://ceal.cs.columbia.edu" rel="noopener noreferrer">CEAL lab</a>
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    },
    {
      date: "May 2024",
      location: "Seattle, WA",
      showLocation: true,
      content: (
        <>
          Summer internship at Apple AIML , built a tool called <a className='paper-link' target="_blank" href="https://machinelearning.apple.com/research/interactive-prototyping" rel="noopener noreferrer">Misty</a> that helps UI prototyping with AI
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    },
    {
      date: "Aug 2023",
      location: "Honolulu, HI",
      showLocation: true,
      content: (
        <>
          Attended the <a className='paper-link' target='_blank' href='https://icml.cc/virtual/2023/workshop/21491' rel="noopener noreferrer">AI & HCI workshop</a> at ICML 2023 in Hawaii
        </>
      )
    },
    {
      date: "June 2023",
      location: "Cambridge, MA",
      showLocation: true,
      content: (
        <>
          Summer internship at <a className='paper-link' target='_blank' href='https://material.io/' rel="noopener noreferrer">Google Material Design</a> on AI tools for design
        </>
      )
    },
    {
      date: "May 2023",
      location: "Hamburg, Germany",
      showLocation: true,
      content: (
        <>
          Attended CHI 2023 in Hamburg, organized <a className='paper-link' target='_blank' href='https://sites.google.com/nd.edu/computational-uichi23/home' rel="noopener noreferrer">another workshop</a> on computational approaches for UI
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    },
    {
      date: "Apr 2022",
      location: "Notre Dame, IN",
      showLocation: true,
      content: (
        <>
          First ever in-person conference <a href='https://chi2022.acm.org/' rel="noopener noreferrer">@CHI'22</a>,
          hosting a <a target='_blank' href="https://sites.google.com/nd.edu/computational-uichi22/home" rel="noopener noreferrer">workshop</a> and presenting a <a target='_blank' href="https://dl.acm.org/doi/10.1145/3491101.3519809" rel="noopener noreferrer">LBW poster</a>!
        </>
      )
    },
    {
      date: "Apr 2022",
      location: "Notre Dame, IN",
      showLocation: true,
      content: (
        <>
          Selected as a Lucy Scholar <br />
          at the <a href="https://lucyinstitute.nd.edu/" rel="noopener noreferrer">Lucy Institute</a>
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    },
    {
      date: "Aug 2021",
      location: "Notre Dame, IN",
      showLocation: true,
      content: (
        <>
          Moved to Notre Dame, <br />
          continuing my work in HCI and Human-AI Collaboration<br />
        </>
      )
    },
    {
      date: "Aug 2021",
      location: "Pittsburgh, PA",
      showLocation: true,
      content: (
        <>
          Graduated from MHCI, <br />
          second graduation during a pandemic 😅<br />
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    },
    {
      date: "Aug 2020",
      location: "Pittsburgh, PA",
      showLocation: true,
      content: (
        <>
          Left California,<br />
          Started grad school<br />
          MHCI @ Carnegie Mellon University<br />
        </>
      )
    },
    {
      date: "June 2020",
      location: "virtually in Dalian, China",
      showLocation: true,
      content: (
        <>
          Graduated from <br />
          Dalian University of Technology<br />
          during a pandemic! 👨‍🎓<br />
        </>
      )
    },
    {
      date: "Mar 2020",
      location: "",
      showLocation: false,
      content: (
        <>
          COVID-19 was officially declared<br />
          as pandemic by WHO<br />
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    },
    {
      date: "Dec 2019",
      location: "Irvine, CA",
      showLocation: true,
      content: (
        <>
          Started study abroad at<br />
          the University of California, Irvine<br />
        </>
      )
    },
    {
      date: "Oct 2019",
      location: "Boston, MA",
      showLocation: true,
      content: (
        <>
          Attended <a target="_blank" href="https://2019.igem.org/Main_Page" rel="noopener noreferrer">iGEM</a> as a member of<br />
          <a target="_blank" href="https://2019.igem.org/Team:DUT_China_A" rel="noopener noreferrer">DUT_China_A</a><br />
        </>
      )
    },
    {
      date: "",
      location: "Nantong, Jiangsu, China",
      showLocation: true,
      content: (
        <>
          Left Germany for China <br />
          <i>Home sweet home</i>
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    },
    {
      date: "Apr 2019",
      location: "Munich, Germany",
      showLocation: true,
      content: (
        <>
          Started study abroad at<br />
          Technical University of Munich
        </>
      )
    },
    {
      date: "Mar 2019",
      location: "New York, NY",
      showLocation: true,
      content: (
        <>
          Attended <a target="_blank" href="https://www.nmun.org/" rel="noopener noreferrer">National Model United Nations</a><br />
          as a member of the Dalian University <br /> of Technology delegation
        </>
      )
    },
    {
      date: "",
      location: "",
      showLocation: false,
      content: null,
      spacer: true
    }
]

export const Events = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      {/* Title with original styling */}
      <div className="text-center mb-8">
        <h1 className="title inline-block lowercase" style={{ borderBottom: "var(--color-accent) 2px solid" }}>
          events
        </h1>
      </div>

      {/* Timeline using original Bootstrap-style layout */}
      <div>
        {/* Events with scroll animations and connecting lines */}
        {lifeEvents.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`grid grid-cols-12 ${event.spacer ? 'h-40 min-h-40' : 'min-h-20 sm:min-h-24'}`}
          >
            {/* Left column: location icon and text with connecting line */}
            <div className="col-span-3 hidden h-full items-center justify-end border-r-4 border-accent sm:flex">
              {event.showLocation && !event.spacer && (
                <div className="geist-regular relative -top-4 flex items-center pr-8 text-right">
                  <div className="mr-2">
                    <MapPin size={20} className="relative -top-1 text-accent" />
                  </div>
                  <span className="text-base opacity-80">{event.location}</span>
                </div>
              )}
            </div>
            
            {/* Right column: date and content */}
            <div className={`col-span-12 h-full sm:col-span-9 ${!event.spacer ? 'flex items-center' : ''}`}>
              {!event.spacer && (
                <div className="block w-full sm:flex sm:items-center">
                  {/* Date with bottom border line that connects to vertical line */}
                  {event.date && (
                    <div className="mb-3 block border-l-[3px] border-accent pb-2 pl-4 sm:relative sm:-top-4 sm:mb-0 sm:inline-block sm:w-40 sm:border-b-4 sm:border-l-0 sm:pb-0">
                      <p className="geist-medium m-0 text-[0.9rem] font-medium text-accent sm:text-base sm:text-[inherit]">
                        {event.date}
                      </p>
                    </div>
                  )}
                  
                  {/* Empty date space for events without dates but still need layout - only on desktop */}
                  {!event.date && <div className="hidden w-40 sm:block" />}
                  
                  {/* Content */}
                  {event.content && (
                    <div className="geist-regular block pl-4 text-base leading-[1.6] sm:ml-4 sm:inline-block sm:p-0 sm:text-[1.1rem] sm:leading-[2]">
                      {event.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
