import React from 'react';
import { Link } from 'react-router-dom';

// Functional Component for header, displayed on most pages
export default function Header() {
    return (
        <React.Fragment>
            <nav style={navStyle}>
                {/* use react router to link different components */}
                <Link className="nav-link" to="/">Home</Link>
                {/* <Link className="nav-link" to="/projects">Projects</Link> */}
                <Link className="nav-link" to="/life">Life</Link>
            </nav>
        </React.Fragment>
    )
}

// style sheets

const navStyle = {
    display: "flex",
    height: "10vh",
    padding: "4vw",
    alignItems: "center",
    justifyContent: "flex-end",
}
