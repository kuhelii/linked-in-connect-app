from typing import List, Dict, Optional
from pymongo.collection import Collection
from datetime import datetime
from searchagent.models import users_collection
from searchagent.utils import filter_users_by_distance, get_relative_time_string
from searchagent.linkedin_service import LinkedInSearchService
import logging

logger = logging.getLogger(__name__)

linkedin_service = LinkedInSearchService()

def search_nearby_users(
    lat: str = "",
    lng: str = "",
    radius: str = "10",
    user_id: Optional[str] = None
) -> Dict:
    print("Nearby users search initiated")
    print(f"Request params: lat={lat}, lng={lng}, radius={radius}, user_id={user_id}")

    if not lat or not lng:
        print("Missing coordinates - lat:", lat, "lng:", lng)
        return {"error": "Latitude and longitude are required"}, 400

    try:
        latitude = float(lat)
        longitude = float(lng)
        radius_km = float(radius)
        if radius_km <= 0:
            raise ValueError("Radius must be positive")
        print("Converted coordinates:", {"latitude": latitude, "longitude": longitude, "radius_km": radius_km})
    except (ValueError, TypeError) as e:
        print("Invalid coordinates or radius:", e)
        return {"error": "Invalid coordinates or radius"}, 400

    # Update authenticated user's location
    if user_id:
        print("Updating authenticated user's location")
        try:
            users_collection.update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "coords": {"type": "Point", "coordinates": [longitude, latitude]},
                        "location": f"{latitude}, {longitude}",
                        "lastLocationUpdate": datetime.now().isoformat(),
                    }
                }
            )
            print("User location updated successfully")
        except Exception as e:
            print("Failed to update user location:", e)

    print("Fetching all users from database")
    query = {"_id": {"$ne": user_id}} if user_id else {}
    users = list(
        users_collection.find(query, {
            "_id": 1,
            "name": 1,
            "headline": 1,
            "profileImage": 1,
            "location": 1,
            "isAnonymous": 1,
            # "coords": 1,
            "lastLocationUpdate": 1,
        })
    )
    print(f"Found {len(users)} users with valid coordinates")

    # Calculate distances and filter
    nearby_users = filter_users_by_distance(users, latitude, longitude, radius_km)
    print(f"Found {len(nearby_users)} users within {radius_km}km radius")

    # Limit and transform
    limited_users = nearby_users[:50]
    transformed_users = []

    for user in limited_users:
        last_visit = (
            get_relative_time_string(user["lastLocationUpdate"])
            if user.get("lastLocationUpdate")
            else None
        )

        # Optional: calculate bearing if needed
        bearing = None
        coords = user.get("coords", {}).get("coordinates")
        if coords:
            user_lng, user_lat = coords
            bearing = calculate_bearing(latitude, longitude, user_lat, user_lng)

        transformed_users.append({
            "_id": str(user["_id"]),
            "name": "Anonymous User" if user.get("isAnonymous") else user.get("name", ""),
            "headline": "" if user.get("isAnonymous") else user.get("headline", ""),
            "profileImage": "" if user.get("isAnonymous") else user.get("profileImage", ""),
            "location": "" if user.get("isAnonymous") else user.get("location", ""),
            "distance": user["distance"],
            "bearing": bearing,
            "lastVisit": last_visit,
            "isAnonymous": user.get("isAnonymous", False),
        })

    print("Transformed users data:", transformed_users)

    response_data = {
        "success": True,
        "data": {
            "users": transformed_users,
            "count": len(transformed_users),
            "searchRadius": radius_km,
            "searchCenter": {"lat": latitude, "lng": longitude},
            "calculationMethod": "haversine",
        },
    }

    print("Sending response:", response_data)
    return response_data, 200

async def search_people(job: Optional[str] = None, location: Optional[str] = None) -> Dict:
    logger.info(f"search_people called with job={job}, location={location}")
    if not job and not location:
        logger.error("At least one of job or location is required")
        return {"error": "At least one of job or location is required"}
    try:
        result = await linkedin_service.search_linked_in_profiles(location or "", job or "")
        logger.info(f"Found {len(result['profiles'])} LinkedIn profiles")
        return {
            "success": True,
            "data": {
                "profiles": result["profiles"],
                "count": len(result["profiles"]),
                "currentPage": result["currentPage"],
                "hasNextPage": result["hasNextPage"],
            },
        }
    except Exception as e:
        logger.error(f"Failed to search LinkedIn profiles: {e}")
        return {"error": f"Failed to search LinkedIn profiles: {str(e)}"}

def search_random() -> Dict:
    logger.info("search_random called")
    try:
        user = users_collection.aggregate([{"$sample": {"size": 1}}]).next()
        last_visit = (
            get_relative_time_string(user["lastLocationUpdate"])
            if user.get("lastLocationUpdate")
            else None
        )
        logger.info(f"Found random random user: {user['_id']}")
        return {
            "success": True,
            "data": {
                "_id": str(user["_id"]),
                "name": "Anonymous User" if user.get("isAnonymous") else user.get("name", ""),
                "headline": "" if user.get("isAnonymous") else user.get("headline", ""),
                "profileImage": "" if user.get("isAnonymous") else user.get("profileImage", ""),
                "location": "" if user.get("isAnonymous") else user.get("location", ""),
                "lastVisit": last_visit,
                "isAnonymous": user.get("isAnonymous", False),
            },
        }
    except Exception as e:
        logger.error(f"Failed to find random user: {e}")
        return {"error": f"Failed to find random user: {str(e)}"}