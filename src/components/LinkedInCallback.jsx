import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";

export default function LinkedInCallback() {
  const { loginWithLinkedIn, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const error = params.get("error");
    const returnedState = params.get("state");
    const redirectUri =
      import.meta.env.VITE_LINKEDIN_REDIRECT_URI ||
      `${window.location.origin}/auth/linkedin/callback`;
    
    if (error) {
      setError(`LinkedIn error: ${error}`);
      return;
    }
    if (!code) {
      setError("Missing authorization code");
      return;
    }
    const expectedState = sessionStorage.getItem("li_oauth_state");
    // Enforce state only when both sides are present; relax if missing to ease local dev
    if (returnedState && expectedState && returnedState !== expectedState) {
      setError("Invalid state parameter");
      return;
    }
    
    const isImportFlow = sessionStorage.getItem("li_import_flow") === "true";
    const pendingTemplateSlug = sessionStorage.getItem("pendingTemplateSlug");
    
    (async () => {
      try {
        // If user is not logged in, log them in first
        if (!token) {
          setStatus("Signing you in...");
          await loginWithLinkedIn(code, redirectUri);
        }
        
        // If this is an import flow, import the resume
        if (isImportFlow) {
          sessionStorage.removeItem("li_import_flow");
          setStatus("Importing your LinkedIn profile...");
          
          // Get default template if none selected
          let templateSlug = pendingTemplateSlug;
          if (!templateSlug) {
            try {
              const templatesRes = await api.get("/api/v1/templates/public");
              const templates = templatesRes.data?.data?.items || [];
              const freeTemplate = templates.find((t) => t.category === "free");
              templateSlug = freeTemplate?.slug || templates[0]?.slug || "modern-slate";
            } catch (e) {
              templateSlug = "modern-slate";
            }
          }
          sessionStorage.removeItem("pendingTemplateSlug");
          
          // Call import endpoint
          const importRes = await api.post("/api/v1/resumes/import/linkedin", {
            code,
            redirectUri,
            templateSlug,
          });
          
          const resumeId = importRes.data?.data?.resumeId;
          if (resumeId) {
            showToast("LinkedIn profile imported successfully!", { type: "success" });
            navigate("/builder", {
              state: {
                resumeId,
                templateSlug,
              },
            });
          } else {
            throw new Error("Failed to import LinkedIn profile");
          }
        } else {
          // Regular login flow
          navigate("/dashboard");
        }
      } catch (e) {
        console.error("LinkedIn callback error:", e);
        setError(e.response?.data?.message || e.message || "LinkedIn import failed");
        showToast("Failed to import LinkedIn profile", { type: "error" });
      }
    })();
  }, [location.search, navigate, loginWithLinkedIn, token]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
        textAlign: "center",
      }}>
      {error ? (
        <>
          <div style={{ color: "#dc2626", fontSize: "18px", marginBottom: "16px" }}>
            ❌ {error}
          </div>
          <button
            onClick={() => navigate("/resume-start")}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
            }}>
            Go Back
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e5e7eb",
              borderTopColor: "#0077b5",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 0.9s linear infinite",
            }}
          />
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
          <div style={{ fontSize: "16px", color: "#64748b" }}>{status}</div>
        </>
      )}
    </div>
  );
}
