from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from ..models import Report, ReportCreate
from ..database import get_reports_collection
from ..auth import get_current_active_user

router = APIRouter()

@router.post("/submit", response_model=dict)
async def submit_report(report_data: ReportCreate):
    reports_collection = get_reports_collection()
    
    report_dict = report_data.model_dump()
    report_dict["timestamp"] = datetime.utcnow()
    report_dict["status"] = "new"
    report_dict["credibilityScore"] = 0.5  # Default score
    report_dict["flagged"] = False
    
    result = await reports_collection.insert_one(report_dict)
    
    return {
        "id": str(result.inserted_id),
        "message": "Report submitted successfully"
    }

@router.get("/list", response_model=List[dict])
async def get_reports(
    category: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, le=1000)
):
    reports_collection = get_reports_collection()
    
    query = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    
    cursor = reports_collection.find(query).sort("timestamp", -1).limit(limit)
    reports = []
    
    async for report in cursor:
        report["id"] = str(report["_id"])
        del report["_id"]
        reports.append(report)
    
    return reports

@router.get("/{report_id}", response_model=dict)
async def get_report(report_id: str):
    reports_collection = get_reports_collection()
    
    try:
        report = await reports_collection.find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report["id"] = str(report["_id"])
        del report["_id"]
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid report ID")

@router.put("/{report_id}")
async def update_report(
    report_id: str,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    # Only police/admin can update
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reports_collection = get_reports_collection()
    
    update_data = {}
    if status:
        update_data["status"] = status
    
    result = await reports_collection.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": "Report updated successfully"}
