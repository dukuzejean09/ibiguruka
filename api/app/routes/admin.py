from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
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

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    role: Optional[str] = None,
    verified: Optional[bool] = None,
    blocked: Optional[bool] = None,
    role_approved: Optional[bool] = None,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users_collection = get_users_collection()
    
    update_data = {}
    
    # If approving a role request
    if role_approved and role is not None:
        update_data["role"] = role
        update_data["role_approved"] = True
        update_data["requested_role"] = None  # Clear the request
    elif role is not None:
        update_data["role"] = role
    
    if verified is not None:
        update_data["verified"] = verified
    if blocked is not None:
        update_data["blocked"] = blocked
    
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
    
    users_collection = get_users_collection()
    
    total_users = await users_collection.count_documents({})
    active_users = await users_collection.count_documents({"blocked": False})
    blocked_users = await users_collection.count_documents({"blocked": True})
    
    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "blockedUsers": blocked_users
    }
