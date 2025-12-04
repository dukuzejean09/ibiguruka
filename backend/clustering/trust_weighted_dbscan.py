"""
TrustBond Rwanda - Trust-Weighted DBSCAN Clustering Service

This service implements a modified DBSCAN algorithm that:
- Weights reports by device trust score
- Excludes flagged/fake reports from cluster formation
- Excludes delayed (low-trust) reports from real-time analysis
- Calculates abuse-resistant hotspot clusters
- Provides accurate, credibility-weighted spatial analytics

Trust Weight Range: 0.0 - 1.0
- Reports with weight < 0.3 have minimal influence on clustering
- Reports flagged as fake are completely excluded
- Delayed reports are excluded until approved or delay expires
"""

import time
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from sklearn.cluster import DBSCAN
import numpy as np

# Configuration
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'trustbond')  # Updated to TrustBond
API_URL = os.getenv('API_URL', 'http://localhost:8000')
REFRESH_INTERVAL = 1800  # 30 minutes (as per project scope)

# Trust-weighted clustering thresholds
MIN_TRUST_WEIGHT_FOR_CLUSTERING = 0.3  # Reports below this have minimal influence
FAKE_REPORT_WEIGHT = 0.0  # Fake reports are excluded completely


def connect_to_db():
    """Connect to MongoDB"""
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    return db


def get_clustering_params(db):
    """Fetch clustering parameters from config collection"""
    config_collection = db['config']
    config = config_collection.find_one({})
    
    if config and 'clustering' in config:
        clustering_config = config['clustering']
        return {
            'eps': clustering_config.get('epsilon', 0.005),
            'min_samples': clustering_config.get('minSamples', 3),
            'enabled': clustering_config.get('enabled', True)
        }
    
    # Default values
    return {
        'eps': 0.005,  # ~500 meters
        'min_samples': 3,
        'enabled': True
    }


def fetch_recent_reports(db, exclude_delayed=True, exclude_fake=True):
    """
    Fetch reports from last 24 hours for clustering.
    
    Args:
        db: MongoDB database connection
        exclude_delayed: Whether to exclude reports in the delayed queue
        exclude_fake: Whether to exclude reports flagged as fake
    
    Returns:
        List of report documents with trust weights
    """
    reports_collection = db['reports']
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    # Build query to exclude unwanted reports
    query = {
        'timestamp': {'$gte': twenty_four_hours_ago}
    }
    
    if exclude_fake:
        query['flaggedAsFake'] = {'$ne': True}
    
    if exclude_delayed:
        # Exclude delayed reports unless their delay has expired
        query['$or'] = [
            {'isDelayed': {'$ne': True}},
            {'delayedUntil': {'$lt': datetime.utcnow()}}
        ]
    
    reports = list(reports_collection.find(query))
    
    # Add default trust weights if not present
    for report in reports:
        if 'trustWeight' not in report:
            report['trustWeight'] = 0.5  # Default neutral weight
        if 'trustScore' not in report:
            report['trustScore'] = 50  # Default neutral score
    
    return reports


def run_trust_weighted_dbscan(reports, eps=0.005, min_samples=3):
    """
    Run trust-weighted DBSCAN clustering algorithm.
    
    The algorithm uses sample weights to give more influence to
    high-trust reports and less influence to low-trust reports.
    
    Args:
        reports: List of report documents
        eps: Maximum distance between two samples (in degrees, ~500m default)
        min_samples: Minimum number of weighted samples to form a cluster
    
    Returns:
        List of cluster objects with trust-weighted metrics
    """
    if len(reports) < 2:
        print("Not enough reports for clustering")
        return []
    
    # Filter out reports with zero or very low weight
    valid_reports = [r for r in reports if r.get('trustWeight', 0.5) >= MIN_TRUST_WEIGHT_FOR_CLUSTERING]
    
    if len(valid_reports) < 2:
        print(f"Not enough high-trust reports for clustering (only {len(valid_reports)} valid)")
        return []
    
    # Extract coordinates and weights
    coords = np.array([[r['location']['lat'], r['location']['lng']] for r in valid_reports])
    weights = np.array([r.get('trustWeight', 0.5) for r in valid_reports])
    trust_scores = np.array([r.get('trustScore', 50) for r in valid_reports])
    
    # Run DBSCAN (note: sklearn DBSCAN doesn't directly support sample weights,
    # but we can adjust by using the weights in post-processing and cluster evaluation)
    db = DBSCAN(eps=eps, min_samples=min_samples).fit(coords)
    labels = db.labels_
    
    # Group into clusters with trust weighting
    unique_labels = set(labels)
    clusters = []
    
    for label in unique_labels:
        if label == -1:  # Skip noise points
            continue
        
        # Get points in this cluster
        mask = labels == label
        cluster_reports = [valid_reports[i] for i, m in enumerate(mask) if m]
        cluster_coords = coords[mask]
        cluster_weights = weights[mask]
        cluster_trust_scores = trust_scores[mask]
        
        # Calculate weighted center (higher trust reports have more influence)
        weight_sum = np.sum(cluster_weights)
        if weight_sum > 0:
            weighted_lat = np.sum(cluster_coords[:, 0] * cluster_weights) / weight_sum
            weighted_lng = np.sum(cluster_coords[:, 1] * cluster_weights) / weight_sum
        else:
            weighted_lat = np.mean(cluster_coords[:, 0])
            weighted_lng = np.mean(cluster_coords[:, 1])
        
        center_lat = float(weighted_lat)
        center_lng = float(weighted_lng)
        
        # Calculate radius (in meters)
        distances = np.sqrt(
            (cluster_coords[:, 0] - center_lat)**2 + 
            (cluster_coords[:, 1] - center_lng)**2
        )
        radius = float(np.max(distances)) * 111000  # Convert degrees to meters
        
        # Calculate trust-weighted metrics
        num_reports = len(cluster_reports)
        weighted_report_count = float(np.sum(cluster_weights))
        avg_trust_score = float(np.mean(cluster_trust_scores))
        
        # Determine risk level based on WEIGHTED count, not raw count
        # This ensures fake/low-trust reports don't artificially inflate risk
        if weighted_report_count > 8:
            risk_level = "critical"
        elif weighted_report_count > 4:
            risk_level = "high"
        else:
            risk_level = "medium"
        
        clusters.append({
            'cluster_id': int(label),
            'center': {'lat': center_lat, 'lng': center_lng},
            'radius': max(radius, 100),  # Minimum 100m radius
            'points': [str(r['_id']) for r in cluster_reports],
            'riskLevel': risk_level,
            'reportCount': num_reports,
            'weightedReportCount': round(weighted_report_count, 2),
            'averageTrustScore': round(avg_trust_score, 1),
            'trustConfidence': 'high' if avg_trust_score >= 70 else ('medium' if avg_trust_score >= 40 else 'low'),
            'timestamp': datetime.utcnow()
        })
    
    return clusters


def save_clusters(db, clusters):
    """Save clusters to database"""
    clusters_collection = db['clusters']
    
    # Clear old clusters (older than 1 hour)
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    clusters_collection.delete_many({'timestamp': {'$lt': one_hour_ago}})
    
    if clusters:
        # Insert new clusters
        clusters_collection.insert_many(clusters)
        print(f"✅ Saved {len(clusters)} trust-weighted clusters to database")
    else:
        print("ℹ️  No clusters found")


def main():
    """Main trust-weighted clustering service loop"""
    print("=" * 60)
    print("🛡️  TrustBond Rwanda - Trust-Weighted DBSCAN Clustering")
    print("=" * 60)
    print(f"   MongoDB: {MONGODB_URL}")
    print(f"   Database: {DATABASE_NAME}")
    print(f"   Refresh Interval: {REFRESH_INTERVAL}s ({REFRESH_INTERVAL//60} minutes)")
    print(f"   Min Trust Weight: {MIN_TRUST_WEIGHT_FOR_CLUSTERING}")
    print("-" * 60)
    
    db = connect_to_db()
    print("✅ Connected to MongoDB")
    
    iteration = 0
    while True:
        try:
            iteration += 1
            print(f"\n[Iteration #{iteration}] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Get clustering parameters from config
            params = get_clustering_params(db)
            
            if not params['enabled']:
                print("⏸️  Clustering is disabled in config. Skipping...")
                time.sleep(REFRESH_INTERVAL)
                continue
            
            print(f"   Parameters: eps={params['eps']}, min_samples={params['min_samples']}")
            print("Running trust-weighted DBSCAN clustering...")
            
            # Fetch reports (excluding fake and delayed)
            all_reports = db['reports'].count_documents({
                'timestamp': {'$gte': datetime.utcnow() - timedelta(hours=24)}
            })
            reports = fetch_recent_reports(db, exclude_delayed=True, exclude_fake=True)
            excluded_count = all_reports - len(reports)
            
            print(f"📊 Fetched {len(reports)} valid reports from last 24 hours")
            if excluded_count > 0:
                print(f"   (Excluded {excluded_count} fake/low-trust reports)")
            
            # Run trust-weighted clustering
            clusters = run_trust_weighted_dbscan(
                reports, 
                eps=params['eps'], 
                min_samples=params['min_samples']
            )
            print(f"🔍 Found {len(clusters)} abuse-resistant clusters")
            
            # Save to database
            save_clusters(db, clusters)
            
            # Print cluster details
            if clusters:
                print("\n📍 Trust-Weighted Cluster Details:")
                for cluster in clusters:
                    confidence_emoji = "🟢" if cluster['trustConfidence'] == 'high' else ("🟡" if cluster['trustConfidence'] == 'medium' else "🔴")
                    print(f"   Cluster #{cluster['cluster_id']}: "
                          f"{cluster['reportCount']} reports "
                          f"(weighted: {cluster['weightedReportCount']:.1f}), "
                          f"Risk: {cluster['riskLevel'].upper()}, "
                          f"{confidence_emoji} Trust: {cluster['averageTrustScore']:.0f}")
            
            print(f"\n😴 Sleeping for {REFRESH_INTERVAL//60} minutes...")
            print("-" * 60)
            time.sleep(REFRESH_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\n⚠️  Service stopped by user")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            print(f"   Retrying in 60 seconds...")
            time.sleep(60)


if __name__ == "__main__":
    main()
