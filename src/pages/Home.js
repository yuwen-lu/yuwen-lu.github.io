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