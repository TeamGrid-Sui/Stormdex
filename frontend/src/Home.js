import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="explore">
        <h1>Streamlined for Traders</h1>
        <h5>Explore new tokens on SUI.</h5>
        <button className="explore-btn">
          <Link to="/stormdex">EXPLORE</Link>
        </button>
      </div>
      <div className="section">
        <h2>Unlock the Advantages of Stormdex</h2>
        <div className="features">
          <div className="feature-column">
            <div className="feature">
              <h3>Improved User Experience</h3>
              <p>Provide traders with seamless navigation and intuitive interfaces. Make decisions in seconds.</p>
            </div>
            <div className="feature">
              <h3>Deep Token Analysis</h3>
              <p>More token data to aid better in seconds.</p>
            </div>
          </div>
          <div className="feature-column">
            <div className="feature">
              <h3>In-Depth Risk Assessment</h3>
              <p>Displays the risks associated with buying a token and indicates high-risk tokens.</p>
            </div>
            <div className="feature">
              <h3>Secure Login</h3>
              <p>Connect Sui wallet securely. Explore the world of decentralized trading on Sui.</p>
            </div>
          </div>
          <div className="feature-column">
            <img src="/assets/images/images.png" alt="Feature" className="feature-img" />
          </div>
        </div>
      </div>
      <div className="section" id="roadmap">
        <h2>Roadmap</h2>
        <div className="roadmap-content">
          <img src="/assets/images/image.png" alt="Roadmap" className="roadmap-img" />
          <div className="roadmap-text">
            <h3>Improved User Experience</h3>
            <p>Trade in-app<br />
               AI trading assistant<br />
               Notify on trending and newly listed tokens<br />
               Alerts on high volatility of bought tokens<br />
               Fully customizable and personalized settings<br />
               Just for traders</p>
          </div>
        </div>
      </div>
      <div className="section" id="about">
        <h2>Contact Us</h2>
        <div className="social-links">
          <a href="https://x.com/TeamGrid_" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="mailto:teamgrid.sui@gmail.com">
            <i className="fab fa-google"></i>
          </a>
          <a href="https://github.com/TeamGrid-Sui" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github"></i>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Home;