# Running NeighborWatch Connect Locally with Docker

This guide explains how to run the complete NeighborWatch Connect application on your local machine using Docker.

## Prerequisites

- Docker Desktop installed and running
- Git installed
- At least 4GB of free RAM
- Ports 3000, 8000, and 27017 available

## Quick Start (3 Steps)

### 1. Make sure Docker Desktop is running

Check by running:

```powershell
docker --version
```

### 2. Start the application

**Option A: Using the startup script (Recommended)**

```powershell
.\start-local.ps1
```

**Option B: Manual start**

```powershell
docker-compose up -d
```

### 3. Wait for services to start (2-5 minutes on first run)

Check status:

```powershell
docker-compose ps
```

When ready, all containers should show "Up":

- `neighborwatch-mongodb`
- `neighborwatch-api`
- `neighborwatch-clustering`
- `neighborwatch-frontend`

## Access the Application

Once all containers are running:

| Service               | URL                          | Description                    |
| --------------------- | ---------------------------- | ------------------------------ |
| **Frontend**          | http://localhost:3000        | Main web application           |
| **API Documentation** | http://localhost:8000/docs   | Interactive API docs (Swagger) |
| **API Health**        | http://localhost:8000/health | Check API status               |
| **MongoDB**           | localhost:27017              | Database (internal)            |

## Default Credentials

### Admin Account

- **Email**: `admin@neighborwatch.rw`
- **Password**: `admin@123A`
- **Login at**: http://localhost:3000/admin-login

The admin account is automatically created when the API starts for the first time.

## Usage

### 1. As a Citizen

- Go to: http://localhost:3000
- Click "Continue Anonymously" or "Create new account"
- Submit incident reports
- View community safety map

### 2. As a Police Officer

- Go to: http://localhost:3000/police-login
- Click "Register" to create an account
- Access dashboard with live reports and clusters
- Chat with citizens and broadcast alerts

### 3. As an Administrator

- Go to: http://localhost:3000/admin-login
- Login with default credentials above
- Manage users and view analytics

## Common Commands

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f clustering
docker-compose logs -f frontend
```

### Stop the Application

```powershell
docker-compose down
```

### Restart a Service

```powershell
docker-compose restart api
docker-compose restart clustering
```

### Rebuild Containers

```powershell
docker-compose up -d --build
```

### Clean Everything (including data)

```powershell
docker-compose down -v
```

## Troubleshooting

### Problem: "Cannot connect" or "Port already in use"

**Solution**: Check if ports are available

```powershell
netstat -an | Select-String "3000|8000|27017"
```

If a port is in use, stop the conflicting service or change the port in `docker-compose.yml`.

### Problem: Containers keep restarting

**Solution**: Check the logs

```powershell
docker-compose logs api
```

Common issues:

- MongoDB not ready yet (wait 30 seconds)
- Missing environment variables (check `.env` files)

### Problem: "No connection to MongoDB"

**Solution**: Restart MongoDB container

```powershell
docker-compose restart mongodb
```

Wait 10 seconds, then restart API:

```powershell
docker-compose restart api clustering
```

### Problem: Build takes too long or fails

**Solution**: Increase Docker resources

1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase Memory to at least 4GB
4. Increase CPUs to at least 2
5. Click "Apply & Restart"

Then rebuild:

```powershell
docker-compose down
docker-compose up -d --build
```

### Problem: Frontend shows "Cannot connect to API"

**Solution**: Update API URL

1. Create/edit `frontend/.env`:

```
VITE_API_URL=http://localhost:8000/api
```

2. Rebuild frontend:

```powershell
docker-compose up -d --build frontend
```

## Initializing/Resetting Database

To reset the database and remove all data except the default admin:

```powershell
# Make sure containers are running
docker-compose up -d

# Run the initialization script
docker exec -it neighborwatch-api python init_db.py
# Type 'yes' when prompted
```

This will:

- Delete all users (except default admin)
- Delete all reports, chats, alerts, clusters
- Create database indexes

## Development Workflow

### Making Code Changes

**Backend (API) changes:**

```powershell
# After editing files in api/
docker-compose restart api
# or rebuild:
docker-compose up -d --build api
```

**Frontend changes:**

```powershell
# After editing files in frontend/
docker-compose up -d --build frontend
```

**Clustering service changes:**

```powershell
# After editing files in backend/clustering/
docker-compose restart clustering
# or rebuild:
docker-compose up -d --build clustering
```

### Hot Reload (Development Mode)

For faster development without Docker rebuilds:

**API (with hot reload):**

```powershell
# Install dependencies
cd api
pip install -r requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (with hot reload):**

```powershell
# Install dependencies
cd frontend
npm install

# Run dev server
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Host                          │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │     API      │  │  Clustering  │  │
│  │   (Nginx)    │  │  (FastAPI)   │  │  (Python)    │  │
│  │  Port 3000   │  │  Port 8000   │  │  Background  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         │                 └────────┬─────────┘          │
│         │                          │                    │
│         │          ┌───────────────▼──────────┐         │
│         │          │      MongoDB             │         │
│         │          │      Port 27017          │         │
│         │          └──────────────────────────┘         │
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │
          ▼
   http://localhost:3000
```

## Services Explained

### 1. Frontend (Port 3000)

- React 18 application
- Tailwind CSS styling
- Nginx web server
- Serves citizen, police, and admin interfaces

### 2. API (Port 8000)

- FastAPI Python backend
- JWT authentication
- REST API endpoints
- Connects to MongoDB
- Auto-creates default admin user on startup

### 3. Clustering Service

- Runs DBSCAN algorithm every 30 minutes
- Processes last 24 hours of reports
- Updates MongoDB with cluster data
- No external ports (internal service)

### 4. MongoDB (Port 27017)

- NoSQL database
- Stores users, reports, clusters, chats, alerts
- Persistent data volume: `mongodb_data`

## Data Persistence

Data is stored in Docker volumes:

- `mongodb_data`: All database data

To keep your data between restarts, use:

```powershell
docker-compose down  # Stops containers but keeps data
```

To remove all data:

```powershell
docker-compose down -v  # Stops containers and deletes data
```

## Performance Tips

1. **Allocate enough resources** - At least 4GB RAM, 2 CPUs in Docker settings
2. **Close unnecessary apps** - Free up system resources
3. **Use SSD** - Faster disk I/O improves Docker performance
4. **First build is slow** - Subsequent starts are much faster (cached layers)

## Next Steps

- **Create users** - Register police officers and citizens
- **Submit test reports** - Create 5-10 reports in nearby locations
- **Wait for clustering** - Service runs every 30 minutes
- **View clusters** - Login as police to see hotspots
- **Test chat** - Try two-way communication
- **Admin panel** - Manage users and view stats

## Support

For issues:

1. Check the logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Rebuild: `docker-compose up -d --build`
4. Clean start: `docker-compose down -v && docker-compose up -d`

---

**Ready to deploy?** See `README.md` for production deployment instructions.
