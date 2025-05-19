import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import backgroundImage from './assets/images/background.jpg';
import './fonts.css';
import backgroundVideo from './assets/images/features.mp4';
import backgroundImage2 from './assets/images/roadmap.jpg';

function Home() {
  return (
    <div className="home">
      <div className="explore" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h1>Streamlined for Traders</h1>
        <h5>Explore new tokens on SUI.</h5>
        <button className="explore-btn">
          <Link to="/stormdex">EXPLORE</Link>
        </button>

        <div className='poweredby'>
          <h2>Powered by</h2>
        </div>
        <div class="sponsors-div">
        <marquee behavior="" direction="" >
        <div class="sponsors">
          <div class="spons1">
          <img src="assets\images\poweredby\sui.png" alt=""/>
          </div>
          <div class="spons2">
          <img src="assets\images\poweredby\geckoterminal-logo1.png" alt=""/>
          </div>
          <div class="spons3">
          <img src="assets\images\poweredby\suiet1.png" alt=""/>
          </div>
          <div class="spons3">
          <img src="assets\images\poweredby\shinami-logo1.png" alt=""/>
          </div>
          <div class="spons3">
          <img src="assets\images\poweredby\nexa-logomain.png" alt=""/>
          </div>
          <div class="spons3">
          <img src="assets\images\poweredby\walrus-logo1.png" alt=""/>
          </div>
        </div>
        </marquee>
        </div>

      </div>

      <div className='section-container'>
      <div className="section" id="features">
        <h2>Unlock the Advantages of Stormdex</h2>
        <div className="features">
          <div className="feature-column">
            <div className="feature">
              <h3>Improved User Experience</h3>
              <p>Provide traders with seamless navigation and intuitive interfaces. Make decisions in seconds.</p>
            </div>
            <div className="feature2">
              <h3>Deep Token Analysis</h3>
              <p>More token data to aid better in seconds.</p>
            </div>
          </div>
          <div className="feature-column">
            <div className="feature">
              <h3>In-Depth Risk Assessment</h3>
              <p>Displays the risks associated with buying a token and indicates high-risk tokens.</p>
            </div>
            <div className="feature2">
              <h3>Secure Login</h3>
              <p>Connect Sui wallet securely. Explore the world of decentralized trading on Sui.</p>
            </div>
          </div>
          <div className="feature-column">
            <div className="feature-img">
              <video className="background-video" autoPlay loop muted playsInline>
              <source src={backgroundVideo} type="video/mp4" />
              video not supported
              </video>
            </div>
          </div>
        </div>
      </div>
      </div>
      <div className="roadmap2">
      <div className="section" id="roadmap" style={{ backgroundImage2: `url(${backgroundImage2})` }}>
          
        <h2>Roadmap</h2>
        <div className="roadmap-content">
          <div className="roadmap-text">
            <p>Trade in-app<br />
               AI trading assistant<br />
               Notify on trending and newly listed tokens<br />
               Alerts on high volatility of bought tokens<br />
               Fully customizable and personalized settings</p>
          </div>
        </div>
        </div>
      </div>
<div className="section" id="about">
      <h2>Contact Us</h2>
      <div className="social-links">
        <a href="https://x.com/TeamGrid_" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-x-twitter"></i>
        </a>
        <a href="mailto:teamgrid.sui@gmail.com">
          <i className="fa-solid fa-envelope"></i>
        </a>
        <a href="https://github.com/TeamGrid-Sui" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-github"></i>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Home;