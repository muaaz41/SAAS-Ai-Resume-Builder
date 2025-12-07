import React, { useState } from "react";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Enter your email", { type: "error" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", { email: email.trim() });
      showToast("If the email exists, a reset link was sent", { type: "success" });
    } catch (err) {
      console.error(err);
      showToast("Failed to send reset link", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#f2f4f7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            border: "1px solid #dce3ef",
            borderRadius: 12,
            padding: 24,
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          }}>
          <h2 style={{ margin: "0 0 8px", color: "#0f172a" }}>Forgot password</h2>
          <p style={{ margin: "0 0 16px", color: "#475569" }}>
            Enter your email and we’ll send you a reset link.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #dce3ef",
              marginBottom: 12,
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

