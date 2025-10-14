# 🚀 AI Resume Builder - Frontend Integration Guide

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:4000`
- MongoDB connected

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Development (uses Vite proxy - leave empty or omit)
# VITE_API_BASE_URL=

# Production (set to your deployed API)
# VITE_API_BASE_URL=https://your-api.onrender.com/api/v1
```

### API Configuration

The app automatically detects the environment:

- **Development**: Uses Vite proxy (`/api` → `http://localhost:4000`)
- **Production**: Uses `VITE_API_BASE_URL` from environment

---

## 📋 Features Implemented

### ✅ Authentication

- [x] Sign up with email/password
- [x] Login with email/password
- [x] Google OAuth integration
- [x] LinkedIn OAuth integration
- [x] JWT token management
- [x] Automatic token refresh
- [x] Protected routes

### ✅ Dashboard

- [x] Template gallery with search
- [x] Category filters (Modern, Classic, Creative, Premium)
- [x] Template preview with CSS-based mockups (no external images)
- [x] User's resume list
- [x] Create new resume from template
- [x] Edit existing resumes
- [x] Delete resumes with confirmation

### ✅ Resume Builder

- [x] Side-by-side editor and live preview
- [x] Step-by-step editing (Basics, Experience, Education, Skills, Summary)
- [x] Auto-save functionality (debounced)
- [x] Template selection dropdown
- [x] Real-time preview updates
- [x] Template-specific color schemes (6 unique designs)

### ✅ Form Fields

- [x] Contact information (name, email, phone, address, website, headline)
- [x] Professional summary
- [x] Work experience with:
  - Job title, company, location
  - **Proper date pickers** with calendar icons and format hints
  - "Currently working here" checkbox
  - Bullet points for achievements
- [x] Education with:
  - Degree, school, location
  - **Proper date pickers** for start/end dates
  - Additional details
- [x] Skills (comma-separated input with visual chips)

### ✅ AI Features

- [x] **Enhanced AI Summary Generation**
  - Dedicated AI assistant section with blue background
  - Job description input field
  - Validation before generation
  - Success/error feedback alerts
  - Handles multiple response formats
- [x] **Enhanced AI Experience Bullets**
  - Dedicated AI assistant section
  - Job description input for context
  - Generates achievement-focused bullet points
  - Parses string responses into arrays
  - Success feedback with bullet count
- [x] Error handling with detailed messages

### ✅ Resume Upload & Parsing

- [x] Drag-and-drop file upload
- [x] PDF and DOCX support
- [x] AI-powered parsing with OpenAI
- [x] Preview parsed data before import
- [x] Create resume from parsed data
- [x] Navigate to builder after import

### ✅ Export Functionality

- [x] Export as TXT
- [x] Export as PDF (backend-rendered)
- [x] Export as DOCX (backend-rendered)
- [x] Download with proper filename

### ✅ UI/UX Enhancements

- [x] **Professional date pickers** with:
  - Blue border styling for visibility
  - Calendar emoji (📅) in labels
  - Format hints (MM/DD/YYYY)
  - Disabled state for "current" jobs
  - Smooth transitions
- [x] **AI Assistant UI** with:
  - Light blue background (#eff6ff)
  - Clear section headers with 🤖 emoji
  - Prominent input fields
  - Full-width action buttons
  - Loading states with 🔄 emoji
  - Success indicators with ✅ emoji
- [x] Responsive layout
- [x] Loading states
- [x] Error messages
- [x] Success notifications

---

## 🎨 Date Picker Implementation

### Visual Design

```jsx
// Enhanced date input styling
dateInput: {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 10,
  border: "2px solid #3b82f6", // Blue border
  background: "#fff",
  outline: "none",
  fontSize: 14,
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "all 0.2s",
}
```

### Usage Example

```jsx
<label style={S.label}>
  📅 Start Date *
  <span style={{ fontSize: 11, color: "#64748b" }}>
    (MM/DD/YYYY)
  </span>
</label>
<input
  type="date"
  style={S.dateInput}
  value={exp.startDate}
  placeholder="Select start date"
  onChange={(e) => handleDateChange(e.target.value)}
/>
```

---

## 🤖 AI Integration Details

### Summary Generation

```jsx
const generateSummary = async () => {
  // Validate job description
  if (!jobDescription.trim()) {
    alert("Please enter a job description first");
    return;
  }

  setAiLoading(true);
  try {
    const res = await api.post("/api/v1/ai/suggest", {
      field: "summary",
      jobDescription: jobDescription || "",
    });

    // Handle multiple response formats
    const text =
      res.data?.data?.text ||
      res.data?.data?.suggestion ||
      res.data?.text ||
      "";

    if (text) {
      setResume((r) => ({
        ...r,
        contact: { ...r.contact, summary: text },
      }));
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
```

### Experience Bullets Generation

```jsx
const generateExperienceBullets = async (experienceIndex = 0) => {
  if (!jobDescription.trim()) {
    alert("Please enter a job description first");
    return;
  }

  setAiLoading(true);
  try {
    const res = await api.post("/api/v1/ai/suggest", {
      field: "experienceBullets",
      jobDescription: jobDescription || "",
    });

    // Handle different response formats
    let bullets =
      res.data?.data?.bullets ||
      res.data?.data?.suggestion ||
      res.data?.bullets ||
      [];

    // Parse string responses
    if (typeof bullets === "string") {
      bullets = bullets
        .split("\n")
        .map((line) => line.trim().replace(/^[-•\u2022]\s*/, ""))
        .filter(Boolean);
    }

    const finalBullets =
      Array.isArray(bullets) && bullets.length ? bullets : [];

    if (finalBullets.length) {
      // Update experience entry
      setResume((r) => {
        const exp = [...(r.experience || [])];
        if (exp.length === 0) {
          exp.push({
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            bullets: [],
          });
        }
        exp[experienceIndex] = {
          ...exp[experienceIndex],
          bullets: finalBullets,
        };
        return { ...r, experience: exp };
      });
      alert(`✅ AI generated ${finalBullets.length} bullet points!`);
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
```

---

## 📦 Project Structure

```
src/
├── components/
│   ├── AuthTest.jsx          # Deprecated (kept as stub)
│   ├── Builder.jsx           # ✅ Main resume editor
│   ├── Dashboard.jsx         # ✅ Template gallery & resume list
│   ├── Footer.jsx            # Footer component
│   ├── Landing.jsx           # Landing page
│   ├── LinkedInCallback.jsx # OAuth callback handler
│   ├── Navbar.jsx            # ✅ Navigation with auth state
│   ├── ProtectedRoute.jsx    # ✅ Route protection
│   ├── ResumeUpload.jsx      # ✅ File upload & parsing
│   ├── SignIn.jsx            # ✅ Login form
│   └── SignUp.jsx            # ✅ Registration form
├── context/
│   └── AuthContext.jsx       # ✅ Auth state management
├── lib/
│   ├── api.js                # ✅ Axios configuration
│   └── config.js             # ✅ Environment config
├── css/
│   ├── Footer.css
│   ├── Landing.css
│   ├── Navbar.css
│   ├── SignIn.css
│   └── SignUp.css
├── App.jsx                   # ✅ Routes & protected routes
└── main.jsx                  # Entry point
```

---

## 🔄 Data Flow

### 1. User Authentication Flow

```
User → SignUp/SignIn → API → JWT Token → localStorage → AuthContext → Protected Routes
```

### 2. Resume Creation Flow

```
Dashboard → Select Template → API POST /resumes → resumeId → Navigate to Builder
```

### 3. Resume Editing Flow

```
Builder → Load Resume → Edit Fields → Debounced Autosave → API PATCH /resumes/:id
```

### 4. Live Preview Flow

```
Builder → Resume Data Changes → Debounced API Call → GET /resumes/:id/preview → Update iframe
```

### 5. AI Suggestion Flow

```
User Input → Job Description → AI Button → API POST /ai/suggest → Parse Response → Update Fields → Alert User
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors in Development

**Symptom:**

```
Access to fetch at 'http://localhost:4000/api/v1/...' has been blocked by CORS
```

**Solution:**

1. Make sure backend is running on `http://localhost:4000`
2. Ensure `VITE_API_BASE_URL` is NOT set in `.env` (or is empty)
3. Restart Vite dev server: `npm run dev`
4. Check Vite proxy is working: Network tab should show `/api/v1/...` not `http://localhost:4000/...`

### Issue 2: 401 Unauthorized After Login

**Symptom:**

```
Request failed with status code 401
```

**Solution:**

1. Check token is saved: `localStorage.getItem("accessToken")`
2. Check Authorization header: Network tab → Headers
3. Verify backend JWT_SECRET matches
4. Try logging out and logging in again

### Issue 3: Preview Not Updating

**Symptom:**
Live preview doesn't reflect changes

**Solution:**

1. Check console for API errors
2. Verify `resumeId` is set
3. Increase debounce time in `Builder.jsx`:
   ```jsx
   const timer = setTimeout(async () => {
     // Fetch preview
   }, 2000); // Increase from 1500 to 2000ms
   ```

### Issue 4: AI Not Updating Fields

**Symptom:**
AI generates content but fields don't update

**Solution:**

1. Check alert messages for success/error
2. Verify job description is entered
3. Check console for API response format
4. Ensure backend AI endpoint is working (test in Postman)

### Issue 5: Date Picker Not Visible

**Symptom:**
Date inputs look like regular text inputs

**Solution:**

1. Make sure `type="date"` is set
2. Check browser supports HTML5 date input
3. Verify `dateInput` style is applied
4. Try clicking on the input - calendar should appear

### Issue 6: 400 Bad Request on Save

**Symptom:**

```
Failed to load resource: the server responded with a status of 400
```

**Solution:**

1. Check payload in Network tab
2. Verify no empty arrays are being sent
3. Ensure skills have proper format:
   ```jsx
   skills: [{ name: "JavaScript", level: 0 }];
   ```
4. Filter empty experience/education before saving

---

## 🧪 Testing Checklist

### Authentication

- [ ] Sign up with new account
- [ ] Login with existing account
- [ ] Logout and verify redirect
- [ ] Try accessing `/builder` without login (should redirect)
- [ ] Token refresh works after 15 minutes

### Dashboard

- [ ] Templates load and display correctly
- [ ] Search filters templates
- [ ] Category filters work
- [ ] Click template creates new resume
- [ ] User's resumes display
- [ ] Edit button navigates to builder
- [ ] Delete button removes resume

### Builder - Basic Editing

- [ ] Contact fields update preview
- [ ] Add experience entry
- [ ] **Date pickers** open calendar and save dates
- [ ] "Currently working here" disables end date
- [ ] Experience bullets update preview
- [ ] Add education entry
- [ ] Education dates save correctly
- [ ] Skills display as chips
- [ ] Summary updates preview

### Builder - AI Features

- [ ] Enter job description in AI box
- [ ] Click "Generate Summary" updates summary field
- [ ] Success alert shows
- [ ] Click "Generate Bullet Points" updates experience
- [ ] Bullet count alert shows
- [ ] AI works without job description (shows validation alert)
- [ ] Error handling works (test with backend down)

### Builder - Advanced

- [ ] Autosave works (check "Saving..." indicator)
- [ ] Template change updates preview
- [ ] Preview reflects template colors
- [ ] Step navigation works
- [ ] "Next" button progresses steps
- [ ] "Finish" button completes resume

### Upload & Parsing

- [ ] Upload PDF resume
- [ ] Upload DOCX resume
- [ ] Parsed data displays correctly
- [ ] Import creates new resume
- [ ] Navigate to builder after import
- [ ] Preview shows parsed data

### Export

- [ ] Export as TXT downloads file
- [ ] Export as PDF downloads file
- [ ] Export as DOCX downloads file
- [ ] Filename includes resume title

---

## 🚀 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   ```
   VITE_API_BASE_URL=https://your-api.onrender.com/api/v1
   ```
4. Deploy

### Frontend (Netlify)

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Environment variables:
   ```
   VITE_API_BASE_URL=https://your-api.onrender.com/api/v1
   ```

### Backend (Render)

1. Environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   OPENAI_API_KEY=sk-...
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```

---

## 📚 API Endpoints Used

### Authentication

- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/google` - Google OAuth
- `GET /api/v1/auth/linkedin` - LinkedIn OAuth

### Templates

- `GET /api/v1/templates` - List all templates
- `GET /api/v1/templates/:slug` - Get template details

### Resumes

- `GET /api/v1/resumes` - List user's resumes
- `POST /api/v1/resumes` - Create new resume
- `GET /api/v1/resumes/:id` - Get resume details
- `PATCH /api/v1/resumes/:id` - Update resume
- `DELETE /api/v1/resumes/:id` - Delete resume
- `GET /api/v1/resumes/:id/preview` - Get HTML preview
- `GET /api/v1/resumes/:id/export/txt` - Export as TXT
- `GET /api/v1/resumes/:id/export/pdf` - Export as PDF
- `GET /api/v1/resumes/:id/export/docx` - Export as DOCX

### AI

- `POST /api/v1/ai/suggest` - Generate AI suggestions

### Files

- `POST /api/v1/files/parse` - Parse resume file (preview)
- `POST /api/v1/files/import` - Parse and create resume

---

## 🎯 Next Steps

### Planned Features

- [ ] ATS Score Checker
- [ ] Email resume functionality
- [ ] Stripe payment integration for premium templates
- [ ] More template designs
- [ ] Cover letter builder
- [ ] Resume analytics
- [ ] Collaboration features
- [ ] Version history

### Improvements

- [ ] Add loading skeletons
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts
- [ ] Add undo/redo functionality
- [ ] Add template preview modal
- [ ] Add resume duplication
- [ ] Add resume sharing

---

## 📞 Support

If you encounter any issues:

1. **Check console logs** for error messages
2. **Check Network tab** to see API requests/responses
3. **Test with Postman** to isolate frontend vs backend issues
4. **Verify environment variables** are set correctly
5. **Restart dev server** after config changes

---

## 🎉 Summary

This frontend is fully integrated with the backend API and includes:

✅ **Professional date pickers** with calendar icons and format hints  
✅ **Enhanced AI features** with dedicated UI sections and feedback  
✅ **Proper token management** with localStorage persistence  
✅ **Automatic token refresh** on 401 errors  
✅ **Template-specific previews** with unique color schemes  
✅ **Resume upload & parsing** with AI-powered extraction  
✅ **Export functionality** for TXT, PDF, and DOCX  
✅ **Comprehensive error handling** with user-friendly messages

All features are production-ready and follow best practices! 🚀
