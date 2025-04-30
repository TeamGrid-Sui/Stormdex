import React from 'react';
import './Sidenav.css';

function Sidenav({ isOpen, closeNav, sidenavRef }) {
  return (
    <div id="mySidenav" className={`sidenav ${isOpen ? 'open' : ''}`} ref={sidenavRef}>
      <a
        href="#"
        className="closebtn"
        onClick={(e) => {
          e.preventDefault();
          closeNav();
        }}
      >
        ×
      </a>
      <h2 className="sidenav-content">Wallet stuff go here...</h2>
    </div>
  );
}

export default Sidenav;