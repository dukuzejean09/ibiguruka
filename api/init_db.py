"""
Database initialization script
- Clears all existing users
- Creates default admin user
- Clears all reports, chats, alerts, and clusters
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import get_password_hash
from app.config import settings

async def init_database():
    """Initialize database with clean state and default admin"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("🔄 Initializing database...")
    
    try:
        # Clear all collections
        print("🗑️  Clearing existing data...")
        await db.users.delete_many({})
        await db.reports.delete_many({})
        await db.clusters.delete_many({})
        await db.chats.delete_many({})
        await db.alerts.delete_many({})
        print("✅ All collections cleared")
        
        # Create default admin user
        print("👤 Creating default admin user...")
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
        
        result = await db.users.insert_one(admin_user)
        print(f"✅ Default admin created with ID: {result.inserted_id}")
        print("\n📋 Admin Credentials:")
        print("   Email: admin@neighborwatch.rw")
        print("   Password: admin@123A")
        
        # Create indexes for better performance
        print("\n🔧 Creating database indexes...")
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        await db.reports.create_index("timestamp")
        await db.reports.create_index("status")
        await db.reports.create_index("user_id")
        await db.clusters.create_index("timestamp")
        await db.chats.create_index("report_id")
        await db.alerts.create_index("timestamp")
        print("✅ Indexes created")
        
        print("\n✨ Database initialization complete!")
        print("   You can now create your own users through registration.")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  NeighborWatch Connect - Database Initialization")
    print("=" * 60)
    print("\n⚠️  WARNING: This will DELETE all existing data!")
    confirm = input("\nType 'yes' to continue: ")
    
    if confirm.lower() == 'yes':
        asyncio.run(init_database())
    else:
        print("❌ Initialization cancelled")
