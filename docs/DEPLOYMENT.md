# Deployment Guide

This guide walks through deploying the Student Learning Platform to production.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│     Render      │────▶│    Supabase     │
│   (Frontend)    │     │    (Backend)    │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Redis (Upstash │
                        │  or Render)     │
                        └─────────────────┘
```

---

## Prerequisites

Before deploying, ensure you have:

1. **Supabase Account** - Database and authentication
2. **Vercel Account** - Frontend hosting (free tier works)
3. **Render Account** - Backend hosting (free tier works, but paid recommended for workers)
4. **OpenAI API Key** - For video/content generation
5. **Redis** - Upstash (free tier) or Render Redis

---

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project credentials:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: Found in Settings > API
   - **Service Role Key**: Found in Settings > API (keep secret!)

### 1.2 Run Database Schema

1. Go to SQL Editor in Supabase Dashboard
2. Run the contents of `backend/scripts/schema.sql`
3. Run `backend/scripts/add-google-oauth.sql` for Google OAuth support
4. Optionally run `backend/scripts/seed-videos.sql` for sample data

### 1.3 Configure Google OAuth (Optional)

1. Go to Authentication > Providers > Google
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID: `your-google-client-id`
   - Client Secret: `your-google-client-secret`
4. Set Site URL to your frontend URL (e.g., `https://your-app.vercel.app`)
5. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

---

## Step 2: Redis Setup (Upstash)

Upstash provides a free Redis instance that works well with the job queue.

### 2.1 Create Upstash Redis

1. Go to [upstash.com](https://upstash.com) and create an account
2. Create a new Redis database
3. Select a region close to your backend server
4. Copy the **Redis URL** (starts with `rediss://`)

### Alternative: Render Redis

If using Render for backend, you can create a Redis instance there:
1. In Render Dashboard, click "New" > "Redis"
2. Select region and plan
3. Copy the internal Redis URL

---

## Step 3: Backend Deployment (Render)

### 3.1 Create Web Service

1. Go to [render.com](https://render.com) and create an account
2. Click "New" > "Web Service"
3. Connect your GitHub repository
4. Configure the service:

   ```
   Name: student-platform-api
   Region: Oregon (or closest to your users)
   Branch: main (or master)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

### 3.2 Environment Variables

Add these environment variables in Render:

```bash
# Server
NODE_ENV=production
PORT=10000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-secure-random-string-at-least-32-chars

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# Redis (from Upstash)
REDIS_URL=rediss://default:password@your-instance.upstash.io:6379

# AI APIs
OPENAI_API_KEY=sk-your-openai-key

# Video rendering (set to false for faster deployment, true for full features)
ENABLE_VIDEO_RENDERING=false
```

### 3.3 Create Background Worker (Required for Video/Review Jobs)

1. Click "New" > "Background Worker"
2. Connect the same repository
3. Configure:

   ```
   Name: student-platform-worker
   Region: Same as web service
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm run worker
   ```

4. Add the same environment variables as the web service

### 3.4 Python Dependencies (For gitingest)

If using code review features with gitingest:

1. Create a `render.yaml` in your repo root:

```yaml
services:
  - type: web
    name: student-platform-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production

  - type: worker
    name: student-platform-worker
    env: node
    buildCommand: |
      npm install
      pip install gitingest
    startCommand: npm run worker
```

Or add a custom build script that installs Python packages.

---

## Step 4: Frontend Deployment (Vercel)

### 4.1 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and create an account
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure:

   ```
   Framework Preset: Vite
   Root Directory: student-learning-platform
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

### 4.2 Environment Variables

Add these in Vercel project settings:

```bash
VITE_API_URL=https://your-api.onrender.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4.3 Deploy

1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Note your production URL (e.g., `https://your-app.vercel.app`)

---

## Step 5: Post-Deployment Configuration

### 5.1 Update CORS

After deploying frontend, update the backend `FRONTEND_URL` environment variable:

```bash
FRONTEND_URL=https://your-app.vercel.app
```

Trigger a redeploy of the backend for changes to take effect.

### 5.2 Update Supabase Redirect URLs

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your production URLs:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 5.3 Verify Deployment

1. **Health Check**: Visit `https://your-api.onrender.com/health`
2. **Frontend**: Visit your Vercel URL
3. **Test Auth**: Try signing up and logging in
4. **Test Features**: Create a video, review a repo, bookmark videos

---

## Troubleshooting

### Backend won't start

- Check Render logs for errors
- Verify all environment variables are set
- Ensure database schema is properly created

### Redis connection errors

- Verify REDIS_URL is correct
- For Upstash, ensure using `rediss://` (with TLS)
- Check Redis dashboard for connection limits

### CORS errors

- Verify FRONTEND_URL matches exactly (no trailing slash)
- Clear browser cache and try again

### Google OAuth not working

1. Check Supabase Google provider is enabled
2. Verify Google OAuth credentials are correct
3. Ensure redirect URLs are properly configured
4. Check browser console for errors

### Video generation fails

- Verify OPENAI_API_KEY is valid
- Check worker logs for errors
- Ensure Redis is connected

### Code review fails

- Verify gitingest is installed on worker
- Check Python is available: `which python`
- Review worker logs for specific errors

---

## Cost Estimates

### Free Tier Deployment

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free | $0/mo |
| Render Web | Free | $0/mo |
| Render Worker | Free (750 hrs) | $0/mo |
| Upstash Redis | Free | $0/mo |
| Vercel | Hobby | $0/mo |
| **Total** | | **$0/mo** |

**Limitations of free tier:**
- Render free services spin down after 15 min inactivity
- Limited compute hours
- Cold starts can take 30-60 seconds

### Recommended Production Setup

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro | $25/mo |
| Render Web | Starter | $7/mo |
| Render Worker | Starter | $7/mo |
| Upstash Redis | Pay-as-you-go | ~$1/mo |
| Vercel | Pro | $20/mo |
| **Total** | | **~$60/mo** |

---

## Scaling Considerations

### For Higher Traffic

1. **Upgrade Render plans** for more compute
2. **Add multiple workers** for parallel job processing
3. **Upgrade Supabase** for more database connections
4. **Use Vercel Edge** for global CDN caching

### For Better Performance

1. Set `ENABLE_VIDEO_RENDERING=true` and install Manim dependencies
2. Use dedicated Redis instance
3. Consider containerized deployment (Docker) for more control

---

## Security Checklist

- [ ] All API keys stored as environment variables
- [ ] JWT_SECRET is unique and secure (32+ characters)
- [ ] Service role key never exposed to frontend
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured for specific frontend URL
- [ ] Rate limiting enabled on API
- [ ] Input validation on all endpoints

---

## Monitoring

### Recommended Tools

- **Render**: Built-in logs and metrics
- **Vercel**: Analytics dashboard
- **Supabase**: Database monitoring
- **Upstash**: Redis usage dashboard

### Health Endpoints

- Backend: `GET /health` - Returns server status
- Database: Check Supabase dashboard for connection metrics

---

## Continuous Deployment

Both Vercel and Render support automatic deployments:

1. Push to `main` branch
2. Both services detect changes automatically
3. Build and deploy new version
4. Zero-downtime deployments (on paid plans)

For manual deployments, use the respective dashboards to trigger builds.
