import { useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { useMediaQuery } from 'react-responsive'
import AOS from 'aos'
import 'aos/dist/aos.css'

export const Events = () => {
  // Initialize AOS animations
  useEffect(() => {
    AOS.init()
  }, [])

  // Responsiveness - hide left column if on phone
  const isNotPhone = useMediaQuery({
    query: '(min-width: 576px)'
  })

  const lifeEvents = [
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      {/* Title with original styling */}
      <div className="text-center mb-8">
        <h1 className="title inline-block" style={{ borderBottom: "#a1db08 2px solid" }}>
          Events
        </h1>
      </div>

      {/* Timeline using original Bootstrap-style layout */}
      <div>
        {/* Events with original AOS animations and connecting lines */}
        {lifeEvents.map((event, index) => (
          <div
            key={index}
            className={`grid grid-cols-12 ${event.spacer ? 'h-40' : ''}`}
            data-aos="fade-up"
            data-aos-offset="200"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out"
            style={{ minHeight: event.spacer ? '10rem' : isNotPhone ? '6rem' : '5rem' }}
          >
            {/* Left column: location icon and text with connecting line */}
            {isNotPhone && (
              <div 
                className="col-span-3 flex items-center justify-end"
                style={{ 
                  borderRight: "#a1db08 4px solid",
                  margin: "0",
                  padding: "0",
                  height: "100%"
                }}
              >
                {event.showLocation && !event.spacer && (
                  <div 
                    className="flex items-center text-right space-grotesk-regular"
                    style={{
                      paddingRight: "2rem",
                      position: "relative",
                      bottom: "1rem"
                    }}
                  >
                    <div className="mr-2">
                      <MapPin size={20} className="text-[#a1db08]" style={{ position: "relative", bottom: "4px" }} />
                    </div>
                    <span className="opacity-80" style={{ fontSize: "1rem" }}>{event.location}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Right column: date and content */}
            <div className={`${isNotPhone ? 'col-span-9' : 'col-span-12'} ${!event.spacer ? 'flex items-center' : ''}`} style={{ margin: "0", padding: "0", height: "100%" }}>
              {!event.spacer && (
                <div className={`${isNotPhone ? 'flex items-center' : 'block'} w-full`}>
                  {/* Date with bottom border line that connects to vertical line */}
                  {event.date && (
                    <div 
                      className={`${isNotPhone ? 'inline-block' : 'block mb-3'}`}
                      style={isNotPhone ? {
                        width: "10rem",
                        paddingLeft: "1rem",
                        borderBottom: "#a1db08 4px solid",
                        position: "relative",
                        bottom: "1rem"
                      } : {
                        paddingLeft: "1rem",
                        borderLeft: "#a1db08 3px solid",
                        paddingBottom: "0.5rem"
                      }}
                    >
                      <p 
                        className="space-grotesk-medium"
                        style={{
                          fontSize: isNotPhone ? "1rem" : "0.9rem",
                          margin: "0",
                          fontWeight: isNotPhone ? "500" : "500",
                          color: isNotPhone ? "inherit" : "#a1db08"
                        }}
                      >
                        {event.date}
                      </p>
                    </div>
                  )}
                  
                  {/* Empty date space for events without dates but still need layout - only on desktop */}
                  {!event.date && isNotPhone && (
                    <div style={{ width: "10rem" }}></div>
                  )}
                  
                  {/* Content */}
                  {event.content && (
                    <div 
                      className={`text-lg leading-relaxed space-grotesk-regular ${isNotPhone ? 'inline-block' : 'block'}`}
                      style={isNotPhone ? { 
                        margin: "0 0 0 1rem",
                        lineHeight: "2em",
                        position: "relative",
                        fontSize: "1.1rem"
                      } : {
                        margin: "0",
                        lineHeight: "1.6em",
                        paddingLeft: "1rem",
                        fontSize: "1rem"
                      }}
                    >
                      {event.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}