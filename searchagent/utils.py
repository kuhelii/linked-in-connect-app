import math
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def to_radians(degrees: float) -> float:
    return degrees * (math.pi / 180)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371  # Earth's radius in km
    lat1_rad = to_radians(lat1)
    lon1_rad = to_radians(lon1)
    lat2_rad = to_radians(lat2)
    lon2_rad = to_radians(lon2)
    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    distance = round(R * c, 2)
    logger.debug(f"Calculated distance: {distance}km")
    return distance

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1_rad = to_radians(lat1)
    lat2_rad = to_radians(lat2)
    delta_lon = to_radians(lon2 - lon1)
    y = math.cos(lat2_rad) * math.sin(delta_lon)
    x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(delta_lon)
    bearing = math.atan2(y, x) * (180 / math.pi)
    bearing = (bearing + 360) % 360
    logger.debug(f"Calculated bearing: {bearing} degrees")
    return round(bearing, 2)

def get_relative_time_string(timestamp: str) -> str:
    now = datetime.now()
    diff = now - datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    diff_mins = diff.total_seconds() // 60
    diff_hours = diff_mins // 60
    diff_days = diff_hours // 24
    if diff_mins < 1:
        return "just now"
    if diff_mins < 60:
        return f"{int(diff_mins)} min{'s' if diff_mins != 1 else ''} ago"
    if diff_hours < 24:
        return f"{int(diff_hours)} hour{'s' if diff_hours != 1 else ''} ago"
    return f"{int(diff_days)} day{'s' if diff_days != 1 else ''} ago"

def extract_coordinates(user: Dict) -> Optional[List[float]]:
    if user.get("coords") and user["coords"].get("coordinates"):
        lon, lat = user["coords"]["coordinates"]
        if isinstance(lon, (int, float)) and isinstance(lat, (int, float)) and not (lon == 0 and lat == 0):
            logger.debug(f"Extracted coordinates from coords: ({lon}, {lat})")
            return [lon, lat]
    if user.get("location") and isinstance(user["location"], str):
        try:
            lat, lon = map(float, user["location"].split(","))
            if not (lat == 0 and lon == 0):
                logger.debug(f"Extracted coordinates from location: ({lon}, {lat})")
                return [lon, lat]
        except ValueError:
            logger.debug(f"Invalid location format: {user['location']}")
            pass
    logger.debug(f"No valid coordinates for user: {user.get('_id')}")
    return None

def filter_users_by_distance(users: List[Dict], ref_lat: float, ref_lon: float, max_distance: float) -> List[Dict]:
    result = []
    for user in users:
        coords = extract_coordinates(user)
        if not coords:
            continue
        lon, lat = coords
        distance = calculate_distance(ref_lat, ref_lon, lat, lon)
        if distance <= max_distance:
            user["distance"] = distance
            result.append(user)
    logger.info(f"Filtered {len(result)} users within {max_distance}km from ({ref_lat}, {ref_lon})")
    return sorted(result, key=lambda x: x["distance"])