# Quick Start Guide

This guide will help you get NeighborWatch Connect running in under 5 minutes.

## Prerequisites

- Docker Desktop installed
- Git installed
- Internet connection

## 3-Step Quick Start

### Step 1: Clone and Configure

```powershell
# Clone the repository
git clone https://github.com/your-username/ibiguruka.git
cd ibiguruka

# Setup environment
Copy-Item api\.env.example api\.env
Copy-Item frontend\.env.example frontend\.env

# Generate a secret key and update api/.env
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy the output and replace SECRET_KEY in api/.env
```

### Step 2: Start the Application

```powershell
docker-compose up -d
```

Wait 2-3 minutes for all services to start.

### Step 3: Create Admin User

```powershell
# Open MongoDB shell
docker exec -it neighborwatch-mongodb mongosh

# Run these commands:
use neighborwatch
db.users.insertOne({
  email: "admin@police.rw",
  name: "Admin",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIBY.5QXxq",
  role: "admin",
  verified: true,
  blocked: false,
  created_at: new Date()
})
exit
```

Password: `admin123`

## Access the Application

- **Frontend:** http://localhost:3000
- **Login as Admin:** admin@police.rw / admin123
- **API Docs:** http://localhost:8000/docs

## What's Next?

1. **Create Police Officer Account:**

   - Go to http://localhost:3000/admin-login
   - Click "Create new account"
   - Or use API to create officer account

2. **Test Citizen Reporting:**

   - Open http://localhost:3000
   - Click "Continue Anonymously"
   - Submit a test report

3. **View Police Dashboard:**

   - Login as officer
   - Check the live map and reports

4. **Wait for Clustering:**
   - The DBSCAN service runs every 10 minutes
   - Submit multiple nearby reports to see clusters form

## Troubleshooting

**Containers not starting?**

```powershell
docker-compose logs
```

**Port already in use?**

```powershell
# Change ports in docker-compose.yml
# For example, change 3000:80 to 8080:80
```

**Can't connect to MongoDB?**

```powershell
docker-compose restart mongodb
```

## Demo Flow

### As a Citizen:

1. Go to http://localhost:3000
2. Click "Continue Anonymously"
3. Click "Report" in the navigation
4. Fill out the report form
5. Use the voice button for Kinyarwanda input (if supported by browser)
6. Click on the map to set location
7. Submit the report

### As Police:

1. Go to http://localhost:3000/admin-login
2. Login with officer credentials
3. View the dashboard with live reports
4. Click on map markers to see details
5. Go to "Broadcast" to send an alert
6. Go to "Chat" to communicate with citizens

### As Admin:

1. Login with admin credentials
2. Go to Admin Panel
3. Navigate to "Users"
4. Create/edit/delete users
5. Change user roles

## Sample Data

To quickly populate the system with test data:

```powershell
# Connect to MongoDB
docker exec -it neighborwatch-mongodb mongosh

# Run this script
use neighborwatch
db.reports.insertMany([
  {
    category: "Theft",
    description: "Suspicious person near KG 5 Avenue",
    location: {lat: -1.9441, lng: 30.0619},
    userId: "anonymous",
    timestamp: new Date(),
    status: "new",
    credibilityScore: 0.7,
    flagged: false
  },
  {
    category: "Vandalism",
    description: "Graffiti on public property",
    location: {lat: -1.9451, lng: 30.0629},
    userId: "anonymous",
    timestamp: new Date(),
    status: "new",
    credibilityScore: 0.6,
    flagged: false
  },
  {
    category: "Accident",
    description: "Minor vehicle collision",
    location: {lat: -1.9461, lng: 30.0639},
    userId: "anonymous",
    timestamp: new Date(),
    status: "new",
    credibilityScore: 0.9,
    flagged: false
  }
])

# Verify
db.reports.countDocuments()
exit
```

Then manually trigger clustering:

```powershell
# Using curl or Postman
curl -X POST http://localhost:8000/api/clusters/refresh
```

## Stopping

```powershell
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove everything including data
docker-compose down -v
```

## Getting Help

- Check the full [README.md](README.md) for detailed documentation
- See [INSTALLATION.md](INSTALLATION.md) for complete installation guide
- View API docs: http://localhost:8000/docs
- Check logs: `docker-compose logs -f`

---

**You're all set! Start exploring the platform. 🚀**
