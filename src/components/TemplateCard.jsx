import React from "react";

const TemplateCard = ({ template, isPremium = false, onSelect, onPreview }) => {
  // Safety checks for template properties
  const accentColor = template?.ui?.accentColor || "#2563eb";
  const fontFamily = template?.ui?.fontFamily || "Arial, sans-serif";
  const showPhoto = template?.ui?.showPhoto || false;
  const bulletStyle = template?.ui?.bulletStyle || "dot";
  const tags = template?.tags || [];
  const name = template?.name || template?.slug || "Template";
  const slug = template?.slug || "default";
  // Resolve thumbnail URL to a reliable absolute/relative path that works in all envs
  const rawThumb =
    typeof template?.thumbnailUrl === "string" && template.thumbnailUrl.length > 0
      ? template.thumbnailUrl
      : null;

  const thumbnailSrc = React.useMemo(() => {
    if (!rawThumb) return null;
    const url = rawThumb.trim();
    // Absolute URL already
    if (/^https?:\/\//i.test(url)) return url;
    // Already proxied path like /api/v1/...
    if (url.startsWith("/api/")) return url;
    if (url.startsWith("/")) return url; // same-origin absolute path
    // Bare path like templates/.../thumbnail -> prefix API root
    return `/api/v1/${url.replace(/^\/+/, "")}`;
  }, [rawThumb]);

  // Resolve preview URL similarly; prefer preview iframe for most accurate visual
  const rawPreview =
    typeof template?.previewUrl === "string" && template.previewUrl.length > 0
      ? template.previewUrl
      : null;

  const previewSrc = React.useMemo(() => {
    if (!rawPreview) return null;
    const url = rawPreview.trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/api/")) return url;
    if (url.startsWith("/")) return url;
    return `/api/v1/${url.replace(/^\/+/, "")}`;
  }, [rawPreview]);

  // Generate unique layout based on template slug
  const getTemplateLayout = (slug) => {
    const layouts = {
      "modern-slate": {
        type: "modern",
        header: "full",
        sections: "stacked",
        accent: "left-border",
        style: "minimal",
      },
      "classic-blue": {
        type: "classic",
        header: "centered",
        sections: "two-column",
        accent: "top-bar",
        style: "traditional",
      },
      "elegant-purple": {
        type: "elegant",
        header: "sidebar",
        sections: "sidebar-main",
        accent: "sidebar",
        style: "sophisticated",
      },
      "professional-green": {
        type: "professional",
        header: "compact",
        sections: "grid",
        accent: "underline",
        style: "corporate",
      },
      "creative-orange": {
        type: "creative",
        header: "asymmetric",
        sections: "flow",
        accent: "geometric",
        style: "artistic",
      },
      "minimal-gray": {
        type: "minimal",
        header: "simple",
        sections: "linear",
        accent: "none",
        style: "clean",
      },
    };
    return layouts[slug] || layouts["modern-slate"];
  };

  const layout = getTemplateLayout(slug);

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(template);
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    onPreview(template);
  };

  return (
    <div
      className="template-card"
      style={{
        border: `2px solid ${accentColor}`,
        borderRadius: "12px",
        padding: "20px",
        background: "white",
        position: "relative",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
      }}>
      {/* Premium Badge */}
      {isPremium && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "#fbbf24",
            color: "white",
            padding: "4px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "bold",
            zIndex: 10,
          }}>
          PREMIUM
        </div>
      )}

      {/* Template Preview Area (uses real thumbnail when available) */}
      <div
        className="preview-mockup"
        style={{
          height: "240px",
          background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}02)`,
          borderRadius: "12px",
          padding: thumbnailSrc ? 0 : "16px",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${accentColor}20`,
        }}>
        {previewSrc ? (
          <iframe
            title={`${name} preview`}
            src={previewSrc}
            sandbox="allow-same-origin"
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              border: "0",
              display: "block",
              borderRadius: "12px",
              background: "#fff",
              pointerEvents: "none",
            }}
          />
        ) : thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={`${name} thumbnail`}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              borderRadius: "12px",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
        <>
        {/* Shimmer Effect */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
            animation: "shimmer 4s infinite",
          }}
        />

        {/* Layout-specific mockup rendering */}
        {layout.type === "modern" && (
          <>
            {/* Modern Layout - Full header with left accent */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "4px",
                  height: "32px",
                  background: accentColor,
                  borderRadius: "2px",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: "16px",
                    background: accentColor,
                    borderRadius: "3px",
                    width: "70%",
                    marginBottom: "4px",
                  }}
                />
                <div
                  style={{
                    height: "12px",
                    background: `${accentColor}60`,
                    borderRadius: "2px",
                    width: "50%",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                height: "10px",
                background: `${accentColor}30`,
                borderRadius: "2px",
                width: "85%",
                marginBottom: "6px",
              }}
            />
            <div
              style={{
                height: "10px",
                background: `${accentColor}30`,
                borderRadius: "2px",
                width: "75%",
                marginBottom: "8px",
              }}
            />
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    background: accentColor,
                    borderRadius: "50%",
                  }}
                />
              ))}
            </div>
          </>
        )}

        {layout.type === "classic" && (
          <>
            {/* Classic Layout - Centered header with top bar */}
            <div
              style={{
                height: "3px",
                background: accentColor,
                borderRadius: "2px",
                width: "100%",
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                textAlign: "center",
                marginBottom: "8px",
              }}>
              <div
                style={{
                  height: "18px",
                  background: accentColor,
                  borderRadius: "4px",
                  width: "60%",
                  margin: "0 auto 4px",
                }}
              />
              <div
                style={{
                  height: "12px",
                  background: `${accentColor}50`,
                  borderRadius: "2px",
                  width: "40%",
                  margin: "0 auto",
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}>
              <div>
                <div
                  style={{
                    height: "10px",
                    background: `${accentColor}30`,
                    borderRadius: "2px",
                    width: "90%",
                    marginBottom: "4px",
                  }}
                />
                <div
                  style={{
                    height: "10px",
                    background: `${accentColor}30`,
                    borderRadius: "2px",
                    width: "70%",
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    height: "10px",
                    background: `${accentColor}30`,
                    borderRadius: "2px",
                    width: "80%",
                    marginBottom: "4px",
                  }}
                />
                <div
                  style={{
                    height: "10px",
                    background: `${accentColor}30`,
                    borderRadius: "2px",
                    width: "60%",
                  }}
                />
              </div>
            </div>
          </>
        )}

        {layout.type === "elegant" && (
          <>
            {/* Elegant Layout - Sidebar design */}
            <div style={{ display: "flex", gap: "8px", height: "100%" }}>
              <div
                style={{
                  width: "30%",
                  background: accentColor,
                  borderRadius: "4px",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}>
                <div
                  style={{
                    height: "12px",
                    background: "rgba(255,255,255,0.8)",
                    borderRadius: "2px",
                    width: "100%",
                  }}
                />
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: "2px",
                    width: "80%",
                  }}
                />
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: "2px",
                    width: "70%",
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}>
                <div
                  style={{
                    height: "14px",
                    background: `${accentColor}40`,
                    borderRadius: "3px",
                    width: "80%",
                  }}
                />
                <div
                  style={{
                    height: "10px",
                    background: `${accentColor}30`,
                    borderRadius: "2px",
                    width: "90%",
                  }}
                />
                <div
                  style={{
                    height: "10px",
                    background: `${accentColor}30`,
                    borderRadius: "2px",
                    width: "75%",
                  }}
                />
                <div
                  style={{
                    height: "10px",
                    background: `${accentColor}30`,
                    borderRadius: "2px",
                    width: "85%",
                  }}
                />
              </div>
            </div>
          </>
        )}

        {layout.type === "professional" && (
          <>
            {/* Professional Layout - Grid with underlines */}
            <div
              style={{
                height: "16px",
                background: accentColor,
                borderRadius: "3px",
                width: "70%",
                marginBottom: "6px",
              }}
            />
            <div
              style={{
                height: "2px",
                background: accentColor,
                borderRadius: "1px",
                width: "100%",
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
              }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "8px",
                    background: `${accentColor}25`,
                    borderRadius: "2px",
                    width: "100%",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: "4px",
                marginTop: "8px",
                flexWrap: "wrap",
              }}>
              {["JS", "React", "Node"].map((skill, i) => (
                <div
                  key={i}
                  style={{
                    padding: "2px 6px",
                    background: `${accentColor}20`,
                    borderRadius: "8px",
                    fontSize: "8px",
                    color: accentColor,
                    fontWeight: "600",
                  }}>
                  {skill}
                </div>
              ))}
            </div>
          </>
        )}

        {layout.type === "creative" && (
          <>
            {/* Creative Layout - Asymmetric with geometric accents */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  width: "20px",
                  height: "20px",
                  background: accentColor,
                  borderRadius: "50%",
                  opacity: 0.7,
                }}
              />
              <div
                style={{
                  height: "18px",
                  background: accentColor,
                  borderRadius: "4px",
                  width: "60%",
                  marginBottom: "6px",
                  clipPath: "polygon(0 0, 90% 0, 100% 100%, 0 100%)",
                }}
              />
            </div>
            <div
              style={{
                height: "10px",
                background: `${accentColor}40`,
                borderRadius: "2px",
                width: "80%",
                marginBottom: "4px",
                transform: "skew(-5deg)",
              }}
            />
            <div
              style={{
                height: "10px",
                background: `${accentColor}40`,
                borderRadius: "2px",
                width: "70%",
                marginBottom: "4px",
                transform: "skew(5deg)",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "4px",
                marginTop: "8px",
                alignItems: "center",
              }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: accentColor,
                  borderRadius: "2px",
                  transform: "rotate(45deg)",
                }}
              />
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: accentColor,
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: accentColor,
                  borderRadius: "2px",
                  transform: "rotate(-45deg)",
                }}
              />
            </div>
          </>
        )}

        {layout.type === "minimal" && (
          <>
            {/* Minimal Layout - Clean and simple */}
            <div
              style={{
                height: "20px",
                background: accentColor,
                borderRadius: "2px",
                width: "80%",
                marginBottom: "12px",
              }}
            />
            <div
              style={{
                height: "1px",
                background: `${accentColor}30`,
                width: "100%",
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                height: "8px",
                background: `${accentColor}20`,
                borderRadius: "1px",
                width: "90%",
                marginBottom: "4px",
              }}
            />
            <div
              style={{
                height: "8px",
                background: `${accentColor}20`,
                borderRadius: "1px",
                width: "85%",
                marginBottom: "4px",
              }}
            />
            <div
              style={{
                height: "8px",
                background: `${accentColor}20`,
                borderRadius: "1px",
                width: "75%",
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "8px",
              }}>
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  background: accentColor,
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  background: accentColor,
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  background: accentColor,
                  borderRadius: "50%",
                }}
              />
            </div>
          </>
        )}
        </>
        )}
      </div>

      {/* Template Info */}
      <div style={{ marginBottom: "12px" }}>
        <h3
          style={{
            fontWeight: "700",
            fontSize: "18px",
            marginBottom: "4px",
            color: "#0f172a",
            lineHeight: 1.2,
          }}>
          {name}
        </h3>
        <div
          style={{
            fontSize: "12px",
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: "600",
          }}>
          {layout.style} • {layout.type}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "12px",
          }}>
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "12px",
                background: `${accentColor}15`,
                color: accentColor,
                fontWeight: "600",
                border: `1px solid ${accentColor}30`,
              }}>
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "12px",
                background: "#f1f5f9",
                color: "#64748b",
                fontWeight: "600",
                border: "1px solid #e2e8f0",
              }}>
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Features */}
      <div style={{ fontSize: "13px", color: "#475569", marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "6px",
          }}>
          <span style={{ color: accentColor, fontSize: "10px" }}>🎨</span>
          <span style={{ fontWeight: "500" }}>{fontFamily.split(",")[0]}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "6px",
          }}>
          <span style={{ color: accentColor, fontSize: "10px" }}>
            {showPhoto ? "📷" : "📄"}
          </span>
          <span style={{ fontWeight: "500" }}>
            {showPhoto ? "Photo Section" : "Text Only"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: accentColor, fontSize: "10px" }}>•</span>
          <span style={{ fontWeight: "500" }}>
            {bulletStyle === "dot" ? "Round Bullets" : "Square Bullets"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handlePreview}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "10px",
            border: `2px solid ${accentColor}`,
            background: "white",
            color: accentColor,
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = `${accentColor}10`;
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = `0 4px 12px ${accentColor}30`;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "white";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}>
          <span>👁️</span>
          Preview
        </button>

        <button
          onClick={handleSelect}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "10px",
            border: "none",
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: `0 2px 8px ${accentColor}40`,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = `0 6px 20px ${accentColor}50`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = `0 2px 8px ${accentColor}40`;
          }}>
          <span>✨</span>
          Use Template
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          50% { transform: translate(-50%, -50%) rotate(180deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .template-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .template-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .template-card:hover .preview-mockup {
          transform: scale(1.02);
        }
        
        .preview-mockup {
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default TemplateCard;
