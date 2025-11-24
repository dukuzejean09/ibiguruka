from fastapi import APIRouter
from datetime import datetime, timedelta
from ..database import get_reports_collection

router = APIRouter()

@router.get("/data")
async def get_heatmap_data():
    """Return anonymized incident locations for public heatmap"""
    reports_collection = get_reports_collection()
    
    # Get reports from last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    cursor = reports_collection.find({
        "timestamp": {"$gte": thirty_days_ago}
    })
    
    heatmap_points = []
    async for report in cursor:
        # Anonymize by rounding coordinates
        heatmap_points.append({
            "lat": round(report["location"]["lat"], 3),
            "lng": round(report["location"]["lng"], 3),
            "radius": 200
        })
    
    return heatmap_points
