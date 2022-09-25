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
import Lbw2022Poster from '../resources/files/LBW CHI2022/Poster_YuwenLu_LBWCHI2022.pdf';
import Lbw2022Preprint from '../resources/files/LBW CHI2022/chi22extendedabstracts_394.pdf';
import CHIWORK2022Preprint from '../resources/files/CHIWORK_2022_gigworkvision.pdf';
import CHIWORK2022Pic from '../resources/images/CHIWORK22_approach.png';
import CHI2022WorkshopPic from '../resources/images/user-interface-workshop.jpeg';
import CHI2022WorkshopPreprint from "../resources/files/CHI2022_Workshop_Proposal.pdf";
import MaskPic from "../resources/images/mask.png";
import MarsPic from "../resources/images/mars.png";

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
            <div class="blur-block" id="blur-purple"></div>
            <div class="blur-block" id="blur-pink"></div>
            <div class="blur-block" id="blur-green"></div>
            <div class="blur-block" id="blur-yellow"></div>
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
                        <p>Previously, I graduated with a <a target="_blank" href={"https://www.hcii.cmu.edu/academics/mhci"}> Master of Human Computer Interaction </a> at Carnegie Mellon University.</p>
                        {/* <p>Jump to my <Link to="/projects">Projects</Link> or my <Link to="/resume">Resume</Link>.</p> */}
                    </Col>
                    <Col className="profile-pic-container" style={profilePicContainerStyle} lg={6} md={10} sm={10}>
                        <img className="profile-pic" style={isDesktop ? profilePicDesktopStyle : profilePicNotDesktopStyle} src={ProfilePic} alt="Me"></img>
                    </Col>
                </Row>

                <Row>
                    <Col className="home-body-title-container" style={homeBodyTitleContainerStyle} lg={12} md={12} sm={12}>
                        <div className="home-body-title" style={homeBodyTitleStyle}>Currently Working On...</div>
                    </Col>
                </Row>
                <Row>
                    <div style={centerText}>
                        <div>Using generative machine learning models to facilitate UX design,</div>
                        <div>Supporting gig workers with personal AI agents, and</div>
                        <div>Building an open-source research tool to support researchers with non-development background to collect customizable information from study participants' Android app usage.</div>
                    </div>
                </Row>


                <Row>
                    <Col className="home-body-title-container" style={homeBodyTitleContainerStyle} lg={12} md={12} sm={12}>
                        <div className="home-body-title" style={homeBodyTitleStyle}>Publication</div>
                    </Col>
                </Row>
                <Row>
                    <Col className="home-body-img-column" style={isDesktop? bodyImgDesktopContainerStyle : bodyImgNotDesktopContainerStyle} lg={3}>
                        <img className="paper-pic" src={CHIWORK2022Pic} style={isDesktop? bodyImgDesktopStyle : bodyImgNotDesktopStyle} alt="Project Snapshot"></img>
                    </Col>
                    <Col className="home-body-text-container" style={isDesktop? bodyTextDesktopStyle : bodyTextNotDesktopStyle} lg={8} md={10} sm={10}>

                        {/* One Paper */}

                        <p className='paper-title' style={paperTitle}>A Bottom-Up End-User Intelligent Assistant Approach to Empower Gig Workers against AI Inequality</p>
                        
                        <p className='paper-author' style={paperAuthor}>Toby Jia-Jun Li, <b>Yuwen Lu</b>, Jaylexia Clark, Meng Chen, Victor Cox, Meng Jiang, Yang Yang, Tamara Kay, Danielle Wood, Jay Brockman</p>
                        <p className='paper-conference' style={paperConference}>The Symposium on Human-Computer Interaction for Work (CHIWORK '22)</p>
                        <p>
                            <a className='paper-link' target='_blank' href={"https://arxiv.org/abs/2204.13842"} style={paperLinkStyle}>Preprint</a>
                            <a className='paper-link' target='_blank' href={"https://youtu.be/8zCOj9G3I_o"} style={paperLinkStyle}>Video (will autoplay on open)</a>
                        </p>
                        <p>
                            {/* <a className='paper-link' target="_blank" href={CHIWORK2022Preprint} style={paperLinkStyle}>Preprint</a> */}
                        </p>

                    </Col>
                </Row>

                <Row>
                    <Col className="home-body-img-column" style={isDesktop? bodyImgDesktopContainerStyle : bodyImgNotDesktopContainerStyle} lg={3}>
                        <img className="paper-pic" src={Lbw2022Pic} style={isDesktop? bodyImgDesktopStyle : bodyImgNotDesktopStyle} alt="Project Snapshot"></img>
                    </Col>
                    <Col lg={8} md={10} sm={10}>
                        {/* Another Paper */}
                        <p className='paper-title' style={paperTitle}>Bridging the Gap Between UX Practitioners’ Work Practices and AI-Enabled Design Support Tools</p>
                        
                        <p className='paper-author' style={paperAuthor}><b>Yuwen Lu</b>, Chengzhi Zhang, Iris Zhang, and Toby Jia-Jun Li</p>
                        <p className='paper-conference' style={paperConference}>Extended Abstracts of the 2022 CHI Conference on Human Factors in Computing Systems (CHI EA ’22)</p>
                        <p>
                            <a className='paper-link' target="_blank" href={Lbw2022Preprint} style={paperLinkStyle}>Preprint</a>
                            <a className='paper-link' target="_blank" href={"https://www.youtube.com/watch?v=TJ16TIe29xw"} style={paperLinkStyle}>Video</a>
                            <a className='paper-link' target="_blank" href={Lbw2022Poster} style={paperLinkStyle}>Poster</a>
                        </p>
                    </Col>

                </Row>

                <Row>
                    <Col className="home-body-img-column" style={isDesktop? bodyImgDesktopContainerStyle : bodyImgNotDesktopContainerStyle} lg={3}>
                        <img className="paper-pic" src={CHI2022WorkshopPic} style={isDesktop? bodyImgDesktopStyle : bodyImgNotDesktopStyle} alt="Project Snapshot"></img>
                    </Col>
                    <Col lg={8} md={10} sm={10}>
                        {/* Another Paper */}
                        <p className='paper-title' style={paperTitle}>Computational Approaches for Understanding, Generating, and Adapting User Interfaces</p>
                        
                        <p className='paper-author' style={paperAuthor}>Yue Jiang*, <b>Yuwen Lu*</b>, Jeffrey Nichols, Wolfgang Stuerzlinger, Chun Yu, Christof Lutteroth, Yang Li, Ranjitha Kumar, Toby Jia-Jun Li (* equal contribution)</p>
                        <p className='paper-conference' style={paperConference}>Extended Abstracts of the 2022 CHI Conference on Human Factors in Computing Systems (CHI EA ’22)</p>
                        <p>
                            <a className='paper-link' target="_blank" href={CHI2022WorkshopPreprint} style={paperLinkStyle}>Preprint</a>
                            <a className='paper-link' target="_blank" href={"https://sites.google.com/nd.edu/computational-uichi22/home"} style={paperLinkStyle}>Workshop Website</a>
                        </p>
                    </Col>

                </Row>
                <Row>
                    <Col className="home-body-img-column" style={isDesktop? bodyImgDesktopContainerStyle : bodyImgNotDesktopContainerStyle} lg={3}>
                        <img className="paper-pic" src={MarsPic} style={isDesktop? bodyImgDesktopStyle : bodyImgNotDesktopStyle} alt="Project Snapshot"></img>
                    </Col>
                    <Col lg={8} md={10} sm={10}>
                        {/* Another Paper */}
                        <p className='paper-title' style={paperTitle}>Characterizing Work-Life for Information Work on Mars: A Design Fiction for the New Future of Work on Earth</p>
                        
                        <p className='paper-author' style={paperAuthor}>Rhema Linder, Chase Hunter, Jacob McLemore, Senjuti Dutta, Fatema Akbar, Ted Grover, Thomas Breideband, Judith W Borghouts, <b>Yuwen Lu</b>, Gloria Mark, Austin Z Henley, Alex C Williams</p>
                        <p className='paper-conference' style={paperConference}>Proceedings of the ACM on Human-Computer Interaction 6 (GROUP) 2022</p>
                        <p>
                            <a className='paper-link' target="_blank" href={"https://dl.acm.org/doi/abs/10.1145/3492859"} style={paperLinkStyle}>Paper</a>
                        </p>
                    </Col>

                </Row>
                <Row>
                    <Col className="home-body-img-column" style={isDesktop? bodyImgDesktopContainerStyle : bodyImgNotDesktopContainerStyle} lg={3}>
                        <img className="paper-pic" src={MaskPic} style={isDesktop? bodyImgDesktopStyle : bodyImgNotDesktopStyle} alt="Project Snapshot"></img>
                    </Col>
                    <Col lg={8} md={10} sm={10}>
                        {/* Another Paper */}
                        <p className='paper-title' style={paperTitle}>The Social Amplification and Attenuation of COVID-19 Risk Perception Shaping Mask Wearing Behavior: A Longitudinal Twitter Analysis</p>
                        
                        <p className='paper-author' style={paperAuthor}>Suellen Hopfer, Emilia J Fields, <b>Yuwen Lu</b>, Ganesh Ramakrishnan, Ted Grover, Quishi Bai, Yicong Huang, Chen Li, Gloria Mark</p>
                        <p className='paper-conference' style={paperConference}>PLOS One, 2021</p>
                        <p>
                            <a className='paper-link' target="_blank" href={"https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0257428"} style={paperLinkStyle}>Paper</a>
                        </p>
                    </Col>

                </Row>
            </Container>
            <Footer />
        </React.Fragment>
    )
}

// style sheets

const centerText = {
    textAlign: "center"
}

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
    fontWeight: "medium",
    display: "inline-block",
    borderBottom: "solid 1px #E44C65",
    margin: "10vh auto 4vh",
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
    borderRadius: "0.5rem"
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
    marginTop: "3rem",
    marginBottom: "0",
}

const paperAuthor = {
    margin: "0",
}

const paperConference = {
    fontSize: "0.9em",
    fontStyle: "italic"
}

const paperLinkStyle = {
    marginRight: "3rem",
}
