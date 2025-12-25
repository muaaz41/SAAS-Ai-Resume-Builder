import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import sitelogo from "../assets/SiteLogo.png";
import "../css/Navbar.css";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { token, user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-brand">
          <Link to="/" style={{ display: "flex", alignItems: "center" }}>
            <img src={sitelogo} alt="Site logo" className="nav-logo" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/builder" state={{ startFresh: true }}>
            Resume Builder
          </Link>
          <Link to="/ats-checker">ATS Checker</Link>
          <Link to="/dashboard">User Dashboard</Link>
          <Link to="/pricing">Pricing Plan</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="nav-cta">
          {token ? (
            <>
              <span title={user?.email}>
                {user?.email?.length > 20 ? `${user?.email?.substring(0, 20)}...` : user?.email}
              </span>
              <Link
                className="btn-solid"
                to="/builder"
                state={{ startFresh: true }}>
                Open Builder
              </Link>
              <button className="btn-outline" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn-outline" to="/signin">
                Login
              </Link>
              <Link className="btn-solid" to="/signup">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-btn ${isMobileMenuOpen ? "open" : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        <nav className="mobile-nav-links">
          <Link to="/" onClick={toggleMobileMenu}>
            Home
          </Link>
          <Link
            to="/builder"
            state={{ startFresh: true }}
            onClick={toggleMobileMenu}>
            Resume Builder
          </Link>
          <Link to="/ats-checker" onClick={toggleMobileMenu}>
            ATS Checker
          </Link>
          <Link to="/dashboard" onClick={toggleMobileMenu}>
            User Dashboard
          </Link>
          <Link to="/pricing" onClick={toggleMobileMenu}>
            Pricing Plan
          </Link>
        </nav>
        <div className="mobile-nav-cta">
          {token ? (
            <>
              <button
                className="btn-outline"
                onClick={() => {
                  toggleMobileMenu();
                  logout();
                }}>
                Logout
              </button>
              <Link
                className="btn-solid"
                to="/builder"
                state={{ startFresh: true }}
                onClick={toggleMobileMenu}>
                Open Builder
              </Link>
            </>
          ) : (
            <>
              <Link
                className="btn-outline"
                to="/signup"
                onClick={toggleMobileMenu}>
                Sign Up
              </Link>
              <Link
                className="btn-solid"
                to="/signin"
                onClick={toggleMobileMenu}>
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
