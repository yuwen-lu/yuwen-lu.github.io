import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import BackButton from '../resources/icons/arrow-back.svg';

// THIS PAGE IS STILL UNDER DEVELOPMENT, STILL NEEDS CONTENT TO ADD

export default function HitRanger() {
    return (
        <React.Fragment>
            <Header />
            <div className="content-wrapper">
                <div className="back-button">
                    <Link to="/Projects">
                        <img src={BackButton} style={backIconStyle}></img>Back
                    </Link>
                </div>
                {/* the p tag needs a container, otherwise the width of p tag would be the same as the parent tag */}
                <div className="title-wrapper" style={titleWrapperStyle}><p className="title" style={projectTitleStyle}>Hit Ranger</p></div>
                
            </div>
            <Footer />
        </React.Fragment>
    )
}

// container for the parent div of title
const titleWrapperStyle = {
    textAlign: "center"
}

const projectTitleStyle = {
    display: "inline-block",
    borderBottom: "#E44C65 2px solid",
}

const backIconStyle = {
    position: "relative",
    top: "-2px",
}