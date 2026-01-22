import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { X, Download, Cloud, Warning, CheckCircle } from "@phosphor-icons/react";
import { calculateResumeProgress, getResumeFromLocal, saveResumeToLocal } from "../lib/localStorage.js";

export default function ExportGateModal({ isOpen, onClose, resumeData, onContinueWithoutSaving }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Save data to localStorage before showing modal
  React.useEffect(() => {
    if (isOpen && resumeData) {
      saveResumeToLocal(resumeData);
    }
  }, [isOpen, resumeData]);

  const progress = calculateResumeProgress(resumeData);
  const isComplete = progress >= 80;

  const handleCreateAccount = () => {
    // Data is already saved to localStorage
    setLoading(true);
    navigate("/signup", {
      state: {
        redirectTo: "/builder",
        saveResume: true,
      },
    });
  };

  const handleSignIn = () => {
    // Data is already saved to localStorage
    setLoading(true);
    navigate("/signin", {
      state: {
        redirectTo: "/builder",
        saveResume: true,
      },
    });
  };

  const handleContinueWithoutSaving = () => {
    if (onContinueWithoutSaving) {
      onContinueWithoutSaving();
    }
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 16,
      }}
      onClick={onClose}>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 560,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
                marginBottom: 8,
              }}>
              Login to Download Your Resume
            </h2>
            {isComplete && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  padding: "8px 12px",
                  background: "#dcfce7",
                  borderRadius: 8,
                  color: "#166534",
                  fontSize: 14,
                  fontWeight: 600,
                }}>
                <CheckCircle size={20} weight="fill" />
                Your resume is {progress}% complete!
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              color: "#64748b",
              cursor: "pointer",
              padding: 0,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              marginLeft: 16,
            }}>
            <X size={24} weight="regular" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 16,
                color: "#475569",
                lineHeight: 1.6,
                margin: 0,
                marginBottom: 16,
              }}>
              Your resume has been saved locally. Create a free account to download and unlock:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Download size={20} weight="fill" style={{ color: "#2563eb" }} />
                <span style={{ fontSize: 14, color: "#0f172a" }}>
                  Download as PDF or Word
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Cloud size={20} weight="fill" style={{ color: "#2563eb" }} />
                <span style={{ fontSize: 14, color: "#0f172a" }}>
                  Save your resume permanently
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                  }}>
                  ✨
                </div>
                <span style={{ fontSize: 14, color: "#0f172a" }}>
                  Access multiple templates
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                  }}>
                  📱
                </div>
                <span style={{ fontSize: 14, color: "#0f172a" }}>
                  Manage multiple resumes
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {progress > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                  Resume Progress
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                  {progress}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  background: "#e2e8f0",
                  borderRadius: 4,
                  overflow: "hidden",
                }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: progress >= 80 ? "#22c55e" : "#2563eb",
                    borderRadius: 4,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={handleCreateAccount}
              disabled={loading}
              style={{
                width: "100%",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px 20px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 15,
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#2563eb";
              }}>
              {loading ? "Redirecting..." : "Create Free Account"}
            </button>

            {!user && (
              <button
                onClick={handleSignIn}
                disabled={loading}
                style={{
                  width: "100%",
                  background: "#fff",
                  color: "#2563eb",
                  border: "1px solid #2563eb",
                  borderRadius: 10,
                  padding: "14px 20px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#eff6ff";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#fff";
                }}>
                Sign In to Existing Account
              </button>
            )}

            <button
              onClick={handleContinueWithoutSaving}
              disabled={loading}
              style={{
                width: "100%",
                background: "transparent",
                color: "#64748b",
                border: "none",
                borderRadius: 10,
                padding: "12px 20px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                opacity: loading ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}>
              <Warning size={16} weight="regular" />
              Continue without downloading
            </button>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#94a3b8",
              textAlign: "center",
              marginTop: 16,
              marginBottom: 0,
            }}>
            Your resume data is saved locally and will be preserved when you create an account
          </p>
        </div>
      </div>
    </div>
  );
}
