import React from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
// import Particles from 'react-particles-js';
import Particles from "react-tsparticles";
import { Container, Row, Col } from 'react-bootstrap';
import { useMediaQuery } from 'react-responsive';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import '../App.css';
import ProfilePic from '../resources/images/personal-profile.jpg';
import { isElementOfType } from 'react-dom/test-utils';

// Functional Component for homepage

export default function Home() {
    // the animate on scroll library to animate items on home page
    AOS.init();

    // responsiveness
    const isDesktop = useMediaQuery({
        query: '(min-width: 769px)'
    });

    console.log(isDesktop);
    return (
        <React.Fragment>
            <Header />
            {/* Container component from react-bootstrap, wrapping around Rows and Cols for responsive layout */}
            <Container>
                <Row 
                    id="introduction" 
                    style={rowStyle} 
                    // add animation on scroll effects
                    data-aos="fade-in" 
                    data-aos-duration="1000"
                    data-aos-easing="ease-in-out">
                    {/* style attribute: choose style sheets accordingly for different responsive layout */}
                    <Col className="text-column" style={isDesktop ? introductionDesktopStyle : introductionNotDesktopStyle} lg={6} md={10} sm={10}>
                        <p className="title">Hi there! I'm Yuwen.</p>
                        <p>I am a <a target="_blank" href={"https://www.hcii.cmu.edu/academics/mhci"}>Master of Human-Computer Interaction</a> student at Human-Computer Interaction Institute, Carnegie Mellon University.</p>
                        <p>I'm an aspired Social Media researcher and UX practitioner.</p>
                        <p>Jump to my <Link to="/projects">Projects</Link> or my <Link to="/resume">Resume</Link>.</p>
                    </Col>
                    <Col className="profile-pic-container" style={profilePicContainerStyle} lg={6} md={10} sm={10}>
                        <img className="profile-pic" style={isDesktop ? profilePicDesktopStyle : profilePicNotDesktopStyle} src={ProfilePic} alt="Me"></img>
                    </Col>
                </Row>
                <Row 
                    id="experience" 
                    style={rowStyle, contentRowStyle} 
                    data-aos="fade-up"
                    data-aos-offset="200"
                    data-aos-duration="1000"
                    data-aos-easing="ease-in-out">
                    <Col id="skill-cloud" style={iconCloudStyle} lg={6} md={10} sm={10}>
                        {/* particles using tsparticles library */}
                        <Particles
                            height="15rem"
                            options={{
                                    "autoPlay": true,
                                    "detectRetina": true,
                                    "fpsLimit": 30,
                                    "infection": {
                                        "cure": false,
                                        "delay": 0,
                                        "enable": false,
                                        "infections": 0,
                                        "stages": []
                                    },
                                    "interactivity": {
                                        "detectsOn": "canvas",
                                        "events": {
                                            "onClick": {
                                            "enable": true,
                                            "mode": "push"
                                            },
                                            "onDiv": {
                                                "selectors": [],
                                                "enable": false,
                                                "mode": [],
                                                "type": "circle"
                                            },
                                            "onHover": {
                                                "enable": true,
                                                "mode": "repulse",
                                                "parallax": {
                                                    "enable": false,
                                                    "force": 60,
                                                    "smooth": 10
                                            }
                                            },
                                            "resize": true
                                        },
                                        "modes": {
                                            "attract": {
                                                "distance": 200,
                                                "duration": 0.4,
                                                "speed": 1
                                            },
                                            "bounce": {
                                                "distance": 200
                                            },
                                            "bubble": {
                                                "distance": 400,
                                                "duration": 2,
                                                "opacity": 0.8,
                                                "size": 40
                                            },
                                            "connect": {
                                                "distance": 80,
                                                "links": {
                                                    "opacity": 0.5
                                                },
                                                "radius": 60
                                            },
                                            "grab": {
                                                "distance": 400,
                                                "links": {
                                                    "blink": false,
                                                    "consent": false,
                                                    "opacity": 1
                                                }
                                            },
                                            "light": {
                                                "area": {
                                                    "gradient": {
                                                        "start": {
                                                            "value": "#ffffff"
                                                        },
                                                        "stop": {
                                                            "value": "#000000"
                                                        }
                                                    },
                                                    "radius": 1000
                                                },
                                                "shadow": {
                                                    "color": {
                                                        "value": "#000000"
                                                    },
                                                    "length": 2000
                                                }
                                            },
                                            "push": {
                                                "quantity": 4
                                            },
                                            "remove": {
                                                "quantity": 2
                                            },
                                            "repulse": {
                                                "distance": 100,
                                                "duration": 0.6,
                                                "speed": 1
                                            },
                                            "slow": {
                                                "factor": 3,
                                                "radius": 200
                                            },
                                            "trail": {
                                                "delay": 1,
                                                "quantity": 1
                                            }
                                        }
                                    },
                                    "manualParticles": [],
                                    "motion": {
                                        "disable": false,
                                        "reduce": {
                                            "factor": 4,
                                            "value": false
                                        }
                                    },
                                    "particles": {
                                        "color": {
                                            "value": "#ffffff",
                                            "animation": {
                                                "enable": false,
                                                "speed": 1,
                                                "sync": true
                                            }
                                        },
                                        "collisions": {
                                            "bounce": {
                                                "horizontal": {
                                                    "random": {
                                                    "enable": false,
                                                    "minimumValue": 0.1
                                                },
                                                "value": 1
                                            },
                                            "vertical": {
                                                "random": {
                                                    "enable": false,
                                                    "minimumValue": 0.1
                                                },
                                                "value": 1
                                            }
                                            },
                                            "enable": true,
                                            "mode": "bounce"
                                        },
                                        "move": {
                                            "angle": {
                                                "offset": 45,
                                                "value": 90
                                            },
                                            "attract": {
                                                "enable": false,
                                                "rotate": {
                                                    "x": 600,
                                                    "y": 1200
                                                }
                                            },
                                            "direction": "none",
                                            "distance": 0,
                                            "enable": true,
                                            "gravity": {
                                                "acceleration": 9.81,
                                                "enable": false,
                                                "maxSpeed": 50
                                            },
                                            "noise": {
                                                "delay": {
                                                    "random": {
                                                    "enable": false,
                                                    "minimumValue": 0
                                                    },
                                                    "value": 0
                                                },
                                                "enable": false
                                            },
                                            "outModes": {
                                                "default": "out",
                                                "bottom": "out",
                                                "left": "out",
                                                "right": "out",
                                                "top": "out"
                                            },
                                            "random": false,
                                            "size": false,
                                            "speed": 2,
                                            "straight": false,
                                            "trail": {
                                                "enable": false,
                                                "length": 10,
                                                "fillColor": {
                                                    "value": "#000000"
                                                }
                                            },
                                            "vibrate": false,
                                            "warp": false
                                        },
                                        "number": {
                                            "density": {
                                                "enable": true,
                                                "area": 800,
                                                "factor": 1000
                                            },
                                            "limit": 0,
                                            "value": 40
                                        },
                                        "opacity": {
                                            "random": {
                                            "enable": false,
                                            "minimumValue": 0.1
                                            },
                                            "value": 0.5,
                                            "animation": {
                                            "enable": true,
                                            "minimumValue": 0.1,
                                            "speed": 1,
                                            "sync": false
                                            }
                                        },
                                        "reduceDuplicates": true,
                                        "rotate": {
                                            "random": {
                                            "enable": false,
                                            "minimumValue": 0
                                            },
                                            "value": 0,
                                            "animation": {
                                            "enable": false,
                                            "speed": 0,
                                            "sync": false
                                            },
                                            "direction": "clockwise",
                                            "path": false
                                        },
                                        "shadow": {
                                            "blur": 0,
                                            "color": {
                                            "value": "#000000"
                                            },
                                            "enable": false,
                                            "offset": {
                                            "x": 0,
                                            "y": 0
                                            }
                                        },
                                        "shape": {
                                            "options": {
                                                "character": {
                                                    // content of the particle nodes
                                                    "value": [
                                                        "Design",
                                                        "Programming",
                                                        "Research",
                                                        "Contextual Inquiry",
                                                        "Usability Heuristics",
                                                        "Human-Centered",
                                                        "Agile Development",
                                                        "Think Aloud",
                                                        "Speed Dating",
                                                        "Storyboard",
                                                        "Physical Prototype",
                                                        "Figma",
                                                        "Indesign",
                                                        "React",
                                                        "JavaScript",
                                                        "Python",
                                                        "HTML",
                                                        "CSS",
                                                        "Sentiment Analysis",
                                                        "VADER",
                                                        "LIWC"
                                                    ],
                                                    "font": "Roboto",
                                                    "style": "",
                                                    "weight": "400",
                                                    "fill": true
                                                },
                                            },
                                            "type": "char"
                                        },
                                        "size": {
                                            "random": {
                                            "enable": false,
                                            "minimumValue": 1
                                            },
                                            "value": 10,
                                        },
                                    },
                                    "pauseOnBlur": true,
                                    "pauseOnOutsideViewport": true,
                                }}
                            />
                    </Col>
                    <Col className="text-column" style={isDesktop? experienceTextDesktopStyle : experienceTextNotDesktopStyle} lg={6} md={10} sm={10}>
                        <p>
                            Previously, I worked with Professor <a href={"https://www.ics.uci.edu/~gmark/Home_page/Welcome.html"}>Gloria Mark</a> at the University of California, Irvine and <a href={"https://acw.io/"}>Alex Williams</a> at the University of Tennessee, Knoxville as undergraduate research assistant. 
                        </p>
                        <p>
                            I have experience across Programming, Interaction design and User Behaviroal Research.
                        </p>
                        <p>
                            See my <Link to="/projects">projects</Link> here.
                        </p>
                    </Col>
                </Row>
                <Row 
                    id="interest" 
                    style={rowStyle, contentRowStyle} 
                    data-aos="fade-up"
                    data-aos-offset="200"
                    data-aos-duration="1000"
                    data-aos-easing="ease-in-out">
                    <Col id="social-media-icon-cloud" style={iconCloudStyle} md={{ span: 6, order: 2 }} sm={10}>
                        {/* particles using tsparticles library */}
                        <Particles 
                            height="15rem"
                            params={{
                                particles: {
                                    "number": {
                                        "density": {
                                            "enable": true,
                                            "area": 800,
                                            "factor": 1000
                                        },
                                        "limit": 0,
                                        "value": 100
                                    },
                                    "link": {
                                        "enable": false
                                    },
                                    shape: {
                                        type: 'image',
                                        // content of the particle nodes
                                        "image": [
                                            {
                                                "src": process.env.PUBLIC_URL + "/icons/github.svg",
                                            },
                                            {
                                                "src": process.env.PUBLIC_URL + "/icons/twitter.svg",
                                            },
                                            {
                                                "src": process.env.PUBLIC_URL + "/icons/instagram.svg",
                                            },
                                            {
                                                "src": process.env.PUBLIC_URL + "/icons/linkedin.svg",
                                            },
                                            {
                                                "src": process.env.PUBLIC_URL + "/icons/youtube.svg",
                                            },
                                            {
                                                "src": process.env.PUBLIC_URL + "/icons/weibo.svg",
                                            },
                                        ]
                                    },
                                    "move": {
                                        "angle": {
                                            "offset": 45,
                                            "value": 90
                                        },
                                        "attract": {
                                            "enable": false,
                                            "rotate": {
                                                "x": 600,
                                                "y": 1200
                                            }
                                        },
                                        "direction": "none",
                                        "distance": 0,
                                        "enable": true,
                                        "gravity": {
                                            "acceleration": 9.81,
                                            "enable": false,
                                            "maxSpeed": 50
                                        },
                                        "noise": {
                                            "delay": {
                                                "random": {
                                                "enable": false,
                                                "minimumValue": 0
                                                },
                                                "value": 0
                                            },
                                            "enable": false
                                        },
                                        "outModes": {
                                            "default": "out",
                                            "bottom": "out",
                                            "left": "out",
                                            "right": "out",
                                            "top": "out"
                                        },
                                        "random": false,
                                        "size": false,
                                        "speed": 1,
                                        "straight": false,
                                        "trail": {
                                            "enable": false,
                                            "length": 10,
                                            "fillColor": {
                                                "value": "#000000"
                                            }
                                        },
                                        "vibrate": false,
                                        "warp": false
                                    },
                                    "collisions": {
                                        "bounce": {
                                            "horizontal": {
                                                "random": {
                                                "enable": false,
                                                "minimumValue": 0.1
                                            },
                                            "value": 1
                                        },
                                        "vertical": {
                                            "random": {
                                                "enable": false,
                                                "minimumValue": 0.1
                                            },
                                            "value": 1
                                        }
                                        },
                                        "enable": true,
                                        "mode": "bounce"
                                    },
                                    "size": {
                                        "value": 30,
                                        "random": false,
                                        "anim": {
                                            "enable": true,
                                            "speed": 2,
                                            "size_min": 20,
                                            "sync": false
                                        }
                                    }
                                }
                            }}    
                        />
                    </Col>
                    <Col className="text-column" style={isDesktop? experienceTextDesktopStyle : experienceTextNotDesktopStyle} md={{ span: 6, order: 1 }} sm={10}>
                        My research interest is broadly in <strong>Social Computing</strong>. I seize to use mixed method research to <strong>understand people’s behavior</strong> at scale on social media platforms, and use UX design principles and programming to <strong>improve existing platforms</strong> and promote pro-social outcomes.
                    </Col>
                </Row>
            </Container>
            <Footer />
        </React.Fragment>
    )
}

// style sheets

const rowStyle = {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
}

const contentRowStyle = {
    width: "90%",
    margin: "auto",
}

const introductionDesktopStyle = {
    paddingTop: "5rem",
    textAlign: "right",
    fontSize: "1.3rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly"
}

const introductionNotDesktopStyle = {
    textAlign: "right",
    fontSize: "1rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly"
}

const profilePicContainerStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "2rem"
}

const profilePicDesktopStyle = {
    borderRadius: "100%",
    display: "block",
    width: "22vw",
    margin: "auto"
}

const profilePicNotDesktopStyle = {
    borderRadius: "100%",
    display: "block",
    width: "30vw",
    margin: "auto auto 2rem auto"
}

const experienceTextDesktopStyle = {
    margin: "5rem auto",
    padding: "2.5rem",
}

const experienceTextNotDesktopStyle = {
    fontSize: "16px",
    margin: "2.5rem auto",
}

const iconCloudStyle = {
    height: "18rem",
    backgroundColor: "rgba(49, 52, 66, 21)",
    borderRadius: "1rem",
    padding: "1rem",
    margin: "auto",
}