import React, { useState } from "react";
import { api } from "../lib/api.js";
import { useNavigate } from "react-router-dom";

export default function ResumeUpload({ onClose, selectedTemplateSlug }) {
const navigate = useNavigate();
const [file, setFile] = useState(null);
const [dragActive, setDragActive] = useState(false);
const [parsing, setParsing] = useState(false);
const [importing, setImporting] = useState(false);
const [parsedData, setParsedData] = useState(null);
const [error, setError] = useState("");
const [templates, setTemplates] = useState([]);
const [selectedTemplate, setSelectedTemplate] = useState(null);

// Load templates on component mount
React.useEffect(() => {
const loadTemplates = async () => {
try {
const res = await api.get("/api/v1/templates/public");
const items = res.data?.data?.items || [];
setTemplates(items);

// Set default template
if (selectedTemplateSlug) {
const template = items.find((t) => t.slug === selectedTemplateSlug);
setSelectedTemplate(template || items[0]);
} else {
setSelectedTemplate(items[0]);
}
} catch (error) {
console.error("Failed to load templates:", error);
}
};
loadTemplates();
}, [selectedTemplateSlug]);

const S = {
overlay: {
position: "fixed",
top: 0,
left: 0,
right: 0,
bottom: 0,
background: "rgba(0,0,0,0.5)",
display: "flex",
alignItems: "center",
justifyContent: "center",
zIndex: 9999,
padding: 16,
},
modal: {
background: "#fff",
borderRadius: 16,
maxWidth: 720,
width: "100%",
maxHeight: "90vh",
overflow: "auto",
boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
},
header: {
padding: "20px 24px",
borderBottom: "1px solid #e5e7eb",
display: "flex",
justifyContent: "space-between",
alignItems: "center",
},
title: {
fontSize: 20,
fontWeight: 700,
color: "#0f172a",
margin: 0,
},
closeBtn: {
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
},
body: {
padding: 24,
},
dropzone: (active) => ({
border: `2px dashed ${active ? "#2563eb" : "#cbd5e1"}`,
borderRadius: 12,
padding: 48,
textAlign: "center",
background: active ? "#eff6ff" : "#f8fafc",
cursor: "pointer",
transition: "all 0.2s",
}),
icon: {
fontSize: 48,
color: "#2563eb",
marginBottom: 16,
},
text: {
fontSize: 16,
color: "#0f172a",
marginBottom: 8,
fontWeight: 600,
},
subtext: {
fontSize: 14,
color: "#64748b",
},
fileInfo: {
display: "flex",
alignItems: "center",
gap: 12,
padding: 16,
background: "#f1f5f9",
borderRadius: 10,
marginTop: 16,
},
fileName: {
flex: 1,
fontSize: 14,
fontWeight: 600,
color: "#0f172a",
},
removeBtn: {
background: "#fff",
border: "1px solid #cbd5e1",
borderRadius: 6,
padding: "6px 12px",
fontSize: 12,
cursor: "pointer",
color: "#dc2626",
},
previewCard: {
background: "#f8fafc",
border: "1px solid #e5e7eb",
borderRadius: 12,
padding: 20,
marginTop: 20,
},
previewTitle: {
fontSize: 16,
fontWeight: 700,
color: "#0f172a",
marginBottom: 16,
},
previewSection: {
marginBottom: 16,
},
sectionLabel: {
fontSize: 12,
fontWeight: 700,
color: "#475569",
marginBottom: 6,
textTransform: "uppercase",
letterSpacing: "0.05em",
},
sectionContent: {
fontSize: 14,
color: "#0f172a",
lineHeight: 1.6,
},
btnRow: {
display: "flex",
gap: 12,
marginTop: 24,
},
btnSolid: {
flex: 1,
background: "#2563eb",
color: "#fff",
border: "none",
borderRadius: 10,
padding: "12px 20px",
fontWeight: 600,
cursor: "pointer",
fontSize: 14,
},
btnOutline: {
flex: 1,
background: "#fff",
color: "#2563eb",
border: "1px solid #93c5fd",
borderRadius: 10,
padding: "12px 20px",
fontWeight: 600,
cursor: "pointer",
fontSize: 14,
},
error: {
background: "#fef2f2",
border: "1px solid #fca5a5",
borderRadius: 8,
padding: 12,
color: "#dc2626",
fontSize: 14,
marginTop: 16,
},
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
handleFileSelect(e.dataTransfer.files[0]);
}
};

const handleFileSelect = (selectedFile) => {
setError("");
setParsedData(null);

// Validate file type
const validTypes = [
"application/pdf",
"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
if (!validTypes.includes(selectedFile.type)) {
setError("Please upload a PDF or DOCX file");
return;
}

// Validate file size (10MB)
if (selectedFile.size > 10 * 1024 * 1024) {
setError("File size must be less than 10MB");
return;
}

setFile(selectedFile);
};

const handleParse = async () => {
if (!file) return;
setParsing(true);
setError("");

try {
const formData = new FormData();
formData.append("file", file);

const res = await api.post("/api/v1/files/parse", formData, {
headers: { "Content-Type": "multipart/form-data" },
});

setParsedData(res.data?.data || null);
} catch (err) {
setError(
err.response?.data?.message ||
"Failed to parse resume. Please try again."
);
console.error(err);
} finally {
setParsing(false);
}
};

const handleImport = async () => {
if (!file) return;
setImporting(true);
setError("");

try {
// Check resume limit before importing
try {
  const resumeCountRes = await api.get("/api/v1/resumes");
  const resumeCount = resumeCountRes.data?.data?.items?.length || resumeCountRes.data?.data?.count || 0;
  if (resumeCount >= 5) {
    setError("You have reached the maximum limit of 5 resumes. Please delete a resume to import a new one.");
    setImporting(false);
    return;
  }
} catch (err) {
  console.warn("Could not check resume count:", err);
  // Continue anyway - backend will enforce the limit
}

const formData = new FormData();
formData.append("file", file);

// Use selected template or fallback
const templateSlug =
selectedTemplate?.slug || selectedTemplateSlug || "modern-flat";
formData.append("templateSlug", templateSlug);

const res = await api.post("/api/v1/files/import", formData, {
headers: { "Content-Type": "multipart/form-data" },
});

const resumeId = res.data?.data?.resumeId;
if (resumeId) {
// Fetch the newly created resume so builder fields are prefilled
try {
  const resumeRes = await api.get(`/api/v1/resumes/${resumeId}`);
  const resumePayload = resumeRes.data?.data?.resume;
  if (resumePayload) {
    sessionStorage.setItem(
      "pendingResumeData",
      JSON.stringify({
        contact: resumePayload.contact || {},
        experience: resumePayload.experience || [],
        education: resumePayload.education || [],
        skills: resumePayload.skills || [],
        projects: resumePayload.projects || [],
        awards: resumePayload.awards || [],
        hobbies: resumePayload.hobbies || [],
        title: resumePayload.title || "Imported Resume",
        templateSlug: templateSlug,
      })
    );
    sessionStorage.setItem("pendingTemplateSlug", templateSlug);
  }
} catch (fetchErr) {
  console.warn("Could not prefetch resume for builder:", fetchErr);
}

// Close modal first
if (onClose) onClose();
// Small delay to ensure state is clean before navigation
setTimeout(() => {
navigate("/builder", {
state: {
resumeId,
templateSlug: templateSlug,
          startFresh: false,
},
replace: true,
});
}, 100);
}
} catch (err) {
const errorMsg = err.response?.data?.message || "Failed to import resume. Please try again.";
setError(errorMsg);
console.error("❌ Import error:", err);
console.error("Response:", err.response?.data);
setImporting(false);
}
};

return (
<div style={S.overlay} onClick={onClose}>
<div style={S.modal} onClick={(e) => e.stopPropagation()}>
<div style={S.header}>
<h2 style={S.title}>Upload Your Resume</h2>
<button style={S.closeBtn} onClick={onClose}>
×
</button>
</div>

<div style={S.body}>
{!file ? (
<div
style={S.dropzone(dragActive)}
onDragEnter={handleDrag}
onDragLeave={handleDrag}
onDragOver={handleDrag}
onDrop={handleDrop}
onClick={() => document.getElementById("fileInput").click()}>
<div style={S.icon}>📄</div>
<div style={S.text}>
Drag & drop your resume here, or click to browse
</div>
<div style={S.subtext}>
Supports PDF and DOCX files (max 10MB)
<br />
<span style={{ fontSize: 12, color: "#94a3b8" }}>
AI will extract all your information automatically
</span>
</div>
<input
id="fileInput"
type="file"
accept=".pdf,.docx,.doc"
style={{ display: "none" }}
onChange={(e) =>
e.target.files[0] && handleFileSelect(e.target.files[0])
}
/>
</div>
) : (
<>
<div style={S.fileInfo}>
<div style={S.fileName}>📄 {file.name}</div>
<button
data-variant="error"
style={S.removeBtn}
onClick={() => {
setFile(null);
setParsedData(null);
setError("");
}}>
Remove
</button>
</div>

{parsedData && (
<div style={S.previewCard}>
<div style={S.previewTitle}>✨ Parsed Resume Data</div>

{parsedData.contact?.summary && (
<div style={S.previewSection}>
  <div style={S.sectionLabel}>Summary</div>
  <div style={S.sectionContent}>{parsedData.contact.summary}</div>
</div>
)}

{parsedData.contact && (
<div style={S.previewSection}>
<div style={S.sectionLabel}>Contact Information</div>
<div style={S.sectionContent}>
<strong>{parsedData.contact.fullName || "N/A"}</strong>
<br />
{parsedData.contact.email && (
<>
{parsedData.contact.email}
<br />
</>
)}
{parsedData.contact.phone && (
<>
{parsedData.contact.phone}
<br />
</>
)}
{parsedData.contact.address && (
<>{parsedData.contact.address}</>
)}
{parsedData.contact.location && (
  <>
    <br />
    {parsedData.contact.location}
  </>
)}
{parsedData.contact.website && (
  <>
    <br />
    {parsedData.contact.website}
  </>
)}
{parsedData.contact.github && (
  <>
    <br />
    {parsedData.contact.github}
  </>
)}
{parsedData.contact.linkedin && (
  <>
    <br />
    {parsedData.contact.linkedin}
  </>
)}
</div>
</div>
)}

{parsedData.experience?.length > 0 && (
<div style={S.previewSection}>
<div style={S.sectionLabel}>Experience</div>
<div style={S.sectionContent}>
{parsedData.experience.slice(0, 2).map((exp, i) => (
<div key={i} style={{ marginBottom: 8 }}>
<strong>{exp.title || "Position"}</strong> at{" "}
{exp.company || "Company"}
{exp.startDate && (
<>
{" "}
({exp.startDate.substring(0, 7)} -{" "}
{exp.current
? "Present"
: exp.endDate?.substring(0, 7) || "N/A"}
)
</>
)}
</div>
))}
{parsedData.experience.length > 2 && (
<div style={{ color: "#64748b", fontSize: 13 }}>
+ {parsedData.experience.length - 2} more
</div>
)}
</div>
</div>
)}

{parsedData.education?.length > 0 && (
<div style={S.previewSection}>
<div style={S.sectionLabel}>Education</div>
<div style={S.sectionContent}>
{parsedData.education.map((edu, i) => (
<div key={i}>
{edu.degree || "Degree"} - {edu.school || "School"}
{(edu.startDate || edu.endDate) && (
  <>
    {" "}
    ({edu.startDate?.substring(0, 4) || "N/A"} -{" "}
    {edu.endDate?.substring(0, 4) || "N/A"})
  </>
)}
{edu.location && ` – ${edu.location}`}
</div>
))}
</div>
</div>
)}

{parsedData.skills?.length > 0 && (
<div style={S.previewSection}>
<div style={S.sectionLabel}>Skills</div>
<div style={S.sectionContent}>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
  {parsedData.skills.slice(0, 20).map((skill, i) => {
    const name = typeof skill === "string" ? skill : skill?.name || "";
    const level =
      typeof skill === "object" && typeof skill.level === "number"
        ? skill.level
        : undefined;
    return (
      <div key={i}>
        {name}
        {level !== undefined ? ` (${level})` : ""}
      </div>
    );
  })}
  {parsedData.skills.length > 20 && (
    <div style={{ color: "#64748b", fontSize: 13 }}>
      + {parsedData.skills.length - 20} more
    </div>
  )}
</div>
</div>
</div>
)}

{parsedData.projects?.length > 0 && (
<div style={S.previewSection}>
  <div style={S.sectionLabel}>Projects</div>
  <div style={S.sectionContent}>
    {parsedData.projects.map((p, i) => (
      <div key={i} style={{ marginBottom: 8 }}>
        <strong>{p.name || "Project"}</strong>
        {p.link && (
          <>
            {" – "}
            <span style={{ color: "#2563eb" }}>{p.link}</span>
          </>
        )}
        {p.description && (
          <>
            <br />
            {p.description}
          </>
        )}
      </div>
    ))}
  </div>
</div>
)}

{parsedData.awards?.length > 0 && (
<div style={S.previewSection}>
  <div style={S.sectionLabel}>Awards</div>
  <div style={S.sectionContent}>
    {parsedData.awards.map((a, i) => (
      <div key={i} style={{ marginBottom: 8 }}>
        <strong>{a.title || a.name || "Award"}</strong>
        {a.issuer && ` – ${a.issuer}`}
        {a.date && ` (${a.date.substring(0, 10)})`}
        {a.description && (
          <>
            <br />
            {a.description}
          </>
        )}
      </div>
    ))}
  </div>
</div>
)}

{parsedData.hobbies?.length > 0 && (
<div style={S.previewSection}>
  <div style={S.sectionLabel}>Interests</div>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "8px 12px",
  }}>
  {parsedData.hobbies.map((h, i) => (
    <div
      key={i}
      style={{
        padding: "8px 10px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        fontSize: 13,
        color: "#0f172a",
      }}>
      {typeof h === "string" ? h : h.name || ""}
    </div>
  ))}
</div>
</div>
)}
</div>
)}

{/* Template Selection */}
{templates.length > 0 && (
<div style={{ marginTop: 20, marginBottom: 16 }}>
<div style={S.sectionLabel}>Choose Template</div>
<select
value={selectedTemplate?.slug || ""}
onChange={(e) => {
const template = templates.find(
(t) => t.slug === e.target.value
);
setSelectedTemplate(template);
}}
style={{
width: "100%",
padding: "12px",
border: "1px solid #cbd5e1",
borderRadius: "8px",
fontSize: "14px",
background: "#fff",
marginTop: "8px",
}}>
{templates.map((template) => (
<option key={template.slug} value={template.slug}>
{template.name}{" "}
{template.category === "premium" ? "⭐" : ""}
</option>
))}
</select>
{selectedTemplate && (
<div
style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
{selectedTemplate.category === "premium"
? "⭐ Premium Template"
: "🆓 Free Template"}{" "}
• {selectedTemplate.tags?.join(", ") || "Professional"}
</div>
)}
</div>
)}

{error && <div style={S.error}>{error}</div>}

<div style={S.btnRow}>
{!parsedData ? (
<>
<button
style={S.btnOutline}
onClick={() => {
setFile(null);
setParsedData(null);
setError("");
}}>
Cancel
</button>
<button
style={S.btnSolid}
onClick={handleParse}
disabled={parsing}>
{parsing ? "Parsing..." : "Preview Resume Data"}
</button>
</>
) : (
<>
<button
style={S.btnOutline}
onClick={() => {
setParsedData(null);
setError("");
}}>
Re-parse
</button>
<button
style={S.btnSolid}
onClick={handleImport}
disabled={importing}>
{importing ? "Importing..." : "Import & Edit Resume"}
</button>
</>
)}
</div>
</>
)}
</div>
</div>
</div>
);
}