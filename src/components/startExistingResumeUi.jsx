import React, { useState, useEffect } from "react";
import TemplateCard from "./TemplateCard.jsx";

export const HIDDEN_TEMPLATE_NAMES = new Set([
  // Add any templates to hide here
]);

export function filterAndSortTemplates(items) {
  return [...(items || [])]
    .filter((t) => {
      const name = (t?.name || "").trim();
      return t.isActive !== false && !HIDDEN_TEMPLATE_NAMES.has(name);
    })
    .sort((a, b) => {
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      return an.localeCompare(bn);
    });
}

export function injectModalPreview(html) {
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

/**
 * Same grid + copy as /resume-start: pick template (preview or use), then upload or go to builder.
 */
export function ChooseTemplateModal({
  open,
  onClose,
  templates,
  loading,
  flow,
  onPickTemplate,
  onPreviewTemplate,
}) {
  if (!open) return null;

  return (
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
      onClick={onClose}
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
            type="button"
            onClick={onClose}
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
          {flow === "upload"
            ? "Pick a template (preview or select). Next, you’ll upload your existing resume — same import flow as before."
            : "Preview any template or use it to start building your resume."}
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
                  onSelect={() => onPickTemplate(t)}
                  onPreview={(tpl) => onPreviewTemplate(tpl)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Full-screen preview + Continue (upload → opens upload; scratch → caller navigates) */
export function UploadFlowTemplatePreviewModal({ template, onClose, onContinue }) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function createPreview() {
      try {
        setLoading(true);

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

  if (!template) return null;

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
            type="button"
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
              <div style={{ fontSize: "1rem", fontWeight: "600" }}>
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
                title="Resume Preview"
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
            type="button"
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
            type="button"
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
