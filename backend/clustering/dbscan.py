import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from sklearn.cluster import DBSCAN
import numpy as np
import time

# Initialize Firebase (Mock credentials for now or use default)
# cred = credentials.Certificate('path/to/serviceAccountKey.json')
# firebase_admin.initialize_app(cred)
# db = firestore.client()

def fetch_reports():
    # Mock data for prototype
    print("Fetching reports from Firestore...")
    # docs = db.collection('reports').stream()
    # reports = [doc.to_dict() for doc in docs]
    reports = [
        {'id': '1', 'lat': -1.95, 'lng': 30.06},
        {'id': '2', 'lat': -1.951, 'lng': 30.061},
        {'id': '3', 'lat': -1.94, 'lng': 30.07}
    ]
    return reports

def run_clustering(reports):
    if not reports:
        return []
    
    coords = np.array([[r['lat'], r['lng']] for r in reports])
    
    # DBSCAN: eps is distance (approx 0.001 deg ~ 100m), min_samples is min points
    db = DBSCAN(eps=0.001, min_samples=2).fit(coords)
    labels = db.labels_
    
    clusters = {}
    for i, label in enumerate(labels):
        if label != -1: # -1 is noise
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(reports[i])
            
    return clusters

def update_clusters(clusters):
    print(f"Found {len(clusters)} clusters.")
    for label, points in clusters.items():
        print(f"Cluster {label}: {len(points)} reports")
        # db.collection('clusters').add({...})

if __name__ == "__main__":
    while True:
        print("Running clustering job...")
        reports = fetch_reports()
        clusters = run_clustering(reports)
        update_clusters(clusters)
        print("Sleeping for 10 minutes...")
        time.sleep(600) # Run every 10 mins
