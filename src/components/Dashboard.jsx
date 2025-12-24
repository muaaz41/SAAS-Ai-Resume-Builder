// import React, { useEffect, useMemo, useState, useRef } from "react";
// import { api } from "../lib/api.js";
// import { useNavigate } from "react-router-dom";
// import Navbar from "./Navbar";
// import Footer from "./Footer";
// import { useAuth } from "../context/AuthContext.jsx";
// import ResumeUpload from "./ResumeUpload.jsx";
// import TemplateCard from "./TemplateCard.jsx";
// import { showToast } from "../lib/toast";

// const HIDDEN_TEMPLATE_NAMES = new Set([
//   // "Modern Flat",
//   // "Scandinavian Modern",
//   // "Swiss Design",
//   // "Tech Lead",
//   // "French Elegance",
//   // "European Executive",
//   // "Asian Professional",
//   // "Innovative Modern",
//   // "Business Consultant",
//   // "Bold Statement",
//   // "Designer Portfolio",
//   // "Creative Blue",
//   // "Executive Suite",
//   // "Finance Professional",
//   // "Healthcare Provider",
//   // "Global Executive",
//   // "Minimalist",
//   // "Professional Elegant",
//   // "Research Scholar",
//   // "Simple Clean",
//   // "Classic Business",
//   // "German Precision",
//   // "Japanese Minimalist",
//   // "Startup Founder",
//   // "Academic Scholar",
//   // "Modern Executive",
//   // "Operations Manager",
//   // "Marketing Pro",
//   // "Corporate Professional",
// ]);

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const { user, refreshUser } = useAuth();
//   const [templates, setTemplates] = useState([]);
//   const [resumes, setResumes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [category, setCategory] = useState("all");
//   const [deleting, setDeleting] = useState(null);
//   const [showUpload, setShowUpload] = useState(false);
//   const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
//   const [deletingAccount, setDeletingAccount] = useState(false);
//   const [uploadTemplateSlug, setUploadTemplateSlug] = useState(null);
//   const [showPreviewModal, setShowPreviewModal] = useState(false);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [selectedResume, setSelectedResume] = useState(null);
//   const [selectedResumePreview, setSelectedResumePreview] = useState("");
//   const [isPreviewLoading, setIsPreviewLoading] = useState(false);
//   const [subscriptionStatus, setSubscriptionStatus] = useState(null);
//   const toastShownRef = useRef(false);

//   useEffect(() => {
//     if (!user) return;
//     const fetchSubscriptionStatus = async () => {
//       try {
//         const response = await api.get("/api/v1/billing/subscription");
//         setSubscriptionStatus(response.data?.data);
//       } catch (err) {
//         console.error("Failed to fetch subscription status:", err);
//       }
//     };
//     fetchSubscriptionStatus();
//   }, [user]);

//   // Consistent neutral palette so inputs look identical in both OS themes
//   const THEME = {
//         text: "#0f172a",
//         sub: "#475569",
//         muted: "#64748b",
//     border: "#d0d7e3",
//         inputBg: "#ffffff",
//       };

//   const formatPlanName = (plan) =>
//     plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Free";

//   const planAccent = (plan) => {
//     if (plan === "premium") return "#7c3aed";
//     if (plan === "professional") return "#2563eb";
//     return "#0f172a";
//   };

//   const formatPeriodEnd = (value) => {
//     if (!value) return null;
//     try {
//       const date = new Date(value);
//       if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return null;
//       return date.toLocaleDateString();
//     } catch {
//       return null;
//     }
//       };

//   // Check for Stripe checkout success
//   const paymentToastShown = useRef(false);
//   useEffect(() => {
//     if (paymentToastShown.current) return;
    
//     const urlParams = new URLSearchParams(window.location.search);
//     const sessionId = urlParams.get("session_id");
//     const success = urlParams.get("success");

//     if (success === "true" && sessionId) {
//       paymentToastShown.current = true;
//       showToast("Payment successful! Your subscription is now active.", {
//         type: "success",
//         duration: 5000,
//       });
//       // Clean up URL
//       window.history.replaceState({}, "", "/dashboard");

//       // Refresh user data
//       if (user) {
//         // Wait a bit for webhook to process, then reload
//         setTimeout(() => {
//           window.location.reload();
//         }, 2000);
//       }
//     } else if (urlParams.get("canceled") === "true" && !paymentToastShown.current) {
//       paymentToastShown.current = true;
//       showToast("Payment was canceled.", {
//         type: "error",
//         duration: 3000,
//       });
//       window.history.replaceState({}, "", "/dashboard");
//     }
//   }, [user]);

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         const [t, r] = await Promise.all([
//           api.get(
//             `/api/v1/templates/public${
//               category !== "all" ? `?category=${category}` : ""
//             }`
//           ),
//           api.get("/api/v1/resumes"),
//         ]);
//         if (!mounted) return;
        
//         const items = t.data?.data?.items || [];
//         const visibleTemplates = items.filter((tpl) => {
//           const name = (tpl?.name || "").trim();
//           return !HIDDEN_TEMPLATE_NAMES.has(name);
//         });
//         const sorted = [...visibleTemplates].sort((a, b) => {
//           const an = (a.name || a.slug || "").toLowerCase();
//           const bn = (b.name || b.slug || "").toLowerCase();
//           return an.localeCompare(bn);
//         });
//         setTemplates(sorted);
//         const resumeItems = r.data?.data?.items || [];
//         setResumes(resumeItems);
        
//         // Show warning if approaching resume limit (only once per session)
//         const resumeCount = r.data?.data?.count || resumeItems.length;
//         if (resumeCount >= 4 && !toastShownRef.current) {
//           toastShownRef.current = true;
//           showToast(`You have ${resumeCount}/5 resumes. Consider deleting some to create new ones.`, {
//             type: "warning",
//             duration: 5000,
//           });
//         }
//       } finally {
//         if (mounted) {
//         setLoading(false);
//         }
//       }
//     })();
    
//     return () => {
//       mounted = false;
//     };
//   }, [category]);

//   const filtered = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return templates;
//     return templates.filter((t) =>
//       [t.name, t.slug, t.tags?.join(" ")]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase()
//         .includes(q)
//     );
//   }, [templates, search]);

//   const handleDeleteResume = async (resumeId) => {
//     if (!window.confirm("Are you sure you want to delete this resume?")) return;
//     setDeleting(resumeId);
//     try {
//       await api.delete(`/api/v1/resumes/${resumeId}`);
//       setResumes((prev) => prev.filter((r) => (r._id || r.id) !== resumeId));
//       showToast("Resume deleted successfully", { type: "success" });
//     } catch (err) {
//       showToast("Failed to delete resume. Please try again.", { type: "error" });
//       console.error(err);
//     } finally {
//       setDeleting(null);
//     }
//   };

//   const [duplicating, setDuplicating] = useState(null);

//   const handleDuplicateResume = async (resumeId) => {
//     // Check resume limit before duplicating
//     if (resumes.length >= 5) {
//       showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to duplicate.", {
//         type: "error",
//         duration: 5000,
//       });
//       return;
//     }

//     setDuplicating(resumeId);
//     try {
//       const response = await api.post(`/api/v1/resumes/${resumeId}/duplicate`);
//       const newResume = response.data?.data?.resume;
//       if (newResume) {
//         setResumes((prev) => [newResume, ...prev]);
//         showToast("Resume duplicated successfully!", { type: "success" });
//       }
//     } catch (err) {
//       const errorMsg = err.response?.data?.message || err.message || "Failed to duplicate resume";
//       showToast(errorMsg, { type: "error" });
//       console.error(err);
//     } finally {
//       setDuplicating(null);
//     }
//   };

//   const handlePreviewResume = async (resumeId) => {
//     if (!resumeId) {
//       console.error("❌ No resume ID provided");
//       alert("Invalid resume ID. Please try again.");
//       return;
//     }

//     console.log("🔍 handlePreviewResume called with ID:", resumeId);
//     setIsPreviewLoading(true);
//     try {
//       // First, get the resume to verify it exists and belongs to user
//       let resumeRes;
//       try {
//         resumeRes = await api.get(`/api/v1/resumes/${resumeId}`);
//       } catch (err) {
//         if (err.response?.status === 404) {
//           alert("Resume not found. It may have been deleted.");
//           return;
//         }
//         if (err.response?.status === 403) {
//           alert("You don't have permission to view this resume.");
//           return;
//         }
//         throw err;
//       }

//       const resumeData = resumeRes.data?.data?.resume || resumeRes.data?.data;
//       if (!resumeData) {
//         alert("Resume data not found. Please try again.");
//         return;
//       }

//       // Get preview HTML
//       let previewHtml = "";
//       try {
//         const previewRes = await api.get(`/api/v1/resumes/${resumeId}/preview`);
//         previewHtml =
//           previewRes.data?.data?.html || previewRes.data?.html || "";
//       } catch (err) {
//         console.warn("Server preview failed:", err);
//         if (err.response?.status === 404) {
//           alert(
//             "Resume preview not available. The resume may not have a template assigned."
//           );
//           return;
//         }
//         // Continue with empty preview - will use fallback
//       }

//       // Find template
//       const templateSlug = resumeData.templateSlug || resumeData.template?.slug;
//       const template =
//         templates.find((t) => t.slug === templateSlug) || templates[0];

//       if (!template) {
//         console.warn(
//           "Template not found for resume, using first available template"
//         );
//       }

//       console.log("💾 Setting modal data:", {
//         resumeData,
//         previewHtml: previewHtml.substring(0, 100) + "...",
//         template: template?.name,
//       });

//       setSelectedResume(resumeData);
//       setSelectedResumePreview(previewHtml);
//       setSelectedTemplate(template);
//       setShowPreviewModal(true);
//       console.log("✅ Modal should be showing now");
//     } catch (error) {
//       console.error("❌ Failed to preview resume:", error);
//       const errorMessage =
//         error.response?.data?.message || error.message || "Unknown error";
//       alert(
//         `Failed to load resume preview: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`
//       );
//     } finally {
//       setIsPreviewLoading(false);
//     }
//   };

//   const handleSelectTemplate = async (template) => {
//     if (!template?.slug) {
//       console.error("No template selected");
//       return;
//     }

//     // Check resume limit before creating
//     if (resumes.length >= 5) {
//       showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
//         type: "error",
//         duration: 5000,
//       });
//       return;
//     }

//     try {
//       // Create new resume with selected template
//       const { data } = await api.post("/api/v1/resumes", {
//         title: "My Resume",
//         templateSlug: template.slug,
//       });

//       const resumeId = data.data.resumeId;

//       // Navigate to builder
//       navigate("/builder", {
//         state: {
//           resumeId,
//           templateSlug: template.slug,
//         },
//       });
//     } catch (error) {
//       console.error("Failed to create resume:", error);
//       const errorMessage =
//         error.response?.data?.message ||
//         error.message ||
//         "Failed to create resume.";

//       // Show specific message for premium template access
//       if (error.response?.status === 402) {
//         const shouldUpgrade = window.confirm(
//           `${errorMessage}\n\nWould you like to upgrade to Premium to access this template?`
//         );
//         if (shouldUpgrade) {
//           navigate("/pricing");
//         }
//       } else {
//         alert(errorMessage);
//       }
//     }
//   };

//   const handlePreviewTemplate = (template) => {
//     setSelectedTemplate(template);
//     setShowPreviewModal(true);
//   };

//   return (
//     <div style={{ position: "relative", background: "#f2f4f7", minHeight: "100vh" }}>
//       <Navbar />
//       {showUpload && (
//         <ResumeUpload
//           onClose={() => {
//             setShowUpload(false);
//             setUploadTemplateSlug(null);
//           }}
//           selectedTemplateSlug={uploadTemplateSlug}
//         />
//       )}
//       {isPreviewLoading && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(15,23,42,0.35)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 45,
//           }}>
//           <div
//             style={{
//               background: "#ffffff",
//               padding: "20px 26px",
//               borderRadius: 14,
//               boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
//               textAlign: "center",
//               minWidth: 260,
//             }}>
//             <div
//               style={{
//                 width: 40,
//                 height: 40,
//                 borderRadius: "999px",
//                 border: "4px solid #e5e7eb",
//                 borderTopColor: "#2563eb",
//                 margin: "0 auto 12px",
//                 animation: "spin 0.9s linear infinite",
//               }}
//             />
//             <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
//               Loading preview…
//             </div>
//             <div style={{ fontSize: 13, color: "#64748b" }}>
//               Generating a live preview of your resume.
//             </div>
//           </div>
//         </div>
//       )}
//       {/* {loading && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(15,23,42,0.25)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 40,
//           }}>
//           <div
//             style={{
//               background: "#ffffff",
//               padding: "20px 26px",
//               borderRadius: 14,
//               boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
//               textAlign: "center",
//               minWidth: 240,
//             }}>
//             <div
//               style={{
//                 width: 40,
//                 height: 40,
//                 borderRadius: "999px",
//                 border: "4px solid #e5e7eb",
//                 borderTopColor: "#2563eb",
//                 margin: "0 auto 12px",
//                 animation: "spin 0.9s linear infinite",
//               }}
//             />
//             <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
//               Loading templates…
//             </div>
//             <div style={{ fontSize: 13, color: "#64748b" }}>
//               Fetching your templates and resumes.
//             </div>
//             <style>
//               {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
//             </style>
//           </div>
//         </div>
//       )} */}

//       <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
//         <style>{`#template-search::placeholder{color:${THEME.muted}}`}</style>

//         {subscriptionStatus && (
//         <div
//           style={{
//               background: subscriptionStatus.hasActiveSubscription
//                 ? `linear-gradient(135deg, ${planAccent(subscriptionStatus.plan || "free")}15 0%, ${planAccent(subscriptionStatus.plan || "free")}08 100%)`
//                 : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
//               border: `2px solid ${subscriptionStatus.hasActiveSubscription ? planAccent(subscriptionStatus.plan || "free") + "30" : "#e2e8f0"}`,
//               borderRadius: 20,
//               padding: 24,
//               marginBottom: 32,
//             display: "flex",
//             alignItems: "center",
//               gap: 20,
//               boxShadow: subscriptionStatus.hasActiveSubscription
//                 ? `0 4px 20px ${planAccent(subscriptionStatus.plan || "free")}15`
//                 : "0 2px 8px rgba(15, 23, 42, 0.08)",
//               transition: "all 0.3s ease",
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.transform = "translateY(-2px)";
//               e.currentTarget.style.boxShadow = subscriptionStatus.hasActiveSubscription
//                 ? `0 8px 30px ${planAccent(subscriptionStatus.plan || "free")}20`
//                 : "0 4px 12px rgba(15, 23, 42, 0.12)";
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.transform = "translateY(0)";
//               e.currentTarget.style.boxShadow = subscriptionStatus.hasActiveSubscription
//                 ? `0 4px 20px ${planAccent(subscriptionStatus.plan || "free")}15`
//                 : "0 2px 8px rgba(15, 23, 42, 0.08)";
//             }}>
//             <div
//               style={{
//                 width: 64,
//                 height: 64,
//                 borderRadius: 16,
//                 background: subscriptionStatus.hasActiveSubscription
//                   ? `linear-gradient(135deg, ${planAccent(subscriptionStatus.plan || "free")} 0%, ${planAccent(subscriptionStatus.plan || "free")}dd 100%)`
//                   : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
//                 color: "#fff",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontWeight: 700,
//                 fontSize: 24,
//                 boxShadow: `0 4px 12px ${planAccent(subscriptionStatus.plan || "free")}40`,
//               }}>
//               {subscriptionStatus.plan
//                 ? subscriptionStatus.plan.charAt(0).toUpperCase()
//                 : "F"}
//             </div>
//             <div style={{ flex: 1 }}>
//               <div
//                 style={{
//                   fontSize: 20,
//                   fontWeight: 700,
//                   color: THEME.text,
//                   marginBottom: 6,
//                 }}>
//                 {subscriptionStatus.hasActiveSubscription
//                   ? `${formatPlanName(subscriptionStatus.plan)} Plan`
//                   : "Free Plan"}
//               </div>
//               <div
//                 style={{
//                   fontSize: 14,
//                   color: THEME.sub,
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 8,
//                 }}>
//                 {subscriptionStatus.hasActiveSubscription ? (
//                   <>
//                     <span
//                       style={{
//                         display: "inline-block",
//                         width: 8,
//                         height: 8,
//                         borderRadius: "50%",
//                         background: "#10b981",
//                         boxShadow: "0 0 0 2px #10b98130",
//                       }}
//                     />
//                     {formatPeriodEnd(subscriptionStatus.currentPeriodEnd)
//                       ? `Renews on ${formatPeriodEnd(
//                           subscriptionStatus.currentPeriodEnd
//                         )}`
//                       : "Active subscription"}
//                   </>
//                 ) : (
//                   <>
//                     <span>✨</span>
//                     Unlock Premium features like AI, unlimited exports, and more.
//                   </>
//                 )}
//               </div>
//             </div>
//             <button
//               type="button"
//               onClick={() => navigate("/pricing")}
//               style={{
//                 background: subscriptionStatus.hasActiveSubscription
//                   ? planAccent(subscriptionStatus.plan || "free")
//                   : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: 12,
//                 padding: "12px 24px",
//                 fontWeight: 600,
//                 cursor: "pointer",
//                 fontSize: 14,
//                 boxShadow: subscriptionStatus.hasActiveSubscription
//                   ? `0 4px 12px ${planAccent(subscriptionStatus.plan || "free")}40`
//                   : "0 4px 12px rgba(37, 99, 235, 0.3)",
//                 transition: "all 0.2s ease",
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.transform = "scale(1.05)";
//                 e.currentTarget.style.boxShadow = subscriptionStatus.hasActiveSubscription
//                   ? `0 6px 16px ${planAccent(subscriptionStatus.plan || "free")}50`
//                   : "0 6px 16px rgba(37, 99, 235, 0.4)";
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.transform = "scale(1)";
//                 e.currentTarget.style.boxShadow = subscriptionStatus.hasActiveSubscription
//                   ? `0 4px 12px ${planAccent(subscriptionStatus.plan || "free")}40`
//                   : "0 4px 12px rgba(37, 99, 235, 0.3)";
//               }}>
//               {subscriptionStatus.hasActiveSubscription ? "Manage plan" : "Upgrade Now"}
//             </button>
//           </div>
//         )}

//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//             marginBottom: 32,
//             paddingBottom: 24,
//             borderBottom: "2px solid #f1f5f9",
//           }}>
//           <div>
//             <h1
//               style={{
//                 fontSize: 32,
//                 fontWeight: 700,
//                 margin: "0 0 8px 0",
//                 color: "#0f172a",
//                 background: "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
//                 WebkitBackgroundClip: "text",
//                 WebkitTextFillColor: "transparent",
//                 backgroundClip: "text",
//               }}>
//               Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
//             </h1>
//             <p
//               style={{
//                 fontSize: 16,
//                 color: "#64748b",
//                 margin: 0,
//                 fontWeight: 400,
//               }}>
//               Manage your resumes and create professional documents
//             </p>
//           </div>
//           <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//           <button
//             onClick={() => {
//               if (resumes.length >= 5) {
//                 showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to upload a new one.", {
//                   type: "error",
//                   duration: 5000,
//                 });
//                 return;
//               }
//               setShowUpload(true);
//             }}
//             disabled={resumes.length >= 5}
//             style={{
//                 background: resumes.length >= 5
//                   ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
//                   : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
//               color: "#fff",
//               border: "none",
//                 borderRadius: 12,
//                 padding: "12px 20px",
//               fontWeight: 600,
//               cursor: resumes.length >= 5 ? "not-allowed" : "pointer",
//               fontSize: 14,
//               display: "flex",
//               alignItems: "center",
//               gap: 8,
//                 boxShadow: resumes.length >= 5
//                   ? "none"
//                   : "0 4px 12px rgba(37, 99, 235, 0.3)",
//                 transition: "all 0.2s ease",
//                 opacity: resumes.length >= 5 ? 0.6 : 1,
//               }}
//               onMouseEnter={(e) => {
//                 if (resumes.length < 5) {
//                   e.currentTarget.style.transform = "translateY(-2px)";
//                   e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.4)";
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.transform = "translateY(0)";
//                 e.currentTarget.style.boxShadow = resumes.length >= 5
//                   ? "none"
//                   : "0 4px 12px rgba(37, 99, 235, 0.3)";
//             }}>
//             <span style={{ fontSize: 18 }}>📤</span>
//             {resumes.length >= 5 ? "Limit Reached" : "Start with Existing Resume"}
//           </button>
//             <button
//               onClick={() => setShowDeleteAccountModal(true)}
//               style={{
//                 background: "#fff",
//                 color: "#dc2626",
//                 border: "1px solid #fecaca",
//                 borderRadius: 12,
//                 padding: "12px 16px",
//                 fontWeight: 600,
//                 cursor: "pointer",
//                 fontSize: 13,
//                 transition: "all 0.2s ease",
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.background = "#fef2f2";
//                 e.currentTarget.style.borderColor = "#fca5a5";
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.background = "#fff";
//                 e.currentTarget.style.borderColor = "#fecaca";
//               }}>
//               Delete Account
//           </button>
//           </div>
//         </div>

//         {/* Your Resumes Section - Moved to top */}
//         <section style={{ marginBottom: 40 }}>
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: 24,
//             }}>
//             <div style={{ flex: 1 }}>
//               <h2
//                 style={{
//                   fontSize: 24,
//                   fontWeight: 700,
//                   margin: "0 0 6px 0",
//                   color: "#0f172a",
//                 }}>
//                 Your Resumes{" "}
//                 {!loading && resumes.length > 0 ? `(${resumes.length}/5)` : ""}
//               </h2>
//               <p
//                 style={{
//                   fontSize: 14,
//                   color: "#64748b",
//                   margin: 0,
//                 }}>
//                 {loading
//                   ? "Loading your resumes..."
//                   : resumes.length === 0
//                   ? "Create your first professional resume"
//                   : "Manage and edit your saved resumes"}
//               </p>
//               {resumes.length >= 4 && resumes.length < 5 && !loading && (
//                 <div
//                   style={{
//                     marginTop: 12,
//                     padding: "10px 14px",
//                     background: "#fef3c7",
//                     border: "1px solid #fcd34d",
//                     borderRadius: 8,
//                     fontSize: 13,
//                     color: "#92400e",
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 8,
//                   }}>
//                   <span>⚠️</span>
//                   <span>
//                     You are approaching your resume limit (5). Consider deleting old resumes.
//                 </span>
//                 </div>
//               )}
//               {resumes.length >= 5 && !loading && (
//                 <div
//                   style={{
//                     marginTop: 12,
//                     padding: "10px 14px",
//                     background: "#fee2e2",
//                     border: "1px solid #fca5a5",
//                     borderRadius: 8,
//                     fontSize: 13,
//                     color: "#991b1b",
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 8,
//                   }}>
//                   <span>🚫</span>
//                   <span>
//                     You have reached the maximum limit of 5 resumes. Delete a resume to create a new one.
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>
//           {loading ? (
//             <div
//               style={{
//                 padding: "48px 32px",
//                 background: "#f8fafc",
//                 borderRadius: 16,
//                 border: "1px solid #e2e8f0",
//                 color: "#475569",
//               }}>
//               Loading your resumes…
//             </div>
//           ) : resumes.length === 0 ? (
//             <div
//               style={{
//                 textAlign: "center",
//                 padding: "80px 40px",
//                 background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
//                 borderRadius: 24,
//                 border: "2px dashed #cbd5e1",
//                 position: "relative",
//                 overflow: "hidden",
//               }}>
//               <div
//                 style={{
//                   position: "absolute",
//                   top: -50,
//                   right: -50,
//                   width: 200,
//                   height: 200,
//                   background: "radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)",
//                   borderRadius: "50%",
//                 }}
//               />
//               <div
//                 style={{
//                   fontSize: 64,
//                   marginBottom: 20,
//                   position: "relative",
//                   zIndex: 1,
//                 }}>
//                 📄
//               </div>
//               <h3
//                 style={{
//                   fontSize: 22,
//                   fontWeight: 700,
//                   color: "#0f172a",
//                   marginBottom: 12,
//                   position: "relative",
//                   zIndex: 1,
//                 }}>
//                 No resumes yet
//               </h3>
//               <p
//                 style={{
//                   fontSize: 15,
//                   color: "#64748b",
//                   marginBottom: 32,
//                   maxWidth: 400,
//                   margin: "0 auto 32px",
//                   position: "relative",
//                   zIndex: 1,
//                 }}>
//                 Create your first professional resume using our templates and start building your career
//               </p>
//               <button
//                 onClick={() => {
//                   if (resumes.length >= 5) {
//                     showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
//                       type: "error",
//                       duration: 5000,
//                     });
//                     return;
//                   }
//                   if (templates.length > 0) {
//                     handleSelectTemplate(templates[0]);
//                   }
//                 }}
//                 disabled={resumes.length >= 5}
//                 style={{
//                   padding: "14px 32px",
//                   background: resumes.length >= 5
//                     ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
//                     : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
//                   color: "white",
//                   border: "none",
//                   borderRadius: 12,
//                   fontWeight: 600,
//                   cursor: resumes.length >= 5 ? "not-allowed" : "pointer",
//                   fontSize: 15,
//                   boxShadow: resumes.length >= 5
//                     ? "none"
//                     : "0 4px 16px rgba(37, 99, 235, 0.3)",
//                   transition: "all 0.2s ease",
//                   position: "relative",
//                   zIndex: 1,
//                   opacity: resumes.length >= 5 ? 0.6 : 1,
//                 }}
//                 onMouseEnter={(e) => {
//                   if (resumes.length < 5) {
//                     e.currentTarget.style.transform = "translateY(-2px)";
//                     e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.4)";
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.transform = "translateY(0)";
//                   e.currentTarget.style.boxShadow = resumes.length >= 5
//                     ? "none"
//                     : "0 4px 16px rgba(37, 99, 235, 0.3)";
//                 }}>
//                 {resumes.length >= 5 ? "🚫 Limit Reached (5/5)" : "✨ Create Your First Resume"}
//               </button>
//             </div>
//           ) : (
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
//                 gap: 24,
//                 marginBottom: 32,
//               }}>
//               {resumes.map((r, idx) => {
//                 const template = templates.find(
//                   (t) => t.slug === r.templateSlug
//                 );
//                 // Use templateName from resume if available (from duplicate/create), otherwise find from templates array
//                 const templateName =
//                   r.templateName || template?.name || r.templateSlug || "Unknown";
//                 const templateColor = template?.ui?.accentColor || "#2563eb";
//                 const lastUpdated = r.updatedAt
//                   ? new Date(r.updatedAt).toLocaleDateString()
//                   : "";
//                 const isPremium = template?.category === "premium";

//                 return (
//                   <div
//                     key={r._id || r.id || idx}
//                     style={{
//                       border: `2px solid ${templateColor}15`,
//                       borderRadius: 20,
//                       background: "#fff",
//                       overflow: "hidden",
//                       transition: "all 0.3s ease",
//                       cursor: "pointer",
//                       boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.transform = "translateY(-6px)";
//                       e.currentTarget.style.boxShadow = `0 16px 32px ${templateColor}25`;
//                       e.currentTarget.style.borderColor = `${templateColor}30`;
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.transform = "translateY(0)";
//                       e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.08)";
//                       e.currentTarget.style.borderColor = `${templateColor}15`;
//                     }}>
//                     {/* Template Preview Header */}
//                     <div
//                       style={{
//                         height: "6px",
//                         background: `linear-gradient(90deg, ${templateColor} 0%, ${templateColor}dd 50%, ${templateColor}80 100%)`,
//                       }}
//                     />

//                     <div style={{ padding: 24 }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: 12,
//                           marginBottom: 16,
//                         }}>
//                         <div
//                           style={{
//                             width: 48,
//                             height: 48,
//                             background: `linear-gradient(135deg, ${templateColor}15 0%, ${templateColor}08 100%)`,
//                             borderRadius: 12,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             fontSize: 20,
//                             border: `1px solid ${templateColor}20`,
//                           }}>
//                           📄
//                         </div>
//                         <div style={{ flex: 1, minWidth: 0 }}>
//                           <div
//                             style={{
//                               fontWeight: 700,
//                               fontSize: 18,
//                               color: "#0f172a",
//                               marginBottom: 4,
//                               whiteSpace: "nowrap",
//                               overflow: "hidden",
//                               textOverflow: "ellipsis",
//                             }}>
//                             {r.title || "Untitled Resume"}
//                           </div>
//                           <div
//                             style={{
//                               fontSize: 13,
//                               color: "#64748b",
//                               display: "flex",
//                               alignItems: "center",
//                               gap: 6,
//                             }}>
//                             <span>{templateName}</span>
//                             {isPremium && (
//                               <span
//                                 style={{
//                                   background: "#fbbf24",
//                                   color: "#fff",
//                                   padding: "2px 6px",
//                                   borderRadius: 4,
//                                   fontSize: 10,
//                                   fontWeight: 600,
//                                 }}>
//                                 PREMIUM
//                 </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {lastUpdated && (
//                         <div
//                           style={{
//                             fontSize: 12,
//                             color: "#94a3b8",
//                             marginBottom: 16,
//                             display: "flex",
//                             alignItems: "center",
//                             gap: 6,
//                             padding: "8px 12px",
//                             background: "#f8fafc",
//                             borderRadius: 8,
//                           }}>
//                           <span>🕒</span>
//                           <span>Last updated: {lastUpdated}</span>
//                         </div>
//                       )}

//                       <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                         <button
//                           onClick={() =>
//                             navigate("/builder", {
//                               state: { resumeId: r._id || r.id },
//                             })
//                           }
//                           style={{
//                             flex: "1 1 auto",
//                             minWidth: "100px",
//                             padding: "10px 16px",
//                             borderRadius: 10,
//                             background: `linear-gradient(135deg, ${templateColor} 0%, ${templateColor}dd 100%)`,
//                             color: "white",
//                             border: "none",
//                             fontWeight: 600,
//                             cursor: "pointer",
//                             fontSize: 13,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             boxShadow: `0 2px 8px ${templateColor}30`,
//                             transition: "all 0.2s ease",
//                             whiteSpace: "nowrap",
//                           }}
//                           onMouseEnter={(e) => {
//                             e.currentTarget.style.transform = "translateY(-1px)";
//                             e.currentTarget.style.boxShadow = `0 4px 12px ${templateColor}40`;
//                           }}
//                           onMouseLeave={(e) => {
//                             e.currentTarget.style.transform = "translateY(0)";
//                             e.currentTarget.style.boxShadow = `0 2px 8px ${templateColor}30`;
//                           }}>
//                           Edit
//                         </button>
//                         <button
//                           onClick={() => {
//                             handlePreviewResume(r._id || r.id);
//                           }}
//                           style={{
//                             flex: "1 1 auto",
//                             minWidth: "100px",
//                             padding: "10px 16px",
//                             borderRadius: 10,
//                             background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
//                             color: "white",
//                             border: "none",
//                             cursor: "pointer",
//                             fontSize: 13,
//                             fontWeight: 600,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
//                             transition: "all 0.2s ease",
//                             whiteSpace: "nowrap",
//                           }}
//                           onMouseEnter={(e) => {
//                             e.currentTarget.style.transform = "translateY(-1px)";
//                             e.currentTarget.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.4)";
//                           }}
//                           onMouseLeave={(e) => {
//                             e.currentTarget.style.transform = "translateY(0)";
//                             e.currentTarget.style.boxShadow = "0 2px 8px rgba(5, 150, 105, 0.3)";
//                           }}>
//                           Preview
//                         </button>
//                         <button
//                           onClick={() => handleDuplicateResume(r._id || r.id)}
//                           disabled={duplicating === (r._id || r.id) || resumes.length >= 5}
//                           style={{
//                             flex: "1 1 auto",
//                             minWidth: "100px",
//                             padding: "10px 16px",
//                             borderRadius: 10,
//                             background: resumes.length >= 5 ? "#f1f5f9" : "#fff",
//                             color: resumes.length >= 5 ? "#94a3b8" : "#2563eb",
//                             border: `1.5px solid ${resumes.length >= 5 ? "#cbd5e1" : "#93c5fd"}`,
//                             cursor:
//                               duplicating === (r._id || r.id) || resumes.length >= 5
//                                 ? "not-allowed"
//                                 : "pointer",
//                             opacity: duplicating === (r._id || r.id) || resumes.length >= 5 ? 0.6 : 1,
//                             fontSize: 13,
//                             fontWeight: 600,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             transition: "all 0.2s ease",
//                             whiteSpace: "nowrap",
//                           }}
//                           onMouseEnter={(e) => {
//                             if (duplicating !== (r._id || r.id) && resumes.length < 5) {
//                               e.currentTarget.style.background = "#eff6ff";
//                               e.currentTarget.style.borderColor = "#60a5fa";
//                               e.currentTarget.style.transform = "translateY(-1px)";
//                             }
//                           }}
//                           onMouseLeave={(e) => {
//                             e.currentTarget.style.background = resumes.length >= 5 ? "#f1f5f9" : "#fff";
//                             e.currentTarget.style.borderColor = resumes.length >= 5 ? "#cbd5e1" : "#93c5fd";
//                             e.currentTarget.style.transform = "translateY(0)";
//                           }}
//                           title={resumes.length >= 5 ? "Resume limit reached (5/5)" : "Duplicate Resume"}>
//                           {duplicating === (r._id || r.id) ? "Duplicating..." : "Duplicate"}
//                         </button>
//                         <button
//                           onClick={() => handleDeleteResume(r._id || r.id)}
//                           disabled={deleting === (r._id || r.id)}
//                           style={{
//                             flex: "1 1 auto",
//                             minWidth: "100px",
//                             padding: "10px 16px",
//                             borderRadius: 10,
//                             background: "#fff",
//                             color: "#dc2626",
//                             border: "1.5px solid #fca5a5",
//                             cursor:
//                               deleting === (r._id || r.id)
//                                 ? "not-allowed"
//                                 : "pointer",
//                             opacity: deleting === (r._id || r.id) ? 0.6 : 1,
//                             fontSize: 13,
//                             fontWeight: 600,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             transition: "all 0.2s ease",
//                             whiteSpace: "nowrap",
//                           }}
//                           onMouseEnter={(e) => {
//                             if (deleting !== (r._id || r.id)) {
//                               e.currentTarget.style.background = "#fef2f2";
//                               e.currentTarget.style.borderColor = "#f87171";
//                               e.currentTarget.style.transform = "translateY(-1px)";
//                             }
//                           }}
//                           onMouseLeave={(e) => {
//                             e.currentTarget.style.background = "#fff";
//                             e.currentTarget.style.borderColor = "#fca5a5";
//                             e.currentTarget.style.transform = "translateY(0)";
//                           }}>
//                           {deleting === (r._id || r.id) ? "Deleting..." : "Delete"}
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </section>

//         {/* Professional Templates Section - Moved below resumes */}
//         <section style={{ marginBottom: 40 }}>
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//               marginBottom: 24,
//               paddingBottom: 24,
//               borderBottom: "2px solid #f1f5f9",
//             }}>
//             <div>
//               <h2
//                 style={{
//                   fontSize: 28,
//                   fontWeight: 700,
//                   margin: "0 0 8px 0",
//                   color: THEME.text,
//                 }}>
//                 Professional Templates
//               </h2>
//               <p
//                 style={{
//                   fontSize: 15,
//                   color: THEME.sub,
//                   margin: "0 0 4px 0",
//                 }}>
//                 Choose from {templates.length} professionally designed resume templates
//               </p>
//               <p
//                 style={{
//                   fontSize: 13,
//                   color: THEME.muted,
//                   margin: 0,
//                 }}>
//                 Each template has a unique layout optimized for different industries
//               </p>
//             </div>
//             <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//               <div style={{ position: "relative" }}>
//                 <input
//                   placeholder="Search templates..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   style={{
//                     padding: "12px 16px 12px 40px",
//                     border: `1px solid ${THEME.border}`,
//                     borderRadius: 12,
//                     width: 280,
//                     fontSize: 14,
//                     background: THEME.inputBg,
//                     color: THEME.text,
//                     outline: "none",
//                     transition: "all 0.2s",
//                   }}
//                   id="template-search"
//                   onFocus={(e) => {
//                     e.target.style.borderColor = "#2563eb";
//                     e.target.style.boxShadow =
//                       "0 0 0 3px rgba(37, 99, 235, 0.25)";
//                   }}
//                   onBlur={(e) => {
//                     e.target.style.borderColor = THEME.border;
//                     e.target.style.boxShadow = "none";
//                   }}
//                 />
//                 <span
//                   style={{
//                     position: "absolute",
//                     left: 12,
//                     top: "50%",
//                     transform: "translateY(-50%)",
//                     color: THEME.muted,
//                     fontSize: 16,
//                   }}>
//                   🔍
//                 </span>
//               </div>
//               <select
//                 value={category}
//                 onChange={(e) => setCategory(e.target.value)}
//                 style={{
//                   padding: "12px 16px",
//                   border: `1px solid ${THEME.border}`,
//                   borderRadius: 12,
//                   fontSize: 14,
//                   background: THEME.inputBg,
//                   color: THEME.text,
//                   cursor: "pointer",
//                   outline: "none",
//                   minWidth: 150,
//                 }}
//                 id="template-category">
//                 <option value="all">All Templates</option>
//                 <option value="free">Free Templates</option>
//                 <option value="premium">Premium Templates</option>
//               </select>
//             </div>
//           </div>

//           {/* Template Stats
//           <div
//             style={{
//               display: "flex",
//               gap: 16,
//               marginBottom: 24,
//               padding: "16px 20px",
//               background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
//               borderRadius: 12,
//               border: "1px solid #e2e8f0",
//             }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               <span style={{ fontSize: 20 }}>📄</span>
//               <div>
//                 <div
//                   style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
//                   {templates.length} Templates
//                 </div>
//                 <div style={{ fontSize: 12, color: "#64748b" }}>
//                   Total Available
//                 </div>
//               </div>
//             </div>
//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               <span style={{ fontSize: 20 }}>🆓</span>
//               <div>
//                 <div
//                   style={{ fontSize: 14, fontWeight: 600, color: "#059669" }}>
//                   {templates.filter((t) => t.category === "free").length} Free
//                 </div>
//                 <div style={{ fontSize: 12, color: "#64748b" }}>No Cost</div>
//               </div>
//             </div>
//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               <span style={{ fontSize: 20 }}>⭐</span>
//               <div>
//                 <div
//                   style={{ fontSize: 14, fontWeight: 600, color: "#d97706" }}>
//                   {templates.filter((t) => t.category === "premium").length}{" "}
//                   Premium
//                 </div>
//                 <div style={{ fontSize: 12, color: "#64748b" }}>
//                   Advanced Features
//                 </div>
//               </div>
//             </div>
//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               <span style={{ fontSize: 20 }}>🏥</span>
//               <div>
//                 <div
//                   style={{ fontSize: 14, fontWeight: 600, color: "#0369a1" }}>
//                   {templates.filter((t) => t.category === "industry").length}{" "}
//                   Industry
//           </div>
//                 <div style={{ fontSize: 12, color: "#64748b" }}>
//                   Role / sector specific
//                 </div>
//               </div>
//             </div>
//           </div> */}

//           {/* Templates Grid */}
//           {loading ? (
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
//                 gap: 20,
//               }}>
//               {[1, 2, 3, 4, 5, 6].map((i) => (
//                 <div
//                   key={i}
//                   style={{
//                     height: 400,
//                     background: "#f1f5f9",
//                     borderRadius: 16,
//                     animation: "pulse 2s infinite",
//                   }}
//                 />
//               ))}
//             </div>
//           ) : filtered.length === 0 ? (
//             <div
//               style={{
//                 textAlign: "center",
//                 padding: "60px 20px",
//                 background: "#f8fafc",
//                 borderRadius: 16,
//                 border: "1px solid #e2e8f0",
//               }}>
//               <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
//               <h3
//                 style={{
//                   fontSize: 18,
//                   fontWeight: 600,
//                   color: "#0f172a",
//                   marginBottom: 8,
//                 }}>
//                 No templates found
//               </h3>
//               <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
//                 Try adjusting your search or filter criteria
//               </p>
//               <button
//                 onClick={() => {
//                   setSearch("");
//                   setCategory("all");
//                 }}
//                 style={{
//                   padding: "10px 20px",
//                   background: "#2563eb",
//                   color: "white",
//                   border: "none",
//                   borderRadius: 8,
//                   fontWeight: 600,
//                   cursor: "pointer",
//                 }}>
//                 Clear Filters
//               </button>
//             </div>
//           ) : (
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
//                 gap: 20,
//               }}>
//               {filtered.map((t) => {
//                 const isPaid =
//                   t.category === "premium" || t.category === "industry";
//                 const hasAccess =
//                   subscriptionStatus?.hasActiveSubscription &&
//                   (subscriptionStatus?.plan === "premium" ||
//                     subscriptionStatus?.plan === "professional");
//                 const locked = isPaid && !hasAccess;

//                 const handleSelect = locked
//                   ? () => navigate("/pricing")
//                   : resumes.length >= 5
//                   ? () => {
//                       showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
//                         type: "error",
//                         duration: 5000,
//                       });
//                     }
//                   : handleSelectTemplate;
//                 const handlePreview = locked
//                   ? () => navigate("/pricing")
//                   : handlePreviewTemplate;

//                 return (
//                 <TemplateCard
//                   key={t.slug}
//                   template={t}
//                     isPremium={isPaid}
//                     locked={locked}
//                     onSelect={handleSelect}
//                     onPreview={handlePreview}
//                   />
//                 );
//               })}
//             </div>
//           )}
//         </section>

//         {/* Quick Actions */}
//         <section style={{ marginBottom: 40 }}>
//           <h2
//             style={{
//               fontSize: 24,
//               fontWeight: 700,
//               marginBottom: 20,
//               color: "#0f172a",
//             }}>
//             Quick Actions
//           </h2>
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
//               gap: 16,
//             }}>
//             <div
//               style={{
//                 background: resumes.length >= 5
//                   ? "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
//                   : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
//                 border: `1px solid ${resumes.length >= 5 ? "#cbd5e1" : "#bae6fd"}`,
//                 borderRadius: 12,
//                 padding: 20,
//                 cursor: resumes.length >= 5 ? "not-allowed" : "pointer",
//                 transition: "all 0.2s",
//                 opacity: resumes.length >= 5 ? 0.6 : 1,
//               }}
//               onClick={() => {
//                 if (resumes.length >= 5) {
//                   showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to upload a new one.", {
//                     type: "error",
//                     duration: 5000,
//                   });
//                   return;
//                 }
//                 setShowUpload(true);
//               }}
//               onMouseEnter={(e) => {
//                 if (resumes.length < 5) {
//                   e.currentTarget.style.transform = "translateY(-2px)";
//                   e.currentTarget.style.boxShadow =
//                     "0 8px 25px rgba(14, 165, 233, 0.15)";
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.transform = "translateY(0)";
//                 e.currentTarget.style.boxShadow = "none";
//               }}>
//               <div style={{ fontSize: 24, marginBottom: 8 }}>📤</div>
//               <h3
//                 style={{
//                   fontSize: 16,
//                   fontWeight: 600,
//                   margin: "0 0 4px",
//                   color: resumes.length >= 5 ? "#64748b" : "#0c4a6e",
//                 }}>
//                 Start with Existing Resume
//               </h3>
//               <p style={{ fontSize: 13, color: resumes.length >= 5 ? "#94a3b8" : "#0369a1", margin: 0 }}>
//                 {resumes.length >= 5
//                   ? "Resume limit reached (5/5)"
//                   : "Import your existing resume and let AI extract all information"}
//               </p>
//             </div>

//             <div
//               style={{
//                 background: resumes.length >= 5
//                   ? "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
//                   : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
//                 border: `1px solid ${resumes.length >= 5 ? "#cbd5e1" : "#bbf7d0"}`,
//                 borderRadius: 12,
//                 padding: 20,
//                 cursor: resumes.length >= 5 ? "not-allowed" : "pointer",
//                 transition: "all 0.2s",
//                 opacity: resumes.length >= 5 ? 0.6 : 1,
//               }}
//               onClick={() => {
//                 if (resumes.length >= 5) {
//                   showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
//                     type: "error",
//                     duration: 5000,
//                   });
//                   return;
//                 }
//                 if (templates.length > 0) {
//                   handleSelectTemplate(templates[0]);
//                 }
//               }}
//               onMouseEnter={(e) => {
//                 if (resumes.length < 5) {
//                   e.currentTarget.style.transform = "translateY(-2px)";
//                   e.currentTarget.style.boxShadow =
//                     "0 8px 25px rgba(34, 197, 94, 0.15)";
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.transform = "translateY(0)";
//                 e.currentTarget.style.boxShadow = "none";
//               }}>
//               <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
//               <h3
//                 style={{
//                   fontSize: 16,
//                   fontWeight: 600,
//                   margin: "0 0 4px",
//                   color: resumes.length >= 5 ? "#64748b" : "#14532d",
//                 }}>
//                 Start from Scratch
//               </h3>
//               <p style={{ fontSize: 13, color: resumes.length >= 5 ? "#94a3b8" : "#166534", margin: 0 }}>
//                 {resumes.length >= 5
//                   ? "Resume limit reached (5/5)"
//                   : "Create a new resume using our professional templates"}
//               </p>
//             </div>

//             <div
//               style={{
//                 background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
//                 border: "1px solid #fcd34d",
//                 borderRadius: 12,
//                 padding: 20,
//                 cursor: "pointer",
//                 transition: "all 0.2s",
//               }}
//               onClick={() => {
//                 // Scroll to templates section
//                 document
//                   .querySelector('section[style*="marginBottom: 32"]')
//                   ?.scrollIntoView({ behavior: "smooth" });
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.transform = "translateY(-2px)";
//                 e.currentTarget.style.boxShadow =
//                   "0 8px 25px rgba(245, 158, 11, 0.15)";
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.transform = "translateY(0)";
//                 e.currentTarget.style.boxShadow = "none";
//               }}>
//               <div style={{ fontSize: 24, marginBottom: 8 }}>🎨</div>
//               <h3
//                 style={{
//                   fontSize: 16,
//                   fontWeight: 600,
//                   margin: "0 0 4px",
//                   color: "#92400e",
//                 }}>
//                 Browse Templates
//               </h3>
//               <p style={{ fontSize: 13, color: "#b45309", margin: 0 }}>
//                 Explore all available templates and find your perfect design
//               </p>
//             </div>
//           </div>
//         </section>

//       </main>
//       <Footer />

//       {/* Preview Modal */}
//       {showPreviewModal && (selectedTemplate || selectedResume) && (
//         <TemplatePreviewModal
//           template={selectedTemplate}
//           resume={selectedResume}
//           resumePreview={selectedResumePreview}
//           onClose={() => {
//             setShowPreviewModal(false);
//             setSelectedTemplate(null);
//             setSelectedResume(null);
//             setSelectedResumePreview("");
//           }}
//           onSelect={handleSelectTemplate}
//         />
//       )}

//       {/* Account Deletion Confirmation Modal */}
//       {showDeleteAccountModal && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(15,23,42,0.55)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 80,
//           }}>
//           <div
//             style={{
//               background: "#ffffff",
//               padding: 24,
//               borderRadius: 16,
//               boxShadow: "0 22px 55px rgba(15,23,42,0.45)",
//               maxWidth: 480,
//               width: "90%",
//             }}>
//             <h2
//               style={{
//                 margin: "0 0 8px",
//                 fontSize: 20,
//                 fontWeight: 700,
//                 color: "#0f172a",
//               }}>
//               Delete your account?
//             </h2>
//             <p
//               style={{
//                 margin: "0 0 8px",
//                 fontSize: 14,
//                 color: "#475569",
//                 lineHeight: 1.5,
//               }}>
//               This will immediately sign you out and mark your account for deletion. Your account
//               and all associated data (resumes, templates, billing info) will no longer be
//               accessible in the app.
//             </p>
//             <p
//               style={{
//                 margin: "0 0 16px",
//                 fontSize: 13,
//                 color: "#b91c1c",
//                 lineHeight: 1.5,
//               }}>
//               Data may be retained securely for up to 30 days for legal and recovery purposes.
//               After that, it may be permanently removed and cannot be restored.
//             </p>
//             <p
//               style={{
//                 margin: "0 0 20px",
//                 fontSize: 13,
//                 color: "#64748b",
//               }}>
//               If you delete by mistake, contact support within 30 days and we may be able to help
//               restore your account.
//             </p>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "flex-end",
//                 gap: 12,
//                 marginTop: 8,
//               }}>
//               <button
//                 type="button"
//                 onClick={() => setShowDeleteAccountModal(false)}
//                 style={{
//                   padding: "9px 18px",
//                   borderRadius: 999,
//                   border: "1px solid #cbd5e1",
//                   background: "#ffffff",
//                   color: "#0f172a",
//                   fontSize: 13,
//                   fontWeight: 500,
//                   cursor: deletingAccount ? "not-allowed" : "pointer",
//                   opacity: deletingAccount ? 0.6 : 1,
//                 }}>
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={async () => {
//                   if (deletingAccount) return;
//                   setDeletingAccount(true);
//                   try {
//                     const res = await api.delete("/api/v1/auth/delete");
//                     const msg =
//                       res?.data?.message ||
//                       res?.data?.data?.message ||
//                       "Account deleted. You have up to 30 days to request restoration.";
//                     showToast(msg, { type: "success", duration: 5000 });
//                     localStorage.clear();
//                     window.location.href = "/signin";
//                   } catch (err) {
//                     console.error(err);
//                     const msg =
//                       err.response?.data?.message ||
//                       "Failed to delete account. Please try again.";
//                     showToast(msg, { type: "error" });
//                     setDeletingAccount(false);
//                   }
//                 }}
//                 style={{
//                   padding: "9px 20px",
//                   borderRadius: 999,
//                   border: "1px solid #fecaca",
//                   background: "#fee2e2",
//                   color: "#b91c1c",
//                   fontSize: 13,
//                   fontWeight: 600,
//                   cursor: deletingAccount ? "not-allowed" : "pointer",
//                   opacity: deletingAccount ? 0.7 : 1,
//                 }}>
//                 {deletingAccount ? "Deleting..." : "Yes, delete my account"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Preview Modal Component
// function TemplatePreviewModal({
//   template,
//   resume,
//   resumePreview,
//   onClose,
//   onSelect,
// }) {
//   const [previewHtml, setPreviewHtml] = useState("");
//   const [loading, setLoading] = useState(true);
//   const isExportingRef = useRef(false);
//   const exportClientWord = (e) => {
//     if (e) {
//       e.preventDefault();
//       e.stopPropagation();
//     }
//     if (isExportingRef.current) return; // Prevent duplicate calls
//     isExportingRef.current = true;

//     const html = previewHtml || resumePreview || "";
//     if (!html) {
//       showToast("No preview to export.", { type: "error" });
//       isExportingRef.current = false;
//       return;
//     }
//     const full = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:1in} body{font-family:Arial,Helvetica,sans-serif}</style></head><body>${html}</body></html>`;
//     const blob = new Blob([full], { type: "application/msword" });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     const title =
//       (resume?.title || template?.name || "resume")
//         .replace(/[^\w\-\s]+/g, "")
//         .trim() || "resume";
//     a.href = url;
//     a.download = `${title}-${Date.now()}.doc`;
//     document.body.appendChild(a);
//     a.click();
//     window.URL.revokeObjectURL(url);
//     document.body.removeChild(a);
//     showToast("Exported Word (.doc) from preview", {
//       type: "success",
//       duration: 1800,
//     });

//     // Reset after a short delay to allow download to start
//     setTimeout(() => {
//       isExportingRef.current = false;
//     }, 1000);
//   };

//   useEffect(() => {
//     async function createPreview() {
//       try {
//         setLoading(true);

//         // If we have a resume preview, use it directly
//         if (resumePreview && resume) {
//           console.log("🎯 Using resume preview directly:", {
//             resumePreview: resumePreview.substring(0, 100) + "...",
//             resume,
//           });
//           setPreviewHtml(resumePreview);
//           setLoading(false);
//           return;
//         }

//         // Use public template preview endpoint (no auth required, works for premium templates)
//         if (!template?.slug) {
//           console.error("No template available for preview");
//           setPreviewHtml("<div>No template available for preview</div>");
//           setLoading(false);
//           return;
//         }

//         // Use the public template preview endpoint - allows previewing premium templates
//         // This endpoint is public and doesn't require authentication or premium access
//         try {
//           // Use fetch directly since we need HTML text, not JSON
//           const previewResponse = await fetch(
//             `/api/v1/templates/${template.slug}/preview`,
//             {
//               method: "GET",
//               headers: {
//                 "Content-Type": "text/html",
//               },
//               credentials: "include", // Include cookies for CORS
//             }
//           );

//           if (!previewResponse.ok) {
//             throw new Error(
//               `Preview failed: ${previewResponse.status} ${previewResponse.statusText}`
//             );
//           }

//           const htmlContent = await previewResponse.text();
//           setPreviewHtml(htmlContent);
//           setLoading(false);
//           return;
//         } catch (previewErr) {
//           console.error("Template preview failed:", previewErr);
//           setPreviewHtml(`<div style="padding: 20px; text-align: center;">
//             <h3>Preview Unavailable</h3>
//             <p>Unable to load template preview. Please try again later.</p>
//             <p style="color: #666; font-size: 12px;">${previewErr.message}</p>
//           </div>`);
//           setLoading(false);
//         }

//         // OLD METHOD - Creates temporary resume (hits premium restriction)
//         // Use this only if template preview endpoint fails
//         /*
//         const { data } = await api.post("/api/v1/resumes", {
//           title: "Preview",
//           templateSlug: template.slug,
//         });

//         const tempResumeId = data.data.resumeId;

//         // OLD METHOD - No longer needed, using public template preview endpoint above
//         /*
//         // Add sample data
//         await api.patch(`/api/v1/resumes/${tempResumeId}`, {
//           contact: {
//             fullName: "John Doe",
//             email: "john.doe@example.com",
//             phone: "+1 (555) 123-4567",
//             address: "San Francisco, CA",
//             website: "johndoe.com",
//             headline: "Senior Software Engineer",
//             summary:
//               "Experienced software engineer with 8+ years of expertise in full-stack development, team leadership, and scalable system architecture.",
//           },
//           experience: [
//             {
//               title: "Senior Software Engineer",
//               company: "Tech Corp",
//               location: "San Francisco, CA",
//               startDate: "2020-01-01",
//               current: true,
//               bullets: [
//                 "Led development of microservices architecture serving 1M+ users",
//                 "Mentored team of 5 junior developers and improved code quality by 40%",
//                 "Implemented CI/CD pipeline reducing deployment time by 60%",
//                 "Collaborated with product team to deliver features on time and within budget",
//               ],
//             },
//             {
//               title: "Software Engineer",
//               company: "StartupXYZ",
//               location: "New York, NY",
//               startDate: "2018-06-01",
//               endDate: "2019-12-31",
//               bullets: [
//                 "Developed React-based frontend applications with 99.9% uptime",
//                 "Built RESTful APIs using Node.js and PostgreSQL",
//                 "Participated in agile development process and code reviews",
//               ],
//             },
//           ],
//           education: [
//             {
//               degree: "Bachelor of Science in Computer Science",
//               school: "University of California, Berkeley",
//               location: "Berkeley, CA",
//               startDate: "2013-09-01",
//               endDate: "2017-05-31",
//               details: [
//                 "GPA: 3.8/4.0",
//                 "Dean's List",
//                 "Relevant Coursework: Data Structures, Algorithms, Software Engineering",
//               ],
//             },
//           ],
//           skills: [
//             { name: "JavaScript", level: 90 },
//             { name: "React", level: 85 },
//             { name: "Node.js", level: 85 },
//             { name: "Python", level: 80 },
//             { name: "PostgreSQL", level: 75 },
//             { name: "AWS", level: 70 },
//           ],
//         });

//         // Get preview HTML
//         const previewRes = await api.get(
//           `/api/v1/resumes/${tempResumeId}/preview`
//         );
//         setPreviewHtml(
//           previewRes.data.data?.html || previewRes.data.html || ""
//         );

//         // Clean up temporary resume
//         await api.delete(`/api/v1/resumes/${tempResumeId}`);
//         */
//       } catch (error) {
//         console.error("Preview failed:", error);
//         setPreviewHtml("<div>Failed to load preview</div>");
//       } finally {
//         setLoading(false);
//       }
//     }

//     createPreview();
//   }, [template?.slug, resumePreview, resume]);

//   return (
//     <div
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         background: "rgba(0, 0, 0, 0.5)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 1000,
//         padding: "20px",
//       }}
//       onClick={onClose}>
//       <div
//         style={{
//           background: "white",
//           borderRadius: "12px",
//           width: "90vw",
//           maxWidth: "1200px",
//           maxHeight: "90vh",
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}
//         onClick={(e) => e.stopPropagation()}>
//         {/* Modal Header */}
//         <div
//           style={{
//             padding: "20px",
//             borderBottom: "1px solid #e5e7eb",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}>
//           <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
//             {resume
//               ? `${resume.title || "Resume"} Preview`
//               : `${template?.name || "Template"} Preview`}
//           </h2>
//           <button
//             onClick={onClose}
//             style={{
//               background: "none",
//               border: "none",
//               fontSize: "24px",
//               cursor: "pointer",
//               color: "#6b7280",
//               padding: "4px",
//             }}>
//             ×
//           </button>
//         </div>

//         {/* Modal Body */}
//         <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
//           {loading ? (
//             <div style={{ textAlign: "center", padding: "40px" }}>
//               <div>Loading preview...</div>
//             </div>
//           ) : (
//             <iframe
//               srcDoc={previewHtml}
//               style={{
//                 width: "100%",
//                 height: "600px",
//                 border: "none",
//                 borderRadius: "8px",
//               }}
//               sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
//               title="Resume Preview"
//             />
//           )}
//         </div>

//         {/* Modal Footer */}
//         <div
//           style={{
//             padding: "20px",
//             borderTop: "1px solid #e5e7eb",
//             display: "flex",
//             gap: "12px",
//             justifyContent: "flex-end",
//           }}>
//           <button
//             onClick={onClose}
//             style={{
//               padding: "10px 20px",
//               borderRadius: "8px",
//               border: "1px solid #d1d5db",
//               background: "white",
//               color: "#374151",
//               fontWeight: "600",
//               cursor: "pointer",
//             }}>
//             Cancel
//           </button>
//           {/* {resume ? (
//             <button
//               onClick={exportClientWord}
//               style={{
//                 padding: "10px 20px",
//                 borderRadius: "8px",
//                 border: "none",
//                 background: "#2563eb",
//                 color: "white",
//                 fontWeight: "600",
//                 cursor: "pointer",
//               }}>
//               Download DOCX
//             </button>
//           ) : null} */}
//           {/* <button
//             onClick={() => onSelect(template)}
//             style={{
//               padding: "10px 20px",
//               borderRadius: "8px",
//               border: "none",
//               background: template?.ui?.accentColor || "#2563eb",
//               color: "white",
//               fontWeight: "600",
//               cursor: "pointer",
//             }}>
//             Use This Template
//           </button> */}
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../lib/api.js";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../context/AuthContext.jsx";
import ResumeUpload from "./ResumeUpload.jsx";
import TemplateCard from "./TemplateCard.jsx";
import { showToast } from "../lib/toast";
import { Clock } from 'lucide-react';
import { HandWaving, MagnifyingGlass, MagnifyingGlassIcon, ReadCvLogo, Sparkle, TrayArrowUp, UploadIcon } from "@phosphor-icons/react";

const HIDDEN_TEMPLATE_NAMES = new Set([
  // "Modern Flat",
  // "Scandinavian Modern",
  // "Swiss Design",
  // "Tech Lead",
  // "French Elegance",
  // "European Executive",
  // "Asian Professional",
  // "Innovative Modern",
  // "Business Consultant",
  // "Bold Statement",
  // "Designer Portfolio",
  // "Creative Blue",
  // "Executive Suite",
  // "Finance Professional",
  // "Healthcare Provider",
  // "Global Executive",
  // "Minimalist",
  // "Professional Elegant",
  // "Research Scholar",
  // "Simple Clean",
  // "Classic Business",
  // "German Precision",
  // "Japanese Minimalist",
  // "Startup Founder",
  // "Academic Scholar",
  // "Modern Executive",
  // "Operations Manager",
  // "Marketing Pro",
  // "Corporate Professional",
]);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [uploadTemplateSlug, setUploadTemplateSlug] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedResumePreview, setSelectedResumePreview] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await api.get("/api/v1/billing/subscription");
        setSubscriptionStatus(response.data?.data);
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      }
    };
    fetchSubscriptionStatus();
  }, [user]);

  // Consistent neutral palette so inputs look identical in both OS themes
  const THEME = {
        text: "#0f172a",
        sub: "#475569",
        muted: "#64748b",
    border: "#d0d7e3",
        inputBg: "#ffffff",
      };

  const formatPlanName = (plan) =>
    plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Free";

  const planAccent = (plan) => {
    if (plan === "premium") return "#7c3aed";
    if (plan === "professional") return "#2563eb";
    return "#0f172a";
  };

  const formatPeriodEnd = (value) => {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return null;
      return date.toLocaleDateString();
    } catch {
      return null;
    }
      };

  // Check for Stripe checkout success
  const paymentToastShown = useRef(false);
  useEffect(() => {
    if (paymentToastShown.current) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const success = urlParams.get("success");

    if (success === "true" && sessionId) {
      paymentToastShown.current = true;
      showToast("Payment successful! Your subscription is now active.", {
        type: "success",
        duration: 5000,
      });
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard");

      // Refresh user data
      if (user) {
        // Wait a bit for webhook to process, then reload
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else if (urlParams.get("canceled") === "true" && !paymentToastShown.current) {
      paymentToastShown.current = true;
      showToast("Payment was canceled.", {
        type: "error",
        duration: 3000,
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
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
        if (!mounted) return;
        
        const items = t.data?.data?.items || [];
        const visibleTemplates = items.filter((tpl) => {
          const name = (tpl?.name || "").trim();
          return !HIDDEN_TEMPLATE_NAMES.has(name);
        });
        const sorted = [...visibleTemplates].sort((a, b) => {
          const an = (a.name || a.slug || "").toLowerCase();
          const bn = (b.name || b.slug || "").toLowerCase();
          return an.localeCompare(bn);
        });
        setTemplates(sorted);
        const resumeItems = r.data?.data?.items || [];
        setResumes(resumeItems);
        
        // Show warning if approaching resume limit (only once per session)
        const resumeCount = r.data?.data?.count || resumeItems.length;
        if (resumeCount >= 4 && !toastShownRef.current) {
          toastShownRef.current = true;
          showToast(`You have ${resumeCount}/5 resumes. Consider deleting some to create new ones.`, {
            type: "warning",
            duration: 5000,
          });
        }
      } finally {
        if (mounted) {
        setLoading(false);
        }
      }
    })();
    
    return () => {
      mounted = false;
    };
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
      showToast("Resume deleted successfully", { type: "success" });
    } catch (err) {
      showToast("Failed to delete resume. Please try again.", { type: "error" });
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const [duplicating, setDuplicating] = useState(null);

  const handleDuplicateResume = async (resumeId) => {
    // Check resume limit before duplicating
    if (resumes.length >= 5) {
      showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to duplicate.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    setDuplicating(resumeId);
    try {
      const response = await api.post(`/api/v1/resumes/${resumeId}/duplicate`);
      const newResume = response.data?.data?.resume;
      if (newResume) {
        setResumes((prev) => [newResume, ...prev]);
        showToast("Resume duplicated successfully!", { type: "success" });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to duplicate resume";
      showToast(errorMsg, { type: "error" });
      console.error(err);
    } finally {
      setDuplicating(null);
    }
  };

  const handlePreviewResume = async (resumeId) => {
    if (!resumeId) {
      console.error("❌ No resume ID provided");
      alert("Invalid resume ID. Please try again.");
      return;
    }

    console.log("🔍 handlePreviewResume called with ID:", resumeId);
    setIsPreviewLoading(true);
    try {
      // First, get the resume to verify it exists and belongs to user
      let resumeRes;
      try {
        resumeRes = await api.get(`/api/v1/resumes/${resumeId}`);
      } catch (err) {
        if (err.response?.status === 404) {
          alert("Resume not found. It may have been deleted.");
          return;
        }
        if (err.response?.status === 403) {
          alert("You don't have permission to view this resume.");
          return;
        }
        throw err;
      }

      const resumeData = resumeRes.data?.data?.resume || resumeRes.data?.data;
      if (!resumeData) {
        alert("Resume data not found. Please try again.");
        return;
      }

      // Get preview HTML
      let previewHtml = "";
      try {
        const previewRes = await api.get(`/api/v1/resumes/${resumeId}/preview`);
        previewHtml =
          previewRes.data?.data?.html || previewRes.data?.html || "";
      } catch (err) {
        console.warn("Server preview failed:", err);
        if (err.response?.status === 404) {
          alert(
            "Resume preview not available. The resume may not have a template assigned."
          );
          return;
        }
        // Continue with empty preview - will use fallback
      }

      // Find template
      const templateSlug = resumeData.templateSlug || resumeData.template?.slug;
      const template =
        templates.find((t) => t.slug === templateSlug) || templates[0];

      if (!template) {
        console.warn(
          "Template not found for resume, using first available template"
        );
      }

      console.log("💾 Setting modal data:", {
        resumeData,
        previewHtml: previewHtml.substring(0, 100) + "...",
        template: template?.name,
      });

      setSelectedResume(resumeData);
      setSelectedResumePreview(previewHtml);
      setSelectedTemplate(template);
      setShowPreviewModal(true);
      console.log("✅ Modal should be showing now");
    } catch (error) {
      console.error("❌ Failed to preview resume:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      alert(
        `Failed to load resume preview: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    if (!template?.slug) {
      console.error("No template selected");
      return;
    }

    // Check resume limit before creating
    if (resumes.length >= 5) {
      showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
        type: "error",
        duration: 5000,
      });
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
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create resume.";

      // Show specific message for premium template access
      if (error.response?.status === 402) {
        const shouldUpgrade = window.confirm(
          `${errorMessage}\n\nWould you like to upgrade to Premium to access this template?`
        );
        if (shouldUpgrade) {
          navigate("/pricing");
        }
      } else {
        alert(errorMessage);
      }
    }
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  return (
    <div style={{ position: "relative", background: "#f2f4f7", minHeight: "100vh" }}>
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
      {isPreviewLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 45,
          }}>
          <div
            style={{
              background: "#ffffff",
              padding: "20px 26px",
              borderRadius: 14,
              boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
              textAlign: "center",
              minWidth: 260,
            }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "999px",
                border: "4px solid #e5e7eb",
                borderTopColor: "#2563eb",
                margin: "0 auto 12px",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              Loading preview…
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Generating a live preview of your resume.
            </div>
          </div>
        </div>
      )}
      {/* {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
          }}>
          <div
            style={{
              background: "#ffffff",
              padding: "20px 26px",
              borderRadius: 14,
              boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
              textAlign: "center",
              minWidth: 240,
            }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "999px",
                border: "4px solid #e5e7eb",
                borderTopColor: "#2563eb",
                margin: "0 auto 12px",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              Loading templates…
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Fetching your templates and resumes.
            </div>
            <style>
              {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
          </div>
        </div>
      )} */}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        <style>{`#template-search::placeholder{color:${THEME.muted}}`}</style>

        {subscriptionStatus && (
        <div
          style={{
              background: subscriptionStatus.hasActiveSubscription
                ? `linear-gradient(135deg, ${planAccent(subscriptionStatus.plan || "free")}15 0%, ${planAccent(subscriptionStatus.plan || "free")}08 100%)`
                : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: `2px solid ${subscriptionStatus.hasActiveSubscription ? planAccent(subscriptionStatus.plan || "free") + "30" : "#e2e8f0"}`,
              borderRadius: 20,
              padding: 24,
              marginBottom: 32,
            display: "flex",
            alignItems: "center",
              gap: 20,
              boxShadow: subscriptionStatus.hasActiveSubscription
                ? `0 4px 20px ${planAccent(subscriptionStatus.plan || "free")}15`
                : "0 2px 8px rgba(15, 23, 42, 0.08)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = subscriptionStatus.hasActiveSubscription
                ? `0 8px 30px ${planAccent(subscriptionStatus.plan || "free")}20`
                : "0 4px 12px rgba(15, 23, 42, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = subscriptionStatus.hasActiveSubscription
                ? `0 4px 20px ${planAccent(subscriptionStatus.plan || "free")}15`
                : "0 2px 8px rgba(15, 23, 42, 0.08)";
            }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: subscriptionStatus.hasActiveSubscription
                  ? `linear-gradient(135deg, ${planAccent(subscriptionStatus.plan || "free")} 0%, ${planAccent(subscriptionStatus.plan || "free")}dd 100%)`
                  : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 24,
                boxShadow: `0 4px 12px ${planAccent(subscriptionStatus.plan || "free")}40`,
              }}>
              {subscriptionStatus.plan
                ? subscriptionStatus.plan.charAt(0).toUpperCase()
                : "F"}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: THEME.text,
                  marginBottom: 6,
                }}>
                {subscriptionStatus.hasActiveSubscription
                  ? `${formatPlanName(subscriptionStatus.plan)} Plan`
                  : "Free Plan"}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: THEME.sub,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                {subscriptionStatus.hasActiveSubscription ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#10b981",
                        boxShadow: "0 0 0 2px #10b98130",
                      }}
                    />
                    {formatPeriodEnd(subscriptionStatus.currentPeriodEnd)
                      ? `Renews on ${formatPeriodEnd(
                          subscriptionStatus.currentPeriodEnd
                        )}`
                      : "Active subscription"}
                  </>
                ) : (
                  <>
                    <Sparkle
                      size={16}
                      weight="bold"
                      style={{
                        color: "#f59e0b",
                        filter: "drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3))",
                      }}
                    />
                    Unlock Premium features like AI, unlimited exports, and more.
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              style={{
                background: subscriptionStatus.hasActiveSubscription
                  ? planAccent(subscriptionStatus.plan || "free")
                  : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                boxShadow: subscriptionStatus.hasActiveSubscription
                  ? `0 4px 12px ${planAccent(subscriptionStatus.plan || "free")}40`
                  : "0 4px 12px rgba(37, 99, 235, 0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = subscriptionStatus.hasActiveSubscription
                  ? `0 6px 16px ${planAccent(subscriptionStatus.plan || "free")}50`
                  : "0 6px 16px rgba(37, 99, 235, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = subscriptionStatus.hasActiveSubscription
                  ? `0 4px 12px ${planAccent(subscriptionStatus.plan || "free")}40`
                  : "0 4px 12px rgba(37, 99, 235, 0.3)";
              }}>
              {subscriptionStatus.hasActiveSubscription ? "Manage plan" : "Upgrade Now"}
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: "2px solid #f1f5f9",
          }}>
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                margin: "0 0 8px 0",
                color: "#0f172a",
                background: "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
              <HandWaving
                size={32}
                weight="bold"
                style={{
                  color: "#f59e0b",
                  filter: "drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))",
                }}
              />
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "#64748b",
                margin: 0,
                fontWeight: 400,
              }}>
              Manage your resumes and create professional documents
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => {
              if (resumes.length >= 5) {
                showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to upload a new one.", {
                  type: "error",
                  duration: 5000,
                });
                return;
              }
              setShowUpload(true);
            }}
            disabled={resumes.length >= 5}
            style={{
                background: resumes.length >= 5
                  ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                  : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#fff",
              border: "none",
                borderRadius: 12,
                padding: "12px 20px",
              fontWeight: 600,
              cursor: resumes.length >= 5 ? "not-allowed" : "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
                boxShadow: resumes.length >= 5
                  ? "none"
                  : "0 4px 12px rgba(37, 99, 235, 0.3)",
                transition: "all 0.2s ease",
                opacity: resumes.length >= 5 ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (resumes.length < 5) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = resumes.length >= 5
                  ? "none"
                  : "0 4px 12px rgba(37, 99, 235, 0.3)";
            }}>
            <UploadIcon size={18} color="#fbbf24" weight="bold" />
            {resumes.length >= 5 ? "Limit Reached" : "Start with Existing Resume"}
          </button>
            <button
              data-variant="error"
              onClick={() => setShowDeleteAccountModal(true)}
              style={{
                background: "#fff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fef2f2";
                e.currentTarget.style.borderColor = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#fecaca";
              }}>
              Delete Account
          </button>
          </div>
        </div>

        {/* Your Resumes Section - Moved to top */}
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}>
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: "0 0 6px 0",
                  color: "#0f172a",
                }}>
                Your Resumes{" "}
                {!loading && resumes.length > 0 ? `(${resumes.length}/5)` : ""}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  margin: 0,
                }}>
                {loading
                  ? "Loading your resumes..."
                  : resumes.length === 0
                  ? "Create your first professional resume"
                  : "Manage and edit your saved resumes"}
              </p>
              {resumes.length >= 4 && resumes.length < 5 && !loading && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    background: "#fef3c7",
                    border: "1px solid #fcd34d",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#92400e",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                  <span>⚠️</span>
                  <span>
                    You are approaching your resume limit (5). Consider deleting old resumes.
                </span>
                </div>
              )}
              {resumes.length >= 5 && !loading && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                  <span>🚫</span>
                  <span>
                    You have reached the maximum limit of 5 resumes. Delete a resume to create a new one.
                  </span>
                </div>
              )}
            </div>
          </div>
          {loading ? (
            <div
              style={{
                padding: "48px 32px",
                background: "#f8fafc",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                color: "#475569",
              }}>
              Loading your resumes…
            </div>
          ) : resumes.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 40px",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: 24,
                border: "2px dashed #cbd5e1",
                position: "relative",
                overflow: "hidden",
              }}>
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  background: "radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  fontSize: 64,
                  marginBottom: 20,
                  position: "relative",
                  zIndex: 1,
                }}>
                📄
              </div>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 12,
                  position: "relative",
                  zIndex: 1,
                }}>
                No resumes yet
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "#64748b",
                  marginBottom: 32,
                  maxWidth: 400,
                  margin: "0 auto 32px",
                  position: "relative",
                  zIndex: 1,
                }}>
                Create your first professional resume using our templates and start building your career
              </p>
              <button
                onClick={() => {
                  if (resumes.length >= 5) {
                    showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
                      type: "error",
                      duration: 5000,
                    });
                    return;
                  }
                  if (templates.length > 0) {
                    handleSelectTemplate(templates[0]);
                  }
                }}
                disabled={resumes.length >= 5}
                style={{
                  padding: "14px 32px",
                  background: resumes.length >= 5
                    ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 600,
                  cursor: resumes.length >= 5 ? "not-allowed" : "pointer",
                  fontSize: 15,
                  boxShadow: resumes.length >= 5
                    ? "none"
                    : "0 4px 16px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.2s ease",
                  position: "relative",
                  zIndex: 1,
                  opacity: resumes.length >= 5 ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (resumes.length < 5) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = resumes.length >= 5
                    ? "none"
                    : "0 4px 16px rgba(37, 99, 235, 0.3)";
                }}>
                {resumes.length >= 5 ? "🚫 Limit Reached (5/5)" : "✨ Create Your First Resume"}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
                marginBottom: 32,
              }}>
              {resumes.map((r, idx) => {
                const template = templates.find(
                  (t) => t.slug === r.templateSlug
                );
                // Use templateName from resume if available (from duplicate/create), otherwise find from templates array
                const templateName =
                  r.templateName || template?.name || r.templateSlug || "Unknown";
                const templateColor = template?.ui?.accentColor || "#2563eb";
                const lastUpdated = r.updatedAt
                  ? new Date(r.updatedAt).toLocaleDateString()
                  : "";
                const isPremium = template?.category === "premium";

                return (
                  <div
                    key={r._id || r.id || idx}
                    style={{
                      border: `2px solid ${templateColor}15`,
                      borderRadius: 20,
                      background: "#fff",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = `0 16px 32px ${templateColor}25`;
                      e.currentTarget.style.borderColor = `${templateColor}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.08)";
                      e.currentTarget.style.borderColor = `${templateColor}15`;
                    }}>
                    {/* Template Preview Header */}
                    <div
                      style={{
                        height: "6px",
                        background: `linear-gradient(90deg, ${templateColor} 0%, ${templateColor}dd 50%, ${templateColor}80 100%)`,
                      }}
                    />

                    <div style={{ padding: 24 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 16,
                        }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            background: `linear-gradient(135deg, ${templateColor}15 0%, ${templateColor}08 100%)`,
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            border: `1px solid ${templateColor}20`,
                          }}>
                          <ReadCvLogo 
                            size={24} 
                            weight="regular" 
                            color={templateColor}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 18,
                              color: "#0f172a",
                              marginBottom: 4,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            {r.title || "Untitled Resume"}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}>
                            <span>{templateName}</span>
                            {isPremium && (
                              <span
                                style={{
                                  background: "#fbbf24",
                                  color: "#fff",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}>
                                PREMIUM
                </span>
                            )}
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
                            gap: 6,
                            padding: "8px 12px",
                            background: "#f8fafc",
                            borderRadius: 8,
                          }}>
                          <Clock size={12} weight="bold" color="#64748b" style={{opacity: 0.8}} />
                          <span>Last updated: {lastUpdated}</span>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          data-variant="warning"
                          onClick={() =>
                            navigate("/builder", {
                              state: { resumeId: r._id || r.id },
                            })
                          }
                          style={{
                            flex: "1 1 auto",
                            minWidth: "100px",
                            padding: "10px 16px",
                            borderRadius: 10,
                            background: `linear-gradient(135deg, ${templateColor} 0%, ${templateColor}dd 100%)`,
                            color: "white",
                            border: "none",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 2px 8px ${templateColor}30`,
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = `0 4px 12px ${templateColor}40`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = `0 2px 8px ${templateColor}30`;
                          }}>
                          Edit
                        </button>
                        <button
                        data-variant="success"
                          onClick={() => {
                            handlePreviewResume(r._id || r.id);
                          }}
                          style={{
                            flex: "1 1 auto",
                            minWidth: "100px",
                            padding: "10px 16px",
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(5, 150, 105, 0.3)";
                          }}>
                          Preview
                        </button>
                        <button
                          onClick={() => handleDuplicateResume(r._id || r.id)}
                          disabled={duplicating === (r._id || r.id) || resumes.length >= 5}
                          style={{
                            flex: "1 1 auto",
                            minWidth: "100px",
                            padding: "10px 16px",
                            borderRadius: 10,
                            background: resumes.length >= 5 ? "#f1f5f9" : "#fff",
                            color: resumes.length >= 5 ? "#94a3b8" : "#2563eb",
                            border: `1.5px solid ${resumes.length >= 5 ? "#cbd5e1" : "#93c5fd"}`,
                            cursor:
                              duplicating === (r._id || r.id) || resumes.length >= 5
                                ? "not-allowed"
                                : "pointer",
                            opacity: duplicating === (r._id || r.id) || resumes.length >= 5 ? 0.6 : 1,
                            fontSize: 13,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (duplicating !== (r._id || r.id) && resumes.length < 5) {
                              e.currentTarget.style.background = "#eff6ff";
                              e.currentTarget.style.borderColor = "#60a5fa";
                              e.currentTarget.style.transform = "translateY(-1px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = resumes.length >= 5 ? "#f1f5f9" : "#fff";
                            e.currentTarget.style.borderColor = resumes.length >= 5 ? "#cbd5e1" : "#93c5fd";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                          title={resumes.length >= 5 ? "Resume limit reached (5/5)" : "Duplicate Resume"}>
                          {duplicating === (r._id || r.id) ? "Duplicating..." : "Duplicate"}
                        </button>
                        <button
                          data-variant="error"
                          onClick={() => handleDeleteResume(r._id || r.id)}
                          disabled={deleting === (r._id || r.id)}
                          style={{
                            flex: "1 1 auto",
                            minWidth: "100px",
                            padding: "10px 16px",
                            borderRadius: 10,
                            background: "#fff",
                            color: "#dc2626",
                            border: "1.5px solid #fca5a5",
                            cursor:
                              deleting === (r._id || r.id)
                                ? "not-allowed"
                                : "pointer",
                            opacity: deleting === (r._id || r.id) ? 0.6 : 1,
                            fontSize: 13,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (deleting !== (r._id || r.id)) {
                              e.currentTarget.style.background = "#fef2f2";
                              e.currentTarget.style.borderColor = "#f87171";
                              e.currentTarget.style.transform = "translateY(-1px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.borderColor = "#fca5a5";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}>
                          {deleting === (r._id || r.id) ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Professional Templates Section - Moved below resumes */}
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: "2px solid #f1f5f9",
            }}>
            <div>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  margin: "0 0 8px 0",
                  color: THEME.text,
                }}>
                Professional Templates
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: THEME.sub,
                  margin: "0 0 4px 0",
                }}>
                Choose from {templates.length} professionally designed resume templates
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: THEME.muted,
                  margin: 0,
                }}>
                Each template has a unique layout optimized for different industries
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <MagnifyingGlassIcon size={16} weight="duotone" color="#2563eb"/>
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
                  minWidth: 150,
                }}
                id="template-category">
                <option value="all">All Templates</option>
                <option value="free">Free Templates</option>
                <option value="premium">Premium Templates</option>
              </select>
            </div>
          </div>

          {/* Template Stats
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏥</span>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#0369a1" }}>
                  {templates.filter((t) => t.category === "industry").length}{" "}
                  Industry
          </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Role / sector specific
                </div>
              </div>
            </div>
          </div> */}

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
              {filtered.map((t) => {
                const isPaid =
                  t.category === "premium" || t.category === "industry";
                const hasAccess =
                  subscriptionStatus?.hasActiveSubscription &&
                  (subscriptionStatus?.plan === "premium" ||
                    subscriptionStatus?.plan === "professional");
                const locked = isPaid && !hasAccess;

                const handleSelect = locked
                  ? () => navigate("/pricing")
                  : resumes.length >= 5
                  ? () => {
                      showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
                        type: "error",
                        duration: 5000,
                      });
                    }
                  : handleSelectTemplate;
                const handlePreview = locked
                  ? () => navigate("/pricing")
                  : handlePreviewTemplate;

                return (
                <TemplateCard
                  key={t.slug}
                  template={t}
                    isPremium={isPaid}
                    locked={locked}
                    onSelect={handleSelect}
                    onPreview={handlePreview}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        {/* <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 20,
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
                background: resumes.length >= 5
                  ? "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
                  : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                border: `1px solid ${resumes.length >= 5 ? "#cbd5e1" : "#bae6fd"}`,
                borderRadius: 12,
                padding: 20,
                cursor: resumes.length >= 5 ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: resumes.length >= 5 ? 0.6 : 1,
              }}
              onClick={() => {
                if (resumes.length >= 5) {
                  showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to upload a new one.", {
                    type: "error",
                    duration: 5000,
                  });
                  return;
                }
                setShowUpload(true);
              }}
              onMouseEnter={(e) => {
                if (resumes.length < 5) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(14, 165, 233, 0.15)";
                }
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
                  color: resumes.length >= 5 ? "#64748b" : "#0c4a6e",
                }}>
                Start with Existing Resume
              </h3>
              <p style={{ fontSize: 13, color: resumes.length >= 5 ? "#94a3b8" : "#0369a1", margin: 0 }}>
                {resumes.length >= 5
                  ? "Resume limit reached (5/5)"
                  : "Import your existing resume and let AI extract all information"}
              </p>
            </div>

            <div
              style={{
                background: resumes.length >= 5
                  ? "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
                  : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                border: `1px solid ${resumes.length >= 5 ? "#cbd5e1" : "#bbf7d0"}`,
                borderRadius: 12,
                padding: 20,
                cursor: resumes.length >= 5 ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: resumes.length >= 5 ? 0.6 : 1,
              }}
              onClick={() => {
                if (resumes.length >= 5) {
                  showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
                    type: "error",
                    duration: 5000,
                  });
                  return;
                }
                if (templates.length > 0) {
                  handleSelectTemplate(templates[0]);
                }
              }}
              onMouseEnter={(e) => {
                if (resumes.length < 5) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(34, 197, 94, 0.15)";
                }
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
                  color: resumes.length >= 5 ? "#64748b" : "#14532d",
                }}>
                Start from Scratch
              </h3>
              <p style={{ fontSize: 13, color: resumes.length >= 5 ? "#94a3b8" : "#166534", margin: 0 }}>
                {resumes.length >= 5
                  ? "Resume limit reached (5/5)"
                  : "Create a new resume using our professional templates"}
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
        </section> */}

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

      {/* Account Deletion Confirmation Modal */}
      {showDeleteAccountModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 80,
          }}>
          <div
            style={{
              background: "#ffffff",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 22px 55px rgba(15,23,42,0.45)",
              maxWidth: 480,
              width: "90%",
            }}>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: 20,
                fontWeight: 700,
                color: "#0f172a",
              }}>
              Delete your account?
            </h2>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 14,
                color: "#475569",
                lineHeight: 1.5,
              }}>
              This will immediately sign you out and mark your account for deletion. Your account
              and all associated data (resumes, templates, billing info) will no longer be
              accessible in the app.
            </p>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 13,
                color: "#b91c1c",
                lineHeight: 1.5,
              }}>
              Data may be retained securely for up to 30 days for legal and recovery purposes.
              After that, it may be permanently removed and cannot be restored.
            </p>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 13,
                color: "#64748b",
              }}>
              If you delete by mistake, contact support within 30 days and we may be able to help
              restore your account.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 999,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: deletingAccount ? "not-allowed" : "pointer",
                  opacity: deletingAccount ? 0.6 : 1,
                }}>
                Cancel
              </button>
              <button
                type="button"
                data-variant="error"
                onClick={async () => {
                  if (deletingAccount) return;
                  setDeletingAccount(true);
                  try {
                    const res = await api.delete("/api/v1/auth/delete");
                    const msg =
                      res?.data?.message ||
                      res?.data?.data?.message ||
                      "Account deleted. You have up to 30 days to request restoration.";
                    showToast(msg, { type: "success", duration: 5000 });
                    localStorage.clear();
                    window.location.href = "/signin";
                  } catch (err) {
                    console.error(err);
                    const msg =
                      err.response?.data?.message ||
                      "Failed to delete account. Please try again.";
                    showToast(msg, { type: "error" });
                    setDeletingAccount(false);
                  }
                }}
                style={{
                  padding: "9px 20px",
                  borderRadius: 999,
                  border: "1px solid #fecaca",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deletingAccount ? "not-allowed" : "pointer",
                  opacity: deletingAccount ? 0.7 : 1,
                }}>
                {deletingAccount ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
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
  const isExportingRef = useRef(false);
  const exportClientWord = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isExportingRef.current) return; // Prevent duplicate calls
    isExportingRef.current = true;

    const html = previewHtml || resumePreview || "";
    if (!html) {
      showToast("No preview to export.", { type: "error" });
      isExportingRef.current = false;
      return;
    }
    const full = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:1in} body{font-family:Arial,Helvetica,sans-serif}</style></head><body>${html}</body></html>`;
    const blob = new Blob([full], { type: "application/msword" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const title =
      (resume?.title || template?.name || "resume")
        .replace(/[^\w\-\s]+/g, "")
        .trim() || "resume";
    a.href = url;
    a.download = `${title}-${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast("Exported Word (.doc) from preview", {
      type: "success",
      duration: 1800,
    });

    // Reset after a short delay to allow download to start
    setTimeout(() => {
      isExportingRef.current = false;
    }, 1000);
  };

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

        // Use public template preview endpoint (no auth required, works for premium templates)
        if (!template?.slug) {
          console.error("No template available for preview");
          setPreviewHtml("<div>No template available for preview</div>");
          setLoading(false);
          return;
        }

        // Use the public template preview endpoint - allows previewing premium templates
        // This endpoint is public and doesn't require authentication or premium access
        try {
          // Use fetch directly since we need HTML text, not JSON
          const previewResponse = await fetch(
            `/api/v1/templates/${template.slug}/preview`,
            {
              method: "GET",
              headers: {
                "Content-Type": "text/html",
              },
              credentials: "include", // Include cookies for CORS
            }
          );

          if (!previewResponse.ok) {
            throw new Error(
              `Preview failed: ${previewResponse.status} ${previewResponse.statusText}`
            );
          }

          const htmlContent = await previewResponse.text();
          setPreviewHtml(htmlContent);
          setLoading(false);
          return;
        } catch (previewErr) {
          console.error("Template preview failed:", previewErr);
          setPreviewHtml(`<div style="padding: 20px; text-align: center;">
            <h3>Preview Unavailable</h3>
            <p>Unable to load template preview. Please try again later.</p>
            <p style="color: #666; font-size: 12px;">${previewErr.message}</p>
          </div>`);
          setLoading(false);
        }

        // OLD METHOD - Creates temporary resume (hits premium restriction)
        // Use this only if template preview endpoint fails
        /*
        const { data } = await api.post("/api/v1/resumes", {
          title: "Preview",
          templateSlug: template.slug,
        });

        const tempResumeId = data.data.resumeId;

        // OLD METHOD - No longer needed, using public template preview endpoint above
        /*
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
        */
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
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title="Resume Preview"
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
          {/* {resume ? (
            <button
              onClick={exportClientWord}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
              }}>
              Download DOCX
            </button>
          ) : null} */}
          {/* <button
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
          </button> */}
        </div>
      </div>
    </div>
  );
}
