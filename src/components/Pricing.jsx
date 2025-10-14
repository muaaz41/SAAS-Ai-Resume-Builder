import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import priceMan from '../assets/price_man.png'
import check from '../assets/check.png'
import '../css/Pricing.css'
import { ssrImportKey } from 'vite/module-runner'

const Pricing = () => {
  return (
    <main className="pricing">
      <Navbar />

      {/* Hero */}
      <section className="pricing-hero">
        <div className="ph-left">
          <h1 className="ph-title">Build Your Future with the Right Plan</h1>
          <p className="ph-subtitle">Create standout resumes, customize designs, and unlock powerful tools and choose the plan that fits your journey.</p>
          <div className="arc-line" />
          <div className="ph-cta">
            <button className="btn-primary">Get Started</button>
            <a className="btn-secondary" href="#plans">See Plans</a>
          </div>
          <div className="stats-box">
            <div className="stat"><div className="stat-value">24/7</div><div className="stat-label">Online Support</div></div>
            <div className="stat"><div className="stat-value">100+</div><div className="stat-label">Professional Templates</div></div>
            <div className="stat"><div className="stat-value">1K+</div><div className="stat-label">Successful Job Seekers</div></div>
          </div>
        </div>
        <div className="ph-right">
          <div className="ring">
            <img src={priceMan} alt="Happy customer" className="pm-img" />
            {/* <div className="badge">★ Crafted with Job Market Insights</div>
            <div className="rating-card">
              <div className="rc-count"><span>2400+</span></div>
              <div className="rc-text">Happy Customers</div>
              <div className="rc-stars">★★★★★ <span>(4.7 Stars)</span></div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Stats band removed; merged into left hero */}

      {/* Plans */}
      <section id="plans" className="plans">
        <h2 className="plans-title">Choose Your Plan</h2>
        <p className="plans-sub">Select the plan that best fits your needs. You can upgrade or downgrade at any time.</p>
        <div className="plans-line" />

        <div className="plan-grid">
          <div className="plan-card">
            <div className="plan-head">Free</div>
            <div className="plan-desc">Create and share professional resumes with essential tools to get started.</div>
            <div className="price">$ 0</div>
            <div className="per">Per User/ month, Billed Yearly.</div>
            <button className="btn-outline full">Start free trial</button>
            <div className="feat-title">What You'll Get</div>
            <ul className="feat-list">
              <li><img src={check} alt="check" className="check-icon" />Multiple resume templates</li>
              <li><img src={check} alt="check" className="check-icon" />Version history & easy edits</li>
              <li><img src={check} alt="check" className="check-icon" />Built-in hosting & shareable link</li>
              <li><img src={check} alt="check" className="check-icon" />Bulk Status Changes</li>
              <li><img src={check} alt="check" className="check-icon" />Bulk resume exports (PDF/Word)</li>
              <li><img src={check} alt="check" className="check-icon" />Limited private projects</li>
              <li><img src={check} alt="check" className="check-icon" />Custom embeds</li>
            </ul>
          </div>

          <div className="plan-card popular">
            <div className="ribbon">Most Popular</div>
            <div className="plan-head">Premium</div>
            <div className="plan-desc">Perfect for professionals who want to stand out with tailored resumes and advanced features.</div>
            <div className="price">$ 32.99</div>
            <div className="per">Per User/ month, Billed Yearly.</div>
            <button className="btn-primary full">Get Started</button>
            <div className="feat-title">What You'll Get</div>
            <ul className="feat-list">
              <li><img src={check} alt="check" className="check-icon" />Multiple resume templates</li>
              <li><img src={check} alt="check" className="check-icon" />Advanced resume templates & layouts</li>
              <li><img src={check} alt="check" className="check-icon" />Unlimited downloads (PDF/Word)</li>
              <li><img src={check} alt="check" className="check-icon" />Priority customer support</li>
              <li><img src={check} alt="check" className="check-icon" />Team collaboration & shared workspace</li>
              <li><img src={check} alt="check" className="check-icon" />Version history & bulk resume exports</li>
              <li><img src={check} alt="check" className="check-icon" />Secure cloud hosting & shareable links</li>
            </ul>
          </div>

          <div className="plan-card">
            <div className="plan-head">Professional</div>
            <div className="plan-desc">For job seekers and career builders who need powerful tools to create standout resumes.</div>
            <div className="price">$ 22.99</div>
            <div className="per">Per User/ month, Billed Yearly.</div>
            <button className="btn-outline full">Get Started</button>
            <div className="feat-title">What You'll Get</div>
            <ul className="feat-list">
              <li><img src={check} alt="check" className="check-icon" />Multiple resume templates</li>
              <li><img src={check} alt="check" className="check-icon" />Unlimited downloads (PDF/Word)</li>
              <li><img src={check} alt="check" className="check-icon" />AI-powered resume assistance</li>
              <li><img src={check} alt="check" className="check-icon" />Built-in hosting & shareable links</li>
              <li><img src={check} alt="check" className="check-icon" />Private workspace with secure storage</li>
              <li><img src={check} alt="check" className="check-icon" />Version history & easy edits</li>
              <li><img src={check} alt="check" className="check-icon" />Priority email support</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default Pricing


