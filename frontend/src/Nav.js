  import React from 'react';
  import { Link } from 'react-router-dom';
  import { ConnectButton } from '@suiet/wallet-kit';
  import './Nav.css';

  function Nav() {
    return (
      <nav className="navbar">
        <div className="nav-container">
          <Link className="navbar-brand" to="/">STORMDEX</Link>
          <button
            className="navbar-toggler"
            onClick={() => document.getElementById('nav-links').classList.toggle('show')}
          >
            ☰
          </button>
          <div className="nav-links" id="nav-links">
            <a href="#roadmap" className="nav-link">Roadmap</a>
            <a href="#about" className="nav-link">About us</a>
            <Link to="/stormdex" className="nav-link">Explore</Link>
            <div className="App">
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  export default Nav;