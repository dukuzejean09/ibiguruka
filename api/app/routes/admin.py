from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from ..database import get_users_collection
from ..auth import get_current_active_user

router = APIRouter()

@router.get("/users/list")
async def get_users(
    role: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin can access
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users_collection = get_users_collection()
    
    query = {}
    if role:
        query["role"] = role
    
    cursor = users_collection.find(query)
    users = []
    
    async for user in cursor:
        user["id"] = str(user["_id"])
        del user["_id"]
        if "password_hash" in user:
            del user["password_hash"]
        users.append(user)
    
    return users

@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users_collection = get_users_collection()
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user["id"] = str(user["_id"])
        del user["_id"]
        if "password_hash" in user:
            del user["password_hash"]
        
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user ID")

from pydantic import BaseModel

class UserUpdate(BaseModel):
    role: Optional[str] = None
    verified: Optional[bool] = None
    blocked: Optional[bool] = None
    role_approved: Optional[bool] = None
    requested_role: Optional[str] = None

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users_collection = get_users_collection()
    
    update_data = {}
    
    # If approving a role request
    if user_update.role_approved and user_update.role is not None:
        update_data["role"] = user_update.role
        update_data["role_approved"] = True
        update_data["requested_role"] = None  # Clear the request
    elif user_update.role is not None:
        update_data["role"] = user_update.role
    
    if user_update.verified is not None:
        update_data["verified"] = user_update.verified
    if user_update.blocked is not None:
        update_data["blocked"] = user_update.blocked
    if user_update.requested_role is not None:
        update_data["requested_role"] = user_update.requested_role
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully", "updated_fields": update_data}

@router.get("/users/pending-roles")
async def get_pending_role_requests(
    current_user: dict = Depends(get_current_active_user)
):
    """Get all users with pending role requests (e.g., police registration requests)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users_collection = get_users_collection()
    
    # Find users with requested_role set and not yet approved
    cursor = users_collection.find({
        "requested_role": {"$exists": True, "$ne": None},
        "role_approved": False
    })
    
    pending_users = []
    async for user in cursor:
        user["id"] = str(user["_id"])
        del user["_id"]
        if "password_hash" in user:
            del user["password_hash"]
        pending_users.append(user)
    
    return pending_users

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users_collection = get_users_collection()
    
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@router.get("/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_active_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from ..database import get_reports_collection, get_clusters_collection, get_chats_collection, get_alerts_collection
    from datetime import timedelta
    
    users_collection = get_users_collection()
    reports_collection = get_reports_collection()
    clusters_collection = get_clusters_collection()
    chats_collection = get_chats_collection()
    alerts_collection = get_alerts_collection()
    
    # Basic counts
    total_users = await users_collection.count_documents({})
    total_reports = await reports_collection.count_documents({})
    active_clusters = await clusters_collection.count_documents({})
    total_chats = await chats_collection.count_documents({})
    total_alerts = await alerts_collection.count_documents({})
    
    # User breakdown by role
    citizens = await users_collection.count_documents({"role": "citizen"})
    police = await users_collection.count_documents({"role": "police"})
    admins = await users_collection.count_documents({"role": "admin"})
    pending_police = await users_collection.count_documents({
        "requested_role": "police",
        "role_approved": False
    })
    
    # Report breakdown by status
    new_reports = await reports_collection.count_documents({"status": "new"})
    investigating = await reports_collection.count_documents({"status": "investigating"})
    resolved_reports = await reports_collection.count_documents({"status": "resolved"})
    
    # Reports this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    reports_this_week = await reports_collection.count_documents({
        "timestamp": {"$gte": week_ago}
    })
    
    # Reports today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    reports_today = await reports_collection.count_documents({
        "timestamp": {"$gte": today_start}
    })
    
    # Get last cluster run time
    last_cluster = await clusters_collection.find_one(
        {}, 
        sort=[("timestamp", -1)]
    )
    last_cluster_run = last_cluster.get("timestamp") if last_cluster else None
    
    # Top categories
    category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_categories = []
    async for cat in reports_collection.aggregate(category_pipeline):
        top_categories.append({"category": cat["_id"], "count": cat["count"]})
    
    return {
        "totalUsers": total_users,
        "totalReports": total_reports,
        "activeClusters": active_clusters,
        "totalChats": total_chats,
        "totalAlerts": total_alerts,
        "lastClusterRun": last_cluster_run,
        "users": {
            "citizens": citizens,
            "police": police,
            "admins": admins,
            "pendingPolice": pending_police
        },
        "reports": {
            "new": new_reports,
            "investigating": investigating,
            "resolved": resolved_reports,
            "thisWeek": reports_this_week,
            "today": reports_today
        },
        "topCategories": top_categories
    }
