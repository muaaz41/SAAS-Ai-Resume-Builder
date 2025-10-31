import React, { useState } from "react";
import "../css/SignUp.css";
import signUpImage from "../assets/img1.jpg";
import googleIcon from "../assets/plus.png";
import linkedinIcon from "../assets/linkedin.png";
import { useAuth } from "../context/AuthContext.jsx";
import { showToast } from "../lib/toast";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({ name, email, password, dob });
      showToast("Account created! You're in.", { type: "success", duration: 2500 });
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.message || "Signup failed";
      // Show a friendly toast for known conflicts
      if (err?.status === 409 || /already/i.test(msg)) {
        showToast("Email already in use. Try logging in with this account.");
        setError("");
      } else {
        showToast(msg);
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="left-section">
        <div className="signup-form-container">
          <h1 className="signup-title">Sign up</h1>
          <p className="signup-subtitle">
            Sign up to enjoy the feature of Revolutie
          </p>

          {error && (
            <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
          )}
          <form className="signup-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <div className="date-input-container">
                <input
                  type="date"
                  className="form-input date-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  min="1900-01-01"
                  max={today}
                  aria-label="Date of Birth"
                />
                <span className="calendar-icon">📅</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}>
                  👁
                </button>
              </div>
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          <div className="divider">
            <span className="divider-text">OR</span>
          </div>

          <div className="social-buttons">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div
                className="google-signup-btn"
                style={{
                  padding: 0,
                  border: "none",
                  background: "transparent",
                }}>
                <GoogleLogin
                  onSuccess={async (cred) => {
                    const idToken = cred.credential;
                    if (!idToken) return;
                    try {
                      await loginWithGoogle(idToken);
                      navigate("/dashboard");
                    } catch (e) {
                      setError("Google sign-in failed");
                    }
                  }}
                  onError={() => setError("Google sign-in failed")}
                />
              </div>
            ) : (
              <button
                className="google-signup-btn"
                disabled
                title="Missing Google client id">
                <img src={googleIcon} alt="Google" className="social-icon" />
                Continue with Google
              </button>
            )}

            {import.meta.env.VITE_LINKEDIN_CLIENT_ID ? (
              <button
                type="button"
                className="linkedin-signup-btn"
                onClick={() => {
                  const clientId =
                    import.meta.env.VITE_LINKEDIN_CLIENT_ID || "";
                  const redirectUri =
                    import.meta.env.VITE_LINKEDIN_REDIRECT_URI ||
                    "http://localhost:5173/auth/linkedin/callback";
                  const state = Math.random().toString(36).slice(2);
                  sessionStorage.setItem("li_oauth_state", state);
                  const authorizeUrl = new URL(
                    "https://www.linkedin.com/oauth/v2/authorization"
                  );
                  authorizeUrl.searchParams.set("response_type", "code");
                  authorizeUrl.searchParams.set("client_id", clientId);
                  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
                  authorizeUrl.searchParams.set(
                    "scope",
                    "openid profile email"
                  );
                  authorizeUrl.searchParams.set("state", state);
                  window.location.href = authorizeUrl.toString();
                }}>
                <img
                  src={linkedinIcon}
                  alt="LinkedIn"
                  className="social-icon"
                />
                Continue with LinkedIn
              </button>
            ) : (
              <button
                className="linkedin-signup-btn"
                disabled
                title="Missing LinkedIn client id">
                <img
                  src={linkedinIcon}
                  alt="LinkedIn"
                  className="social-icon"
                />
                Continue with LinkedIn
              </button>
            )}
          </div>

          <div className="signin-link">
            Already have an account? <a href="/signin">Sign in</a>
          </div>
        </div>
      </div>

      <div
        className="right-section"
        style={{
          backgroundImage: `url(${signUpImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
};

export default SignUp;
