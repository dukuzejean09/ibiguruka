# Cloud Deployment Guide

This guide shows how to deploy the backend to cloud services that will pull images from GitHub Container Registry (GHCR).

## Prerequisites

✅ GitHub Actions has built and pushed images to GHCR
✅ Check status: https://github.com/dukuzejean09/ibiguruka/actions

---

## Option 1: Deploy to Railway (Recommended - Easiest)

**Railway** can pull directly from GHCR and run your containers.

### Steps:

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `dukuzejean09/ibiguruka`
5. Railway will:
   - Detect `railway.yml`
   - Pull images from GHCR
   - Deploy all services (MongoDB, API, Clustering)
6. **Set Environment Variables**:
   - `SECRET_KEY` = (Railway will generate)
   - `MONGODB_URL` = (Railway will auto-configure)
7. **Deploy** - Takes ~3 minutes
8. **Copy API URL** (e.g., `https://neighborwatch-api.railway.app`)

### Update Frontend:

Update Vercel environment variable:

- Variable: `VITE_API_URL`
- Value: Your Railway API URL

---

## Option 2: Deploy to Render

**Render** also supports pulling from GHCR.

### Steps:

1. **Go to Render**: https://render.com
2. **Sign up/Login** with GitHub
3. **New** → **Blueprint**
4. **Connect**: `dukuzejean09/ibiguruka`
5. Render will detect `render.yaml`
6. **Add MongoDB**:
   - Internal Database (recommended)
   - Or use MongoDB Atlas
7. **Deploy** - Takes ~5 minutes
8. **Copy API URL**

---

## Option 3: Google Cloud Run (Advanced)

Pulls images directly from GHCR.

```bash
# Deploy API
gcloud run deploy neighborwatch-api \
  --image ghcr.io/dukuzejean09/neighborwatch-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy Clustering
gcloud run deploy neighborwatch-clustering \
  --image ghcr.io/dukuzejean09/neighborwatch-clustering:latest \
  --platform managed \
  --region us-central1
```

---

## After Deployment

### 1. Initialize Database

Run this once to create admin user:

```bash
# Railway/Render MongoDB shell
mongosh "your-mongodb-connection-string"

# Then paste:
db = db.getSiblingDB("neighborwatch");
db.users.insertOne({
  email: "admin@neighborwatch.rw",
  password_hash: "$2b$12$SMO1gqdAOjhPnQVWWHcnYO3gb2LpnN9ft86MvThnO5ljQMhp2IgOu",
  full_name: "System Administrator",
  name: "System Administrator",
  phone: "+250788000000",
  role: "admin",
  verified: true,
  blocked: false,
  role_approved: true,
  created_at: new Date()
});
```

### 2. Update Frontend Environment

In Vercel:

1. Go to Project Settings → Environment Variables
2. Add/Update: `VITE_API_URL` = `https://your-api-url.com`
3. Redeploy frontend

---

## Current Status

- ✅ **Frontend**: https://ibiguruka.vercel.app
- ⏳ **Backend**: Deploy using steps above
- ✅ **Images**: Available on GHCR (after GitHub Actions completes)

---

## Cost

- **Railway**: $5/month (includes all services)
- **Render**: Free tier available (with limitations)
- **Google Cloud Run**: Pay per request (~$1-5/month for low traffic)

---

## No Local Docker Required!

Everything runs in the cloud:

- ✅ Images stored in GHCR
- ✅ Frontend on Vercel
- ✅ Backend on Railway/Render/Cloud Run
- ❌ No local containers needed
