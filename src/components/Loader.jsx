import React from "react";

export default function Loader({ size = 20, color = "#2563eb", label = "" }) {
  const ring = {
    width: size,
    height: size,
    borderRadius: "50%",
    border: `${Math.max(2, Math.floor(size / 10))}px solid #e2e8f0`,
    borderTopColor: color,
    animation: "spin 1s linear infinite",
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={ring} />
      {label ? <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span> : null}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}


