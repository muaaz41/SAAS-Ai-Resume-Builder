# Creating Custom Templates for Resume Builder

## Overview

The resume builder application supports two types of templates:
1. **NPM Package Templates** - Using existing JSON Resume themes
2. **Local Handlebars Templates** - Custom HTML/CSS templates using Handlebars

## Template Structure

### Database Schema
Each template has the following structure in the database:
```javascript
{
  name: String,                    // Display name
  slug: String,                    // Unique identifier for URL
  category: String,                // "free", "premium", "industry"
  atsOptimized: Boolean,           // Whether template is ATS-friendly
  thumbnailUrl: String,            // URL to thumbnail image
  previewUrl: String,              // URL to preview
  remoteTemplateUrl: String,       // For CDN-hosted templates
  remoteCssUrl: String,            // For CDN-hosted CSS
  assetsBaseUrl: String,           // Base URL for assets in template
  npmPackageName: String,          // NPM package name for JSON Resume theme
  ui: {
    accentColor: String,           // Theme accent color
    bulletStyle: String,           // "dot", "dash", "square"
    showPhoto: Boolean,            // Whether to show photo section
    stepperStyle: String,          // "dots", "numbers"
    fontFamily: String,            // Font family to use
  },
  engine: String,                  // "html", "handlebars"
  locked: Boolean,                 // Whether template requires subscription
  tags: [String],                  // Template tags for search
  isActive: Boolean                // Whether template is available
}
```

## Creating Local Handlebars Templates

### 1. Create Template Directory
Create a new directory in `AI_resume_builder_backend/src/templates/[template-slug]`

Example:
```
AI_resume_builder_backend/src/templates/my-custom-template/
├── template.hbs
└── style.css
```

### 2. Create Handlebars Template (template.hbs)
```handlebars
<div class="resume my-custom-template">
  <header class="header">
    <h1>{{contact.fullName}}</h1>
    <div class="contact-info">
      <span>{{contact.email}}</span> | 
      <span>{{contact.phone}}</span> | 
      <span>{{contact.location}}</span>
    </div>
    <p class="headline">{{contact.headline}}</p>
  </header>

  <section class="summary">
    <h2>Summary</h2>
    <p>{{contact.summary}}</p>
  </section>

  <section class="experience">
    <h2>Experience</h2>
    {{#each experience}}
    <div class="job">
      <div class="job-header">
        <h3>{{title}}</h3>
        <span class="company">{{company}}</span>
      </div>
      <div class="job-details">
        <span class="date">{{dateRange}}</span>
        <span class="location">{{location}}</span>
      </div>
      <ul class="bullets">
        {{#each bullets}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
    {{/each}}
  </section>

  <section class="education">
    <h2>Education</h2>
    {{#each education}}
    <div class="school">
      <h3>{{degree}}</h3>
      <span class="institution">{{school}}</span>
      <div class="date">{{dateRange}}</div>
    </div>
    {{/each}}
  </section>

  <section class="skills">
    <h2>Skills</h2>
    <div class="skill-list">
      {{#each skills}}
      <span class="skill">{{name}}</span>
      {{/each}}
    </div>
  </section>
</div>
```

### 3. Create CSS Styles (style.css)
```css
body {
  font-family: Inter, Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #ffffff;
}

.resume.my-custom-template {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.header h1 {
  color: #1f2937;
  margin: 0 0 8px 0;
  font-size: 2rem;
}

.contact-info {
  color: #4b5563;
  margin-bottom: 8px;
}

.headline {
  color: #374151;
  font-style: italic;
  margin: 0;
}

section {
  margin-bottom: 24px;
}

section h2 {
  color: #374151;
  border-bottom: 1px solid #d1d5db;
  padding-bottom: 8px;
  margin: 0 0 12px 0;
  font-size: 1.25rem;
}

.job {
  margin-bottom: 16px;
}

.job-header h3 {
  margin: 0 0 4px 0;
  color: #1f2937;
}

.company {
  font-weight: bold;
  color: #374151;
}

.job-details {
  display: flex;
  gap: 16px;
  margin: 4px 0 8px 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.bullets {
  margin: 0;
  padding-left: 20px;
}

.bullets li {
  margin-bottom: 4px;
}

.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill {
  background-color: #e0e7ff;
  color: #3730a3;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}
```

## Adding Template to Database

### Option 1: Manual Database Entry
Add a new template document to your database:

```javascript
{
  name: "My Custom Template",
  slug: "my-custom-template",
  category: "premium",
  tags: ["custom", "modern", "professional"],
  isActive: true,
  ui: {
    accentColor: "#3b82f6",
    bulletStyle: "dot",
    showPhoto: true,
    stepperStyle: "numbers",
    fontFamily: "Inter, Arial, sans-serif"
  },
  engine: "handlebars"
}
```

### Option 2: Update Seed Script
Add your template to `AI_resume_builder_backend/scripts/seed-templates.js`:

```javascript
{
  name: "My Custom Template",
  slug: "my-custom-template",
  category: "premium",
  tags: ["custom", "modern", "professional"],
  isActive: true,
  ui: {
    accentColor: "#3b82f6",
    bulletStyle: "dot",
    showPhoto: true,
    stepperStyle: "numbers",
    fontFamily: "Inter, Arial, sans-serif"
  },
  engine: "handlebars"
}
```

## Using NPM Package Templates

If you want to use an existing JSON Resume theme from NPM:

1. Install the package: `npm install jsonresume-theme-[theme-name]`
2. Add to your template with `npmPackageName` field:
```javascript
{
  name: "My NPM Theme",
  slug: "my-npm-theme",
  category: "premium",
  npmPackageName: "jsonresume-theme-[theme-name]",
  tags: ["npm", "theme"],
  isActive: true,
  ui: {
    accentColor: "#3b82f6",
    bulletStyle: "dot",
    showPhoto: true,
    stepperStyle: "numbers",
    fontFamily: "Arial, sans-serif"
  }
}
```

## Data Structure Available in Templates

Your templates have access to the following data structure:

```javascript
{
  contact: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    location: String,
    website: String,
    github: String,
    linkedin: String,
    portfolioLink: String,
    headline: String,
    summary: String,
    professionalSummary: String
  },
  experience: [
    {
      title: String,
      company: String,
      location: String,
      startDate: String,
      endDate: String,
      current: Boolean,
      bullets: [String]
    }
  ],
  education: [
    {
      degree: String,
      school: String,
      location: String,
      startDate: String,
      endDate: String,
      details: [String],
      gpa: String
    }
  ],
  skills: [
    {
      name: String,
      level: Number,
      score: Number
    }
  ],
  projects: [
    {
      name: String,
      description: String,
      link: String
    }
  ],
  hobbies: [
    {
      name: String,
      description: String
    }
  ],
  awards: [
    {
      title: String,
      description: String,
      issuer: String,
      date: String
    }
  ]
}
```

## Testing Your Template

1. Restart your backend server
2. Run the seed script if you added your template there: `node scripts/seed-templates.js`
3. Visit the templates page in your frontend to see your new template
4. Select your template in the builder to test it

## Best Practices

- Use semantic HTML for better accessibility
- Ensure responsive design for different screen sizes
- Use the accentColor from the UI settings for consistency
- Test with various resume data to ensure proper rendering
- Keep CSS scoped to your template to avoid conflicts
- Use relative units (rem, em) for better scalability