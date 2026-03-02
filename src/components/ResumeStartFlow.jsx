import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import ResumeUpload from "./ResumeUpload.jsx";
import TemplateCard from "./TemplateCard.jsx";
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
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
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

  const handleContinueToBuilder = (template) => {
    // Navigate to builder with selected template
    navigate("/builder", {
      state: {
        startFresh: true,
        templateSlug: template.slug,
      },
    });
  };

  const handleUploadClick = () => {
    // Allow both logged in and non-logged in users to upload
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
                setShowTemplateModal(true);
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

        {/* Template selection modal – template tiles (like dashboard) */}
        {showTemplateModal && (
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
              overflow: "auto",
            }}
            onClick={() => setShowTemplateModal(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "32px",
                maxWidth: "1100px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.2)",
                border: "1px solid #e2e8f0",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: "#0f172a",
                  }}
                >
                  Choose a Template
                </h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "28px",
                    cursor: "pointer",
                    color: "#64748b",
                    lineHeight: 1,
                    padding: "4px",
                  }}
                >
                  ×
                </button>
              </div>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "#64748b",
                  marginBottom: "24px",
                }}
              >
                Preview any template or use it to start building your resume.
              </p>

              {loading ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 520,
                        background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                        borderRadius: 20,
                        border: "1px solid #e2e8f0",
                        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                    />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    background: "#f8fafc",
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <p style={{ fontSize: "1rem", color: "#64748b", margin: 0 }}>
                    No templates available. Please try again later.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                  }}
                >
                  {templates.map((t) => {
                    const isPremium =
                      t.category === "premium" || t.category === "industry";
                    return (
                      <TemplateCard
                        key={t.slug}
                        template={t}
                        isPremium={isPremium}
                        locked={false}
                        fullPreview
                        onSelect={() => {
                          setShowTemplateModal(false);
                          handleContinueToBuilder(t);
                        }}
                        onPreview={(template) => {
                          setShowTemplateModal(false);
                          setPreviewTemplate(template);
                        }}
                      />
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

        {/* Template Preview Modal */}
        {previewTemplate && (
          <TemplatePreviewModal
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onContinue={handleContinueToBuilder}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

// Template Preview Modal Component
function TemplatePreviewModal({ template, onClose, onContinue }) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function createPreview() {
      try {
        setLoading(true);

        if (!template?.slug) {
          console.error("No template available for preview");
          setPreviewHtml("<div>No template available for preview</div>");
          setLoading(false);
          return;
        }

        // Use the public template preview endpoint
        try {
          const previewResponse = await fetch(
            `/api/v1/templates/${template.slug}/preview`,
            {
              method: "GET",
              headers: {
                "Content-Type": "text/html",
              },
              credentials: "include",
            }
          );

          if (!previewResponse.ok) {
            throw new Error(
              `Preview failed: ${previewResponse.status} ${previewResponse.statusText}`
            );
          }

          const htmlContent = await previewResponse.text();
          setPreviewHtml(htmlContent);
          setLoading(false);
        } catch (previewErr) {
          console.error("Template preview failed:", previewErr);
          setPreviewHtml(`<div style="padding: 20px; text-align: center;">
            <h3>Preview Unavailable</h3>
            <p>Unable to load template preview. Please try again later.</p>
            <p style="color: #666; font-size: 12px;">${previewErr.message}</p>
          </div>`);
          setLoading(false);
        }
      } catch (error) {
        console.error("Preview failed:", error);
        setPreviewHtml("<div>Failed to load preview</div>");
        setLoading(false);
      }
    }

    createPreview();
  }, [template?.slug]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "95vw",
          maxWidth: "900px",
          height: "92vh",
          maxHeight: "1000px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
          border: "1px solid #e2e8f0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              {template?.name || "Template Preview"}
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "0.875rem",
                color: "#64748b",
              }}
            >
              {template?.name} • Live Preview
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "2rem",
              cursor: "pointer",
              color: "#64748b",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            ×
          </button>
        </div>

        {/* Preview Body */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            background: "#f1f5f9",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "32px 20px",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#64748b",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "999px",
                  border: "4px solid #e5e7eb",
                  borderTopColor: "#2563eb",
                  animation: "spin 1s linear infinite",
                  marginBottom: 16,
                }}
              />
              <div style={{ fontSize: "1rem", fontWeight: "600" }}>
                Loading preview...
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "210mm",
                minHeight: "297mm",
                background: "#fff",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #d1d5db",
              }}
            >
              <iframe
                srcDoc={previewHtml}
                title="Resume Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "297mm",
                  border: "none",
                  background: "#fff",
                  display: "block",
                }}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px 28px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#475569",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Close
          </button>
          <button
            onClick={() => onContinue?.(template)}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
            }}
          >
            Continue
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ResumeStartFlow;

