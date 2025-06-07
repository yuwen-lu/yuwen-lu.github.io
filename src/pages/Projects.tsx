import { motion } from 'framer-motion'

export const Projects = () => {
  const projects = [
    {
      title: "Misty",
      description: "UI Prototyping Through Interactive Conceptual Blending",
      technologies: ["React", "TypeScript", "Machine Learning"],
      links: [
        { label: "GitHub", url: "https://github.com/ND-SaNDwichLAB/Misty" },
        { label: "Paper", url: "https://machinelearning.apple.com/research/interactive-prototyping" },
      ],
      image: "/placeholder-project.jpg"
    },
    // Add more projects here
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="title">Projects</h1>
        <p className="max-w-2xl mx-auto opacity-80">
          A collection of research projects and personal works in Human-Computer Interaction 
          and Human-AI Collaboration.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-hover rounded-lg overflow-hidden"
            style={{ 
              width: "25rem",
              height: "18rem",
              margin: "2rem auto"
            }}
          >
            <div 
              className="h-48 relative"
              style={{
                backgroundColor: "#A58BF0",
                opacity: "15%",
                borderRadius: "1rem",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }}
            ></div>
            <div 
              className="p-6 absolute inset-0 flex flex-col justify-between"
              style={{
                position: "relative",
                bottom: "18rem"
              }}
            >
              <div>
                <h3 className="text-lg font-light mb-2" style={{ fontSize: "1rem", lineHeight: "1.5rem", marginBottom: "1.5rem" }}>
                  {project.title}
                </h3>
                <p className="opacity-80 mb-4 text-sm">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 py-1 bg-white/10 rounded-full text-xs opacity-70"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                {project.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paper-link text-sm"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}