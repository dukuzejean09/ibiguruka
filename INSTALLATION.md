# Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** v2.0+
- **Git**
- At least 4GB RAM available
- 10GB free disk space

## Step-by-Step Installation

### 1. Clone the Repository

```powershell
# Using PowerShell on Windows
git clone https://github.com/your-username/ibiguruka.git
cd ibiguruka
```

### 2. Configure Environment Variables

#### Backend API Configuration

```powershell
# Copy example environment file
Copy-Item api\.env.example api\.env

# Edit the file (use notepad or your preferred editor)
notepad api\.env
```

Update the following values in `api/.env`:

```env
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=neighborwatch
SECRET_KEY=generate-a-strong-random-key-here-at-least-32-characters-long
DEBUG=True
```

**To generate a secure SECRET_KEY:**

```powershell
# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or use an online generator: https://randomkeygen.com/
```

#### Frontend Configuration

```powershell
Copy-Item frontend\.env.example frontend\.env
```

The default configuration should work, but you can customize:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Build and Start the Application

#### Option A: Build from source (Recommended for development)

```powershell
# Build all containers
docker-compose build

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Option B: Use pre-built images from GHCR

```powershell
# Update docker-compose.ghcr.yml with your GitHub username
# Then pull and run
docker-compose -f docker-compose.ghcr.yml pull
docker-compose -f docker-compose.ghcr.yml up -d
```

### 4. Verify Installation

Check that all containers are running:

```powershell
docker-compose ps
```

You should see 4 containers running:

- `neighborwatch-frontend` (port 3000)
- `neighborwatch-api` (port 8000)
- `neighborwatch-clustering` (background service)
- `neighborwatch-mongodb` (port 27017)

### 5. Access the Application

Open your browser and navigate to:

- **Frontend:** http://localhost:3000
- **API Documentation:** http://localhost:8000/docs
- **API Health Check:** http://localhost:8000/health

### 6. Create Initial Admin User

#### Method 1: Using the API (Swagger UI)

1. Go to http://localhost:8000/docs
2. Navigate to `POST /api/auth/register`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "email": "admin@police.rw",
     "password": "admin123",
     "name": "System Administrator"
   }
   ```
5. Execute

#### Method 2: Using curl

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@police.rw","password":"admin123","name":"System Administrator"}'
```

#### Method 3: Using MongoDB Compass (GUI)

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect to `mongodb://localhost:27017`
3. Navigate to `neighborwatch` database → `users` collection
4. Find your user and update the `role` field to `"admin"`

#### Method 4: Using MongoDB Shell

```powershell
# Connect to MongoDB container
docker exec -it neighborwatch-mongodb mongosh

# Switch to database
use neighborwatch

# Update user role to admin
db.users.updateOne(
  {email: "admin@police.rw"},
  {$set: {role: "admin", verified: true}}
)

# Exit
exit
```

### 7. Create Police Officer User

Follow the same process as admin, but set role to `"police"`:

```powershell
# Create user via API
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"officer@police.rw","password":"password123","name":"Police Officer"}'

# Then update role in MongoDB
docker exec -it neighborwatch-mongodb mongosh
use neighborwatch
db.users.updateOne(
  {email: "officer@police.rw"},
  {$set: {role: "police", verified: true}}
)
exit
```

## Troubleshooting

### Port Already in Use

If you get an error that a port is already in use:

```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F

# Or change the port in docker-compose.yml
```

### MongoDB Connection Issues

```powershell
# Check if MongoDB is running
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Frontend Not Loading

```powershell
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### API Errors

```powershell
# Check API logs
docker-compose logs api

# Restart API
docker-compose restart api

# Check if MongoDB is accessible from API
docker exec -it neighborwatch-api ping mongodb
```

### Clustering Service Not Running

```powershell
# Check clustering service logs
docker-compose logs clustering

# The service runs every 10 minutes, so it might appear idle
# Check if it's running:
docker-compose ps clustering
```

### Clear All Data and Start Fresh

```powershell
# Stop and remove all containers
docker-compose down

# Remove volumes (THIS WILL DELETE ALL DATA)
docker volume rm ibiguruka_mongodb_data

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

## Updating the Application

### Pull Latest Changes

```powershell
# Stop the application
docker-compose down

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Update from GHCR

```powershell
docker-compose -f docker-compose.ghcr.yml pull
docker-compose -f docker-compose.ghcr.yml up -d
```

## Stopping the Application

### Temporary Stop (keeps data)

```powershell
docker-compose stop
```

### Complete Shutdown (keeps data)

```powershell
docker-compose down
```

### Complete Removal (deletes data)

```powershell
docker-compose down -v
```

## Performance Optimization

### For Development

```yaml
# In docker-compose.yml, add volume mounts for hot reload:
services:
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules

  api:
    volumes:
      - ./api:/app
```

### For Production

- Set `DEBUG=False` in `api/.env`
- Use production MongoDB instance
- Enable gzip compression in nginx
- Set up SSL/TLS certificates
- Configure firewall rules
- Enable rate limiting

## Next Steps

After successful installation:

1. Login to the frontend (http://localhost:3000)
2. Test citizen report submission
3. Login as police officer to view dashboard
4. Login as admin to manage users
5. Wait 10 minutes for first clustering run
6. View the API documentation at http://localhost:8000/docs

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs: `docker-compose logs`
3. Open an issue on GitHub
4. Contact support team

---

**Installation complete! 🎉**
