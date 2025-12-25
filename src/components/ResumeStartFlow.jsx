import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import ResumeUpload from "./ResumeUpload.jsx";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Briefcase } from "@phosphor-icons/react";

const HIDDEN_TEMPLATE_NAMES = new Set([
  // Add any templates to hide here
]);

const ResumeStartFlow = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [importingLinkedIn, setImportingLinkedIn] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Use public endpoint that doesn't require authentication
        const response = await api.get("/api/v1/templates/public");
        const items = response.data?.data?.items || [];
        // Filter and sort alphabetically
        const sorted = [...items]
          .filter((t) => {
            const name = (t?.name || "").trim();
            return t.isActive !== false && !HIDDEN_TEMPLATE_NAMES.has(name);
          })
          .sort((a, b) => {
            const an = (a.name || "").toLowerCase();
            const bn = (b.name || "").toLowerCase();
            return an.localeCompare(bn);
          });
        setTemplates(sorted);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
        // Don't show error toast for 401/403 as user might not be logged in
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          showToast("Failed to load templates. Please try again.", { type: "error" });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (template) => {
    // Check if user needs to sign in
    if (!token) {
      sessionStorage.setItem("pendingTemplateSlug", template.slug);
      sessionStorage.setItem("pendingFlow", "builder");
      navigate("/signin", {
        state: { redirectTo: "/builder", templateSlug: template.slug },
      });
      return;
    }

    // User is logged in, proceed to builder
    navigate("/builder", {
      state: {
        startFresh: true,
        templateSlug: template.slug,
      },
    });
  };

  const handleUploadClick = () => {
    if (!token) {
      sessionStorage.setItem("pendingFlow", "upload");
      navigate("/signin", {
        state: { redirectTo: "/dashboard", action: "upload" },
      });
      return;
    }
    setShowUpload(true);
  };

  const handleUploadComplete = (resumeId, templateSlug) => {
    setShowUpload(false);
    navigate("/builder", {
      state: {
        resumeId,
        templateSlug,
      },
    });
  };

  const handleLinkedInImport = () => {
    if (!token) {
      // Save flow state and redirect to sign in
      sessionStorage.setItem("pendingFlow", "linkedin-import");
      navigate("/signin", {
        state: { redirectTo: "/resume-start", action: "linkedin-import" },
      });
      return;
    }

    // User is logged in, initiate LinkedIn OAuth
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || "";
    if (!clientId) {
      showToast("LinkedIn integration is not configured", { type: "error" });
      return;
    }

    const redirectUri =
      import.meta.env.VITE_LINKEDIN_REDIRECT_URI ||
      `${window.location.origin}/auth/linkedin/callback`;
    
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem("li_oauth_state", state);
    sessionStorage.setItem("li_import_flow", "true"); // Flag for import flow
    
    const authorizeUrl = new URL(
      "https://www.linkedin.com/oauth/v2/authorization"
    );
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", "openid profile email");
    authorizeUrl.searchParams.set("state", state);
    
    window.location.href = authorizeUrl.toString();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f2f4f7" }}>
      <Navbar />
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px",
        }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
            }}>
            Create Your Professional Resume
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "#64748b",
              maxWidth: "600px",
              margin: "0 auto",
            }}>
            Choose how you'd like to get started. Import from LinkedIn, upload an existing resume, or start fresh with our professional templates.
          </p>
        </div>

        {/* Choice Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "48px",
          }}>
          {/* LinkedIn Import Option */}
          {/* <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              border: "2px solid #e5e7eb",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#0077b5";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(0, 119, 181, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "none";
            }}
            onClick={handleLinkedInImport}>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Briefcase size={48} weight="regular" />
            </div>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#0f172a",
                marginBottom: "12px",
                textAlign: "center",
              }}>
              Import from LinkedIn
            </h3>
            <p
              style={{
                fontSize: "1rem",
                color: "#64748b",
                textAlign: "center",
                lineHeight: "1.6",
              }}>
              Connect your LinkedIn profile to automatically import your work experience, education, and skills. Quick and easy!
            </p>
            {importingLinkedIn && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "16px",
                  color: "#0077b5",
                  fontSize: "14px",
                }}>
                Connecting to LinkedIn...
              </div>
            )}
          </div> */}

          {/* Start Fresh Option */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              border: "2px solid #e5e7eb",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#2563eb";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(37, 99, 235, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "none";
            }}
            onClick={() => {
              if (templates.length > 0) {
                // Show template selection
                setSelectedTemplate("select");
              }
            }}>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                textAlign: "center",
              }}>
              ✨
            </div>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#0f172a",
                marginBottom: "12px",
                textAlign: "center",
              }}>
              Start from Scratch
            </h3>
            <p
              style={{
                fontSize: "1rem",
                color: "#64748b",
                textAlign: "center",
                lineHeight: "1.6",
              }}>
              Build your resume from the ground up using our professional
              templates. Perfect for creating a customized resume tailored to
              your needs.
            </p>
          </div>

          {/* Upload Resume Option */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              border: "2px solid #e5e7eb",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#059669";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(5, 150, 105, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "none";
            }}
            onClick={handleUploadClick}>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                textAlign: "center",
              }}>
              📤
            </div>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#0f172a",
                marginBottom: "12px",
                textAlign: "center",
              }}>
            Start with Existing Resume
            </h3>
            <p
              style={{
                fontSize: "1rem",
                color: "#64748b",
                textAlign: "center",
                lineHeight: "1.6",
              }}>
              Upload your current resume (PDF or Word) and we'll extract all
              your information automatically. Then customize it with our
              templates.
            </p>
          </div>
        </div>

        {/* Template Selection Modal */}
        {selectedTemplate === "select" && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: "20px",
            }}>
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "32px",
                maxWidth: "900px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
              }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}>
                <h2
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: "#0f172a",
                  }}>
                  Choose a Template
                </h2>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#64748b",
                  }}>
                  ×
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "4px solid #e5e7eb",
                      borderTopColor: "#2563eb",
                      borderRadius: "50%",
                      margin: "0 auto",
                      animation: "spin 0.9s linear infinite",
                    }}
                  />
                  <style>
                    {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                  </style>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "16px",
                  }}>
                  {templates.map((template) => {
                    const isPremium =
                      template.category === "premium" ||
                      template.category === "industry";
                    return (
                      <div
                        key={template.slug}
                        onClick={() => handleSelectTemplate(template)}
                        style={{
                          border: "2px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "16px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "white",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#2563eb";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}>
                        {isPremium && (
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              background: "#fbbf24",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "bold",
                            }}>
                            PREMIUM
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#0f172a",
                            marginTop: "8px",
                          }}>
                          {template.name || template.slug}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            marginTop: "4px",
                          }}>
                          {template.category || "free"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <ResumeUpload
            onClose={() => setShowUpload(false)}
            onImport={handleUploadComplete}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ResumeStartFlow;

