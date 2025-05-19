import React from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@suiet/wallet-kit';
import './Nav.css';
import iconImage from './assets/icon/icon1.png'; // Adjust path if needed

function Nav() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="left-group">
          <button
            className="navbar-toggler"
            onClick={() => document.getElementById('nav-links').classList.toggle('show')}
          >
            ☰
          </button>
          <div className="brand-group">
            <img src={iconImage} alt="Stormdex icon" className="icon" />
            <Link className="navbar-brand" to="/">STORMDEX</Link>
          </div>
        </div>
        <div className="nav-links" id="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#roadmap" className="nav-link">Roadmap</a>
          <a href="#about" className="nav-link">About us</a>
          <a href="#Docs" className="nav-link">Docs</a>
          <Link to="/stormdex" className="nav-link">Explore</Link>
        </div>
        <div className="App">
          <ConnectButton className='custom-connect'/>
        </div>
      </div>
    </nav>
  );
}

export default Nav;