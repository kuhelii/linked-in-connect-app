import { calculateDistance, filterUsersByDistance } from "./distance";

// Test the Haversine formula with known distances
console.log("Testing Haversine Distance Calculations");
console.log("=====================================");

// Test 1: Distance between New York and Los Angeles
const nyLat = 40.7128,
  nyLon = -74.006;
const laLat = 34.0522,
  laLon = -118.2437;
const nyToLa = calculateDistance(nyLat, nyLon, laLat, laLon);
console.log(`New York to Los Angeles: ${nyToLa} km (expected ~3944 km)`);

// Test 2: Distance between London and Paris
const londonLat = 51.5074,
  londonLon = -0.1278;
const parisLat = 48.8566,
  parisLon = 2.3522;
const londonToParis = calculateDistance(
  londonLat,
  londonLon,
  parisLat,
  parisLon
);
console.log(`London to Paris: ${londonToParis} km (expected ~344 km)`);

// Test 3: Same location (should be 0)
const sameLocation = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
console.log(`Same location: ${sameLocation} km (expected 0 km)`);

// Test 4: Small distance (within a city)
const manhattan1 = { lat: 40.7831, lon: -73.9712 }; // Central Park
const manhattan2 = { lat: 40.7505, lon: -73.9934 }; // Times Square
const centralParkToTimesSquare = calculateDistance(
  manhattan1.lat,
  manhattan1.lon,
  manhattan2.lat,
  manhattan2.lon
);
console.log(
  `Central Park to Times Square: ${centralParkToTimesSquare} km (expected ~3.5 km)`
);

console.log("\nTesting User Filtering");
console.log("======================");

// Mock users for testing
const mockUsers = [
  {
    _id: "1",
    name: "User 1",
    coords: { coordinates: [-73.9712, 40.7831] as [number, number] }, // Central Park
  },
  {
    _id: "2",
    name: "User 2",
    coords: { coordinates: [-73.9934, 40.7505] as [number, number] }, // Times Square
  },
  {
    _id: "3",
    name: "User 3",
    coords: { coordinates: [-118.2437, 34.0522] as [number, number] }, // Los Angeles
  },
  {
    _id: "4",
    name: "User 4",
    coords: { coordinates: [0, 0] as [number, number] }, // Invalid coordinates
  },
];

// Filter users within 5km of Central Park
const nearbyUsers = filterUsersByDistance(mockUsers, 40.7831, -73.9712, 5);
console.log("Users within 5km of Central Park:");
nearbyUsers.forEach((user) => {
  console.log(`- ${(user as any).name}: ${user.distance} km`);
});

console.log("\nAll tests completed!");
