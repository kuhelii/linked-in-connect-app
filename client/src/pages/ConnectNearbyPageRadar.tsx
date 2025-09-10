import React, { useEffect, useMemo, useState, useRef } from "react";
import { useQuery } from "react-query";
import { toast } from "react-hot-toast";
import { MapPinIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { RefreshCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { connectService } from "../services/connectService";
import type { NearbyUsersResponse } from "../services/connectService";
import { FriendButton } from "../components/FriendButton";
import type { NearbyUser } from "../types";

type LatLng = { lat: number; lng: number };

interface RadarDot {
  x: number;
  y: number;
  user: NearbyUser;
  cluster?: NearbyUser[];
  isAtCenter?: boolean;
}

const RADAR_SIZE = 360;
const RAD = RADAR_SIZE / 2;
const CIRCLE_RADII = [RAD * 0.33, RAD * 0.66, RAD];
const CLUSTER_THRESHOLD_PX = 44;
const CENTER_RING_RADIUS = 38;
const MAX_AVATAR = 34;
const MIN_AVATAR = 18; // ensure minimum avatar size when many users

function seededHash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

function jitterForUser(u: NearbyUser, scale = 6) {
  const h = seededHash(u._id || u.name || "");
  const angle = (h % 360) * (Math.PI / 180);
  const r = (h % scale) + 2;
  return { dx: Math.cos(angle) * r, dy: Math.sin(angle) * r };
}

function polarToCartesian(distanceNorm: number, bearingDeg: number) {
  const angleRad = (bearingDeg - 90) * (Math.PI / 180);
  const r = distanceNorm * RAD;
  return {
    x: RAD + r * Math.cos(angleRad),
    y: RAD + r * Math.sin(angleRad),
  };
}

function initials(name: string) {
  return name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function safeDistanceKm(d?: number) {
  if (typeof d !== "number" || Number.isNaN(d) || d < 0) return undefined;
  return d;
}
function safeBearingDeg(b?: number) {
  if (typeof b !== "number" || Number.isNaN(b)) return undefined;
  return ((b % 360) + 360) % 360;
}

function formatDistance(distanceKm?: number) {
  if (distanceKm == null) return "distance unknown";
  if (distanceKm < 0.001) return "right here";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  if (distanceKm < 1000) return `${distanceKm.toFixed(1)} km away`;
  return `${(distanceKm / 1000).toFixed(1)}k km away`;
}

function directionText(bearing?: number) {
  if (bearing == null) return "";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(bearing / 45) % 8;
  return dirs[idx];
}

export const ConnectNearbyPageRadar: React.FC = () => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(10);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<NearbyUser[] | null>(
    null
  );
  const [showOnlyWithBearing, setShowOnlyWithBearing] = useState(false);

  const clusterModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedCluster) return;
    function handleClick(event: MouseEvent | TouchEvent) {
      if (
        clusterModalRef.current &&
        !clusterModalRef.current.contains(event.target as Node)
      ) {
        setSelectedCluster(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [selectedCluster]);

  const {
    data: nearbyUsers,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<NearbyUsersResponse, Error>(
    ["nearbyUsers", location?.lat, location?.lng, radius],
    () => connectService.findNearbyUsers(location!.lat, location!.lng, radius),
    { enabled: !!location, staleTime: 2 * 60 * 1000 }
  );

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coords = await connectService.getCurrentLocation();
      setLocation(coords);
      toast.success("Location found");
    } catch {
      toast.error(
        "Unable to get your location. Please enable location services."
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const { radarDots, listableUsers, totalPlotted, totalUnplotted } =
    useMemo(() => {
      const all = nearbyUsers?.users ?? [];
      const listable = [...all];
      const candidates = showOnlyWithBearing
        ? all.filter((u) => safeBearingDeg(u.bearing) != null)
        : all;

      const rawDots: Omit<RadarDot, "cluster">[] = [];
      for (const user of candidates) {
        const dKm = safeDistanceKm(user.distance);
        const bDeg = safeBearingDeg(user.bearing);
        if (dKm == null && bDeg == null) continue;

        let distanceNorm = 0;
        let isAtCenter = false;

        if (dKm == null) distanceNorm = 0.95;
        else if (dKm < 0.01) {
          isAtCenter = true;
          const { dx, dy } = jitterForUser(user, 10);
          const angle = Math.atan2(dy, dx);
          const x = RAD + Math.cos(angle) * CENTER_RING_RADIUS;
          const y = RAD + Math.sin(angle) * CENTER_RING_RADIUS;
          rawDots.push({ user, x, y, isAtCenter });
          continue;
        } else distanceNorm = Math.min(dKm / Math.max(radius, 0.0001), 1);

        const bearing = bDeg ?? 0;
        let { x, y } = polarToCartesian(distanceNorm, bearing);
        const { dx, dy } = jitterForUser(user, 8);
        x += dx;
        y += dy;

        rawDots.push({ user, x, y, isAtCenter });
      }

      const clustered: RadarDot[] = [];
      for (const dot of rawDots) {
        const existing = clustered.find(
          (d) => Math.hypot(d.x - dot.x, d.y - dot.y) < CLUSTER_THRESHOLD_PX
        );
        if (existing) {
          if (!existing.cluster) existing.cluster = [existing.user];
          existing.cluster.push(dot.user);
        } else {
          clustered.push({ ...dot });
        }
      }

      let avatar = MAX_AVATAR;
      const n = clustered.length;
  if (n > 120) avatar = MIN_AVATAR;
      else if (n > 80) avatar = 20;
      else if (n > 50) avatar = 24;
      else if (n > 30) avatar = 28;

      clustered.forEach((c: any) => (c.__avatar = avatar));
      const totalUnplottedCount = all.length - rawDots.length;
      return {
        radarDots: clustered,
        listableUsers: listable,
        totalPlotted: clustered.length,
        totalUnplotted: totalUnplottedCount < 0 ? 0 : totalUnplottedCount,
      };
    }, [nearbyUsers, radius, showOnlyWithBearing]);

  const anyUsers = (nearbyUsers?.users?.length ?? 0) > 0;

  if (!location && !isGettingLocation) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-neutral-900">
            Find Nearby Users
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Give location access to plot users around you on a live radar.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
            <MapPinIcon className="w-12 h-12 text-neutral-600 " />
          </div>
          <button
            onClick={getCurrentLocation}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-lg font-medium"
          >
            Enable Location
          </button>
          <p className="text-sm text-neutral-500 ">
            We only use your coordinates client side to query proximity.
          </p>
        </div>
      </div>
    );
  }

  if (isGettingLocation) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 ">
            Find Nearby Users
          </h1>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="text-neutral-600 ">Getting your location</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 ">
          Nearby Users Radar
        </h1>
        <p className="text-neutral-600 ">
          {nearbyUsers?.count ?? 0} users within {radius} km
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="text-sm font-medium text-neutral-700  min-w-fit">
              Radius
            </label>
            <input
              type="range"
              min={1}
              max={1000}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-56 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-neutral-600  min-w-fit">
              {radius} km
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-neutral-900"
                checked={showOnlyWithBearing}
                onChange={(e) => setShowOnlyWithBearing(e.target.checked)}
              />
              show only users with direction
            </label>

            <button
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-4 py-2 rounded-lg font-medium disabled:opacity-60"
            >
              <RefreshCcw
                className={`w-4 h-4 ${
                  isLoading || isFetching ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-neutral-500 ">
          {totalUnplotted > 0
            ? `${totalUnplotted} user(s) have unknown distance and direction. They are listed on the right panel.`
            : `All plot-eligible users are shown on the radar.`}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 /20 border border-red-200  rounded-xl p-6">
          <p className="text-red-600">Failed to load users. Try refreshing.</p>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center">
            <div className="relative w-80 h-80">
              <svg
                viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
                className="absolute inset-0 w-full h-full"
              >
                {/* rings */}
                {CIRCLE_RADII.map((r) => (
                  <circle
                    key={r}
                    cx={RAD}
                    cy={RAD}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-neutral-300 "
                  />
                ))}
                {/* cardinal lines */}
                {[0, 90, 180, 270].map((angle) => (
                  <line
                    key={angle}
                    x1={RAD}
                    y1={RAD}
                    x2={RAD + RAD * Math.cos(((angle - 90) * Math.PI) / 180)}
                    y2={RAD + RAD * Math.sin(((angle - 90) * Math.PI) / 180)}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-neutral-200 "
                  />
                ))}
                {/* center dot */}
                <circle cx={RAD} cy={RAD} r={5} className="fill-neutral-900 " />

                {/* plotted users */}
                {radarDots.map((dot: any, i) => {
                  const size = dot.__avatar as number;
                  const half = size / 2;
                  // cluster node
                  if (dot.cluster && dot.cluster.length > 1) {
                    const preview = dot.cluster.slice(0, 3);
                    return (
                      <motion.g
                        key={`c-${i}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.08 }}
                        className="cursor-pointer"
                        onClick={() => setSelectedCluster(dot.cluster!)}
                      >
                        <circle
                          cx={dot.x}
                          cy={dot.y}
                          r={half + 14}
                          className="fill-neutral-400 "
                        />
                        {preview.map((u: NearbyUser, idx: number) =>
                          u.profileImage ? (
                            <image
                              key={u._id || `${u.name}-${idx}`}
                              href={u.profileImage}
                              x={dot.x - half + idx * (half * 0.7)}
                              y={dot.y - half + idx * (half * 0.35)}
                              width={size}
                              height={size}
                              clipPath={`circle(${half}px at center)`}
                            />
                          ) : (
                            <g key={u._id || `${u.name}-${idx}`}>
                              <circle
                                cx={dot.x - half + idx * (half * 0.7) + half}
                                cy={dot.y - half + idx * (half * 0.35) + half}
                                r={half}
                                className="fill-neutral-300 stroke-neutral-400"
                                strokeWidth={1}
                              />
                              <text
                                x={dot.x - half + idx * (half * 0.7) + half}
                                y={dot.y - half + idx * (half * 0.35) + half}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[8px] fill-neutral-800 font-semibold pointer-events-none"
                              >
                                {initials(u.name || "U")}
                              </text>
                            </g>
                          )
                        )}
                      </motion.g>
                    );
                  }
                  // single user node with pfp
                  const u = dot.user as NearbyUser;
                  return (
                    <motion.g
                      key={`u-${u._id || i}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={"cursor-pointer"}
                    >
                      {u.profileImage ? (
                        <motion.image
                          href={u.profileImage}
                          x={dot.x - half}
                          y={dot.y - half}
                          width={size}
                          height={size}
                          clipPath={`circle(${half}px at center)`}
                          whileHover={{ scale: 1.15 }}
                          onClick={() => setSelectedUser(u)}
                          className="cursor-pointer"
                        />
                      ) : (
                        <motion.g
                          whileHover={{ scale: 1.15 }}
                          onClick={() => setSelectedUser(u)}
                        >
                          <circle
                            cx={dot.x}
                            cy={dot.y}
                            r={half}
                            className="fill-neutral-300  stroke-neutral-400 "
                            strokeWidth={1}
                          />
                          <text
                            x={dot.x}
                            y={dot.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[10px] md:text-xs fill-neutral-800  font-semibold pointer-events-none"
                          >
                            {initials(u.name || "U")}
                          </text>
                        </motion.g>
                      )}
                    </motion.g>
                  );
                })}
              </svg>

              {(isLoading || isFetching) && (
                <div className="absolute inset-0 bg-white/50 50 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 "></div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-center w-full">
                <div className="inline-flex items-center gap-4 bg-white/80 80 backdrop-blur px-3 py-1 rounded-full text-xs text-neutral-700  border border-neutral-200 ">
                  <span>
                    Rings at ~{Math.round(radius / 3)} km, ~
                    {Math.round((2 * radius) / 3)} km, {radius} km
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">
                    {totalPlotted} plotted
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edge case notices under radar */}
          <div className="mt-4 text-xs text-neutral-500  space-y-1">
            {!anyUsers && (
              <div>No users found. Increase radius or try later.</div>
            )}
            {anyUsers && totalPlotted === 0 && (
              <div>
                No users could be plotted on the radar due to missing bearings
                or distances. They are listed on the right.
              </div>
            )}
          </div>
        </div>

        {/* Right panel: List or Details */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {selectedUser ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 ">
                  User Details
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg hover:bg-neutral-100 "
                  aria-label="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                {selectedUser.profileImage ? (
                  <img
                    src={selectedUser.profileImage}
                    alt={selectedUser.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-neutral-300 flex items-center justify-center font-semibold text-neutral-900 ">
                    {initials(selectedUser.name || "U")}
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-lg text-neutral-900 ">
                    {selectedUser.name}
                  </h4>
                  {selectedUser.headline && (
                    <p className="text-neutral-600 ">{selectedUser.headline}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-neutral-100 text-neutral-800  px-2 py-1 rounded-full text-xs">
                      {formatDistance(safeDistanceKm(selectedUser.distance))}
                    </span>
                    {safeBearingDeg(selectedUser.bearing) != null && (
                      <span className="bg-neutral-100 text-neutral-800  px-2 py-1 rounded-full text-xs">
                        {directionText(safeBearingDeg(selectedUser.bearing))} (
                        {Math.round(safeBearingDeg(selectedUser.bearing)!)}
                        °)
                      </span>
                    )}
                    {selectedUser.lastVisit && (
                      <span className="bg-neutral-100 text-neutral-800  px-2 py-1 rounded-full text-xs">
                        Last seen {selectedUser.lastVisit}
                      </span>
                    )}
                  </div>
                  {!selectedUser.isAnonymous && (
                    <div className="pt-2">
                      <FriendButton
                        userId={selectedUser._id}
                        className="w-full"
                        userName={selectedUser.name}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 ">
                  Nearby Users
                </h3>
              </div>

              {anyUsers ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {listableUsers.map((u) => (
                    <div
                      key={u._id}
                      className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50  cursor-pointer transition-colors"
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="flex items-center gap-3">
                        {u.profileImage ? (
                          <img
                            src={u.profileImage}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center text-sm font-semibold">
                            {initials(u.name || "U")}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900  truncate">
                            {u.name}
                          </p>
                          {u.headline && (
                            <p className="text-sm text-neutral-600  truncate">
                              {u.headline}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 ">
                            <span>
                              {formatDistance(safeDistanceKm(u.distance))}
                            </span>
                            {safeBearingDeg(u.bearing) != null && (
                              <span>
                                • {directionText(safeBearingDeg(u.bearing))}
                              </span>
                            )}
                            {u.lastVisit && <span>• {u.lastVisit}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
                    <UserPlusIcon className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h4 className="text-neutral-900  font-semibold">
                    No users found
                  </h4>
                  <p className="text-neutral-600 ">
                    Widen the radius or try again later.
                  </p>
                  <button
                    onClick={() => setRadius((r) => Math.min(r * 2, 50))}
                    className="bg-neutral-900 hover:bg-neutral-800 -white px-4 py-2 rounded-lg font-medium"
                  >
                    Expand to {Math.min(radius * 2, 50)} km
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cluster Modal */}
      <AnimatePresence>
        {selectedCluster && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={clusterModalRef}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full"
              initial={{ scale: 0.9, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 ">
                  Users in this spot
                </h3>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="p-2 rounded-lg hover:bg-neutral-100 "
                  aria-label="Close cluster"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {selectedCluster.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100  cursor-pointer"
                    onClick={() => {
                      setSelectedUser(u);
                      setSelectedCluster(null);
                    }}
                  >
                    {u.profileImage ? (
                      <img
                        src={u.profileImage}
                        alt={u.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-300 flex items-center justify-center font-semibold">
                        {initials(u.name || "U")}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900  truncate">
                        {u.name}
                      </p>
                      {u.headline && (
                        <p className="text-sm text-neutral-600  truncate">
                          {u.headline}
                        </p>
                      )}
                      <div className="text-xs text-neutral-500 ">
                        {formatDistance(safeDistanceKm(u.distance))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
