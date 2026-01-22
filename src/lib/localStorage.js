/**
 * LocalStorage utilities for resume data (no account required)
 * This allows users to build resumes before signing up
 */

const STORAGE_KEY = "resume_draft_data";
const STORAGE_VERSION = 1;

/**
 * Save resume data to localStorage
 */
export const saveResumeToLocal = (resumeData) => {
  try {
    const dataToSave = {
      ...resumeData,
      lastSaved: new Date().toISOString(),
      version: STORAGE_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.warn("Failed to save resume to localStorage:", error);
    return false;
  }
};

/**
 * Get resume data from localStorage
 */
export const getResumeFromLocal = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Remove metadata fields before returning
    const { lastSaved, version, ...resumeData } = parsed;
    return resumeData;
  } catch (error) {
    console.warn("Failed to get resume from localStorage:", error);
    return null;
  }
};

/**
 * Clear resume data from localStorage
 */
export const clearResumeLocal = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn("Failed to clear resume from localStorage:", error);
    return false;
  }
};

/**
 * Check if localStorage has resume data
 */
export const hasResumeLocal = () => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Get last saved timestamp
 */
export const getLastSavedTimestamp = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed.lastSaved || null;
  } catch (error) {
    return null;
  }
};

/**
 * Calculate resume completion percentage
 */
export const calculateResumeProgress = (resumeData) => {
  let completed = 0;
  let total = 0;

  // Contact/Basics (Step 1)
  total += 1;
  if (resumeData?.contact?.fullName) completed += 1;

  // Summary (Step 2)
  total += 1;
  if (resumeData?.contact?.summary || resumeData?.contact?.professionalSummary) {
    completed += 1;
  }

  // Experience (Step 3)
  total += 1;
  const hasExperience =
    resumeData?.experience?.length > 0 &&
    resumeData.experience.some((e) => e.title && e.company);
  if (hasExperience) completed += 1;

  // Education (Step 4)
  total += 1;
  const hasEducation =
    resumeData?.education?.length > 0 &&
    resumeData.education.some((e) => e.degree && e.school);
  if (hasEducation) completed += 1;

  // Skills (Step 5)
  total += 1;
  if (resumeData?.skills?.length > 0) completed += 1;

  return Math.round((completed / total) * 100);
};

/**
 * Migrate resume from localStorage to backend after user authentication
 * @param {Object} api - The API instance (from lib/api.js)
 * @returns {Promise<{success: boolean, resumeId?: string, error?: string}>}
 */
export const migrateResumeToBackend = async (api) => {
  try {
    // Get resume data from localStorage
    const localResumeData = getResumeFromLocal();
    if (!localResumeData || !localResumeData.templateSlug) {
      return { success: false, error: "No resume data found in localStorage" };
    }

    // Debug: Log what we're migrating
    console.log("🔄 Migrating resume data:", {
      hasContact: !!localResumeData.contact,
      experienceCount: localResumeData.experience?.length || 0,
      educationCount: localResumeData.education?.length || 0,
      skillsCount: localResumeData.skills?.length || 0,
      projectsCount: localResumeData.projects?.length || 0,
      hobbiesCount: localResumeData.hobbies?.length || 0,
      awardsCount: localResumeData.awards?.length || 0,
      templateSlug: localResumeData.templateSlug,
    });

    // Check resume limit first
    try {
      const resumeCountRes = await api.get("/api/v1/resumes");
      const resumeCount = resumeCountRes.data?.data?.items?.length || resumeCountRes.data?.data?.count || 0;
      if (resumeCount >= 5) {
        return { 
          success: false, 
          error: "You have reached the maximum limit of 5 resumes. Please delete an old resume first." 
        };
      }
    } catch (err) {
      console.warn("Could not check resume count:", err);
      // Continue anyway - backend will enforce the limit
    }

    // Clean and prepare resume data for API
    const cleanDates = (obj) => {
      const cleaned = { ...obj };
      if (cleaned.startDate === "null" || cleaned.startDate === "" || !cleaned.startDate) {
        delete cleaned.startDate;
      }
      if (cleaned.endDate === "null" || cleaned.endDate === "" || !cleaned.endDate || cleaned.current) {
        delete cleaned.endDate;
      }
      return cleaned;
    };

    const stripHtml = (html) => {
      if (!html) return "";
      const withoutTags = String(html).replace(/<[^>]*>/g, " ");
      return withoutTags.replace(/\s+/g, " ").trim();
    };

    // Prepare payload similar to Builder's cleanResumeData
    // Always include all fields to ensure complete data migration
    const payload = {
      title: localResumeData.title || "My Resume",
      templateSlug: localResumeData.templateSlug,
      template: localResumeData.templateSlug, // Some backends expect both
      contact: {
        fullName: localResumeData.contact?.fullName || "",
        email: localResumeData.contact?.email || "",
        phone: localResumeData.contact?.phone || "",
        location: localResumeData.contact?.location || "",
        address: localResumeData.contact?.address || "",
        website: localResumeData.contact?.website || "",
        github: localResumeData.contact?.github || "",
        linkedin: localResumeData.contact?.linkedin || "",
        portfolioLink: localResumeData.contact?.portfolioLink || "",
        headline: localResumeData.contact?.headline || "",
        summary: localResumeData.contact?.summary || "",
        summaryText: stripHtml(localResumeData.contact?.summary || ""),
        professionalSummary: localResumeData.contact?.professionalSummary || localResumeData.contact?.summary || "",
        professionalSummaryText: stripHtml(
          localResumeData.contact?.professionalSummary || localResumeData.contact?.summary || ""
        ),
      },
      // Initialize all arrays to ensure they're always included
      experience: [],
      education: [],
      skills: [],
      projects: [],
      hobbies: [],
      awards: [],
    };

    // Add experience - include ALL entries with any data to preserve user's work
    if (localResumeData.experience && Array.isArray(localResumeData.experience)) {
      payload.experience = localResumeData.experience
        .map(cleanDates)
        .map((e) => {
          const exp = {
            title: e.title || "",
            company: e.company || "",
            location: e.location || "",
            current: e.current || false,
            bullets: e.bullets || [],
          };
          if (e.startDate) exp.startDate = e.startDate;
          if (e.endDate && !e.current) exp.endDate = e.endDate;
          // Include descriptionHtml if present (for rich text)
          if (e.descriptionHtml) exp.descriptionHtml = e.descriptionHtml;
          return exp;
        })
        // Include entries that have ANY meaningful data (title, company, location, dates, bullets, or descriptionHtml)
        .filter((e) => 
          (e.title && e.title.trim()) || 
          (e.company && e.company.trim()) || 
          (e.location && e.location.trim()) || 
          e.startDate || 
          e.endDate || 
          (e.bullets && e.bullets.length > 0) ||
          e.descriptionHtml
        );
    } else {
      payload.experience = [];
    }

    // Add education - include ALL entries with any data to preserve user's work
    if (localResumeData.education && Array.isArray(localResumeData.education)) {
      payload.education = localResumeData.education
        .map(cleanDates)
        .map((e) => {
          const edu = {
            degree: e.degree || "",
            school: e.school || "",
            location: e.location || "",
            details: e.details || [],
          };
          if (e.startDate) edu.startDate = e.startDate;
          if (e.endDate) edu.endDate = e.endDate;
          if (e.gpa) edu.gpa = e.gpa;
          return edu;
        })
        // Include entries that have ANY meaningful data (degree, school, location, dates, or details)
        .filter((e) => 
          (e.degree && e.degree.trim()) || 
          (e.school && e.school.trim()) || 
          (e.location && e.location.trim()) || 
          e.startDate || 
          e.endDate || 
          (e.details && e.details.length > 0) ||
          e.gpa
        );
    } else {
      payload.education = [];
    }

    // Add skills - always include array (even if empty)
    if (localResumeData.skills && Array.isArray(localResumeData.skills)) {
      payload.skills = localResumeData.skills
        .filter((s) => s && (s.name || typeof s === "string"))
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
    } else {
      payload.skills = [];
    }

    // Add projects - always include array (even if empty)
    if (localResumeData.projects && Array.isArray(localResumeData.projects)) {
      payload.projects = localResumeData.projects
        .filter((p) => p && (p.name || p.description || p.descriptionHtml))
        .map((p) => {
          const project = {
            name: p.name || "",
            description: p.description || "",
          };
          if (p.descriptionHtml) project.descriptionHtml = p.descriptionHtml;
          if (p.link) project.link = p.link;
          return project;
        });
    } else {
      payload.projects = [];
    }

    // Add hobbies - always include array (even if empty)
    if (localResumeData.hobbies && Array.isArray(localResumeData.hobbies)) {
      payload.hobbies = localResumeData.hobbies
        .filter((h) => h && (h.name || typeof h === "string"))
        .map((h) => {
          if (typeof h === "string") {
            return { name: h };
          }
          return {
            name: h.name || "",
            description: h.description || "",
          };
        })
        .filter((h) => h.name);
    } else {
      payload.hobbies = [];
    }

    // Add awards - always include array (even if empty)
    if (localResumeData.awards && Array.isArray(localResumeData.awards)) {
      payload.awards = localResumeData.awards
        .filter((a) => a && (a.title || a.name || a.description || a.descriptionHtml))
        .map((a) => {
          const award = {
            title: a.title || a.name || "",
            description: a.description || "",
          };
          if (a.descriptionHtml) award.descriptionHtml = a.descriptionHtml;
          if (a.date) award.date = a.date;
          if (a.issuer) award.issuer = a.issuer;
          return award;
        })
        .filter((a) => a.title);
    } else {
      payload.awards = [];
    }

    // Create resume in backend
    const response = await api.post("/api/v1/resumes", payload);
    const resumeId = response.data?.data?.resumeId;

    if (resumeId) {
      // Clear localStorage after successful migration
      clearResumeLocal();
      return { success: true, resumeId };
    }

    return { success: false, error: "Failed to create resume" };
  } catch (error) {
    console.error("Failed to migrate resume to backend:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to save resume. You can continue editing in the builder.";
    return { success: false, error: errorMessage };
  }
};