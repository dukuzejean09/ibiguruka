"""
TrustBond Rwanda - Privacy-Preserving Trust Scoring System

This module implements a lightweight, privacy-first trust-scoring mechanism that:
- Uses pseudonymous device fingerprinting (128-bit non-reversible hash)
- Silently evaluates submission behavior and police feedback
- Filters prank, duplicate, and low-credibility reports
- Does NOT collect any personally identifiable information

Trust Score Range: 0-100
- 0-39: Low trust (reports delayed/excluded from real-time analysis)
- 40-69: Medium trust (reports included with reduced weight)
- 70-100: High trust (reports included with full weight)
"""

import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from motor.motor_asyncio import AsyncIOMotorCollection
from .database import get_fingerprints_collection, get_reports_collection


# Trust Score Constants
INITIAL_TRUST_SCORE = 50  # New devices start at neutral
MIN_TRUST_SCORE = 0
MAX_TRUST_SCORE = 100
LOW_TRUST_THRESHOLD = 40  # Reports from devices below this are delayed
MEDIUM_TRUST_THRESHOLD = 70

# Trust Score Adjustments
VERIFIED_REPORT_BONUS = 5  # Police verified report
FAKE_REPORT_PENALTY = -20  # Report marked as fake/prank
DUPLICATE_PENALTY = -10  # Duplicate/flood detected
RESOLVED_REPORT_BONUS = 3  # Report led to resolution
CHAT_ENGAGEMENT_BONUS = 2  # User engaged constructively in chat

# Flood Detection Constants
FLOOD_TIME_WINDOW_MINUTES = 10
FLOOD_DISTANCE_METERS = 100
FLOOD_REPORT_THRESHOLD = 4  # ≥4 similar reports triggers flood detection


def generate_device_fingerprint(device_info: Dict) -> str:
    """
    Generate a privacy-preserving 128-bit hash from device properties.
    
    The fingerprint is generated from non-personal, non-unique device properties
    that cannot be reversed to identify the user, device model, or manufacturer.
    
    Args:
        device_info: Dictionary containing device properties like:
            - screen_resolution
            - timezone_offset
            - language
            - platform
            - user_agent_hash (already hashed UA string)
            - canvas_hash (canvas fingerprint)
    
    Returns:
        A 128-bit (32 character) hex string fingerprint
    """
    # Combine device properties into a single string
    fingerprint_data = "|".join([
        str(device_info.get("screen_resolution", "")),
        str(device_info.get("timezone_offset", "")),
        str(device_info.get("language", "")),
        str(device_info.get("platform", "")),
        str(device_info.get("user_agent_hash", "")),
        str(device_info.get("canvas_hash", "")),
        str(device_info.get("audio_hash", "")),
        str(device_info.get("webgl_hash", "")),
    ])
    
    # Generate SHA-256 hash and truncate to 128 bits (32 hex chars)
    full_hash = hashlib.sha256(fingerprint_data.encode()).hexdigest()
    return full_hash[:32]  # 128-bit fingerprint


async def get_or_create_fingerprint_record(
    fingerprint: str,
    fingerprints_collection: AsyncIOMotorCollection
) -> Dict:
    """
    Get existing fingerprint record or create a new one.
    
    Returns:
        Fingerprint record with trust_score and metadata
    """
    record = await fingerprints_collection.find_one({"fingerprint": fingerprint})
    
    if not record:
        # Create new fingerprint record
        record = {
            "fingerprint": fingerprint,
            "trust_score": INITIAL_TRUST_SCORE,
            "report_count": 0,
            "verified_count": 0,
            "fake_count": 0,
            "duplicate_count": 0,
            "last_report_time": None,
            "last_report_location": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "score_history": [{
                "score": INITIAL_TRUST_SCORE,
                "reason": "initial",
                "timestamp": datetime.utcnow()
            }]
        }
        await fingerprints_collection.insert_one(record)
    
    return record


async def update_trust_score(
    fingerprint: str,
    adjustment: int,
    reason: str,
    fingerprints_collection: AsyncIOMotorCollection
) -> int:
    """
    Update trust score for a fingerprint.
    
    Args:
        fingerprint: Device fingerprint hash
        adjustment: Score change (positive or negative)
        reason: Reason for adjustment
        fingerprints_collection: MongoDB collection
    
    Returns:
        New trust score
    """
    record = await get_or_create_fingerprint_record(fingerprint, fingerprints_collection)
    
    # Calculate new score within bounds
    old_score = record.get("trust_score", INITIAL_TRUST_SCORE)
    new_score = max(MIN_TRUST_SCORE, min(MAX_TRUST_SCORE, old_score + adjustment))
    
    # Update record
    await fingerprints_collection.update_one(
        {"fingerprint": fingerprint},
        {
            "$set": {
                "trust_score": new_score,
                "updated_at": datetime.utcnow()
            },
            "$push": {
                "score_history": {
                    "$each": [{
                        "score": new_score,
                        "adjustment": adjustment,
                        "reason": reason,
                        "timestamp": datetime.utcnow()
                    }],
                    "$slice": -50  # Keep last 50 history entries
                }
            }
        }
    )
    
    return new_score


async def check_for_flood(
    fingerprint: str,
    location: Dict,
    fingerprints_collection: AsyncIOMotorCollection,
    reports_collection: AsyncIOMotorCollection
) -> bool:
    """
    Check if this submission constitutes a flood/spam attack.
    
    Detects ≥4 similar reports from same fingerprint within 10 minutes
    and 100 meters.
    
    Returns:
        True if flood detected, False otherwise
    """
    time_threshold = datetime.utcnow() - timedelta(minutes=FLOOD_TIME_WINDOW_MINUTES)
    
    # Find recent reports from this fingerprint
    recent_reports = await reports_collection.find({
        "deviceFingerprint": fingerprint,
        "timestamp": {"$gte": time_threshold}
    }).to_list(length=100)
    
    if len(recent_reports) < FLOOD_REPORT_THRESHOLD - 1:
        return False
    
    # Check how many are within 100 meters of the new location
    nearby_count = 0
    for report in recent_reports:
        report_loc = report.get("location", {})
        if _calculate_distance(location, report_loc) <= FLOOD_DISTANCE_METERS:
            nearby_count += 1
    
    # If ≥3 recent nearby reports exist, this 4th one triggers flood detection
    if nearby_count >= FLOOD_REPORT_THRESHOLD - 1:
        # Update fingerprint with flood penalty
        await update_trust_score(
            fingerprint,
            DUPLICATE_PENALTY,
            "flood_detection",
            fingerprints_collection
        )
        await fingerprints_collection.update_one(
            {"fingerprint": fingerprint},
            {"$inc": {"duplicate_count": 1}}
        )
        return True
    
    return False


def _calculate_distance(loc1: Dict, loc2: Dict) -> float:
    """
    Calculate approximate distance between two coordinates in meters.
    Uses simplified equirectangular approximation.
    """
    import math
    
    lat1 = loc1.get("lat", 0)
    lng1 = loc1.get("lng", 0)
    lat2 = loc2.get("lat", 0)
    lng2 = loc2.get("lng", 0)
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    
    # Approximate distance using equirectangular projection
    x = (lng2 - lng1) * math.cos((lat1_rad + lat2_rad) / 2)
    y = lat2 - lat1
    
    # Convert degrees to meters (1 degree ≈ 111km at equator)
    distance = math.sqrt(x*x + y*y) * 111000
    
    return distance


async def calculate_report_weight(fingerprint: str, fingerprints_collection: AsyncIOMotorCollection) -> float:
    """
    Calculate the weight of a report based on device trust score.
    
    Returns:
        Weight between 0.0 and 1.0 for clustering algorithm
    """
    record = await get_or_create_fingerprint_record(fingerprint, fingerprints_collection)
    trust_score = record.get("trust_score", INITIAL_TRUST_SCORE)
    
    # Normalize to 0.0-1.0 range
    weight = trust_score / MAX_TRUST_SCORE
    
    # Reports below LOW_TRUST_THRESHOLD get minimal weight
    if trust_score < LOW_TRUST_THRESHOLD:
        weight = 0.1  # Minimal influence on clustering
    
    return weight


async def should_delay_report(fingerprint: str, fingerprints_collection: AsyncIOMotorCollection) -> bool:
    """
    Determine if a report should be delayed for manual review.
    
    Reports from fingerprints with trust_score < 40 are delayed 1-2 hours
    or until manually approved.
    
    Returns:
        True if report should be delayed, False if shown immediately
    """
    record = await get_or_create_fingerprint_record(fingerprint, fingerprints_collection)
    trust_score = record.get("trust_score", INITIAL_TRUST_SCORE)
    
    return trust_score < LOW_TRUST_THRESHOLD


async def process_police_feedback(
    report_id: str,
    action: str,
    fingerprints_collection: AsyncIOMotorCollection,
    reports_collection: AsyncIOMotorCollection
) -> Dict:
    """
    Process police feedback on a report and update trust score accordingly.
    
    Args:
        report_id: The report ID
        action: One of 'verify', 'fake', 'resolve'
        fingerprints_collection: MongoDB collection
        reports_collection: MongoDB collection
    
    Returns:
        Updated report and fingerprint info
    """
    from bson import ObjectId
    
    # Get the report
    report = await reports_collection.find_one({"_id": ObjectId(report_id)})
    if not report:
        return {"error": "Report not found"}
    
    fingerprint = report.get("deviceFingerprint", "anonymous")
    
    if fingerprint == "anonymous":
        return {"message": "Anonymous report - no trust adjustment"}
    
    if action == "verify":
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
    elif action == "fake":
        new_score = await update_trust_score(
            fingerprint,
            FAKE_REPORT_PENALTY,
            f"report_fake:{report_id}",
            fingerprints_collection
        )
        await fingerprints_collection.update_one(
            {"fingerprint": fingerprint},
            {"$inc": {"fake_count": 1}}
        )
    elif action == "resolve":
        new_score = await update_trust_score(
            fingerprint,
            RESOLVED_REPORT_BONUS,
            f"report_resolved:{report_id}",
            fingerprints_collection
        )
    else:
        return {"error": f"Unknown action: {action}"}
    
    return {
        "fingerprint": fingerprint[:8] + "...",  # Partially masked
        "action": action,
        "new_trust_score": new_score
    }


async def get_abuse_analytics(fingerprints_collection: AsyncIOMotorCollection) -> Dict:
    """
    Get abuse analytics for admin dashboard.
    
    Returns:
        Analytics data including flagged trends, low-trust fingerprints, etc.
    """
    # Get total fingerprints
    total_fingerprints = await fingerprints_collection.count_documents({})
    
    # Get low-trust fingerprints (< 40)
    low_trust_count = await fingerprints_collection.count_documents({
        "trust_score": {"$lt": LOW_TRUST_THRESHOLD}
    })
    
    # Get high-trust fingerprints (> 70)
    high_trust_count = await fingerprints_collection.count_documents({
        "trust_score": {"$gte": MEDIUM_TRUST_THRESHOLD}
    })
    
    # Get top offenders (most fake reports)
    top_offenders_cursor = fingerprints_collection.find({
        "fake_count": {"$gt": 0}
    }).sort("fake_count", -1).limit(10)
    
    top_offenders = []
    async for fp in top_offenders_cursor:
        top_offenders.append({
            "fingerprint_masked": fp["fingerprint"][:8] + "...",
            "trust_score": fp["trust_score"],
            "fake_count": fp["fake_count"],
            "duplicate_count": fp.get("duplicate_count", 0),
            "report_count": fp.get("report_count", 0)
        })
    
    # Trust score distribution
    distribution = {
        "very_low": await fingerprints_collection.count_documents({"trust_score": {"$lt": 20}}),
        "low": await fingerprints_collection.count_documents({"trust_score": {"$gte": 20, "$lt": 40}}),
        "medium": await fingerprints_collection.count_documents({"trust_score": {"$gte": 40, "$lt": 70}}),
        "high": await fingerprints_collection.count_documents({"trust_score": {"$gte": 70, "$lt": 90}}),
        "very_high": await fingerprints_collection.count_documents({"trust_score": {"$gte": 90}})
    }
    
    return {
        "total_fingerprints": total_fingerprints,
        "low_trust_count": low_trust_count,
        "high_trust_count": high_trust_count,
        "medium_trust_count": total_fingerprints - low_trust_count - high_trust_count,
        "top_offenders": top_offenders,
        "trust_distribution": distribution,
        "generated_at": datetime.utcnow().isoformat()
    }


async def cleanup_old_fingerprints(fingerprints_collection: AsyncIOMotorCollection) -> int:
    """
    Purge fingerprint data older than 30 days for privacy compliance.
    
    Returns:
        Number of records deleted
    """
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    result = await fingerprints_collection.delete_many({
        "updated_at": {"$lt": thirty_days_ago}
    })
    
    return result.deleted_count
