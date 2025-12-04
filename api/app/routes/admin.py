from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from ..database import get_users_collection, get_config_collection, get_fingerprints_collection, get_reports_collection
from ..auth import get_current_active_user
from ..models import SystemConfig
from ..trust_scoring import get_abuse_analytics, cleanup_old_fingerprints

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

@router.get("/config", response_model=SystemConfig)
async def get_system_config(current_user: dict = Depends(get_current_active_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config_collection = get_config_collection()
    config = await config_collection.find_one({})
    
    if not config:
        # Create default config
        default_config = SystemConfig()
        await config_collection.insert_one(default_config.model_dump(by_alias=True))
        return default_config
    
    config["id"] = str(config["_id"])
    del config["_id"]
    return config

@router.put("/config")
async def update_system_config(
    config_update: SystemConfig,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config_collection = get_config_collection()
    
    # Ensure config exists
    existing = await config_collection.find_one({})
    
    update_data = config_update.model_dump(exclude={"id", "updatedAt", "updatedBy"})
    update_data["updatedAt"] = datetime.utcnow()
    update_data["updatedBy"] = current_user.get("email", "admin")
    
    if existing:
        await config_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": update_data}
        )
    else:
        await config_collection.insert_one(update_data)
    
    return {"message": "Configuration updated successfully"}


# ============================================
# ABUSE ANALYTICS ENDPOINTS
# ============================================

@router.get("/abuse/analytics")
async def get_abuse_analytics_endpoint(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get comprehensive abuse analytics for the admin dashboard.
    
    Returns:
    - Trust score distribution
    - Top offenders (devices with most fake reports)
    - Trend data for flagged reports
    - Low-trust device count
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    fingerprints_collection = get_fingerprints_collection()
    reports_collection = get_reports_collection()
    
    # Get analytics from trust scoring module
    analytics = await get_abuse_analytics(fingerprints_collection)
    
    # Add report-level abuse stats
    fake_reports = await reports_collection.count_documents({"flaggedAsFake": True})
    delayed_reports = await reports_collection.count_documents({"isDelayed": True})
    verified_reports = await reports_collection.count_documents({"verifiedByPolice": True})
    
    # Category breakdown for fake reports
    fake_by_category = []
    async for doc in reports_collection.aggregate([
        {"$match": {"flaggedAsFake": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]):
        fake_by_category.append({"category": doc["_id"], "count": doc["count"]})
    
    # Recent fake reports (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_fakes = await reports_collection.count_documents({
        "flaggedAsFake": True,
        "timestamp": {"$gte": seven_days_ago}
    })
    
    analytics["reports"] = {
        "totalFake": fake_reports,
        "currentlyDelayed": delayed_reports,
        "verified": verified_reports,
        "recentFakes": recent_fakes,
        "fakeByCategory": fake_by_category
    }
    
    return analytics


@router.get("/abuse/low-trust-devices")
async def get_low_trust_devices(
    limit: int = 20,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get list of devices with low trust scores.
    These are potential abusers that may need monitoring.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    fingerprints_collection = get_fingerprints_collection()
    
    cursor = fingerprints_collection.find({
        "trust_score": {"$lt": 40}
    }).sort("trust_score", 1).limit(limit)
    
    devices = []
    async for fp in cursor:
        devices.append({
            "fingerprint_masked": fp["fingerprint"][:8] + "..." + fp["fingerprint"][-4:],
            "trust_score": fp["trust_score"],
            "report_count": fp.get("report_count", 0),
            "fake_count": fp.get("fake_count", 0),
            "verified_count": fp.get("verified_count", 0),
            "duplicate_count": fp.get("duplicate_count", 0),
            "last_activity": fp.get("updated_at"),
            "created_at": fp.get("created_at")
        })
    
    return {
        "count": len(devices),
        "devices": devices
    }


@router.get("/abuse/flagged-reports")
async def get_flagged_reports(
    limit: int = 50,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get reports that have been flagged as fake/prank.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reports_collection = get_reports_collection()
    
    cursor = reports_collection.find({
        "flaggedAsFake": True
    }).sort("timestamp", -1).limit(limit)
    
    reports = []
    async for report in cursor:
        reports.append({
            "id": str(report["_id"]),
            "referenceNumber": report.get("referenceNumber"),
            "category": report.get("category"),
            "description": report.get("description", "")[:100],
            "location": report.get("location"),
            "timestamp": report.get("timestamp"),
            "deviceFingerprint_masked": (report.get("deviceFingerprint", "")[:8] + "...") if report.get("deviceFingerprint") else "anonymous",
            "trustScore": report.get("trustScore", 50)
        })
    
    return {
        "count": len(reports),
        "reports": reports
    }


@router.post("/abuse/cleanup")
async def cleanup_old_data(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Purge fingerprint data older than 30 days for privacy compliance.
    This should be run periodically (can be automated via cron).
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    fingerprints_collection = get_fingerprints_collection()
    deleted_count = await cleanup_old_fingerprints(fingerprints_collection)
    
    return {
        "message": f"Cleaned up {deleted_count} old fingerprint records",
        "deleted_count": deleted_count
    }


@router.get("/trust/device/{fingerprint_prefix}")
async def get_device_trust_info(
    fingerprint_prefix: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get trust information for a specific device by fingerprint prefix.
    Only returns partial fingerprint for privacy.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    fingerprints_collection = get_fingerprints_collection()
    
    # Search by prefix
    fp_record = await fingerprints_collection.find_one({
        "fingerprint": {"$regex": f"^{fingerprint_prefix}"}
    })
    
    if not fp_record:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Get recent reports from this device
    reports_collection = get_reports_collection()
    recent_reports = []
    async for report in reports_collection.find({
        "deviceFingerprint": fp_record["fingerprint"]
    }).sort("timestamp", -1).limit(10):
        recent_reports.append({
            "id": str(report["_id"]),
            "referenceNumber": report.get("referenceNumber"),
            "category": report.get("category"),
            "status": report.get("status"),
            "flaggedAsFake": report.get("flaggedAsFake", False),
            "verifiedByPolice": report.get("verifiedByPolice", False),
            "timestamp": report.get("timestamp")
        })
    
    return {
        "fingerprint_masked": fp_record["fingerprint"][:8] + "..." + fp_record["fingerprint"][-4:],
        "trust_score": fp_record.get("trust_score", 50),
        "report_count": fp_record.get("report_count", 0),
        "fake_count": fp_record.get("fake_count", 0),
        "verified_count": fp_record.get("verified_count", 0),
        "duplicate_count": fp_record.get("duplicate_count", 0),
        "created_at": fp_record.get("created_at"),
        "updated_at": fp_record.get("updated_at"),
        "score_history": fp_record.get("score_history", [])[-10:],  # Last 10 changes
        "recent_reports": recent_reports
    }
