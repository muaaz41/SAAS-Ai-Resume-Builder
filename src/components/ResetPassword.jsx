import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      showToast("Reset token missing", { type: "error" });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast("Reset token missing", { type: "error" });
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", { type: "error" });
      return;
    }
    if (password !== confirm) {
      showToast("Passwords do not match", { type: "error" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/v1/auth/reset-password", { token, password });
      showToast("Password reset successful. Please sign in.", { type: "success" });
      navigate("/signin");
    } catch (err) {
      console.error(err);
      showToast("Reset link invalid or expired", { type: "error" });
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
          <h2 style={{ margin: "0 0 8px", color: "#0f172a" }}>Set a new password</h2>
          <p style={{ margin: "0 0 16px", color: "#475569" }}>
            Enter and confirm your new password.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #dce3ef",
              marginBottom: 12,
              fontSize: 14,
            }}
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
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
            {loading ? "Saving..." : "Reset password"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

