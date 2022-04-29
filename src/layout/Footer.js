import React from 'react';
// import { Route, Link } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import EmailIcon from '../resources/icons/email.svg';
import GithubIcon from '../resources/icons/github.svg';
import InstagramIcon from '../resources/icons/instagram.svg';
import LinkedinIcon from '../resources/icons/linkedin.svg';
import TwitterIcon from '../resources/icons/twitter.svg';

// function component for footer, used across (almost?) all pages
export default function Footer () {

    // responsiveness, break point at tablet --> desktop
    const isDesktop = useMediaQuery({
        query: '(min-width: 769px)'
    });

    return (
        <div className="footerContainer" style={footerContainerStyle}>
            <p>Contact</p>
            <div className="footerIcons">
                {/* the style attributes here use the responsiveness const defined above: choose the style sheet accordingly */}
                <a target="_blank" href={"mailto:ylu23@nd.edu"} style={iconLinkStyle}><img src={EmailIcon} style={isDesktop? iconStyleForDesktop : iconStyleNotDesktop}></img></a>
                <a target="_blank" href={"https://twitter.com/yuwen_lu_"} style={iconLinkStyle}><img src={TwitterIcon} style={isDesktop? iconStyleForDesktop : iconStyleNotDesktop}></img></a>
                <a target="_blank" href={"https://www.instagram.com/yuwen_lu_/"} style={iconLinkStyle}><img src={InstagramIcon} style={isDesktop? iconStyleForDesktop : iconStyleNotDesktop}></img></a>
                <a target="_blank" href={"https://github.com/yuwen-lu/"} style={iconLinkStyle}><img src={GithubIcon} style={isDesktop? iconStyleForDesktop : iconStyleNotDesktop}></img></a>
                <a target="_blank" href={"https://www.linkedin.com/in/yuwen-lu/"} style={iconLinkStyle}><img src={LinkedinIcon} style={isDesktop? iconStyleForDesktop : iconStyleNotDesktop}></img></a>
            </div>
            <p style={footerBottomTextStyle}>Design and developed by Yuwen Lu with React.</p>
            <p style={footerBottomTextStyle}>Last updated: Apr 2022</p>
        </div>
    )

}

// style sheets

const footerContainerStyle = {
    textAlign: "center",
    marginTop: "10rem"
}

// the two style sheets for desktop/tablet and smaller
const iconStyleForDesktop = {
    width: "1.8rem",
    margin: "1rem 1rem 3rem",
}

const iconStyleNotDesktop = {
    width: "1.2rem",
    margin: "0.5rem 0.5rem 2rem",
}

const iconLinkStyle = {
    border: "none"
}

const footerBottomTextStyle = {
    fontSize: "1rem",
    lineHeight: "1.5rem"
}