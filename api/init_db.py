"""
Database initialization script
- Clears all existing users
- Creates default admin user
- Clears all reports, chats, alerts, and clusters
"""

from pymongo import MongoClient
from datetime import datetime
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import get_password_hash

def init_database():
    """Initialize database with clean state and default admin"""
    
    # Configuration
    MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'neighborwatch')
    
    # Connect to MongoDB
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔄 Initializing database...")
    
    try:
        # Clear all collections
        print("🗑️  Clearing existing data...")
        db.users.delete_many({})
        db.reports.delete_many({})
        db.clusters.delete_many({})
        db.chats.delete_many({})
        db.alerts.delete_many({})
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
        
        result = db.users.insert_one(admin_user)
        print(f"✅ Default admin created with ID: {result.inserted_id}")
        print("\n📋 Admin Credentials:")
        print("   Email: admin@neighborwatch.rw")
        print("   Password: admin@123A")
        
        # Create indexes for better performance
        print("\n🔧 Creating database indexes...")
        db.users.create_index("email", unique=True)
        db.users.create_index("role")
        db.reports.create_index("timestamp")
        db.reports.create_index("status")
        db.reports.create_index("user_id")
        db.clusters.create_index("timestamp")
        db.chats.create_index("report_id")
        db.alerts.create_index("timestamp")
        print("✅ Indexes created")
        
        print("\n✨ Database initialization complete!")
        print("   You can now create your own users through registration.")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  NeighborWatch Connect - Database Initialization")
    print("=" * 60)
    print("\n⚠️  WARNING: This will DELETE all existing data!")
    confirm = input("\nType 'yes' to continue: ")
    
    if confirm.lower() == 'yes':
        init_database()
    else:
        print("❌ Initialization cancelled")
