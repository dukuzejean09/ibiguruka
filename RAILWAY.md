# Railway Deployment Guide (Using GHCR)

This guide will help you deploy the NeighborWatch application to Railway using images from GitHub Container Registry (GHCR).

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. GHCR images built and pushed (via GitHub Actions)
3. Images available at:
   - `ghcr.io/dukuzejean09/neighborwatch-api:latest`
   - `ghcr.io/dukuzejean09/neighborwatch-clustering:latest`
   - `ghcr.io/dukuzejean09/neighborwatch-frontend:latest`

## Step 1: Create a New Railway Project

1. Go to https://railway.app/new
2. Click "Empty Project"
3. Name your project (e.g., "NeighborWatch")

## Step 2: Add MongoDB Database

1. In your Railway project, click "New" → "Database" → "Add MongoDB"
2. Wait for the database to deploy
3. Click on the MongoDB service
4. Go to the "Variables" tab
5. Find and copy the `MONGO_URL` variable (it starts with `mongodb://`)

## Step 3: Deploy API Service

1. Click "New" → "Empty Service"
2. Name it "api"
3. Go to "Settings" → "Deploy"
4. Under "Source", select "Docker Image"
5. Enter image: `ghcr.io/dukuzejean09/neighborwatch-api:latest`
6. Go to "Variables" tab and add:
   - `MONGODB_URL` = (paste the MongoDB URL from Step 2)
   - `DATABASE_NAME` = `neighborwatch`
   - `SECRET_KEY` = (generate a random string, e.g., using `openssl rand -hex 32`)
   - `DEBUG` = `False`
7. Go to "Settings" → "Networking"
8. Click "Generate Domain" to get a public URL
9. Copy the API URL (e.g., `https://api-production-xxxx.up.railway.app`)

## Step 4: Deploy Clustering Service

1. Click "New" → "Empty Service"
2. Name it "clustering"
3. Go to "Settings" → "Deploy"
4. Under "Source", select "Docker Image"
5. Enter image: `ghcr.io/dukuzejean09/neighborwatch-clustering:latest`
6. Go to "Variables" tab and add:
   - `MONGODB_URL` = (same MongoDB URL from Step 2)
   - `DATABASE_NAME` = `neighborwatch`
   - `API_URL` = (paste the API URL from Step 3)
7. This service doesn't need a public domain (it runs as a background worker)

## Step 5: Initialize Database with Admin User

Once the API service is running, you need to create the default admin user:

### Option A: Using Railway MongoDB Shell

1. Click on your MongoDB service
2. Click "Connect"
3. Copy the connection command
4. Run in your local terminal (requires `mongosh` installed):
   ```bash
   mongosh "your-mongodb-connection-string"
   ```
5. In the MongoDB shell, run:
   ```javascript
   use neighborwatch
   db.users.insertOne({
     email: "admin@neighborwatch.rw",
     password_hash: "$2b$12$SMO1gqdAOjhPnQVWWHcnYO3gb2LpnN9ft86MvThnO5ljQMhp2IgOu",
     name: "System Administrator",
     full_name: "System Administrator",
     phone: "+250788000000",
     role: "admin",
     verified: true,
     blocked: false,
     created_at: new Date()
   })
   ```

### Option B: Using the API Initialization

The API should automatically create the admin user on startup. Check the API logs:

1. Click on the "api" service
2. Go to "Logs" tab
3. Look for "Default admin user created" message

## Step 6: Update Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Select your "ibiguruka" project
3. Go to "Settings" → "Environment Variables"
4. Add or update:
   - `VITE_API_URL` = (your Railway API URL from Step 3)
5. Go to "Deployments" tab
6. Click the three dots on the latest deployment → "Redeploy"

## Step 7: Test Your Deployment

1. Visit your Vercel frontend: https://ibiguruka.vercel.app
2. Try logging in with admin credentials:
   - Email: `admin@neighborwatch.rw`
   - Password: `Admin123`
3. Test citizen registration
4. Test police registration request

## Accessing GHCR Images

Railway can pull images from GitHub Container Registry (GHCR) if they are public. Your GHCR images should be public by default when pushed via GitHub Actions.

If you encounter authentication issues:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Ensure `GHCR_TOKEN` is set with a valid Personal Access Token
3. Make sure packages are set to public visibility:
   - Go to https://github.com/users/dukuzejean09/packages
   - Click on each package (neighborwatch-api, neighborwatch-clustering, neighborwatch-frontend)
   - Go to "Package settings" → Change visibility to "Public"

## Environment Variables Reference

### API Service

- `MONGODB_URL`: MongoDB connection string from Railway
- `DATABASE_NAME`: `neighborwatch`
- `SECRET_KEY`: Random secret key for JWT tokens
- `DEBUG`: `False` for production

### Clustering Service

- `MONGODB_URL`: MongoDB connection string from Railway
- `DATABASE_NAME`: `neighborwatch`
- `API_URL`: URL of your Railway API service

### Frontend (Vercel)

- `VITE_API_URL`: URL of your Railway API service

## Monitoring and Logs

### View Logs

1. Click on any service in Railway
2. Go to "Logs" tab
3. Monitor real-time logs for errors

### View Metrics

1. Click on any service
2. Go to "Metrics" tab
3. Monitor CPU, memory, and network usage

## Troubleshooting

### API Service Won't Start

- Check logs for errors
- Verify `MONGODB_URL` is correct
- Ensure `SECRET_KEY` is set

### Clustering Service Issues

- Verify `API_URL` is correct and includes `https://`
- Check that API service is running first
- Review clustering logs for connection errors

### Frontend Can't Connect to Backend

- Verify `VITE_API_URL` in Vercel matches your Railway API URL
- Check CORS settings in the API
- Ensure API domain is publicly accessible

### Database Connection Errors

- Verify MongoDB service is running in Railway
- Check that `MONGODB_URL` includes the correct database name
- Ensure network connectivity between services

## Cost Considerations

Railway free tier includes:

- $5 of usage per month
- Multiple services can run on the free tier
- Monitor usage in Railway dashboard

If you exceed the free tier, Railway will automatically charge your payment method or pause services.

## Admin Credentials

Default admin user:

- **Email**: admin@neighborwatch.rw
- **Password**: Admin123

**Important**: Change the admin password after first login!

## Next Steps

After successful deployment:

1. Change admin password
2. Test all features (registration, reports, alerts, chat)
3. Monitor logs for any errors
4. Set up custom domains (optional)
5. Configure backup strategy for MongoDB

## Support

For issues with:

- Railway deployment: https://docs.railway.app
- GHCR access: https://docs.github.com/en/packages
- Application issues: Check service logs in Railway
