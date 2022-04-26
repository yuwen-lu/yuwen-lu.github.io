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
import Lbw2022Pic from '../resources/images/chi-lbw-2022.png';
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
                    style={introRowStyle} 
                    // add animation on scroll effects
                    data-aos="fade-in" 
                    data-aos-duration="1000"
                    data-aos-easing="ease-in-out">
                    {/* style attribute: choose style sheets accordingly for different responsive layout */}
                    <Col className="intro-text-column" style={isDesktop ? introductionDesktopStyle : introductionNotDesktopStyle} lg={6} md={10} sm={10}>
                        <p className="title">Hi there! I'm Yuwen.</p>
                        <p>I am a Ph.D. student in Computer Science and Engineering at the University of Notre Dame.</p> 
                        <p>I research in Human-Computer Interaction and Human-AI Collaboration. My advisor is <a href={"https://toby.li/"}>Toby Li</a>.</p>
                        <p>Previously, I graduated from the <a target="_blank" href={"https://www.hcii.cmu.edu/academics/mhci"}> Master of Human Computer Interaction program </a> at Carnegie Mellon University.</p>
                        {/* <p>Jump to my <Link to="/projects">Projects</Link> or my <Link to="/resume">Resume</Link>.</p> */}
                    </Col>
                    <Col className="profile-pic-container" style={profilePicContainerStyle} lg={6} md={10} sm={10}>
                        <img className="profile-pic" style={isDesktop ? profilePicDesktopStyle : profilePicNotDesktopStyle} src={ProfilePic} alt="Me"></img>
                    </Col>
                </Row>
                <Row>
                    <Col className="home-body-title-container" style={homeBodyTitleContainerStyle} lg={12} md={12} sm={12}>
                        <div className="home-body-title" style={homeBodyTitleStyle}>Publication</div>
                    </Col>
                    <Col className="home-body-img-column" style={isDesktop? bodyImgDesktopContainerStyle : bodyImgNotDesktopContainerStyle} lg={3}>
                        <img className="paper-pic" src={Lbw2022Pic} style={isDesktop? bodyImgDesktopStyle : bodyImgNotDesktopStyle} alt="Project Snapshot"></img>
                    </Col>
                    <Col className="home-body-text-container" style={isDesktop? bodyTextDesktopStyle : bodyTextNotDesktopStyle} lg={8} md={10} sm={10}>
                        <p className='paper-title' style={paperTitle}>Bridging the Gap Between UX Practitioners’ Work Practices and AI-Enabled Design Support Tools</p>
                        <p className='paper-author' style={paperAuthor}><b>Yuwen Lu</b>, Chengzhi Zhang, Iris Zhang, and Toby Jia-Jun Li</p>
                        <p className='paper-conference' style={paperConference}>Extended Abstracts of the 2022 CHI Conference on Human Factors in Computing Systems (CHI EA ’22)</p>
                    </Col>
                </Row>
            </Container>
            <Footer />
        </React.Fragment>
    )
}

// style sheets

const introRowStyle = {
    paddingTop: "5rem",
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
}

const contentRowStyle = {
    width: "90%",
    margin: "auto",
}

const introductionDesktopStyle = {
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
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "2rem"
}

const profilePicDesktopStyle = {
    borderRadius: "100%",
    display: "block",
    width: "22vw",
    margin: "auto"
}

const homeBodyTitleContainerStyle = {
    textAlign: "center"
}

const homeBodyTitleStyle = {
    fontSize: "1.6rem",
    fontWeight: "bold",
    display: "inline-block",
    borderBottom: "solid 1px #E44C65",
    margin: "10vh auto 7vh",
}

const profilePicNotDesktopStyle = {
    borderRadius: "100%",
    display: "block",
    width: "30vw",
    margin: "auto auto 2rem auto"
}

const bodyImgDesktopContainerStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    margin: "auto 2rem auto"
}

const bodyImgNotDesktopContainerStyle = {
    
}

const bodyImgDesktopStyle = {
    width: "100%",
}

const bodyImgNotDesktopStyle = {
    width: "0%",
}

const bodyTextDesktopStyle = {

}

const bodyTextNotDesktopStyle = {
    fontSize: "16px",
    margin: "2.5rem auto",
}

const paperTitle = {
    fontWeight: "bold",
    margin: "0"
}

const paperAuthor = {
    margin: "0",
}

const paperConference = {
    fontSize: "0.9em",
    fontStyle: "italic"
}