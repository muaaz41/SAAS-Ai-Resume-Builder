import { DotsNine, Eye, FileText, LockKey, PaletteIcon, Sparkle } from "@phosphor-icons/react";
import { Camera } from "@phosphor-icons/react/dist/ssr";
import React from "react";

const TemplateCard = ({
  template,
  isPremium = false,
  locked = false,
  onSelect,
  onPreview,
}) => {
  // Safety checks for template properties
  const accentColor = template?.ui?.accentColor || "#2563eb";
  const fontFamily = template?.ui?.fontFamily || "Arial, sans-serif";
  const showPhoto = template?.ui?.showPhoto || false;
  const bulletStyle = template?.ui?.bulletStyle || "dot";
  const tags = template?.tags || [];
  const name = template?.name || template?.slug || "Template";
  const slug = template?.slug || "default";
  const isPaidCategory =
    template?.category === "premium" || template?.category === "industry";
  // Resolve thumbnail URL to a reliable absolute/relative path that works in all envs
  const rawThumb =
    typeof template?.thumbnailUrl === "string" &&
    template.thumbnailUrl.length > 0
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
    if (onSelect) onSelect(template);
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
      {(isPremium || isPaidCategory) && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "linear-gradient(135deg, #fbbf24, #d97706)",
            color: "#ffffff",
            padding: "4px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "bold",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
            border: "1px solid rgba(245, 158, 11, 0.5)",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
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
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
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
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
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
          <PaletteIcon size={12} color={accentColor} weight="bold" />
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
            {showPhoto ? (
                <Camera size={12} color={accentColor} weight="bold" />
              ) : (
                <FileText size={12} color={accentColor} weight="bold" />
              )}
          </span>
          <span style={{ fontWeight: "500" }}>
            {showPhoto ? "Photo Section" : "Text Only"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <DotsNine size={12} color={accentColor} weight="bold" />
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
            border: "2px solid #3b82f6", 
            background: "white",
            color: "#3b82f6",
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
            e.target.style.background = "#eff6ff";
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "white";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}>
          <Eye size={16} color="#3b82f6" weight="bold" />
          Preview
        </button>

        <button
          onClick={handleSelect}
          disabled={locked}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "10px",
            border: locked ? "2px solid #3b82f6" : "none",
            background: locked
              ? "#ffffff"
              : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: locked ? "#3b82f6" : "white",
            fontWeight: "600",
            cursor: locked ? "pointer" : "pointer",
            transition: "all 0.2s",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: locked 
              ? "0 0 0 1px rgba(59, 130, 246, 0.2)" 
              : "0 2px 8px rgba(59, 130, 246, 0.4)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            if (locked) {
              e.target.style.background = "#eff6ff";
              e.target.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.2)";
            } else {
              e.target.style.background = "linear-gradient(135deg, #2563eb, #1e40af)";
              e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            if (locked) {
              e.target.style.background = "#ffffff";
              e.target.style.boxShadow = "0 0 0 1px rgba(59, 130, 246, 0.2)";
            } else {
              e.target.style.background = "linear-gradient(135deg, #3b82f6, #1d4ed8)";
              e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.4)";
            }
          }}>
          {locked ? (
            <LockKey size={16} color="#3b82f6" weight="bold" />
          ) : (
            <Sparkle size={16} color="white" weight="fill" />
          )}
          {locked ? "Upgrade to use" : "Use Template"}
        </button>
      </div>
      {locked && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "#6b7280",
            textAlign: "center",
            fontWeight: 500,
          }}>
          Premium / Industry template – requires subscription
        </div>
      )}

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



// import { Camera, Eye, FileText, LockKey, PaletteIcon, Sparkle, Star, Lightning, CheckCircle, ArrowRight } from "@phosphor-icons/react";
// import React from "react";

// const TemplateCard = ({
//   template,
//   isPremium = false,
//   locked = false,
//   onSelect,
//   onPreview,
// }) => {
//   // Safety checks for template properties
//   const accentColor = template?.ui?.accentColor || "#2563eb";
//   const fontFamily = template?.ui?.fontFamily || "Arial, sans-serif";
//   const showPhoto = template?.ui?.showPhoto || false;
//   const bulletStyle = template?.ui?.bulletStyle || "dot";
//   const tags = template?.tags || [];
//   const name = template?.name || template?.slug || "Template";
//   const slug = template?.slug || "default";
//   const description = template?.description || "Professional resume template";
//   const rating = template?.rating || 4.5;
//   const isPaidCategory =
//     template?.category === "premium" || template?.category === "industry";
  
//   // Resolve thumbnail URL
//   const rawThumb =
//     typeof template?.thumbnailUrl === "string" &&
//     template.thumbnailUrl.length > 0
//       ? template.thumbnailUrl
//       : null;

//   const thumbnailSrc = React.useMemo(() => {
//     if (!rawThumb) return null;
//     const url = rawThumb.trim();
//     if (/^https?:\/\//i.test(url)) return url;
//     if (url.startsWith("/api/")) return url;
//     if (url.startsWith("/")) return url;
//     return `/api/v1/${url.replace(/^\/+/, "")}`;
//   }, [rawThumb]);

//   // Generate unique layout based on template slug
//   const getTemplateLayout = (slug) => {
//     const layouts = {
//       "modern-slate": {
//         type: "modern",
//         style: "minimal",
//         icon: "sparkle",
//         features: ["Clean Design", "ATS Friendly", "Modern Layout"]
//       },
//       "classic-blue": {
//         type: "classic",
//         style: "traditional",
//         icon: "file",
//         features: ["Classic Format", "Easy to Read", "HR Approved"]
//       },
//       "elegant-purple": {
//         type: "elegant",
//         style: "sophisticated",
//         icon: "star",
//         features: ["Creative Sections", "Visual Hierarchy", "Premium Look"]
//       },
//       "professional-green": {
//         type: "professional",
//         style: "corporate",
//         icon: "check",
//         features: ["Industry Standard", "Professional", "Executive Ready"]
//       },
//       "creative-orange": {
//         type: "creative",
//         style: "artistic",
//         icon: "lightning",
//         features: ["Unique Design", "Portfolio Style", "Creative Fields"]
//       },
//       "minimal-gray": {
//         type: "minimal",
//         style: "clean",
//         icon: "minimal",
//         features: ["Simple Layout", "Focus on Content", "Quick Scan"]
//       },
//     };
//     return layouts[slug] || layouts["modern-slate"];
//   };

//   const layout = getTemplateLayout(slug);
//   const iconSize = 14;

//   const handleSelect = (e) => {
//     e.stopPropagation();
//     if (onSelect) onSelect(template);
//   };

//   const handlePreview = (e) => {
//     e.stopPropagation();
//     onPreview(template);
//   };

//   const renderIcon = (iconName) => {
//     switch(iconName) {
//       case 'sparkle': return <Sparkle size={iconSize} color={accentColor} weight="fill" />;
//       case 'star': return <Star size={iconSize} color={accentColor} weight="fill" />;
//       case 'lightning': return <Lightning size={iconSize} color={accentColor} weight="fill" />;
//       case 'check': return <CheckCircle size={iconSize} color={accentColor} weight="fill" />;
//       default: return <FileText size={iconSize} color={accentColor} weight="bold" />;
//     }
//   };

//   return (
//     <div
//       className="template-card"
//       style={{
//         border: `1px solid #e5e7eb`,
//         borderRadius: "20px",
//         padding: "24px",
//         background: "white",
//         position: "relative",
//         cursor: "pointer",
//         transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
//         boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
//         overflow: "hidden",
//       }}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.transform = "translateY(-8px)";
//         e.currentTarget.style.boxShadow = `0 24px 48px -12px ${accentColor}20, 0 8px 24px -4px rgba(0, 0, 0, 0.08)`;
//         e.currentTarget.style.borderColor = `${accentColor}40`;
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.transform = "translateY(0)";
//         e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
//         e.currentTarget.style.borderColor = "#e5e7eb";
//       }}>
      
//       {/* Premium Ribbon */}
//       {(isPremium || isPaidCategory) && (
//         <div
//           style={{
//             position: "absolute",
//             top: "16px",
//             right: "-32px",
//             background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
//             color: "white",
//             padding: "6px 32px",
//             fontSize: "11px",
//             fontWeight: "800",
//             letterSpacing: "0.05em",
//             transform: "rotate(45deg)",
//             zIndex: 10,
//             boxShadow: `0 4px 12px ${accentColor}40`,
//             borderBottom: "2px solid rgba(255,255,255,0.2)",
//             textTransform: "uppercase",
//           }}>
//           Premium
//         </div>
//       )}

//       {/* Accent Glow Effect */}
//       <div
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           right: 0,
//           height: "4px",
//           background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
//           borderRadius: "20px 20px 0 0",
//         }}
//       />

//       {/* Template Header */}
//       <div style={{ marginBottom: "20px" }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
//           <div style={{
//             width: "48px",
//             height: "48px",
//             background: `${accentColor}15`,
//             borderRadius: "12px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             border: `2px solid ${accentColor}30`
//           }}>
//             {renderIcon(layout.icon)}
//           </div>
//           <div style={{ flex: 1 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
//               <h3 style={{
//                 fontWeight: "700",
//                 fontSize: "20px",
//                 color: "#111827",
//                 lineHeight: 1.2,
//                 margin: 0,
//               }}>
//                 {name}
//               </h3>
//               {!locked && (
//                 <div style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "2px",
//                   fontSize: "12px",
//                   color: "#f59e0b",
//                   background: "#fef3c7",
//                   padding: "2px 6px",
//                   borderRadius: "12px",
//                 }}>
//                   <Star size={10} weight="fill" />
//                   <span style={{ fontWeight: "600" }}>{rating.toFixed(1)}</span>
//                 </div>
//               )}
//             </div>
//             <p style={{
//               fontSize: "14px",
//               color: "#6b7280",
//               margin: 0,
//               lineHeight: 1.4,
//             }}>
//               {description}
//             </p>
//           </div>
//         </div>

//         {/* Style Badges */}
//         <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
//           <span style={{
//             fontSize: "11px",
//             padding: "4px 10px",
//             borderRadius: "20px",
//             background: `${accentColor}15`,
//             color: accentColor,
//             fontWeight: "700",
//             letterSpacing: "0.05em",
//             border: `1px solid ${accentColor}30`,
//             textTransform: "uppercase"
//           }}>
//             {layout.type}
//           </span>
//           <span style={{
//             fontSize: "11px",
//             padding: "4px 10px",
//             borderRadius: "20px",
//             background: "#f3f4f6",
//             color: "#4b5563",
//             fontWeight: "600",
//             letterSpacing: "0.05em",
//             border: "1px solid #e5e7eb",
//             textTransform: "uppercase"
//           }}>
//             {layout.style}
//           </span>
//         </div>
//       </div>

//       {/* Template Preview Area */}
//       <div
//         className="preview-mockup"
//         style={{
//           height: "200px",
//           background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}02)`,
//           borderRadius: "16px",
//           marginBottom: "20px",
//           position: "relative",
//           overflow: "hidden",
//           border: `1px solid ${accentColor}20`,
//         }}>
        
//         {/* Preview Content */}
//         {thumbnailSrc ? (
//           <img
//             src={thumbnailSrc}
//             alt={`${name} thumbnail`}
//             loading="lazy"
//             style={{
//               width: "100%",
//               height: "100%",
//               objectFit: "cover",
//               display: "block",
//               borderRadius: "16px",
//               transition: "transform 0.4s ease",
//             }}
//             onError={(e) => {
//               e.currentTarget.style.display = "none";
//             }}
//           />
//         ) : (
//           <>
//             {/* Gradient Background */}
//             <div style={{
//               position: "absolute",
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               background: `linear-gradient(135deg, ${accentColor}05, ${accentColor}15)`,
//             }} />
            
//             {/* Layout Mockup */}
//             <div style={{
//               position: "absolute",
//               top: "16px",
//               left: "16px",
//               right: "16px",
//               bottom: "16px",
//               display: "flex",
//               flexDirection: "column",
//               gap: "8px",
//             }}>
//               {/* Header */}
//               <div style={{
//                 height: "24px",
//                 background: accentColor,
//                 borderRadius: "6px",
//                 width: "70%",
//                 opacity: 0.9,
//               }} />
              
//               {/* Content Blocks */}
//               <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
//                 {[1, 2, 3, 4].map((i) => (
//                   <div key={i} style={{
//                     height: "8px",
//                     background: `${accentColor}${20 + i * 5}`,
//                     borderRadius: "4px",
//                     width: `${90 - i * 10}%`,
//                   }} />
//                 ))}
//               </div>
              
//               {/* Footer Elements */}
//               <div style={{ display: "flex", gap: "8px" }}>
//                 {[1, 2, 3].map((i) => (
//                   <div key={i} style={{
//                     height: "24px",
//                     flex: 1,
//                     background: `${accentColor}${10 + i * 5}`,
//                     borderRadius: "4px",
//                   }} />
//                 ))}
//               </div>
//             </div>
//           </>
//         )}

//         {/* Preview Overlay */}
//         <div
//           onClick={handlePreview}
//           style={{
//             position: "absolute",
//             inset: 0,
//             background: "rgba(0,0,0,0)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             transition: "background 0.3s ease",
//             cursor: "pointer",
//           }}
//           onMouseEnter={(e) => {
//             e.currentTarget.style.background = "rgba(0,0,0,0.1)";
//           }}
//           onMouseLeave={(e) => {
//             e.currentTarget.style.background = "rgba(0,0,0,0)";
//           }}>
//           <div style={{
//             opacity: 0,
//             transform: "translateY(10px)",
//             transition: "all 0.3s ease",
//             background: "white",
//             padding: "8px 16px",
//             borderRadius: "20px",
//             display: "flex",
//             alignItems: "center",
//             gap: "6px",
//             boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
//           }}>
//             <Eye size={16} color={accentColor} />
//             <span style={{
//               fontSize: "12px",
//               fontWeight: "600",
//               color: accentColor,
//             }}>Quick Preview</span>
//           </div>
//         </div>
//       </div>

//       {/* Features */}
//       <div style={{ marginBottom: "20px" }}>
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(2, 1fr)",
//           gap: "8px",
//           marginBottom: "16px",
//         }}>
//           {layout.features.map((feature, index) => (
//             <div key={index} style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "6px",
//               fontSize: "12px",
//               color: "#4b5563",
//             }}>
//               <CheckCircle size={12} color={accentColor} weight="bold" />
//               <span style={{ fontWeight: "500" }}>{feature}</span>
//             </div>
//           ))}
//         </div>

//         {/* Tech Specs */}
//         <div style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "16px",
//           padding: "12px",
//           background: "#f9fafb",
//           borderRadius: "12px",
//           border: "1px solid #f3f4f6",
//         }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//             <PaletteIcon size={12} color={accentColor} weight="bold" />
//             <span style={{ fontSize: "11px", fontWeight: "600", color: "#374151" }}>
//               {fontFamily.split(",")[0]}
//             </span>
//           </div>
//           <div style={{ width: "1px", height: "12px", background: "#e5e7eb" }} />
//           <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//             {showPhoto ? (
//               <Camera size={12} color={accentColor} weight="bold" />
//             ) : (
//               <FileText size={12} color={accentColor} weight="bold" />
//             )}
//             <span style={{ fontSize: "11px", fontWeight: "600", color: "#374151" }}>
//               {showPhoto ? "Photo Ready" : "Text Focused"}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Tags */}
//       {tags.length > 0 && (
//         <div style={{
//           display: "flex",
//           flexWrap: "wrap",
//           gap: "6px",
//           marginBottom: "20px",
//         }}>
//           {tags.slice(0, 4).map((tag, index) => (
//             <span
//               key={index}
//               style={{
//                 fontSize: "11px",
//                 padding: "4px 10px",
//                 borderRadius: "20px",
//                 background: index === 0 ? `${accentColor}15` : "#f3f4f6",
//                 color: index === 0 ? accentColor : "#6b7280",
//                 fontWeight: "600",
//                 border: `1px solid ${index === 0 ? `${accentColor}30` : "#e5e7eb"}`,
//               }}>
//               {tag}
//             </span>
//           ))}
//           {tags.length > 4 && (
//             <span style={{
//               fontSize: "11px",
//               padding: "4px 10px",
//               borderRadius: "20px",
//               background: "#f3f4f6",
//               color: "#9ca3af",
//               fontWeight: "600",
//               border: "1px solid #e5e7eb",
//             }}>
//               +{tags.length - 4}
//             </span>
//           )}
//         </div>
//       )}

//       {/* Action Buttons */}
//       <div style={{ display: "flex", gap: "12px" }}>
//         <button
//           onClick={handlePreview}
//           style={{
//             flex: 1,
//             padding: "14px",
//             borderRadius: "12px",
//             border: `1px solid ${accentColor}40`,
//             background: "white",
//             color: accentColor,
//             fontWeight: "700",
//             cursor: "pointer",
//             transition: "all 0.2s ease",
//             fontSize: "14px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: "8px",
//             letterSpacing: "0.02em",
//           }}
//           onMouseEnter={(e) => {
//             e.target.style.background = `${accentColor}08`;
//             e.target.style.transform = "translateY(-2px)";
//             e.target.style.boxShadow = `0 6px 20px ${accentColor}20`;
//             e.target.style.borderColor = accentColor;
//           }}
//           onMouseLeave={(e) => {
//             e.target.style.background = "white";
//             e.target.style.transform = "translateY(0)";
//             e.target.style.boxShadow = "none";
//             e.target.style.borderColor = `${accentColor}40`;
//           }}>
//           <Eye size={18} color={accentColor} weight="bold" />
//           Preview Details
//         </button>

//         <button
//           onClick={handleSelect}
//           disabled={locked}
//           style={{
//             flex: 1,
//             padding: "14px",
//             borderRadius: "12px",
//             border: "none",
//             background: locked 
//               ? `linear-gradient(135deg, ${accentColor}20, ${accentColor}30)`
//               : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
//             color: locked ? accentColor : "white",
//             fontWeight: "700",
//             cursor: locked ? "not-allowed" : "pointer",
//             transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
//             fontSize: "14px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: "8px",
//             letterSpacing: "0.02em",
//             boxShadow: locked ? "none" : `0 4px 14px ${accentColor}40`,
//             position: "relative",
//             overflow: "hidden",
//           }}
//           onMouseEnter={(e) => {
//             if (!locked) {
//               e.target.style.transform = "translateY(-2px) scale(1.02)";
//               e.target.style.boxShadow = `0 8px 24px ${accentColor}60`;
//             }
//           }}
//           onMouseLeave={(e) => {
//             if (!locked) {
//               e.target.style.transform = "translateY(0) scale(1)";
//               e.target.style.boxShadow = `0 4px 14px ${accentColor}40`;
//             }
//           }}>
//           {/* Button Shine Effect */}
//           {!locked && (
//             <div style={{
//               position: "absolute",
//               top: "-50%",
//               left: "-50%",
//               width: "200%",
//               height: "200%",
//               background: "linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)",
//               transform: "translateX(-100%)",
//               transition: "transform 0.6s",
//             }} />
//           )}
          
//           {locked ? (
//             <>
//               <LockKey size={18} color={accentColor} weight="bold" />
//               <span>Upgrade to Use</span>
//             </>
//           ) : (
//             <>
//               <Sparkle size={18} color="white" weight="fill" />
//               <span>Use Template</span>
//               <ArrowRight size={16} color="white" style={{ marginLeft: "2px" }} />
//             </>
//           )}
//         </button>
//       </div>

//       {/* Locked Notice */}
//       {locked && (
//         <div style={{
//           marginTop: "12px",
//           textAlign: "center",
//         }}>
//           <div style={{
//             display: "inline-flex",
//             alignItems: "center",
//             gap: "6px",
//             padding: "6px 12px",
//             background: "#fef3c7",
//             borderRadius: "8px",
//             border: "1px solid #fbbf24",
//           }}>
//             <LockKey size={12} color="#d97706" />
//             <span style={{
//               fontSize: "11px",
//               fontWeight: "600",
//               color: "#92400e",
//             }}>
//               Premium template – requires subscription
//             </span>
//           </div>
//         </div>
//       )}

//       {/* CSS Animations */}
//       <style>{`
//         .template-card:hover .preview-mockup img {
//           transform: scale(1.05);
//         }
        
//         .template-card:hover .preview-mockup > div > div {
//           opacity: 1;
//           transform: translateY(0);
//         }
        
//         .template-card button:hover .shine-effect {
//           transform: translateX(100%);
//         }
        
//         @keyframes float {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(-4px); }
//         }
        
//         .template-card:hover {
//           animation: float 6s ease-in-out infinite;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TemplateCard;