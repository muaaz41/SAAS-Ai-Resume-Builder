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
    console.log("💾 saveResumeToLocal called with data:", {
      title: resumeData?.title,
      templateSlug: resumeData?.templateSlug,
      hasContact: !!resumeData?.contact,
      experienceCount: resumeData?.experience?.length || 0,
      educationCount: resumeData?.education?.length || 0,
    });
    
    const dataToSave = {
      ...resumeData,
      lastSaved: new Date().toISOString(),
      version: STORAGE_VERSION,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    console.log("✅ Successfully saved resume to localStorage");
    
    // Verify it was saved
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log("✅ Verified save - localStorage contains:", {
        title: parsed.title,
        templateSlug: parsed.templateSlug,
        lastSaved: parsed.lastSaved,
      });
    }
    
    return true;
  } catch (error) {
    console.error("❌ Failed to save resume to localStorage:", error);
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
    if (!localResumeData) {
      console.warn("⚠️ No resume data found in localStorage");
      return { success: false, error: "No resume data found in localStorage" };
    }
    
    if (!localResumeData.templateSlug) {
      console.warn("⚠️ Resume data found but missing templateSlug:", localResumeData);
      return { success: false, error: "Resume data is missing template information" };
    }

    // Debug: Log what we're migrating
    console.log("🔄 Migrating resume data from localStorage:", {
      title: localResumeData.title,
      templateSlug: localResumeData.templateSlug,
      hasContact: !!localResumeData.contact,
      contactFields: localResumeData.contact ? Object.keys(localResumeData.contact) : [],
      contactData: localResumeData.contact ? {
        fullName: localResumeData.contact.fullName,
        email: localResumeData.contact.email,
        hasSummary: !!(localResumeData.contact.summary || localResumeData.contact.professionalSummary),
      } : null,
      experienceCount: localResumeData.experience?.length || 0,
      experienceSample: localResumeData.experience?.[0] ? {
        title: localResumeData.experience[0].title,
        company: localResumeData.experience[0].company,
      } : null,
      educationCount: localResumeData.education?.length || 0,
      educationSample: localResumeData.education?.[0] ? {
        degree: localResumeData.education[0].degree,
        school: localResumeData.education[0].school,
      } : null,
      skillsCount: localResumeData.skills?.length || 0,
      projectsCount: localResumeData.projects?.length || 0,
      hobbiesCount: localResumeData.hobbies?.length || 0,
      awardsCount: localResumeData.awards?.length || 0,
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
    // Preserve ALL contact fields from localStorage, don't lose any data
    const contactData = localResumeData.contact || {};
    const payload = {
      title: localResumeData.title || "My Resume",
      templateSlug: localResumeData.templateSlug,
      template: localResumeData.templateSlug, // Some backends expect both
      contact: {
        // Preserve all existing contact fields first
        ...contactData,
        // Then ensure all required fields are present (even if empty)
        fullName: contactData.fullName || "",
        email: contactData.email || "",
        phone: contactData.phone || "",
        location: contactData.location || "",
        address: contactData.address || "",
        website: contactData.website || "",
        github: contactData.github || "",
        linkedin: contactData.linkedin || "",
        portfolioLink: contactData.portfolioLink || "",
        headline: contactData.headline || "",
        summary: contactData.summary || "",
        summaryText: stripHtml(contactData.summary || ""),
        professionalSummary: contactData.professionalSummary || contactData.summary || "",
        professionalSummaryText: stripHtml(
          contactData.professionalSummary || contactData.summary || ""
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

    // Add experience - preserve ALL entries, even if empty (user may fill them later)
    // Only filter out null/undefined entries, not empty strings
    if (localResumeData.experience && Array.isArray(localResumeData.experience)) {
      payload.experience = localResumeData.experience
        .filter((e) => e != null && typeof e === "object") // Only filter out null/undefined/non-objects
        .map(cleanDates)
        .map((e) => {
          const exp = {
            title: e.title || "",
            company: e.company || "",
            location: e.location || "",
            current: e.current || false,
            bullets: Array.isArray(e.bullets) ? e.bullets : [],
          };
          if (e.startDate) exp.startDate = e.startDate;
          if (e.endDate && !e.current) exp.endDate = e.endDate;
          // Include descriptionHtml if present (for rich text)
          if (e.descriptionHtml) exp.descriptionHtml = e.descriptionHtml;
          return exp;
        });
      console.log(`📝 Preserving ${payload.experience.length} experience entries (including empty ones)`);
    } else {
      payload.experience = [];
    }

    // Add education - preserve ALL entries, even if empty (user may fill them later)
    // Only filter out null/undefined entries, not empty strings
    if (localResumeData.education && Array.isArray(localResumeData.education)) {
      payload.education = localResumeData.education
        .filter((e) => e != null && typeof e === "object") // Only filter out null/undefined/non-objects
        .map(cleanDates)
        .map((e) => {
          const edu = {
            degree: e.degree || "",
            school: e.school || "",
            location: e.location || "",
            details: Array.isArray(e.details) ? e.details : [],
          };
          if (e.startDate) edu.startDate = e.startDate;
          if (e.endDate) edu.endDate = e.endDate;
          if (e.gpa) edu.gpa = e.gpa;
          return edu;
        });
      console.log(`📝 Preserving ${payload.education.length} education entries (including empty ones)`);
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

    // Debug: Log the payload being sent with more details
    console.log("📤 Sending resume payload to backend:", {
      title: payload.title,
      templateSlug: payload.templateSlug,
      contact: {
        fullName: payload.contact.fullName,
        email: payload.contact.email,
        phone: payload.contact.phone,
        location: payload.contact.location,
        hasSummary: !!(payload.contact.summary || payload.contact.professionalSummary),
        summaryLength: (payload.contact.summary || "").length,
      },
      experienceCount: payload.experience.length,
      experienceDetails: payload.experience.map(e => ({
        title: e.title,
        company: e.company,
        hasBullets: e.bullets?.length > 0,
      })),
      educationCount: payload.education.length,
      educationDetails: payload.education.map(e => ({
        degree: e.degree,
        school: e.school,
        hasDetails: e.details?.length > 0,
      })),
      skillsCount: payload.skills.length,
      skillsSample: payload.skills.slice(0, 3).map(s => s.name || s),
      projectsCount: payload.projects.length,
      hobbiesCount: payload.hobbies.length,
      awardsCount: payload.awards.length,
    });

    // Create resume in backend
    const response = await api.post("/api/v1/resumes", payload);
    const resumeId = response.data?.data?.resumeId;

    if (resumeId) {
      console.log("✅ Resume migrated successfully, resumeId:", resumeId);
      // Clear localStorage after successful migration
      clearResumeLocal();
      return { success: true, resumeId };
    }

    console.error("❌ Failed to create resume - no resumeId in response");
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