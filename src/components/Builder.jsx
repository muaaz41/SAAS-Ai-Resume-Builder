import React, { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation } from "react-router-dom";
import RichTextEditor from "./RichTextEditor.jsx";

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
      // Send plain-text summary to backend templates that expect text
      summary: stripHtml(data.contact?.summary),
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
  };
};

// ------------------------------
// Builder Component
// ------------------------------
export default function Builder() {
  const { user } = useAuth();
  const location = useLocation();

  // ---------- state ----------
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [resumeId, setResumeId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null); // 'pdf' | 'docx' | 'txt' | null

  const [serverPreview, setServerPreview] = useState("");
  const [serverPreviewUrl, setServerPreviewUrl] = useState("");

  const [step, setStep] = useState(1); // start with Basics
  const [jobDescription, setJobDescription] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState(null);

  // typing + rate-limit guards
  const typingRef = useRef(0); // last keystroke timestamp
  const lastPreviewAtRef = useRef(0); // last server preview fetch ts
  const lastSaveAtRef = useRef(0); // last save timestamp
  const previewAbortRef = useRef(null); // AbortController for preview
  const previewInFlightRef = useRef(false);
  const previewRetryTimerRef = useRef(null);
  const saveInFlightRef = useRef(false);
  const saveRetryTimerRef = useRef(null);

  // ---------- initial resume data ----------
  const getInitialResumeData = () => {
    const savedResume = localStorage.getItem(`resume-${resumeId || "draft"}`);
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
        address: "",
        website: "",
        summary: "",
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
      templateSlug: "modern-slate",
    };
  };

  const [resume, setResume] = useState(getInitialResumeData);

  // Local state for skills input so commas work naturally
  const [skillsInput, setSkillsInput] = useState("");

  // Do not mirror skills back into the input; we keep it user-driven and clear on add

  const commitSkillToken = (raw) => {
    const token = (raw || skillsInput).trim();
    if (!token) return;
    setResume((r) => {
      const existing = (r.skills || []).map((x) => x.name || x);
      if (existing.includes(token)) return r; // avoid duplicates
      return {
        ...r,
        skills: [...existing.map((n) => ({ name: n })), { name: token }],
      };
    });
    setSkillsInput("");
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
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const THEME = isDark
    ? {
        pageBg: "linear-gradient(180deg,#0b1220,#0b1220 40%,#0b1220 100%)",
        cardBg: "#0f172a",
        panelBg: "#0b1220",
        border: "#334155",
        text: "#e5e7eb",
        sub: "#94a3b8",
        muted: "#94a3b8",
        inputBg: "#0b1220",
      }
    : {
        pageBg: "linear-gradient(180deg,#fff,#f8fafc 40%,#f1f5f9 100%)",
        cardBg: "#ffffff",
        panelBg: "#f8fafc",
        border: "#e5e7eb",
        text: "#0f172a",
        sub: "#64748b",
        muted: "#64748b",
        inputBg: "#ffffff",
      };

  // ---------- styles (unchanged) ----------
  const S = {
    page: {
      display: "grid",
      gridTemplateColumns: "minmax(720px, 860px) minmax(480px, 640px)",
      gap: 24,
      height: "calc(100vh - 64px)",
      background: THEME.pageBg,
      padding: "24px 24px 32px",
    },
    left: {
      background: THEME.cardBg,
      borderRadius: 12,
      padding: 24,
      border: `1px solid ${THEME.border}`,
      overflow: "auto",
      color: THEME.text,
    },
    rightWrap: {
      background: THEME.panelBg,
      borderRadius: 12,
      border: `1px solid ${THEME.border}`,
      padding: 16,
      display: "grid",
      gridTemplateRows: "48px 1fr",
      color: THEME.text,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 700,
      margin: 0,
      color: THEME.text,
    },
    headerSub: { marginTop: 6, color: THEME.sub, fontSize: 14 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    label: {
      fontSize: 12,
      color: THEME.sub,
      marginBottom: 6,
      display: "block",
    },
    input: {
      width: "100%",
      padding: "12px 12px",
      borderRadius: 10,
      border: `1px solid ${THEME.border}`,
      background: THEME.inputBg,
      outline: "none",
      fontSize: 14,
      color: THEME.text,
    },
    dateInput: {
      width: "100%",
      padding: "12px 12px",
      borderRadius: 10,
      border: "2px solid #3b82f6",
      background: THEME.inputBg,
      outline: "none",
      fontSize: 14,
      fontFamily: "inherit",
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
    },
    small: { fontSize: 12, color: THEME.muted },
    btnRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    btnSolid: {
      background: "#2563eb",
      color: "#fff",
      border: "1px solid #1d4ed8",
      borderRadius: 10,
      padding: "10px 14px",
      fontWeight: 600,
      cursor: "pointer",
    },
    btnGhost: {
      background: THEME.cardBg,
      color: "#2563eb",
      border: "1px solid #93c5fd",
      borderRadius: 10,
      padding: "8px 12px",
      fontWeight: 600,
      cursor: "pointer",
    },
    stepperWrap: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      margin: "12px 0 20px",
    },
    step: (active, done) => ({
      width: 34,
      height: 34,
      borderRadius: 999,
      border: "2px solid #93c5fd",
      background: active ? "#2563eb" : done ? "#1d4ed8" : "#fff",
      color: active || done ? "#fff" : "#0f172a",
      fontWeight: 800,
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
    hint: { color: "#64748b", fontSize: 12, marginLeft: 6 },
    sectionTitle: {
      marginTop: 24,
      fontWeight: 700,
      fontSize: 16,
      color: "#0f172a",
    },
    chipRow: { display: "flex", gap: 8, flexWrap: "wrap" },
    chip: {
      fontSize: 12,
      padding: "6px 10px",
      borderRadius: 999,
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      color: "#1d4ed8",
      fontWeight: 600,
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
        const wantedId =
          location.state?.resumeId || localStorage.getItem("lastResumeId") || null;
        const [tplRes, resumeRes] = await Promise.all([
          api.get("/api/v1/templates"),
          wantedId
            ? api.get(`/api/v1/resumes/${wantedId}`)
            : Promise.resolve({ data: null }),
        ]);
        if (!alive) return;

        const items = tplRes?.data?.data?.items || [];
        setTemplates(items);

        const rData = resumeRes?.data?.data || {};
        const loaded = rData.resume || rData || null;

        if (wantedId && loaded) {
          setResumeId(wantedId);
          // Merge with locally saved copy (client is source of truth for fields some backends omit)
          let merged = { ...loaded };
          try {
            const localRaw = localStorage.getItem(`resume-${wantedId}`);
            if (localRaw) {
              const localSaved = JSON.parse(localRaw);
              merged = {
                ...merged,
                contact: { ...(merged.contact || {}), ...(localSaved.contact || {}) },
                experience:
                  (localSaved.experience && localSaved.experience.length > 0)
                    ? localSaved.experience
                    : (merged.experience || []),
                education:
                  (localSaved.education && localSaved.education.length > 0)
                    ? localSaved.education
                    : (merged.education || []),
                skills: Array.isArray(localSaved.skills) ? localSaved.skills : (merged.skills || []),
                title: localSaved.title || merged.title,
              };
            }
          } catch { /* ignore bad local data */ }

          const slugFromResume = merged.templateSlug;
          const slugFromLocation = location.state?.templateSlug;
          const finalSlug =
            slugFromResume ||
            slugFromLocation ||
            "modern-slate";
          const finalT = items.find((x) => x.slug === finalSlug) || null;
          setSelectedTemplate(finalT || null);

          const safeExperience = merged.experience?.length
            ? merged.experience
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
          const safeEducation = merged.education?.length
            ? merged.education
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
              address: merged.contact?.address || prev.contact.address || "",
              website: merged.contact?.website || prev.contact.website || "",
              summary: merged.contact?.summary || prev.contact.summary || "",
              headline: merged.contact?.headline || prev.contact.headline || "",
            },
            experience: safeExperience,
            education: safeEducation,
            skills: merged.skills?.length > 0 ? merged.skills : prev.skills,
            templateSlug: finalSlug,
          }));

          setIsInitializing(false);
        } else {
          const initialSlug =
            location.state?.templateSlug || items[0]?.slug || "modern-slate";
          const t =
            items.find((x) => x.slug === initialSlug) || null;
          setSelectedTemplate(t || null);

          const finalTemplateSlug = t?.slug || "modern-slate";
          setResume((prev) => ({ ...prev, templateSlug: finalTemplateSlug }));

          setIsInitializing(false);

          // create a resume immediately so server preview/export endpoints work
          setTimeout(async () => {
            try {
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
              console.warn(
                "Failed to create resume for template preview:",
                err
              );
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
              location: e.location,
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
                  }
            )
            .filter((s) => s.name);
        }
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

  // one clean autosave: 1 second after last change to avoid rate limiting
  useEffect(() => {
    if (templates.length === 0 || !resume.templateSlug || isInitializing)
      return;
    const t = setTimeout(() => {
      upsertResume();
    }, 1000); // Increased to 1 second to avoid rate limiting
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, templates.length, isInitializing]);

  // ---------- template change ----------
  const handleTemplateChange = async (slug) => {
    const finalSlug = slug || "modern-slate";
    const t =
      templates.find((x) => x.slug === finalSlug) || templates[0] || null;
    setSelectedTemplate(t);
    setResume((r) => ({ ...r, templateSlug: finalSlug }));

    if (resumeId) {
      try {
        await api.patch(`/api/v1/resumes/${resumeId}`, {
          templateSlug: finalSlug,
        });
      } catch {}
    } else {
      try {
        const payload = cleanResumeData({
          title: resume.title || "My Resume",
          templateSlug: finalSlug,
          contact: resume.contact,
          experience: resume.experience,
          education: resume.education,
          skills: resume.skills,
        });
        const res = await api.post("/api/v1/resumes", payload);
        const newResumeId = res.data?.data?.resumeId;
        if (newResumeId) {
          setResumeId(newResumeId);
          // Trigger immediate server preview fetch
          setTimeout(() => fetchServerPreview(), 100);
        }
      } catch (err) {
        console.warn("Failed to create resume for template preview:", err);
      }
    }
  };

  // ---------- AI helpers ----------
  const generateSummary = async () => {
    if (!jobDescription.trim()) {
      alert(
        "Please enter a job description first to help AI generate better content"
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
        setResume((r) => ({ ...r, contact: { ...r.contact, summary: text } }));
        alert("✅ AI Summary generated! Check the Summary field.");
      } else {
        alert("AI didn't return any suggestions. Please try again.");
      }
    } catch (err) {
      console.error("AI Error:", err);
      alert(
        "Failed to generate AI summary: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setAiLoading(false);
    }
  };

  const generateExperienceBullets = async (experienceIndex = 0) => {
    if (!jobDescription.trim()) {
      alert(
        "Please enter a job description first to help AI generate better content"
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
        alert(
          `✅ AI generated ${finalBullets.length} bullet points! Check the Job Description field.`
        );
      } else {
        alert("AI didn't return any bullet points. Please try again.");
      }
    } catch (err) {
      console.error("AI Error:", err);
      alert(
        "Failed to generate AI bullets: " +
          (err.response?.data?.message || err.message)
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
      const validExperience = (resume.experience || []).filter(
        (e) => e.title || e.company
      );
      if (validExperience.length > 0) payload.experience = validExperience;
      payload.steps.experienceDone = true;
    }
    if (currentStep === 3) {
      const validEducation = (resume.education || []).filter(
        (e) => e.degree || e.school
      );
      if (validEducation.length > 0) payload.education = validEducation;
      payload.steps.educationDone = true;
    }
    if (currentStep === 4) {
      if (resume.skills?.length > 0) {
        payload.skills = resume.skills
          .filter((s) => s && (s.name || typeof s === "string"))
          .map((s) =>
            typeof s === "string"
              ? { name: s, level: 0 }
              : {
                  name: s.name || "",
                  level: typeof s.level === "number" ? s.level : 0,
                }
          )
          .filter((s) => s.name);
      }
      payload.steps.skillsDone = true;
    }
    if (currentStep === 5) {
      payload.contact = resume.contact;
      payload.steps.summaryDone = true;
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

  // ---------- Test PDF Export (for debugging) ----------
  const testPdfExport = async () => {
    if (!resumeId) {
      alert("Please save your resume first");
      return;
    }

    console.log("=== PDF Export Debug Test ===");
    console.log("Resume ID:", resumeId);
    console.log("Resume data:", resume);
    console.log("User authenticated:", !!localStorage.getItem("accessToken"));
    console.log("Resume has template:", !!resume.templateSlug);
    console.log("Resume has content:", !!resume.contact?.fullName);

    try {
      // First, check if the resume exists on the server
      console.log("Checking if resume exists on server...");
      const resumeCheck = await api.get(`/api/v1/resumes/${resumeId}`);
      console.log("Resume check response:", resumeCheck.data);

      // Test the endpoint directly
      const testUrl = `/api/v1/resumes/${resumeId}/export/pdf?t=${Date.now()}`;
      console.log("Testing URL:", testUrl);

      const res = await api.get(testUrl, {
        responseType: "json", // Get as JSON to handle the object format
        timeout: 30000,
      });

      console.log("Raw response:", res);
      console.log("Response status:", res.status);
      console.log("Response data:", res.data);
      console.log("Response headers:", res.headers);
      console.log("Response data type:", typeof res.data);

      // Check if response data is a JSON object with numeric keys
      if (typeof res.data === "object" && !Array.isArray(res.data)) {
        const keys = Object.keys(res.data)
          .map(Number)
          .sort((a, b) => a - b);
        console.log("Object keys count:", keys.length);
        console.log("First few keys:", keys.slice(0, 10));

        if (keys.length > 0) {
          // Convert to ArrayBuffer to validate PDF header
          const uint8Array = new Uint8Array(keys.length);
          keys.forEach((key, index) => {
            uint8Array[index] = res.data[key];
          });

          // Check PDF header
          if (uint8Array.length > 4) {
            const header = String.fromCharCode(
              uint8Array[0],
              uint8Array[1],
              uint8Array[2],
              uint8Array[3]
            );
            console.log("PDF header:", header);
            if (header === "%PDF") {
              alert(
                `PDF generated successfully! Size: ${uint8Array.length} bytes`
              );
            } else {
              alert(`PDF data doesn't have valid header: ${header}`);
            }
          } else {
            alert("PDF data is too small to be valid");
          }
        } else {
          alert("PDF endpoint returned empty object");
        }
      } else if (
        res.data &&
        typeof res.data === "string" &&
        res.data.includes("error")
      ) {
        alert("PDF generation failed: " + res.data);
      } else {
        alert(
          "PDF endpoint returned unexpected format. Check console for details."
        );
      }
    } catch (error) {
      console.error("PDF test error:", error);
      alert("PDF test failed: " + error.message);
    }
  };

  // ---------- Export ----------
  const handleExport = async (format) => {
    if (!resumeId) {
      alert("Please save your resume first");
      return;
    }
    setExporting(true);
    setExportingFormat(format);
    try {
      await upsertResume();
      // small delay to allow server to persist before rendering
      await new Promise((r) => setTimeout(r, 300));

      console.log(`Exporting resume ${resumeId} as ${format}...`);

      // Build URLs (direct backend vs proxied)
      const backendOrigin = "https://ai-resume-builder-backend-uhdm.onrender.com";
      const ts = Date.now();
      const directUrl = `${backendOrigin}/api/v1/resumes/${resumeId}/export/${format}?t=${ts}`;
      const proxiedUrl = `/api/v1/resumes/${resumeId}/export/${format}?t=${ts}`;

      const isLocal = /localhost|127\.0\.0\.1|::1/.test(window.location.hostname);

      let res;
      try {
        // In dev, try the direct backend first to bypass the Vite proxy
        const urlToUse = isLocal ? directUrl : proxiedUrl;
        res = await api.get(urlToUse, {
          responseType: format === "txt" ? "text" : "blob",
          timeout: 30000,
          withCredentials: true,
        });
      } catch (firstErr) {
        console.warn("Direct export failed, retrying via proxied URL:", firstErr?.message || firstErr);
        // Fallback to proxied path
        res = await api.get(proxiedUrl, {
          responseType: format === "txt" ? "text" : "blob",
          timeout: 30000,
          withCredentials: true,
        });
      }

      // Debug: ensure we actually received a Blob for PDF/DOCX
      console.log("isBlob:", res.data instanceof Blob, "blobType:", res.data?.type);

      console.log("Export response:", res);
      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);
      console.log("Response data type:", typeof res.data);
      console.log(
        "Response data size:",
        res.data?.length || res.data?.size || "unknown"
      );
      console.log("Response data:", res.data);

      // Build the file blob
      const mimeType =
        format === "pdf"
          ? "application/pdf"
          : format === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "text/plain";

      // If server sent HTML/JSON error, surface it before saving a bad file
      const headerCT = res.headers?.["content-type"] || res.headers?.get?.("content-type");
      if (format !== "txt" && headerCT && !headerCT.includes("pdf") && !headerCT.includes("word")) {
        try {
          const txt = await res.data.text();
          console.error("Unexpected content-type:", headerCT, txt);
          alert(`Export failed: ${txt.slice(0, 300)}`);
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
          format === "pdf" && !(b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d);
        const badDocx = format === "docx" && !(b[0] === 0x50 && b[1] === 0x4b);
        if (badPdf || badDocx) {
          console.warn("Unexpected file header:", Array.from(b));
          // Fallback: some backends send JSON object of numeric keys {"0":137,"1":80,...}
          try {
            const txt = await fileBlob.text();
            const maybeJson = JSON.parse(txt);
            if (maybeJson && typeof maybeJson === "object" && !Array.isArray(maybeJson)) {
              const keys = Object.keys(maybeJson)
                .map((k) => parseInt(k, 10))
                .filter((n) => Number.isFinite(n))
                .sort((a, b) => a - b);
              if (keys.length > 0) {
                const uint8 = new Uint8Array(keys.length);
                for (let i = 0; i < keys.length; i++) uint8[i] = maybeJson[keys[i]] & 0xff;
                fileBlob = new Blob([uint8], { type: mimeType });
                console.log("Reconstructed binary from JSON bytes (length)", keys.length);
              } else {
                alert("Export failed: received invalid file data.");
                setExporting(false);
                setExportingFormat(null);
                return;
              }
            } else {
              alert("Export failed: received text instead of a file.");
              setExporting(false);
              setExportingFormat(null);
              return;
            }
          } catch (reconstructErr) {
            console.error("Failed to reconstruct binary from JSON:", reconstructErr);
            alert("Export failed: invalid file format from server.");
            setExporting(false);
            setExportingFormat(null);
            return;
          }
        }
      } catch {
        // ignore header check failures
      }

      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.title || "resume"}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Optional: open a preview tab for quick validation (won't run on TXT)
      if (format !== "txt") {
        const previewUrl = window.URL.createObjectURL(fileBlob);
        setTimeout(() => window.open(previewUrl, "_blank"), 0);
        setTimeout(() => window.URL.revokeObjectURL(previewUrl), 10000);
      }

      alert(`Resume exported successfully as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error("Export error:", err);
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
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

  // ---------- Server preview with rate limiting ----------
  const fetchServerPreview = async () => {
    if (!resumeId || !resume.templateSlug) return;

    // Rate limiting: don't fetch preview more than once every 3 seconds
    const sinceLastPreview = Date.now() - lastPreviewAtRef.current;
    if (sinceLastPreview < 3000) {
      console.log("⏳ Rate limiting: skipping preview fetch (too soon)");
      return;
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

  // Fetch server preview with longer debounce to avoid rate limiting
  useEffect(() => {
    if (!resumeId || !resume.templateSlug) return;

    // Longer debounce to avoid rate limiting
    const timeoutId = setTimeout(() => {
      fetchServerPreview();
    }, 2000); // Increased to 2 seconds to avoid rate limiting

    return () => clearTimeout(timeoutId);
  }, [
    resume.contact,
    resume.experience,
    resume.education,
    resume.skills,
    resume.templateSlug,
    resumeId,
  ]);

  // ---------- local preview (instant) ----------
  const previewHtml = useMemo(() => {
    const t = selectedTemplate;
    const templateSlug = t?.slug || resume.templateSlug || "";
    const fullName = resume.contact?.fullName || "Your Name";
    const email = resume.contact?.email || "email@example.com";
    const headline = resume.contact?.headline || "Product Designer (UX/UI)";
    const summary =
      resume.contact?.summary || "Use this block to introduce yourself.";
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
    </style></head><body>
      <div class="card">
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
        ${expHtml ? `<h3>EXPERIENCE</h3>${expHtml}` : ""}
        <div class="row">
          <div>
            <h3>SKILLS</h3>
            <div>${
              skills.length > 0
                ? skills.map((x) => `<span class="chip">${x}</span>`).join("")
                : "<span style='color:#94a3b8;font-size:13px'>No skills added yet</span>"
            }</div>
          </div>
          ${eduHtml ? `<div><h3>EDUCATION</h3>${eduHtml}</div>` : ""}
        </div>
      </div>
    </body></html>`;
  }, [resume, selectedTemplate]);

  // ---------- helpers ----------
  const skillsAsString = (resume.skills || [])
    .map((s) => s.name || s)
    .join(", ");

  // ---------- UI ----------
  const stepTitles = ["Basics", "Experience", "Education", "Skills", "Summary"];
  const stepSubtitles = [
    "Basic information and contact details",
    "Add your work experience and achievements",
    "Your educational background",
    "List your key skills and expertise",
    "Write a compelling professional summary",
  ];

  const userIsTyping = () => Date.now() - typingRef.current < 500; // Increased to 500ms to reduce API calls

  useEffect(() => {
    // Keep form state and picker in sync with selected template
    if (selectedTemplate?.slug) {
      setResume((prev) => ({ ...prev, templateSlug: selectedTemplate.slug }));
    }
  }, [selectedTemplate?.slug]);

  return (
    <div style={S.page}>
      {/* LEFT: Form */}
      <div style={S.left}>
        <div>
          <h2 style={S.headerTitle}>{stepTitles[step - 1]}</h2>
          <div style={S.headerSub}>{stepSubtitles[step - 1]}</div>
        </div>

        {/* Stepper */}
        <div style={S.stepperWrap}>
          {[1, 2, 3, 4, 5].map((i, idx) => (
            <React.Fragment key={i}>
              <div
                title={stepTitles[i - 1]}
                style={S.step(i === step, i < step)}
                onClick={() => setStep(i)}>
                {i}
              </div>
              {idx < 4 && <div style={S.stepLine(i < step)} />}
            </React.Fragment>
          ))}
        </div>

        {/* Template picker */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Template *</label>
          <select
            value={selectedTemplate?.slug || ""}
            onChange={(e) => handleTemplateChange(e.target.value)}
            style={{
              ...S.input,
              borderColor: !selectedTemplate?.slug ? "#f59e0b" : "#cbd5e1",
            }}>
            <option value="">Select a template...</option>
            {templates.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name || t.slug} {t.category === "premium" ? "⭐" : ""}
              </option>
            ))}
          </select>
          {!selectedTemplate?.slug && (
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
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Full Name *</label>
              <input
                placeholder="John Doe"
                style={S.input}
                value={resume.contact.fullName}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, fullName: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Email *</label>
              <input
                type="email"
                placeholder="john@example.com"
                style={S.input}
                value={resume.contact.email}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, email: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Phone</label>
              <input
                placeholder="+1 234 567 8901"
                style={S.input}
                value={resume.contact.phone}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, phone: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Location</label>
              <input
                placeholder="New York, NY"
                style={S.input}
                value={resume.contact.address}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, address: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Job Title / Headline</label>
              <input
                placeholder="Product Designer (UX/UI)"
                style={S.input}
                value={resume.contact.headline}
                onChange={(e) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, headline: e.target.value },
                  }));
                  markTyping();
                }}
              />
            </div>
          </>
        )}

        {/* STEP 2: EXPERIENCE */}
        {step === 2 && (
          <>
            {resume.experience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Job Title *</label>
                  <input
                    placeholder="Senior Product Designer"
                    style={S.input}
                    value={exp.title}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[idx].title = e.target.value;
                      setResume((r) => ({ ...r, experience: newExp }));
                      markTyping();
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Company *</label>
                  <input
                    placeholder="TechCorp Inc"
                    style={S.input}
                    value={exp.company}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[idx].company = e.target.value;
                      setResume((r) => ({ ...r, experience: newExp }));
                      markTyping();
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Location</label>
                  <input
                    placeholder="New York, NY"
                    style={S.input}
                    value={exp.location}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[idx].location = e.target.value;
                      setResume((r) => ({ ...r, experience: newExp }));
                      markTyping();
                    }}
                  />
                </div>
                <div style={{ ...S.grid2, marginBottom: 12 }}>
                  <div>
                    <label style={S.label}>
                      📅 Start Date *{" "}
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        (MM/DD/YYYY)
                      </span>
                    </label>
                    <input
                      type="date"
                      style={S.dateInput}
                      value={exp.startDate}
                      placeholder="Select start date"
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
                      📅 End Date{" "}
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        (or check "current")
                      </span>
                    </label>
                    <input
                      type="date"
                      style={{
                        ...S.dateInput,
                        opacity: exp.current ? 0.5 : 1,
                        cursor: exp.current ? "not-allowed" : "pointer",
                      }}
                      value={exp.endDate}
                      disabled={exp.current}
                      placeholder="Select end date"
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
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => {
                        const newExp = [...resume.experience];
                        newExp[idx].current = e.target.checked;
                        if (e.target.checked) newExp[idx].endDate = "";
                        setResume((r) => ({ ...r, experience: newExp }));
                        markTyping();
                      }}
                    />
                    <span style={S.label}>I currently work here</span>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>
                    Job Description / Responsibilities
                  </label>
                  <textarea
                    style={S.textarea}
                    placeholder={
                      "• Led design for 3+ features\n• Conducted user research with 200+ participants"
                    }
                    value={(exp.bullets || []).map((b) => `• ${b}`).join("\n")}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[idx].bullets = e.target.value
                        .split("\n")
                        .map((l) => l.trim().replace(/^[–—\-•\u2022]\s*/, ""))
                        .filter(Boolean);
                      setResume((r) => ({ ...r, experience: newExp }));
                      markTyping();
                    }}
                  />
                </div>

                {/* AI Helper Section */}
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #93c5fd",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 12,
                  }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1e40af",
                      marginBottom: 8,
                    }}>
                    🤖 AI Assistant
                  </div>
                  <input
                    placeholder="Describe the role or paste job description for AI to generate bullet points..."
                    style={{
                      ...S.input,
                      marginBottom: 8,
                      background: "#fff",
                      border: "1px solid #93c5fd",
                    }}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <button
                    type="button"
                    style={{
                      ...S.btnSolid,
                      width: "100%",
                      background: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                    disabled={aiLoading}
                    onClick={() => generateExperienceBullets(idx)}>
                    {aiLoading
                      ? "🔄 Generating..."
                      : "✨ Generate Bullet Points with AI"}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              style={{ ...S.btnGhost, marginTop: 8 }}
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
              }>
              + Add Another Position
            </button>
            {resume.experience.length > 1 && (
              <button
                type="button"
                style={{ ...S.btnGhost, marginTop: 8, marginLeft: 8, borderColor: "#fecaca", color: "#dc2626" }}
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    experience: r.experience.slice(0, -1),
                  }))
                }>
                Undo Last Add
              </button>
            )}
            {resume.experience.length > 0 && (
              <button
                type="button"
                style={{ ...S.btnGhost, marginTop: 8, marginLeft: 8, borderColor: "#fecaca", color: "#dc2626" }}
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    experience: r.experience.length > 1 ? [r.experience[0]] : [],
                  }))
                }>
                Clear Added Positions
              </button>
            )}
          </>
        )}

        {/* STEP 3: EDUCATION */}
        {step === 3 && (
          <>
            {resume.education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Degree *</label>
                  <input
                    placeholder="BA in Interaction Design"
                    style={S.input}
                    value={edu.degree}
                    onChange={(e) => {
                      const newEdu = [...resume.education];
                      newEdu[idx].degree = e.target.value;
                      setResume((r) => ({ ...r, education: newEdu }));
                      markTyping();
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>School / University *</label>
                  <input
                    placeholder="University of Design"
                    style={S.input}
                    value={edu.school}
                    onChange={(e) => {
                      const newEdu = [...resume.education];
                      newEdu[idx].school = e.target.value;
                      setResume((r) => ({ ...r, education: newEdu }));
                      markTyping();
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Location</label>
                  <input
                    placeholder="New York, NY"
                    style={S.input}
                    value={edu.location}
                    onChange={(e) => {
                      const newEdu = [...resume.education];
                      newEdu[idx].location = e.target.value;
                      setResume((r) => ({ ...r, education: newEdu }));
                      markTyping();
                    }}
                  />
                </div>
                <div style={{ ...S.grid2, marginBottom: 12 }}>
                  <div>
                    <label style={S.label}>
                      📅 Start Date{" "}
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        (MM/DD/YYYY)
                      </span>
                    </label>
                    <input
                      type="date"
                      style={S.dateInput}
                      value={edu.startDate}
                      placeholder="Select start date"
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
                      📅 End Date / Graduation{" "}
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        (MM/DD/YYYY)
                      </span>
                    </label>
                    <input
                      type="date"
                      style={S.dateInput}
                      value={edu.endDate}
                      placeholder="Select end date"
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
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Additional Details</label>
                  <textarea
                    style={S.textarea}
                    placeholder={"Graduated with honors\nGPA: 3.9/4.0"}
                    value={(edu.details || []).join("\n")}
                    onChange={(e) => {
                      const newEdu = [...resume.education];
                      newEdu[idx].details = e.target.value.split("\n");
                      setResume((r) => ({ ...r, education: newEdu }));
                      markTyping();
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              style={{ ...S.btnGhost, marginTop: 8 }}
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
              }>
              + Add Another Education
            </button>
            {resume.education.length > 1 && (
              <button
                type="button"
                style={{ ...S.btnGhost, marginTop: 8, marginLeft: 8, borderColor: "#fecaca", color: "#dc2626" }}
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    education: r.education.slice(0, -1),
                  }))
                }>
                Undo Last Add
              </button>
            )}
            {resume.education.length > 0 && (
              <button
                type="button"
                style={{ ...S.btnGhost, marginTop: 8, marginLeft: 8, borderColor: "#fecaca", color: "#dc2626" }}
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    education: r.education.length > 1 ? [r.education[0]] : [],
                  }))
                }>
                Clear Added Education
              </button>
            )}
          </>
        )}

        {/* STEP 4: SKILLS */}
        {step === 4 && (
          <>
            <div style={{ marginTop: 18 }}>
              <label style={S.label}>Your Skills</label>
              <div style={S.chipRow}>
                {(resume.skills || [])
                  .map((s) => s.name || s)
                  .filter(Boolean)
                  .map((name, i) => (
                    <span
                      key={`${name}-${i}`}
                      style={S.chip}
                      onClick={() => removeSkill(name)}
                      title="Remove">
                      {name}
                      <span style={{ fontWeight: 700, lineHeight: 1 }}>×</span>
                    </span>
                  ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={S.label}>Add a skill (press Enter to add)</label>
                <input
                  style={S.input}
                  value={skillsInput}
                  placeholder="Type a skill and press Enter"
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitSkillToken();
                      setSkillsInput("");
                    }
                  }}
                  onBlur={() => {
                    commitSkillToken();
                    setSkillsInput("");
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* STEP 5: SUMMARY */}
        {step === 5 && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>
                Professional Summary{" "}
                <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>
                  (Use toolbar to format text)
                </span>
              </label>
              <RichTextEditor
                value={resume.contact.summary}
                onChange={(html) => {
                  setResume((r) => ({
                    ...r,
                    contact: { ...r.contact, summary: html },
                  }));
                  markTyping();
                }}
                placeholder="Write a compelling professional summary. Highlight your key achievements, skills, and career goals. Use the toolbar to format your text with bold, italic, or bullet points."
                minHeight={150}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  style={{ ...S.btnGhost, borderColor: "#fecaca", color: "#dc2626" }}
                  onClick={() => {
                    setResume((r) => ({
                      ...r,
                      contact: { ...r.contact, summary: "" },
                    }));
                    markTyping();
                  }}
                >
                  Clear Summary
                </button>
              </div>
            </div>

            {/* AI Helper Section */}
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #93c5fd",
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
              }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1e40af",
                  marginBottom: 8,
                }}>
                🤖 AI Assistant - Generate Professional Summary
              </div>
              <input
                placeholder="Describe your target role or paste job description..."
                style={{
                  ...S.input,
                  marginBottom: 8,
                  background: "#fff",
                  border: "1px solid #93c5fd",
                }}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <button
                type="button"
                style={{
                  ...S.btnSolid,
                  width: "100%",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onClick={generateSummary}
                disabled={aiLoading}>
                {aiLoading ? "🔄 Generating..." : "✨ Generate Summary with AI"}
              </button>
            </div>
          </>
        )}

        {/* Autosave status */}
        <div style={{ ...S.small, marginTop: 16 }}>
          {saving
            ? "Saving…"
            : resumeId
            ? `Auto-saved ${resumeId ? "• Resume #" + resumeId : ""}`
            : "Creating resume…"}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            style={S.btnGhost}
            onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Back
          </button>
          <button
            style={S.btnSolid}
            onClick={async () => {
              await markStepDone(step);
              if (step < 5) setStep((s) => s + 1);
              else await handleCompletion();
            }}>
            {step === 5 ? "Complete Resume" : "Next Step"}
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
          <span style={S.hint}>
            {userIsTyping() ? (
              <span style={{ color: "#2563eb", fontWeight: 600 }}>
                🔄 Updating…
              </span>
            ) : (
              <span style={{ color: "#059669", fontWeight: 600 }}>
                ✅ Live Preview
              </span>
            )}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              onClick={() => handleCompletion()}
              disabled={!resumeId}
              style={{
                ...S.btnGhost,
                padding: "6px 10px",
                fontSize: 12,
                background: "#059669",
                color: "white",
                border: "none",
              }}>
              👁️ Preview & Download
            </button>
            <button
              onClick={() => handleExport("txt")}
              disabled={exporting || !resumeId}
              style={{ ...S.btnGhost, padding: "6px 10px", fontSize: 12 }}>
              {exporting ? "⏳" : "📄 TXT"}
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting || !resumeId}
              style={{
                ...S.btnGhost,
                padding: "6px 10px",
                fontSize: 12,
                background: "#dc2626",
                color: "white",
                border: "none",
              }}>
              {exporting ? "⏳" : "📕 PDF"}
            </button>
            <button
              onClick={() => handleExport("docx")}
              disabled={exporting || !resumeId}
              style={{
                ...S.btnGhost,
                padding: "6px 10px",
                fontSize: 12,
                background: "#2563eb",
                color: "white",
                border: "none",
              }}>
              {exporting ? "⏳" : "📘 DOCX"}
            </button>
            <button
              onClick={testPdfExport}
              disabled={!resumeId}
              style={{
                ...S.btnGhost,
                padding: "6px 10px",
                fontSize: 12,
                background: "#dc2626",
                color: "white",
                border: "none",
              }}>
              🧪 Test PDF
            </button>
          </div>
        </div>
        <div style={S.card}>
          {/* Always prioritize server preview for real-time accuracy */}
          {serverPreviewUrl ? (
            <iframe title="preview" src={serverPreviewUrl} style={S.iframe} />
          ) : serverPreview ? (
            <iframe title="preview" srcDoc={serverPreview} style={S.iframe} />
          ) : (
            <iframe title="preview" srcDoc={previewHtml} style={S.iframe} />
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && completionData && (
        <CompletionModal
          data={completionData}
          onClose={() => setShowCompletionModal(false)}
          onExport={handleExport}
          exporting={exporting}
          exportingFormat={exportingFormat}
        />
      )}
    </div>
  );

  // ---------- completion handler (after JSX for clarity) ----------
  async function handleCompletion() {
    if (!resumeId) {
      alert("Please save your resume first");
      return;
    }
    try {
      // Persist latest changes/template before showing modal to match export
      await upsertResume();
      const [resumeRes, previewRes] = await Promise.all([
        api.get(`/api/v1/resumes/${resumeId}`),
        api
          .get(`/api/v1/resumes/${resumeId}/preview`)
          .catch((err) => ({ data: { html: previewHtml } })),
      ]);
      const resumeData = resumeRes.data?.data?.resume || resumeRes.data?.data;
      // Prefer server-rendered HTML so modal matches export exactly
      const finalPreviewHtml =
        previewRes.data?.data?.html ||
        previewRes.data?.html ||
        previewHtml ||
        "";

      setCompletionData({
        resume: resumeData,
        previewHtml: finalPreviewHtml,
        template: selectedTemplate,
        resumeId,
      });
      setShowCompletionModal(true);
    } catch (error) {
      console.error("Failed to load completion data:", error);
      // Use local preview as fallback
      setCompletionData({
        resume,
        previewHtml: previewHtml || "",
        template: selectedTemplate,
        resumeId,
      });
      setShowCompletionModal(true);
    }
  }
}

// ------------------------------
// Completion Modal Component
// ------------------------------
function CompletionModal({ data, onClose, onExport, exporting, exportingFormat }) {
  const { resume, previewHtml, template, resumeId } = data;

  // Define formatDate function
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  // Define theme for this component
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const THEME = isDark
    ? {
        pageBg: "linear-gradient(180deg,#0b1220,#0b1220 40%,#0b1220 100%)",
        cardBg: "#0f172a",
        panelBg: "#1e293b",
        border: "#334155",
        text: "#f1f5f9",
        sub: "#94a3b8",
        muted: "#64748b",
        inputBg: "#1e293b",
      }
    : {
        pageBg: "linear-gradient(180deg,#f8fafc,#f1f5f9 40%,#e2e8f0 100%)",
        cardBg: "#ffffff",
        panelBg: "#f8fafc",
        border: "#e2e8f0",
        text: "#0f172a",
        sub: "#64748b",
        muted: "#94a3b8",
        inputBg: "#ffffff",
      };

  // Define styles for this component
  const S = {
    sectionTitle: {
      fontSize: 18,
      fontWeight: 600,
      margin: "0 0 16px 0",
      color: THEME.text,
      borderBottom: `2px solid ${THEME.border}`,
      paddingBottom: 8,
    },
    label: {
      fontSize: 12,
      color: THEME.sub,
      marginBottom: 6,
      display: "block",
      fontWeight: 500,
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 16,
    },
    btnSolid: {
      background: "#2563eb",
      color: "#fff",
      border: "1px solid #1d4ed8",
      borderRadius: 10,
      padding: "12px 20px",
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s",
    },
    btnGhost: {
      background: THEME.cardBg,
      color: "#2563eb",
      border: "1px solid #93c5fd",
      borderRadius: 10,
      padding: "12px 20px",
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s",
    },
    small: {
      fontSize: 12,
      color: THEME.muted,
      margin: "2px 0",
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
      maxWidth: "1200px",
      width: "100%",
      maxHeight: "90vh",
      overflow: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: "24px 32px",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    },
    title: { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 },
    subtitle: { fontSize: "14px", color: "#64748b", margin: "4px 0 0" },
    closeBtn: {
      background: "none",
      border: "none",
      fontSize: "28px",
      color: "#64748b",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "8px",
      transition: "all 0.2s",
    },
    body: { flex: 1, display: "flex", overflow: "hidden" },
    leftPanel: {
      flex: 1,
      padding: "32px",
      overflow: "auto",
      borderRight: "1px solid #e5e7eb",
    },
    rightPanel: {
      flex: 1,
      padding: "32px",
      background: THEME.panelBg,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    },
  };
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>{resume.title || "Your Resume"}</h2>
            <p style={modalStyles.subtitle}>
              {template?.name || template?.slug}
            </p>
          </div>
          <button style={modalStyles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={modalStyles.body}>
          <div style={modalStyles.leftPanel}>
            <h3 style={S.sectionTitle}>Contact Information</h3>
            <div style={S.grid2}>
              <div>
                <p style={S.label}>Full Name:</p>
                <p>{resume.contact.fullName}</p>
              </div>
              <div>
                <p style={S.label}>Email:</p>
                <p>{resume.contact.email}</p>
              </div>
              <div>
                <p style={S.label}>Phone:</p>
                <p>{resume.contact.phone}</p>
              </div>
              <div>
                <p style={S.label}>Location:</p>
                <p>{resume.contact.address}</p>
              </div>
              <div>
                <p style={S.label}>Website:</p>
                <p>{resume.contact.website}</p>
              </div>
              <div>
                <p style={S.label}>Headline:</p>
                <p>{resume.contact.headline}</p>
              </div>
            </div>

            <h3 style={S.sectionTitle}>Experience</h3>
            {resume.experience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <p style={S.label}>
                  {exp.title || "Job Title"} at {exp.company || "Company"}
                </p>
                <p style={S.small}>
                  {formatDate(exp.startDate)} -{" "}
                  {exp.current ? "Present" : formatDate(exp.endDate)}
                </p>
                <ul style={{ margin: "4px 0 0 20px", fontSize: 13 }}>
                  {exp.bullets.map((bullet, bulletIdx) => (
                    <li key={bulletIdx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}

            <h3 style={S.sectionTitle}>Education</h3>
            {resume.education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <p style={S.label}>
                  {edu.degree || "Degree"} in {edu.school || "School"}
                </p>
                <p style={S.small}>
                  {formatDate(edu.startDate)} -{" "}
                  {edu.endDate ? formatDate(edu.endDate) : "Graduation"}
                </p>
                <p style={S.small}>{edu.location ? `• ${edu.location}` : ""}</p>
                <ul style={{ margin: "4px 0 0 20px", fontSize: 13 }}>
                  {edu.details.map((detail, detailIdx) => (
                    <li key={detailIdx}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}

            <h3 style={S.sectionTitle}>Skills</h3>
            <div style={S.chipRow}>
              {resume.skills.map((skill, idx) => (
                <span key={idx} style={S.chip}>
                  {skill.name || skill}
                </span>
              ))}
            </div>
          </div>
          <div style={modalStyles.rightPanel}>
            <h3 style={S.sectionTitle}>Resume Preview</h3>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
                flex: 1,
                minHeight: 0,
              }}>
              {previewHtml ? (
                <iframe
                  title="resume-preview"
                  srcDoc={previewHtml}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "white",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#64748b",
                    fontSize: "14px",
                  }}>
                  Loading preview...
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{
          padding: "16px 32px",
          borderTop: "1px solid #e5e7eb",
          position: "sticky",
          bottom: 0,
          background: "#fff",
        }}>
          <button
            style={{ ...S.btnSolid, width: "100%" }}
            onClick={() => onExport("pdf")}
            disabled={exporting && exportingFormat === "pdf"}>
            {exporting && exportingFormat === "pdf" ? "Exporting..." : "Download PDF"}
          </button>
          <button
            style={{ ...S.btnSolid, width: "100%", marginTop: 10 }}
            onClick={() => onExport("docx")}
            disabled={exporting && exportingFormat === "docx"}>
            {exporting && exportingFormat === "docx" ? "Exporting..." : "Download DOCX"}
          </button>
          <button
            style={{ ...S.btnSolid, width: "100%", marginTop: 10 }}
            onClick={() => onExport("txt")}
            disabled={exporting && exportingFormat === "txt"}>
            {exporting && exportingFormat === "txt" ? "Exporting..." : "Download TXT"}
          </button>
          <button
            style={{ ...S.btnGhost, width: "100%", marginTop: 10 }}
            onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}