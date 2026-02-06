import React, { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import RichTextEditor from "./RichTextEditor.jsx";
import { showToast } from "../lib/toast";
import { ArrowLeft, Eye, Lock } from "lucide-react";
import { CalendarDots,  LockKeyIcon,  Sparkle } from "@phosphor-icons/react";
import { showAlert, showConfirm } from "../lib/alert.js";
import ExportGateModal from "./ExportGateModal.jsx";
import {
  saveResumeToLocal,
  getResumeFromLocal,
  clearResumeLocal,
  calculateResumeProgress,
} from "../lib/localStorage.js";

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

// ------------------------------
// Helper: sanitize resume payload
// ------------------------------
const cleanResumeData = (data) => {
  const cleanDates = (obj) => {
    const cleaned = { ...obj };
    if (
      cleaned.startDate === "null" ||
      cleaned.startDate === "" ||
      !cleaned.startDate
    ) {
      delete cleaned.startDate;
    }
    if (
      cleaned.endDate === "null" ||
      cleaned.endDate === "" ||
      !cleaned.endDate ||
      cleaned.current
    ) {
      delete cleaned.endDate;
    }
    return cleaned;
  };

  // Helper to create plain text version (for ATS compatibility, but preserve HTML too)
  const stripHtml = (html) => {
    if (!html) return "";
    const withoutTags = String(html).replace(/<[^>]*>/g, " ");
    return withoutTags.replace(/\s+/g, " ").trim();
  };

  return {
    title: data.title,
    templateSlug: data.templateSlug,
    contact: {
      ...data.contact,
      // Explicitly preserve all contact fields
      fullName: data.contact?.fullName || "",
      email: data.contact?.email || "",
      phone: data.contact?.phone || "",
      location: data.contact?.location || "",
      address: data.contact?.address || "",
      website: data.contact?.website || "",
      github: data.contact?.github || "",
      linkedin: data.contact?.linkedin || "",
      portfolioLink: data.contact?.portfolioLink || "",
      headline: data.contact?.headline || "",
      // ✅ PRESERVE HTML FORMATTING - Store both HTML and plain text
      summary: data.contact?.summary || "", // Keep HTML for rendering
      summaryText: stripHtml(data.contact?.summary || ""), // Plain text for ATS
      professionalSummary: data.contact?.professionalSummary || data.contact?.summary || "", // Keep HTML
      professionalSummaryText: stripHtml(
        data.contact?.professionalSummary || data.contact?.summary || ""
      ), // Plain text for ATS
    },
    experience: (data.experience || [])
      .filter((e) => e.title || e.company)
      .map(cleanDates),
    education: (data.education || [])
      .filter((e) => e.degree || e.school)
      .map(cleanDates),
    skills: (data.skills || []).filter(
      (s) => s && (s.name || typeof s === "string")
    ),
    projects: (data.projects || []).filter((p) => p.name || p.description).map((p) => ({
      ...p,
      // ✅ PRESERVE HTML FORMATTING
      descriptionHtml: p.descriptionHtml || p.description || "",
      description: p.description || "", // Keep for backwards compatibility
    })),
    hobbies: (data.hobbies || []).filter((h) => h.name),
    awards: (data.awards || []).filter((a) => a.title).map((a) => ({
      ...a,
      // ✅ PRESERVE HTML FORMATTING
      descriptionHtml: a.descriptionHtml || a.description || "",
      description: a.description || "", // Keep for backwards compatibility
    })),
  };
};

// Note: showAlert and showConfirm are imported from ../lib/alert.js for modal dialogs
// Use showToast() for non-blocking toast notifications

const formatTemplateName = (template) => {
  if (!template) return "";
  const base = template.name?.trim() || template.slug || "";
  if (!base) return "";
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};


// ------------------------------
// Builder Component
// ------------------------------
export default function Builder() {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state || {};
  const startFresh = Boolean(navigationState.startFresh);

  // ---------- state ----------
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // Don't show template dialog if template is already selected from navigation (for both logged-in and non-logged-in users)
  const shouldShowTemplateDialog = startFresh && !navigationState.templateSlug;
  const [showTemplateDialog, setShowTemplateDialog] = useState(shouldShowTemplateDialog);
  const [templateChoice, setTemplateChoice] = useState("");

  const resumeIdFromNav = navigationState.resumeId || null;
  const initialResumeId =
    typeof window === "undefined"
      ? null
      : startFresh
      ? resumeIdFromNav
      : resumeIdFromNav || localStorage.getItem("lastResumeId") || null;

  const [resumeId, setResumeId] = useState(initialResumeId);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null); // 'pdf' | 'doc' | 'txt' | null

  const [serverPreview, setServerPreview] = useState("");
  const [serverPreviewUrl, setServerPreviewUrl] = useState("");

  const [step, setStep] = useState(1); // start with Basics
  const [jobDescription, setJobDescription] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [aiGeneratedText, setAiGeneratedText] = useState(""); // For AI-generated text preview
  const [showAiPreview, setShowAiPreview] = useState(false); // Show/hide AI preview
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [showExportGate, setShowExportGate] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState(null);

  // Prevent outer page scroll while in builder; restore on unmount
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // typing + rate-limit guards
  const typingRef = useRef(0); // last keystroke timestamp
  const lastPreviewAtRef = useRef(0); // last server preview fetch ts
  const lastSaveAtRef = useRef(0); // last save timestamp
  const previewAbortRef = useRef(null); // AbortController for preview
  const previewInFlightRef = useRef(false);
  const previewRetryTimerRef = useRef(null);
  const saveInFlightRef = useRef(false);
  const saveRetryTimerRef = useRef(null);
  const prevTemplateSlugRef = useRef(null); // Track previous template to detect changes

  const isTrialUser =
  user &&
  user.subscriptionStatus === "trialing" &&
  (!user.plan || user.plan === "free");

  const hasPaidPlan =
    user &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing") &&
    (user.plan === "premium" || user.plan === "professional");

  // ---------- initial resume data ----------
  const getInitialResumeData = (seedId) => {
    if (startFresh && !seedId) {
      // Always start clean when launching builder fresh from navbar
      // Use templateSlug from navigation state if available, otherwise default to "modern-slate"
      const templateSlugFromNav = navigationState.templateSlug || "modern-slate";
      return {
        title: "My Resume",
        contact: {
          fullName: user?.name || "",
          email: user?.email || "",
          phone: "",
          location: "",
          address: "",
          website: "",
          github: "",
          linkedin: "",
          portfolioLink: "",
          summary: "",
          professionalSummary: "",
          headline: "",
        },
        experience: [
          {
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            bullets: [],
          },
        ],
        education: [
          {
            degree: "",
            school: "",
            location: "",
            startDate: "",
            endDate: "",
            details: [],
          },
        ],
        skills: [],
        projects: [],
        hobbies: [],
        awards: [],
        templateSlug: templateSlugFromNav,
      };
    }

    const storageKey = `resume-${seedId || "draft"}`;
    const savedResume =
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (savedResume) {
      try {
        return JSON.parse(savedResume);
      } catch {
        /* ignore */
      }
    }
    return {
      title: "My Resume",
      contact: {
        fullName: user?.name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        address: "",
        website: "",
        github: "",
        linkedin: "",
        portfolioLink: "",
        summary: "",
        professionalSummary: "",
        headline: "",
      },
      experience: [
        {
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          bullets: [],
        },
      ],
      education: [
        {
          degree: "",
          school: "",
          location: "",
          startDate: "",
          endDate: "",
          details: [],
        },
      ],
      skills: [],
      projects: [],
      hobbies: [],
      awards: [],
      templateSlug: "modern-slate",
    };
  };

  const [resume, setResume] = useState(() =>
    getInitialResumeData(initialResumeId)
  );

  // Local state for skills input so commas work naturally
  const [skillsInput, setSkillsInput] = useState("");
  const [skillScoreInput, setSkillScoreInput] = useState("");

  // Do not mirror skills back into the input; we keep it user-driven and clear on add

  const commitSkillToken = (raw) => {
    const token = (raw || skillsInput).trim();
    if (!token) return;
    const parsedScore = parseInt(skillScoreInput, 10);
    const score =
      Number.isFinite(parsedScore) && parsedScore >= 0
        ? Math.min(parsedScore, 100)
        : undefined;
    setResume((r) => {
      const existing = (r.skills || []).map((x) => x.name || x);
      if (existing.includes(token)) {
        setSkillsInput("");
        setSkillScoreInput("");
        return r; // avoid duplicates
      }
      return {
        ...r,
        skills: [
          ...existing.map((n) => {
            const found = r.skills?.find(
              (skill) => (skill.name || skill) === n
            );
            return typeof found === "object" ? found : { name: n };
          }),
          score !== undefined ? { name: token, score } : { name: token },
        ],
      };
    });
    setSkillsInput("");
    setSkillScoreInput("");
    markTyping();
  };

  const removeSkill = (name) => {
    setResume((r) => ({
      ...r,
      skills: (r.skills || [])
        .map((x) => (typeof x === "string" ? { name: x } : x))
        .filter((x) => (x.name || "") !== name),
    }));
    markTyping();
  };

  // Helper: attempt to show native date picker when supported
  const openNativeDatePicker = (event) => {
    const el = event?.currentTarget || event?.target;
    if (el && typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch (_) {
        /* ignore */
      }
    }
  };

  // ---------- theme (light/dark) ----------
  const sharedNeutralTheme = {
    pageBg: "#f2f4f7", // consistent grey background for all themes
    cardBg: "#ffffff",
    panelBg: "#ffffff",
    border: "#dce3ef",
    text: "#0f172a",
    sub: "#64748b",
    muted: "#64748b",
    inputBg: "#ffffff",
  };
  const THEME = sharedNeutralTheme;

  const resolvedTemplate = useMemo(() => {
    if (selectedTemplate?.slug) return selectedTemplate;
    if (resume.templateSlug) {
      return (
        templates.find((t) => t.slug === resume.templateSlug) || {
          slug: resume.templateSlug,
        }
      );
    }
    return null;
  }, [selectedTemplate, resume.templateSlug, templates]);

  const templateDisplayName = formatTemplateName(resolvedTemplate);
  const hasTemplateSelected = Boolean(resolvedTemplate?.slug);
  const isPremiumTemplate = resolvedTemplate?.category === "premium" || resolvedTemplate?.category === "industry";
  // Trial users can edit and preview premium templates, but cannot download them
  const canDownload = !isPremiumTemplate || (hasPaidPlan && !isTrialUser);

  // Helpers to keep experience rich text + bullets in sync
  const bulletsToHtml = (bullets = []) => {
    const clean = (bullets || []).filter(Boolean);
    if (!clean.length) return "";
    return `<ul>${clean.map((b) => `<li>${b}</li>`).join("")}</ul>`;
  };
  const extractBulletsFromHtml = (html = "") => {
    if (!html) return [];
    try {
      const div = document.createElement("div");
      div.innerHTML = html;
      const li = Array.from(div.querySelectorAll("li")).map((el) =>
        el.textContent.trim()
      );
      if (li.length) return li.filter(Boolean);
      const text = div.textContent || "";
      return text
        .split("\n")
        .map((l) => l.trim().replace(/^[–—\-•\u2022]\s*/, ""))
        .filter(Boolean);
    } catch {
      return [];
    }
  };

  // ---------- styles (updated with typography system) ----------
  const S = {
    page: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 20,
      minHeight: "calc(100vh - 64px)",
      height: "calc(100vh - 64px)",
      background: THEME.pageBg,
      padding: "20px 20px 20px",
      overflow: "hidden",
      boxSizing: "border-box",
    },
    left: {
      background: THEME.cardBg,
      borderRadius: 14,
      padding: 28,
      border: `1px solid ${THEME.border}`,
      boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
      overflow: "auto",
      height: "100%",
      color: THEME.text,
      boxSizing: "border-box",
    },
    rightWrap: {
      background: THEME.panelBg,
      borderRadius: 14,
      border: `1px solid ${THEME.border}`,
      padding: 20,
      display: "grid",
      gridTemplateRows: "48px 1fr",
      color: THEME.text,
      boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
      height: "100%",
      overflow: "hidden",
      boxSizing: "border-box",
    },
    headerTitle: {
      fontSize: "var(--font-size-2xl)",
      fontWeight: "var(--font-weight-bold)",
      margin: 0,
      color: THEME.text,
    },
    headerSub: { 
      marginTop: 6, 
      color: THEME.sub, 
      fontSize: "var(--font-size-base)",
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    label: {
      fontSize: "var(--font-size-sm)",
      color: THEME.sub,
      marginBottom: 6,
      display: "block",
      fontWeight: "var(--font-weight-medium)",
    },
    input: {
      width: "100%",
      padding: "12px 12px",
      borderRadius: 10,
      border: `1px solid ${THEME.border}`,
      background: THEME.inputBg,
      outline: "none",
      fontSize: "var(--font-size-base)",
      color: THEME.text,
    },
    dateInput: {
      width: "100%",
      padding: "12px 12px",
      borderRadius: 10,
      border: "2px solid #3b82f6",
      background: THEME.inputBg,
      outline: "none",
      fontSize: "var(--font-size-base)",
      fontFamily: "var(--font-body)",
      cursor: "pointer",
      transition: "all 0.2s",
      color: THEME.text,
    },
    textarea: {
      width: "100%",
      padding: 12,
      borderRadius: 10,
      border: `1px solid ${THEME.border}`,
      resize: "vertical",
      minHeight: 120,
      background: THEME.inputBg,
      color: THEME.text,
      whiteSpace: "pre-wrap",
      fontSize: "var(--font-size-base)",
    },
    small: { 
      fontSize: "var(--font-size-sm)", 
      color: THEME.muted 
    },
    btnRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    btnSolid: {
      background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 20px",
      fontWeight: "var(--font-weight-semibold)",
    fontSize: "var(--font-size-base)",
      cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s ease-in-out",
    },
    btnGhost: {
      background: THEME.cardBg,
      color: "#2563eb",
      border: "1px solid #93c5fd",
      borderRadius: 10,
      padding: "8px 12px",
      fontWeight: "var(--font-weight-semibold)",
      cursor: "pointer",
    },
    stepperWrap: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "12px 0 20px",
    },
    step: (active, done) => ({
      width: 32,
      height: 32,
      borderRadius: 999,
      border: "2px solid #93c5fd",
      background: active ? "#2563eb" : done ? "#1d4ed8" : "#fff",
      color: active || done ? "#fff" : "#0f172a",
      fontWeight: "var(--font-weight-bold)",
      display: "grid",
      placeItems: "center",
      boxShadow: active ? "0 0 0 4px rgba(37,99,235,0.15)" : "none",
      cursor: "pointer",
    }),
    stepLine: (done) => ({
      flex: 1,
      height: 2,
      background: done ? "#60a5fa" : "#e5e7eb",
    }),
    previewTop: {
      padding: "6px 10px 10px",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    card: {
      border: "1px solid #cbd5e1",
      borderRadius: 14,
      background: "#fff",
      width: "100%",
      height: "100%",
      overflow: "hidden",
    },
    iframe: {
      width: "100%",
      height: "100%",
      border: "none",
      background: "white",
    },
    hint: { 
      color: "#64748b", 
      fontSize: "var(--font-size-sm)", 
      marginLeft: 6 
    },
    sectionTitle: {
      marginTop: 24,
      fontWeight: "var(--font-weight-bold)",
      fontSize: "var(--font-size-lg)",
      color: "#0f172a",
    },
    chipRow: { display: "flex", gap: 8, flexWrap: "wrap" },
    chip: {
      fontSize: "var(--font-size-sm)",
      padding: "6px 10px",
      borderRadius: 999,
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      color: "#1d4ed8",
      fontWeight: "var(--font-weight-semibold)",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
    },
  };

  // ---------- load templates + optional resume ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const wantedId = startFresh
          ? navigationState.resumeId || null
          : navigationState.resumeId ||
            localStorage.getItem("lastResumeId") ||
            null;
        const [tplRes, resumeRes] = await Promise.all([
          token ? api.get("/api/v1/templates") : api.get("/api/v1/templates/public"),
          wantedId
            ? api.get(`/api/v1/resumes/${wantedId}`)
            : Promise.resolve({ data: null }),
        ]);
        if (!alive) return;

        const items = tplRes?.data?.data?.items || [];
        const visibleTemplates = items.filter((tpl) => {
          const name = (tpl?.name || "").trim();
          return !HIDDEN_TEMPLATE_NAMES.has(name);
        });
        const sortedTemplates = [...visibleTemplates].sort((a, b) => {
          const an = (a.name || a.slug || "").toLowerCase();
          const bn = (b.name || b.slug || "").toLowerCase();
          return an.localeCompare(bn);
        });
        setTemplates(sortedTemplates);
        if (sortedTemplates.length === 0) {
          showToast("No templates are available right now.");
          setIsInitializing(false);
          return;
        }

        const rData = resumeRes?.data?.data || {};
        const loaded = rData.resume || rData || null;

        if (wantedId && loaded) {
          setResumeId(wantedId);
          // ✅ Prioritize server data (source of truth), use localStorage only as fallback for unsaved changes
          let merged = { ...loaded };
          try {
            const localRaw = localStorage.getItem(`resume-${wantedId}`);
            if (localRaw) {
              const localSaved = JSON.parse(localRaw);
              // Only merge localStorage if server data is missing/empty for that field
              merged = {
                ...merged,
                contact: {
                  ...(merged.contact || {}),
                  // Use server data first, fallback to localStorage only if server field is empty
                  fullName: merged.contact?.fullName || localSaved.contact?.fullName || "",
                  email: merged.contact?.email || localSaved.contact?.email || "",
                  phone: merged.contact?.phone || localSaved.contact?.phone || "",
                  location: merged.contact?.location || localSaved.contact?.location || "",
                  address: merged.contact?.address || localSaved.contact?.address || "",
                  website: merged.contact?.website || localSaved.contact?.website || "",
                  github: merged.contact?.github || localSaved.contact?.github || "",
                  linkedin: merged.contact?.linkedin || localSaved.contact?.linkedin || "",
                  portfolioLink: merged.contact?.portfolioLink || localSaved.contact?.portfolioLink || "",
                  summary: merged.contact?.summary || localSaved.contact?.summary || "",
                  professionalSummary: merged.contact?.professionalSummary || localSaved.contact?.professionalSummary || merged.contact?.summary || localSaved.contact?.summary || "",
                  headline: merged.contact?.headline || localSaved.contact?.headline || "",
                },
                // ✅ Prioritize server arrays - only use localStorage if server array is empty
                experience: (merged.experience && merged.experience.length > 0) 
                  ? merged.experience 
                  : (localSaved.experience && localSaved.experience.length > 0 ? localSaved.experience : []),
                education: (merged.education && merged.education.length > 0)
                  ? merged.education
                  : (localSaved.education && localSaved.education.length > 0 ? localSaved.education : []),
                skills: (Array.isArray(merged.skills) && merged.skills.length > 0)
                  ? merged.skills
                  : (Array.isArray(localSaved.skills) && localSaved.skills.length > 0 ? localSaved.skills : []),
                projects: (Array.isArray(merged.projects) && merged.projects.length > 0)
                  ? merged.projects
                  : (Array.isArray(localSaved.projects) && localSaved.projects.length > 0 ? localSaved.projects : []),
                hobbies: (Array.isArray(merged.hobbies) && merged.hobbies.length > 0)
                  ? merged.hobbies
                  : (Array.isArray(localSaved.hobbies) && localSaved.hobbies.length > 0 ? localSaved.hobbies : []),
                awards: (Array.isArray(merged.awards) && merged.awards.length > 0)
                  ? merged.awards
                  : (Array.isArray(localSaved.awards) && localSaved.awards.length > 0 ? localSaved.awards : []),
                title: merged.title || localSaved.title || "My Resume",
              };
            }
          } catch {
            /* ignore bad local data */
          }

          // Check for pending resume data from signup flow OR localStorage
          let pendingResumeData = null;
          try {
            const pendingDataStr = sessionStorage.getItem("pendingResumeData");
            if (pendingDataStr) {
              pendingResumeData = JSON.parse(pendingDataStr);
              sessionStorage.removeItem("pendingResumeData");
            } else if (!token && !initialResumeId && !startFresh) {
              // If user is not authenticated and no resumeId, load from localStorage
              // BUT skip localStorage if startFresh is true (user selected a template from dashboard)
              const localData = getResumeFromLocal();
              if (localData) {
                pendingResumeData = localData;
                console.log("📦 Loaded resume from localStorage (no account)");
              }
            }
          } catch (e) {
            console.warn("Failed to parse pending resume data:", e);
          }
          
          const serverTemplateSlug =
            resumeRes?.data?.data?.templateSlug ||
            merged.template?.slug ||
            merged.templateSlug;
          const slugFromLocation = location.state?.templateSlug;
          const pendingTemplateSlug = sessionStorage.getItem("pendingTemplateSlug");
          if (pendingTemplateSlug) {
            sessionStorage.removeItem("pendingTemplateSlug");
          }
          const slugFromResume = merged.templateSlug || serverTemplateSlug;
          // For startFresh, prioritize templateSlug from navigation state over resume template and localStorage
          // This ensures that when user selects a template from Dashboard, that template is used even if resume has different template
          const finalSlug = startFresh && slugFromLocation
            ? slugFromLocation
            : slugFromResume || slugFromLocation || pendingTemplateSlug || sortedTemplates[0]?.slug || "modern-slate";
          
          // If startFresh and template from navigation differs from resume template, update resume template
          if (startFresh && slugFromLocation && slugFromLocation !== slugFromResume) {
            // Template from navigation state takes priority
            console.log(`🔄 Template override: Using ${slugFromLocation} from navigation instead of ${slugFromResume} from resume`);
          }
          
          // Merge pending resume data if available
          // But don't merge templateSlug if startFresh is true (user selected a template from dashboard)
          if (pendingResumeData) {
            const { templateSlug: _, ...pendingDataWithoutTemplate } = pendingResumeData;
            merged = {
              ...merged,
              ...pendingDataWithoutTemplate,
              contact: { ...merged.contact, ...pendingResumeData.contact },
              experience: pendingResumeData.experience || merged.experience,
              education: pendingResumeData.education || merged.education,
              skills: pendingResumeData.skills || merged.skills,
              projects: pendingResumeData.projects || merged.projects,
              hobbies: pendingResumeData.hobbies || merged.hobbies,
              awards: pendingResumeData.awards || merged.awards,
            };
            // Don't override templateSlug from localStorage if startFresh is true
            // The finalSlug will be set correctly based on navigation state
            if (!startFresh && pendingResumeData.templateSlug) {
              merged.templateSlug = pendingResumeData.templateSlug;
            }
          }
          const finalT =
            sortedTemplates.find((x) => x.slug === finalSlug) || null;
          const fallbackTemplate =
            finalT ||
            (loaded.template
              ? {
                  slug: loaded.template.slug || finalSlug,
                  name: loaded.template.name || formatTemplateName({ slug: finalSlug }),
                  category: loaded.template.category,
                }
              : { slug: finalSlug });
          setSelectedTemplate(fallbackTemplate);

          const normalizeDate = (val) => {
            if (!val) return "";
            if (typeof val === "string") {
              // Expect ISO string from API; keep only YYYY-MM-DD for <input type="date" />
              if (val.includes("T")) return val.split("T")[0];
              if (val.length >= 10) return val.slice(0, 10);
              return val;
            }
            try {
              const d = new Date(val);
              if (!isNaN(d)) return d.toISOString().split("T")[0];
            } catch {}
            return "";
          };

          const safeExperience =
            merged.experience?.length > 0
              ? merged.experience.map((e) => ({
                  ...e,
                  startDate: normalizeDate(e.startDate),
                  endDate: e.current ? "" : normalizeDate(e.endDate),
                }))
              : [
                  {
                    title: "",
                    company: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                    current: false,
                    bullets: [],
                  },
                ];
          const safeEducation =
            merged.education?.length > 0
              ? merged.education.map((e) => ({
                  ...e,
                  startDate: normalizeDate(e.startDate),
                  endDate: normalizeDate(e.endDate),
                }))
              : [
                  {
                    degree: "",
                    school: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                    details: [],
                  },
                ];

          setResume((prev) => ({
            ...prev,
            title: merged.title || prev.title,
            contact: {
              fullName: merged.contact?.fullName || prev.contact.fullName || "",
              email: merged.contact?.email || prev.contact.email || "",
              phone: merged.contact?.phone || prev.contact.phone || "",
              location: merged.contact?.location || prev.contact.location || "",
              address: merged.contact?.address || prev.contact.address || "",
              website: merged.contact?.website || prev.contact.website || "",
              github: merged.contact?.github || prev.contact.github || "",
              linkedin: merged.contact?.linkedin || prev.contact.linkedin || "",
              portfolioLink:
                merged.contact?.portfolioLink ||
                prev.contact.portfolioLink ||
                "",
              summary:
                merged.contact?.summary ||
                merged.contact?.professionalSummary ||
                prev.contact.summary ||
                prev.contact.professionalSummary ||
                "",
              professionalSummary:
                merged.contact?.professionalSummary ||
                merged.contact?.summary ||
                prev.contact.professionalSummary ||
                prev.contact.summary ||
                "",
              headline: merged.contact?.headline || prev.contact.headline || "",
            },
            experience: safeExperience,
            education: safeEducation,
            skills: merged.skills?.length > 0 ? merged.skills : prev.skills,
            projects:
              Array.isArray(merged.projects) && merged.projects.length > 0
                ? merged.projects
                : prev.projects,
            hobbies:
              Array.isArray(merged.hobbies) && merged.hobbies.length > 0
                ? merged.hobbies
                : prev.hobbies,
            awards:
              Array.isArray(merged.awards) && merged.awards.length > 0
                ? merged.awards
                : prev.awards,
            templateSlug: finalSlug,
          }));

          setIsInitializing(false);
        } else {
          // No existing resume found
          // For fresh sessions, just prepare the template chooser and skip auto-select
          if (startFresh) {
            if (items.length > 0) {
              // Allow trial users to select premium templates from ResumeStartFlow
              // Use template from navigation state if available, otherwise default to first template
              const slugFromNavigation = location.state?.templateSlug;
              const defaultTpl = slugFromNavigation 
                ? items.find((t) => t.slug === slugFromNavigation) || items[0]
                : items[0];
              const finalSlug = defaultTpl.slug;
              
              // Set template choice for the dialog (only if dialog will be shown)
              if (shouldShowTemplateDialog && !templateChoice) {
                setTemplateChoice(finalSlug);
              }
              
              // Also set the selected template and update resume templateSlug
              // This ensures the template dropdown shows the correct value immediately
              setSelectedTemplate(defaultTpl);
              // Force update resume templateSlug to match navigation state template
              // This ensures non-logged-in users get the correct template
              setResume((prev) => {
                // Only update if templateSlug is different to avoid unnecessary re-renders
                if (prev.templateSlug !== finalSlug) {
                  return { ...prev, templateSlug: finalSlug };
                }
                return prev;
              });
              
              // If template is already selected from navigation, hide dialog and fetch preview
              if (slugFromNavigation) {
                setShowTemplateDialog(false);
                // Fetch preview for non-logged-in users with their data (same rendering as logged-in users)
                if (!token) {
                  // Prepare resume data in the format expected by the render endpoint
                  const resumeDataForRender = {
                    contact: resume.contact || {},
                    experience: resume.experience || [],
                    education: resume.education || [],
                    skills: resume.skills || [],
                    projects: resume.projects || [],
                    hobbies: resume.hobbies || [],
                    awards: resume.awards || [],
                  };
                  fetchTemplatePreview(finalSlug, resumeDataForRender);
                }
              }
            }
            // Set initializing to false immediately after templates are loaded and template is set
            // This allows the UI to render immediately for non-logged-in users
            setIsInitializing(false);
            return;
          }

          // Check for pending resume data from import/upload (for non-logged-in users)
          let pendingResumeData = null;
          try {
            const pendingDataStr = sessionStorage.getItem("pendingResumeData");
            if (pendingDataStr) {
              pendingResumeData = JSON.parse(pendingDataStr);
              sessionStorage.removeItem("pendingResumeData");
            }
          } catch (e) {
            console.warn("Failed to parse pending resume data:", e);
          }

          // Use template from navigation state, pendingResumeData, or default
          const pendingTemplateSlug = sessionStorage.getItem("pendingTemplateSlug");
          if (pendingTemplateSlug) {
            sessionStorage.removeItem("pendingTemplateSlug");
          }
          const initialSlug =
            location.state?.templateSlug ||
            pendingResumeData?.templateSlug ||
            pendingTemplateSlug ||
            sortedTemplates[0]?.slug ||
            "modern-slate";
          const t = sortedTemplates.find((x) => x.slug === initialSlug) || null;
          setSelectedTemplate(t || null);

          const finalTemplateSlug = t?.slug || "modern-slate";
          
          // Merge pending resume data if available (for non-logged-in users importing resumes)
          let mergedResumeData = null;
          if (pendingResumeData) {
            const normalizeDate = (val) => {
              if (!val) return "";
              if (typeof val === "string") {
                if (val.includes("T")) return val.split("T")[0];
                if (val.length >= 10) return val.slice(0, 10);
                return val;
              }
              try {
                const d = new Date(val);
                if (!isNaN(d)) return d.toISOString().split("T")[0];
              } catch {}
              return "";
            };

            const safeExperience =
              pendingResumeData.experience?.length > 0
                ? pendingResumeData.experience.map((e) => ({
                    ...e,
                    startDate: normalizeDate(e.startDate),
                    endDate: e.current ? "" : normalizeDate(e.endDate),
                    bullets: e.bullets || [],
                  }))
                : [];

            const safeEducation =
              pendingResumeData.education?.length > 0
                ? pendingResumeData.education.map((e) => ({
                    ...e,
                    startDate: normalizeDate(e.startDate),
                    endDate: normalizeDate(e.endDate),
                    details: e.details || [],
                  }))
                : [];

            // Build merged data for both state update and preview
            mergedResumeData = {
              title: pendingResumeData.title || resume.title,
              contact: {
                ...resume.contact,
                ...(pendingResumeData.contact || {}),
              },
              experience: safeExperience.length > 0 ? safeExperience : resume.experience,
              education: safeEducation.length > 0 ? safeEducation : resume.education,
              skills: Array.isArray(pendingResumeData.skills) && pendingResumeData.skills.length > 0
                ? pendingResumeData.skills
                : resume.skills,
              projects: Array.isArray(pendingResumeData.projects) && pendingResumeData.projects.length > 0
                ? pendingResumeData.projects
                : resume.projects,
              hobbies: Array.isArray(pendingResumeData.hobbies) && pendingResumeData.hobbies.length > 0
                ? pendingResumeData.hobbies
                : resume.hobbies,
              awards: Array.isArray(pendingResumeData.awards) && pendingResumeData.awards.length > 0
                ? pendingResumeData.awards
                : resume.awards,
              templateSlug: finalTemplateSlug,
            };

            setResume(mergedResumeData);
          } else {
            setResume((prev) => ({ ...prev, templateSlug: finalTemplateSlug }));
          }
          
          // Fetch preview for non-logged-in users when template is set (with their data)
          if (!token && !resumeId && finalTemplateSlug) {
            // Use merged data if available, otherwise use current resume state
            const dataToUse = mergedResumeData || resume;
            // Prepare resume data in the format expected by the render endpoint
            const resumeDataForRender = {
              contact: dataToUse.contact || {},
              experience: dataToUse.experience || [],
              education: dataToUse.education || [],
              skills: dataToUse.skills || [],
              projects: dataToUse.projects || [],
              hobbies: dataToUse.hobbies || [],
              awards: dataToUse.awards || [],
            };
            fetchTemplatePreview(finalTemplateSlug, resumeDataForRender);
          }

          setIsInitializing(false);

          // Only auto-create a resume for non-fresh flows (e.g., coming from dashboard/import)
          setTimeout(async () => {
            try {
              // Check resume limit before auto-creating
              try {
                const resumeCountRes = await api.get("/api/v1/resumes");
                const resumeCount = resumeCountRes.data?.data?.items?.length || resumeCountRes.data?.data?.count || 0;
                if (resumeCount >= 5) {
                  console.warn("Resume limit reached, skipping auto-create");
                  return;
                }
              } catch (err) {
                console.warn("Could not check resume count:", err);
                // Continue anyway - backend will enforce the limit
              }
              
              const payload = cleanResumeData({
                title: "My Resume",
                templateSlug: finalTemplateSlug,
                contact: resume.contact,
                experience: resume.experience,
                education: resume.education,
                skills: resume.skills,
              });
              const res = await api.post("/api/v1/resumes", payload);
              const newResumeId = res.data?.data?.resumeId;
              if (newResumeId) {
                setResumeId(newResumeId);
                localStorage.setItem("lastResumeId", newResumeId);
                // Trigger immediate server preview fetch
                setTimeout(() => fetchServerPreview(), 100);
              }
            } catch (err) {
              if (err.response?.status === 400 && err.response?.data?.message?.includes("limit")) {
                showToast(err.response.data.message, { type: "error", duration: 5000 });
              } else {
                console.warn("Failed to create resume for template preview:", err);
              }
            }
          }, 50);
        }
      } catch (e) {
        console.warn(e);
        setIsInitializing(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [location.state]);


  // ---------- save resume (rate-limited, non-blocking) ----------
  const upsertResume = async () => {
    if (templates.length === 0 || isInitializing) return;
    if (!resume.templateSlug) {
      const defaultTemplate =
        selectedTemplate?.slug || templates[0]?.slug || "modern-slate";
      setResume((prev) => ({ ...prev, templateSlug: defaultTemplate }));
      return;
    }

    // If user is not authenticated, just save to localStorage (no backend save)
    if (!token) {
      saveResumeToLocal({
        ...resume,
        templateSlug: resume.templateSlug || selectedTemplate?.slug,
      });
      return;
    }

    // Rate limiting: don't save more than once every 2 seconds
    const sinceLastSave = Date.now() - lastSaveAtRef.current;
    if (sinceLastSave < 2000) {
      console.log("⏳ Rate limiting: skipping save (too soon)");
      return;
    }

    // Don't save if already saving
    if (saveInFlightRef.current) {
      console.log("⏳ Already saving, skipping");
      return;
    }

    setSaving(true);
    saveInFlightRef.current = true;
    lastSaveAtRef.current = Date.now();

    try {
      let id = resumeId;
      if (!id) {
        // Check resume limit before creating
        try {
          const resumeCountRes = await api.get("/api/v1/resumes");
          const resumeCount = resumeCountRes.data?.data?.items?.length || resumeCountRes.data?.data?.count || 0;
          if (resumeCount >= 5) {
            showToast("You have reached the maximum limit of 5 resumes. Please delete a resume to create a new one.", {
              type: "error",
              duration: 5000,
            });
            setSaving(false);
            saveInFlightRef.current = false;
            return;
          }
        } catch (err) {
          console.warn("Could not check resume count:", err);
          // Continue anyway - backend will enforce the limit
        }
        
        const res = await api.post("/api/v1/resumes", {
          title: resume.title,
          templateSlug: resume.templateSlug,
        });
        id = res?.data?.data?.resumeId;
        if (id) setResumeId(id);
      }
      if (id) {
        const cleanedData = cleanResumeData(resume);
        const payload = {
          title: cleanedData.title,
          templateSlug: cleanedData.templateSlug,
          // Some backends expect `template` instead of `templateSlug` — send both
          template: cleanedData.templateSlug,
          contact: cleanedData.contact,
        };
        if (cleanedData.experience?.length > 0) {
          payload.experience = cleanedData.experience.map((e) => {
            const exp = {
              title: e.title,
              company: e.company,
              location: e.location,
              current: e.current,
              bullets: e.bullets || [],
            };
            if (e.startDate) exp.startDate = e.startDate;
            if (e.endDate && !e.current) exp.endDate = e.endDate;
            return exp;
          });
        }
        if (cleanedData.education?.length > 0) {
          payload.education = cleanedData.education.map((e) => {
            const edu = {
              degree: e.degree,
              school: e.school,
              location: e.location || "", // Location is required
              details: e.details || [],
            };
            if (e.startDate) edu.startDate = e.startDate;
            if (e.endDate) edu.endDate = e.endDate;
            return edu;
          });
        }
        if (cleanedData.skills?.length > 0) {
          payload.skills = cleanedData.skills
            .map((s) =>
              typeof s === "string"
                ? { name: s, level: 0 }
                : {
                    name: s.name || s,
                    level: typeof s.level === "number" ? s.level : 0,
                    score: typeof s.score === "number" ? s.score : undefined,
                  }
            )
            .filter((s) => s.name);
        }
        if (cleanedData.projects?.length > 0) {
          payload.projects = cleanedData.projects;
        }
        if (cleanedData.hobbies?.length > 0) {
          payload.hobbies = cleanedData.hobbies;
        }
        if (cleanedData.awards?.length > 0) {
          payload.awards = cleanedData.awards;
        }
        // Debug: Log what we are sending to the backend
        try {
          console.log(
            "[UPsert] Payload summary length:",
            (payload.contact?.summary || "").length
          );
          console.log(
            "[UPsert] Experience count:",
            payload.experience?.length || 0
          );
          console.log(
            "[UPsert] Education count:",
            payload.education?.length || 0
          );
          console.log("[UPsert] Skills count:", payload.skills?.length || 0);
          console.log("[UPsert] Template:", payload.templateSlug);
        } catch {}
        await api.patch(`/api/v1/resumes/${id}`, payload);
      }
    } catch (err) {
      console.error("❌ Error saving resume:", err);

      // Handle 429 with exponential backoff
      if (err?.response?.status === 429) {
        const retryAfter = err?.response?.headers?.["retry-after"];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default 5 seconds

        console.log(`⏳ Rate limited, retrying in ${delay}ms`);
        saveRetryTimerRef.current = setTimeout(() => {
          upsertResume();
        }, delay);
      }
    } finally {
      setSaving(false);
      saveInFlightRef.current = false;
    }
  };

  // Auto-save: Backend save (if authenticated) + localStorage (always)
  useEffect(() => {
    if (templates.length === 0 || !resume.templateSlug || isInitializing)
      return;

    // Backend save: 1 second after last change (if authenticated)
    let backendSaveTimer;
    if (token) {
      backendSaveTimer = setTimeout(() => {
        upsertResume();
      }, 1000);
    }

    // Always save to localStorage for non-authenticated users
    if (!token) {
      saveResumeToLocal({
        ...resume,
        templateSlug: resume.templateSlug || selectedTemplate?.slug,
      });
    }

    return () => {
      if (backendSaveTimer) clearTimeout(backendSaveTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, templates.length, isInitializing, token, selectedTemplate]);

  // ---------- AI helpers ----------
  const generateSummary = async () => {
    if (!jobDescription.trim()) {
      showToast(
        "Please enter a job description first to help AI generate better content",
        { type: "warning" }
      );
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post("/api/v1/ai/suggest", {
        field: "summary",
        jobDescription: jobDescription || "",
      });
      const text =
        res.data?.data?.text ||
        res.data?.data?.suggestion ||
        res.data?.text ||
        "";
      if (text) {
      // Directly set the generated text into the resume summary
      setResume((r) => ({
        ...r,
        contact: {
          ...r.contact,
          summary: text,
          professionalSummary: text,
        },
      }));
      markTyping();
      
      // Clear the job description input
      setJobDescription("");
      
        showToast(
        "✅ AI Summary generated! You can edit it directly above.",
        { type: "success", duration: 3000 }
        );
      } else {
        showToast("AI didn't return any suggestions. Please try again.", {
          type: "error",
        });
      }
    } catch (err) {
      console.error("AI Error:", err);
      showToast(
        "Failed to generate AI summary: " +
          (err.response?.data?.message || err.message),
        { type: "error" }
      );
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiGeneratedText = () => {
    if (aiGeneratedText.trim()) {
      setResume((r) => ({
        ...r,
        contact: {
          ...r.contact,
          summary: aiGeneratedText,
          professionalSummary: aiGeneratedText,
        },
      }));
      setJobDescription("");
      setShowAiPreview(false);
      setAiGeneratedText("");
      showToast(
        "✅ AI-generated summary applied! You can continue editing in the Summary field above.",
        { type: "success" }
      );
    }
  };

  const generateExperienceBullets = async (experienceIndex = 0) => {
    if (!jobDescription.trim()) {
      showAlert(
        "Please enter a job description first to help AI generate better content",
        "warning"
      );
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post("/api/v1/ai/suggest", {
        field: "experienceBullets",
        jobDescription: jobDescription || "",
      });
      let bullets =
        res.data?.data?.bullets ||
        res.data?.data?.suggestion ||
        res.data?.bullets ||
        [];
      if (typeof bullets === "string") {
        bullets = bullets
          .split("\n")
          .map((line) => line.trim().replace(/^[–—\-•\u2022]\s*/, ""))
          .filter(Boolean);
      }
      const finalBullets =
        Array.isArray(bullets) && bullets.length ? bullets : [];
      if (finalBullets.length) {
        setResume((r) => {
          const exp = [...(r.experience || [])];
          if (exp.length === 0)
            exp.push({
              title: "",
              company: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              bullets: [],
            });
          const targetIndex = Math.min(experienceIndex, exp.length - 1);
          exp[targetIndex] = { ...exp[targetIndex], bullets: finalBullets };
          return { ...r, experience: exp };
        });
        showAlert(
          `✅ AI generated ${finalBullets.length} bullet points! Check the Job Description field.`,
          "success",
          4500
        );
      } else {
        showAlert("AI didn't return any bullet points. Please try again.", "error");
      }
    } catch (err) {
      console.error("AI Error:", err);
      showAlert(
        "Failed to generate AI bullets: " +
          (err.response?.data?.message || err.message),
        "error",
        5000
      );
    } finally {
      setAiLoading(false);
    }
  };

  // Reusable AI helper for other sections (uses jobDescription for context)
  const generateAiForField = async (field, onApply, successLabel) => {
    if (!jobDescription.trim()) {
      showAlert(
        "Please enter a job description first to help AI generate better content",
        "warning"
      );
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post("/api/v1/ai/suggest", {
        field,
        jobDescription: jobDescription || "",
      });
      const text =
        res.data?.data?.suggestion ||
        res.data?.suggestion ||
        res.data?.text ||
        "";
      if (!text) {
        showAlert("AI didn't return any suggestions. Please try again.", "error");
        return;
      }
      onApply(text);
      showAlert(successLabel || "AI content applied", "success", 3500);
    } catch (err) {
      console.error("AI Error:", err);
      showAlert(
        "Failed to generate AI content: " +
          (err.response?.data?.message || err.message),
        "error",
        5000
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ---------- step marker (rate-limited) ----------
  const markStepDone = async (currentStep) => {
    if (!resumeId) return;

    // Rate limiting: don't mark step done if we just saved recently
    const sinceLastSave = Date.now() - lastSaveAtRef.current;
    if (sinceLastSave < 1000) {
      console.log("⏳ Rate limiting: skipping step mark (too soon after save)");
      return;
    }

    const payload = { steps: {} };
    if (currentStep === 1) {
      payload.title = resume.title;
      payload.contact = resume.contact;
      payload.steps.basicsDone = true;
    }
    if (currentStep === 2) {
      payload.contact = resume.contact;
      payload.steps.summaryDone = true;
    }
    if (currentStep === 3) {
      const validExperience = (resume.experience || []).filter(
        (e) => e.title || e.company
      );
      if (validExperience.length > 0) payload.experience = validExperience;
      payload.steps.experienceDone = true;
    }
    if (currentStep === 4) {
      const validEducation = (resume.education || []).filter(
        (e) => e.degree || e.school
      );
      if (validEducation.length > 0) payload.education = validEducation;
      payload.steps.educationDone = true;
    }
    if (currentStep === 5) {
      if (resume.skills?.length > 0) {
        payload.skills = resume.skills
          .filter((s) => s && (s.name || typeof s === "string"))
          .map((s) =>
            typeof s === "string"
              ? { name: s, level: 0 }
              : {
                  name: s.name || "",
                  level: typeof s.level === "number" ? s.level : 0,
                  score: typeof s.score === "number" ? s.score : undefined,
                }
          )
          .filter((s) => s.name);
      }
      payload.steps.skillsDone = true;
    }
    if (currentStep === 6) {
      if (resume.projects?.length > 0) {
        payload.projects = resume.projects;
      }
      payload.steps.projectsDone = true;
    }
    if (currentStep === 7) {
      if (resume.hobbies?.length > 0) {
        payload.hobbies = resume.hobbies;
      }
      if (resume.awards?.length > 0) {
        payload.awards = resume.awards;
      }
      payload.steps.hobbiesAwardsDone = true;
    }
    try {
      await api.patch(`/api/v1/resumes/${resumeId}`, payload);
    } catch (err) {
      console.error("Error marking step done:", err);

      // Handle 429 with exponential backoff
      if (err?.response?.status === 429) {
        const retryAfter = err?.response?.headers?.["retry-after"];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 3000; // Default 3 seconds

        console.log(`⏳ Step mark rate limited, retrying in ${delay}ms`);
        setTimeout(() => {
          markStepDone(currentStep);
        }, delay);
      }
    }
  };

  // ---------- Export ----------
  const handleExport = async (format) => {
    // Check if user is logged in
    if (!token || !user) {
      // Save to localStorage and show Export Gate Modal
      saveResumeToLocal({
        ...resume,
        templateSlug: resume.templateSlug || selectedTemplate?.slug,
      });
      setPendingExportFormat(format);
      setShowExportGate(true);
      return;
    }

    // 2. Trial user using a premium template → block download + show upgrade prompt
  if (isTrialUser && isPremiumTemplate) {
    const upgradeNow = await showConfirm(
      "Premium templates are only available for download with a paid subscription.\n\n" +
      "During your free trial you can edit and preview any template, but downloading requires upgrading.\n\n" +
      "Would you like to upgrade now?"
    );

    if (upgradeNow) {
      // Optional: save current resume ID for post-upgrade redirect
      if (resumeId) {
        localStorage.setItem("postUpgradeResumeId", resumeId);
      }
      navigate("/pricing");
    }
    return; // Stop export
  }
    
    if (!resumeId) {
      showAlert("Please save your resume first", "warning");
      return;
    }
    setExporting(true);
    setExportingFormat(format);
    try {
      // Only save if there are unsaved changes (check if saving is needed)
      const hasUnsavedChanges = saving || lastSaveAtRef.current === 0 || (Date.now() - lastSaveAtRef.current) > 5000;
      if (hasUnsavedChanges) {
        await upsertResume();
        // Reduce delay from 300ms to 100ms since we optimized the backend
        await new Promise((r) => setTimeout(r, 100));
      }

      console.log(`Exporting resume ${resumeId} as ${format}...`);

      // Build URLs (direct backend vs proxied)
      const backendOrigin =
        "https://ai-resume-builder-backend-uhdm.onrender.com";
      const ts = Date.now();
      // Word export uses server-side rendered template HTML, same as PDF.
      const serverFormat = format === "doc" ? "doc" : format;
      const directUrl = `${backendOrigin}/api/v1/resumes/${resumeId}/export/${serverFormat}?t=${ts}`;
      const proxiedUrl = `/api/v1/resumes/${resumeId}/export/${serverFormat}?t=${ts}`;

      const isLocal = /localhost|127\.0\.0\.1|::1/.test(
        window.location.hostname
      );

      let res;
      try {
        // Try the direct backend URL first (faster in development)
        const urlToUse = isLocal ? directUrl : proxiedUrl;
        res = await api.get(urlToUse, {
          responseType: format === "txt" ? "text" : "blob",
          timeout: 30000, // Reduced from 60s to 30s since we optimized PDF generation
          withCredentials: true,
        });
      } catch (firstErr) {
        console.warn(
          "Direct export failed, retrying via proxied URL:",
          firstErr?.message || firstErr
        );
        // Fallback to proxied path with shorter timeout
        res = await api.get(proxiedUrl, {
          responseType: format === "txt" ? "text" : "blob",
          timeout: 30000, // Reduced timeout
          withCredentials: true,
        });
      }

      // Debug: ensure we actually received a Blob for PDF/DOCX
      console.log(
        "isBlob:",
        res.data instanceof Blob,
        "blobType:",
        res.data?.type
      );

      console.log("Export response:", res);
      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);
      console.log("Response data type:", typeof res.data);
      console.log(
        "Response data size:",
        res.data?.length || res.data?.size || "unknown"
      );
      console.log("Response data:", res.data);
      if (format === "docx") {
        try {
          const headBuf = await res.data.slice(0, 8).arrayBuffer();
          console.log(
            "[Export] DOCX header bytes:",
            Array.from(new Uint8Array(headBuf))
          );
        } catch {}
      }

      // Build the file blob
      const mimeType =
        format === "pdf"
          ? "application/pdf"
          : format === "doc"
          ? "application/msword"
          : format === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "text/plain";

      // If server sent HTML/JSON error, surface it before saving a bad file
      const headerCT =
        res.headers?.["content-type"] || res.headers?.get?.("content-type");
      if (
        format !== "txt" &&
        headerCT &&
        !headerCT.includes("pdf") &&
        !headerCT.includes("word")
      ) {
        try {
          const txt = await res.data.text();
          console.error("Unexpected content-type:", headerCT, txt);
          showAlert(`Export failed: ${txt.slice(0, 300)}`, "error", 6000);
          setExporting(false);
          setExportingFormat(null);
          return;
        } catch {
          // continue
        }
      }

      let fileBlob;
      if (format === "txt") {
        fileBlob = new Blob([res.data], { type: mimeType });
      } else {
        // res.data is already a Blob when responseType:'blob'
        fileBlob = res.data;
      }

      // Validate header for PDF/DOCX before saving (helps catch corrupted downloads)
      try {
        const head = await fileBlob.slice(0, 5).arrayBuffer();
        const b = new Uint8Array(head);
        const badPdf =
          format === "pdf" &&
          !(
            b[0] === 0x25 &&
            b[1] === 0x50 &&
            b[2] === 0x44 &&
            b[3] === 0x46 &&
            b[4] === 0x2d
          );
        // DOC is HTML; DOCX is a ZIP (PK..). We only validate DOCX here.
        const badDocx = format === "docx" && !(b[0] === 0x50 && b[1] === 0x4b);
        if (badPdf || badDocx) {
          console.warn("Unexpected file header:", Array.from(b));
          // Fallback: some backends send JSON object of numeric keys {"0":137,"1":80,...}
          try {
            const txt = await fileBlob.text();
            const maybeJson = JSON.parse(txt);
            if (
              maybeJson &&
              typeof maybeJson === "object" &&
              !Array.isArray(maybeJson)
            ) {
              const keys = Object.keys(maybeJson)
                .map((k) => parseInt(k, 10))
                .filter((n) => Number.isFinite(n))
                .sort((a, b) => a - b);
              if (keys.length > 0) {
                const uint8 = new Uint8Array(keys.length);
                for (let i = 0; i < keys.length; i++)
                  uint8[i] = maybeJson[keys[i]] & 0xff;
                fileBlob = new Blob([uint8], { type: mimeType });
                console.log(
                  "Reconstructed binary from JSON bytes (length)",
                  keys.length
                );
              } else {
                showAlert("Export failed: received invalid file data.", "error");
                setExporting(false);
                setExportingFormat(null);
                return;
              }
            } else {
              showAlert("Export failed: received text instead of a file.", "error");
              setExporting(false);
              setExportingFormat(null);
              return;
            }
          } catch (reconstructErr) {
            console.error(
              "Failed to reconstruct binary from JSON:",
              reconstructErr
            );
            showAlert("Export failed: invalid file format from server.", "error");
            setExporting(false);
            setExportingFormat(null);
            return;
          }
        }
      } catch {
        // ignore header check failures
      }

      // Check file size BEFORE downloading to avoid double downloads
      // Fallback for DOCX/DOC that looks too small (often summary-only)
      if ((format === "docx" || format === "doc") && (fileBlob?.size || 0) < 12000) {
        console.warn(
          "[Export] DOCX/DOC blob appears small (",
          fileBlob?.size,
          ") — falling back to client Word .doc export."
        );
        exportClientWord();
        setExporting(false);
        setExportingFormat(null);
        return;
      }

      // Download the file
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      // Timestamp filename to avoid OS preview/cache reusing stale file
      const safeTitle =
        (resume.title || "resume").replace(/[^\w\-\s]+/g, "").trim() ||
        "resume";
      a.download = `${safeTitle}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Optional: open a preview tab for quick validation (won't run on TXT)
      // if (format !== "txt") {
      //   const previewUrl = window.URL.createObjectURL(fileBlob);
      //   setTimeout(() => window.open(previewUrl, "_blank"), 0);
      //   setTimeout(() => window.URL.revokeObjectURL(previewUrl), 10000);
      // }
      showToast(`Resume exported as ${format.toUpperCase()}. Redirecting…`, {
        type: "success",
        duration: 1800,
      });
      // Close modal if open and redirect to dashboard after successful download
      try {
        setShowCompletionModal(false);
      } catch {}
      setTimeout(() => navigate("/dashboard"), 300);
    } catch (err) {
      console.error("Export error:", err);

      // Handle payment required error (402)
      if (err?.response?.status === 402) {
        const errorMessage =
          err?.response?.data?.message ||
          "Upgrade required to download resumes";
        
        // Save current resume data before redirecting to pricing
        try {
          if (resumeId) {
            await upsertResume(); // Save current progress
          } else {
            // If resume not saved yet, save to sessionStorage
            const resumeDataToSave = {
              title: resume.title,
              templateSlug: resume.templateSlug || selectedTemplate?.slug,
              contact: resume.contact,
              experience: resume.experience,
              education: resume.education,
              skills: resume.skills,
              projects: resume.projects,
              hobbies: resume.hobbies,
              awards: resume.awards,
            };
            sessionStorage.setItem("pendingResumeData", JSON.stringify(resumeDataToSave));
            if (resume.templateSlug || selectedTemplate?.slug) {
              sessionStorage.setItem("pendingTemplateSlug", resume.templateSlug || selectedTemplate?.slug);
            }
            sessionStorage.setItem("pendingResumeId", resumeId || "");
          }
        } catch (e) {
          console.warn("Failed to save resume before upgrade:", e);
        }
        
        const shouldUpgrade = await showConfirm(
          `${errorMessage}

Upgrade to Professional or Premium plan to download your resume in PDF, DOCX, or TXT format.

Your progress will be saved. Would you like to upgrade now?`
        );
        if (shouldUpgrade) {
          // Store resume ID in localStorage for post-upgrade redirect
          if (resumeId) {
            localStorage.setItem("postUpgradeResumeId", resumeId);
          }
          navigate("/pricing");
        }
        setExporting(false);
        setExportingFormat(null);
        return;
      }
      if (format === "doc" || format === "docx") {
        // Fallback to client-side Word export if server Word export fails
        showToast("Server Word export failed. Exporting Word (.doc) from preview…", {
          type: "warning",
          duration: 2200,
        });
        try {
          exportClientWord();
          return;
        } catch (_) {}
      }
      showToast(
        `Failed to export as ${format.toUpperCase()}. Please try again.`,
        { type: "error" }
      );
    } finally {
      setExporting(false);
      setExportingFormat(null);
    }
  };

  // ---------- localStorage persistence ----------
  useEffect(() => {
    const storageKey = `resume-${resumeId || "draft"}`;
    localStorage.setItem(storageKey, JSON.stringify(resume));
  }, [resume, resumeId]);

  // ---------- mark typing helper ----------
  const markTyping = () => {
    typingRef.current = Date.now();
  };

  // ---------- Fetch template preview for non-logged-in users ----------
  const fetchTemplatePreview = async (templateSlug, resumeData = null) => {
    if (!templateSlug) return;
    
    try {
      let response;
      
      // If resume data is provided, render template with user's data (same as logged-in users)
      // Otherwise, just fetch the default template preview
      if (resumeData) {
        // Use the new render endpoint that accepts custom data
        response = await fetch(`/api/v1/templates/${templateSlug}/render`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(resumeData),
        });
      } else {
        // Use public template preview endpoint for initial load
        response = await fetch(`/api/v1/templates/${templateSlug}/preview`, {
          method: "GET",
          headers: {
            "Content-Type": "text/html",
          },
          credentials: "include",
        });
      }

      if (!response.ok) {
        throw new Error(`Preview failed: ${response.status} ${response.statusText}`);
      }

      const htmlContent = await response.text();
      setServerPreview(htmlContent);
      setServerPreviewUrl(""); // Clear URL if using HTML directly
    } catch (error) {
      console.error("Failed to fetch template preview:", error);
      // Fall back to local preview
      setServerPreview("");
    } finally {
      setIsTemplateLoading(false);
    }
  };

  // ---------- Server preview with rate limiting ----------
  const fetchServerPreview = async (skipRateLimit = false) => {
    if (!resumeId || !resume.templateSlug) {
      // For non-logged-in users, fetch template preview with their resume data
      if (!token && resume.templateSlug) {
        // Prepare resume data in the format expected by the render endpoint
        const resumeDataForRender = {
          contact: resume.contact || {},
          experience: resume.experience || [],
          education: resume.education || [],
          skills: resume.skills || [],
          projects: resume.projects || [],
          hobbies: resume.hobbies || [],
          awards: resume.awards || [],
        };
        await fetchTemplatePreview(resume.templateSlug, resumeDataForRender);
      }
      return;
    }

    // Rate limiting: don't fetch preview more than once every 800ms
    // Skip rate limiting for template changes (skipRateLimit = true)
    if (!skipRateLimit) {
      const sinceLastPreview = Date.now() - lastPreviewAtRef.current;
      if (sinceLastPreview < 800) {
        console.log("⏳ Rate limiting: skipping preview fetch (too soon)");
        return;
      }
    }

    // Don't fetch if already fetching
    if (previewInFlightRef.current) {
      console.log("⏳ Already fetching preview, skipping");
      return;
    }

    // Cancel any in-flight request
    if (previewAbortRef.current) {
      try {
        previewAbortRef.current.abort();
      } catch {
        /* ignore */
      }
      previewAbortRef.current = null;
    }

    const controller = new AbortController();
    previewAbortRef.current = controller;
    previewInFlightRef.current = true;
    lastPreviewAtRef.current = Date.now();

    try {
      const r = await api.get(`/api/v1/resumes/${resumeId}/preview`, {
        signal: controller.signal,
      });
      const html = r.data?.data?.html || r.data?.html || "";
      const url = r.data?.data?.url || r.data?.url || "";
      if (url) {
        setServerPreviewUrl(url);
        setServerPreview("");
      } else if (html) {
        setServerPreviewUrl("");
        setServerPreview(html);
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        // Handle 429 with exponential backoff
        if (err?.response?.status === 429) {
          const retryAfter = err?.response?.headers?.["retry-after"];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 10000; // Default 10 seconds

          console.log(`⏳ Preview rate limited, retrying in ${delay}ms`);
          previewRetryTimerRef.current = setTimeout(() => {
            fetchServerPreview();
          }, delay);
        } else {
          // Keep existing preview on other errors, don't clear it
          console.warn("Server preview failed, keeping existing preview:", err);
        }
      }
    } finally {
      previewInFlightRef.current = false;
    }
  };

  // ---------- Client-side Word export (DOC, no backend) ----------
  const exportClientWord = () => {
    // Prefer the most accurate HTML available
    const html = serverPreview || previewHtml || "";
    if (!html) {
      showToast("No preview available to export.", { type: "error" });
      return;
    }
    const full = `<!doctype html><html><head><meta charset="utf-8"><meta
      http-equiv="X-UA-Compatible" content="IE=edge"><style>@page{margin:1in} body{font-family:Arial,Helvetica,sans-serif}</style></head><body>${html}</body></html>`;
    const blob = new Blob([full], { type: "application/msword" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle =
      (resume.title || "resume").replace(/[^\w\-\s]+/g, "").trim() || "resume";
    a.href = url;
    a.download = `${safeTitle}-${Date.now()}.doc`; // Word-compatible HTML
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast("Exported Word (.doc) from preview (no server)", {
      type: "success",
      duration: 1800,
    });
  };

  // Initialize prevTemplateSlugRef if not already set
  if (prevTemplateSlugRef.current === null) {
    prevTemplateSlugRef.current = resume.templateSlug;
  }

  // Fetch server preview with debounce to avoid rate limiting
  useEffect(() => {
    if (!resume.templateSlug) return;

    // For non-logged-in users, render template with their data (same as logged-in users)
    if (!token && !resumeId) {
      // Check if template changed (immediate fetch) vs other data changes (debounced)
      const isTemplateChange = prevTemplateSlugRef.current !== resume.templateSlug;
      prevTemplateSlugRef.current = resume.templateSlug;

      // For template changes, fetch immediately (user expects quick feedback)
      // For other changes, use debounce to avoid rate limiting
      const delay = isTemplateChange ? 50 : 1500; // 50ms for template change, 1.5s for other changes

      const timeoutId = setTimeout(() => {
        setIsTemplateLoading(true);
        // Prepare resume data in the format expected by the render endpoint
        const resumeDataForRender = {
          contact: resume.contact || {},
          experience: resume.experience || [],
          education: resume.education || [],
          skills: resume.skills || [],
          projects: resume.projects || [],
          hobbies: resume.hobbies || [],
          awards: resume.awards || [],
        };
        fetchTemplatePreview(resume.templateSlug, resumeDataForRender).finally(() => {
          setIsTemplateLoading(false);
        });
      }, delay);

      return () => clearTimeout(timeoutId);
    }

    // For logged-in users with resumeId
    if (resumeId) {
      // Check if template changed (immediate fetch) vs other data changes (debounced)
      const isTemplateChange = prevTemplateSlugRef.current !== resume.templateSlug;
      prevTemplateSlugRef.current = resume.templateSlug;

      // For template changes, fetch immediately (user expects quick feedback)
      // For other changes, use debounce to avoid rate limiting
      const delay = isTemplateChange ? 50 : 2000; // 50ms for template change (almost immediate), 2s for other changes

      const timeoutId = setTimeout(() => {
        // Skip rate limiting for template changes to ensure immediate fetch
        fetchServerPreview(isTemplateChange);
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [
    resume.contact,
    resume.experience,
    resume.education,
    resume.skills,
    resume.projects,
    resume.hobbies,
    resume.awards,
    resume.templateSlug,
    resumeId,
    token,
  ]);

  // ---------- local preview (instant) ----------
  const previewHtml = useMemo(() => {
    const t = selectedTemplate;
    const templateSlug = t?.slug || resume.templateSlug || "";
    const fullName = resume.contact?.fullName || "Your Name";
    const email = resume.contact?.email || "email@example.com";
    const headline = resume.contact?.headline || "Product Designer (UX/UI)";
    const summary =
      resume.contact?.summary ||
      resume.contact?.professionalSummary ||
      "Use this block to introduce yourself.";
    const skills =
      (resume.skills || []).map((s) => s.name || s).filter(Boolean) || [];

    // Template-specific color schemes
    const getTemplateColors = (slug) => {
      const themes = {
        "modern-slate": {
          primary: "#2563eb",
          secondary: "#475569",
          accent: "#eff6ff",
          border: "#cbd5e1",
        },
        "classic-blue": {
          primary: "#1e40af",
          secondary: "#1e293b",
          accent: "#dbeafe",
          border: "#93c5fd",
        },
        "elegant-purple": {
          primary: "#7c3aed",
          secondary: "#4c1d95",
          accent: "#f3e8ff",
          border: "#c4b5fd",
        },
        "professional-green": {
          primary: "#059669",
          secondary: "#064e3b",
          accent: "#d1fae5",
          border: "#6ee7b7",
        },
        "creative-orange": {
          primary: "#ea580c",
          secondary: "#7c2d12",
          accent: "#fed7aa",
          border: "#fdba74",
        },
        "minimal-gray": {
          primary: "#374151",
          secondary: "#6b7280",
          accent: "#f3f4f6",
          border: "#d1d5db",
        },
      };
      return themes[slug] || themes["modern-slate"];
    };
    const colors = getTemplateColors(templateSlug);

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };

    const expHtml = (resume.experience || [])
      .filter((e) => e.title || e.company)
      .map((e) => {
        const dateRange = e.current
          ? `${formatDate(e.startDate)} – Present`
          : `${formatDate(e.startDate)}${
              e.endDate ? " – " + formatDate(e.endDate) : ""
            }`;
        const bullets = (e.bullets || []).filter(Boolean);
        return `
          <div style="margin-bottom:16px">
            <div style="font-weight:700">${e.title || "Job Title"}</div>
            <div style="color:#475569;font-size:13px">${
              e.company || "Company"
            } ${e.location ? "• " + e.location : ""} ${
          dateRange ? "• " + dateRange : ""
        }</div>
            ${
              bullets.length
                ? `<ul style="margin:6px 0 0 20px">${bullets
                    .map((b) => `<li>${b}</li>`)
                    .join("")}</ul>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    const eduHtml = (resume.education || [])
      .filter((e) => e.degree || e.school)
      .map((e) => {
        const dateRange = `${formatDate(e.startDate)}${
          e.endDate ? " – " + formatDate(e.endDate) : ""
        }`;
        const details = (e.details || []).filter(Boolean);
        return `
          <div style="margin-bottom:12px">
            <div style="font-weight:700">${e.degree || "Degree"}</div>
            <div style="color:#475569;font-size:13px">${e.school || "School"} ${
          e.location ? "• " + e.location : ""
        } ${dateRange ? "• " + dateRange : ""}</div>
            ${
              details.length
                ? `<ul style="margin:4px 0 0 20px;font-size:13px">${details
                    .map((d) => `<li>${d}</li>`)
                    .join("")}</ul>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    const projectsHtml = (resume.projects || [])
      .filter((p) => p.name || p.description)
      .map((p) => {
        const hasLink = p.link && p.link.trim().length > 0;
        return `
          <div style="margin-bottom:12px">
            <div style="font-weight:700">${p.name || "Project Name"}</div>
            ${
              p.description
                ? `<div style="color:#475569;font-size:13px">${p.description}</div>`
                : ""
            }
            ${
              hasLink
                ? `<a href="${p.link}" target="_blank">${p.link}</a>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    const hobbiesHtml = (resume.hobbies || [])
      .filter((h) => h.name || h.description)
      .map(
        (h) => `
          <div style="margin-bottom:8px">
            <div style="font-weight:600">${h.name || "Hobby"}</div>
            ${
              h.description
                ? `<div style="color:#475569;font-size:13px">${h.description}</div>`
                : ""
            }
          </div>
        `
      )
      .join("");

    const awardsHtml = (resume.awards || [])
      .filter((a) => a.title)
      .map((a) => {
        const date = formatDate(a.date);
        return `
          <div style="margin-bottom:10px">
            <div style="font-weight:600">${a.title}</div>
            <div style="color:#475569;font-size:13px">
              ${a.issuer || ""} ${date ? "• " + date : ""}
            </div>
            ${
              a.description
                ? `<div style="color:#475569;font-size:13px">${a.description}</div>`
                : ""
            }
          </div>
        `;
      })
      .join("");


    return `<!doctype html><html><head><meta charset="utf-8"/><style>
      body{font-family:Inter,Arial,Helvetica,sans-serif;margin:22px;color:#0f172a}
      h1{margin:0 0 2px;font-size:28px;color:${colors.primary}}
      .role{color:${colors.primary};font-weight:700;margin-bottom:6px}
      .muted{color:${colors.secondary}}
      .card{border:2px solid ${
        colors.border
      };border-radius:14px;padding:18px 20px;background:#fff}
      .band{display:flex;gap:12px;flex-wrap:wrap;color:#0f172a;font-size:12px;margin:10px 0 14px}
      .pill{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid ${
        colors.border
      };background:${colors.accent}}
      h3{margin:18px 0 6px;font-size:12px;letter-spacing:.12em;color:${
        colors.primary
      };font-weight:800}
      ul{margin:6px 0 0 20px}
      .chip{display:inline-block;background:${colors.accent};border:1px solid ${
        colors.border
      };padding:4px 10px;border-radius:999px;margin:4px 6px 0 0;font-size:12px;color:${
        colors.primary
      };font-weight:600}
      .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      strong,b{font-weight:700} em,i{font-style:italic} u{text-decoration:underline}
      ul{margin:8px 0;padding-left:20px;list-style-type:disc} ol{margin:8px 0;padding-left:20px;list-style-type:decimal} li{margin:4px 0;line-height:1.5} a{color:${
        colors.primary
      };text-decoration:underline}
      .top{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}
      .top-text{flex:1;min-width:240px}
    </style></head><body>
      <div class="card">
        <div class="top">
          <div class="top-text">
            <h1>${fullName}</h1>
            <div class="role">${headline}</div>
            <div class="band">
              <span class="pill">${email}</span>
              ${
                resume.contact?.phone
                  ? `<span class="pill">${resume.contact.phone}</span>`
                  : ""
              }
              ${
                resume.contact?.website
                  ? `<span class="pill">${resume.contact.website}</span>`
                  : ""
              }
            </div>
            <p class="muted">${summary}</p>
          </div>
        </div>
        ${expHtml ? `<h3>EXPERIENCE</h3>${expHtml}` : ""}
        <div class="row">
          <div>
            <h3>SKILLS</h3>
            <div>${
              skills.length > 0
                ? skills.map((x) => `<span class="chip">${x}</span>`).join("")
                : "<span style='color:#94a3b8;font-size:13px'>No skills added yet</span>"
            }</div>
            ${
              hobbiesHtml
                ? `<h3 style="margin-top:18px">HOBBIES</h3>${hobbiesHtml}`
                : ""
            }
          </div>
          <div>
            ${eduHtml ? `<h3>EDUCATION</h3>${eduHtml}` : ""}
            ${
              awardsHtml
                ? `<h3 style="margin-top:18px">AWARDS</h3>${awardsHtml}`
                : ""
            }
          </div>
        </div>
        ${
          projectsHtml
            ? `<div style="margin-top:18px">
                <h3>PROJECTS</h3>
                ${projectsHtml}
              </div>`
            : ""
        }
      </div>
    </body></html>`;
  }, [resume, selectedTemplate]);

  // ---------- helpers ----------
  const skillsAsString = (resume.skills || [])
    .map((s) => s.name || s)
    .join(", ");


  // ---------- UI ----------
  const stepTitles = [
    "Basics",
    "Summary",
    "Experience",
    "Education",
    "Skills",
    "Projects",
    "Hobbies/Awards",
  ];
  const stepSubtitles = [
    "Basic information and contact details",
    "Write a compelling professional summary",
    "Add your work experience and achievements",
    "Your educational background",
    "List your key skills and expertise",
    "Showcase your projects",
    "Add hobbies, awards, or achievements",
  ];

  const userIsTyping = () => Date.now() - typingRef.current < 500; // Increased to 500ms to reduce API calls

  useEffect(() => {
    // Keep form state and picker in sync with selected template
    if (selectedTemplate?.slug) {
      setResume((prev) => ({ ...prev, templateSlug: selectedTemplate.slug }));
    }
  }, [selectedTemplate?.slug]);

  // Migrate localStorage data to account when user authenticates
  useEffect(() => {
    if (token && user && !resumeId) {
      // User just authenticated, migrate localStorage data to account
      const localData = getResumeFromLocal();
      if (localData) {
        console.log("🔄 Migrating localStorage data to account...");
        // Clear localStorage after migration
        clearResumeLocal();
        // The resume state already has the data, so it will be saved to backend on next auto-save
        // Trigger an immediate save
        setTimeout(() => {
          upsertResume();
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  return (
    <div style={S.page}>
      {/* Export Gate Modal */}
      <ExportGateModal
        isOpen={showExportGate}
        onClose={() => {
          setShowExportGate(false);
          setPendingExportFormat(null);
        }}
        resumeData={resume}
        onContinueWithoutSaving={() => {
          showToast("Please create an account to download your resume", { type: "info" });
        }}
      />

      {(isInitializing || exporting) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
          }}>
          <div
            style={{
              background: "#ffffff",
              padding: "24px 28px",
              borderRadius: 14,
              boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
              minWidth: 260,
              textAlign: "center",
            }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "999px",
                border: "4px solid #e5e7eb",
                borderTopColor: "#2563eb",
                margin: "0 auto 12px",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              {isInitializing
                ? "Preparing your builder..."
                : "Exporting resume..."}
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              This usually takes just a moment.
            </div>
            <style>
              {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
          </div>
        </div>
      )}
      {showTemplateDialog && shouldShowTemplateDialog && templates.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 10px 40px rgba(15,23,42,0.35)",
            }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              Choose a template
            </h2>
            <p
              style={{
                marginTop: 8,
                marginBottom: 16,
                fontSize: 14,
                color: "#64748b",
              }}>
              Select the template you want to use for this resume. You can
              change it later.
            </p>
            <label style={{ ...S.label, marginBottom: 6 }}>Template</label>
            <select
              value={templateChoice || ""}
              onChange={(e) => setTemplateChoice(e.target.value)}
              style={{
                ...S.input,
                marginBottom: 16,
                cursor: "pointer",
              }}>
              {templates.map((t) => {
                const isPaid =
                  t.category === "premium" || t.category === "industry";
                // Don't lock templates - allow trial users to select them
                // They can edit and preview, but download will be restricted
                return (
                  <option
                    key={t.slug}
                    value={t.slug}>
                    {t.name || formatTemplateName(t)}
                    {t.category === "premium" || t.category === "industry"
                      ? " (Premium)"
                      : ""}
                  </option>
                );
              })}
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                style={S.btnGhost}
                onClick={() => {
                  if (token) {
                    navigate("/dashboard");
                  } else {
                    setShowTemplateDialog(false);
                    navigate("/");
                  }
                }}>
                Cancel
              </button>
              <button
                type="button"
                style={S.btnSolid}
                disabled={!templateChoice}
                onClick={() => {
                  const slug = templateChoice || templates[0]?.slug;
                  if (!slug) return;
                  const tpl =
                    templates.find((t) => t.slug === slug) || templates[0];
                  // Allow trial users to select premium templates for editing
                  // Download restrictions are enforced at download time
                  setSelectedTemplate(tpl);
                  setResume((prev) => ({
                    ...prev,
                    templateSlug: slug,
                  }));
                  setShowTemplateDialog(false);
                  markTyping();
                }}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {/* LEFT: Form */}
      <div style={S.left}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}>
          <div>
            <h2 style={S.headerTitle}>{stepTitles[step - 1]}</h2>
            <div style={S.headerSub}>{stepSubtitles[step - 1]}</div>
          </div>
          {token && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: "8px",
              background: "#ffffff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(37, 99, 235, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#eff6ff";
              e.currentTarget.style.borderColor = "#93c5fd";
              e.currentTarget.style.transform = "translateX(-4px)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(37, 99, 235, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#bfdbfe";
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(37, 99, 235, 0.1)";
            }}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
            </button>
          )}
        </div>

        {/* Stepper */}
        <div style={S.stepperWrap}>
          {[1, 2, 3, 4, 5, 6, 7].map((i, idx) => (
            <React.Fragment key={i}>
              <div
                title={stepTitles[i - 1]}
                style={S.step(i === step, i < step)}
                onClick={() => setStep(i)}>
                {i}
              </div>
              {idx < 6 && <div style={S.stepLine(i < step)} />}
            </React.Fragment>
          ))}
        </div>

        {/* Template Dropdown */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Template *</label>
          <select
            value={resume.templateSlug || ""}
            onChange={async (e) => {
              const newSlug = e.target.value;
              if (!newSlug) return;
              
              const newTemplate = templates.find((t) => t.slug === newSlug);
              if (!newTemplate) return;
              
              // Allow trial users to select premium templates
              // Download restrictions are enforced when attempting to download
              setSelectedTemplate(newTemplate);
              
              // Clear previous preview immediately for better UX
              if (token && resumeId) {
                setServerPreview("");
                setServerPreviewUrl("");
                // Cancel any in-flight preview request for the old template
                if (previewAbortRef.current) {
                  try {
                    previewAbortRef.current.abort();
                  } catch {
                    /* ignore */
                  }
                  previewAbortRef.current = null;
                }
                previewInFlightRef.current = false;
              }
              
              setResume((r) => ({
                ...r,
                templateSlug: newSlug,
              }));
              markTyping();
              
              // Fetch preview for non-logged-in users (no resumeId)
              if (!token && !resumeId) {
                await fetchTemplatePreview(newSlug);
              }
              // For logged-in users, preview will be fetched via useEffect (with minimal delay for template changes)
            }}
            style={{
              ...S.input,
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "36px",
            }}>
            <option value="" disabled>
              {hasTemplateSelected ? "Select a different template..." : "Select a template..."}
            </option>
            {templates.map((template) => {
              const isPremium = template.category === "premium" || template.category === "industry";
              // Allow trial users to select premium templates
              // Download restrictions are enforced when attempting to download
              const templateName = formatTemplateName(template);
              
              return (
                <option
                  key={template.slug}
                  value={template.slug}
                  style={{
                    color: THEME.text,
                  }}>
                  {templateName} {isPremium ? "(Premium)" : ""}
                </option>
              );
            })}
          </select>
          {!hasTemplateSelected && (
            <div
              style={{
                fontSize: "12px",
                color: "#f59e0b",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}>
              <span>⚠️</span>
              Please select a template to start building your resume
            </div>
          )}
        </div>

        {/* STEP 1: BASICS */}
        {step === 1 && (
          <>
          <section>
            <div
              style={{
                padding: "20px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 20px 0" }}>
                Contact Information
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Left Column */}
                <div>
                  <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Full Name *</label>
              <input
                placeholder="John Doe"
                style={S.input}
                      value={resume.contact.fullName || ""}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, fullName: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>

                  <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Email *</label>
              <input
                type="email"
                placeholder="john@example.com"
                style={S.input}
                      value={resume.contact.email || ""}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, email: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>

                  <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Phone</label>
              <input
                placeholder="+1 234 567 8901"
                style={S.input}
                      value={resume.contact.phone || ""}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, phone: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>

                  <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Location *</label>
              <input
                placeholder="New York, NY"
                style={S.input}
                value={resume.contact.location || ""}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, location: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>
                </div>

                {/* Right Column */}
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Job Title / Headline</label>
              <input
                      placeholder="Product Designer (UX/UI)"
                style={S.input}
                      value={resume.contact.headline || ""}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                          contact: { ...r.contact, headline: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>

                  <div style={{ marginBottom: 16 }}>
              <label style={S.label}>LinkedIn</label>
              <input
                placeholder="https://linkedin.com/in/username"
                style={S.input}
                value={resume.contact.linkedin || ""}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, linkedin: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>GitHub</label>
              <input
                      placeholder="https://github.com/username"
                style={S.input}
                      value={resume.contact.github || ""}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                          contact: { ...r.contact, github: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Portfolio Link</label>
              <input
                      placeholder="https://yourportfolio.com"
                style={S.input}
                      value={resume.contact.portfolioLink || ""}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                          contact: { ...r.contact, portfolioLink: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>
                </div>
              </div>

              {/* Optional hint if key fields are empty */}
              {(!resume.contact.fullName || !resume.contact.email || !resume.contact.location) && (
              <div
                style={{
                    marginTop: 20,
                    padding: "16px",
                    textAlign: "center",
                  color: "#64748b",
                    fontSize: "14px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  Fill in your name, email, and location to get started!
              </div>
              )}
            </div>
          </section>
          </>
        )}

        {/* STEP 3: EXPERIENCE */}
        {step === 3 && (
          <>
            <section>
              {resume.experience && resume.experience.length > 0 ? (
                <div style={{ display: "grid", gap: 28 }}>
            {resume.experience.map((exp, idx) => (
              <div
                key={idx}
                style={{
                        padding: "20px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Job Title */}
                      <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Job Title *</label>
                  <input
                    placeholder="Senior Product Designer"
                    style={S.input}
                          value={exp.title || ""}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[idx].title = e.target.value;
                      setResume((r) => ({ ...r, experience: newExp }));
                      markTyping();
                    }}
                  />
                </div>

                      {/* Company */}
                      <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Company *</label>
                  <input
                    placeholder="TechCorp Inc"
                    style={S.input}
                          value={exp.company || ""}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[idx].company = e.target.value;
                      setResume((r) => ({ ...r, experience: newExp }));
                      markTyping();
                    }}
                  />
                </div>

                      {/* Location */}
                      <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Location</label>
                  <input
                    placeholder="New York, NY"
                    style={S.input}
                          value={exp.location || ""}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[idx].location = e.target.value;
                      setResume((r) => ({ ...r, experience: newExp }));
                      markTyping();
                    }}
                  />
                </div>

                      {/* Dates - Now consistent with other inputs */}
                      <div style={{ ...S.grid2, marginBottom: 16 }}>
                  <div>
                    <label style={S.label}>
                            <CalendarDots size={18} color="#3b82f6" style={{ verticalAlign: "middle", marginRight: "6px" }} />
                            Start Date *
                            <span style={{ fontSize: 11, color: "#64748b" }}> (MM/DD/YYYY)</span>
                    </label>
                    <input
                      type="date"
                            style={S.input}  // Consistent style
                            value={exp.startDate || ""}
                      onFocus={openNativeDatePicker}
                      onClick={openNativeDatePicker}
                      onChange={(e) => {
                        const newExp = [...resume.experience];
                        newExp[idx].startDate = e.target.value;
                        setResume((r) => ({ ...r, experience: newExp }));
                        markTyping();
                      }}
                    />
                  </div>
                  <div>
                    <label style={S.label}>
                            <CalendarDots size={18} color="#3b82f6" style={{ verticalAlign: "middle", marginRight: "6px" }} />
                            End Date
                            <span style={{ fontSize: 11, color: "#64748b" }}> (or check "current")</span>
                    </label>
                    <input
                      type="date"
                      style={{
                              ...S.input,
                        opacity: exp.current ? 0.5 : 1,
                        cursor: exp.current ? "not-allowed" : "pointer",
                      }}
                            value={exp.endDate || ""}
                      disabled={exp.current}
                      onFocus={openNativeDatePicker}
                      onClick={openNativeDatePicker}
                      onChange={(e) => {
                        const newExp = [...resume.experience];
                        newExp[idx].endDate = e.target.value;
                        setResume((r) => ({ ...r, experience: newExp }));
                        markTyping();
                      }}
                    />
                  </div>
                </div>

                      {/* Current Job Checkbox */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                            checked={exp.current || false}
                      onChange={(e) => {
                        const newExp = [...resume.experience];
                        newExp[idx].current = e.target.checked;
                        if (e.target.checked) newExp[idx].endDate = "";
                        setResume((r) => ({ ...r, experience: newExp }));
                        markTyping();
                      }}
                            style={{ width: 16, height: 16 }}
                    />
                          <span style={{ ...S.label, margin: 0 }}>I currently work here</span>
                  </label>
                </div>

                      {/* Job Description / Bullets */}
                      <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>
                    Job Description / Responsibilities
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>
                      (Edit anywhere, add bullets with • Insert Bullet)
                    </span>
                  </label>
                  <RichTextEditor
                    value={
                      exp.descriptionHtml && exp.descriptionHtml.length > 0
                        ? exp.descriptionHtml
                        : bulletsToHtml(exp.bullets || [])
                    }
                    onChange={(html) => {
                      const newExp = [...resume.experience];
                      newExp[idx].descriptionHtml = html;
                      newExp[idx].bullets = extractBulletsFromHtml(html);
                      setResume((r) => ({ ...r, experience: newExp }));
                      markTyping();
                    }}
                    placeholder="Describe your impact. Use bullets for achievements and quantify results."
                          minHeight={140}
                  />
                </div>

                      {/* AI Assistant - Clean, integrated, button on right */}
                      <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e40af", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🤖</span> AI Assistant
                  </div>

                      {/* Input field - full width */}
                  <input
                        placeholder="Paste job description or describe the role for AI to generate bullet points..."
                        style={{ ...S.input, width: "100%", marginBottom: 10 }}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />

                      {/* Button - now directly below the input */}
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                  <button
                    type="button"
                    style={{
                          ...S.btnGhost,
                          width: "fit-content",
                          padding: "8px 16px",
                          fontSize: "14px",
                          margin: "0",
                          fontWeight: 500,
                          color: aiLoading ? "#94a3b8" : "#2563eb",
                          borderColor: aiLoading ? "#cbd5e1" : "#93c5fd",
                          justifyContent: "center",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    disabled={aiLoading}
                        onClick={() => generateExperienceBullets(idx)}
                      >
                        {aiLoading ? "🔄 Generating..." : "✨ Generate Bullets"}
                  </button>
                      </div>
                </div>
              </div>
            ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "15px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "2px dashed #cbd5e1",
                    marginBottom: 20,
                  }}
                >
                  No experience added yet.<br />
                  Use the button below to add your work history.
                </div>
              )}

              {/* Buttons - Position unchanged: bottom-right */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "16px",
                  flexWrap: "wrap",
                }}
              >
            <button
              type="button"
                  style={{
                    ...S.btnGhost,
                    padding: "10px 16px",
                    fontSize: "14px",
                  }}
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  experience: [
                    ...r.experience,
                    {
                      title: "",
                      company: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      current: false,
                      bullets: [],
                    },
                  ],
                }))
                  }
                >
                  + Add Experience
            </button>

            {resume.experience.length > 1 && (
              <button
                type="button"
                    data-variant="error"
                style={{
                  ...S.btnGhost,
                  borderColor: "#fecaca",
                  color: "#dc2626",
                      padding: "10px 16px",
                      fontSize: "14px",
                }}
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    experience: r.experience.slice(0, -1),
                  }))
                    }
                  >
                    Undo
              </button>
            )}

            {resume.experience.length > 0 && (
              <button
                type="button"
                    data-variant="error"
                style={{
                  ...S.btnGhost,
                  borderColor: "#fecaca",
                  color: "#dc2626",
                      padding: "10px 16px",
                      fontSize: "14px",
                }}
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                        experience: r.experience.length > 1 ? [r.experience[0]] : [],
                  }))
                    }
                  >
                    Clear
              </button>
            )}
              </div>
            </section>
          </>
        )}

        {/* STEP 4: EDUCATION */}
        {step === 4 && (
          <>
            {/* EDUCATION SECTION */}
            <section>
              {resume.education && resume.education.length > 0 ? (
                <div style={{ display: "grid", gap: 28 }}>
            {resume.education.map((edu, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "20px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Degree */}
                      <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Degree *</label>
                  <input
                    placeholder="BA in Interaction Design"
                    style={S.input}
                          value={edu.degree || ""}
                    onChange={(e) => {
                      const newEdu = [...resume.education];
                      newEdu[idx].degree = e.target.value;
                      setResume((r) => ({ ...r, education: newEdu }));
                      markTyping();
                    }}
                  />
                </div>

                      {/* School */}
                      <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>School / University *</label>
                  <input
                    placeholder="University of Design"
                    style={S.input}
                          value={edu.school || ""}
                    onChange={(e) => {
                      const newEdu = [...resume.education];
                      newEdu[idx].school = e.target.value;
                      setResume((r) => ({ ...r, education: newEdu }));
                      markTyping();
                    }}
                  />
                </div>

                      {/* Location */}
                      <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Location *</label>
                  <input
                    placeholder="New York, NY"
                    style={S.input}
                    value={edu.location || ""}
                    onChange={(e) => {
                      const newEdu = [...resume.education];
                      newEdu[idx].location = e.target.value;
                      setResume((r) => ({ ...r, education: newEdu }));
                      markTyping();
                    }}
                        />
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Location is required for education
                  </div>
                </div>

                      {/* Dates - Now using consistent S.input style instead of thick blue border */}
                      <div style={{ ...S.grid2, marginBottom: 16 }}>
                  <div>
                    <label style={S.label}>
                            <CalendarDots size={18} color="#3b82f6" style={{ verticalAlign: "middle", marginRight: "6px" }} />
                            Start Date
                            <span style={{ fontSize: 11, color: "#64748b" }}> (MM/DD/YYYY)</span>
                    </label>
                    <input
                      type="date"
                            style={S.input}  // Changed from S.dateInput → now matches other inputs
                            value={edu.startDate || ""}
                      onFocus={openNativeDatePicker}
                      onClick={openNativeDatePicker}
                      onChange={(e) => {
                        const newEdu = [...resume.education];
                        newEdu[idx].startDate = e.target.value;
                        setResume((r) => ({ ...r, education: newEdu }));
                        markTyping();
                      }}
                    />
                  </div>
                  <div>
                    <label style={S.label}>
                            <CalendarDots size={18} color="#3b82f6" style={{ verticalAlign: "middle", marginRight: "6px" }} />
                            End Date / Graduation
                            <span style={{ fontSize: 11, color: "#64748b" }}> (MM/DD/YYYY)</span>
                    </label>
                    <input
                      type="date"
                            style={S.input}  // Consistent with other fields
                            value={edu.endDate || ""}
                      onFocus={openNativeDatePicker}
                      onClick={openNativeDatePicker}
                      onChange={(e) => {
                        const newEdu = [...resume.education];
                        newEdu[idx].endDate = e.target.value;
                        setResume((r) => ({ ...r, education: newEdu }));
                        markTyping();
                      }}
                    />
                  </div>
                </div>

                      {/* Additional Details - Now uses S.textarea consistently */}
                      <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>Additional Details</label>
                  <textarea
                          placeholder="Graduated with honors 
        GPA: 3.9/4.0" 
                    style={S.textarea}
                    value={(edu.details || []).join("\n")}
                    onChange={(e) => {
                      const newEdu = [...resume.education];
                            newEdu[idx].details = e.target.value.split("\n").filter(line => line.trim());
                      setResume((r) => ({ ...r, education: newEdu }));
                      markTyping();
                    }}
                  />
                </div>
              </div>
            ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "15px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "2px dashed #cbd5e1",
                    marginBottom: 20,
                  }}
                >
                  No education added yet.<br />
                  Use the button below to add your academic background.
                </div>
              )}

              {/* Buttons - Position unchanged: bottom-right */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "16px",
                  flexWrap: "wrap",
                }}
              >
            <button
              type="button"
                  style={{
                    ...S.btnGhost,
                    padding: "10px 16px",
                    fontSize: "14px",
                  }}
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  education: [
                    ...r.education,
                    {
                      degree: "",
                      school: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      details: [],
                    },
                  ],
                }))
                  }
                >
                  + Add Education
            </button>

            {resume.education.length > 1 && (
              <button
                type="button"
                    data-variant="error"
                style={{
                  ...S.btnGhost,
                  borderColor: "#fecaca",
                  color: "#dc2626",
                      padding: "10px 16px",
                      fontSize: "14px",
                }}
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    education: r.education.slice(0, -1),
                  }))
                    }
                  >
                    Undo
              </button>
            )}

            {resume.education.length > 0 && (
              <button
                type="button"
                    data-variant="error"
                style={{
                  ...S.btnGhost,
                  borderColor: "#fecaca",
                  color: "#dc2626",
                      padding: "10px 16px",
                      fontSize: "14px",
                }}
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    education: r.education.length > 1 ? [r.education[0]] : [],
                  }))
                    }
                  >
                    Clear
              </button>
            )}
              </div>
            </section>
          </>
        )}

        {/* STEP 5: SKILLS */}
        {step === 5 && (
          <>
            <section>
              <div
                style={{
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
              <label style={S.label}>Your Skills</label>

                {/* Display existing skills as chips */}
              <div style={S.chipRow}>
                {(resume.skills || [])
                  .filter(Boolean)
                  .map((skill, i) => {
                    const name = typeof skill === "string" ? skill : skill?.name;
                    if (!name) return null;
                    const score =
                      typeof skill === "object" && skill?.score !== undefined
                        ? skill.score
                        : null;
                    return (
                      <span
                        key={`${name}-${i}`}
                        style={S.chip}
                        onClick={() => removeSkill(name)}
                          title={`Remove${score !== null ? ` (Score: ${score})` : ""}`}
                        >
                        {name}
                        {score !== null ? ` (${score})` : ""}
                          <span style={{ fontWeight: 700, lineHeight: 1 }}> ×</span>
                      </span>
                    );
                  })
                  .filter(Boolean)}
              </div>

                {/* Add new skill */}
                <div style={{ marginTop: 20 }}>
                <label style={S.label}>Add a skill (press Enter to add)</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    value={skillsInput}
                      placeholder="e.g., React, Python, Leadership"
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitSkillToken();
                        setSkillsInput("");
                      }
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    style={{ ...S.input, width: "80px" }}
                    placeholder="Score"
                    value={skillScoreInput}
                    onChange={(e) => setSkillScoreInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitSkillToken();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      commitSkillToken();
                        setSkillsInput("");
                        setSkillScoreInput("");
                      }}
                      style={{
                        ...S.btnGhost,
                        padding: "10px 16px",
                        fontSize: "14px",
                        minWidth: "80px",
                      }}
                    >
                    Add
                  </button>
                </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Optional: Add a score (0–100) if your template supports skill levels
                </div>
                </div>

                {/* AI Assistant */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e40af", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🤖</span> AI Assistant
                  </div>

                  {/* Input field - full width */}
                  <input
                    placeholder="Paste job description or describe your target role for AI skill suggestions..."
                    style={{ ...S.input, width: "100%", marginBottom: 10 }}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />

                  {/* Button - now directly below the input */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                  <button
                    type="button"
                    style={{
                      ...S.btnGhost,
                      width: "fit-content",
                      padding: "8px 14px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: aiLoading ? "#94a3b8" : "#2563eb",
                      borderColor: aiLoading ? "#cbd5e1" : "#93c5fd",
                      justifyContent: "center",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    disabled={aiLoading}
                    onClick={() =>
                      generateAiForField(
                        "skills",
                        (text) => {
                          const items = text
                            .split(/[,\n]/)
                            .map((l) => l.trim())
                            .filter(Boolean);
                          const unique = Array.from(new Set(items));
                          setResume((r) => ({
                            ...r,
                            skills: [...(r.skills || []), ...unique.map((name) => ({ name }))],
                          }));
                          markTyping();
                        },
                        "AI skills added!"
                      )
                    }
                  >
                    {aiLoading ? "🔄 Generating..." : "✨ Suggest Skills"}
                  </button>
                </div>
              </div>

                {/* Empty state */}
                {(resume.skills || []).length === 0 && (
                  <div
                    style={{
                      marginTop: 24,
                      padding: "32px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "14px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    No skills added yet. Start typing to add your key skills!
            </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* STEP 6: PROJECTS */}
        {step === 6 && (
          <>
            {resume.projects && resume.projects.length > 0 ? (
              resume.projects.map((proj, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: 24,
                      padding: "20px",
                    border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Project Name */}
                    <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Project Name *</label>
                    <input
                      placeholder="E-commerce Website"
                      style={S.input}
                      value={proj.name || ""}
                      onChange={(e) => {
                        const newProjects = [...(resume.projects || [])];
                          newProjects[idx] = { ...newProjects[idx], name: e.target.value };
                        setResume((r) => ({ ...r, projects: newProjects }));
                        markTyping();
                      }}
                    />
                  </div>

                    {/* Description */}
                    <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>
                      Description
                      <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>
                        (Edit anywhere, use formatting tools above)
                      </span>
                    </label>
                    <RichTextEditor
                      value={proj.descriptionHtml || proj.description || ""}
                      onChange={(html) => {
                        const newProjects = [...(resume.projects || [])];
                        newProjects[idx] = { 
                          ...newProjects[idx], 
                          descriptionHtml: html,
                          description: html, // Keep for backwards compatibility
                        };
                        setResume((r) => ({ ...r, projects: newProjects }));
                        markTyping();
                      }}
                      placeholder="Describe the project, technologies used, and your role..."
                      minHeight={120}
                    />
                  </div>

                    {/* AI Assistant - Clean, form-integrated style (no blue bg) */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e40af", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🤖</span> AI Assistant
                      </div>

                      {/* Input field - full width */}
                  <input
                        placeholder="Paste job description or describe target role for AI suggestions..."
                        style={{ ...S.input, width: "100%", marginBottom: 10 }}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />

                      {/* Button - now directly below the input */}
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                  <button
                    type="button"
                    style={{
                          ...S.btnGhost,
                          width: "fit-content",
                          padding: "8px 14px",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: aiLoading ? "#94a3b8" : "#2563eb",
                          borderColor: aiLoading ? "#cbd5e1" : "#93c5fd",
                          justifyContent: "center",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    disabled={aiLoading}
                    onClick={() =>
                      generateAiForField(
                        "projectDescription",
                        (text) => {
                              const newProjects = [...resume.projects];
                              newProjects[idx].description = text;
                              newProjects[idx].descriptionHtml = text;
                          setResume((r) => ({ ...r, projects: newProjects }));
                          markTyping();
                        },
                            "AI description applied!"
                      )
                        }
                      >
                        {aiLoading ? "🔄 Generating..." : "✨ Suggest Description"}
                  </button>
                </div>
                    </div>

                    {/* Link */}
                    <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>Link</label>
                    <input
                      placeholder="https://project-url.com"
                      style={S.input}
                      value={proj.link || ""}
                      onChange={(e) => {
                        const newProjects = [...(resume.projects || [])];
                          newProjects[idx] = { ...newProjects[idx], link: e.target.value };
                        setResume((r) => ({ ...r, projects: newProjects }));
                        markTyping();
                      }}
                    />
                  </div>

                    {/* Remove Button - Position unchanged (bottom-right) */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                        data-variant="error"
                    style={{
                      ...S.btnGhost,
                      borderColor: "#fecaca",
                      color: "#dc2626",
                          padding: "8px 14px",
                          fontSize: "13px",
                    }}
                    onClick={() => {
                          const newProjects = resume.projects.filter((_, i) => i !== idx);
                      setResume((r) => ({ ...r, projects: newProjects }));
                      markTyping();
                        }}
                      >
                        Remove
                  </button>
                    </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  marginBottom: "16px",
                    textAlign: "center",
                    padding: "32px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  No projects added yet. Click "+ Add Project" to get started.
              </div>
            )}

              {/* Add Project Button - Position unchanged (bottom-right) */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
                  style={{
                    ...S.btnGhost,
                    padding: "10px 16px",
                    fontSize: "14px",
                  }}
              onClick={() => {
                setResume((r) => ({
                  ...r,
                  projects: [
                    ...(r.projects || []),
                    { name: "", description: "", link: "" },
                  ],
                }));
                markTyping();
                  }}
                >
              + Add Project
            </button>
              </div>
          </>
        )}

        {/* STEP 7: HOBBIES / AWARDS */}
        {step === 7 && (
          <>
          <section style={{ marginBottom: 32 }}>
            <div
                style={{
                padding: "20px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Hobbies
              </h3>
                <button
                  type="button"
                  style={{
                    ...S.btnGhost,
                    padding: "10px 16px",
                    fontSize: "14px",
                  }}
                  onClick={() => {
                    setResume((r) => ({
                      ...r,
                      hobbies: [...(r.hobbies || []), { name: "" }],
                    }));
                    markTyping();
                  }}
                >
                  + Add Hobby
                </button>
              </div>

              {resume.hobbies && resume.hobbies.length > 0 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {resume.hobbies.map((hobby, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input
                          placeholder="e.g., Photography, Hiking, Cooking"
                          style={{ ...S.input, flex: 1 }}
                          value={hobby.name || ""}
                          onChange={(e) => {
                            const newHobbies = [...resume.hobbies];
                            newHobbies[idx].name = e.target.value;
                            setResume((r) => ({ ...r, hobbies: newHobbies }));
                            markTyping();
                          }}
                        />
                        <button
                          type="button"
                          data-variant="error"
                          style={{
                            ...S.btnGhost,
                            borderColor: "#fecaca",
                            color: "#dc2626",
                            padding: "8px 14px",
                            fontSize: "13px",
                            minWidth: "80px",
                          }}
                          onClick={() => {
                            const newHobbies = resume.hobbies.filter((_, i) => i !== idx);
                            setResume((r) => ({ ...r, hobbies: newHobbies }));
                            markTyping();
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "14px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  No hobbies added yet. Click "+ Add Hobby" to get started.
                </div>
              )}
            </div>
          </section>

          <section>
            <div
              style={{
                padding: "20px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Awards & Achievements
                </h3>
              <button
                type="button"
                  style={{
                    ...S.btnGhost,
                    padding: "10px 16px",
                    fontSize: "14px",
                  }}
                onClick={() => {
                  setResume((r) => ({
                    ...r,
                      awards: [...(r.awards || []), { title: "", description: "", issuer: "" }],
                  }));
                  markTyping();
                  }}
                >
                  + Add Award
              </button>
            </div>

              {resume.awards && resume.awards.length > 0 ? (
                <div style={{ display: "grid", gap: 20 }}>
                  {resume.awards.map((award, idx) => (
                  <div
                    key={idx}
                    style={{
                        padding: "20px",
                      border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ marginBottom: 16 }}>
                      <label style={S.label}>Title *</label>
                      <input
                          placeholder="e.g., Employee of the Year 2024"
                        style={S.input}
                        value={award.title || ""}
                        onChange={(e) => {
                            const newAwards = [...resume.awards];
                            newAwards[idx].title = e.target.value;
                          setResume((r) => ({ ...r, awards: newAwards }));
                          markTyping();
                        }}
                      />
                    </div>

                      <div style={{ marginBottom: 16 }}>
                      <label style={S.label}>
                        Description
                        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>
                          (Edit anywhere, use formatting tools above)
                        </span>
                      </label>
                      <RichTextEditor
                        value={award.descriptionHtml || award.description || ""}
                        onChange={(html) => {
                          const newAwards = [...resume.awards];
                          newAwards[idx] = {
                            ...newAwards[idx],
                            descriptionHtml: html,
                            description: html, // Keep for backwards compatibility
                          };
                          setResume((r) => ({ ...r, awards: newAwards }));
                          markTyping();
                        }}
                        placeholder="Briefly describe the award and your achievement..."
                        minHeight={120}
                      />
                    </div>

                      <div style={{ marginBottom: 20 }}>
                        <label style={S.label}>Issuer / Organization</label>
                      <input
                          placeholder="e.g., TechCorp Inc., Google"
                        style={S.input}
                        value={award.issuer || ""}
                        onChange={(e) => {
                            const newAwards = [...resume.awards];
                            newAwards[idx].issuer = e.target.value;
                          setResume((r) => ({ ...r, awards: newAwards }));
                          markTyping();
                        }}
                      />
                    </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                          data-variant="error"
                      style={{
                        ...S.btnGhost,
                        borderColor: "#fecaca",
                        color: "#dc2626",
                            padding: "8px 16px",
                      }}
                      onClick={() => {
                            const newAwards = resume.awards.filter((_, i) => i !== idx);
                        setResume((r) => ({ ...r, awards: newAwards }));
                        markTyping();
                          }}
                        >
                      Remove Award
                    </button>
                  </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "14px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  No awards added yet. Click "+ Add Award" to highlight your achievements.
                </div>
              )}
            </div>
          </section>
          </>
        )}

        {/* STEP 2: SUMMARY */}
        {step === 2 && (
          <>
            <section>
              <div
                style={{
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  marginBottom: 24,
                }}
              >
              <label style={S.label}>
                  Professional Summary
                <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>
                    (Edit anywhere, add bullets with • Insert Bullet)
                </span>
              </label>

              <RichTextEditor
                value={
                  resume.contact.summary ||
                  resume.contact.professionalSummary ||
                  ""
                }
                onChange={(html) => {
                  setResume((r) => ({
                    ...r,
                    contact: {
                      ...r.contact,
                      summary: html,
                      professionalSummary: html,
                    },
                  }));
                  markTyping();
                }}
                  placeholder="Write a compelling professional summary that highlights your experience, skills, and career goals..."
                  minHeight={160}
                />

                {/* Clear Summary Button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button
                  type="button"
                    data-variant="error"
                  style={{
                    ...S.btnGhost,
                    borderColor: "#fecaca",
                    color: "#dc2626",
                      padding: "8px 14px",
                      fontSize: "13px",
                  }}
                  onClick={() => {
                    setResume((r) => ({
                      ...r,
                      contact: {
                        ...r.contact,
                        summary: "",
                        professionalSummary: "",
                      },
                    }));
                    markTyping();
                    }}
                  >
                  Clear Summary
                </button>
            </div>

                {/* AI Assistant */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e40af", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🤖</span> AI Assistant
              </div>

                  {/* Input field - full width */}
              <input
                    placeholder="Paste job description or describe your target role for AI suggestions..."
                    style={{ ...S.input, width: "100%", marginBottom: 10 }}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !aiLoading) {
                        e.preventDefault();
                        generateSummary();
                      }
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
              <button
                type="button"
                style={{
                    ...S.btnGhost,
                    width: "fit-content",
                    margin: "0", // centers it
                    padding: "8px 16px",
                    fontSize: "13px",
                    color: aiLoading ? "#94a3b8" : "#2563eb",
                    borderColor: aiLoading ? "#cbd5e1" : "#93c5fd",
                  }}
                  disabled={aiLoading}
                onClick={generateSummary}
                >
                  {aiLoading ? "🔄 Generating..." : "✨ Generate Summary"}
              </button>
                </div>
                </div>

                {/* Empty hint */}
                {(!resume.contact.summary && !resume.contact.professionalSummary) && (
                <div
                  style={{
                      marginTop: 24,
                      padding: "20px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "14px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    No summary yet.<br />
                    Write one above or use the AI Assistant to get started!
                </div>
              )}
            </div>
            </section>
          </>
        )}

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {/* <button
            type="button"
            style={S.btnGhost}
            onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Back
          </button> */}
          <button
            type="button"
            style={S.btnSolid}
            onClick={async () => {
              await markStepDone(step);
              if (step < 7) setStep((s) => s + 1);
              else await handleCompletion();
            }}>
            {step === 7 ? "Complete Resume" : "Next Step"}
          </button>
        </div>
      </div>

      {/* RIGHT: Preview */}
      <div style={S.rightWrap}>
        <div style={S.previewTop}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <strong style={{ fontSize: 14 }}>Live Preview</strong>
            {selectedTemplate && (
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Template: {selectedTemplate.name || selectedTemplate.slug}
              </span>
            )}
          </div>
          {/* <span style={S.hint}>
            {userIsTyping() ? (
              <span style={{ color: "#2563eb", fontWeight: 600 }}>
                🔄 Updating…
              </span>
            ) : (
              <span style={{ color: "#059669", fontWeight: 600 }}>
                ✅ Live Preview
              </span>
            )}
          </span> */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              data-variant="ghost"
              onClick={() => {
                // Allow all users to preview and download
                // Download restrictions are enforced in the modal
                handleCompletion();
              }}
              disabled={!resume.templateSlug}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
                opacity: !resume.templateSlug ? 0.5 : 1,
                cursor: !resume.templateSlug ? "not-allowed" : "pointer",
              }}>
              <Eye size={14} strokeWidth={2.5} />
              Preview & Download
            </button>
          </div>
        </div>
        <div style={S.card}>

          {/* Template Loading Overlay - removed, no loader during content changes */}
    {false && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255, 255, 255, 0.85)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "5px solid #e5e7eb",
            borderTopColor: "#2563eb",
            animation: "spin 1s linear infinite",
            marginBottom: 16,
          }}
        />
        <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
          Loading template...
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
          Applying {selectedTemplate?.name || "new template"}
        </div>
      </div>
    )}

          {/* Show loader during initialization or when waiting for server preview */}
          {isInitializing || (resumeId && !serverPreviewUrl && !serverPreview) || (!resumeId && !token && !serverPreview && resume.templateSlug) ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "600px",
                padding: "40px",
              }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "999px",
                  border: "4px solid #e5e7eb",
                  borderTopColor: "#2563eb",
                  marginBottom: 16,
                  animation: "spin 0.9s linear infinite",
                }}
              />
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: "#0f172a" }}>
                {isInitializing ? "Preparing your resume..." : "Loading preview..."}
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                This usually takes just a moment.
              </div>
              <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
              </style>
            </div>
          ) : serverPreviewUrl ? (
            <iframe title="preview" src={serverPreviewUrl} style={S.iframe} />
          ) : serverPreview ? (
            <iframe title="preview" srcDoc={serverPreview} style={S.iframe} />
          ) : (
            <iframe title="preview" srcDoc={previewHtml} style={S.iframe} />
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && completionData && (
        <CompletionModal
          data={completionData}
          onClose={() => setShowCompletionModal(false)}
          onExport={handleExport}
          exporting={exporting}
          exportingFormat={exportingFormat}
          navigate={navigate}
        />
      )}
    </div>
  );

  // ---------- completion handler (after JSX for clarity) ----------
  async function handleCompletion() {
    console.log("🔍 handleCompletion called", { hasToken: !!token, templateSlug: resume.templateSlug });
    
    if (!resume.templateSlug) {
      showAlert("Please select a template first", "warning");
      return;
    }
    
    try {
      let finalPreviewHtml = "";
      let resumeData = resume;
      
      if (resumeId && token) {
        // Logged-in user with resume: fetch from server
        try {
          // Persist latest changes/template before showing modal to match export
          await upsertResume();
          const [resumeRes, previewRes] = await Promise.all([
            api.get(`/api/v1/resumes/${resumeId}`),
            api
              .get(`/api/v1/resumes/${resumeId}/preview`)
              .catch((err) => ({ data: { html: previewHtml } })),
          ]);
          resumeData = resumeRes.data?.data?.resume || resumeRes.data?.data || resume;
          // Prefer server-rendered HTML so modal matches export exactly
          finalPreviewHtml =
            previewRes.data?.data?.html ||
            previewRes.data?.html ||
            previewHtml ||
            "";
        } catch (error) {
          console.error("Failed to load resume data:", error);
          // Fall through to use local data
        }
      }
      
      // For non-logged-in users or if server fetch failed, use template render API with resume data
      if (!finalPreviewHtml && resume.templateSlug) {
        try {
          // Prepare resume data in the format expected by the render endpoint
          const resumeDataForRender = {
            contact: resume.contact || {},
            experience: resume.experience || [],
            education: resume.education || [],
            skills: resume.skills || [],
            projects: resume.projects || [],
            hobbies: resume.hobbies || [],
            awards: resume.awards || [],
          };
          
          const response = await fetch(`/api/v1/templates/${resume.templateSlug}/render`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(resumeDataForRender),
          });
          
          if (response.ok) {
            finalPreviewHtml = await response.text();
          } else {
            // Fall back to local preview
            finalPreviewHtml = previewHtml || "";
          }
        } catch (error) {
          console.error("Failed to fetch template preview:", error);
          // Fall back to local preview
          finalPreviewHtml = previewHtml || "";
        }
      }
      
      // If still no preview, use local preview
      if (!finalPreviewHtml) {
        finalPreviewHtml = previewHtml || "";
      }

      // For non-logged-in users, save resume data to localStorage before showing modal
      // This ensures data is preserved if user signs up/signs in
      console.log("🔍 Checking token status:", { token: !!token, tokenValue: token });
      if (!token) {
        console.log("✅ Non-logged-in user detected, saving resume to localStorage...");
        // Use the current resume state (not resumeData which might be from server)
        // This ensures we capture all the latest user input
        const dataToSave = {
          ...resume, // Use current resume state which has all the latest data
          templateSlug: resume.templateSlug || selectedTemplate?.slug,
        };
        console.log("📦 Data to save:", {
          title: dataToSave.title,
          templateSlug: dataToSave.templateSlug,
          hasContact: !!dataToSave.contact,
          experienceCount: dataToSave.experience?.length || 0,
          educationCount: dataToSave.education?.length || 0,
        });
        saveResumeToLocal(dataToSave);
        console.log("💾 Saved resume to localStorage for non-logged-in user:", {
          title: dataToSave.title,
          templateSlug: dataToSave.templateSlug,
          hasContact: !!dataToSave.contact,
          contactFields: dataToSave.contact ? Object.keys(dataToSave.contact) : [],
          contactSample: dataToSave.contact ? {
            fullName: dataToSave.contact.fullName,
            email: dataToSave.contact.email,
            hasSummary: !!(dataToSave.contact.summary || dataToSave.contact.professionalSummary),
          } : null,
          experienceCount: dataToSave.experience?.length || 0,
          experienceSample: dataToSave.experience?.[0] ? {
            title: dataToSave.experience[0].title,
            company: dataToSave.experience[0].company,
          } : null,
          educationCount: dataToSave.education?.length || 0,
          educationSample: dataToSave.education?.[0] ? {
            degree: dataToSave.education[0].degree,
            school: dataToSave.education[0].school,
          } : null,
          skillsCount: dataToSave.skills?.length || 0,
          projectsCount: dataToSave.projects?.length || 0,
          hobbiesCount: dataToSave.hobbies?.length || 0,
          awardsCount: dataToSave.awards?.length || 0,
        });
      }

      setCompletionData({
        resume: resumeData,
        previewHtml: finalPreviewHtml,
        template: selectedTemplate,
        resumeId: resumeId || null,
        canDownload,
        token, // Pass token to check if user is logged in
      });
      setShowCompletionModal(true);
    } catch (error) {
      console.error("Failed to load completion data:", error);
      // Use local preview as fallback
      setCompletionData({
        resume,
        previewHtml: serverPreview || previewHtml || "",
        template: selectedTemplate,
        resumeId: resumeId || null,
        canDownload,
      });
      setShowCompletionModal(true);
    }
  }
}

// ------------------------------
// Completion Modal Component
// ------------------------------
// function CompletionModal({
//   data,
//   onClose,
//   onExport,
//   exporting,
//   exportingFormat,
// }) {
//   const { resume, previewHtml, template, resumeId } = data;

//   // Define formatDate function
//   const formatDate = (dateStr) => {
//     if (!dateStr) return "";
//     const d = new Date(dateStr);
//     return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
//   };

//   // Define theme for this component
//   const THEME = {
//     pageBg: "#f2f4f7",
//     cardBg: "#ffffff",
//     panelBg: "#ffffff",
//     border: "#dce3ef",
//     text: "#0f172a",
//     sub: "#64748b",
//     muted: "#94a3b8",
//     inputBg: "#ffffff",
//   };

//   // Define styles for this component
//   const S = {
//     sectionTitle: {
//       fontSize: 18,
//       fontWeight: 600,
//       margin: "0 0 16px 0",
//       color: THEME.text,
//       borderBottom: `2px solid ${THEME.border}`,
//       paddingBottom: 8,
//     },
//     label: {
//       fontSize: 12,
//       color: THEME.sub,
//       marginBottom: 6,
//       display: "block",
//       fontWeight: 500,
//     },
//     grid2: {
//       display: "grid",
//       gridTemplateColumns: "1fr 1fr",
//       gap: 12,
//       marginBottom: 16,
//     },
//     btnSolid: {
//     background: "#2563eb",
//     color: "#ffffff",
//     border: "none",
//     borderRadius: "12px",
//     padding: "12px 20px",
//     fontWeight: 600,
//     fontSize: "14px",
//     cursor: "pointer",
//     boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
//     transition: "all 0.2s ease-in-out",
//   },
//     btnGhost: {
//       background: THEME.cardBg,
//       color: "#2563eb",
//       border: "1px solid #93c5fd",
//       borderRadius: 10,
//       padding: "12px 20px",
//       fontSize: 14,
//       fontWeight: 500,
//       cursor: "pointer",
//       transition: "all 0.2s",
//     },
//     small: {
//       fontSize: 12,
//       color: THEME.muted,
//       margin: "2px 0",
//     },
//   };

//   const modalStyles = {
//     overlay: {
//       position: "fixed",
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       background: "rgba(0, 0, 0, 0.6)",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       zIndex: 9999,
//       padding: "20px",
//     },
//     modal: {
//       background: "#fff",
//       borderRadius: "20px",
//       maxWidth: "1200px",
//       width: "100%",
//       maxHeight: "90vh",
//       overflow: "hidden",
//       boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//       display: "flex",
//       flexDirection: "column",
//     },
//     header: {
//       padding: "24px 32px",
//       borderBottom: "1px solid #e5e7eb",
//       display: "flex",
//       justifyContent: "space-between",
//       alignItems: "center",
//       background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
//     },
//     title: { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 },
//     subtitle: { fontSize: "14px", color: "#64748b", margin: "4px 0 0" },
//     closeBtn: {
//       background: "none",
//       border: "none",
//       fontSize: "28px",
//       color: "#64748b",
//       cursor: "pointer",
//       padding: "8px",
//       borderRadius: "8px",
//       transition: "all 0.2s",
//     },
//     body: { flex: 1, display: "flex", overflow: "hidden" },
//     leftPanel: {
//       flex: 1,
//       padding: "32px",
//       overflow: "auto",
//       borderRight: "1px solid #e5e7eb",
//     },
//     rightPanel: {
//       flex: 1,
//       padding: "32px",
//       background: THEME.panelBg,
//       display: "flex",
//       flexDirection: "column",
//       minHeight: 0,
//     },
//   };
//   return (
//     <div style={modalStyles.overlay}>
//       <div style={modalStyles.modal}>
//         <div style={modalStyles.header}>
//           <div>
//             <h2 style={modalStyles.title}>{resume.title || "Your Resume"}</h2>
//             <p style={modalStyles.subtitle}>
//               {template?.name || template?.slug}
//             </p>
//           </div>
//           <button style={modalStyles.closeBtn} onClick={onClose}>
//             ×
//           </button>
//         </div>
//         <div style={modalStyles.body}>
//           <div style={modalStyles.leftPanel}>
//             <h3 style={S.sectionTitle}>Contact Information</h3>
//             <div style={S.grid2}>
//               <div>
//                 <p style={S.label}>Full Name:</p>
//                 <p>{resume.contact.fullName}</p>
//               </div>
//               <div>
//                 <p style={S.label}>Email:</p>
//                 <p>{resume.contact.email}</p>
//               </div>
//               <div>
//                 <p style={S.label}>Phone:</p>
//                 <p>{resume.contact.phone}</p>
//               </div>
//               <div>
//                 <p style={S.label}>Location:</p>
//                 <p>{resume.contact.address}</p>
//               </div>
//               <div>
//                 <p style={S.label}>Website:</p>
//                 <p>{resume.contact.website}</p>
//               </div>
//               <div>
//                 <p style={S.label}>Headline:</p>
//                 <p>{resume.contact.headline}</p>
//               </div>
//             </div>

//             <h3 style={S.sectionTitle}>Experience</h3>
//             {resume.experience.map((exp, idx) => (
//               <div key={idx} style={{ marginBottom: 12 }}>
//                 <p style={S.label}>
//                   {exp.title || "Job Title"} at {exp.company || "Company"}
//                 </p>
//                 <p style={S.small}>
//                   {formatDate(exp.startDate)} -{" "}
//                   {exp.current ? "Present" : formatDate(exp.endDate)}
//                 </p>
//                 <ul style={{ margin: "4px 0 0 20px", fontSize: 13 }}>
//                   {exp.bullets.map((bullet, bulletIdx) => (
//                     <li key={bulletIdx}>{bullet}</li>
//                   ))}
//                 </ul>
//               </div>
//             ))}

//             <h3 style={S.sectionTitle}>Education</h3>
//             {resume.education.map((edu, idx) => (
//               <div key={idx} style={{ marginBottom: 12 }}>
//                 <p style={S.label}>
//                   {edu.degree || "Degree"} in {edu.school || "School"}
//                 </p>
//                 <p style={S.small}>
//                   {formatDate(edu.startDate)} -{" "}
//                   {edu.endDate ? formatDate(edu.endDate) : "Graduation"}
//                 </p>
//                 <p style={S.small}>{edu.location ? `• ${edu.location}` : ""}</p>
//                 <ul style={{ margin: "4px 0 0 20px", fontSize: 13 }}>
//                   {edu.details.map((detail, detailIdx) => (
//                     <li key={detailIdx}>{detail}</li>
//                   ))}
//                 </ul>
//               </div>
//             ))}

//             <h3 style={S.sectionTitle}>Skills</h3>
//             <div style={S.chipRow}>
//               {resume.skills.map((skill, idx) => (
//                 <span key={idx} style={S.chip}>
//                   {skill.name || skill}
//                 </span>
//               ))}
//             </div>
//           </div>
//           <div style={modalStyles.rightPanel}>
//             <h3 style={S.sectionTitle}>Resume Preview</h3>
//             <div
//               style={{
//                 border: "1px solid #e5e7eb",
//                 borderRadius: "8px",
//                 overflow: "hidden",
//                 flex: 1,
//                 minHeight: 0,
//               }}>
//               {previewHtml ? (
//                 <iframe
//                   title="resume-preview"
//                   srcDoc={previewHtml}
//                   style={{
//                     width: "100%",
//                     height: "100%",
//                     border: "none",
//                     background: "white",
//                   }}
//                 />
//               ) : (
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     height: "100%",
//                     color: "#64748b",
//                     fontSize: "14px",
//                   }}>
//                   Loading preview...
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//         <div
//           style={{
//             padding: "16px 32px",
//             borderTop: "1px solid #e5e7eb",
//             position: "sticky",
//             bottom: 0,
//             background: "#fff",
//           }}>
//           <button
//             style={{ ...S.btnSolid, width: "100%" }}
//             onClick={() => onExport("pdf")}
//             disabled={exporting && exportingFormat === "pdf"}>
//             {exporting && exportingFormat === "pdf"
//               ? "Exporting..."
//               : "Download PDF"}
//           </button>
//           <button
//             style={{ ...S.btnSolid, width: "100%", marginTop: 10 }}
//             onClick={() => onExport("doc")}
//             disabled={exporting && exportingFormat === "doc"}>
//             {exporting && exportingFormat === "doc"
//               ? "Exporting..."
//               : "Download Word"}
//           </button>
//           <button
//             style={{ ...S.btnSolid, width: "100%", marginTop: 10 }}
//             onClick={() => onExport("txt")}
//             disabled={exporting && exportingFormat === "txt"}>
//             {exporting && exportingFormat === "txt"
//               ? "Exporting..."
//               : "Download TXT"}
//           </button>
//           <button
//             style={{ ...S.btnGhost, width: "100%", marginTop: 10 }}
//             onClick={onClose}>
//             Close
//           </button>
//         </div>
//       </div>

//     </div>
//   );
// }

function CompletionModal({
  data,
  onClose,
  onExport,
  exporting,
  exportingFormat,
  navigate,
}) {
  const { resume, previewHtml, template, resumeId, canDownload, token } = data;
  const isPremiumTemplate = template?.category === "premium" || template?.category === "industry";

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const THEME = {
    pageBg: "#f2f4f7",
    cardBg: "#ffffff",
    panelBg: "#ffffff",
    border: "#dce3ef",
    text: "#0f172a",
    sub: "#64748b",
    muted: "#94a3b8",
    inputBg: "#ffffff",
  };

  const S = {
    sectionTitle: {
      fontSize: "var(--font-size-lg)",
      fontWeight: "var(--font-weight-semibold)",
      margin: "0 0 14px 0",
      color: THEME.text,
      borderBottom: `2px solid ${THEME.border}`,
      paddingBottom: 8,
    },
    label: {
      fontSize: "var(--font-size-sm)",
      color: THEME.sub,
      marginBottom: 5,
      display: "block",
      fontWeight: "var(--font-weight-medium)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      marginBottom: 20,
    },
    btnSolid: {
      background: "#2563eb",
      color: "#ffffff",
      border: "none",
      borderRadius: "10px",
      padding: "10px 16px",
      fontWeight: "var(--font-weight-semibold)",
      fontSize: "var(--font-size-sm)",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      transition: "all 0.2s ease",
    },
    btnGhost: {
      background: "transparent",
      color: "#2563eb",
      border: "1px solid #93c5fd",
      borderRadius: "10px",
      padding: "10px 16px",
      fontSize: "var(--font-size-sm)",
      fontWeight: "var(--font-weight-medium)",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    small: {
      fontSize: "var(--font-size-sm)",
      color: THEME.muted,
      margin: "2px 0",
    },
    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    chip: {
      background: "#e0e7ff",
      color: "#4f46e5",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "var(--font-size-sm)",
      fontWeight: "var(--font-weight-medium)",
    },
  };

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "20px",
    },
    modal: {
      background: "#fff",
      borderRadius: "20px",
      maxWidth: "1280px",
      width: "100%",
      height: "92vh",
      maxHeight: "96vh",
      overflow: "hidden",
      boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.3)",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: "18px 28px",
      borderBottom: " solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      flexShrink: 0,
    },
    title: { fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)", color: "#0f172a", margin: 0 },
    subtitle: { fontSize: "var(--font-size-sm)", color: "#64748b", margin: "4px 0 0" },
    closeBtn: {
      background: "none",
      border: "none",
      fontSize: "var(--font-size-2xl)", color: "#64748b",
      cursor: "pointer",
      padding: "6px",
      borderRadius: "8px",
      transition: "all 0.2s",
    },
    body: { 
      flex: 1,
      display: "flex", 
      overflow: "hidden",
      minHeight: 0,
    },
    leftPanel: {
      width: "420px",
      minWidth: "420px",
      padding: "28px 32px",
      overflow: "auto",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      background: "#fafbfc",
    },
    rightPanel: {
      flex: 2,
      padding: "28px 32px",
      background: THEME.panelBg,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    },
    footerButtons: {
      marginTop: "auto",
      paddingTop: "20px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      paddingBottom: "8px",
    },
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>{resume.title || "Your Resume"}</h2>
            <p style={modalStyles.subtitle}>
              Template: {template?.name || template?.slug}
            </p>
          </div>
          <button style={modalStyles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={modalStyles.body}>
          <div style={modalStyles.leftPanel}>
            <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
            <h3 style={S.sectionTitle}>Contact Information</h3>
            <div style={S.grid2}>
              <div>
                  <span style={S.label}>Name</span>
                <p>{resume.contact.fullName}</p>
              </div>
              <div>
                  <span style={S.label}>Email</span>
                <p>{resume.contact.email}</p>
              </div>
              <div>
                  <span style={S.label}>Phone</span>
                <p>{resume.contact.phone}</p>
              </div>
              <div>
                  <span style={S.label}>Location</span>
                <p>{resume.contact.address}</p>
              </div>
              <div>
                  <span style={S.label}>Website</span>
                  <p>{resume.contact.website || "-"}</p>
              </div>
              <div>
                  <span style={S.label}>Headline</span>
                  <p>{resume.contact.headline || "-"}</p>
              </div>
            </div>

            <h3 style={S.sectionTitle}>Experience</h3>
            {resume.experience.map((exp, idx) => (
                <div key={idx} style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, margin: "0 0 4px" }}>
                    {exp.title || "Job Title"} <span style={{ color: THEME.sub }}>at {exp.company || "Company"}</span>
                </p>
                <p style={S.small}>
                    {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
                  </p>
                  <ul style={{ margin: "8px 0 0 20px", fontSize: "var(--font-size-sm)", lineHeight: "1.5" }}>
                    {exp.bullets.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}

            <h3 style={S.sectionTitle}>Education</h3>
            {resume.education.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 600 }}>
                    {edu.degree} in {edu.field || ""} — {edu.school}
                </p>
                <p style={S.small}>
                    {formatDate(edu.startDate)} – {edu.endDate ? formatDate(edu.endDate) : "Expected Graduation"}
                    {edu.location ? ` • ${edu.location}` : ""}
                  </p>
                  {edu.details.length > 0 && (
                    <ul style={{ margin: "8px 0 0 20px", fontSize: "var(--font-size-sm)" }}>
                      {edu.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
                  )}
              </div>
            ))}

            <h3 style={S.sectionTitle}>Skills</h3>
            <div style={S.chipRow}>
              {resume.skills.map((skill, idx) => (
                <span key={idx} style={S.chip}>
                    {typeof skill === "string" ? skill : skill.name}
                </span>
              ))}
            </div>
          </div>

            {/* Buttons moved here, sticky at bottom of left panel */}
            <div style={modalStyles.footerButtons}>
             {canDownload ? (
              <> 
                <button
                  style={S.btnSolid}
                  onClick={() => onExport("pdf")}
                  disabled={exporting && exportingFormat === "pdf"}
                >
                  {exporting && exportingFormat === "pdf" ? "Exporting PDF..." : "Download PDF"}
                </button>
                <button
                  style={S.btnSolid}
                  onClick={() => onExport("doc")}
                  disabled={exporting && exportingFormat === "doc"}
                >
                  {exporting && exportingFormat === "doc" ? "Exporting DOC..." : "Download Word"}
                </button>
                <button
                  style={S.btnSolid}
                  onClick={() => onExport("txt")}
                  disabled={exporting && exportingFormat === "txt"}
                >
                  {exporting && exportingFormat === "txt" ? "Exporting TXT..." : "Download TXT"}
                </button>
                {/* <button style={S.btnGhost} onClick={onClose}>
                  Close
                </button> */}
              </>
             ) : (  
              <div style={{ textAlign: "center", padding: "32px 20px" }}>
              <Lock size={48} color="#dc2626" weight="bold" />
              {!token ? (
                <>
                  <p style={{ margin: "16px 0 8px", fontWeight: 600, fontSize: 16 }}>
                    Sign up to download your resume
                  </p>
                  <p style={{ color: "#64748b", marginBottom: 20 }}>
                    Create a free account to download your resume in PDF, Word, or TXT format.<br />
                    You can continue editing your resume after signing up.
                  </p>
                  <button
                    style={S.btnSolid}
                    onClick={() => {
                      // Save resume to localStorage before navigating
                      saveResumeToLocal({
                        ...resume,
                        templateSlug: resume.templateSlug || template?.slug,
                      });
                      navigate("/signup");
                    }}
                  >
                    Sign Up Now
                  </button>
                </>
              ) : (
                <>
                  <p style={{ margin: "16px 0 8px", fontWeight: 600, fontSize: 16 }}>
                    Upgrade required to download
                  </p>
                  <p style={{ color: "#64748b", marginBottom: 20 }}>
                    Premium templates can be edited and previewed during your free trial,<br />
                    but downloading requires a paid plan.
                  </p>
                  <button
                    style={S.btnSolid}
                    onClick={() => navigate("/pricing")}
                  >
                    View Pricing Plans
                  </button>
                </>
              )}
             </div>
               )}
            </div>
          </div>

          <div style={modalStyles.rightPanel}>
            <h3 style={S.sectionTitle}>Resume Preview</h3>
            <div
              style={{
                flex: 1,
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                background: "#fff",
              }}
            >
              {previewHtml ? (
                <iframe
                  title="resume-preview"
                  srcDoc={previewHtml}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "#fff",
                  }}
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    fontSize: "var(--font-size-base)",
                  }}
                >
                  Loading preview...
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
    </div>
  );
}