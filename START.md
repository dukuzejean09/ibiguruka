# 🚀 Quick Start Guide - Access Your Application

## Your Docker Images Are Published! 🎉

Your application has been successfully built and deployed to GitHub Container Registry (GHCR).

**Your images:**
- `ghcr.io/dukuzejean09/neighborwatch-frontend:latest`
- `ghcr.io/dukuzejean09/neighborwatch-api:latest`
- `ghcr.io/dukuzejean09/neighborwatch-clustering:latest`

View them at: https://github.com/dukuzejean09?tab=packages

---

## 🌐 Access Your Application

### Option 1: Run from GHCR Images (Recommended)

```powershell
# Pull and run the latest images from GitHub
docker-compose -f docker-compose.ghcr.yml up -d

# Wait about 30 seconds for everything to start
Start-Sleep -Seconds 30

# Access the application
start http://localhost:3000
```

**Access URLs:**
- 🌐 **Frontend (Main App)**: http://localhost:3000
- 🔧 **API Documentation**: http://localhost:8000/docs
- 🗄️ **MongoDB**: localhost:27017

---

### Option 2: Build and Run Locally

```powershell
# Build from source
docker-compose up -d

# Access the application
start http://localhost:3000
```

---

## 📱 Application Pages

### 1. **Citizen Portal** (http://localhost:3000)

**Anonymous Access:**
- Click "Continue Anonymously" on the home page
- Submit incident reports without registration
- View heat map of incidents
- Receive alerts

**Registered Users:**
- Click "Login" → "Register" to create account
- All anonymous features PLUS:
  - Chat with police officers
  - Track your reports
  - Update profile
  - Receive personalized alerts

**Available Pages:**
- `/` - Home with heat map
- `/report` - Submit incident report (with voice input)
- `/alerts` - View safety alerts
- `/chat` - Two-way chat with police
- `/profile` - User profile and settings

---

### 2. **Police Dashboard** (http://localhost:3000/police/login)

**Login:**
- You need to create a police officer account first (see below)

**Features:**
- Live incident map with clusters
- DBSCAN hotspot visualization
- Reports management (update status, assign officers)
- Broadcast alerts to citizens
- Chat with citizens
- Analytics dashboard

**Available Pages:**
- `/police/dashboard` - Main monitoring dashboard
- `/police/reports` - All reports with filters
- `/police/clusters` - Hotspot clusters view
- `/police/broadcast` - Send alerts
- `/police/chat` - Respond to citizens

---

### 3. **Admin Panel** (http://localhost:3000/admin/login)

**Login:**
- You need to create an admin account first (see below)

**Features:**
- User management (view, edit, delete, block)
- Police officer management
- System statistics
- Platform settings

**Available Pages:**
- `/admin/dashboard` - Overview and stats
- `/admin/users` - Manage all users
- `/admin/users/:id` - User details
- `/admin/settings` - System configuration

---

## 👥 Create Initial Users

### Method 1: Using API (Recommended)

**Create Admin Account:**
```powershell
# Create admin user
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@neighborwatch.rw",
    "password": "Admin@123",
    "phone": "+250788000001",
    "full_name": "System Administrator",
    "role": "admin"
  }'
```

**Create Police Officer:**
```powershell
# Create police user
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "officer@police.gov.rw",
    "password": "Police@123",
    "phone": "+250788000002",
    "full_name": "Police Officer",
    "badge_number": "PO-12345",
    "role": "police"
  }'
```

**Create Citizen:**
```powershell
# Create citizen user
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "citizen@example.com",
    "password": "Citizen@123",
    "phone": "+250788000003",
    "full_name": "John Doe",
    "role": "citizen"
  }'
```

### Method 2: Using API Documentation

1. Open http://localhost:8000/docs
2. Expand `POST /api/auth/register`
3. Click "Try it out"
4. Fill in the user details
5. Click "Execute"

### Method 3: Using MongoDB Shell

```powershell
# Connect to MongoDB
docker exec -it neighborwatch-mongodb mongosh

# Use the database
use neighborwatch

# Create admin user (password: Admin@123 hashed)
db.users.insertOne({
  email: "admin@neighborwatch.rw",
  hashed_password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJfitzGri",
  full_name: "System Administrator",
  phone: "+250788000001",
  role: "admin",
  is_verified: true,
  is_active: true,
  created_at: new Date()
})

# Exit
exit
```

---

## 🧪 Test the Complete System

### Step 1: Submit Reports as Citizen
```powershell
start http://localhost:3000
# 1. Click "Continue Anonymously"
# 2. Click "Report Incident"
# 3. Fill in details (select location on map)
# 4. Submit 5-10 reports in nearby locations
```

### Step 2: Wait for Clustering
```
The clustering service runs every 10 minutes.
Wait for clusters to appear on the map.
```

### Step 3: View as Police Officer
```powershell
start http://localhost:3000/police/login
# Login with police credentials
# View dashboard with clusters
# Click on clusters to see grouped reports
```

### Step 4: Broadcast Alert
```
1. Go to Police Dashboard → Broadcast Alert
2. Create an alert message
3. Select affected area on map
4. Send alert
```

### Step 5: Admin Management
```powershell
start http://localhost:3000/admin/login
# Login with admin credentials
# View all users
# Check statistics
```

---

## 📊 Check System Status

```powershell
# View running containers
docker ps

# Check logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f api
docker-compose logs -f clustering
docker-compose logs -f frontend

# Stop everything
docker-compose down

# Stop and remove data
docker-compose down -v
```

---

## 🔧 Troubleshooting

### Containers not starting?
```powershell
# Check Docker is running
docker --version

# Restart Docker Desktop and try again
docker-compose -f docker-compose.ghcr.yml up -d
```

### Can't access the pages?
```powershell
# Check if ports are available
netstat -an | Select-String "3000|8000|27017"

# If ports are in use, stop other services or change ports in docker-compose.yml
```

### API not responding?
```powershell
# Check API logs
docker logs neighborwatch-api

# Restart API container
docker restart neighborwatch-api
```

### No clusters appearing?
```powershell
# Check clustering service logs
docker logs neighborwatch-clustering

# Manually trigger clustering
curl -X POST http://localhost:8000/api/clusters/refresh
```

---

## 🌍 Deploy to Production

Your Docker images are ready for deployment to any cloud provider:

### Deploy to:
- **AWS** (ECS, EC2, App Runner)
- **Azure** (Container Instances, AKS)
- **Google Cloud** (Cloud Run, GKE)
- **DigitalOcean** (App Platform, Droplets)
- **Heroku** (Container Registry)

### Production Checklist:
- [ ] Set strong `SECRET_KEY` environment variable
- [ ] Use MongoDB Atlas (cloud database)
- [ ] Set `DEBUG=False` in API
- [ ] Configure custom domain
- [ ] Enable SSL/HTTPS
- [ ] Set up monitoring
- [ ] Configure backups

---

## 📚 More Information

- **Full Documentation**: See README.md
- **Installation Guide**: See INSTALLATION.md
- **API Documentation**: http://localhost:8000/docs
- **GitHub Repository**: https://github.com/dukuzejean09/ibiguruka
- **Docker Images**: https://github.com/dukuzejean09?tab=packages

---

## 🎓 For Your Project Presentation

**Demo Flow:**
1. Show citizen reporting an incident (with voice input)
2. Submit multiple reports in same area
3. Show police dashboard with DBSCAN clusters
4. Demonstrate chat functionality
5. Show admin panel managing users
6. Display heat map visualization

**Key Features to Highlight:**
- ✅ Real-time incident reporting
- ✅ DBSCAN clustering for hotspot detection
- ✅ Kinyarwanda voice input support
- ✅ Anonymous and authenticated modes
- ✅ Two-way citizen-police chat
- ✅ Role-based access (citizen, police, admin)
- ✅ Docker containerization
- ✅ CI/CD with GitHub Actions
- ✅ Published to GitHub Container Registry

---

**🎉 Your application is ready! Start with:**

```powershell
docker-compose -f docker-compose.ghcr.yml up -d
start http://localhost:3000
```

**Good luck with your project! 🚀**
