import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function VerifyEmailPrompt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sentRef = useRef(false); // Prevent duplicate sends

  // Cooldown timer effect
  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSend = async () => {
    // Prevent duplicate sends or during cooldown
    if (sending || cooldown > 0) return;
    
    setSending(true);
    try {
      await api.post("/api/v1/auth/send-verification");
      setSent(true);
      setCooldown(60); // 60 second cooldown
      showToast("Verification email sent successfully!", { type: "success" });
      
      // Reset sent status after showing success for a moment
      setTimeout(() => {
        setSent(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      showToast("Failed to send verification email. Please try again.", { type: "error" });
    } finally {
      setSending(false);
    }
  };

  // Removed automatic email send on mount - email is already sent during signup
  // User can manually resend if needed using the button

  return (
    <div style={{ background: "#f2f4f7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #dce3ef",
            borderRadius: 12,
            padding: 24,
            maxWidth: 520,
            width: "100%",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          }}>
          <h2 style={{ margin: "0 0 8px", color: "#0f172a" }}>Verify your email</h2>
          <p style={{ margin: "0 0 12px", color: "#475569" }}>
            {user?.email ? `We sent a verification link to ${user.email}.` : "We sent you a verification link."} Please check your inbox and click the link to continue.
          </p>
          <p style={{ margin: "0 0 16px", color: "#475569" }}>
            Didn't get it? You can resend the email below.
          </p>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <button
              onClick={handleSend}
              disabled={sending || sent || cooldown > 0}
              style={{
                background: sending || sent || cooldown > 0 ? "#94a3b8" : "#2563eb",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: sending || sent || cooldown > 0 ? "not-allowed" : "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
                opacity: sending || sent || cooldown > 0 ? 0.7 : 1,
                minWidth: "140px",
              }}
              onMouseEnter={(e) => {
                if (!sending && !sent && cooldown === 0) {
                  e.target.style.background = "#1d4ed8";
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!sending && !sent && cooldown === 0) {
                  e.target.style.background = "#2563eb";
                  e.target.style.transform = "translateY(0)";
                }
              }}>
              {sending ? "Sending..." : 
               sent ? "Email Sent!" : 
               cooldown > 0 ? `Resend (${cooldown}s)` : 
               "Resend Email"}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "#fff",
                color: "#64748b",
                border: "1px solid #d1d5db",
                padding: "12px 20px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#f8fafc";
                e.target.style.borderColor = "#9ca3af";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#fff";
                e.target.style.borderColor = "#d1d5db";
                e.target.style.transform = "translateY(0)";
              }}>
              I'll verify later
            </button>
          </div>
          {cooldown > 0 && (
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#f59e0b", background: "#fef3c7", padding: "8px 12px", borderRadius: 6, border: "1px solid #fde68a" }}>
              Please wait {cooldown} seconds before requesting another email.
            </p>
          )}
          <p style={{ margin: "16px 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Note: Some features require email verification to access.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

