import React, { useState } from "react";
import "../css/SignIn.css";
import signInImage from "../assets/img2.jpg";
import googleIcon from "../assets/google.png";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  GoogleLogin,
  googleLogout,
  hasGrantedAnyScopeGoogle,
} from "@react-oauth/google";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div
        className="left-section"
        style={{
          backgroundImage: `url(${signInImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="right-section">
        <div className="signin-form-container">
          <h1 className="signin-title">Sign in</h1>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div
              className="google-signin-btn"
              style={{ padding: 0, border: "none", background: "transparent" }}>
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
              className="google-signin-btn"
              disabled
              title="Missing Google client id">
              <img src={googleIcon} alt="Google" className="google-icon" />
              Continue with Google
            </button>
          )}

          {import.meta.env.VITE_LINKEDIN_CLIENT_ID ? (
            <button
              type="button"
              className="google-signin-btn"
              onClick={() => {
                const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || "";
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
                authorizeUrl.searchParams.set("scope", "openid profile email");
                authorizeUrl.searchParams.set("state", state);
                window.location.href = authorizeUrl.toString();
              }}>
              Continue with LinkedIn
            </button>
          ) : null}

          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">OR</span>
            <span className="divider-line"></span>
          </div>

          {error && (
            <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
          )}
          <form className="signin-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">User name or email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="Write User name or email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input password-input"
                  placeholder="Write Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "👁"}
                </button>
              </div>
              <a href="#" className="forgot-password">
                Forgot your password?
              </a>
            </div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="signup-link">
            Don't have an account? <a href="/signup">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
