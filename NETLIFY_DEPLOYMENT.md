# Netlify Deployment Guide

## 🚀 Deploy Your AI Resume Builder Frontend to Netlify

### Prerequisites
- ✅ Netlify account (free at [netlify.com](https://netlify.com))
- ✅ GitHub repository with your code
- ✅ Backend deployed on Render

### Deployment Steps

#### Method 1: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Sign in with your GitHub account

2. **Create New Site**
   - Click "New site from Git"
   - Choose "GitHub" as your Git provider
   - Select your repository: `SAAS-Ai-Resume-Builder/ai-resume-builder`

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (or `20`)

4. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add the following variables:
     ```
     VITE_API_BASE_URL = https://ai-resume-builder-backend-uhdm.onrender.com/api/v1
     VITE_APP_ENV = production
     ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (2-3 minutes)

#### Method 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Configuration Files

The following files are already configured for Netlify:

- ✅ `netlify.toml` - Netlify configuration
- ✅ `package.json` - Build scripts
- ✅ `vite.config.js` - Vite configuration
- ✅ `src/lib/config.js` - API configuration

### Environment Variables

Set these in Netlify Dashboard → Site settings → Environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://ai-resume-builder-backend-uhdm.onrender.com/api/v1` | Backend API URL |
| `VITE_APP_ENV` | `production` | App environment |

### Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter your domain name

2. **Configure DNS**
   - Add CNAME record pointing to your Netlify site
   - Or use Netlify's nameservers

### Features Included

- ✅ **SPA Routing** - All routes redirect to index.html
- ✅ **API Proxy** - /api/* requests proxy to your backend
- ✅ **Security Headers** - XSS protection, content type options
- ✅ **Asset Caching** - Static assets cached for 1 year
- ✅ **HTTPS** - Automatic SSL certificate

### Troubleshooting

#### Build Fails
- Check Node.js version (use 18 or 20)
- Verify all dependencies are in package.json
- Check build logs in Netlify dashboard

#### API Calls Fail
- Verify environment variables are set
- Check CORS settings on your backend
- Ensure backend URL is correct

#### Routing Issues
- Verify netlify.toml redirect rules
- Check that all routes redirect to index.html

### Post-Deployment

1. **Test All Features**
   - ✅ User registration/login
   - ✅ Resume builder
   - ✅ Template selection
   - ✅ ATS checker
   - ✅ File uploads

2. **Monitor Performance**
   - Check Netlify analytics
   - Monitor build times
   - Watch for errors

3. **Set up Continuous Deployment**
   - Every push to main branch auto-deploys
   - Preview deployments for pull requests

### Support

- 📚 [Netlify Documentation](https://docs.netlify.com/)
- 🆘 [Netlify Community](https://community.netlify.com/)
- 💬 [Netlify Support](https://www.netlify.com/support/)

---

**Your AI Resume Builder will be live at: `https://your-site-name.netlify.app`** 🎉
