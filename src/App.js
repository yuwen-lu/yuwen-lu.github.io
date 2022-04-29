import React from 'react';
import {
  // BrowserRouter as Router,
  Route,
} from "react-router-dom";
import Projects from './pages/Projects';
import Home from './pages/Home';
import Life from './pages/Life';
import CV from './pages/CV';
import HitRanger from './pages/HitRanger';
import Goalplay from './pages/Goalplay';


export default function App() {
  return (

    // Wrap everything in a React.Fragment because one component only allows one returning component

    <React.Fragment>
      {/* the routes for different pages, <Link />s are in /layout/Header.js */}
      {/* <Route path="/projects">
        <Projects />
      </Route> */}

      <Route path="/life">
        <Life />
      </Route>

      <Route path="/cv">
        <CV />
      </Route>

      {/* <Route path="/HitRanger">
        <HitRanger />
      </Route> */}

      {/* <Route path="/goalplay">
        <Goalplay />
      </Route> */}

      {/* Will add more here later with more content pages */}
      
      <Route exact path="/">
        <Home />
      </Route>
    </React.Fragment>
  )
}
