import React, { useState, useEffect } from "react";
import "../css/SignUp.css";
import signUpImage from "../assets/img1.jpg";
import googleIcon from "../assets/google.png";
import linkedinIcon from "../assets/linkedin.png";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { showToast } from "../lib/toast";
import {
  GoogleLogin,
  googleLogout,
  hasGrantedAnyScopeGoogle,
} from "@react-oauth/google";
import { Calendar } from "@phosphor-icons/react";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
      };
      if (dob) {
        payload.dob = dob;
      }
      await signup(payload);
      showToast("Account created successfully!", {
        type: "success",
        duration: 2500,
      });
      
      // Check for pending flow redirect
      const pendingFlow = sessionStorage.getItem("pendingFlow");
      const pendingTemplateSlug = sessionStorage.getItem("pendingTemplateSlug");
      const redirectTo = location.state?.redirectTo;
      const templateSlug = location.state?.templateSlug || pendingTemplateSlug;
      
      // Clear session storage
      sessionStorage.removeItem("pendingFlow");
      sessionStorage.removeItem("pendingTemplateSlug");
      
      // If there's a redirect path, go there after verification
      if (redirectTo && templateSlug) {
        sessionStorage.setItem("postVerificationRedirect", redirectTo);
        sessionStorage.setItem("postVerificationTemplateSlug", templateSlug);
      } else if (pendingFlow === "builder" && pendingTemplateSlug) {
        sessionStorage.setItem("postVerificationRedirect", "/builder");
        sessionStorage.setItem("postVerificationTemplateSlug", pendingTemplateSlug);
      } else if (pendingFlow === "upload") {
        sessionStorage.setItem("postVerificationRedirect", "/dashboard");
        sessionStorage.setItem("postVerificationAction", "upload");
      }
      
      navigate("/auth/verify-email");
    } catch (err) {
      const msg =
        err?.status === 409 || /already/i.test(err?.message || "")
          ? "Email already in use"
          : err?.message || "Signup failed";
      showToast(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="left-section">
        <div className="signup-form-container">
          <h1 className="signup-title">Sign up</h1>
          <p className="signup-subtitle">Create your account to get started</p>

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
                    if (!idToken) {
                      setError("No ID token received from Google");
                      return;
                    }
                    try {
                      setLoading(true);
                      setError("");
                      await loginWithGoogle(idToken);
                      showToast("Welcome! Signed up with Google", {
                        type: "success",
                      });
                      navigate("/dashboard");
                    } catch (e) {
                      console.error("Google login error:", e);
                      const errorMsg =
                        e?.message ||
                        "Google sign-in failed. Please try again.";
                      setError(errorMsg);
                      showToast(errorMsg, { type: "error" });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={(error) => {
                    console.error("Google OAuth error:", error);
                    setError("Google sign-in was canceled or failed");
                    showToast("Google sign-in failed", { type: "error" });
                  }}
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
                    `${window.location.origin}/auth/linkedin/callback`;
                  const state = Math.random().toString(36).slice(2);
                  sessionStorage.setItem("li_oauth_state", state);
                  
                  // Check if this is part of an import flow
                  const pendingFlow = sessionStorage.getItem("pendingFlow");
                  if (pendingFlow === "linkedin-import") {
                    sessionStorage.setItem("li_import_flow", "true");
                  }
                  
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
            ) : null}
          </div>

          <div className="divider">
            <span className="divider-text">OR</span>
          </div>

          {error && (
            <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
          )}
          <form className="signup-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className={`form-input ${email ? "email-input" : ""}`}
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth (Optional)</label>
              <div className="date-input-container">
                <input
                  type="date"
                  className="form-input date-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                <span className="calendar-icon"><Calendar size={20} weight="regular" /></span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input password-input"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "👁"}
                </button>
              </div>
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

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
