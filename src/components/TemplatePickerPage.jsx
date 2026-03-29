import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TemplateCard from "./TemplateCard.jsx";
import peopleImg from "../assets/people.png";
import arrowImg from "../assets/arrow-1.png";
import ringsImg from "../assets/rings.png";
import curveLineImg from "../assets/curve-line.png";
import bigBangImg from "../assets/big-bang.png";
import resMixImg from "../assets/res-mix.png";

export default function TemplatePickerPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("premium"); // "free" | "premium" only
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get("/api/v1/templates/public");
        const items = response.data?.data?.items || [];
        setTemplates(items.filter((t) => t.isActive !== false));
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const filteredTemplates =
    category === "free"
      ? templates.filter((t) => t.category === "free" || !t.category)
      : templates.filter(
          (t) => t.category === "premium" || t.category === "industry"
        );

  const handleSelect = (template) => {
    navigate("/builder", {
      state: { startFresh: true, templateSlug: template.slug },
    });
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
  };

  const scrollToTemplates = () => {
    document.getElementById("template-showcase-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 40%, #faf5ff 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Navbar />

      {/* Hero */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 24px 56px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "2.25rem",
              fontWeight: 750,
              color: "#0f172a",
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            Create Your Perfect ATS-Friendly Resume in Minutes with AI
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "1.0625rem",
              color: "#475569",
              lineHeight: 1.6,
              marginBottom: 2,
            }}
          >
            Let our AI streamline the process for you. Select from a variety of
            professional templates, incorporate essential skills and phrases,
            and secure your dream job.
          </p>
          {/* Decorative curve – curve-line.png */}
          <img
            src={curveLineImg}
            alt=""
            style={{ height: 72, width: "auto", marginBottom: 12, display: "block" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={scrollToTemplates}
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
              }}
            >
              Start for Free Today!
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={peopleImg}
                alt="Community"
                style={{ height: 48, width: "auto", objectFit: "contain" }}
              />
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                  Join Our Community
                </div>
                <div style={{ fontSize: "0.875rem", color: "#475569", marginTop: 2 }}>
                  Join over 300,000 satisfied users worldwide who have transformed their job search.
                </div>
              </div>
            </div>
          </div>
          {/* Arrow – bottom-left, below CTA */}
          <img
            src={arrowImg}
            alt=""
            style={{ marginTop: 20, height: 40, width: "auto", display: "block" }}
          />
        </div>
        {/* Right column: hero visual */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 360,
          }}
        >
          {/* Soft circular background glow */}
          <div
            style={{
              position: "absolute",
              width: 380,
              height: 380,
              borderRadius: "999px",
              background:
                "radial-gradient(circle at 30% 20%, #bfdbfe 0%, #60a5fa 30%, #e0f2fe 60%, rgba(191,219,254,0) 75%)",
              boxShadow: "0 40px 80px rgba(37,99,235,0.35)",
              zIndex: -1,
            }}
          />
          {/* Background burst image */}
          <img
            src={bigBangImg}
            alt=""
            style={{
              position: "absolute",
              top: -100,
              left: 120,
              zIndex: 0,
              filter: "drop-shadow(0 0 28px rgba(86, 148, 248, 0.8)) drop-shadow(0 0 60px rgba(102, 159, 250, 0.55))",
            }}
          />
          {/* Resume mix image layered above the burst */}
          <img
            src={resMixImg}
            alt=""
            style={{
              position: "absolute",
              top: -50,
              left: 170,
              width: 360,
              height: "auto",
              objectFit: "contain",
              zIndex: 1,
            }}
          />
          <img
            src={ringsImg}
            alt=""
            style={{
              position: "absolute",
              top: -100,
              left: 100,
              width: "100%",
              maxWidth: 60,
              height: "auto",
              objectFit: "contain",
              objectPosition: "right bottom",
              zIndex: 0,
              opacity: 0.9,
            }}
          />
          <img
            src={ringsImg}
            alt=""
            style={{
              position: "absolute",
              top: 240,
              left: -80,
              width: "100%",
              maxWidth: 60,
              height: "auto",
              objectFit: "contain",
              objectPosition: "right bottom",
              zIndex: 0,
              opacity: 0.9,
            }}
          />
          <img
            src={ringsImg}
            alt=""
            style={{
              position: "absolute",
              top: 360,
              left: -350,
              width: "100%",
              maxWidth: 60,
              height: "auto",
              objectFit: "contain",
              objectPosition: "left top",
              zIndex: 0,
              opacity: 0.9,
            }}
          />
        </div>
      </section>

      {/* Filter bar – Free and Premium only, centered */}
      <section
        id="template-showcase-section"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 24px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: "#f1f5f9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {["free", "premium"].map((tab) => {
            const isActive = category === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                style={{
                  padding: "12px 32px",
                  border: "none",
                  background: isActive ? "#007bff" : "transparent",
                  color: isActive ? "#fff" : "#475569",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: 10,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {tab === "free" ? "Free" : "Premium"}
              </button>
            );
          })}
        </div>
      </section>

      {/* Template grid – A3 preview, minimal side space */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 12px 80px",
        }}
      >
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
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                }}
              />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              background: "#f8fafc",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
            }}
          >
            <p style={{ fontSize: 16, color: "#64748b", margin: 0 }}>
              No {category} templates available.
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
            {filteredTemplates.map((t) => {
              const isPremium =
                t.category === "premium" || t.category === "industry";
              const locked = false;
              return (
                <TemplateCard
                  key={t.slug}
                  template={t}
                  isPremium={isPremium}
                  locked={locked}
                  onSelect={() => handleSelect(t)}
                  onPreview={handlePreview}
                  fullPreview
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Preview modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          resume={null}
          resumePreview=""
          onClose={() => setPreviewTemplate(null)}
          onSelect={(tpl) => {
            setPreviewTemplate(null);
            handleSelect(tpl || previewTemplate);
          }}
        />
      )}

      <Footer />
    </div>
  );
}

function injectModalPreview(html) {
  if (!html || typeof html !== "string") return html;
  const css = [
    "html,body{margin:0 !important;padding:0 !important;background:#fff !important;width:100% !important;max-width:100% !important;overflow-x:hidden !important;}",
    ".resume-wrapper{width:100% !important;max-width:100% !important;display:block !important;}",
    ".paper,article.paper{width:100% !important;max-width:100% !important;margin:0 !important;}",
    ".content-wrapper{padding:0 !important;margin:0 !important;}",
    ".page{width:100% !important;max-width:100% !important;margin:0 !important;box-shadow:none !important;}",
    "#resume{width:100% !important;max-width:100% !important;margin:0 !important;padding:12px 14px !important;border:none !important;box-shadow:none !important;}",
    ".talha-wrapper,.strassburg-wrapper{max-width:100% !important;width:100% !important;padding:0 !important;margin:0 !important;}",
  ].join("");
  if (html.includes("</head>")) return html.replace("</head>", `<style>${css}</style></head>`);
  if (html.includes("<body")) return html.replace(/<body[^>]*>/i, (m) => `${m}<style>${css}</style>`);
  return `<style>${css}</style>${html}`;
}

// Reuse the Dashboard-style TemplatePreviewModal for template previews
function TemplatePreviewModal({ template, resume, resumePreview, onClose, onSelect }) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const isExportingRef = useRef(false);

  const exportClientWord = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isExportingRef.current) return;
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

    setTimeout(() => {
      isExportingRef.current = false;
    }, 1000);
  };

  useEffect(() => {
    async function createPreview() {
      try {
        setLoading(true);

        if (resumePreview && resume) {
          setPreviewHtml(resumePreview);
          setLoading(false);
          return;
        }

        if (!template?.slug) {
          setPreviewHtml("<div>No template available for preview</div>");
          setLoading(false);
          return;
        }

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
                fontSize: 18,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {template?.name || "Template Preview"}
            </h2>
            {template && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                {template.name} • Live Preview
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
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

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            background: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: 0,
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
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                Loading preview...
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                minHeight: "100%",
                background: "#fff",
                boxShadow: "none",
                borderRadius: 0,
                overflow: "hidden",
                border: "none",
              }}
            >
              <iframe
                srcDoc={injectModalPreview(previewHtml)}
                title="Resume Template Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "calc(92vh - 140px)",
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
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#475569",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Close
          </button>
          {/* <button
            onClick={exportClientWord}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(37, 99, 235, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(37, 99, 235, 0.3)";
            }}
          >
            Download (.doc)
          </button> */}
          <button
            onClick={() => onSelect?.(template)}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              background: "#10b981",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(23, 19, 253, 0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(51, 28, 253, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(45, 23, 243, 0.35)";
            }}
          >
            Use This Template
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
