import React, { useState } from "react";
import { Link } from "react-router-dom";
import heroImg from "../assets/hero.png";
import frameImg from "../assets/Frame.png";
import lineCombinedImg from "../assets/linecombined.png";
import "../css/ATSChecker.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { api } from "../lib/api.js";

const ATSChecker = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResults, setAtsResults] = useState(null);
  const [error, setError] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setAtsResults(null);
    setAtsScore(null);
    setError(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (
      file.type === "application/pdf" ||
      file.name.endsWith(".pdf") ||
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".doc") ||
      file.name.endsWith(".docx")
    ) {
      setUploadedFile(file);
      setAtsResults(null);
      setError(null);
    } else {
      alert("Please upload a PDF, DOC, or DOCX file.");
    }
  };

  const handleATSScan = async () => {
    if (!uploadedFile) {
      alert("Please upload a resume file first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // First, parse the resume to get text content
      const parseFormData = new FormData();
      parseFormData.append("file", uploadedFile);

      const parseResponse = await api.post(
        "/api/v1/files/parse",
        parseFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const parsedData = parseResponse.data?.data || parseResponse.data;
      let resumeText = parsedData.rawText || "";

      // If rawText is limited, try to reconstruct from structured data
      if (!resumeText || resumeText.length < 50) {
        // Try to build text from structured data
        const parts = [];
        if (parsedData.contact) {
          if (parsedData.contact.fullName)
            parts.push(parsedData.contact.fullName);
          if (parsedData.contact.summary)
            parts.push(parsedData.contact.summary);
        }
        if (parsedData.experience && Array.isArray(parsedData.experience)) {
          parsedData.experience.forEach((exp) => {
            if (exp.title) parts.push(exp.title);
            if (exp.company) parts.push(exp.company);
            if (exp.bullets) parts.push(...exp.bullets);
          });
        }
        if (parsedData.skills && Array.isArray(parsedData.skills)) {
          parsedData.skills.forEach((s) => {
            if (s.name) parts.push(s.name);
          });
        }
        resumeText = parts.join(" ");
      }

      if (!resumeText || resumeText.trim().length < 10) {
        throw new Error(
          "Could not extract sufficient text from resume file. Please ensure the file is not corrupted and contains readable text."
        );
      }

      // Then use the ATS check API with the extracted text
      const atsPayload = {
        resumeText: resumeText,
        jobDescription: jobDescription.trim() || "",
      };

      const response = await api.post("/api/v1/ats/check", atsPayload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const results = response.data?.data || response.data;

      // Safety check to prevent undefined errors
      if (results && typeof results === "object") {
        setAtsResults(results);
        setAtsScore(results.overallScore || results.score || 0);
      } else {
        throw new Error("Invalid response format from ATS API");
      }
    } catch (err) {
      console.error("ATS Check Error:", err);
      let errorMessage = "Failed to analyze resume. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 500) {
        errorMessage =
          "Server error. Please try again later or contact support.";
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid request. Please check your file and try again.";
      }

      setError(errorMessage);
      setAtsResults(null);
      setAtsScore(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const CircularScore = ({ score }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="circular-score">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="#007BFF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            className="score-circle"
          />
        </svg>
        <div className="score-text">
          <div className="score-number">{score}</div>
        </div>
      </div>
    );
  };

  return (
    <main className="ats-checker">
      <Navbar />

      {/* Hero Section */}
      <section className="ats-hero">
        {/* Text on the left */}
        <div className="ats-hero-left">
          <h1 className="ats-hero-title">
            Optimize Your Resume for Every Job Application
          </h1>
          <p className="ats-hero-subtitle">
            Scan your resume against applicant tracking systems (ATS), fix
            errors, and boost your chances of getting noticed.
          </p>
          <div className="ats-hero-cta">
            <button className="btn-primary">Start Free ATS Scan</button>
            <Link to="#how-it-works" className="btn-secondary">
              See How It Works
            </Link>
          </div>
          {/* Decorative elements */}
          <div className="hero-decorations">
            <img
              src={frameImg}
              alt="Frame decoration"
              className="frame-decoration"
            />
            <img
              src={lineCombinedImg}
              alt="Line decoration"
              className="line-decoration"
            />
            <span className="star-blue star-1" />
            <span className="star-blue star-2" />
          </div>
        </div>

        {/* Image on the right */}
        <div className="ats-hero-right">
          <img
            src={heroImg}
            alt="ATS Resume Optimization"
            className="hero-image"
          />
        </div>
      </section>

      {/* Statistics Section */}
      <section className="ats-stats">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-label">Resumes Scanned</div>
            <div className="stat-number">30000+</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Keywords Optimized</div>
            <div className="stat-number">5000+</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Job Seekers Helped</div>
            <div className="stat-number">25000+</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Average Score Improvement</div>
            <div className="stat-number">1000+</div>
          </div>
        </div>
      </section>

      {/* ATS Checker Section */}
      <section className="ats-checker-section">
        <div className="checker-container">
          <h2 className="section-title">Scanning your resume</h2>
          <h3 className="section-subtitle">ATS Checker</h3>

          <div
            className={`file-upload-area ${dragActive ? "drag-active" : ""} ${
              uploadedFile ? "has-file" : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}>
            {!uploadedFile ? (
              <>
                <div className="upload-icon">📄</div>
                <h4>Drag and drop your resume here</h4>
                <p>
                  Or upload from your computer. We accept PDF, DOC, DOCX files.
                </p>
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <label htmlFor="resume-upload" className="upload-button">
                  Upload Resume
                </label>
              </>
            ) : (
              <div className="uploaded-file">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <div className="file-name">{uploadedFile.name}</div>
                  <div className="file-size">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginLeft: "auto",
                  }}>
                  {isAnalyzing ? (
                    <div className="analyzing">Analyzing...</div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: "#dc2626",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}>
                      Remove file
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Job Description Input */}
          <div className="job-description-section">
            <label htmlFor="job-description" className="job-description-label">
              Job Description (Optional)
            </label>
            <textarea
              id="job-description"
              className="job-description-input"
              placeholder="Paste the job description here for more accurate analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
            />
            <p className="upload-note">
              Providing a job description will give you more accurate keyword
              matching and suggestions.
            </p>
          </div>

          {error && (
            <div
              className="error-message"
              style={{
                color: "#dc2626",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                padding: "12px",
                borderRadius: "8px",
                margin: "16px 0",
              }}>
              {error}
            </div>
          )}

          <button
            className="scan-ats-btn"
            onClick={handleATSScan}
            disabled={!uploadedFile || isAnalyzing}>
            {isAnalyzing ? "Analyzing..." : "Scan for ATS"}
          </button>
        </div>
      </section>

      {/* ATS Score Section */}
      {atsResults && !isAnalyzing && (
        <section className="ats-score-section">
          <div className="score-container">
            <div className="score-left">
              <h3 className="score-title">ATS Score</h3>
              <CircularScore score={atsScore} />
              <div className="overall-score">Overall Score</div>
              <div
                className="score-feedback"
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor:
                    atsScore >= 70
                      ? "#f0fdf4"
                      : atsScore >= 50
                      ? "#fefce8"
                      : "#fef2f2",
                  border: `1px solid ${
                    atsScore >= 70
                      ? "#bbf7d0"
                      : atsScore >= 50
                      ? "#fde68a"
                      : "#fecaca"
                  }`,
                  borderRadius: "8px",
                  color:
                    atsScore >= 70
                      ? "#15803d"
                      : atsScore >= 50
                      ? "#a16207"
                      : "#dc2626",
                }}>
                {atsScore >= 70
                  ? "✅ Great! Your resume is ATS-friendly."
                  : atsScore >= 50
                  ? "⚠️ Good, but there's room for improvement."
                  : "❌ Your resume needs significant ATS optimization."}
              </div>
            </div>

            <div className="score-right">
              <div className="score-breakdown">
                {atsResults && atsResults.keywords && (
                  <div className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-title">Keywords</span>
                      <span className="breakdown-score">
                        {atsResults.keywords.score || 0}/100
                      </span>
                    </div>
                    <div className="breakdown-description">
                      {atsResults.keywords.description ||
                        "This section analyzes the presence and relevance of keywords from the job description in your resume."}
                    </div>
                    {atsResults.keywords.matchedKeywords &&
                      Array.isArray(atsResults.keywords.matchedKeywords) &&
                      atsResults.keywords.matchedKeywords.length > 0 && (
                        <div
                          className="matched-keywords"
                          style={{ marginTop: "12px" }}>
                          <strong style={{ color: "#15803d" }}>
                            Matched Keywords:
                          </strong>
                          <div
                            className="keyword-tags"
                            style={{ marginTop: "8px" }}>
                            {atsResults.keywords.matchedKeywords.map(
                              (keyword, index) => (
                                <span
                                  key={index}
                                  className="keyword-tag"
                                  style={{
                                    backgroundColor: "#d1fae5",
                                    color: "#065f46",
                                    border: "1px solid #a7f3d0",
                                  }}>
                                  {keyword}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {atsResults.keywords.missingKeywords &&
                      Array.isArray(atsResults.keywords.missingKeywords) &&
                      atsResults.keywords.missingKeywords.length > 0 && (
                        <div
                          className="missing-keywords"
                          style={{ marginTop: "12px" }}>
                          <strong style={{ color: "#dc2626" }}>
                            Missing Keywords:
                          </strong>
                          <div
                            className="keyword-tags"
                            style={{ marginTop: "8px" }}>
                            {atsResults.keywords.missingKeywords.map(
                              (keyword, index) => (
                                <span
                                  key={index}
                                  className="keyword-tag"
                                  style={{
                                    backgroundColor: "#fee2e2",
                                    color: "#991b1b",
                                    border: "1px solid #fecaca",
                                  }}>
                                  {keyword}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {atsResults && atsResults.formatting && (
                  <div className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-title">Formatting</span>
                      <span className="breakdown-score">
                        {atsResults.formatting.score || 0}/100
                      </span>
                    </div>
                    <div className="breakdown-description">
                      {atsResults.formatting.description ||
                        "Analyzes resume structure, fonts, and formatting compatibility with ATS systems."}
                    </div>
                    {atsResults.formatting.issues &&
                      Array.isArray(atsResults.formatting.issues) &&
                      atsResults.formatting.issues.length > 0 && (
                        <div
                          className="formatting-issues"
                          style={{ marginTop: "12px" }}>
                          <strong>Issues Found:</strong>
                          <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                            {atsResults.formatting.issues.map((issue, idx) => (
                              <li
                                key={idx}
                                style={{
                                  marginBottom: "4px",
                                  color: "#dc2626",
                                }}>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                {atsResults && atsResults.readability && (
                  <div className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-title">Readability</span>
                      <span className="breakdown-score">
                        {atsResults.readability.score || 0}/100
                      </span>
                    </div>
                    <div className="breakdown-description">
                      {atsResults.readability.description ||
                        "Evaluates sentence structure, clarity, and overall readability of your resume."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Suggestions Section */}
      {atsResults &&
        atsResults.suggestions &&
        atsResults.suggestions.length > 0 &&
        !isAnalyzing && (
          <section className="suggestions-section">
            <div className="suggestions-container">
              <h3 className="suggestions-title">Suggestions for Improvement</h3>

              <div className="suggestions-list">
                {atsResults.suggestions &&
                  Array.isArray(atsResults.suggestions) &&
                  atsResults.suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                      <div className="suggestion-header">
                        <div className="suggestion-category">
                          {suggestion.category || "General"}
                        </div>
                        <div
                          className="suggestion-priority"
                          style={{
                            backgroundColor:
                              suggestion.priority === "high"
                                ? "#fef2f2"
                                : suggestion.priority === "medium"
                                ? "#fefce8"
                                : "#f0fdf4",
                            color:
                              suggestion.priority === "high"
                                ? "#dc2626"
                                : suggestion.priority === "medium"
                                ? "#a16207"
                                : "#15803d",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}>
                          {suggestion.priority || "low"}
                        </div>
                      </div>
                      <div className="suggestion-text">
                        {suggestion.text || suggestion.description}
                      </div>
                      {suggestion.action && (
                        <div
                          className="suggestion-action"
                          style={{
                            marginTop: "8px",
                            padding: "8px 12px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}>
                          <strong>Action:</strong> {suggestion.action}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

      <Footer />
    </main>
  );
};

export default ATSChecker;
