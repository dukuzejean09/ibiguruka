from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from typing import Optional
from datetime import datetime
import os

from .routes import auth, reports, clusters, chats, alerts, admin, heatmap
from .database import database
from .config import settings
from .auth import get_password_hash

async def create_default_admin():
    """Create default admin user if not exists"""
    try:
        users_collection = database.db["users"]
        
        # Check if admin exists
        existing_admin = await users_collection.find_one({"email": "admin@neighborwatch.rw"})
        
        if not existing_admin:
            admin_user = {
                "email": "admin@neighborwatch.rw",
                "hashed_password": get_password_hash("admin@123A"),
                "full_name": "System Administrator",
                "phone": "+250788000000",
                "role": "admin",
                "is_verified": True,
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            await users_collection.insert_one(admin_user)
            print("✅ Default admin user created: admin@neighborwatch.rw / admin@123A")
        else:
            print("ℹ️  Default admin user already exists")
    except Exception as e:
        print(f"⚠️  Error creating default admin: {e}")
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await database.connect()
    print("✅ Database connected")
    
    # Create default admin user
    await create_default_admin()
    
    yield
    # Shutdown
    await database.disconnect()
    print("👋 Database disconnected")
    print("👋 Database disconnected")

app = FastAPI(
    title="NeighborWatch Connect API",
    description="Community Safety Platform - Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(clusters.router, prefix="/api/clusters", tags=["Clusters"])
app.include_router(chats.router, prefix="/api/chats", tags=["Chats"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(heatmap.router, prefix="/api/heatmap", tags=["Heatmap"])

@app.get("/")
async def root():
    return {
        "message": "NeighborWatch Connect API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
