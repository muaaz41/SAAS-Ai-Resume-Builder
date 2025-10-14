# 🎯 AI Resume Builder - Frontend

A modern, AI-powered resume builder with live preview, multiple templates, and intelligent content suggestions.

![React](https://img.shields.io/badge/React-18.3-blue)
![Vite](https://img.shields.io/badge/Vite-6.0-purple)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` 🚀

**See [QUICK_START.md](./QUICK_START.md) for 30-second setup guide**

---

## ✨ Features

### 🎨 **Template System**

- 6+ professional templates (Modern, Classic, Creative, Premium)
- CSS-based previews (no external images needed)
- Template-specific color schemes
- Real-time preview updates
- Search and filter templates

### 📝 **Resume Editor**

- Side-by-side editor and live preview
- Step-by-step guided editing
- Auto-save functionality (1-second debounce)
- Drag-and-drop sections
- Professional form validation

### 📅 **Enhanced Date Pickers**

- HTML5 date inputs with calendar UI
- Visual indicators (📅 calendar icons)
- Format hints (MM/DD/YYYY)
- Smart "Currently working here" checkbox
- Disabled states for active positions

### 🤖 **AI-Powered Content**

- **Summary Generation**: AI writes professional summaries
- **Experience Bullets**: AI generates achievement-focused bullet points
- Context-aware suggestions based on job descriptions
- Multiple response format handling
- Success/error feedback alerts

### 📤 **Export & Import**

- **Export**: PDF, DOCX, TXT formats
- **Import**: Upload existing resume (PDF/DOCX)
- AI-powered parsing with OpenAI
- Preview before import
- One-click download

### 🔐 **Authentication**

- Email/password authentication
- Google OAuth integration
- LinkedIn OAuth integration
- JWT token management
- Automatic token refresh
- Protected routes

### 💾 **Data Management**

- Auto-save every 1 second
- Resume versioning
- Delete with confirmation
- Duplicate resumes
- Cloud storage

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18.3 + Vite 6.0
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Styling**: CSS Modules + Inline Styles
- **State**: React Context API + Hooks

### Project Structure

```
src/
├── components/
│   ├── Builder.jsx           # Main resume editor
│   ├── Dashboard.jsx         # Template gallery & resume list
│   ├── ResumeUpload.jsx      # File upload & parsing
│   ├── Navbar.jsx            # Navigation
│   ├── SignIn.jsx / SignUp.jsx
│   └── ProtectedRoute.jsx    # Route protection
├── context/
│   └── AuthContext.jsx       # Auth state management
├── lib/
│   ├── api.js                # Axios configuration
│   └── config.js             # Environment config
└── App.jsx                   # Routes
```

---

## 📋 Implementation Status

### ✅ Completed Features

| Feature          | Status | Notes                    |
| ---------------- | ------ | ------------------------ |
| Authentication   | ✅     | Email, Google, LinkedIn  |
| Template Gallery | ✅     | 6+ templates with search |
| Resume Builder   | ✅     | Side-by-side editor      |
| Date Pickers     | ✅     | Professional calendar UI |
| AI Summary       | ✅     | Context-aware generation |
| AI Bullets       | ✅     | Achievement-focused      |
| Live Preview     | ✅     | Real-time updates        |
| Auto-Save        | ✅     | 1-second debounce        |
| Resume Upload    | ✅     | AI-powered parsing       |
| Export PDF/DOCX  | ✅     | Backend-rendered         |
| Template Colors  | ✅     | 6 unique themes          |
| Protected Routes | ✅     | JWT-based                |

### 🚧 Planned Features

- [ ] ATS Score Checker
- [ ] Email resume functionality
- [ ] Stripe payment integration
- [ ] Cover letter builder
- [ ] Resume analytics
- [ ] Collaboration features
- [ ] Version history
- [ ] Mobile app

---

## 🎨 Key Components

### Builder Component

The main resume editor with:

- 5-step guided workflow (Basics → Experience → Education → Skills → Summary)
- Real-time preview with template-specific styling
- AI assistant sections with blue backgrounds
- Professional date pickers with format hints
- Auto-save with visual indicator

### Dashboard Component

Template gallery and resume management:

- Grid layout with CSS-based template mockups
- Search and category filters
- Premium badge indicators
- Resume cards with edit/delete actions
- Upload resume modal

### ResumeUpload Component

Drag-and-drop file upload:

- PDF and DOCX support (10MB limit)
- Two-step process: parse → preview → import
- AI-powered field extraction
- Error handling with user-friendly messages

---

## 🔧 Configuration

### Environment Variables

```env
# Development (uses Vite proxy)
# Leave empty or omit VITE_API_BASE_URL

# Production
VITE_API_BASE_URL=https://your-api.onrender.com/api/v1
```

### API Configuration

- **Development**: Uses Vite proxy (`/api` → `http://localhost:4000`)
- **Production**: Uses `VITE_API_BASE_URL` from environment
- **Auto-detection**: Switches based on `import.meta.env.DEV`

---

## 🧪 Testing

### Manual Testing Checklist

```bash
# Authentication
✓ Sign up with new account
✓ Login with existing account
✓ Logout and verify redirect
✓ Protected route access

# Dashboard
✓ Templates load and display
✓ Search filters templates
✓ Category filters work
✓ Create new resume from template

# Builder
✓ Contact fields update preview
✓ Date pickers open calendar
✓ "Currently working here" works
✓ AI generates summary
✓ AI generates bullet points
✓ Auto-save indicator shows
✓ Template change updates preview

# Export/Import
✓ Upload PDF/DOCX resume
✓ Parsed data displays correctly
✓ Export as PDF/DOCX/TXT
```

---

## 🐛 Troubleshooting

### CORS Errors

```bash
# Ensure backend is running
cd ../backend && npm start

# Restart frontend
npm run dev
```

### 401 Unauthorized

```javascript
// Clear localStorage and login again
localStorage.clear();
window.location.href = "/signin";
```

### Preview Not Updating

- Wait 2 seconds after typing
- Check console for API errors
- Verify `resumeId` is set
- Check backend is running

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed troubleshooting.

---

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get running in 30 seconds
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Complete integration guide
- **Backend API Docs** - See backend `/docs` folder
- **Postman Collection** - See backend `/docs/postman`

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import to Vercel
# 3. Set environment variable:
VITE_API_BASE_URL=https://your-api.onrender.com/api/v1

# 4. Deploy
```

### Netlify

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
VITE_API_BASE_URL=https://your-api.onrender.com/api/v1
```

---

## 🎯 API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/google` - Google OAuth
- `GET /api/v1/auth/linkedin` - LinkedIn OAuth

### Resumes

- `GET /api/v1/resumes` - List resumes
- `POST /api/v1/resumes` - Create resume
- `PATCH /api/v1/resumes/:id` - Update resume
- `DELETE /api/v1/resumes/:id` - Delete resume
- `GET /api/v1/resumes/:id/preview` - Get preview
- `GET /api/v1/resumes/:id/export/:format` - Export

### AI

- `POST /api/v1/ai/suggest` - Generate suggestions

### Files

- `POST /api/v1/files/parse` - Parse resume
- `POST /api/v1/files/import` - Import resume

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- React team for amazing framework
- Vite for blazing fast dev server
- OpenAI for AI capabilities
- All contributors and testers

---

**Built with ❤️ using React + Vite**
