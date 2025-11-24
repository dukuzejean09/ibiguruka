import time
import os
import requests
from datetime import datetime, timedelta
from pymongo import MongoClient
from sklearn.cluster import DBSCAN
import numpy as np

# Configuration
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'neighborwatch')
API_URL = os.getenv('API_URL', 'http://localhost:8000')
REFRESH_INTERVAL = 600  # 10 minutes

def connect_to_db():
    """Connect to MongoDB"""
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    return db

def fetch_recent_reports(db):
    """Fetch reports from last 24 hours"""
    reports_collection = db['reports']
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    reports = list(reports_collection.find({
        'timestamp': {'$gte': twenty_four_hours_ago}
    }))
    
    return reports

def run_dbscan_clustering(reports):
    """Run DBSCAN clustering algorithm"""
    if len(reports) < 2:
        print("Not enough reports for clustering")
        return []
    
    # Extract coordinates
    coords = np.array([[r['location']['lat'], r['location']['lng']] for r in reports])
    
    # Run DBSCAN
    # eps=0.005 degrees ≈ 500 meters
    # min_samples=3 minimum points to form a cluster
    db = DBSCAN(eps=0.005, min_samples=3).fit(coords)
    labels = db.labels_
    
    # Group into clusters
    unique_labels = set(labels)
    clusters = []
    
    for label in unique_labels:
        if label == -1:  # Skip noise points
            continue
        
        # Get points in this cluster
        mask = labels == label
        cluster_reports = [reports[i] for i, m in enumerate(mask) if m]
        cluster_coords = coords[mask]
        
        # Calculate center
        center_lat = float(np.mean(cluster_coords[:, 0]))
        center_lng = float(np.mean(cluster_coords[:, 1]))
        
        # Calculate radius (in meters)
        distances = np.sqrt(
            (cluster_coords[:, 0] - center_lat)**2 + 
            (cluster_coords[:, 1] - center_lng)**2
        )
        radius = float(np.max(distances)) * 111000  # Convert degrees to meters
        
        # Determine risk level
        num_reports = len(cluster_reports)
        if num_reports > 10:
            risk_level = "critical"
        elif num_reports > 5:
            risk_level = "high"
        else:
            risk_level = "medium"
        
        clusters.append({
            'cluster_id': int(label),
            'center': {'lat': center_lat, 'lng': center_lng},
            'radius': radius,
            'points': [str(r['_id']) for r in cluster_reports],
            'riskLevel': risk_level,
            'reportCount': num_reports,
            'timestamp': datetime.utcnow()
        })
    
    return clusters

def save_clusters(db, clusters):
    """Save clusters to database"""
    clusters_collection = db['clusters']
    
    if clusters:
        # Clear old clusters (older than 1 hour)
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        clusters_collection.delete_many({'timestamp': {'$lt': one_hour_ago}})
        
        # Insert new clusters
        clusters_collection.insert_many(clusters)
        print(f"✅ Saved {len(clusters)} clusters to database")
    else:
        print("ℹ️  No clusters found")

def main():
    """Main clustering service loop"""
    print("🚀 DBSCAN Clustering Service Started")
    print(f"   MongoDB: {MONGODB_URL}")
    print(f"   Database: {DATABASE_NAME}")
    print(f"   Refresh Interval: {REFRESH_INTERVAL}s ({REFRESH_INTERVAL//60} minutes)")
    print("-" * 60)
    
    db = connect_to_db()
    print("✅ Connected to MongoDB")
    
    iteration = 0
    while True:
        try:
            iteration += 1
            print(f"\n[Iteration #{iteration}] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("Running DBSCAN clustering...")
            
            # Fetch reports
            reports = fetch_recent_reports(db)
            print(f"📊 Fetched {len(reports)} reports from last 24 hours")
            
            # Run clustering
            clusters = run_dbscan_clustering(reports)
            print(f"🔍 Found {len(clusters)} clusters")
            
            # Save to database
            save_clusters(db, clusters)
            
            # Print cluster details
            if clusters:
                print("\n📍 Cluster Details:")
                for cluster in clusters:
                    print(f"   Cluster #{cluster['cluster_id']}: "
                          f"{cluster['reportCount']} reports, "
                          f"Risk: {cluster['riskLevel'].upper()}, "
                          f"Center: ({cluster['center']['lat']:.4f}, {cluster['center']['lng']:.4f})")
            
            print(f"\n😴 Sleeping for {REFRESH_INTERVAL//60} minutes...")
            print("-" * 60)
            time.sleep(REFRESH_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\n⚠️  Service stopped by user")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print(f"   Retrying in 60 seconds...")
            time.sleep(60)

if __name__ == "__main__":
    main()
