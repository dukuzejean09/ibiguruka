# Docker Hub Cloud Deployment Setup

This guide shows how to use Docker Hub to host your images and deploy to cloud services.

## Step 1: Setup Docker Hub

### 1.1 Create Docker Hub Account

1. Go to https://hub.docker.com
2. Sign up for free account
3. Create a repository (optional, workflow will auto-create)

### 1.2 Add Docker Hub Credentials to GitHub

1. Go to: https://github.com/dukuzejean09/ibiguruka/settings/secrets/actions
2. Click **"New repository secret"**
3. Add two secrets:
   - Name: `DOCKER_USERNAME`
     Value: Your Docker Hub username
   - Name: `DOCKER_PASSWORD`
     Value: Your Docker Hub password or access token

## Step 2: Enable Docker Hub Workflow

The workflow file is already created at `.github/workflows/dockerhub-publish.yml`

Once you push, GitHub Actions will automatically:

- Build Docker images
- Push to Docker Hub (public registry)
- Tag with `latest` and commit SHA

## Step 3: Deploy to Cloud Services

Now that images are on Docker Hub, deploy to any of these services:

### Option A: Railway (Recommended)

1. Go to https://railway.app
2. New Project → Empty Project
3. Add MongoDB Database
4. Add Service → Docker Image:
   - Image: `yourusername/neighborwatch-api:latest`
   - Port: 8000
   - Environment variables:
     - `MONGODB_URL`: (from Railway MongoDB)
     - `SECRET_KEY`: (generate random)
5. Add Another Service:
   - Image: `yourusername/neighborwatch-clustering:latest`
   - Environment variables: Same as above

### Option B: Render

1. Go to https://render.com
2. New → Web Service
3. Deploy an existing image
4. Image URL: `docker.io/yourusername/neighborwatch-api:latest`
5. Repeat for clustering service

### Option C: AWS ECS (Elastic Container Service)

Uses Docker Hub images directly:

```bash
aws ecs create-service \
  --cluster neighborwatch \
  --service-name api \
  --task-definition neighborwatch-api \
  --desired-count 1
```

### Option D: Digital Ocean App Platform

1. Create new app from Docker Hub
2. Image: `yourusername/neighborwatch-api:latest`
3. Auto-deploys on image updates

### Option E: Fly.io

```bash
fly launch --image yourusername/neighborwatch-api:latest
```

## Step 4: Auto-Update Setup

Most platforms can auto-pull new images from Docker Hub when you push to GitHub:

1. **Railway**: Enable "Auto-deploy" in service settings
2. **Render**: Enable "Auto-deploy" from Docker Hub
3. **AWS**: Use ECS with image tag tracking
4. **Fly.io**: Use `fly deploy --image`

## Advantages of Docker Hub

✅ **Public & Free**: Unlimited public images
✅ **Fast**: Faster pulls than GHCR in most regions
✅ **Compatible**: Works with all cloud providers
✅ **Simple**: Easy to browse and manage images
✅ **No Authentication**: Public images don't need login

## Your Workflow

1. Make code changes
2. Push to GitHub
3. GitHub Actions builds & pushes to Docker Hub
4. Cloud service auto-deploys from Docker Hub
5. ✅ No local Docker needed!

## Current Setup

After you add Docker Hub credentials:

- ✅ **Frontend**: https://ibiguruka.vercel.app
- 🔄 **Images**: Will be on Docker Hub (public)
- ⏳ **Backend**: Deploy to Railway/Render (pulls from Docker Hub)

## Images Will Be Available At:

- `https://hub.docker.com/r/yourusername/neighborwatch-api`
- `https://hub.docker.com/r/yourusername/neighborwatch-clustering`
- `https://hub.docker.com/r/yourusername/neighborwatch-frontend`
