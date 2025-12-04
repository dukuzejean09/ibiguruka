from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel
import random
import string
from ..models import Report, ReportCreate
from ..database import get_reports_collection, get_fingerprints_collection
from ..auth import get_current_active_user
from ..trust_scoring import (
    get_or_create_fingerprint_record,
    check_for_flood,
    calculate_report_weight,
    should_delay_report,
    update_trust_score,
    FAKE_REPORT_PENALTY,
    VERIFIED_REPORT_BONUS,
    LOW_TRUST_THRESHOLD
)

router = APIRouter()

# Categories that require mandatory photo
PHOTO_REQUIRED_CATEGORIES = ["Theft", "Suspicious Activity"]

def generate_reference_number():
    """Generate a unique reference number like TB-2024-ABCD1234"""
    year = datetime.utcnow().year
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"TB-{year}-{chars}"

class ReportUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    flaggedAsFake: Optional[bool] = None
    verifiedByPolice: Optional[bool] = None

@router.post("/submit", response_model=dict)
async def submit_report(report_data: ReportCreate):
    reports_collection = get_reports_collection()
    fingerprints_collection = get_fingerprints_collection()
    
    report_dict = report_data.model_dump()
    
    # Validate mandatory photo for high-risk categories
    if report_dict.get("category") in PHOTO_REQUIRED_CATEGORIES:
        if not report_dict.get("photoUrl"):
            raise HTTPException(
                status_code=400,
                detail=f"Photo is mandatory for {report_dict['category']} reports"
            )
    
    # Trust scoring integration
    fingerprint = report_dict.get("deviceFingerprint")
    trust_score = 50  # Default for anonymous
    trust_weight = 0.5
    is_delayed = False
    delayed_until = None
    is_flood = False
    
    if fingerprint:
        # Check for flood/spam attack
        is_flood = await check_for_flood(
            fingerprint,
            report_dict.get("location", {}),
            fingerprints_collection,
            reports_collection
        )
        
        if is_flood:
            raise HTTPException(
                status_code=429,
                detail="Too many similar reports from this device. Please wait before submitting again."
            )
        
        # Get fingerprint record and trust score
        fp_record = await get_or_create_fingerprint_record(fingerprint, fingerprints_collection)
        trust_score = fp_record.get("trust_score", 50)
        trust_weight = await calculate_report_weight(fingerprint, fingerprints_collection)
        
        # Check if report should be delayed (low trust)
        is_delayed = await should_delay_report(fingerprint, fingerprints_collection)
        if is_delayed:
            # Delay for 1-2 hours
            delayed_until = datetime.utcnow() + timedelta(hours=1, minutes=random.randint(0, 60))
        
        # Update fingerprint record
        await fingerprints_collection.update_one(
            {"fingerprint": fingerprint},
            {
                "$inc": {"report_count": 1},
                "$set": {
                    "last_report_time": datetime.utcnow(),
                    "last_report_location": report_dict.get("location"),
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    # Build report document
    report_dict["timestamp"] = datetime.utcnow()
    report_dict["status"] = "new" if not is_delayed else "pending_review"
    report_dict["priority"] = "medium"
    report_dict["credibilityScore"] = trust_weight
    report_dict["trustScore"] = trust_score
    report_dict["trustWeight"] = trust_weight
    report_dict["flagged"] = False
    report_dict["flaggedAsFake"] = False
    report_dict["verifiedByPolice"] = False
    report_dict["isDelayed"] = is_delayed
    report_dict["delayedUntil"] = delayed_until
    report_dict["referenceNumber"] = generate_reference_number()
    report_dict["statusHistory"] = [{
        "status": "new" if not is_delayed else "pending_review",
        "timestamp": datetime.utcnow(),
        "updatedBy": "system",
        "note": "Report submitted" + (" (delayed for review due to trust score)" if is_delayed else "")
    }]
    
    result = await reports_collection.insert_one(report_dict)
    
    response = {
        "id": str(result.inserted_id),
        "referenceNumber": report_dict["referenceNumber"],
        "message": "Report submitted successfully"
    }
    
    if is_delayed:
        response["notice"] = "Your report has been queued for review and will be processed shortly."
    
    return response

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


@router.post("/{report_id}/mark-fake")
async def mark_report_as_fake(
    report_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Mark a report as fake/prank.
    This lowers the trust score of the submitting device and excludes
    the report from clustering analysis.
    """
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reports_collection = get_reports_collection()
    fingerprints_collection = get_fingerprints_collection()
    
    report = await reports_collection.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update report
    await reports_collection.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {
                "flaggedAsFake": True,
                "flagged": True,
                "status": "fake",
                "trustWeight": 0.0,  # Exclude from clustering
                "updatedAt": datetime.utcnow()
            },
            "$push": {
                "statusHistory": {
                    "status": "fake",
                    "timestamp": datetime.utcnow(),
                    "updatedBy": current_user.get("email", "unknown"),
                    "note": "Marked as fake/prank by police"
                }
            }
        }
    )
    
    # Update trust score for the device fingerprint
    fingerprint = report.get("deviceFingerprint")
    trust_result = None
    if fingerprint and fingerprint != "anonymous":
        new_score = await update_trust_score(
            fingerprint,
            FAKE_REPORT_PENALTY,
            f"report_marked_fake:{report_id}",
            fingerprints_collection
        )
        await fingerprints_collection.update_one(
            {"fingerprint": fingerprint},
            {"$inc": {"fake_count": 1}}
        )
        trust_result = {
            "fingerprint_masked": fingerprint[:8] + "...",
            "new_trust_score": new_score,
            "penalty_applied": FAKE_REPORT_PENALTY
        }
    
    return {
        "message": "Report marked as fake",
        "trust_update": trust_result
    }


@router.post("/{report_id}/verify")
async def verify_report(
    report_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Verify a report as legitimate.
    This increases the trust score of the submitting device.
    """
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reports_collection = get_reports_collection()
    fingerprints_collection = get_fingerprints_collection()
    
    report = await reports_collection.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update report
    await reports_collection.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {
                "verifiedByPolice": True,
                "isDelayed": False,  # Remove from delayed queue
                "delayedUntil": None,
                "updatedAt": datetime.utcnow()
            },
            "$push": {
                "statusHistory": {
                    "status": report.get("status", "new"),
                    "timestamp": datetime.utcnow(),
                    "updatedBy": current_user.get("email", "unknown"),
                    "note": "Verified as legitimate by police"
                }
            }
        }
    )
    
    # Update trust score for the device fingerprint
    fingerprint = report.get("deviceFingerprint")
    trust_result = None
    if fingerprint and fingerprint != "anonymous":
        new_score = await update_trust_score(
            fingerprint,
            VERIFIED_REPORT_BONUS,
            f"report_verified:{report_id}",
            fingerprints_collection
        )
        await fingerprints_collection.update_one(
            {"fingerprint": fingerprint},
            {"$inc": {"verified_count": 1}}
        )
        trust_result = {
            "fingerprint_masked": fingerprint[:8] + "...",
            "new_trust_score": new_score,
            "bonus_applied": VERIFIED_REPORT_BONUS
        }
    
    return {
        "message": "Report verified",
        "trust_update": trust_result
    }


@router.get("/queue/low-trust")
async def get_low_trust_queue(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get reports in the low-trust delayed queue.
    These are reports from devices with trust_score < 40 that need manual review.
    """
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reports_collection = get_reports_collection()
    
    # Get delayed reports
    cursor = reports_collection.find({
        "isDelayed": True
    }).sort("timestamp", -1)
    
    reports = []
    async for report in cursor:
        report["id"] = str(report["_id"])
        del report["_id"]
        reports.append(report)
    
    return {
        "count": len(reports),
        "reports": reports
    }


@router.post("/{report_id}/approve-delayed")
async def approve_delayed_report(
    report_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Approve a delayed (low-trust) report, making it visible in real-time analysis.
    """
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reports_collection = get_reports_collection()
    
    result = await reports_collection.update_one(
        {"_id": ObjectId(report_id), "isDelayed": True},
        {
            "$set": {
                "isDelayed": False,
                "delayedUntil": None,
                "status": "new",
                "updatedAt": datetime.utcnow()
            },
            "$push": {
                "statusHistory": {
                    "status": "new",
                    "timestamp": datetime.utcnow(),
                    "updatedBy": current_user.get("email", "unknown"),
                    "note": "Approved from low-trust queue"
                }
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found or not in delayed queue")
    
    return {"message": "Report approved and moved to active queue"}


@router.get("/queue/low-trust", response_model=dict)
async def get_low_trust_queue(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get all reports in the low-trust queue.
    These are reports from users with low trust scores that need manual review.
    """
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reports_collection = get_reports_collection()
    
    # Query for low-trust reports
    query = {
        "$or": [
            {"isDelayed": True},
            {"trustWeight": {"$lt": 0.4}},
            {"flagged": True},
            {"status": "pending_review"}
        ]
    }
    
    cursor = reports_collection.find(query).sort("timestamp", 1)  # Oldest first
    reports = []
    
    async for report in cursor:
        report["id"] = str(report["_id"])
        report["_id"] = str(report["_id"])
        report["inLowTrustQueue"] = True
        reports.append(report)
    
    return {
        "count": len(reports),
        "reports": reports
    }

