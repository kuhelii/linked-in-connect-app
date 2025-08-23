/**
 * Calculate the bearing (direction) from point A to point B
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Convert degrees to radians
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLon = toRadians(lon2 - lon1);

  // Calculate bearing
  const y = Math.cos(lat2Rad) * Math.sin(deltaLon);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon);

  // Convert to degrees and normalize to 0-360
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;

  return Math.round(bearing * 100) / 100; // Round to 2 decimal places
}

/**
 * Get relative time string from timestamp
 * @param timestamp Date when location was last updated
 * @returns Human readable time string like "5 mins ago"
 */
export function getRelativeTimeString(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

/**
 * Calculate the great-circle distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  // Differences in coordinates
  const deltaLat = lat2Rad - lat1Rad;
  const deltaLon = lon2Rad - lon1Rad;

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.asin(Math.sqrt(a));

  // Distance in kilometers
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Extract coordinates from user object (either from coords field or location string)
 * @param user User object with coords or location
 * @returns [longitude, latitude] or null if no valid coordinates
 */
export function extractCoordinates(user: any): [number, number] | null {
  // First, try to get coordinates from coords field
  if (
    user.coords &&
    user.coords.coordinates &&
    Array.isArray(user.coords.coordinates)
  ) {
    const [lon, lat] = user.coords.coordinates;
    if (
      typeof lon === "number" &&
      typeof lat === "number" &&
      !(lon === 0 && lat === 0)
    ) {
      return [lon, lat];
    }
  }

  // If coords field is not available or invalid, try location string
  if (user.location && typeof user.location === "string") {
    const locationParts = user.location
      .split(",")
      .map((part: string) => part.trim());
    if (locationParts.length === 2) {
      const lat = parseFloat(locationParts[0]);
      const lon = parseFloat(locationParts[1]);
      if (!isNaN(lat) && !isNaN(lon) && !(lat === 0 && lon === 0)) {
        return [lon, lat];
      }
    }
  }

  return null;
}

/**
 * Filter users by distance from a reference point
 * @param users Array of users with coordinates (either in coords field or location string)
 * @param refLat Reference latitude
 * @param refLon Reference longitude
 * @param maxDistance Maximum distance in kilometers
 * @returns Filtered users with calculated distances
 */
export function filterUsersByDistance<
  T extends { coords?: { coordinates: [number, number] }; location?: string }
>(
  users: T[],
  refLat: number,
  refLon: number,
  maxDistance: number
): (T & { distance: number })[] {
  return users
    .map((user) => {
      const coordinates = extractCoordinates(user);
      if (!coordinates) {
        return null;
      }

      const [userLon, userLat] = coordinates;
      const distance = calculateDistance(refLat, refLon, userLat, userLon);

      return {
        ...user,
        distance,
      };
    })
    .filter(
      (user): user is T & { distance: number } =>
        user !== null && user.distance <= maxDistance
    )
    .sort((a, b) => a.distance - b.distance);
}
