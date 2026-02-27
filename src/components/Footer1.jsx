import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "phosphor-react";
import manCvImg from "../assets/man-cv.png";
import waveImg from "../assets/wave.png";
import portalImg from "../assets/Portal.png";

/**
 * Footer1 – CTA banner: "Ready to create more?" with waves, document icon, and man-cv image.
 * Uses man-cv.png, wave.png, Portal.png and Phosphor FileText icon.
 */
export default function Footer1({ onCreateClick }) {
  const navigate = useNavigate();

  const handleCreate = () => {
    if (typeof onCreateClick === "function") {
      onCreateClick();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <footer
      className="footer-1"
      style={{
        width: "100%",
        maxWidth: "100vw",
        position: "relative",
        marginTop: 32,
        minHeight: 120,
        paddingTop: 0,
        paddingBottom: 40,
        paddingLeft: 24,
        paddingRight: 24,
        overflow: "hidden",
      }}
    >
      {/* Blue oval background – wider ellipse, clipped by overflow:hidden */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: 0,
          width: "140%",
          minWidth: "100%",
          height: 480,
          background: "#007BFF",
          boxShadow:
            "inset 22px 32px 44px rgba(0, 0, 0, 0.12), inset 0px -12px 22px rgba(0, 0, 0, 0.14)",
          borderRadius: "50%",
        }}
      />

      {/* White card on top – gradient white center, light blue at sides */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 980,
          margin: "0px auto 0",
          background: "linear-gradient(90deg, #bae6fd 0%, #e0f2fe 10%, #f0f9ff 20%, #ffffff 30%, #ffffff 70%, #f0f9ff 80%, #e0f2fe 90%, #bae6fd 100%)",
          borderRadius: 12,
          padding: "36px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 36,
          boxShadow: "0 14px 40px rgba(15,23,42,0.16)",
          overflow: "visible",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Scattered Portal.png – same positions as before (left half and top right) */}
        {[
          { top: "8%", left: "18%" },
          { top: "22%", left: "8%" },
          { top: "12%", left: "28%" },
          { top: "28%", left: "22%" },
          { bottom: "6%", left: "30%"},
          { bottom: "14%", left: "22%"},
          { top: "10%", left: "24%", left: "auto" },
          { top: "10%", right: "14%", left: "auto" },
          { bottom: "10%", left: "2%" },
          { bottom: "12%", left: "12%" },
        ].map((pos, i) => (
          <img
            key={i}
            src={portalImg}
            alt=""
            style={{
              position: "absolute",
              width: 24,
              height: 24,
              objectFit: "contain",
              opacity: 0.85,
              ...pos,
            }}
          />
        ))}

        {/* Left: waves only */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: "0 0 auto",
            marginLeft: 24,
          }}
        >
          <div style={{ position: "relative", width: 130, height: 100 }}>
            <img
              src={waveImg}
              alt="Decorative waves"
              style={{
                width: "150%",
                height: "100%",
                objectFit: "contain",
                filter: "brightness(0)",
              }}
            />
          </div>
        </div>

        {/* Center: document icon, heading, subtext, button */}
        <div
          style={{
            textAlign: "center",
            flex: "1 1 auto",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <FileText size={44} weight="fill" color="#007BFF" />
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 6,
            }}
          >
            Ready to create more?
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 14,
            }}
          >
            Build unlimited resumes with our professional templates.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              backgroundColor: "#007BFF",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0,123,255,0.35)",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={20} weight="bold" />
            Create New Resume
          </button>
        </div>

        {/* Right: man with folder (man-cv.png) – slightly larger */}
        <div
          style={{
            flex: "0 0 auto",
            position: "relative",
            width: 220,
            height: 180,
          }}
        >
          <img
            src={manCvImg}
            alt="Person pointing to create resume"
            style={{
              position: "absolute",
              right: -12,
              bottom: -76,
              height: 300,
              objectFit: "contain",
              filter: "drop-shadow(0 18px 40px rgba(15,23,42,0.55))",
            }}
          />
        </div>
      </div>
    </footer>
  );
}
