# Project Structure

This document describes the organization of the NeighborWatch Connect codebase.

## Root Directory

```
ibiguruka/
├── frontend/              # React frontend application
├── api/                   # Python FastAPI backend
├── backend/               # Additional backend services
│   └── clustering/        # DBSCAN clustering service
├── .github/               # GitHub configuration
│   └── workflows/         # CI/CD workflows
├── docker-compose.yml     # Local development orchestration
├── docker-compose.ghcr.yml # Production with GHCR images
├── .gitignore            # Git ignore rules
├── README.md             # Main documentation
├── INSTALLATION.md       # Installation guide
├── QUICKSTART.md         # Quick start guide
├── CONTRIBUTING.md       # Contribution guidelines
├── CHANGELOG.md          # Version history
├── setup.ps1             # Windows setup script
└── setup.sh              # Linux/Mac setup script
```

## Frontend (`frontend/`)

React single-page application with routing and state management.

```
frontend/
├── src/
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   │   ├── LoginPage.jsx
│   │   │   └── AdminLoginPage.jsx
│   │   ├── citizen/      # Citizen-facing pages
│   │   │   ├── Home.jsx
│   │   │   ├── ReportIncident.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── Profile.jsx
│   │   ├── police/       # Police dashboard pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReportsManagement.jsx
│   │   │   ├── ClustersView.jsx
│   │   │   ├── BroadcastAlert.jsx
│   │   │   └── Chat.jsx
│   │   └── admin/        # Admin panel pages
│   │       ├── Dashboard.jsx
│   │       ├── UsersManagement.jsx
│   │       ├── UserDetails.jsx
│   │       └── Settings.jsx
│   ├── layouts/          # Layout components
│   │   ├── CitizenLayout.jsx
│   │   ├── PoliceLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── services/         # API clients and services
│   │   └── api.js        # Axios API client
│   ├── store/            # State management (Zustand)
│   │   └── authStore.js  # Authentication state
│   ├── App.jsx           # Main app component with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
├── postcss.config.js     # PostCSS config
├── Dockerfile            # Container image
├── nginx.conf            # Nginx configuration
├── .env.example          # Environment template
└── .dockerignore         # Docker ignore rules
```

### Key Frontend Files

- **`App.jsx`**: Main routing logic with role-based access control
- **`api.js`**: Centralized API client with interceptors
- **`authStore.js`**: Global authentication state
- **Layouts**: Reusable layout components with navigation
- **Pages**: Individual page components organized by role

## Backend API (`api/`)

FastAPI REST API with async MongoDB operations.

```
api/
├── app/
│   ├── routes/           # API endpoints
│   │   ├── auth.py       # Authentication (login, register)
│   │   ├── reports.py    # Incident reports CRUD
│   │   ├── clusters.py   # Clustering endpoints
│   │   ├── chats.py      # Chat messaging
│   │   ├── alerts.py     # Broadcast alerts
│   │   ├── admin.py      # User management
│   │   ├── heatmap.py    # Public heatmap data
│   │   └── __init__.py
│   ├── main.py           # FastAPI app initialization
│   ├── config.py         # Configuration settings
│   ├── database.py       # MongoDB connection
│   ├── models.py         # Pydantic data models
│   ├── auth.py           # JWT authentication utilities
│   └── __init__.py
├── requirements.txt      # Python dependencies
├── Dockerfile            # Container image
├── .env.example          # Environment template
└── .dockerignore         # Docker ignore rules
```

### Key Backend Files

- **`main.py`**: FastAPI app with CORS, lifespan events, router registration
- **`models.py`**: Pydantic models for request/response validation
- **`database.py`**: MongoDB client and collection getters
- **`auth.py`**: JWT token creation/validation, password hashing
- **`routes/*.py`**: API endpoints organized by feature

## Clustering Service (`backend/clustering/`)

Standalone Python service for DBSCAN clustering.

```
backend/clustering/
├── clustering_service.py  # Main service loop
├── dbscan.py             # Original clustering script
├── requirements.txt      # Python dependencies
└── Dockerfile            # Container image
```

### Clustering Flow

1. Connects to MongoDB
2. Fetches reports from last 24 hours
3. Runs DBSCAN with `eps=0.005`, `min_samples=3`
4. Calculates cluster centers and radii
5. Assigns risk levels based on report count
6. Saves clusters to database
7. Sleeps for 10 minutes and repeats

## GitHub Actions (`.github/workflows/`)

Automated CI/CD pipeline.

```
.github/
└── workflows/
    └── build-and-push.yml  # Build and push to GHCR
```

### Workflow Steps

1. Checkout code
2. Login to GHCR
3. Build Docker images for frontend, api, clustering
4. Push to `ghcr.io/username/neighborwatch-*`
5. Notify completion

## Docker Configuration

### `docker-compose.yml`

Local development setup with source code mounted for hot reload.

**Services:**

- `mongodb`: Database
- `api`: Backend API
- `clustering`: DBSCAN service
- `frontend`: React app with Nginx

### `docker-compose.ghcr.yml`

Production setup using pre-built images from GHCR.

## Data Flow

```
┌─────────────┐
│   Citizen   │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐    HTTP     ┌─────────────┐
│   React     │────────────▶│   FastAPI   │
│  Frontend   │◀────────────│     API     │
└─────────────┘             └──────┬──────┘
                                   │
                            ┌──────▼──────┐
                            │   MongoDB   │
                            └──────▲──────┘
                                   │
                            ┌──────┴──────┐
                            │  Clustering │
                            │   Service   │
                            └─────────────┘
```

1. **User Request**: Browser → React Frontend
2. **API Call**: Frontend → FastAPI Backend
3. **Data Storage**: Backend → MongoDB
4. **Clustering**: Service reads from MongoDB every 10 minutes
5. **Updates**: Clusters written back to MongoDB
6. **Dashboard**: Police view clusters via API

## Development Workflow

1. **Make changes** to source code
2. **Docker Compose** automatically rebuilds (if `volumes` mounted)
3. **Test locally** at http://localhost:3000
4. **Commit and push** to GitHub
5. **GitHub Actions** builds and pushes to GHCR
6. **Pull updated images** with `docker-compose -f docker-compose.ghcr.yml pull`
7. **Deploy** with `docker-compose -f docker-compose.ghcr.yml up -d`

## Key Technologies by Layer

| Layer          | Technology     | Purpose              |
| -------------- | -------------- | -------------------- |
| **Frontend**   | React 18       | UI library           |
|                | Tailwind CSS   | Styling              |
|                | Leaflet        | Maps                 |
|                | Zustand        | State management     |
|                | Vite           | Build tool           |
| **Backend**    | FastAPI        | Web framework        |
|                | Motor          | Async MongoDB driver |
|                | python-jose    | JWT tokens           |
|                | Pydantic       | Data validation      |
| **Clustering** | scikit-learn   | DBSCAN algorithm     |
|                | NumPy          | Array operations     |
| **Database**   | MongoDB 7      | NoSQL database       |
| **DevOps**     | Docker         | Containerization     |
|                | GitHub Actions | CI/CD                |
|                | Nginx          | Reverse proxy        |

## Environment Variables

### API (`.env`)

```env
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=neighborwatch
SECRET_KEY=your-secret-key
DEBUG=True
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:8000/api
```

## Ports

| Service  | Port  | Purpose  |
| -------- | ----- | -------- |
| Frontend | 3000  | Web UI   |
| API      | 8000  | REST API |
| MongoDB  | 27017 | Database |

## Database Collections

- `users`: User accounts (citizen, police, admin)
- `reports`: Incident reports
- `clusters`: DBSCAN clusters
- `chats`: Chat conversations with messages
- `alerts`: Broadcast alerts

For detailed schema, see README.md.

---

**This structure enables:**

- ✅ Separation of concerns
- ✅ Independent scaling
- ✅ Easy testing
- ✅ Clear responsibilities
- ✅ Maintainable codebase
