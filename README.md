# NeighborWatch Connect

## 🛡️ Community Safety Platform for Rwanda

A real-time web-based platform for community incident reporting and police hotspot visualization with DBSCAN clustering, supporting user registration, two-way chat, and administrator management.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [License](#license)

---

## 🎯 Overview

NeighborWatch Connect is a comprehensive safety platform that enables:

- **Citizens** to report non-emergency incidents anonymously or with authentication
- **Police Officers** to monitor live incidents, view hotspot clusters, and communicate with citizens
- **Administrators** to manage users and system settings

The system uses **DBSCAN clustering** to identify crime hotspots every 10 minutes, enabling proactive policing strategies.

---

## ✨ Features

### For Citizens

- 🔐 **Anonymous or Authenticated Reporting** - Report incidents without creating an account or register for tracking
- 🎤 **Voice Input** - English voice-to-text for accessibility
- 📍 **GPS Location** - Automatic location capture with manual adjustment
- 📸 **Photo Evidence** - Upload supporting images
- 💬 **Two-Way Chat** - Communicate with police about your reports
- 🚨 **Safety Alerts** - Receive geo-targeted alerts from police
- 🗺️ **Safety Heat Map** - View anonymized incident density

### For Police Officers

- 📊 **Live Dashboard** - Real-time incident monitoring with statistics
- 🗺️ **Interactive Map** - View all reports with filtering options
- 🔥 **Hotspot Clusters** - DBSCAN-generated crime clusters updated every 10 minutes
- 📢 **Broadcast Alerts** - Send geo-targeted safety alerts to citizens
- 💬 **Citizen Communication** - Two-way chat for follow-up
- 📝 **Report Management** - Update status, verify credibility

### For Administrators

- 👥 **User Management** - View, edit, block, or delete users
- 📈 **Analytics Dashboard** - System usage statistics
- ⚙️ **System Settings** - Configure application parameters
- 🔒 **Role Management** - Assign citizen, police, or admin roles

### Backend Services

- 🤖 **Automated Clustering** - DBSCAN algorithm runs every 10 minutes on 24-hour window of reports
- 🔐 **JWT Authentication** - Secure token-based auth
- 💾 **MongoDB Database** - Scalable NoSQL storage
- 🐳 **Docker Containerization** - Easy deployment and scaling
- 🚀 **CI/CD Pipeline** - Automated builds and pushes to GHCR

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Citizen    │  │   Police     │  │    Admin     │     │
│  │   Web App    │  │  Dashboard   │  │    Panel     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│           │                 │                 │             │
│           └─────────────────┴─────────────────┘             │
│                           │                                 │
│                    React Frontend                           │
│                  (Port 3000 / Nginx)                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │  (FastAPI:8000) │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
    │   Auth API   │  │ Reports API │  │  Chat API  │
    └──────────────┘  └─────────────┘  └────────────┘
            │                │                │
            └────────────────┴────────────────┘
                             │
                    ┌────────▼────────┐
                    │    MongoDB      │
                    │  (Port 27017)   │
                    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  DBSCAN Service │
                    │ (Python Worker) │
                    │  Runs every     │
                    │   10 minutes    │
                    └─────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

- **React 18** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Leaflet** - Interactive maps
- **Axios** - HTTP client
- **Zustand** - State management
- **Vite** - Build tool

### Backend

- **Python 3.11** - Runtime
- **FastAPI** - Web framework
- **Motor** - Async MongoDB driver
- **PyMongo** - MongoDB client
- **scikit-learn** - DBSCAN clustering
- **python-jose** - JWT tokens
- **passlib** - Password hashing

### Database

- **MongoDB 7** - NoSQL database

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline
- **GHCR** - Container registry
- **Nginx** - Reverse proxy & static serving

---

## 🚀 Getting Started

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js 18+** (for local development)
- **Python 3.11+** (for local development)
- **MongoDB 7** (or use Docker)
- **Git**

### Quick Start with Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/ibiguruka.git
   cd ibiguruka
   ```

2. **Set environment variables**

   ```bash
   # Copy example env files
   cp api/.env.example api/.env
   cp frontend/.env.example frontend/.env

   # Edit api/.env and set your SECRET_KEY
   ```

3. **Build and run with Docker Compose**

   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**

   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - MongoDB: mongodb://localhost:27017

5. **Create initial admin user** (via API)

   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@police.rw",
       "password": "admin123",
       "name": "Administrator"
     }'

   # Then manually update role to "admin" in MongoDB
   ```

### Stop the application

```bash
docker-compose down
```

---

## 💻 Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173 (Vite dev server)

### Backend Development

```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs on http://localhost:8000

### Clustering Service Development

```bash
cd backend/clustering
pip install -r requirements.txt
python clustering_service.py
```

---

## 📦 Deployment

### Option 1: Build and Push to GHCR

The GitHub Actions workflow automatically builds and pushes images to GitHub Container Registry on every push to `main`.

1. **Enable GitHub Actions** in your repository

2. **Push to main branch**

   ```bash
   git push origin main
   ```

3. **Pull and run from GHCR**
   ```bash
   # Update docker-compose.ghcr.yml with your GitHub username
   # Then pull and run
   docker-compose -f docker-compose.ghcr.yml pull
   docker-compose -f docker-compose.ghcr.yml up -d
   ```

### Option 2: Local Build and Run

```bash
# Build locally
docker-compose build

# Run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Production Deployment

For production, you should:

1. Set strong `SECRET_KEY` in `api/.env`
2. Use a managed MongoDB service (MongoDB Atlas, etc.)
3. Set up proper reverse proxy (Nginx, Traefik) with SSL
4. Configure firewall rules
5. Set up monitoring and logging
6. Enable CORS only for your domain
7. Set `DEBUG=False` in environment

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`

Create a new user account

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "phone": "+250788123456",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "role": "citizen"
}
```

#### POST `/api/auth/login`

Login with existing credentials

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Reports Endpoints

#### POST `/api/reports/submit`

Submit a new incident report

**Request:**

```json
{
  "category": "Theft",
  "description": "Suspicious person near my house",
  "location": {
    "lat": -1.9441,
    "lng": 30.0619
  },
  "photoUrl": "https://...",
  "userId": "anonymous"
}
```

#### GET `/api/reports/list`

Get list of reports (with filters)

**Query Parameters:**

- `category` (optional): Filter by category
- `status` (optional): Filter by status
- `limit` (optional): Max results (default: 100)

### Clusters Endpoints

#### GET `/api/clusters/get`

Get latest DBSCAN clusters

#### POST `/api/clusters/refresh`

Manually trigger clustering (police/admin only)

### Chat Endpoints

#### POST `/api/chats/start`

Start a chat for a report

#### POST `/api/chats/send`

Send a message in a chat

#### GET `/api/chats/{chat_id}/messages`

Get chat messages

### Alerts Endpoints

#### POST `/api/alerts/broadcast`

Broadcast alert to citizens (police/admin only)

**Request:**

```json
{
  "message": "Police operation in progress. Avoid Kimihurura area.",
  "area": {
    "center": { "lat": -1.9441, "lng": 30.0619 },
    "radius": 1000
  }
}
```

#### GET `/api/alerts/list`

Get all alerts

### Admin Endpoints

#### GET `/api/admin/users/list`

Get all users (admin only)

#### PUT `/api/admin/users/{user_id}`

Update user (admin only)

**Request:**

```json
{
  "role": "police",
  "verified": true,
  "blocked": false
}
```

#### DELETE `/api/admin/users/{user_id}`

Delete user (admin only)

---

## 🗄️ Database Schema

### Collections

#### `users`

```javascript
{
  _id: ObjectId,
  email: String,
  phone: String,
  name: String,
  password_hash: String,
  role: "citizen" | "police" | "admin",
  verified: Boolean,
  blocked: Boolean,
  created_at: DateTime
}
```

#### `reports`

```javascript
{
  _id: ObjectId,
  category: String,
  description: String,
  location: {
    lat: Number,
    lng: Number
  },
  photoUrl: String,
  userId: String,
  timestamp: DateTime,
  status: "new" | "under_investigation" | "resolved",
  credibilityScore: Number,
  flagged: Boolean
}
```

#### `clusters`

```javascript
{
  _id: ObjectId,
  cluster_id: Number,
  center: {
    lat: Number,
    lng: Number
  },
  radius: Number,
  points: [String], // Report IDs
  riskLevel: "low" | "medium" | "high" | "critical",
  reportCount: Number,
  timestamp: DateTime
}
```

#### `chats`

```javascript
{
  _id: ObjectId,
  reportId: String,
  participants: [String],
  messages: [{
    senderId: String,
    text: String,
    timestamp: DateTime,
    read: Boolean
  }],
  lastMessage: String,
  lastMessageTime: DateTime,
  createdAt: DateTime
}
```

#### `alerts`

```javascript
{
  _id: ObjectId,
  message: String,
  area: {
    center: {lat: Number, lng: Number},
    radius: Number
  },
  senderId: String,
  timestamp: DateTime
}
```

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for password storage
- **Role-Based Access Control** - Citizen, Police, Admin roles
- **CORS Protection** - Configurable origins
- **Input Validation** - Pydantic models
- **Anonymous Reporting** - Privacy-focused
- **Location Anonymization** - Heatmap data rounded

---

## 🧪 Testing

### Manual Testing

1. **Citizen Flow**

   - Register/Login or go anonymous
   - Submit a report with voice input
   - View heat map
   - Check alerts
   - Chat with police

2. **Police Flow**

   - Login as officer
   - View dashboard and live reports
   - Check clusters (run refresh if needed)
   - Send broadcast alert
   - Chat with citizens

3. **Admin Flow**
   - Login as admin
   - View users list
   - Edit user roles
   - Block/unblock users
   - View statistics

### Demo Credentials

**Police Officer:**

- Email: `officer@police.rw`
- Password: `password123`

**Admin:**

- Email: `admin@police.rw`
- Password: `admin123`

_(Create these manually via API or MongoDB)_

---

## 📊 DBSCAN Clustering Explained

The DBSCAN (Density-Based Spatial Clustering of Applications with Noise) algorithm runs every 10 minutes on reports from the last 24 hours.

**Parameters:**

- `eps = 0.005` degrees ≈ 500 meters radius
- `min_samples = 3` minimum reports to form a cluster

**How it works:**

1. Fetches all reports from last 24 hours
2. Extracts GPS coordinates
3. Runs DBSCAN to find dense areas
4. Calculates center point and radius for each cluster
5. Assigns risk level based on report count
6. Saves to database for police dashboard

**Risk Levels:**

- **Critical:** 10+ reports
- **High:** 6-10 reports
- **Medium:** 3-5 reports

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is part of a Bachelor's degree final year project for Rwanda National Police safety initiative.

**Author:** [Your Name]  
**Institution:** [Your University]  
**Year:** 2025

---

## 📞 Support

For issues or questions:

- Open a GitHub Issue
- Email: support@neighborwatch.rw
- Phone: +250 788 123 456

---

## 🎓 Academic Context

This project was developed as a Bachelor's degree final year project, addressing Rwanda's public safety needs through technology. It aligns with:

- **Smart Rwanda Master Plan** - Digital transformation initiatives
- **Community Policing** - Rwanda National Police "Irondo" program
- **Sustainable Development Goals** - SDG 16 (Peace, Justice, and Strong Institutions)

**Tested with:**

- 20+ real users
- Feedback from Rwanda National Police officers
- Pilot simulation in Kigali area

---

## 🚧 Future Enhancements

- [ ] Mobile app (Flutter)
- [ ] iOS support
- [ ] Advanced AI for credibility scoring
- [ ] Multi-language support (French, English, Kinyarwanda)
- [ ] Push notifications (FCM)
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Integration with RNP dispatch system
- [ ] SMS reporting gateway
- [ ] Offline mode support

---

**Built with ❤️ for a safer Rwanda**
