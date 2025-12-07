import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../context/AuthContext.jsx";

export default function VerifyEmailResult() {
  const [status, setStatus] = useState("pending");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    (async () => {
      try {
        const res = await api.get(`/api/v1/auth/verify?token=${encodeURIComponent(token)}`);
        if (res?.data?.data?.token) {
          localStorage.setItem("accessToken", res.data.data.token);
        }
        await refreshUser();
        setStatus("success");
        showToast("Email verified!", { type: "success" });
        // Check for post-verification redirect
        const postVerificationRedirect = sessionStorage.getItem("postVerificationRedirect");
        const postVerificationTemplateSlug = sessionStorage.getItem("postVerificationTemplateSlug");
        const postVerificationAction = sessionStorage.getItem("postVerificationAction");
        
        // Clear session storage
        sessionStorage.removeItem("postVerificationRedirect");
        sessionStorage.removeItem("postVerificationTemplateSlug");
        sessionStorage.removeItem("postVerificationAction");
        
        if (postVerificationRedirect) {
          if (postVerificationRedirect === "/builder" && postVerificationTemplateSlug) {
            navigate("/builder", {
              state: {
                startFresh: true,
                templateSlug: postVerificationTemplateSlug,
              },
            });
          } else if (postVerificationAction === "upload") {
            navigate("/dashboard", { state: { action: "upload" } });
          } else {
            navigate(postVerificationRedirect);
          }
        } else {
          setTimeout(() => navigate("/dashboard"), 800);
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        showToast("Verification link invalid or expired", { type: "error" });
      }
    })();
  }, [searchParams, navigate, refreshUser]);

  const renderContent = () => {
    if (status === "pending") {
      return "Verifying your email...";
    }
    if (status === "success") {
      return "Email verified! Redirecting to dashboard...";
    }
    return "Verification link invalid or expired.";
  };

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
          <h2 style={{ margin: "0 0 8px", color: "#0f172a" }}>Email Verification</h2>
          <p style={{ margin: 0, color: "#475569" }}>{renderContent()}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

