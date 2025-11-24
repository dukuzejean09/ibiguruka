from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from ..models import AlertCreate
from ..database import get_alerts_collection
from ..auth import get_current_active_user

router = APIRouter()

@router.post("/broadcast")
async def broadcast_alert(
    alert_data: AlertCreate,
    current_user: dict = Depends(get_current_active_user)
):
    # Only police/admin can broadcast
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    alerts_collection = get_alerts_collection()
    
    alert_doc = {
        "message": alert_data.message,
        "area": alert_data.area,
        "senderId": str(current_user["_id"]),
        "timestamp": datetime.utcnow()
    }
    
    result = await alerts_collection.insert_one(alert_doc)
    
    # TODO: Send push notifications to users in the area
    
    return {
        "status": "success",
        "message": "Alert broadcasted",
        "alertId": str(result.inserted_id)
    }

@router.get("/list")
async def get_alerts():
    alerts_collection = get_alerts_collection()
    
    cursor = alerts_collection.find().sort("timestamp", -1).limit(50)
    alerts = []
    
    async for alert in cursor:
        alert["id"] = str(alert["_id"])
        del alert["_id"]
        alerts.append(alert)
    
    return alerts
