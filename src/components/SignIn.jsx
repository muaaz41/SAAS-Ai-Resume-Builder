import React, { useState } from "react";
import "../css/SignIn.css";
import signInImage from "../assets/img2.jpg";
import googleIcon from "../assets/google.png";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { showToast } from "../lib/toast";
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
  const [showRestore, setShowRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      showToast("Welcome back!", { type: "success", duration: 2500 });
      navigate("/dashboard");
    } catch (err) {
      let msg;
      if (err?.status === 401 || /invalid/i.test(err?.message || "")) {
        msg = "Invalid email or password";
      } else if (err?.status === 403) {
        // Soft-deleted account
        msg =
          err?.message ||
          "This account has been deleted. Contact support within 30 days to request restoration, or sign up with a different email.";
        setShowRestore(true);
      } else {
        msg = err?.message || "Login failed";
      }
      showToast(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      {/* Header/Navbar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px 24px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            fontWeight: 600,
            color: "#2563eb",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
          ← Back to Home
        </button>
        <div
          onClick={() => navigate("/")}
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
            cursor: "pointer",
          }}>
          AI Resume Builder
        </div>
      </div>

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
                  if (!idToken) {
                    setError("No ID token received from Google");
                    return;
                  }
                  try {
                    setLoading(true);
                    setError("");
                    await loginWithGoogle(idToken);
                    showToast("Welcome! Signed in with Google", {
                      type: "success",
                    });
                    navigate("/dashboard");
                  } catch (e) {
                    console.error("Google login error:", e);
                    const errorMsg =
                      e?.message || "Google sign-in failed. Please try again.";
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
          {showRestore && (
            <div
              style={{
                marginBottom: 16,
                fontSize: 13,
                color: "#b91c1c",
                lineHeight: 1.5,
              }}>
              This account has been deleted but may be restorable for up to 30 days.
              You can try to restore it using the same email and password you used
              before deleting.
              <br />
              <button
                type="button"
                onClick={async () => {
                  if (restoring) return;
                  setRestoring(true);
                  setError("");
                  try {
                    const res = await api.post("/api/v1/auth/restore", {
                      email,
                      password,
                    });
                    const msg =
                      res.data?.message ||
                      res.data?.data?.message ||
                      "Account restored successfully";
                    showToast(msg, { type: "success", duration: 3000 });
                    navigate("/dashboard");
                  } catch (err) {
                    console.error("Restore account error:", err);
                    const msg =
                      err.response?.data?.message ||
                      "Failed to restore account. The 30-day window may have expired or the credentials are incorrect.";
                    showToast(msg, { type: "error" });
                    setError(msg);
                  } finally {
                    setRestoring(false);
                  }
                }}
                style={{
                  marginTop: 8,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: restoring ? "not-allowed" : "pointer",
                }}>
                {restoring ? "Restoring..." : "Restore my account"}
              </button>
            </div>
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
              <a href="/auth/forgot-password" className="forgot-password">
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
