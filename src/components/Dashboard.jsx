import React, { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../lib/api.js";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../context/AuthContext.jsx";
import ResumeUpload from "./ResumeUpload.jsx";
import TemplateCard from "./TemplateCard.jsx";
import { showToast } from "../lib/toast";

const HIDDEN_TEMPLATE_NAMES = new Set([
  // "Modern Flat",
  // "Scandinavian Modern",
  // "Swiss Design",
  // "Tech Lead",
  // "French Elegance",
  // "European Executive",
  // "Asian Professional",
  // "Innovative Modern",
  // "Business Consultant",
  // "Bold Statement",
  // "Designer Portfolio",
  // "Creative Blue",
  // "Executive Suite",
  // "Finance Professional",
  // "Healthcare Provider",
  // "Global Executive",
  // "Minimalist",
  // "Professional Elegant",
  // "Research Scholar",
  // "Simple Clean",
  // "Classic Business",
  // "German Precision",
  // "Japanese Minimalist",
  // "Startup Founder",
  // "Academic Scholar",
  // "Modern Executive",
  // "Operations Manager",
  // "Marketing Pro",
  // "Corporate Professional",
]);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTemplateSlug, setUploadTemplateSlug] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedResumePreview, setSelectedResumePreview] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await api.get("/api/v1/billing/subscription");
        setSubscriptionStatus(response.data?.data);
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      }
    };
    fetchSubscriptionStatus();
  }, [user]);

  // Consistent neutral palette so inputs look identical in both OS themes
  const THEME = {
    text: "#0f172a",
    sub: "#475569",
    muted: "#64748b",
    border: "#d0d7e3",
    inputBg: "#ffffff",
  };

  const formatPlanName = (plan) =>
    plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Free";

  const planAccent = (plan) => {
    if (plan === "premium") return "#7c3aed";
    if (plan === "professional") return "#2563eb";
    return "#0f172a";
  };

  const formatPeriodEnd = (value) => {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return null;
      return date.toLocaleDateString();
    } catch {
      return null;
    }
  };

  // Check for Stripe checkout success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const success = urlParams.get("success");

    if (success === "true" && sessionId) {
      showToast("Payment successful! Your subscription is now active.", {
        type: "success",
        duration: 5000,
      });
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard");

      // Refresh user data
      if (user) {
        // Wait a bit for webhook to process, then reload
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else if (urlParams.get("canceled") === "true") {
      showToast("Payment was canceled.", {
        type: "error",
        duration: 3000,
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const [t, r] = await Promise.all([
          api.get(
            `/api/v1/templates/public${
              category !== "all" ? `?category=${category}` : ""
            }`
          ),
          api.get("/api/v1/resumes"),
        ]);
        const items = t.data?.data?.items || [];
        const visibleTemplates = items.filter((tpl) => {
          const name = (tpl?.name || "").trim();
          return !HIDDEN_TEMPLATE_NAMES.has(name);
        });
        const sorted = [...visibleTemplates].sort((a, b) => {
          const an = (a.name || a.slug || "").toLowerCase();
          const bn = (b.name || b.slug || "").toLowerCase();
          return an.localeCompare(bn);
        });
        setTemplates(sorted);
        setResumes(r.data?.data?.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) =>
      [t.name, t.slug, t.tags?.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [templates, search]);

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    setDeleting(resumeId);
    try {
      await api.delete(`/api/v1/resumes/${resumeId}`);
      setResumes((prev) => prev.filter((r) => (r._id || r.id) !== resumeId));
    } catch (err) {
      alert("Failed to delete resume. Please try again.");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handlePreviewResume = async (resumeId) => {
    if (!resumeId) {
      console.error("❌ No resume ID provided");
      alert("Invalid resume ID. Please try again.");
      return;
    }

    console.log("🔍 handlePreviewResume called with ID:", resumeId);
    setIsPreviewLoading(true);
    try {
      // First, get the resume to verify it exists and belongs to user
      let resumeRes;
      try {
        resumeRes = await api.get(`/api/v1/resumes/${resumeId}`);
      } catch (err) {
        if (err.response?.status === 404) {
          alert("Resume not found. It may have been deleted.");
          return;
        }
        if (err.response?.status === 403) {
          alert("You don't have permission to view this resume.");
          return;
        }
        throw err;
      }

      const resumeData = resumeRes.data?.data?.resume || resumeRes.data?.data;
      if (!resumeData) {
        alert("Resume data not found. Please try again.");
        return;
      }

      // Get preview HTML
      let previewHtml = "";
      try {
        const previewRes = await api.get(`/api/v1/resumes/${resumeId}/preview`);
        previewHtml =
          previewRes.data?.data?.html || previewRes.data?.html || "";
      } catch (err) {
        console.warn("Server preview failed:", err);
        if (err.response?.status === 404) {
          alert(
            "Resume preview not available. The resume may not have a template assigned."
          );
          return;
        }
        // Continue with empty preview - will use fallback
      }

      // Find template
      const templateSlug = resumeData.templateSlug || resumeData.template?.slug;
      const template =
        templates.find((t) => t.slug === templateSlug) || templates[0];

      if (!template) {
        console.warn(
          "Template not found for resume, using first available template"
        );
      }

      console.log("💾 Setting modal data:", {
        resumeData,
        previewHtml: previewHtml.substring(0, 100) + "...",
        template: template?.name,
      });

      setSelectedResume(resumeData);
      setSelectedResumePreview(previewHtml);
      setSelectedTemplate(template);
      setShowPreviewModal(true);
      console.log("✅ Modal should be showing now");
    } catch (error) {
      console.error("❌ Failed to preview resume:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      alert(
        `Failed to load resume preview: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    if (!template?.slug) {
      console.error("No template selected");
      return;
    }

    try {
      // Create new resume with selected template
      const { data } = await api.post("/api/v1/resumes", {
        title: "My Resume",
        templateSlug: template.slug,
      });

      const resumeId = data.data.resumeId;

      // Navigate to builder
      navigate("/builder", {
        state: {
          resumeId,
          templateSlug: template.slug,
        },
      });
    } catch (error) {
      console.error("Failed to create resume:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create resume.";

      // Show specific message for premium template access
      if (error.response?.status === 402) {
        const shouldUpgrade = window.confirm(
          `${errorMessage}\n\nWould you like to upgrade to Premium to access this template?`
        );
        if (shouldUpgrade) {
          navigate("/pricing");
        }
      } else {
        alert(errorMessage);
      }
    }
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  return (
    <div style={{ position: "relative" }}>
      <Navbar />
      {showUpload && (
        <ResumeUpload
          onClose={() => {
            setShowUpload(false);
            setUploadTemplateSlug(null);
          }}
          selectedTemplateSlug={uploadTemplateSlug}
        />
      )}
      {isPreviewLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 45,
          }}>
          <div
            style={{
              background: "#ffffff",
              padding: "20px 26px",
              borderRadius: 14,
              boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
              textAlign: "center",
              minWidth: 260,
            }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "999px",
                border: "4px solid #e5e7eb",
                borderTopColor: "#2563eb",
                margin: "0 auto 12px",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              Loading preview…
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Generating a live preview of your resume.
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
          }}>
          <div
            style={{
              background: "#ffffff",
              padding: "20px 26px",
              borderRadius: 14,
              boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
              textAlign: "center",
              minWidth: 240,
            }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "999px",
                border: "4px solid #e5e7eb",
                borderTopColor: "#2563eb",
                margin: "0 auto 12px",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              Loading templates…
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Fetching your templates and resumes.
            </div>
            <style>
              {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "16px" }}>
        <style>{`#template-search::placeholder{color:${THEME.muted}}`}</style>

        {subscriptionStatus && (
          <div
            style={{
              border: `1px solid ${THEME.border}`,
              background: "#f8fafc",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: planAccent(subscriptionStatus.plan || "free"),
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 18,
              }}>
              {subscriptionStatus.plan
                ? subscriptionStatus.plan.charAt(0).toUpperCase()
                : "F"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: THEME.text }}>
                {subscriptionStatus.hasActiveSubscription
                  ? `${formatPlanName(subscriptionStatus.plan)} Plan`
                  : "You are on the Free plan"}
              </div>
              <div style={{ fontSize: 14, color: THEME.sub, marginTop: 4 }}>
                {subscriptionStatus.hasActiveSubscription
                  ? formatPeriodEnd(subscriptionStatus.currentPeriodEnd)
                    ? `Renews on ${formatPeriodEnd(
                        subscriptionStatus.currentPeriodEnd
                      )}`
                    : "Active subscription"
                  : "Unlock Premium features like AI, unlimited exports, and more."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}>
              {subscriptionStatus.hasActiveSubscription ? "Manage plan" : "Upgrade"}
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "8px 0 16px",
          }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Welcome back</h1>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
            <span style={{ fontSize: 18 }}>📤</span>
            Upload Resume
          </button>
        </div>

        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}>
            <div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: 0,
                  color: THEME.text,
                }}>
                Professional Templates
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: THEME.sub,
                  margin: "4px 0 0",
                }}>
                Choose from {templates.length} professionally designed resume
                templates
                <br />
                <span style={{ fontSize: 12, color: THEME.muted }}>
                  Each template has a unique layout optimized for different
                  industries
                </span>
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: "12px 16px 12px 40px",
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    width: 280,
                    fontSize: 14,
                    background: THEME.inputBg,
                    color: THEME.text,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  id="template-search"
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(37, 99, 235, 0.25)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = THEME.border;
                    e.target.style.boxShadow = "none";
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: THEME.muted,
                    fontSize: 16,
                  }}>
                  🔍
                </span>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: "12px 16px",
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 12,
                  fontSize: 14,
                  background: THEME.inputBg,
                  color: THEME.text,
                  cursor: "pointer",
                  outline: "none",
                  minWidth: 150,
                }}
                id="template-category">
                <option value="all">All Templates</option>
                <option value="free">Free Templates</option>
                <option value="premium">Premium Templates</option>
              </select>
            </div>
          </div>

          {/* Template Stats
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 24,
              padding: "16px 20px",
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                  {templates.length} Templates
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Total Available
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🆓</span>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#059669" }}>
                  {templates.filter((t) => t.category === "free").length} Free
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>No Cost</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>⭐</span>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#d97706" }}>
                  {templates.filter((t) => t.category === "premium").length}{" "}
                  Premium
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Advanced Features
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏥</span>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#0369a1" }}>
                  {templates.filter((t) => t.category === "industry").length}{" "}
                  Industry
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Role / sector specific
                </div>
              </div>
            </div>
          </div> */}

          {/* Templates Grid */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 400,
                    background: "#f1f5f9",
                    borderRadius: 16,
                    animation: "pulse 2s infinite",
                  }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#f8fafc",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
              }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 8,
                }}>
                No templates found
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                style={{
                  padding: "10px 20px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}>
              {filtered.map((t) => {
                const isPaid =
                  t.category === "premium" || t.category === "industry";
                const hasAccess =
                  subscriptionStatus?.hasActiveSubscription &&
                  (subscriptionStatus?.plan === "premium" ||
                    subscriptionStatus?.plan === "professional");
                const locked = isPaid && !hasAccess;

                const handleSelect = locked
                  ? () => navigate("/pricing")
                  : handleSelectTemplate;
                const handlePreview = locked
                  ? () => navigate("/pricing")
                  : handlePreviewTemplate;

                return (
                  <TemplateCard
                    key={t.slug}
                    template={t}
                    isPremium={isPaid}
                    locked={locked}
                    onSelect={handleSelect}
                    onPreview={handlePreview}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 16,
              color: "#0f172a",
            }}>
            Quick Actions
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}>
            <div
              style={{
                background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                border: "1px solid #bae6fd",
                borderRadius: 12,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => setShowUpload(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 25px rgba(14, 165, 233, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📤</div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: "0 0 4px",
                  color: "#0c4a6e",
                }}>
                Upload Resume
              </h3>
              <p style={{ fontSize: 13, color: "#0369a1", margin: 0 }}>
                Import your existing resume and let AI extract all information
              </p>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => {
                if (templates.length > 0) {
                  handleSelectTemplate(templates[0]);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 25px rgba(34, 197, 94, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: "0 0 4px",
                  color: "#14532d",
                }}>
                Start from Scratch
              </h3>
              <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>
                Create a new resume using our professional templates
              </p>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                border: "1px solid #fcd34d",
                borderRadius: 12,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => {
                // Scroll to templates section
                document
                  .querySelector('section[style*="marginBottom: 32"]')
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 25px rgba(245, 158, 11, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎨</div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: "0 0 4px",
                  color: "#92400e",
                }}>
                Browse Templates
              </h3>
              <p style={{ fontSize: 13, color: "#b45309", margin: 0 }}>
                Explore all available templates and find your perfect design
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 16,
              color: "#0f172a",
            }}>
            Your Resumes
          </h2>
          {resumes.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#f8fafc",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
              }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 8,
                }}>
                No resumes yet
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
                Create your first professional resume using our templates
              </p>
              <button
                onClick={() => {
                  if (templates.length > 0) {
                    handleSelectTemplate(templates[0]);
                  }
                }}
                style={{
                  padding: "12px 24px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}>
                Create Your First Resume
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}>
              {resumes.map((r, idx) => {
                const template = templates.find(
                  (t) => t.slug === r.templateSlug
                );
                const templateName =
                  template?.name || r.templateSlug || "Unknown";
                const templateColor = template?.ui?.accentColor || "#2563eb";
                const lastUpdated = r.updatedAt
                  ? new Date(r.updatedAt).toLocaleDateString()
                  : "";
                const isPremium = template?.category === "premium";

                return (
                  <div
                    key={r._id || r.id || idx}
                    style={{
                      border: `2px solid ${templateColor}20`,
                      borderRadius: 16,
                      background: "#fff",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = `0 12px 24px ${templateColor}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}>
                    {/* Template Preview Header */}
                    <div
                      style={{
                        height: "8px",
                        background: `linear-gradient(90deg, ${templateColor}, ${templateColor}80)`,
                      }}
                    />

                    <div style={{ padding: 20 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 12,
                        }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: `${templateColor}15`,
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                          }}>
                          📄
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 16,
                              color: "#0f172a",
                            }}>
                            {r.title || "Untitled Resume"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {templateName} {isPremium && "⭐"}
                          </div>
                        </div>
                      </div>

                      {lastUpdated && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}>
                          <span>🕒</span>
                          Last updated: {lastUpdated}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() =>
                            navigate("/builder", {
                              state: { resumeId: r._id || r.id },
                            })
                          }
                          style={{
                            flex: 1,
                            padding: "10px 16px",
                            borderRadius: 10,
                            background: templateColor,
                            color: "white",
                            border: "none",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}>
                          <span>✏️</span>
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            console.log(
                              "👁️ Eye button clicked for resume:",
                              r._id || r.id
                            );
                            handlePreviewResume(r._id || r.id);
                          }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "#059669",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          👁️
                        </button>
                        <button
                          onClick={() => handleDeleteResume(r._id || r.id)}
                          disabled={deleting === (r._id || r.id)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "#fff",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            cursor:
                              deleting === (r._id || r.id)
                                ? "not-allowed"
                                : "pointer",
                            opacity: deleting === (r._id || r.id) ? 0.6 : 1,
                            fontSize: 14,
                          }}>
                          {deleting === (r._id || r.id) ? "⏳" : "🗑️"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {/* Preview Modal */}
      {showPreviewModal && (selectedTemplate || selectedResume) && (
        <TemplatePreviewModal
          template={selectedTemplate}
          resume={selectedResume}
          resumePreview={selectedResumePreview}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedTemplate(null);
            setSelectedResume(null);
            setSelectedResumePreview("");
          }}
          onSelect={handleSelectTemplate}
        />
      )}
    </div>
  );
}

// Preview Modal Component
function TemplatePreviewModal({
  template,
  resume,
  resumePreview,
  onClose,
  onSelect,
}) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const isExportingRef = useRef(false);
  const exportClientWord = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isExportingRef.current) return; // Prevent duplicate calls
    isExportingRef.current = true;

    const html = previewHtml || resumePreview || "";
    if (!html) {
      showToast("No preview to export.", { type: "error" });
      isExportingRef.current = false;
      return;
    }
    const full = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:1in} body{font-family:Arial,Helvetica,sans-serif}</style></head><body>${html}</body></html>`;
    const blob = new Blob([full], { type: "application/msword" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const title =
      (resume?.title || template?.name || "resume")
        .replace(/[^\w\-\s]+/g, "")
        .trim() || "resume";
    a.href = url;
    a.download = `${title}-${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast("Exported Word (.doc) from preview", {
      type: "success",
      duration: 1800,
    });

    // Reset after a short delay to allow download to start
    setTimeout(() => {
      isExportingRef.current = false;
    }, 1000);
  };

  useEffect(() => {
    async function createPreview() {
      try {
        setLoading(true);

        // If we have a resume preview, use it directly
        if (resumePreview && resume) {
          console.log("🎯 Using resume preview directly:", {
            resumePreview: resumePreview.substring(0, 100) + "...",
            resume,
          });
          setPreviewHtml(resumePreview);
          setLoading(false);
          return;
        }

        // Use public template preview endpoint (no auth required, works for premium templates)
        if (!template?.slug) {
          console.error("No template available for preview");
          setPreviewHtml("<div>No template available for preview</div>");
          setLoading(false);
          return;
        }

        // Use the public template preview endpoint - allows previewing premium templates
        // This endpoint is public and doesn't require authentication or premium access
        try {
          // Use fetch directly since we need HTML text, not JSON
          const previewResponse = await fetch(
            `/api/v1/templates/${template.slug}/preview`,
            {
              method: "GET",
              headers: {
                "Content-Type": "text/html",
              },
              credentials: "include", // Include cookies for CORS
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
          return;
        } catch (previewErr) {
          console.error("Template preview failed:", previewErr);
          setPreviewHtml(`<div style="padding: 20px; text-align: center;">
            <h3>Preview Unavailable</h3>
            <p>Unable to load template preview. Please try again later.</p>
            <p style="color: #666; font-size: 12px;">${previewErr.message}</p>
          </div>`);
          setLoading(false);
        }

        // OLD METHOD - Creates temporary resume (hits premium restriction)
        // Use this only if template preview endpoint fails
        /*
        const { data } = await api.post("/api/v1/resumes", {
          title: "Preview",
          templateSlug: template.slug,
        });

        const tempResumeId = data.data.resumeId;

        // OLD METHOD - No longer needed, using public template preview endpoint above
        /*
        // Add sample data
        await api.patch(`/api/v1/resumes/${tempResumeId}`, {
          contact: {
            fullName: "John Doe",
            email: "john.doe@example.com",
            phone: "+1 (555) 123-4567",
            address: "San Francisco, CA",
            website: "johndoe.com",
            headline: "Senior Software Engineer",
            summary:
              "Experienced software engineer with 8+ years of expertise in full-stack development, team leadership, and scalable system architecture.",
          },
          experience: [
            {
              title: "Senior Software Engineer",
              company: "Tech Corp",
              location: "San Francisco, CA",
              startDate: "2020-01-01",
              current: true,
              bullets: [
                "Led development of microservices architecture serving 1M+ users",
                "Mentored team of 5 junior developers and improved code quality by 40%",
                "Implemented CI/CD pipeline reducing deployment time by 60%",
                "Collaborated with product team to deliver features on time and within budget",
              ],
            },
            {
              title: "Software Engineer",
              company: "StartupXYZ",
              location: "New York, NY",
              startDate: "2018-06-01",
              endDate: "2019-12-31",
              bullets: [
                "Developed React-based frontend applications with 99.9% uptime",
                "Built RESTful APIs using Node.js and PostgreSQL",
                "Participated in agile development process and code reviews",
              ],
            },
          ],
          education: [
            {
              degree: "Bachelor of Science in Computer Science",
              school: "University of California, Berkeley",
              location: "Berkeley, CA",
              startDate: "2013-09-01",
              endDate: "2017-05-31",
              details: [
                "GPA: 3.8/4.0",
                "Dean's List",
                "Relevant Coursework: Data Structures, Algorithms, Software Engineering",
              ],
            },
          ],
          skills: [
            { name: "JavaScript", level: 90 },
            { name: "React", level: 85 },
            { name: "Node.js", level: 85 },
            { name: "Python", level: 80 },
            { name: "PostgreSQL", level: 75 },
            { name: "AWS", level: 70 },
          ],
        });

        // Get preview HTML
        const previewRes = await api.get(
          `/api/v1/resumes/${tempResumeId}/preview`
        );
        setPreviewHtml(
          previewRes.data.data?.html || previewRes.data.html || ""
        );

        // Clean up temporary resume
        await api.delete(`/api/v1/resumes/${tempResumeId}`);
        */
      } catch (error) {
        console.error("Preview failed:", error);
        setPreviewHtml("<div>Failed to load preview</div>");
      } finally {
        setLoading(false);
      }
    }

    createPreview();
  }, [template?.slug, resumePreview, resume]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}>
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          width: "90vw",
          maxWidth: "1200px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
            {resume
              ? `${resume.title || "Resume"} Preview`
              : `${template?.name || "Template"} Preview`}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}>
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div>Loading preview...</div>
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              style={{
                width: "100%",
                height: "600px",
                border: "none",
                borderRadius: "8px",
              }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title="Resume Preview"
            />
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "white",
              color: "#374151",
              fontWeight: "600",
              cursor: "pointer",
            }}>
            Cancel
          </button>
          {/* {resume ? (
            <button
              onClick={exportClientWord}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
              }}>
              Download DOCX
            </button>
          ) : null} */}
          {/* <button
            onClick={() => onSelect(template)}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: template?.ui?.accentColor || "#2563eb",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
            }}>
            Use This Template
          </button> */}
        </div>
      </div>
    </div>
  );
}
