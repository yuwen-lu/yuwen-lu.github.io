import React from 'react';
import { useMediaQuery } from 'react-responsive';

export default function ProjectCard (props) {

    // responsiveness, break point at tablet --> phone
    const isNotPhone = useMediaQuery({
        query: '(min-width: 576px)'
    });

    return (
        // the style attributes here use the responsiveness status to choose according style sheets
        // The structure of the card html is a bit complicated:
        //      since it's hard to create psuedo elements in react, I added a separate div for the whole card, a div for the background image, and a div for the text.
        //      if not done in this way, it's very hard to set an overlay color for the images in react
        <div className="project-card" style={ isNotPhone ? projectCardNotPhoneStyle : projectCardForPhoneStyle }>
            {/* a div for background image */}
            <div style={{... isNotPhone? projectCardBgImgNotPhoneStyle : projectCardBgImgForPhoneStyle, backgroundImage: "url(" + props.bgImage +")"}}></div>
            {/* div container for all text */}
            <div style={ isNotPhone? projectCardTextContainerNotPhoneStyle : projectCardTextContainerForPhoneStyle }>
                <div style={cardTitleStyle}>{props.title}</div>
                <div style={cardDescriptionStyle}>{props.description}</div>
                <div>
                    <div style={cardDetailStyle}>{props.job}</div>
                    <div style={cardDetailStyle}>{props.time}</div>
                </div>
            </div>
        </div>
    )
}

// the following style sheet variables are for project cards.
// since it's hard to create psuedo elements in react, I added a separate div for the whole card, a div for the background image, and a div for the text.
// most style sheets have duplicate for different screen sizes.

const projectCardNotPhoneStyle = {
    width: "25rem",
    height: "18rem",
    borderRadius: "1rem",
    margin: "2rem auto",
    // margin: "2rem auto",
}

const projectCardForPhoneStyle = {
    width: "90vw",
    height: "40vh",
    borderRadius: "1rem",
    margin: "2rem auto",
    
}

const projectCardBgImgNotPhoneStyle = {
    width: "25rem",
    height: "18rem",
    borderRadius: "1rem",
    backgroundPosition: "center", /* Center the image */
    backgroundRepeat: "no-repeat", /* Do not repeat the image */
    backgroundSize: "cover", /* Resize the background image to cover the entire container */
    opacity: "15%"
}

const projectCardBgImgForPhoneStyle = {
    height: "40vh",
    borderRadius: "1rem",
    backgroundPosition: "center", /* Center the image */
    backgroundRepeat: "no-repeat", /* Do not repeat the image */
    backgroundSize: "cover", /* Resize the background image to cover the entire container */
    opacity: "15%"
}

const projectCardTextContainerNotPhoneStyle = {
    width: "25rem",
    height: "18rem",
    padding: "1rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    // move it up to the same level as the bg img
    position: "relative",
    bottom: "18rem"
}

const projectCardTextContainerForPhoneStyle = {
    padding: "1rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    // move it up to the same level as the bg img
    position: "relative",
    bottom: "18rem"
}

const cardTitleStyle = {
    hyphen: "none",
    fontSize: "1rem",
    lineHeight: "1.5rem",
    marginBottom: "1.5rem"

}

const cardDescriptionStyle = {
    fontWeight: "500",
    lineHeight: "2rem",
}

const cardDetailStyle = {
    fontSize: "0.8rem",
    lineHeight: "1.5rem",
    textAlign: "right"
}