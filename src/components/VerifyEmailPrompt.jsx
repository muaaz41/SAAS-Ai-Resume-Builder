import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function VerifyEmailPrompt() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const sentRef = useRef(false); // Prevent duplicate sends

  const handleSend = async () => {
    // Prevent duplicate sends
    if (sending || sentRef.current) return;
    
    setSending(true);
    sentRef.current = true;
    try {
      await api.post("/api/v1/auth/send-verification");
      setSent(true);
      showToast("Verification email sent", { type: "success" });
    } catch (err) {
      console.error(err);
      sentRef.current = false; // Reset on error so user can retry
      showToast("Failed to send verification email", { type: "error" });
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
            Didn’t get it? You can resend the email below.
          </p>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}>
            {sending ? "Sending..." : sent ? "Resend email" : "Send verification email"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

