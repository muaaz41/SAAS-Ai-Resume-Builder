import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../context/AuthContext.jsx";
import ResumeUpload from "./ResumeUpload.jsx";
import TemplateCard from "./TemplateCard.jsx";

export default function Dashboard() {
const navigate = useNavigate();
const { user } = useAuth();
const [templates, setTemplates] = useState([]);
const [resumes, setResumes] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [category, setCategory] = useState("all");
const [deleting, setDeleting] = useState(null);
const [showUpload, setShowUpload] = useState(false);
const [uploadTemplateSlug, setUploadTemplateSlug] = useState(null);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [selectedResume, setSelectedResume] = useState(null);
const [selectedResumePreview, setSelectedResumePreview] = useState("");

// Theme-aware colors
const isDark =
typeof window !== "undefined" &&
window.matchMedia &&
window.matchMedia("(prefers-color-scheme: dark)").matches;
const THEME = isDark
? {
text: "#e5e7eb",
sub: "#cbd5e1",
muted: "#94a3b8",
border: "#334155",
inputBg: "#0b1220",
}
: {
text: "#0f172a",
sub: "#475569",
muted: "#64748b",
border: "#cbd5e1",
inputBg: "#ffffff",
};

useEffect(() => {
(async () => {
try {
const [t, r] = await Promise.all([
api.get(
`/api/v1/templates/public${
category !== "all" ? `?category=${category}` : ""
}`
),
api.get("/api/v1/resumes"),
]);
setTemplates(t.data?.data?.items || []);
setResumes(r.data?.data?.items || []);
} finally {
setLoading(false);
}
})();
}, [category]);

const filtered = useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return templates;
return templates.filter((t) =>
[t.name, t.slug, t.tags?.join(" ")]
.filter(Boolean)
.join(" ")
.toLowerCase()
.includes(q)
);
}, [templates, search]);

const handleDeleteResume = async (resumeId) => {
if (!window.confirm("Are you sure you want to delete this resume?")) return;
setDeleting(resumeId);
try {
await api.delete(`/api/v1/resumes/${resumeId}`);
setResumes((prev) => prev.filter((r) => (r._id || r.id) !== resumeId));
} catch (err) {
alert("Failed to delete resume. Please try again.");
console.error(err);
} finally {
setDeleting(null);
}
};

const handlePreviewResume = async (resumeId) => {
console.log("🔍 handlePreviewResume called with ID:", resumeId);
try {
// Get resume data and preview
const [resumeRes, previewRes] = await Promise.all([
api.get(`/api/v1/resumes/${resumeId}`),
api.get(`/api/v1/resumes/${resumeId}/preview`).catch((err) => {
console.warn(
"Server preview failed, will use client-side fallback:",
err
);
return { data: { html: "" } };
}),
]);

console.log("📄 Resume response:", resumeRes.data);
console.log("🖼️ Preview response:", previewRes.data);

const resumeData = resumeRes.data?.data?.resume || resumeRes.data?.data;
const previewHtml =
previewRes.data?.data?.html || previewRes.data?.html || "";
const template =
templates.find((t) => t.slug === resumeData?.templateSlug) ||
templates[0]; // Fallback to first template if not found

// Store the resume data and preview for the modal
console.log("💾 Setting modal data:", {
resumeData,
previewHtml,
template,
});
setSelectedResume(resumeData);
setSelectedResumePreview(previewHtml);
setSelectedTemplate(template);
setShowPreviewModal(true);
console.log("✅ Modal should be showing now");
} catch (error) {
console.error("Failed to preview resume:", error);
alert(
"Failed to load resume preview. The backend template rendering may have an issue. Please try again or contact support."
);
}
};

const handleSelectTemplate = async (template) => {
if (!template?.slug) {
console.error("No template selected");
return;
}

try {
// Create new resume with selected template
const { data } = await api.post("/api/v1/resumes", {
title: "My Resume",
templateSlug: template.slug,
});

const resumeId = data.data.resumeId;

// Navigate to builder
navigate("/builder", {
state: {
resumeId,
templateSlug: template.slug,
},
});
} catch (error) {
console.error("Failed to create resume:", error);
alert("Failed to create resume. Please try again.");
}
};

const handlePreviewTemplate = (template) => {
setSelectedTemplate(template);
setShowPreviewModal(true);
};

return (
<div>
<Navbar />
{showUpload && (
<ResumeUpload
onClose={() => {
setShowUpload(false);
setUploadTemplateSlug(null);
}}
selectedTemplateSlug={uploadTemplateSlug}
/>
)}
<main style={{ maxWidth: 1200, margin: "0 auto", padding: "16px" }}>
<style>{`#template-search::placeholder{color:${THEME.muted}}`}</style>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
margin: "8px 0 16px",
}}>
<h1 style={{ fontSize: 24, margin: 0 }}>Welcome back</h1>
<button
onClick={() => setShowUpload(true)}
style={{
background: "#2563eb",
color: "#fff",
border: "none",
borderRadius: 10,
padding: "10px 20px",
fontWeight: 600,
cursor: "pointer",
fontSize: 14,
display: "flex",
alignItems: "center",
gap: 8,
}}>
<span style={{ fontSize: 18 }}>📤</span>
Upload Resume
</button>
</div>

<section style={{ marginBottom: 32 }}>
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: 20,
}}>
<div>
<h2
style={{
fontSize: 24,
fontWeight: 700,
margin: 0,
color: THEME.inputBg,
}}>
Professional Templates
</h2>
<p
style={{
fontSize: 14,
color: THEME.inputBg,
margin: "4px 0 0",
}}>
Choose from {templates.length} professionally designed resume
templates
<br />
<span style={{ fontSize: 12, color: THEME.inputBg }}>
Each template has a unique layout optimized for different
industries
</span>
</p>
</div>
<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
<div style={{ position: "relative" }}>
<input
placeholder="Search templates..."
value={search}
onChange={(e) => setSearch(e.target.value)}
style={{
padding: "12px 16px 12px 40px",
border: `1px solid ${THEME.border}`,
borderRadius: 12,
width: 280,
fontSize: 14,
background: THEME.inputBg,
color: THEME.text,
outline: "none",
transition: "all 0.2s",
}}
id="template-search"
onFocus={(e) => {
e.target.style.borderColor = "#2563eb";
e.target.style.boxShadow =
"0 0 0 3px rgba(37, 99, 235, 0.25)";
}}
onBlur={(e) => {
e.target.style.borderColor = THEME.border;
e.target.style.boxShadow = "none";
}}
/>
<span
style={{
position: "absolute",
left: 12,
top: "50%",
transform: "translateY(-50%)",
color: THEME.muted,
fontSize: 16,
}}>
🔍
</span>
</div>
<select
value={category}
onChange={(e) => setCategory(e.target.value)}
style={{
padding: "12px 16px",
border: `1px solid ${THEME.border}`,
borderRadius: 12,
fontSize: 14,
background: THEME.inputBg,
color: THEME.text,
cursor: "pointer",
outline: "none",
minWidth: 120,
}}
id="template-category">
<option value="all">All Templates</option>
<option value="free">Free Templates</option>
<option value="premium">Premium Templates</option>
</select>
</div>
</div>

{/* Template Stats */}
<div
style={{
display: "flex",
gap: 16,
marginBottom: 24,
padding: "16px 20px",
background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
borderRadius: 12,
border: "1px solid #e2e8f0",
}}>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<span style={{ fontSize: 20 }}>📄</span>
<div>
<div
style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
{templates.length} Templates
</div>
<div style={{ fontSize: 12, color: "#64748b" }}>
Total Available
</div>
</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<span style={{ fontSize: 20 }}>🆓</span>
<div>
<div
style={{ fontSize: 14, fontWeight: 600, color: "#059669" }}>
{templates.filter((t) => t.category === "free").length} Free
</div>
<div style={{ fontSize: 12, color: "#64748b" }}>No Cost</div>
</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<span style={{ fontSize: 20 }}>⭐</span>
<div>
<div
style={{ fontSize: 14, fontWeight: 600, color: "#d97706" }}>
{templates.filter((t) => t.category === "premium").length}{" "}
Premium
</div>
<div style={{ fontSize: 12, color: "#64748b" }}>
Advanced Features
</div>
</div>
</div>
</div>

{/* Templates Grid */}
{loading ? (
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
gap: 20,
}}>
{[1, 2, 3, 4, 5, 6].map((i) => (
<div
key={i}
style={{
height: 400,
background: "#f1f5f9",
borderRadius: 16,
animation: "pulse 2s infinite",
}}
/>
))}
</div>
) : filtered.length === 0 ? (
<div
style={{
textAlign: "center",
padding: "60px 20px",
background: "#f8fafc",
borderRadius: 16,
border: "1px solid #e2e8f0",
}}>
<div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
<h3
style={{
fontSize: 18,
fontWeight: 600,
color: "#0f172a",
marginBottom: 8,
}}>
No templates found
</h3>
<p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
Try adjusting your search or filter criteria
</p>
<button
onClick={() => {
setSearch("");
setCategory("all");
}}
style={{
padding: "10px 20px",
background: "#2563eb",
color: "white",
border: "none",
borderRadius: 8,
fontWeight: 600,
cursor: "pointer",
}}>
Clear Filters
</button>
</div>
) : (
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
gap: 20,
}}>
{filtered.map((t) => (
<TemplateCard
key={t.slug}
template={t}
isPremium={t.category === "premium"}
onSelect={handleSelectTemplate}
onPreview={handlePreviewTemplate}
/>
))}
</div>
)}
</section>

{/* Quick Actions */}
<section style={{ marginBottom: 32 }}>
<h2
style={{
fontSize: 20,
fontWeight: 600,
marginBottom: 16,
color: "#0f172a",
}}>
Quick Actions
</h2>
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
gap: 16,
}}>
<div
style={{
background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
border: "1px solid #bae6fd",
borderRadius: 12,
padding: 20,
cursor: "pointer",
transition: "all 0.2s",
}}
onClick={() => setShowUpload(true)}
onMouseEnter={(e) => {
e.currentTarget.style.transform = "translateY(-2px)";
e.currentTarget.style.boxShadow =
"0 8px 25px rgba(14, 165, 233, 0.15)";
}}
onMouseLeave={(e) => {
e.currentTarget.style.transform = "translateY(0)";
e.currentTarget.style.boxShadow = "none";
}}>
<div style={{ fontSize: 24, marginBottom: 8 }}>📤</div>
<h3
style={{
fontSize: 16,
fontWeight: 600,
margin: "0 0 4px",
color: "#0c4a6e",
}}>
Upload Resume
</h3>
<p style={{ fontSize: 13, color: "#0369a1", margin: 0 }}>
Import your existing resume and let AI extract all information
</p>
</div>

<div
style={{
background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
border: "1px solid #bbf7d0",
borderRadius: 12,
padding: 20,
cursor: "pointer",
transition: "all 0.2s",
}}
onClick={() => {
if (templates.length > 0) {
handleSelectTemplate(templates[0]);
}
}}
onMouseEnter={(e) => {
e.currentTarget.style.transform = "translateY(-2px)";
e.currentTarget.style.boxShadow =
"0 8px 25px rgba(34, 197, 94, 0.15)";
}}
onMouseLeave={(e) => {
e.currentTarget.style.transform = "translateY(0)";
e.currentTarget.style.boxShadow = "none";
}}>
<div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
<h3
style={{
fontSize: 16,
fontWeight: 600,
margin: "0 0 4px",
color: "#14532d",
}}>
Start from Scratch
</h3>
<p style={{ fontSize: 13, color: "#166534", margin: 0 }}>
Create a new resume using our professional templates
</p>
</div>

<div
style={{
background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
border: "1px solid #fcd34d",
borderRadius: 12,
padding: 20,
cursor: "pointer",
transition: "all 0.2s",
}}
onClick={() => {
// Scroll to templates section
document
.querySelector('section[style*="marginBottom: 32"]')
?.scrollIntoView({ behavior: "smooth" });
}}
onMouseEnter={(e) => {
e.currentTarget.style.transform = "translateY(-2px)";
e.currentTarget.style.boxShadow =
"0 8px 25px rgba(245, 158, 11, 0.15)";
}}
onMouseLeave={(e) => {
e.currentTarget.style.transform = "translateY(0)";
e.currentTarget.style.boxShadow = "none";
}}>
<div style={{ fontSize: 24, marginBottom: 8 }}>🎨</div>
<h3
style={{
fontSize: 16,
fontWeight: 600,
margin: "0 0 4px",
color: "#92400e",
}}>
Browse Templates
</h3>
<p style={{ fontSize: 13, color: "#b45309", margin: 0 }}>
Explore all available templates and find your perfect design
</p>
</div>
</div>
</section>

<section>
<h2
style={{
fontSize: 20,
fontWeight: 600,
marginBottom: 16,
color: "#0f172a",
}}>
Your Resumes
</h2>
{resumes.length === 0 ? (
<div
style={{
textAlign: "center",
padding: "60px 20px",
background: "#f8fafc",
borderRadius: 16,
border: "1px solid #e2e8f0",
}}>
<div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
<h3
style={{
fontSize: 18,
fontWeight: 600,
color: "#0f172a",
marginBottom: 8,
}}>
No resumes yet
</h3>
<p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
Create your first professional resume using our templates
</p>
<button
onClick={() => {
if (templates.length > 0) {
handleSelectTemplate(templates[0]);
}
}}
style={{
padding: "12px 24px",
background: "#2563eb",
color: "white",
border: "none",
borderRadius: 10,
fontWeight: 600,
cursor: "pointer",
fontSize: 14,
}}>
Create Your First Resume
</button>
</div>
) : (
<div
style={{
display: "grid",
gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
gap: 20,
}}>
{resumes.map((r, idx) => {
const template = templates.find(
(t) => t.slug === r.templateSlug
);
const templateName =
template?.name || r.templateSlug || "Unknown";
const templateColor = template?.ui?.accentColor || "#2563eb";
const lastUpdated = r.updatedAt
? new Date(r.updatedAt).toLocaleDateString()
: "";
const isPremium = template?.category === "premium";

return (
<div
key={r._id || r.id || idx}
style={{
border: `2px solid ${templateColor}20`,
borderRadius: 16,
background: "#fff",
overflow: "hidden",
transition: "all 0.3s ease",
cursor: "pointer",
}}
onMouseEnter={(e) => {
e.currentTarget.style.transform = "translateY(-4px)";
e.currentTarget.style.boxShadow = `0 12px 24px ${templateColor}20`;
}}
onMouseLeave={(e) => {
e.currentTarget.style.transform = "translateY(0)";
e.currentTarget.style.boxShadow = "none";
}}>
{/* Template Preview Header */}
<div
style={{
height: "8px",
background: `linear-gradient(90deg, ${templateColor}, ${templateColor}80)`,
}}
/>

<div style={{ padding: 20 }}>
<div
style={{
display: "flex",
alignItems: "center",
gap: 8,
marginBottom: 12,
}}>
<div
style={{
width: 40,
height: 40,
background: `${templateColor}15`,
borderRadius: 10,
display: "flex",
alignItems: "center",
justifyContent: "center",
fontSize: 18,
}}>
📄
</div>
<div style={{ flex: 1 }}>
<div
style={{
fontWeight: 600,
fontSize: 16,
color: "#0f172a",
}}>
{r.title || "Untitled Resume"}
</div>
<div style={{ fontSize: 12, color: "#64748b" }}>
{templateName} {isPremium && "⭐"}
</div>
</div>
</div>

{lastUpdated && (
<div
style={{
fontSize: 12,
color: "#94a3b8",
marginBottom: 16,
display: "flex",
alignItems: "center",
gap: 4,
}}>
<span>🕒</span>
Last updated: {lastUpdated}
</div>
)}

<div style={{ display: "flex", gap: 8 }}>
<button
onClick={() =>
navigate("/builder", {
state: { resumeId: r._id || r.id },
})
}
style={{
flex: 1,
padding: "10px 16px",
borderRadius: 10,
background: templateColor,
color: "white",
border: "none",
fontWeight: 600,
cursor: "pointer",
fontSize: 14,
display: "flex",
alignItems: "center",
justifyContent: "center",
gap: 6,
}}>
<span>✏️</span>
Edit
</button>
<button
onClick={() => {
console.log(
"👁️ Eye button clicked for resume:",
r._id || r.id
);
handlePreviewResume(r._id || r.id);
}}
style={{
padding: "10px 12px",
borderRadius: 10,
background: "#059669",
color: "white",
border: "none",
cursor: "pointer",
fontSize: 14,
display: "flex",
alignItems: "center",
justifyContent: "center",
}}>
👁️
</button>
<button
onClick={() => handleDeleteResume(r._id || r.id)}
disabled={deleting === (r._id || r.id)}
style={{
padding: "10px 12px",
borderRadius: 10,
background: "#fff",
color: "#dc2626",
border: "1px solid #fca5a5",
cursor:
deleting === (r._id || r.id)
? "not-allowed"
: "pointer",
opacity: deleting === (r._id || r.id) ? 0.6 : 1,
fontSize: 14,
}}>
{deleting === (r._id || r.id) ? "⏳" : "🗑️"}
</button>
</div>
</div>
</div>
);
})}
</div>
)}
</section>
</main>
<Footer />

{/* Preview Modal */}
{showPreviewModal && (selectedTemplate || selectedResume) && (
<TemplatePreviewModal
template={selectedTemplate}
resume={selectedResume}
resumePreview={selectedResumePreview}
onClose={() => {
setShowPreviewModal(false);
setSelectedTemplate(null);
setSelectedResume(null);
setSelectedResumePreview("");
}}
onSelect={handleSelectTemplate}
/>
)}
</div>
);
}

// Preview Modal Component
function TemplatePreviewModal({
template,
resume,
resumePreview,
onClose,
onSelect,
}) {
const [previewHtml, setPreviewHtml] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
async function createPreview() {
try {
setLoading(true);

// If we have a resume preview, use it directly
if (resumePreview && resume) {
console.log("🎯 Using resume preview directly:", {
resumePreview: resumePreview.substring(0, 100) + "...",
resume,
});
setPreviewHtml(resumePreview);
setLoading(false);
return;
}

// Create temporary resume for preview
if (!template?.slug) {
console.error("No template available for preview");
setPreviewHtml("<div>No template available for preview</div>");
setLoading(false);
return;
}

const { data } = await api.post("/api/v1/resumes", {
title: "Preview",
templateSlug: template.slug,
});

const tempResumeId = data.data.resumeId;

// Add sample data
await api.patch(`/api/v1/resumes/${tempResumeId}`, {
contact: {
fullName: "John Doe",
email: "john.doe@example.com",
phone: "+1 (555) 123-4567",
address: "San Francisco, CA",
website: "johndoe.com",
headline: "Senior Software Engineer",
summary:
"Experienced software engineer with 8+ years of expertise in full-stack development, team leadership, and scalable system architecture.",
},
experience: [
{
title: "Senior Software Engineer",
company: "Tech Corp",
location: "San Francisco, CA",
startDate: "2020-01-01",
current: true,
bullets: [
"Led development of microservices architecture serving 1M+ users",
"Mentored team of 5 junior developers and improved code quality by 40%",
"Implemented CI/CD pipeline reducing deployment time by 60%",
"Collaborated with product team to deliver features on time and within budget",
],
},
{
title: "Software Engineer",
company: "StartupXYZ",
location: "New York, NY",
startDate: "2018-06-01",
endDate: "2019-12-31",
bullets: [
"Developed React-based frontend applications with 99.9% uptime",
"Built RESTful APIs using Node.js and PostgreSQL",
"Participated in agile development process and code reviews",
],
},
],
education: [
{
degree: "Bachelor of Science in Computer Science",
school: "University of California, Berkeley",
location: "Berkeley, CA",
startDate: "2013-09-01",
endDate: "2017-05-31",
details: [
"GPA: 3.8/4.0",
"Dean's List",
"Relevant Coursework: Data Structures, Algorithms, Software Engineering",
],
},
],
skills: [
{ name: "JavaScript", level: 90 },
{ name: "React", level: 85 },
{ name: "Node.js", level: 85 },
{ name: "Python", level: 80 },
{ name: "PostgreSQL", level: 75 },
{ name: "AWS", level: 70 },
],
});

// Get preview HTML
const previewRes = await api.get(
`/api/v1/resumes/${tempResumeId}/preview`
);
setPreviewHtml(
previewRes.data.data?.html || previewRes.data.html || ""
);

// Clean up temporary resume
await api.delete(`/api/v1/resumes/${tempResumeId}`);
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
top: 0,
left: 0,
right: 0,
bottom: 0,
background: "rgba(0, 0, 0, 0.5)",
display: "flex",
alignItems: "center",
justifyContent: "center",
zIndex: 1000,
padding: "20px",
}}
onClick={onClose}>
<div
style={{
background: "white",
borderRadius: "12px",
width: "90vw",
maxWidth: "1200px",
maxHeight: "90vh",
display: "flex",
flexDirection: "column",
overflow: "hidden",
}}
onClick={(e) => e.stopPropagation()}>
{/* Modal Header */}
<div
style={{
padding: "20px",
borderBottom: "1px solid #e5e7eb",
display: "flex",
justifyContent: "space-between",
alignItems: "center",
}}>
<h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
{resume
? `${resume.title || "Resume"} Preview`
: `${template?.name || "Template"} Preview`}
</h2>
<button
onClick={onClose}
style={{
background: "none",
border: "none",
fontSize: "24px",
cursor: "pointer",
color: "#6b7280",
padding: "4px",
}}>
×
</button>
</div>

{/* Modal Body */}
<div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
{loading ? (
<div style={{ textAlign: "center", padding: "40px" }}>
<div>Loading preview...</div>
</div>
) : (
<iframe
srcDoc={previewHtml}
style={{
width: "100%",
height: "600px",
border: "none",
borderRadius: "8px",
}}
sandbox="allow-same-origin"
/>
)}
</div>

{/* Modal Footer */}
<div
style={{
padding: "20px",
borderTop: "1px solid #e5e7eb",
display: "flex",
gap: "12px",
justifyContent: "flex-end",
}}>
<button
onClick={onClose}
style={{
padding: "10px 20px",
borderRadius: "8px",
border: "1px solid #d1d5db",
background: "white",
color: "#374151",
fontWeight: "600",
cursor: "pointer",
}}>
Cancel
</button>
<button
onClick={() => onSelect(template)}
style={{
padding: "10px 20px",
borderRadius: "8px",
border: "none",
background: template?.ui?.accentColor || "#2563eb",
color: "white",
fontWeight: "600",
cursor: "pointer",
}}>
Use This Template
</button>
</div>
</div>
</div>
);
}
