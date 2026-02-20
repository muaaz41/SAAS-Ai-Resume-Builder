// import React, { useState } from "react";
// import { api } from "../lib/api.js";
// import { showToast } from "../lib/toast.js";
// import { Upload, FilePdf, X, CircleNotch } from "@phosphor-icons/react";
// import TemplateMapper from "./TemplateMapper.jsx";

// const THEME = {
//   bg: "#f8fafc",
//   surface: "#ffffff",
//   text: "#0f172a",
//   textMuted: "#64748b",
//   border: "#e2e8f0",
//   primary: "#2563eb",
//   success: "#10b981",
//   warning: "#f59e0b",
//   danger: "#ef4444",
// };

// export default function TemplateUpload({ onClose, onSuccess }) {
//   const [file, setFile] = useState(null);
//   const [dragActive, setDragActive] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const [htmlContent, setHtmlContent] = useState(null);
//   const [cssContent, setCssContent] = useState(null);
//   const [pdfPreview, setPdfPreview] = useState(null);
//   const [templateData, setTemplateData] = useState(null);
//   const [showAddChoice, setShowAddChoice] = useState(false);
//   const [showMapper, setShowMapper] = useState(false);
//   const [formData, setFormData] = useState({
//     name: "",
//     category: "free",
//     tags: "",
//     useAI: true,
//     useImageAI: false,
//   });

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);

//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       const droppedFile = e.dataTransfer.files[0];
//       if (droppedFile.type === "application/pdf") {
//         setFile(droppedFile);
//       } else {
//         showToast("Please upload a PDF file", { type: "error" });
//       }
//     }
//   };

//   const handleFileChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       const selectedFile = e.target.files[0];
//       if (selectedFile.type === "application/pdf") {
//         setFile(selectedFile);
//       } else {
//         showToast("Please upload a PDF file", { type: "error" });
//       }
//     }
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       showToast("Please select a PDF file", { type: "error" });
//       return;
//     }

//     if (!formData.name.trim()) {
//       showToast("Please enter a template name", { type: "error" });
//       return;
//     }

//     setUploading(true);
//     setProcessing(true);

//     try {
//       const formDataToSend = new FormData();
//       formDataToSend.append("file", file);
//       formDataToSend.append("name", formData.name);
//       formDataToSend.append("category", formData.category);
//       if (formData.tags) {
//         formDataToSend.append("tags", formData.tags);
//       }
//       if (formData.useAI) {
//         formDataToSend.append("useAI", "true");
//       }
//       if (formData.useImageAI) {
//         formDataToSend.append("useImageAI", "true");
//       }

//       const response = await api.post("/api/v1/admin/templates/upload", formDataToSend, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       const { html, css, slug, pdfData, pdfPreview, defaultMapping } = response.data.data;

//       setHtmlContent(html);
//       setCssContent(css);
//       setPdfPreview(pdfPreview);
//       setTemplateData({ slug, pdfData, defaultMapping });
//       setShowAddChoice(true);
//       setProcessing(false);

//       showToast("PDF processed. Add template now or customize field mapping.", { type: "success" });
//     } catch (error) {
//       console.error("Upload error:", error);
//       const errorMsg = error.response?.data?.message || "Failed to process PDF";
//       showToast(errorMsg, { type: "error" });
//       setProcessing(false);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleMappingComplete = async (mapping) => {
//     setProcessing(true);

//     try {
//       const response = await api.post("/api/v1/admin/templates/save", {
//         slug: templateData.slug,
//         name: formData.name,
//         html: htmlContent,
//         css: cssContent,
//         mapping,
//         category: formData.category,
//         tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t),
//       });

//       showToast("Template created successfully!", { type: "success" });
      
//       if (onSuccess) {
//         onSuccess(response.data.data.template);
//       }
      
//       if (onClose) {
//         onClose();
//       }
//     } catch (error) {
//       console.error("Save error:", error);
//       const errorMsg = error.response?.data?.message || "Failed to save template";
//       showToast(errorMsg, { type: "error" });
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // Add template now (no manual mapping) using default mapping
//   const handleAddTemplateNow = () => {
//     const mapping = templateData?.defaultMapping;
//     if (!mapping) {
//       showToast("No default mapping available. Use Customize mapping instead.", { type: "error" });
//       return;
//     }
//     handleMappingComplete(mapping);
//     setShowAddChoice(false);
//   };

//   // Post-upload choice: Add now (auto) or Customize mapping
//   if (showAddChoice && htmlContent && cssContent && pdfPreview) {
//     return (
//       <div
//         style={{
//           position: "fixed",
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           background: "rgba(0,0,0,0.5)",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           zIndex: 9999,
//           padding: "16px",
//         }}
//       >
//         <div
//           style={{
//             background: THEME.surface,
//             borderRadius: "16px",
//             maxWidth: "900px",
//             width: "100%",
//             maxHeight: "90vh",
//             overflow: "hidden",
//             display: "flex",
//             flexDirection: "column",
//             boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
//           }}
//         >
//           <div
//             style={{
//               padding: "16px 20px",
//               borderBottom: `1px solid ${THEME.border}`,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: THEME.text }}>
//               Template ready — add to templates
//             </h2>
//             <button
//               onClick={() => {
//                 setShowAddChoice(false);
//                 setHtmlContent(null);
//                 setCssContent(null);
//                 setPdfPreview(null);
//                 setTemplateData(null);
//                 onClose?.();
//               }}
//               style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}
//             >
//               <X size={24} color={THEME.textMuted} />
//             </button>
//           </div>
//           <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", gap: "24px", alignItems: "flex-start" }}>
//             <div
//               style={{
//                 flex: 1,
//                 minWidth: 0,
//                 border: `1px solid ${THEME.border}`,
//                 borderRadius: "12px",
//                 overflow: "hidden",
//                 background: "#f3f4f6",
//               }}
//             >
//               <div style={{ padding: "8px", background: THEME.surface, borderBottom: `1px solid ${THEME.border}` }}>
//                 <span style={{ fontSize: "13px", color: THEME.textMuted }}>Preview</span>
//               </div>
//               <div style={{ aspectRatio: "612/792", maxHeight: "70vh", display: "flex" }}>
//                 <embed
//                   src={pdfPreview}
//                   type="application/pdf"
//                   style={{ width: "100%", height: "100%" }}
//                   title="PDF Preview"
//                 />
//               </div>
//             </div>
//             <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "12px" }}>
//               <p style={{ margin: 0, fontSize: "14px", color: THEME.textMuted }}>
//                 The template has been converted to HTML/CSS. You can add it as-is (fields are auto-mapped) or customize mapping.
//               </p>
//               <button
//                 onClick={handleAddTemplateNow}
//                 disabled={processing}
//                 style={{
//                   width: "100%",
//                   padding: "14px 20px",
//                   background: THEME.primary,
//                   color: "white",
//                   border: "none",
//                   borderRadius: "10px",
//                   fontSize: "15px",
//                   fontWeight: 600,
//                   cursor: processing ? "not-allowed" : "pointer",
//                 }}
//               >
//                 {processing ? "Adding…" : "Add to templates"}
//               </button>
//               <button
//                 onClick={() => {
//                   setShowAddChoice(false);
//                   setShowMapper(true);
//                 }}
//                 style={{
//                   width: "100%",
//                   padding: "14px 20px",
//                   background: THEME.surface,
//                   color: THEME.primary,
//                   border: `2px solid ${THEME.primary}`,
//                   borderRadius: "10px",
//                   fontSize: "15px",
//                   fontWeight: 600,
//                   cursor: "pointer",
//                 }}
//               >
//                 Customize field mapping
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (showMapper && htmlContent && cssContent) {
//     return (
//       <TemplateMapper
//         htmlContent={htmlContent}
//         cssContent={cssContent}
//         pdfPreview={pdfPreview}
//         pdfData={templateData?.pdfData}
//         initialMapping={templateData?.defaultMapping}
//         onComplete={(mapping) => {
//           handleMappingComplete(mapping);
//           setShowMapper(false);
//         }}
//         onCancel={() => {
//           setShowMapper(false);
//           setShowAddChoice(true);
//         }}
//       />
//     );
//   }

//   return (
//     <div
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         background: "rgba(0,0,0,0.5)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 9999,
//         padding: "16px",
//       }}
//     >
//       <div
//         style={{
//           background: THEME.surface,
//           borderRadius: "16px",
//           maxWidth: "600px",
//           width: "100%",
//           maxHeight: "90vh",
//           overflow: "auto",
//           boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
//         }}
//       >
//         {/* Header */}
//         <div
//           style={{
//             padding: "20px 24px",
//             borderBottom: `1px solid ${THEME.border}`,
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}
//         >
//           <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: THEME.text }}>
//             Upload Template PDF
//           </h2>
//           <button
//             onClick={onClose}
//             style={{
//               background: "none",
//               border: "none",
//               cursor: "pointer",
//               padding: "8px",
//               borderRadius: "8px",
//             }}
//           >
//             <X size={24} color={THEME.textMuted} />
//           </button>
//         </div>

//         {/* Content */}
//         <div style={{ padding: "24px" }}>
//           {/* File Upload */}
//           <div
//             onDragEnter={handleDrag}
//             onDragLeave={handleDrag}
//             onDragOver={handleDrag}
//             onDrop={handleDrop}
//             style={{
//               border: `2px dashed ${dragActive ? THEME.primary : THEME.border}`,
//               borderRadius: "12px",
//               padding: "40px",
//               textAlign: "center",
//               background: dragActive ? THEME.primary + "10" : THEME.bg,
//               cursor: "pointer",
//               marginBottom: "24px",
//               transition: "all 0.2s",
//             }}
//             onClick={() => document.getElementById("file-input")?.click()}
//           >
//             <FilePdf size={48} color={THEME.primary} style={{ marginBottom: "16px" }} />
//             <p style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600, color: THEME.text }}>
//               {file ? file.name : "Drop PDF here or click to browse"}
//             </p>
//             <p style={{ margin: 0, fontSize: "14px", color: THEME.textMuted }}>
//               PDF files only, max 10MB
//             </p>
//             <input
//               id="file-input"
//               type="file"
//               accept=".pdf"
//               onChange={handleFileChange}
//               style={{ display: "none" }}
//             />
//           </div>

//           {/* Form Fields */}
//           <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//             <div>
//               <label
//                 style={{
//                   display: "block",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   color: THEME.text,
//                   marginBottom: "8px",
//                 }}
//               >
//                 Template Name *
//               </label>
//               <input
//                 type="text"
//                 value={formData.name}
//                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                 placeholder="e.g., Modern Blue"
//                 style={{
//                   width: "100%",
//                   padding: "12px",
//                   border: `1px solid ${THEME.border}`,
//                   borderRadius: "8px",
//                   fontSize: "14px",
//                 }}
//               />
//             </div>

//             <div>
//               <label
//                 style={{
//                   display: "block",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   color: THEME.text,
//                   marginBottom: "8px",
//                 }}
//               >
//                 Category
//               </label>
//               <select
//                 value={formData.category}
//                 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//                 style={{
//                   width: "100%",
//                   padding: "12px",
//                   border: `1px solid ${THEME.border}`,
//                   borderRadius: "8px",
//                   fontSize: "14px",
//                   background: THEME.surface,
//                 }}
//               >
//                 <option value="free">Free</option>
//                 <option value="premium">Premium</option>
//                 <option value="industry">Industry</option>
//               </select>
//             </div>

//             <div>
//               <label
//                 style={{
//                   display: "block",
//                   fontSize: "14px",
//                   fontWeight: 500,
//                   color: THEME.text,
//                   marginBottom: "8px",
//                 }}
//               >
//                 Tags (comma-separated)
//               </label>
//               <input
//                 type="text"
//                 value={formData.tags}
//                 onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
//                 placeholder="e.g., modern, professional, blue"
//                 style={{
//                   width: "100%",
//                   padding: "12px",
//                   border: `1px solid ${THEME.border}`,
//                   borderRadius: "8px",
//                   fontSize: "14px",
//                 }}
//               />
//             </div>

//             <label
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "10px",
//                 cursor: "pointer",
//                 fontSize: "14px",
//                 color: THEME.text,
//               }}
//             >
//               <input
//                 type="checkbox"
//                 checked={formData.useAI}
//                 onChange={(e) => setFormData({ ...formData, useAI: e.target.checked })}
//                 style={{ width: "18px", height: "18px", accentColor: THEME.primary }}
//               />
//               Use AI to convert (better structure & mapping)
//             </label>
//             {formData.useAI && (
//               <label
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "10px",
//                   cursor: "pointer",
//                   fontSize: "14px",
//                   color: THEME.text,
//                   marginLeft: "28px",
//                 }}
//               >
//                 <input
//                   type="checkbox"
//                   checked={formData.useImageAI}
//                   onChange={(e) => setFormData({ ...formData, useImageAI: e.target.checked })}
//                   style={{ width: "18px", height: "18px", accentColor: THEME.primary }}
//                 />
//                 Image-based AI (PDF → image → vision → HTML/CSS + mapping)
//               </label>
//             )}
//           </div>

//           {/* Actions */}
//           <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
//             <button
//               onClick={onClose}
//               style={{
//                 flex: 1,
//                 padding: "12px",
//                 background: THEME.surface,
//                 color: THEME.text,
//                 border: `1px solid ${THEME.border}`,
//                 borderRadius: "8px",
//                 fontSize: "14px",
//                 fontWeight: 500,
//                 cursor: "pointer",
//               }}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleUpload}
//               disabled={!file || !formData.name.trim() || uploading || processing}
//               style={{
//                 flex: 1,
//                 padding: "12px",
//                 background: (!file || !formData.name.trim() || uploading || processing)
//                   ? THEME.textMuted
//                   : THEME.primary,
//                 color: "white",
//                 border: "none",
//                 borderRadius: "8px",
//                 fontSize: "14px",
//                 fontWeight: 600,
//                 cursor: (!file || !formData.name.trim() || uploading || processing)
//                   ? "not-allowed"
//                   : "pointer",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 gap: "8px",
//               }}
//             >
//               {uploading || processing ? (
//                 <>
//                   <CircleNotch size={20} className="spin" />
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   <Upload size={20} />
//                   Upload & Process
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//         .spin {
//           animation: spin 1s linear infinite;
//         }
//       `}</style>
//     </div>
//   );
// }
