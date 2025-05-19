/*
import './App.css';
import { ConnectButton } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css'


export default function App() {
  return (
    <div className='App'>
      <h1 className='title gradient'>Stormdex sui wallet connect</h1>
      <ConnectButton />
    </div>
  );
}
*/

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Nav from './Nav';
import Sidenav from './Sidenav';
import Home from './Home';
import Stormdex from './Stormdex';
import Footer from './Footer';
import './App.css';
//import { ConnectButton } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import './suiet-wallet-kit-custom.css';

function App() {
  const [isSidenavOpen, setIsSidenavOpen] = useState(false);
  const sidenavRef = useRef(null);
  const curiosityButtonRef = useRef(null);

  const openNav = () => {
    setIsSidenavOpen(true);
  };

  const closeNav = () => {
    setIsSidenavOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidenavOpen &&
        sidenavRef.current &&
        !sidenavRef.current.contains(event.target) &&
        curiosityButtonRef.current &&
        !curiosityButtonRef.current.contains(event.target)
      ) {
        closeNav();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidenavOpen]);

  return (
    <Router>
      <div className={isSidenavOpen ? 'sidenav-open' : ''}>
        <Routes>
          {/* Route for Home: Includes Nav, Home, Footer */}
          <Route
            path="/"
            element={
              <div id="main">
                <Nav />
                <Home />
                <Footer />
              </div>
            }
          />
          {/* Route for Stormdex: Includes Nav, Stormdex, Footer */}
          <Route
            path="/stormdex"
            element={
              <div id="stormdex-container">
                <Nav />
                <Stormdex
                  openNav={openNav}
                  closeNav={closeNav}
                  isSidenavOpen={isSidenavOpen}
                  curiosityButtonRef={curiosityButtonRef}
                />
                <Footer />
              </div>
            }
          />
        </Routes>
        <Sidenav isOpen={isSidenavOpen} closeNav={closeNav} sidenavRef={sidenavRef} />
      </div>
    </Router>
  );
}

export default App;



/*import logo from './logo.svg';*/

/*
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
     
      </header>
    </div>
  );
}

export default App;
*/