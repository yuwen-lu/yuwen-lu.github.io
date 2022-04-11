import React from 'react';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
// import ResumeFile from '../resources/files/Resume-YuwenLu.pdf';
import CVFile from '../resources/files/CV_Yuwen_Lu.pdf';
import '../App.css';

// functional component for cv page
export default function CV() {
    return (
        <React.Fragment>
            <Header />
            <div className="content-wrapper">
                {/* use iframe to display the image */}
                <iframe src={CVFile} style={resumeFileStyle} frameBorder="0"></iframe>
            </div>
            
            <Footer />
        </React.Fragment>
    )
}

// style sheet 

const resumeFileStyle = {
    width: "70vw",
    height:"120vh",
    margin: "auto"
}