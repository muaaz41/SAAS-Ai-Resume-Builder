import React from 'react'
import '../css/Footer.css'
import sitelogo from '../assets/SiteLogo.png'
import socialicons from '../assets/logo.png'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="col brand">
          <div className="logo-row">
            <img src={sitelogo} alt="ResumeAI" className="site-logo" />
            {/* <span className="brand-name">ResumeAI</span> */}
          </div>
          <p className="brand-copy">High level experience in web design and development knowledge, producing quality work.</p>
          <div className="divider" />
          <div className="copyright">© 2025 All Rights Reserved</div>
          <div className="policies">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Sales and Refunds</a>
            <a href="#">Legal</a>
            <a href="#">Site Map</a>
          </div>
        </div>

        <div className="col follow">
          <div className="col-head">Follow us</div>
          <img src={socialicons} alt="social icons" className="social-strip" />
          <div className="col-head mt">Call us</div>
          <a href="tel:+2345678900" className="phone">+2 345 678-90-00</a>
        </div>

        <div className="col legal">
          <div className="col-head">Navigation</div>
          <a href="/">Home</a>
          <a href="#">Resume Builder</a>
          <a href="#">ATS Checker</a>
          <a href="#">User Dashboard</a>
          <a href="#">Pricing Plan</a>
        </div>

        <div className="col legal">
          <div className="col-head">Legal</div>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">FAQs</a>
          <a href="#">Teams</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer


