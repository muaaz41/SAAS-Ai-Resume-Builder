import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import ResumeUpload from "./ResumeUpload.jsx";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Briefcase } from "@phosphor-icons/react";
import {
  filterAndSortTemplates,
  ChooseTemplateModal,
  UploadFlowTemplatePreviewModal,
} from "./startExistingResumeUi.jsx";

const ResumeStartFlow = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  /** Slug from template picker before upload (existing-resume flow) */
  const [uploadTemplateSlug, setUploadTemplateSlug] = useState(null);
  /** Which entry path opened the template modal: scratch → builder; upload → upload modal next */
  const [templateFlow, setTemplateFlow] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [importingLinkedIn, setImportingLinkedIn] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Use public endpoint that doesn't require authentication
        const response = await api.get("/api/v1/templates/public");
        const items = response.data?.data?.items || [];
        setTemplates(filterAndSortTemplates(items));
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

  const openTemplateModalForScratch = () => {
    if (templates.length > 0) {
      setTemplateFlow("scratch");
      setShowTemplateModal(true);
    }
  };

  const openTemplateModalForUpload = () => {
    if (templates.length > 0) {
      setTemplateFlow("upload");
      setShowTemplateModal(true);
    }
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setTemplateFlow(null);
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
            onClick={openTemplateModalForScratch}>
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
            onClick={openTemplateModalForUpload}>
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
              Choose a template first (preview or select), then upload your
              resume (PDF or Word). We extract your information and keep the
              same import-and-edit flow as before.
            </p>
          </div>
        </div>

        <ChooseTemplateModal
          open={showTemplateModal}
          onClose={closeTemplateModal}
          templates={templates}
          loading={loading}
          flow={templateFlow}
          onPickTemplate={(t) => {
            const flow = templateFlow;
            setShowTemplateModal(false);
            setTemplateFlow(null);
            if (flow === "upload") {
              setUploadTemplateSlug(t.slug);
              setShowUpload(true);
            } else {
              handleContinueToBuilder(t);
            }
          }}
          onPreviewTemplate={(tpl) => {
            setShowTemplateModal(false);
            setPreviewTemplate(tpl);
          }}
        />

        {/* Upload Modal */}
        {showUpload && uploadTemplateSlug && (
          <ResumeUpload
            onClose={() => {
              setShowUpload(false);
              setUploadTemplateSlug(null);
            }}
            selectedTemplateSlug={uploadTemplateSlug}
            hideTemplatePicker
          />
        )}

        {previewTemplate && (
          <UploadFlowTemplatePreviewModal
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onContinue={(t) => {
              const flow = templateFlow;
              setPreviewTemplate(null);
              setTemplateFlow(null);
              if (flow === "upload") {
                setUploadTemplateSlug(t.slug);
                setShowUpload(true);
              } else {
                handleContinueToBuilder(t);
              }
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ResumeStartFlow;

