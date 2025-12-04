from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from .config import settings

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    async def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.DATABASE_NAME]
        print(f"Connected to MongoDB: {settings.DATABASE_NAME}")
    
    async def disconnect(self):
        if self.client:
            self.client.close()
    
    def get_collection(self, name: str):
        return self.db[name]

database = Database()

# Collections
def get_users_collection():
    return database.get_collection("users")

def get_reports_collection():
    return database.get_collection("reports")

def get_clusters_collection():
    return database.get_collection("clusters")

def get_chats_collection():
    return database.get_collection("chats")

def get_alerts_collection():
    return database.get_collection("alerts")

def get_config_collection():
    return database.get_collection("config")

def get_fingerprints_collection():
    return database.get_collection("fingerprints")

def get_messages_collection():
    return database.get_collection("messages")
