// import React, { useState, useRef, useEffect } from "react";
// import { api } from "../lib/api.js";
// import { showToast } from "../lib/toast.js";
// import { X, Check } from "@phosphor-icons/react";

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

// const emptyMapping = {
//   contact: {},
//   experience: {},
//   education: {},
//   skills: {},
//   projects: {},
//   hobbies: {},
//   awards: {},
// };

// export default function TemplateMapper({ htmlContent, cssContent, pdfPreview, pdfData, initialMapping, onComplete, onCancel }) {
//   const textBlocks = pdfData?.textBlocks ?? [];
//   const pageWidth = pdfData?.pageWidth ?? 612;
//   const pageHeight = pdfData?.pageHeight ?? 792;

//   const [mapping, setMapping] = useState(() => {
//     if (initialMapping && typeof initialMapping === "object") {
//       return {
//         contact: { ...emptyMapping.contact, ...initialMapping.contact },
//         experience: { ...emptyMapping.experience, ...initialMapping.experience },
//         education: { ...emptyMapping.education, ...initialMapping.education },
//         skills: { ...emptyMapping.skills, ...initialMapping.skills },
//         projects: { ...emptyMapping.projects, ...initialMapping.projects },
//         hobbies: { ...emptyMapping.hobbies, ...initialMapping.hobbies },
//         awards: { ...emptyMapping.awards, ...initialMapping.awards },
//       };
//     }
//     return { ...emptyMapping };
//   });
//   const [selectionMode, setSelectionMode] = useState(false);
//   const [currentField, setCurrentField] = useState(null);
//   const [highlightedElement, setHighlightedElement] = useState(null);
//   const [previewMode, setPreviewMode] = useState("pdf"); // "pdf" or "html"
//   const previewRef = useRef(null);

//   // Inject CSS into the preview container
//   useEffect(() => {
//     if (previewRef.current && cssContent) {
//       // Remove existing style tag if any
//       const existingStyle = previewRef.current.querySelector("style.template-mapper-css");
//       if (existingStyle) {
//         existingStyle.remove();
//       }
      
//       // Add new style tag
//       const style = document.createElement("style");
//       style.className = "template-mapper-css";
//       style.textContent = cssContent;
//       document.head.appendChild(style);
      
//       return () => {
//         // Cleanup on unmount
//         const styleToRemove = document.querySelector("style.template-mapper-css");
//         if (styleToRemove) {
//           styleToRemove.remove();
//         }
//       };
//     }
//   }, [cssContent]);

//   // Enable element selection
//   const enableSelection = (fieldPath) => {
//     setSelectionMode(true);
//     setCurrentField(fieldPath);
//     const isPdfMode = previewMode === "pdf" && pdfPreview && textBlocks.length > 0;
//     showToast(
//       isPdfMode
//         ? `Click on the PDF preview where "${getFieldLabel(fieldPath)}" appears`
//         : `Click on the element in the preview that represents "${getFieldLabel(fieldPath)}"`,
//       { type: "info" }
//     );
//   };

//   // Handle click on PDF overlay (click-to-map on PDF preview)
//   const handlePdfOverlayClick = (e) => {
//     if (!selectionMode || !currentField) return;
//     const blockIndex = e.target?.dataset?.blockIndex;
//     if (blockIndex == null) return;
//     e.preventDefault();
//     e.stopPropagation();
//     const label = getFieldLabel(currentField);
//     const selector = `[data-block-index="${blockIndex}"]`;
//     updateMapping(currentField, selector);
//     setSelectionMode(false);
//     setCurrentField(null);
//     showToast(`Mapped "${label}" successfully`, { type: "success" });
//     setHighlightedElement(selector);
//   };

//   // Handle element click in preview
//   const handleElementClick = (event) => {
//     if (!selectionMode || !currentField) return;

//     event.preventDefault();
//     event.stopPropagation();

//     const element = event.target;
//     const selector = generateSelector(element);

//     // Save mapping
//     updateMapping(currentField, selector);

//     // Highlight selected element
//     highlightElement(element, selector);

//     // Disable selection mode
//     setSelectionMode(false);
//     setCurrentField(null);
//     showToast(`Mapped "${getFieldLabel(currentField)}" successfully`, { type: "success" });
//   };

//   // Generate CSS selector for element
//   const generateSelector = (element) => {
//     if (!element) return null;

//     // Try ID first
//     if (element.id) {
//       return `#${element.id}`;
//     }

//     // Try unique class combination
//     if (element.className && typeof element.className === "string") {
//       const classes = element.className
//         .split(" ")
//         .filter((c) => c && !c.startsWith("mapped-"));
//       if (classes.length > 0) {
//         const classSelector = "." + classes.join(".");
//         try {
//           const matches = element.ownerDocument?.querySelectorAll(classSelector);
//           if (matches && matches.length === 1) {
//             return classSelector;
//           }
//         } catch (e) {
//           // Invalid selector, continue
//         }
//       }
//     }

//     // Use tag + class
//     const tag = element.tagName?.toLowerCase();
//     if (tag && element.className && typeof element.className === "string") {
//       const firstClass = element.className.split(" ")[0];
//       if (firstClass) {
//         return `${tag}.${firstClass}`;
//       }
//     }

//     // Use path-based selector
//     return generatePathSelector(element);
//   };

//   // Generate path-based selector
//   const generatePathSelector = (element) => {
//     const path = [];
//     let current = element;

//     while (current && current.nodeType === Node.ELEMENT_NODE) {
//       let selector = current.nodeName.toLowerCase();

//       if (current.id) {
//         selector += `#${current.id}`;
//         path.unshift(selector);
//         break;
//       } else {
//         // Count siblings of same type
//         let sibling = current;
//         let nth = 1;
//         while (sibling.previousElementSibling) {
//           sibling = sibling.previousElementSibling;
//           if (sibling.nodeName === current.nodeName) {
//             nth++;
//           }
//         }
//         if (nth !== 1) {
//           selector += `:nth-of-type(${nth})`;
//         }
//         path.unshift(selector);
//         current = current.parentElement;
//       }
//     }

//     return path.join(" > ");
//   };

//   // Update mapping state
//   const updateMapping = (fieldPath, selector) => {
//     const [section, ...fieldParts] = fieldPath.split(".");
//     const field = fieldParts.join(".");

//     setMapping((prev) => ({
//       ...prev,
//       [section]: {
//         ...prev[section],
//         [field]: selector,
//       },
//     }));
//   };

//   // Highlight element
//   const highlightElement = (element, selector) => {
//     if (!element) return;

//     // Remove previous highlights
//     const prevHighlighted = document.querySelector(".mapped-highlight");
//     if (prevHighlighted) {
//       prevHighlighted.classList.remove("mapped-highlight");
//     }

//     // Add highlight class
//     element.classList.add("mapped-highlight");
//     setHighlightedElement(element);

//     // Scroll into view
//     element.scrollIntoView({ behavior: "smooth", block: "center" });
//   };

//   // Get field label for display
//   const getFieldLabel = (fieldPath) => {
//     const labels = {
//       "contact.fullName": "Full Name",
//       "contact.email": "Email",
//       "contact.phone": "Phone",
//       "contact.location": "Location",
//       "contact.address": "Address",
//       "contact.website": "Website",
//       "contact.github": "GitHub",
//       "contact.linkedin": "LinkedIn",
//       "contact.portfolioLink": "Portfolio Link",
//       "contact.headline": "Headline",
//       "contact.summary": "Summary",
//       "contact.professionalSummary": "Professional Summary",
//       "experience.container": "Experience Container",
//       "experience.item": "Experience Item",
//       "experience.title": "Job Title",
//       "experience.company": "Company",
//       "experience.location": "Job Location",
//       "experience.dateRange": "Date Range",
//       "experience.bullets": "Bullets List",
//       "education.container": "Education Container",
//       "education.item": "Education Item",
//       "education.degree": "Degree",
//       "education.school": "School",
//       "education.location": "Education Location",
//       "education.dateRange": "Date Range",
//       "education.gpa": "GPA",
//       "education.details": "Education Details",
//       "skills.container": "Skills Container",
//       "skills.item": "Skill Item",
//       "skills.name": "Skill Name",
//       "projects.container": "Projects Container",
//       "projects.item": "Project Item",
//       "projects.name": "Project Name",
//       "projects.description": "Project Description",
//       "projects.link": "Project Link",
//       "hobbies.container": "Hobbies Container",
//       "hobbies.item": "Hobby Item",
//       "hobbies.name": "Hobby Name",
//       "hobbies.description": "Hobby Description",
//       "awards.container": "Awards Container",
//       "awards.item": "Award Item",
//       "awards.title": "Award Title",
//       "awards.description": "Award Description",
//       "awards.issuer": "Issuer",
//       "awards.date": "Award Date",
//     };
//     return labels[fieldPath] || fieldPath;
//   };

//   // Validate mapping
//   const validateMapping = () => {
//     const errors = [];

//     // Check required fields
//     if (!mapping.contact.fullName) {
//       errors.push("Full Name is required");
//     }
//     if (!mapping.experience.container) {
//       errors.push("Experience Container is required");
//     }
//     if (!mapping.experience.item) {
//       errors.push("Experience Item is required");
//     }

//     return errors;
//   };

//   // Save mapping and generate template
//   const handleSave = async () => {
//     const errors = validateMapping();
//     if (errors.length > 0) {
//       showToast(`Please map required fields: ${errors.join(", ")}`, { type: "error" });
//       return;
//     }

//     if (onComplete) {
//       onComplete(mapping);
//     }
//   };

//   // Get mapping value
//   const getMappingValue = (fieldPath) => {
//     const [section, ...fieldParts] = fieldPath.split(".");
//     const field = fieldParts.join(".");
//     return mapping[section]?.[field];
//   };

//   return (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%", background: THEME.bg }}>
//       {/* Header */}
//       <div
//         style={{
//           padding: "20px 24px",
//           borderBottom: `1px solid ${THEME.border}`,
//           background: THEME.surface,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <div>
//           <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: THEME.text }}>
//             Map Template Fields
//           </h2>
//           <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: THEME.textMuted }}>
//             Click "Map" next to each field, then click the corresponding element in the preview
//           </p>
//         </div>
//         <button
//           onClick={onCancel}
//           style={{
//             background: "none",
//             border: "none",
//             cursor: "pointer",
//             padding: "8px",
//             borderRadius: "8px",
//             display: "flex",
//             alignItems: "center",
//           }}
//         >
//           <X size={24} color={THEME.textMuted} />
//         </button>
//       </div>

//       {/* Main Content */}
//       <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
//         {/* Left: Preview */}
//         <div
//           style={{
//             flex: 1,
//             display: "flex",
//             flexDirection: "column",
//             borderRight: `1px solid ${THEME.border}`,
//             background: THEME.surface,
//           }}
//         >
//           {/* Tabs for PDF Preview vs HTML Preview */}
//           <div
//             style={{
//               padding: "16px",
//               borderBottom: `1px solid ${THEME.border}`,
//               background: selectionMode ? THEME.warning + "20" : THEME.surface,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             <div style={{ display: "flex", gap: "8px" }}>
//               <button
//                 onClick={() => setPreviewMode("pdf")}
//                 style={{
//                   padding: "6px 12px",
//                   background: previewMode === "pdf" ? THEME.primary : "transparent",
//                   color: previewMode === "pdf" ? "white" : THEME.text,
//                   border: `1px solid ${previewMode === "pdf" ? THEME.primary : THEME.border}`,
//                   borderRadius: "6px",
//                   fontSize: "13px",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                 }}
//               >
//                 PDF Preview
//               </button>
//               <button
//                 onClick={() => setPreviewMode("html")}
//                 style={{
//                   padding: "6px 12px",
//                   background: previewMode === "html" ? THEME.primary : "transparent",
//                   color: previewMode === "html" ? "white" : THEME.text,
//                   border: `1px solid ${previewMode === "html" ? THEME.primary : THEME.border}`,
//                   borderRadius: "6px",
//                   fontSize: "13px",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                 }}
//               >
//                 HTML Preview (for mapping)
//               </button>
//             </div>
//             {selectionMode && (
//               <div
//                 style={{
//                   padding: "8px 12px",
//                   background: THEME.warning + "20",
//                   borderRadius: "8px",
//                   fontSize: "14px",
//                   color: THEME.warning,
//                   fontWeight: 500,
//                 }}
//               >
//                 {previewMode === "pdf"
//                   ? `Click the region for: ${getFieldLabel(currentField)}`
//                   : `Click on: ${getFieldLabel(currentField)}`}
//               </div>
//             )}
//           </div>
          
//           {/* PDF Preview with click-to-map overlay */}
//           {previewMode === "pdf" && pdfPreview && (
//             <div
//               style={{
//                 flex: 1,
//                 overflow: "auto",
//                 padding: "20px",
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "flex-start",
//                 background: "#f3f4f6",
//               }}
//             >
//               <div
//                 style={{
//                   position: "relative",
//                   width: "100%",
//                   maxWidth: "800px",
//                   aspectRatio: `${pageWidth} / ${pageHeight}`,
//                   maxHeight: "100%",
//                   minHeight: "500px",
//                   border: `1px solid ${THEME.border}`,
//                   borderRadius: "8px",
//                   background: "white",
//                   overflow: "hidden",
//                 }}
//               >
//                 <embed
//                   src={pdfPreview}
//                   type="application/pdf"
//                   style={{
//                     position: "absolute",
//                     inset: 0,
//                     width: "100%",
//                     height: "100%",
//                   }}
//                   title="PDF Preview"
//                 />
//                 {/* Clickable overlay for mapping - only when selection mode is on */}
//                 {selectionMode && textBlocks.length > 0 && (
//                   <div
//                     role="presentation"
//                     onClick={handlePdfOverlayClick}
//                     style={{
//                       position: "absolute",
//                       inset: 0,
//                       cursor: "crosshair",
//                       pointerEvents: "auto",
//                     }}
//                   >
//                     {textBlocks.map((block) => {
//                       const leftPct = ((block.x ?? 0) / pageWidth) * 100;
//                       const topPct = ((pageHeight - (block.y ?? 0) - (block.height ?? 12)) / pageHeight) * 100;
//                       const widthPct = ((block.width ?? 100) / pageWidth) * 100;
//                       const heightPct = ((block.height ?? 12) / pageHeight) * 100;
//                       const blockSelector = `[data-block-index="${block.index}"]`;
//                       const isMapped = Object.values(mapping).some(
//                         (s) => s && typeof s === "object" && Object.values(s).includes(blockSelector)
//                       );
//                       return (
//                         <div
//                           key={block.index}
//                           data-block-index={block.index}
//                           title={block.text?.slice(0, 40)}
//                           style={{
//                             position: "absolute",
//                             left: `${Math.max(0, leftPct)}%`,
//                             top: `${Math.max(0, topPct)}%`,
//                             width: `${Math.min(100 - leftPct, widthPct)}%`,
//                             height: `${Math.min(100 - topPct, heightPct)}%`,
//                             border: isMapped ? `2px solid ${THEME.success}` : "1px solid rgba(37, 99, 235, 0.4)",
//                             borderRadius: "2px",
//                             background: isMapped ? "rgba(16, 185, 129, 0.15)" : "rgba(37, 99, 235, 0.08)",
//                             boxSizing: "border-box",
//                           }}
//                         />
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
          
//           {/* HTML Preview (for mapping) */}
//           {previewMode === "html" && (
//             <div
//               ref={previewRef}
//               style={{
//                 flex: 1,
//                 overflow: "auto",
//                 padding: "20px",
//                 cursor: selectionMode ? "crosshair" : "default",
//                 position: "relative",
//               }}
//               onClick={handleElementClick}
//               dangerouslySetInnerHTML={{ __html: htmlContent }}
//             />
//           )}
//         </div>

//         {/* Right: Mapping Form */}
//         <div
//           style={{
//             width: "400px",
//             overflow: "auto",
//             background: THEME.surface,
//             padding: "20px",
//           }}
//         >
//           <FieldMapperSection
//             title="Contact Information"
//             fields={[
//               { key: "contact.fullName", label: "Full Name", required: true },
//               { key: "contact.email", label: "Email" },
//               { key: "contact.phone", label: "Phone" },
//               { key: "contact.location", label: "Location" },
//               { key: "contact.address", label: "Address" },
//               { key: "contact.website", label: "Website" },
//               { key: "contact.github", label: "GitHub" },
//               { key: "contact.linkedin", label: "LinkedIn" },
//               { key: "contact.portfolioLink", label: "Portfolio Link" },
//               { key: "contact.headline", label: "Headline" },
//               { key: "contact.summary", label: "Summary" },
//               { key: "contact.professionalSummary", label: "Professional Summary" },
//             ]}
//             mapping={mapping}
//             getMappingValue={getMappingValue}
//             onMap={enableSelection}
//           />

//           <FieldMapperSection
//             title="Experience"
//             fields={[
//               { key: "experience.container", label: "Experience Container", required: true },
//               { key: "experience.item", label: "Experience Item (one job)", required: true },
//               { key: "experience.title", label: "Job Title" },
//               { key: "experience.company", label: "Company" },
//               { key: "experience.location", label: "Job Location" },
//               { key: "experience.dateRange", label: "Date Range" },
//               { key: "experience.bullets", label: "Bullets List" },
//             ]}
//             mapping={mapping}
//             getMappingValue={getMappingValue}
//             onMap={enableSelection}
//           />

//           <FieldMapperSection
//             title="Education"
//             fields={[
//               { key: "education.container", label: "Education Container" },
//               { key: "education.item", label: "Education Item" },
//               { key: "education.degree", label: "Degree" },
//               { key: "education.school", label: "School" },
//               { key: "education.location", label: "Education Location" },
//               { key: "education.dateRange", label: "Date Range" },
//               { key: "education.gpa", label: "GPA" },
//               { key: "education.details", label: "Education Details" },
//             ]}
//             mapping={mapping}
//             getMappingValue={getMappingValue}
//             onMap={enableSelection}
//           />

//           <FieldMapperSection
//             title="Skills"
//             fields={[
//               { key: "skills.container", label: "Skills Container" },
//               { key: "skills.item", label: "Skill Item" },
//               { key: "skills.name", label: "Skill Name" },
//             ]}
//             mapping={mapping}
//             getMappingValue={getMappingValue}
//             onMap={enableSelection}
//           />

//           <FieldMapperSection
//             title="Projects"
//             fields={[
//               { key: "projects.container", label: "Projects Container" },
//               { key: "projects.item", label: "Project Item" },
//               { key: "projects.name", label: "Project Name" },
//               { key: "projects.description", label: "Project Description" },
//               { key: "projects.link", label: "Project Link" },
//             ]}
//             mapping={mapping}
//             getMappingValue={getMappingValue}
//             onMap={enableSelection}
//           />

//           <FieldMapperSection
//             title="Hobbies"
//             fields={[
//               { key: "hobbies.container", label: "Hobbies Container" },
//               { key: "hobbies.item", label: "Hobby Item" },
//               { key: "hobbies.name", label: "Hobby Name" },
//               { key: "hobbies.description", label: "Hobby Description" },
//             ]}
//             mapping={mapping}
//             getMappingValue={getMappingValue}
//             onMap={enableSelection}
//           />

//           <FieldMapperSection
//             title="Awards"
//             fields={[
//               { key: "awards.container", label: "Awards Container" },
//               { key: "awards.item", label: "Award Item" },
//               { key: "awards.title", label: "Award Title" },
//               { key: "awards.description", label: "Award Description" },
//               { key: "awards.issuer", label: "Issuer" },
//               { key: "awards.date", label: "Award Date" },
//             ]}
//             mapping={mapping}
//             getMappingValue={getMappingValue}
//             onMap={enableSelection}
//           />

//           {/* Actions */}
//           <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: `1px solid ${THEME.border}` }}>
//             <button
//               onClick={handleSave}
//               style={{
//                 width: "100%",
//                 padding: "12px",
//                 background: THEME.primary,
//                 color: "white",
//                 border: "none",
//                 borderRadius: "8px",
//                 fontSize: "16px",
//                 fontWeight: 600,
//                 cursor: "pointer",
//                 marginBottom: "12px",
//               }}
//             >
//               Generate Template
//             </button>
//             <button
//               onClick={() => {
//                 setMapping({ contact: {}, experience: {}, education: {}, skills: {}, projects: {}, hobbies: {}, awards: {} });
//                 showToast("All mappings cleared", { type: "info" });
//               }}
//               style={{
//                 width: "100%",
//                 padding: "12px",
//                 background: THEME.surface,
//                 color: THEME.text,
//                 border: `1px solid ${THEME.border}`,
//                 borderRadius: "8px",
//                 fontSize: "14px",
//                 cursor: "pointer",
//               }}
//             >
//               Clear All
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* CSS for highlighting */}
//       <style>{`
//         .mapped-highlight {
//           outline: 3px solid ${THEME.success} !important;
//           outline-offset: 2px !important;
//           background-color: ${THEME.success}15 !important;
//         }
//       `}</style>
//     </div>
//   );
// }

// // Field Mapper Section Component
// function FieldMapperSection({ title, fields, mapping, getMappingValue, onMap }) {
//   return (
//     <div style={{ marginBottom: "24px" }}>
//       <h4
//         style={{
//           margin: "0 0 12px 0",
//           fontSize: "14px",
//           fontWeight: 600,
//           color: THEME.text,
//           textTransform: "uppercase",
//           letterSpacing: "0.5px",
//         }}
//       >
//         {title}
//       </h4>
//       {fields.map((field) => (
//         <FieldMapper
//           key={field.key}
//           field={field}
//           value={getMappingValue(field.key)}
//           onMap={() => onMap(field.key)}
//         />
//       ))}
//     </div>
//   );
// }

// // Individual Field Mapper Component
// function FieldMapper({ field, value, onMap }) {
//   return (
//     <div style={{ marginBottom: "12px" }}>
//       <label
//         style={{
//           display: "block",
//           fontSize: "13px",
//           fontWeight: 500,
//           color: THEME.text,
//           marginBottom: "6px",
//         }}
//       >
//         {field.label}
//         {field.required && <span style={{ color: THEME.danger }}> *</span>}
//       </label>
//       <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
//         <input
//           type="text"
//           value={value || ""}
//           placeholder="Click 'Map' to select element"
//           readOnly
//           style={{
//             flex: 1,
//             padding: "8px 12px",
//             border: `1px solid ${THEME.border}`,
//             borderRadius: "6px",
//             fontSize: "13px",
//             background: value ? THEME.success + "10" : THEME.surface,
//             color: THEME.text,
//           }}
//         />
//         <button
//           onClick={onMap}
//           style={{
//             padding: "8px 16px",
//             background: value ? THEME.textMuted : THEME.primary,
//             color: "white",
//             border: "none",
//             borderRadius: "6px",
//             fontSize: "13px",
//             fontWeight: 500,
//             cursor: "pointer",
//             whiteSpace: "nowrap",
//           }}
//         >
//           {value ? "Re-map" : "Map"}
//         </button>
//         {value && (
//           <Check size={20} color={THEME.success} weight="bold" />
//         )}
//       </div>
//       {value && (
//         <div
//           style={{
//             marginTop: "4px",
//             fontSize: "11px",
//             color: THEME.textMuted,
//             fontFamily: "monospace",
//           }}
//         >
//           {value}
//         </div>
//       )}
//     </div>
//   );
// }
