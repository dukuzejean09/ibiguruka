from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timedelta
from ..database import get_reports_collection, get_clusters_collection, get_config_collection
from sklearn.cluster import DBSCAN
import numpy as np
from bson import ObjectId

router = APIRouter()

async def get_clustering_params():
    """Fetch clustering parameters from system config"""
    config_collection = get_config_collection()
    config = await config_collection.find_one({})
    
    if config and "clustering" in config:
        return {
            "eps": config["clustering"].get("epsilon", 0.005),
            "min_samples": config["clustering"].get("minSamples", 3),
            "enabled": config["clustering"].get("enabled", True)
        }
    
    # Default parameters
    return {"eps": 0.005, "min_samples": 3, "enabled": True}

@router.get("/get", response_model=List[dict])
async def get_latest_clusters():
    clusters_collection = get_clusters_collection()
    
    # Get clusters from last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    cursor = clusters_collection.find({
        "timestamp": {"$gte": one_hour_ago}
    }).sort("timestamp", -1).limit(50)
    
    clusters = []
    async for cluster in cursor:
        cluster["id"] = str(cluster["_id"])
        del cluster["_id"]
        clusters.append(cluster)
    
    return clusters

@router.get("/params")
async def get_cluster_params():
    """Get current clustering parameters"""
    params = await get_clustering_params()
    return params

@router.post("/refresh")
async def refresh_clusters():
    """Run DBSCAN clustering on recent reports using configurable parameters"""
    reports_collection = get_reports_collection()
    clusters_collection = get_clusters_collection()
    
    # Get clustering parameters from config
    params = await get_clustering_params()
    
    if not params["enabled"]:
        return {"message": "Clustering is disabled", "clusters": 0}
    
    # Get reports from last 24 hours
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    cursor = reports_collection.find({
        "timestamp": {"$gte": twenty_four_hours_ago}
    })
    
    reports = []
    async for report in cursor:
        reports.append(report)
    
    if len(reports) < 2:
        return {"message": "Not enough reports for clustering", "clusters": 0}
    
    # Extract coordinates
    coords = np.array([[r["location"]["lat"], r["location"]["lng"]] for r in reports])
    
    # Run DBSCAN with configurable parameters
    db = DBSCAN(eps=params["eps"], min_samples=params["min_samples"]).fit(coords)
    labels = db.labels_
    
    # Group clusters
    unique_labels = set(labels)
    cluster_count = 0
    
    for label in unique_labels:
        if label == -1:  # Noise points
            continue
        
        # Get points in this cluster
        mask = labels == label
        cluster_reports = [reports[i] for i, m in enumerate(mask) if m]
        cluster_coords = coords[mask]
        
        # Calculate center and radius
        center_lat = float(np.mean(cluster_coords[:, 0]))
        center_lng = float(np.mean(cluster_coords[:, 1]))
        
        # Approximate radius
        distances = np.sqrt(
            (cluster_coords[:, 0] - center_lat)**2 + 
            (cluster_coords[:, 1] - center_lng)**2
        )
        radius = float(np.max(distances)) * 111000  # Convert degrees to meters
        
        # Determine risk level
        risk_level = "high" if len(cluster_reports) > 5 else "medium"
        
        # Save cluster
        cluster_doc = {
            "cluster_id": cluster_count,
            "center": {"lat": center_lat, "lng": center_lng},
            "radius": radius,
            "points": [str(r["_id"]) for r in cluster_reports],
            "riskLevel": risk_level,
            "timestamp": datetime.utcnow()
        }
        
        await clusters_collection.insert_one(cluster_doc)
        cluster_count += 1
    
    return {
        "message": "Clustering completed",
        "clusters": cluster_count,
        "reports_analyzed": len(reports)
    }
