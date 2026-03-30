import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, FileText, GearSix, ArrowCircleUp, Crown, MagnifyingGlass, Copy } from "phosphor-react";
import { ShieldCheck, UploadIcon } from "@phosphor-icons/react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { showToast } from "../lib/toast";
import { showAlert, showConfirm } from "../lib/alert.js";
import Footer1 from "./Footer1.jsx";
import ResumeUpload from "./ResumeUpload.jsx";
import TemplateCard from "./TemplateCard.jsx";

// A3 grid preview (same as TemplateCard – show full content)
const A3_W = 842;
const A3_H = 1191;
const PREVIEW_H = 420;
function injectA3GridPreview(html) {
  const style =
    "<style>" +
    "html,body{margin:0 !important;padding:0 !important;width:842px;min-height:1191px;height:1191px;overflow:hidden;box-sizing:border-box;scrollbar-width:none;-ms-overflow-style:none;background:#ffffff !important;}" +
    "html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;}" +
    "*{box-sizing:border-box;}" +
    // Force common wrapper patterns to full width in card previews
    "body>*{width:100% !important;max-width:100% !important;margin-left:0 !important;margin-right:0 !important;}" +
    "main,section,article,[class*='container'],[class*='wrapper'],[id*='container'],[id*='wrapper']{max-width:100% !important;}" +
    "[class*='resume'],[id*='resume']{max-width:100% !important;margin-left:0 !important;margin-right:0 !important;}" +
    ".resume-wrapper{width:100% !important;max-width:100% !important;display:block !important;}" +
    ".paper,article.paper{width:100% !important;max-width:100% !important;margin:0 auto 0 auto !important;border:1px solid #e5e7eb !important;border-bottom-width:2px !important;border-radius:4px !important;}" +
    ".content-wrapper{padding:0 !important;margin:0 !important;}" +
    ".page{width:100% !important;max-width:100% !important;min-height:0 !important;margin:0 !important;box-shadow:none !important;padding:24px 14px 18px 16px !important;}" +
    "#resume{width:100% !important;max-width:100% !important;margin:0 !important;padding:12px 14px !important;box-sizing:border-box !important;border:none !important;box-shadow:none !important;background:#ffffff !important;}" +
    // Template-specific fixes (these templates enforce fixed page width + gray background)
    ".resume.talha-professional,.resume.strassburg-professional{width:100% !important;max-width:100% !important;margin:0 !important;box-shadow:none !important;border:none !important;}" +
    "</style>";
  if (typeof html !== "string") return html;
  if (html.includes("<head>")) return html.replace("<head>", "<head>" + style);
  return "<!DOCTYPE html><html><head>" + style + "</head><body>" + html + "</body></html>";
}

function ResumeCardPreview({ resumeId }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(320);
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!resumeId) return;
    setLoading(true);
    setError(false);
    setHtml(null);
    api
      .get(`/api/v1/resumes/${resumeId}/preview`)
      .then((res) => {
        const h = res.data?.data?.html || res.data?.html || "";
        setHtml(h || null);
        setError(!h);
      })
      .catch(() => {
        setError(true);
        setHtml(null);
      })
      .finally(() => setLoading(false));
  }, [resumeId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (typeof w === "number") setWidth(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (loading) {
    return (
      <div
        ref={containerRef}
        style={{
          height: PREVIEW_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        Loading preview…
      </div>
    );
  }
  if (error || !html) {
    return (
      <div
        ref={containerRef}
        style={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          color: "#64748b",
          fontSize: 13,
        }}
      >
        Preview unavailable
      </div>
    );
  }
  // Fill card width completely to avoid side gutters in preview cards
  const scale = Math.max(width / A3_W, 0.1);
  const scaledHeight = Math.ceil(scale * A3_H);
  return (
    <div
      ref={containerRef}
      style={{
        height: PREVIEW_H,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        overflow: "hidden",
        borderRadius: "14px 14px 0 0",
      }}
    >
      <div
        style={{
          width: A3_W,
          height: A3_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <iframe
          title="Resume preview"
          srcDoc={injectA3GridPreview(html)}
          sandbox="allow-same-origin"
          style={{
            width: A3_W,
            height: A3_H,
            border: 0,
            display: "block",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

export default function TemplateShowcase() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [duplicating, setDuplicating] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedResumePreview, setSelectedResumePreview] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState("Profile");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const templatePromise = api.get("/api/v1/templates/public");
        const resumePromise = token
          ? api.get("/api/v1/resumes").catch((err) => {
              if (err.response?.status === 401) return { data: { data: { items: [], count: 0 } } };
              throw err;
            })
          : Promise.resolve({ data: { data: { items: [], count: 0 } } });
        const [t, r] = await Promise.all([templatePromise, resumePromise]);
        if (!mounted) return;
        setTemplates(t.data?.data?.items || []);
        setResumes(r.data?.data?.items || []);
      } catch (err) {
        console.error("Error loading TemplateShowcase data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setSubscriptionStatus(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/v1/billing/subscription");
        if (mounted) setSubscriptionStatus(res.data?.data || res.data || null);
      } catch {
        if (mounted) setSubscriptionStatus(null);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const handleDeleteResume = async (resumeId) => {
    if (!token) {
      showToast("Please sign in to delete resumes", { type: "info" });
      return;
    }
    const confirmed = await showConfirm("Are you sure you want to delete this resume?");
    if (!confirmed) return;
    setDeleting(resumeId);
    try {
      await api.delete(`/api/v1/resumes/${resumeId}`);
      setResumes((prev) => prev.filter((r) => (r._id || r.id) !== resumeId));
      showToast("Resume deleted successfully", { type: "success" });
    } catch (err) {
      showToast("Failed to delete resume. Please try again.", { type: "error" });
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicateResume = async (resumeId) => {
    if (!token) {
      showToast("Please sign in to duplicate resumes", { type: "info" });
      return;
    }
    if (resumes.length >= 5) {
      showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to duplicate.", { type: "error", duration: 5000 });
      return;
    }
    setDuplicating(resumeId);
    try {
      const response = await api.post(`/api/v1/resumes/${resumeId}/duplicate`);
      const newResume = response.data?.data?.resume;
      if (newResume) {
        setResumes((prev) => [newResume, ...prev]);
        showToast("Resume duplicated successfully!", { type: "success" });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to duplicate resume";
      showToast(errorMsg, { type: "error" });
    } finally {
      setDuplicating(null);
    }
  };

  const handlePreviewResume = async (resumeId) => {
    if (!resumeId) {
      await showAlert("Invalid resume ID. Please try again.");
      return;
    }
    setIsPreviewLoading(true);
    try {
      const resumeRes = await api.get(`/api/v1/resumes/${resumeId}`);
      const resumeData = resumeRes.data?.data?.resume || resumeRes.data?.data;
      if (!resumeData) {
        await showAlert("Resume data not found. Please try again.");
        return;
      }
      let previewHtml = "";
      try {
        const previewRes = await api.get(`/api/v1/resumes/${resumeId}/preview`);
        previewHtml = previewRes.data?.data?.html || previewRes.data?.html || "";
      } catch (_) {
        await showAlert("Resume preview not available. The resume may not have a template assigned.");
        return;
      }
      setSelectedResume(resumeData);
      setSelectedResumePreview(previewHtml);
      setShowPreviewModal(true);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Unknown error";
      await showAlert(`Failed to load resume preview: ${msg}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadResume = async (resumeId) => {
    if (!token) {
      showToast("Please sign in to download resumes", { type: "info" });
      return;
    }
    setIsPreviewLoading(true);
    try {
      const previewRes = await api.get(`/api/v1/resumes/${resumeId}/preview`);
      const html = previewRes.data?.data?.html || previewRes.data?.html || "";
      if (!html) {
        showToast("No preview to export.", { type: "error" });
        return;
      }
      const full = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:1in} body{font-family:Arial,Helvetica,sans-serif}</style></head><body>${html}</body></html>`;
      const blob = new Blob([full], { type: "application/msword" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const resume = resumes.find((r) => (r._id || r.id) === resumeId);
      const title = (resume?.title || "resume").replace(/[^\w\-\s]+/g, "").trim() || "resume";
      a.href = url;
      a.download = `${title}-${Date.now()}.doc`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Exported Word (.doc) from preview", { type: "success", duration: 1800 });
    } catch (err) {
      showToast("Failed to download resume. Please try again.", { type: "error" });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleShareResume = (resumeId) => {
    const url = `${window.location.origin}/dashboard`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
      showToast("Dashboard link copied to clipboard", { type: "success" });
    } else {
      showToast("Open your dashboard to share: " + url, { type: "info" });
    }
  };

  const formatLastEdited = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const iconBtnStyle = {
    padding: 6,
    border: "none",
    borderRadius: 6,
    background: "transparent",
    color: "#60a5fa",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const iconSvg = (path, viewBox = "0 0 24 24") => (
    <svg width="18" height="18" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );

  const hasActivePaidSubscription =
    Boolean(token) &&
    Boolean(subscriptionStatus?.hasActiveSubscription) &&
    subscriptionStatus?.plan !== "free";

  const handleCancelSubscription = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to cancel your subscription?\n\nYou will keep premium access until the end of your current billing period."
    );
    if (!confirmed) return;

    try {
      setCancelingSubscription(true);
      const res = await api.post("/api/v1/billing/cancel");
      const message =
        res?.data?.message ||
        res?.data?.data?.message ||
        "Subscription canceled successfully.";
      showToast(message, { type: "success", duration: 5000 });

      const subRes = await api.get("/api/v1/billing/subscription");
      setSubscriptionStatus(subRes.data?.data || subRes.data || null);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to cancel subscription. Please try again.";
      showToast(msg, { type: "error" });
    } finally {
      setCancelingSubscription(false);
    }
  };

  return (
    <>
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .template-showcase-sidebar-nav button:hover,
      .template-showcase-sidebar-nav button:focus,
      .template-showcase-sidebar-nav button:focus-visible {
        background: transparent !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
    `}</style>
    {showUpload && (
      <ResumeUpload
        onClose={() => setShowUpload(false)}
        selectedTemplateSlug={null}
      />
    )}
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(90deg,#ffffff 0%,#f9fafb 45%,#e0f2ff 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        display: "block",
        // padding: "24px 24px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          columnGap: 24,
        }}
      >
        {/* Left sidebar */}
        <aside
          style={{
            alignSelf: "stretch",
            width: "100%",
            padding: "18px 18px 16px",
            borderRight: "none",
            background: "transparent",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            height: "100%",
          }}
        >
          {/* Profile header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 10,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "999px",
                overflow: "hidden",
                background:
                  "radial-gradient(circle at 30% 0%,#fde68a 0,#f97316 40%,#2563eb 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {(user?.name || user?.fullName || user?.email || "S")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {user?.name || user?.fullName || "Guest User"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                {user?.email ? `@${user.email.split("@")[0]}` : "@guest"}
              </span>
            </div>
          </div>

          {/* Sidebar nav */}
          <nav
            className="template-showcase-sidebar-nav"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              paddingTop: 8,
            }}
          >
            {[
              { label: "Profile", icon: User },
              { label: "Resume", icon: FileText },
            ].map(({ label, icon: Icon }) => {
              const active = label === activeSidebarItem;
              const color = active ? "#2563eb" : "#111111";
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (label === "Resume") {
                      navigate("/builder", { state: { startFresh: true } });
                    } else {
                      setActiveSidebarItem(label);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 14,
                    color,
                    fontWeight: active ? 600 : 500,
                    outline: "none",
                  }}
                >
                  <Icon size={22} weight={active ? "regular" : "regular"} color={color} />
                  <span
                    style={{
                      lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>

        {/* Upgrade card — only for non‑premium users */}
        {token && (!subscriptionStatus?.hasActiveSubscription || subscriptionStatus?.plan === "free") && (
          <div
            style={{
              marginTop: 16,
              padding: "24px 20px",
              borderRadius: 20,
              background: "#f0f9ff",
              border: "1px solid #2563eb",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <Crown size={44} color="#2563eb" />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 8,
              }}
            >
              Upgrade to Pro
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 1.4,
                marginBottom: 18,
              }}
            >
              Unlock unlimited resumes and premium templates
            </p>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                maxWidth: 200,
              }}
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* Logout button – at end of sidebar */}
        {token && (
          <>
            <button
              type="button"
              data-variant="error"
              onClick={() => setShowDeleteAccountModal(true)}
              style={{
                marginTop: "auto",
                background: "#fff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fef2f2";
                e.currentTarget.style.borderColor = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#fecaca";
              }}
            >
              Delete Account
            </button>
            <button
              type="button"
              onClick={logout}
              style={{
                marginTop: 12,
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#2563eb",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
                whiteSpace: "nowrap",
              }}
            >
              Logout
            </button>
          </>
        )}
        </aside>

        {/* Main content */}
        <main
          style={{
            padding: "16px 0 32px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
        {/* Header + search */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                marginTop: 36,
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Welcome back, {user?.name || user?.fullName || "Guest User"}
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              Here’s Your Resume Dashboard
            </p>
          </div>

          <div
            style={{
              marginTop: 10,
              width: "100%",
              maxWidth: 960,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <input
                type="text"
                placeholder="Search templates"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 13,
                  outline: "none",
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  color: "#9ca3af",
                }}
              >
                <MagnifyingGlass size={20} weight="regular" />
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginLeft: "auto",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 28px rgba(37,99,235,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px rgba(37,99,235,0.35)";
                }}
              >
                <MagnifyingGlass size={18} weight="regular" />
                Explore Now
              </button>
              {user?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  style={{
                    background:
                      "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 18px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(124, 58, 237, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(124, 58, 237, 0.3)";
                  }}
                >
                  <ShieldCheck size={18} weight="bold" />
                  Admin Dashboard
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (token && resumes.length >= 5) {
                    showToast(
                      "You have reached the maximum limit of 5 resumes. Please delete a resume to upload a new one.",
                      { type: "error", duration: 5000 }
                    );
                    return;
                  }
                  setShowUpload(true);
                }}
                disabled={token && resumes.length >= 5}
                style={{
                  background:
                    token && resumes.length >= 5
                      ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                      : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 20px",
                  fontWeight: 600,
                  cursor:
                    token && resumes.length >= 5 ? "not-allowed" : "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow:
                    token && resumes.length >= 5
                      ? "none"
                      : "0 4px 12px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.2s ease",
                  opacity: token && resumes.length >= 5 ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!(token && resumes.length >= 5)) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(37, 99, 235, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    token && resumes.length >= 5
                      ? "none"
                      : "0 4px 12px rgba(37, 99, 235, 0.3)";
                }}
              >
                <UploadIcon size={18} color="#fbbf24" weight="bold" />
                {token && resumes.length >= 5
                  ? "Limit Reached"
                  : "Start with Existing Resume"}
              </button>
              {hasActivePaidSubscription && (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #fca5a5",
                    background: "#fff1f2",
                    color: "#be123c",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: cancelingSubscription ? "not-allowed" : "pointer",
                    opacity: cancelingSubscription ? 0.7 : 1,
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cancelingSubscription ? "Canceling..." : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Your Resumes (user-built) — templates section */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "0 12px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Your Resumes
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              Manage and edit your saved resumes
            </p>
          </div>

          {!token ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: 20,
                border: "2px dashed #e2e8f0",
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                Sign in to see and manage your resumes.
              </p>
              <button
                type="button"
                onClick={() => navigate("/signin")}
                style={{
                  marginTop: 12,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign in
              </button>
            </div>
          ) : loading ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: 20,
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "3px solid #e5e7eb",
                  borderTopColor: "#2563eb",
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Loading your resumes…
              </p>
            </div>
          ) : resumes.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: 20,
                border: "2px dashed #cbd5e1",
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                No resumes yet. Create one from your dashboard.
              </p>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  marginTop: 12,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (() => {
            const q = searchQuery.trim().toLowerCase();
            const isSearchingTemplates = q.length > 0;

            if (isSearchingTemplates) {
              const filteredTemplates = templates.filter((t) => {
                const name = (t.name || "").toLowerCase();
                const slug = (t.slug || "").toLowerCase();
                const category = (t.category || "").toLowerCase();
                return (
                  name.includes(q) ||
                  slug.includes(q) ||
                  category.includes(q)
                );
              });

              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                  }}
                >
                  {filteredTemplates.length === 0 ? (
                    <p
                      style={{
                        gridColumn: "1 / -1",
                        margin: 0,
                        fontSize: 14,
                        color: "#64748b",
                        padding: 24,
                        textAlign: "center",
                      }}
                    >
                      No templates match your search.
                    </p>
                  ) : (
                    filteredTemplates.map((t) => {
                      const isPremium = t.category === "premium" || t.category === "industry";
                      const locked = false;
                      return (
                        <TemplateCard
                          key={t.slug}
                          template={t}
                          isPremium={isPremium}
                          locked={locked}
                          fullPreview
                          onSelect={() =>
                            navigate("/builder", {
                              state: { startFresh: true, templateSlug: t.slug },
                            })
                          }
                          onPreview={() =>
                            navigate("/builder", {
                              state: { startFresh: true, templateSlug: t.slug },
                            })
                          }
                        />
                      );
                    })
                  )}
                </div>
              );
            }

            const filteredResumes = resumes;
            return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {filteredResumes.length === 0 ? (
                <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: 14, color: "#64748b", padding: 24, textAlign: "center" }}>
                  No resumes yet.
                </p>
              ) : (
              filteredResumes.map((r, idx) => {
                const template = templates.find((t) => t.slug === r.templateSlug);
                const templateName = r.templateName || template?.name || r.templateSlug || "Modern Resume";
                const accentColor = template?.ui?.accentColor || "#2563eb";
                const cardBg = `linear-gradient(180deg, ${accentColor}12 0%, ${accentColor}08 30%, #fff 100%)`;
                const resumeId = r._id || r.id;
                const lastEdited = formatLastEdited(r.updatedAt || r.updated_at);
                return (
                  <article
                    key={resumeId || idx}
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 16px 35px rgba(15,23,42,0.08)",
                      transition: "transform 0.18s ease, box-shadow 0.18s ease",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Full template preview (fetch then scale A4, like picker grid) */}
                    <ResumeCardPreview resumeId={resumeId} />
                    {/* Footer — dark bar with template name, Last Edited, and icon actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                        padding: "20px 14px 12px",
                        background: "#374151",
                        borderRadius: "0 0 16px 16px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#f9fafb" }}>
                          {templateName}
                        </span>
                        {lastEdited && (
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>
                            Last Edited {lastEdited}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => navigate("/builder", { state: { resumeId } })}
                          style={iconBtnStyle}
                          title="Edit"
                        >
                          {iconSvg(<path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />, "0 0 24 24")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResume(resumeId)}
                          disabled={deleting === resumeId}
                          style={{ ...iconBtnStyle, opacity: deleting === resumeId ? 0.5 : 1 }}
                          title="Delete"
                        >
                          {iconSvg(<path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />, "0 0 24 24")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreviewResume(resumeId)}
                          disabled={isPreviewLoading}
                          style={{ ...iconBtnStyle, opacity: isPreviewLoading ? 0.5 : 1 }}
                          title="Preview"
                        >
                          {iconSvg(<path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 8.178a1.012 1.012 0 010 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-8.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />, "0 0 24 24")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateResume(resumeId)}
                          disabled={duplicating === resumeId || resumes.length >= 5}
                          style={{ ...iconBtnStyle, opacity: duplicating === resumeId || resumes.length >= 5 ? 0.5 : 1 }}
                          title="Duplicate"
                        >
                          <Copy size={18} color="currentColor" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
              )}
            </div>
            );
          })()}
        </section>
      </main>

      {/* Bottom CTA – Footer1 (full grid width) */}
      <div style={{ gridColumn: "1 / -1" }}>
        <Footer1
          onCreateClick={() => navigate("/builder", { state: { startFresh: true } })}
        />
      </div>
      {/* Preview modal */}
      {showPreviewModal && selectedResume && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 24,
          }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 900,
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                {selectedResume.title || "Resume Preview"}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {/* <button
                  type="button"
                  onClick={() => {
                    const html = selectedResumePreview || "";
                    if (!html) {
                      showToast("No preview to export.", { type: "error" });
                      return;
                    }
                    const full = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:1in} body{font-family:Arial,sans-serif}</style></head><body>${html}</body></html>`;
                    const blob = new Blob([full], { type: "application/msword" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    const title = (selectedResume?.title || "resume").replace(/[^\w\-\s]+/g, "").trim() || "resume";
                    a.href = url;
                    a.download = `${title}-${Date.now()}.doc`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    showToast("Exported Word (.doc)", { type: "success" });
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Download (.doc)
                </button> */}
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#374151",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: 0,
                minHeight: 400,
                background: "#fff",
              }}
            >
              <iframe
                title="Resume preview"
                srcDoc={injectA3GridPreview(selectedResumePreview || "")}
                style={{
                  width: "100%",
                  minHeight: 500,
                  border: "none",
                  borderRadius: 0,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteAccountModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 22px 55px rgba(15,23,42,0.45)",
              maxWidth: 480,
              width: "90%",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-bold)",
                color: "#0f172a",
              }}
            >
              Delete your account?
            </h2>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "var(--font-size-sm)",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              This will immediately sign you out and mark your account for deletion. Your account
              and all associated data (resumes, templates, billing info) will no longer be
              accessible in the app.
            </p>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "var(--font-size-xs)",
                color: "#b91c1c",
                lineHeight: 1.5,
              }}
            >
              Data may be retained securely for up to 30 days for legal and recovery purposes.
              After that, it may be permanently removed and cannot be restored.
            </p>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: "var(--font-size-xs)",
                color: "#64748b",
              }}
            >
              If you delete by mistake, contact support within 30 days and we may be able to help
              restore your account.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 999,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "var(--font-weight-medium)",
                  cursor: deletingAccount ? "not-allowed" : "pointer",
                  opacity: deletingAccount ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-variant="error"
                onClick={async () => {
                  if (deletingAccount) return;
                  setDeletingAccount(true);
                  try {
                    const res = await api.delete("/api/v1/auth/delete");
                    const msg =
                      res?.data?.message ||
                      res?.data?.data?.message ||
                      "Account deleted. You have up to 30 days to request restoration.";
                    showToast(msg, { type: "success", duration: 5000 });
                    localStorage.clear();
                    window.location.href = "/signin";
                  } catch (err) {
                    console.error(err);
                    const msg =
                      err.response?.data?.message ||
                      "Failed to delete account. Please try again.";
                    showToast(msg, { type: "error" });
                    setDeletingAccount(false);
                  }
                }}
                style={{
                  padding: "9px 20px",
                  borderRadius: 999,
                  border: "1px solid #fecaca",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  cursor: deletingAccount ? "not-allowed" : "pointer",
                  opacity: deletingAccount ? 0.7 : 1,
                }}
              >
                {deletingAccount ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  </>
  );
}