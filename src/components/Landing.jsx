import React, { useState } from "react";
import peopleImg from "../assets/people.png";
import personImg from "../assets/resume_man.png";
import brandsImg from "../assets/List_Companies.png";
import resumeImg from "../assets/resume.png";
import womanImg from "../assets/women1.png";
import choose1 from "../assets/div.png";
import choose2 from "../assets/div1.png";
import choose3 from "../assets/div2.png";
import choose4 from "../assets/div3.png";
import arrowImg from "../assets/arrow.png";
import testiBg from "../assets/BG.png";
import boysImg from "../assets/boys.png";
import curveImg from "../assets/Line7.png";
import starsImg from "../assets/5stars.png";
import avatar1 from "../assets/avatar1.png";
import avatar2 from "../assets/avatar2.png";
import rect1 from "../assets/Rectangle1.png";
import resume3 from "../assets/resume3.png";
import resume2 from "../assets/resume2.png";
import resume4 from "../assets/resume4.png";
import resume5 from "../assets/resume5.png";
import resume6 from "../assets/resume6.png";
import rect2 from "../assets/Rectangle2.png";
import manImg from "../assets/man.png";
import resumes from "../assets/resumes1.png";
import { useNavigate } from "react-router-dom";
import "../css/Landing.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { showToast } from "../lib/toast";
import { api } from "../lib/api.js";

const Landing = () => {
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const navigate = useNavigate();

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      showToast("Please enter a valid email address", { type: "error" });
      return;
    }

    setNewsletterLoading(true);
    try {
      // Call backend endpoint to handle Mailchimp subscription (avoids CORS)
      const response = await api.post("/api/v1/newsletter/subscribe", {
        email: newsletterEmail.trim(),
      });

      if (response.data?.success) {
        showToast(response.data?.message || "Successfully subscribed to our newsletter! 🎉", { type: "success", duration: 3000 });
        setNewsletterEmail("");
      } else {
        showToast(response.data?.message || "Failed to subscribe. Please try again.", { type: "error" });
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to subscribe. Please try again later.";
      
      // Handle specific Mailchimp errors
      if (errorMessage.includes("already subscribed") || errorMessage.includes("Member Exists")) {
        showToast("This email is already subscribed to our newsletter", { type: "warning" });
      } else {
        showToast(errorMessage, { type: "error" });
      }
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <main className="landing">
      <Navbar />
      <section className="hero">
        <div className="hero-left">
          <h1 className="hero-title">
            Build Your ATS-Friendly Resume in Minutes with AI
          </h1>
          <p className="hero-subtitle">
            Let AI do the work for you. Choose from dozens of templates, add
            ready-to-use skills and phrases, and land your dream job.
          </p>

          <div className="hero-cta-row">
            <button
              className="btn-primary"
              onClick={() => navigate("/resume-start")}>
              Get Started Free
            </button>
            <div className="active-users">
              <img
                src={peopleImg}
                alt="Active users"
                className="active-people"
              />
              <div className="active-copy">
                <div className="active-title">Active Users</div>
                <div className="active-sub">
                  We have over 300k satisfied and happy users around the world
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          {/* Filled concentric circles behind the person */}
          {/* <div className="orbs">
            <span className="orb orb1" />
            <span className="orb orb2" />
            <span className="orb orb3" />
          </div> */}
          <div
            className="person"
            style={{ backgroundImage: `url(${personImg})` }}
          />
        </div>
      </section>

      {/* Tools Section */}
      <section
        className="tools"
        style={{ padding: "60px 20px", backgroundColor: "#f8fafc" }}>
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
            }}>
            Powerful Tools for Your Job Search
          </h2>
          <p
            style={{
              fontSize: "1.125rem",
              color: "#64748b",
              marginBottom: "48px",
              maxWidth: "600px",
              margin: "0 auto 48px",
            }}>
            Get the complete toolkit to land your dream job with our ATS checker
            and flexible pricing plans
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "32px",
              marginTop: "48px",
            }}>
            <div
              onClick={() => navigate("/ats-checker")}
              style={{
                backgroundColor: "white",
                padding: "40px 32px",
                borderRadius: "16px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-4px)";
                e.target.style.boxShadow =
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
                e.target.style.borderColor = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                e.target.style.borderColor = "transparent";
              }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#0f172a",
                  marginBottom: "12px",
                }}>
                ATS Checker
              </h3>
              <p
                style={{
                  color: "#64748b",
                  lineHeight: "1.6",
                  marginBottom: "24px",
                }}>
                Analyze your resume for ATS compatibility and get instant
                feedback on how to optimize it for applicant tracking systems.
              </p>
              <button
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#2563eb")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#3b82f6")
                }>
                Check My Resume →
              </button>
            </div>

            <div
              onClick={() => navigate("/pricing")}
              style={{
                backgroundColor: "white",
                padding: "40px 32px",
                borderRadius: "16px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-4px)";
                e.target.style.boxShadow =
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
                e.target.style.borderColor = "#10b981";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                e.target.style.borderColor = "transparent";
              }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>💰</div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#0f172a",
                  marginBottom: "12px",
                }}>
                Pricing Plans
              </h3>
              <p
                style={{
                  color: "#64748b",
                  lineHeight: "1.6",
                  marginBottom: "24px",
                }}>
                Choose the perfect plan for your needs. Start free or upgrade to
                unlock premium features and unlimited access.
              </p>
              <button
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#059669")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#10b981")
                }>
                View Pricing →
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="brands">
        <img className="brands-img" src={brandsImg} alt="Brands" />
      </section>

      <section className="templates">
        <h2 className="templates-title">
          Pick the Template That Fits You Best
        </h2>
        <p className="templates-subtitle">
          From creative to classic, find a layout that highlights your
          strengths.
        </p>

        <div className="templates-grid">
          <div className="template-card">
            <img
              src={resumeImg}
              alt="Resume Template 1"
              className="template-img"
            />
            <div className="template-footer">
              <div className="template-tag">
                Type<span>Modern</span>
              </div>
              <div className="template-tag">
                Color<span>White</span>
              </div>
              <div className="template-tag">
                Format<span>Adjustable</span>
              </div>
            </div>
          </div>

          <div className="template-card">
            <img
              src={resume3}
              alt="Resume Template 2"
              className="template-img"
            />
            <div className="template-footer">
              <div className="template-tag">
                Type<span>Classic</span>
              </div>
              <div className="template-tag">
                Color<span>White</span>
              </div>
              <div className="template-tag">
                Format<span>Adjustable</span>
              </div>
            </div>
          </div>

          <div className="template-card">
            <img
              src={resume2}
              alt="Resume Template 3"
              className="template-img"
            />
            <div className="template-footer">
              <div className="template-tag">
                Type<span>Modern</span>
              </div>
              <div className="template-tag">
                Color<span>White</span>
              </div>
              <div className="template-tag">
                Format<span>Adjustable</span>
              </div>
            </div>
          </div>

          {/* {showAllTemplates && (
            <>
              <div className="template-card">
                <img src={resume4} alt="Resume Template 4" className="template-img" />
                <div className="template-footer">
                  <div className="template-tag">Type<span>Modern</span></div>
                  <div className="template-tag">Color<span>White</span></div>
                  <div className="template-tag">Format<span>Adjustable</span></div>
                </div>
              </div>
              
              <div className="template-card">
                <img src={resume5} alt="Resume Template 5" className="template-img" />
                <div className="template-footer">
                  <div className="template-tag">Type<span>Classic</span></div>
                  <div className="template-tag">Color<span>White</span></div>
                  <div className="template-tag">Format<span>Adjustable</span></div>
                </div>
              </div>
              
              <div className="template-card">
                <img src={resume6} alt="Resume Template 6" className="template-img" />
                <div className="template-footer">
                  <div className="template-tag">Type<span>Modern</span></div>
                  <div className="template-tag">Color<span>White</span></div>
                  <div className="template-tag">Format<span>Adjustable</span></div>
                </div>
              </div>
            </>
          )} */}
        </div>

        {/* <button className="btn-see-all" onClick={() => setShowAllTemplates(!showAllTemplates)}>
          {showAllTemplates ? 'Show Less' : 'See All Templates'}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {showAllTemplates ? (
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button> */}
      </section>

      <section className="welcome">
        <div className="welcome-left">
          <h2 className="welcome-title">Welcome Resume Builder</h2>
          <p className="welcome-text">
            With a user-friendly interface and customizable templates, creating
            a standout resume has never been easier. Our tools guide you
            step-by-step, ensuring that your resume reflects your strengths and
            career aspirations
          </p>
          <button className="btn-primary">Read More</button>
        </div>

        <div className="welcome-center">
          {/* <div className="welcome-blob"> */}
          <img className="welcome-photo" src={womanImg} alt="Smiling woman" />
          {/* </div> */}
        </div>

        <div className="welcome-right">
          <h3 className="mission-title">Our Mission</h3>
          <p className="mission-text">
            At Our Resume Builder, we empower individuals to showcase their
            unique skills and experiences through professionally crafted
            resumes. We believe that everyone deserves a chance to shine in
            their job search, and our platform is designed to help you achieve
            that.
          </p>
          <div className="stats">
            <div className="stat">
              <div className="stat-num">5+</div>
              <div className="stat-label">Years</div>
              <div className="stat-label">Experience</div>
            </div>
            <div className="stat">
              <div className="stat-num">5K+</div>
              <div className="stat-label">Resumes</div>
              <div className="stat-label">Created</div>
            </div>
            <div className="stat">
              <div className="stat-num">10K+</div>
              <div className="stat-label">Active</div>
              <div className="stat-label">Users</div>
            </div>
          </div>
        </div>
      </section>
      <section className="choose">
        <h2 className="section-title">Why Choose Resume Builder?</h2>
        <p className="section-sub">
          Everything you need to land your dream job
        </p>
        <div className="section-underline" />
        <div className="choose-grid">
          <div className="choose-card">
            <img src={choose1} alt="Fast & Easy" className="choose-icon" />
            <div className="choose-title">Fast & Easy</div>
            <div className="choose-text">
              Create a professional resume in under 5 minutes with our intuitive
              builder
            </div>
          </div>
          <div
            className="choose-card"
            onClick={() => navigate("/ats-checker")}
            style={{ cursor: "pointer" }}>
            <img src={choose2} alt="ATS Friendly" className="choose-icon" />
            <div className="choose-title">ATS Friendly</div>
            <div className="choose-text">
              Pass applicant tracking systems effortlessly with optimized
              formatting
            </div>
          </div>
          <div className="choose-card">
            <img src={choose3} alt="AI-Powered" className="choose-icon" />
            <div className="choose-title">AI-Powered</div>
            <div className="choose-text">
              Smart suggestions tailored to your role and industry requirements
            </div>
          </div>
          <div className="choose-card">
            <img src={choose4} alt="Modern Templates" className="choose-icon" />
            <div className="choose-title">Modern Templates</div>
            <div className="choose-text">
              Pick from recruiter-approved designs that make you stand out
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="section-title small">Our Key Features</h2>
        <div className="section-underline" />
        <div className="features-grid">
          <div className="feature-pill">
            <div className="feature-head">Smart Resume Builder</div>
            <p className="feature-text">
              Build professional resumes in minutes with smart layouts that
              showcase your skills and achievements.
            </p>
            <button className="feature-cta">→</button>
          </div>
          <div className="feature-pill">
            <div className="feature-head">Budget-Friendly Resume Listings</div>
            <p className="feature-text">
              We provide affordable tools for crafting professional resumes,
              helping job seekers showcase their skills effectively with
              user-friendly templates.
            </p>
            <button className="feature-cta">→</button>
          </div>
          <div className="feature-pill">
            <div className="feature-head">Career-Ready Resumes</div>
            <p className="feature-text">
              Build resumes that highlight your strengths and prepare you for
              new opportunities with our easy-to-use tools.
            </p>
            <button className="feature-cta">→</button>
          </div>
          <div className="feature-pill">
            <div className="feature-head">24/7 Online Support</div>
            <p className="feature-text">
              Get instant help whenever you need it. Our dedicated support team
              guides you through the resume-building process.
            </p>
            <button className="feature-cta">→</button>
          </div>
        </div>
      </section>

      <section className="howworks">
        <h2 className="section-title">How It Works Section</h2>
        <div className="section-underline" />
        <div className="how-grid">
          <div className="how-item">
            <div className="how-head">
              <div className="how-step">Step</div>
              <div className="how-num">01</div>
            </div>
            <p className="how-text">
              Select a template and enter your personal and professional
              details.
            </p>
          </div>
          <img src={arrowImg} alt="arrow" className="how-arrow" />
          <div className="how-item">
            <div className="how-head">
              <div className="how-step">Step</div>
              <div className="how-num">02</div>
            </div>
            <p className="how-text">
              Let AI generate tailored content specific to your role and
              industry.
            </p>
          </div>
          <img src={arrowImg} alt="arrow" className="how-arrow" />
          <div className="how-item">
            <div className="how-head">
              <div className="how-step">Step</div>
              <div className="how-num">03</div>
            </div>
            <p className="how-text">
              Download your resume in Word, PDF, or TXT format and start
              applying.
            </p>
          </div>
        </div>
      </section>
      <section className="testimonials">
        <div className="testi-left">
          <img src={testiBg} alt="background shapes" className="testi-bg" />
          <img src={boysImg} alt="two students" className="testi-boy" />
        </div>
        <div className="testi-right">
          <h2 className="testi-title">
            <span className="i">Testimonials,</span> Success Stories from Our
            Users
          </h2>
          <div className="testi-subrow">
            <img src={curveImg} alt="arrow curve" className="testi-curve" />
            <span className="testi-quote">"Real Stories, Real Results"</span>
          </div>
          <div className="cards">
            <div className="card">
              <p className="card-text">
                "This builder made the process so simple—I had a professional
                resume ready in no time!"
              </p>
              <img className="stars-img" src={starsImg} alt="5 star rating" />
              <div className="card-user">
                <img className="avatar" src={avatar1} alt="Jennifer John" />
                <div className="name">Jennifer John</div>
              </div>
            </div>
            <div className="card">
              <p className="card-text">
                "The templates really helped me highlight my skills, and I
                started getting interview calls quickly."
              </p>
              <img className="stars-img" src={starsImg} alt="5 star rating" />
              <div className="card-user">
                <img className="avatar" src={avatar2} alt="Lilla James" />
                <div className="name">Lilla James</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / Promo Section (from Figma) */}
      <section className="newsletter">
        <div className="newsletter-top">
          <img className="nl-bg" src={rect1} alt="blue header background" />
          <h3 className="nl-headline">
            Save TimeBuild Your Resume Instantly with Resume Now’s AI Tool
          </h3>
          <button className="nl-cta">Make New Resume</button>
          {/* <svg className="nl-line" width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 50 C 40 10, 80 10, 112 26" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M112 26 l-10 -4 m10 4 l-8 8" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
          </svg> */}
          <img className="nl-card" src={resumes} alt="resume cards" />
        </div>
        <div className="newsletter-bottom">
          {/* <img className="nl-wave" src={rect2} alt="white wave" /> */}
          <div className="nl-content">
            <h3 className="nl-title">Join Our Newsletter</h3>
            <p className="nl-copy">
              Subscribe to our newsletter to get updated on our latest and new
              activities
            </p>
            <form className="nl-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Your Email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                disabled={newsletterLoading}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={newsletterLoading}>
                {newsletterLoading ? "Subscribing..." : "Subscribe now"}
              </button>
            </form>
          </div>
          <img
            className="nl-person"
            src={manImg}
            alt="smiling pointing student"
          />
        </div>
      </section>
      <section className="faq">
        <div className="faq-head">
          <span className="badge">Frequently Asked Questions</span>
          <h2 className="faq-title">
            Got questions? <span className="blue">We've got answers</span>{" "}
          </h2>
        </div>
        <div className="faq-list">
          {[
            {
              q: "How does BuildMyCV.ai differ from other CV builders?",
              a: "BuildMyCV.ai uses AI to analyze your target roles and generate bullet points, summaries, and skills tailored to ATS. It also provides wording alternatives and keyword coverage suggestions to improve match rates.",
            },
            {
              q: "What is ATS optimization and how does it help my CV?",
              a: "ATS (Applicant Tracking Systems) parse resumes to find keywords and structure. We ensure your resume uses clean formatting, correct headings, and role-specific keywords so it is easily parsed and ranked higher by ATS.",
            },
            {
              q: "How do Job Recommendation and Job Fit Analysis features work?",
              a: "We compare your resume against job descriptions using vector similarity to highlight strengths, gaps, and missing keywords. You get a Fit Score with targeted recommendations to boost your chances.",
            },
            {
              q: "Can I access BuildMyCV.ai on mobile devices?",
              a: "Yes. The builder is fully responsive; you can edit, generate content, and export your resume from phones and tablets.",
            },
            {
              q: "Is my data secure with BuildMyCV.ai?",
              a: "We encrypt data in transit (TLS) and at rest. Your resumes are private by default, and you can delete your data at any time from the dashboard.",
            },
            {
              q: "What are the pricing options and subscription terms?",
              a: "You can start for free. Pro plans unlock unlimited AI generations, premium templates, and advanced analytics. Subscriptions are monthly or yearly with easy cancellation.",
            },
          ].map((item, idx) => (
            <details className="faq-item" key={idx} open={idx === 0}>
              <summary>
                {/* <span className="q-icon">💬</span> */}
                <span className="q-text">{item.q}</span>
                <span className="chev" aria-hidden>
                  ▾
                </span>
              </summary>
              <div className="faq-answer">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Landing;
