import React from 'react';
import { Route, Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Container, Row, Col } from 'react-bootstrap';
import { useMediaQuery } from 'react-responsive';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import ProjectCard from '../layout/ProjectCard';
import Goalplay from './Goalplay';


// Functional Component for the project page
export default function Projects() {
    AOS.init();

    // responsiveness, break at tablet --> phone
    const isNotPhone = useMediaQuery({
        query: '(min-width: 576px)'
    });

    return (
        <React.Fragment>
            <Header />
            <Container>
                {/* the p tag for title needs a container, otherwise the width of p tag would be the same as the parent tag */}
                <div className="title-wrapper" style={titleWrapperStyle}><p className="title" style={projectTitleStyle}>Projects</p></div>
                {/* wrap cards in react-bootstrap row component for responsive layout */}
                <Row className="project-card-wrapper" style={projectCardWrapperStyle}>
                    <Col sm={12} lg={6} 
                        style={colStyle}>
                        {/* wrap the card in a link to the project detail page */}
                        <Link 
                            className="project-card-link" 
                            to="/Goalplay">
                            {/* self-defined project card component, pass on information to display as props */}
                            <ProjectCard 
                                title="Pre/Post COVID-19 Twitter Work-related Discussion Analysis" 
                                description="Quantitative analysis on Work-related discussions on Twitter before/after COVID-19" 
                                job="Quantitative Analysis Researcher" 
                                time= "Target Venue: PLoS One 2021" 
                                // use public url here since it's hosted on github pages. the PUBLIC_URL will be empty if it's localhost
                                bgImage= {process.env.PUBLIC_URL + "/images/twitter-work-related-discussion.jpg"}
                            />
                        </Link>
                    </Col>
                    <Col sm={12} lg={6} 
                        style={colStyle}>
                        <Link 
                            className="project-card-link" 
                            to="/Goalplay">
                            {/* self-defined project card component, pass on information to display as props */}
                            <ProjectCard 
                                title="COVID-19 Twitter Mask Analysis" 
                                description="Qualitative analysis on Mask discussions on Twitter through the lens of Risk Perception" 
                                job="Qualitative Analysis Researcher" 
                                time= "Target Venue: PLoS One 2021" 
                                bgImage= {process.env.PUBLIC_URL + "/images/twitter-mask-analysis.jpg"}
                            />
                        </Link>
                    </Col>
                </Row>
                <Row className="project-card-wrapper" style={projectCardWrapperStyle}>
                    <Col sm={12} lg={6} 
                        style={colStyle}
                        data-aos="fade-up"
                        data-aos-offset="200"
                        data-aos-duration="1000"
                        data-aos-easing="ease-in-out">
                        <Link 
                            className="project-card-link" 
                            to="/Goalplay"
                            data-aos="fade-up"
                            data-aos-offset="200"
                            data-aos-duration="1000"
                            data-aos-easing="ease-in-out">
                            <ProjectCard 
                            title="Goalplay Video Coach" 
                            description="Personal iOS training APP for amateur goalkeepers with Augmented Reality and Machine Learning" 
                            job="iOS Developer, Usability Manager" 
                            time= "2019" 
                            bgImage= {process.env.PUBLIC_URL + "/images/goalplay-screenshot-homepage-lowres.PNG"}
                            />
                        </Link>
                    </Col>
                    <Col sm={12} lg={6} 
                        style={colStyle}
                        data-aos="fade-up"
                        data-aos-offset="200"
                        data-aos-duration="1000"
                        data-aos-easing="ease-in-out">
                        <Link 
                            className="project-card-link" 
                            to="/Goalplay">
                            <ProjectCard 
                                title="HIT Ranger" 
                                description="Mobilizing Crowdwork with Task Management Interfaces" 
                                job="Developer" 
                                time= "Target Venue: CSCW 2021" 
                                bgImage= {process.env.PUBLIC_URL + "/images/hit-ranger-icon.png"}
                            />
                        </Link>
                    </Col>
                </Row>
                <Row className="project-card-wrapper" style={projectCardWrapperStyle}>
                    <Col sm={12} lg={6} 
                        style={colStyle}
                        data-aos="fade-up"
                        data-aos-offset="200"
                        data-aos-duration="1000"
                        data-aos-easing="ease-in-out">
                        <Link 
                            className="project-card-link" 
                            to="/Goalplay">
                            <ProjectCard 
                                title="Embeded Interface Design" 
                                description="Designing YouTube advertisement content to promote pro-social behaviors online" 
                                job="Researcher" 
                                time= "2020" 
                                bgImage= {process.env.PUBLIC_URL + "/images/youtube-embeded-interface-design.png"}
                            />
                        </Link>
                    </Col>
                </Row>
            </Container>
            <Footer />
        </React.Fragment>
    )
}

// style sheets

// override the default padding in react-bootstrap columns
const colStyle = {
    padding: "0"
}

const projectCardWrapperStyle = {
    margin: "auto",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly"

}

// container for the parent div of title
const titleWrapperStyle = {
    textAlign: "center"
}

const projectTitleStyle = {
    display: "inline-block",
    borderBottom: "#E44C65 2px solid",
}