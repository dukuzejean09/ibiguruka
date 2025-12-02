from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel
import random
import string
from ..models import Report, ReportCreate
from ..database import get_reports_collection
from ..auth import get_current_active_user

router = APIRouter()

def generate_reference_number():
    """Generate a unique reference number like NW-2024-ABCD1234"""
    year = datetime.utcnow().year
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"NW-{year}-{chars}"

class ReportUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None

@router.post("/submit", response_model=dict)
async def submit_report(report_data: ReportCreate):
    reports_collection = get_reports_collection()
    
    report_dict = report_data.model_dump()
    report_dict["timestamp"] = datetime.utcnow()
    report_dict["status"] = "new"
    report_dict["priority"] = "medium"  # Default priority
    report_dict["credibilityScore"] = 0.5
    report_dict["flagged"] = False
    report_dict["referenceNumber"] = generate_reference_number()
    report_dict["statusHistory"] = [{
        "status": "new",
        "timestamp": datetime.utcnow(),
        "updatedBy": "system",
        "note": "Report submitted"
    }]
    
    result = await reports_collection.insert_one(report_dict)
    
    return {
        "id": str(result.inserted_id),
        "referenceNumber": report_dict["referenceNumber"],
        "message": "Report submitted successfully"
    }

@router.get("/list", response_model=List[dict])
async def get_reports(
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    timeframe: Optional[str] = None,  # "24h", "7d", "30d"
    limit: int = Query(100, le=1000),
    current_user: dict = Depends(get_current_active_user)
):
    reports_collection = get_reports_collection()
    
    user_role = current_user.get("role", "citizen")
    user_id = current_user.get("id") or str(current_user.get("_id", ""))
    
    query = {}
    
    # Citizens can only see their own reports
    if user_role == "citizen":
        query["userId"] = user_id
    
    if category and category != "all":
        query["category"] = category
    if status and status != "all":
        if status == "new,investigating":
            query["status"] = {"$in": ["new", "investigating"]}
        else:
            query["status"] = status
    if priority:
        query["priority"] = priority
    
    # Timeframe filter
    if timeframe:
        now = datetime.utcnow()
        if timeframe == "24h":
            query["timestamp"] = {"$gte": now - timedelta(hours=24)}
        elif timeframe == "7d":
            query["timestamp"] = {"$gte": now - timedelta(days=7)}
        elif timeframe == "30d":
            query["timestamp"] = {"$gte": now - timedelta(days=30)}
    
    if search:
        query["$or"] = [
            {"referenceNumber": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = reports_collection.find(query).sort("timestamp", -1).limit(limit)
    reports = []
    
    async for report in cursor:
        report["id"] = str(report["_id"])
        del report["_id"]
        reports.append(report)
    
    return reports

@router.get("/search/{reference_number}")
async def search_by_reference(
    reference_number: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Search for a report by reference number"""
    reports_collection = get_reports_collection()
    
    report = await reports_collection.find_one({"referenceNumber": reference_number})
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Citizens can only see their own reports
    user_role = current_user.get("role", "citizen")
    user_id = current_user.get("id") or str(current_user.get("_id", ""))
    
    if user_role == "citizen" and report.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
    
    report["id"] = str(report["_id"])
    del report["_id"]
    return report

@router.get("/stats")
async def get_report_stats(current_user: dict = Depends(get_current_active_user)):
    """Get report statistics"""
    reports_collection = get_reports_collection()
    
    user_role = current_user.get("role", "citizen")
    user_id = current_user.get("id") or str(current_user.get("_id", ""))
    
    match_query = {}
    if user_role == "citizen":
        match_query["userId"] = user_id
    
    pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    status_counts = {}
    async for doc in reports_collection.aggregate(pipeline):
        status_counts[doc["_id"]] = doc["count"]
    
    total = sum(status_counts.values())
    
    return {
        "total": total,
        "new": status_counts.get("new", 0),
        "investigating": status_counts.get("investigating", 0),
        "resolved": status_counts.get("resolved", 0),
        "closed": status_counts.get("closed", 0)
    }

@router.get("/{report_id}", response_model=dict)
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    reports_collection = get_reports_collection()
    
    try:
        report = await reports_collection.find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Citizens can only see their own reports
        user_role = current_user.get("role", "citizen")
        user_id = current_user.get("id") or str(current_user.get("_id", ""))
        
        if user_role == "citizen" and report.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        report["id"] = str(report["_id"])
        del report["_id"]
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid report ID")

@router.put("/{report_id}")
async def update_report(
    report_id: str,
    update_data: ReportUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    # Only police/admin can update
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reports_collection = get_reports_collection()
    
    updates = {}
    history_entry = {
        "timestamp": datetime.utcnow(),
        "updatedBy": current_user.get("email", "unknown")
    }
    
    if update_data.status:
        updates["status"] = update_data.status
        history_entry["status"] = update_data.status
    if update_data.priority:
        updates["priority"] = update_data.priority
        history_entry["note"] = f"Priority changed to {update_data.priority}"
    if update_data.assignedTo:
        updates["assignedTo"] = update_data.assignedTo
    if update_data.notes:
        history_entry["note"] = update_data.notes
    
    if not updates:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    updates["updatedAt"] = datetime.utcnow()
    
    result = await reports_collection.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": updates,
            "$push": {"statusHistory": history_entry}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": "Report updated successfully"}

