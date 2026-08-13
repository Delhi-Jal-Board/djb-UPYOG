import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Dropdown, Loader } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { reverseGeocode, getAreaName, calculateDistance as geoDistance } from "../utils/geocodingUtils";

// Custom marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create custom icons
const onlineIcon = L.divIcon({
  className: "blinking-green-dot",
  html: `
    <div style="position: relative;">
      <div style="
        width: 14px;
        height: 14px;
        background: #4caf50;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.8);
        z-index: 2;
        position: relative;
        animation: blink 1s infinite ease-in-out;
      "></div>
      <div style="
        position: absolute;
        top: -6px;
        left: -6px;
        width: 26px;
        height: 26px;
        background: rgba(76, 175, 80, 0.3);
        border-radius: 50%;
        animation: pulse 2s infinite;
        z-index: 1;
      "></div>
      <style>
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      </style>
    </div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const offlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const Address = ({ lat, lng, fallback = "Resolving area" }) => {
  const [address, setAddress] = useState(fallback);

  useEffect(() => {
    const resolve = async () => {
      if (lat != null && lng != null) {
        const data = await reverseGeocode(lat, lng);
        setAddress(getAreaName(data));
      }
    };
    resolve();
  }, [lat, lng]);

  return <span title={`${lat?.toFixed(6)}, ${lng?.toFixed(6)}`}>{address}</span>;
};

const SOCKET_URL = "https://ejalsewa.nitcon.in";

// Component to handle map centering

const MapController = ({ selectedDriver, mapZoom, mapCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedDriver?.lat && selectedDriver?.lng) {
      map.setView([selectedDriver.lat, selectedDriver.lng], mapZoom || 15, {
        animate: true,
        duration: 1,
      });
    }
  }, [selectedDriver, map]);

  useEffect(() => {
    if (Array.isArray(mapCenter) && mapCenter.length === 2) {
      map.setView(mapCenter, mapZoom || 15, {
        animate: true,
        duration: 1,
      });
    }
  }, [mapCenter, map]);

  useEffect(() => {
    if (mapZoom) {
      map.setZoom(mapZoom); // ✅ THIS IS THE KEY FIX
    }
  }, [mapZoom, map]);

  return null;
};

// Custom hook for route fetching
const useRoute = (start, end) => {
  const { t } = useTranslation();
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!start || !end) return;

    const fetchRoute = async () => {
      setLoading(true);
      try {
        // Using OSRM public API
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`
        );

        if (!response.ok) throw new Error(t("FAILED_TO_FETCH_ROUTE"));

        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
          const coordinates = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

          setRouteData({
            coordinates,
            distance: route.distance,
            duration: route.duration,
            legs: route.legs,
          });
        }
      } catch (err) {
        console.error(t("Error fetching route:"), err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [start?.lat, start?.lng, end?.lat, end?.lng]);

  return { routeData, loading, error };
};


// Component to display route on map
const RouteLayer = ({ start, end, color = "#2196f3", weight = 6 }) => {
  const { t } = useTranslation();
  const { routeData, loading, error } = useRoute(start, end);
  const [showSteps, setShowSteps] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  if (loading) {
    return (

      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "white",
          padding: "8px 16px",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        {t("LOADING_ROUTE")}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "#ffebee",
          color: "#c62828",
          padding: "8px 16px",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        {t("ERROR_LOADING_ROUTE")}{error}
      </div>
    );
  }

  if (!routeData) return null;


  return (
    <React.Fragment>
      {/* Clean solid blue route line */}
      <Polyline
        positions={routeData.coordinates}
        color="#1F5FA8"
        weight={5}
        opacity={0.8}
        lineJoin="round"
      />

      {/* Route information panel */}
      {(selectedStep || showSteps) && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "10px",
            right: "10px",
            background: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxWidth: "calc(100% - 20px)",
            border: "1px solid #e0e0e0",
            maxHeight: "50vh",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h4 style={{ margin: 0, color: "#1F5FA8" }}>{t("ROUTE_INFORMATION")}</h4>
            <button
              onClick={() => setShowSteps(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#666",
                padding: "0 8px",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div>
              <strong>{t("TOTAL_DISTANCE")}:</strong> {(routeData.distance / 1000).toFixed(2)} km
            </div>
            <div>
              <strong>{t("ESTIMATED_TIME")}:</strong> {Math.round(routeData.duration / 60)} minutes
            </div>
          </div>

          {selectedStep && (
            <div
              style={{
                padding: "8px",
                background: "#f5f5f5",
                borderRadius: "4px",
                marginBottom: "8px",
              }}
            >
              <div>
                <strong>{t("CURRENT_STEP")}:</strong> {selectedStep.maneuver.type}
              </div>
              <div>
                <strong>{t("INSTRUCTION")}:</strong> {selectedStep.maneuver.instruction || selectedStep.name}
              </div>
              <div>
                <strong>{t("DISTANCE")}:</strong> {(selectedStep.distance / 1000).toFixed(2)} km
              </div>
              <div>
                <strong>{t("DURATION")}:</strong> {Math.round(selectedStep.duration / 60)} min
              </div>
            </div>
          )}

          {showSteps && routeData.legs && (
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              <h5 style={{ margin: "8px 0", color: "#666" }}>{t("TURN_BY_TURN_DIRECTIONS")}:</h5>
              {routeData.legs[0].steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #eee",
                    fontSize: "12px",
                    cursor: "pointer",
                    background: selectedStep === step ? "#e3f2fd" : "transparent",
                  }}
                  onMouseEnter={() => setSelectedStep(step)}
                  onMouseLeave={() => setSelectedStep(null)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#1F5FA8",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: "500" }}>{step.maneuver.instruction || step.name}</div>
                      <div style={{ color: "#666" }}>
                        {(step.distance / 1000).toFixed(2)} km · {Math.round(step.duration / 60)} min
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
};


const StatusBadge = ({ isOnline }) => (
  <span
    style={{
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
      backgroundColor: isOnline ? "#e6f7e6" : "#ffe6e6",
      color: isOnline ? "#2e7d32" : "#c62828",
      border: `1px solid ${isOnline ? "#a5d6a7" : "#ef9a9a"}`,
    }}
  >
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: isOnline ? "#4caf50" : "#f44336",
        marginRight: "6px",
      }}
    />
    {isOnline ? "ONLINE" : "OFFLINE"}
  </span>
);


const DriverCard = ({ driver, isSelected, onClick, vendorList }) => {
  const { t } = useTranslation();
  const [currentAddress, setCurrentAddress] = useState("Resolving area...");
  const [deliveryAddress, setDeliveryAddress] = useState("Resolving area...");
  const lastResolvedPos = useRef({ lat: null, lng: null });
  const lastResolvedDest = useRef({ lat: null, lng: null });

  useEffect(() => {
    const resolveCurrent = async () => {
      if (driver.lat && driver.lng) {
        const dist = lastResolvedPos.current.lat
          ? geoDistance(lastResolvedPos.current.lat, lastResolvedPos.current.lng, driver.lat, driver.lng)
          : Infinity;
        if (dist > 0.2) {
          const data = await reverseGeocode(driver.lat, driver.lng);
          setCurrentAddress(getAreaName(data));
          lastResolvedPos.current = { lat: driver.lat, lng: driver.lng };
        }
      }
    };
    resolveCurrent();
  }, [driver.lat, driver.lng]);

  useEffect(() => {
    const resolveDest = async () => {
      if (driver.activeDeliveryLat && driver.activeDeliveryLng) {
        const dist = lastResolvedDest.current.lat
          ? geoDistance(lastResolvedDest.current.lat, lastResolvedDest.current.lng, driver.activeDeliveryLat, driver.activeDeliveryLng)
          : Infinity;
        if (dist > 0.2) {
          const data = await reverseGeocode(driver.activeDeliveryLat, driver.activeDeliveryLng);
          setDeliveryAddress(getAreaName(data));
          lastResolvedDest.current = { lat: driver.activeDeliveryLat, lng: driver.activeDeliveryLng };
        }
      }
    };
    resolveDest();
  }, [driver.activeDeliveryLat, driver.activeDeliveryLng]);

  const driverDetails = useMemo(() => {
    if (!vendorList || !vendorList.length) return { name: "Unknown", vehicle: "N/A" };
    for (const vendor of vendorList) {
      const match = vendor.drivers?.find(d =>
        d.id === driver.driverId || d.owner?.mobileNumber === driver.driverId || d.owner?.uuid === driver.driverId
      );
      if (match) {
        return {
          name: match.owner?.name || "Unknown",
          vehicle: vendor.vehicles?.[0]?.registrationNumber || "N/A"
        };
      }
    }
    return { name: "Unknown", vehicle: "N/A" };
  }, [vendorList, driver.driverId]);

  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px",
        borderRadius: "8px",
        background: isSelected ? "#f0f4ff" : "white",
        border: `2px solid ${isSelected ? "#1F5FA8" : "#f0f0f0"}`,
        cursor: "pointer",
        position: "relative",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: "#f0f2f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          👤
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0d47a1" }}>
                DRV-{driver.driverId.substring(0, 4).toUpperCase()}
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                {driverDetails.name} • {driverDetails.vehicle}
              </div>
            </div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "4px",
                background: driver.isOnline ? "#e8f5e9" : "#ffebee",
                color: driver.isOnline ? "#2e7d32" : "#c62828",
              }}
            >
              {driver.isOnline ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "#aaa", marginBottom: "2px" }}>{t("CURRENT_LOCATION")}</div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentAddress}
          </div>
        </div>
      </div>
      <div>
        <div>

          <div style={{ fontSize: "10px", fontWeight: "600", color: "#aaa", marginBottom: "2px" }}>{t("DESTINATION")}</div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {deliveryAddress}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function LiveTrackingSystem() {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [drivers, setDrivers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOnline, setFilterOnline] = useState("all");
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);
  const [mapZoom, setMapZoom] = useState(12);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [selectedFillingPoint, setSelectedFillingPoint] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const { data: fillingPointData } = Digit.Hooks.wt.useFillPointSearch({
    tenantId,
    filters: { status: "ACTIVE" },
  });

  const fillingPointOptions = useMemo(() => {
    return fillingPointData?.fillingPoints || [];
  }, [fillingPointData]);

  const { data: vendorOptions } = Digit.Hooks.fsm.useVendorSearch({
    tenantId,
    filters: {
      status: "ACTIVE",
      ...(selectedFillingPoint?.id ? { fillingPointId: selectedFillingPoint?.id } : {}),
    },
    config: {
      select: (data) => data?.vendor || [],
    },
  });

  const filteredVendorOptions = useMemo(() => {
    return vendorOptions || [];
  }, [vendorOptions]);
  useEffect(() => {
    if (vendorOptions?.length && Object.keys(drivers).length) {
      console.log("=== VENDOR DEBUG ===");
      console.log("Vendor[0] vehicles:", vendorOptions[0]?.vehicles);
      console.log("Vendor[0] drivers:", vendorOptions[0]?.drivers?.map(d => ({
        id: d.id,
        mobile: d.owner?.mobileNumber,
        uuid: d.owner?.uuid,
      })));
      console.log("Socket driverId example:", Object.keys(drivers)[0]);
    }
  }, [vendorOptions, drivers]);

  const handleFillingPointSelect = (value) => {
    setSelectedFillingPoint(value);
    setSelectedVendor(null);
  };

  // Check for mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check initial size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const socket = useMemo(() => {
    return io(SOCKET_URL, {
      path: "/driver-tanker-tracker-service/socket.io",
      transports: ["websocket"],
      autoConnect: false,
    });
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Admin connected:", socket.id);
      setIsConnected(true);
      socket.emit("admin-join");
    });

    socket.on("disconnect", () => {
      console.log("Admin disconnected");
      setIsConnected(false);
    });

    socket.on("drivers-snapshot", (data) => {
      console.log("drivers-snapshot", data);

      if (!Array.isArray(data)) return;

      const mapped = {};
      data.forEach((driver) => {
        if (driver && driver.driverId) {
          mapped[driver.driverId] = {
            ...driver,
            lastUpdate: new Date().toISOString(),
          };
        }
      });

      setDrivers(mapped);
    });

    socket.on("driver-location-update", (driver) => {
      console.log("driver-location-update", driver);

      if (!driver || !driver.driverId) return;

      setDrivers((prev) => {
        const existingDriver = prev[driver.driverId] || {};
        return {
          ...prev,
          [driver.driverId]: {
            ...existingDriver,
            ...driver,
            lastUpdate: new Date().toISOString(),
          },
        };
      });
    });

    socket.on("driver-status", (driver) => {
      console.log("driver-status", driver);

      if (!driver || !driver.driverId) return;

      setDrivers((prev) => ({
        ...prev,
        [driver.driverId]: {
          ...prev[driver.driverId],
          ...driver,
          lastUpdate: new Date().toISOString(),
        },
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  // When selected driver changes, update map center
  useEffect(() => {
    if (selectedDriver?.lat && selectedDriver?.lng) {
      setMapCenter([selectedDriver.lat, selectedDriver.lng]);
      setMapZoom(15);
    }
  }, [selectedDriver]);

  const filteredDrivers = Object.values(drivers).filter((driver) => {
    const matchesSearch = driver.driverId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterOnline === "all" ||
      (filterOnline === "online" && driver.isOnline) ||
      (filterOnline === "offline" && !driver.isOnline);

    // Filling point filter: selected vendor ke fillingPoint se match karo
    // (vendor already fillingPoint se filter ho chuka hai dropdown mein)
    const matchesFillingPoint = !selectedFillingPoint || (() => {
      if (!vendorOptions || !vendorOptions.length) return false;
      // Check karo ki driver kisi aisi vendor ka part hai jo is filling point se linked hai
      return vendorOptions.some((vendor) => {
        return vendor.drivers?.some((d) =>
          d.owner?.mobileNumber === driver.driverId ||
          d.owner?.uuid === driver.driverId ||
          d.id === driver.driverId ||
          String(d.owner?.mobileNumber) === String(driver.driverId) ||
          String(d.owner?.uuid) === String(driver.driverId)
        );
      });
    })();

    // Vendor filter: selected vendor ke drivers se match karo
    const matchesVendor = !selectedVendor || (() => {
      const vendorDriverIds = selectedVendor.drivers?.map((d) => [
        d.owner?.mobileNumber,
        d.owner?.uuid,
        d.id,
        String(d.owner?.mobileNumber),
        String(d.owner?.uuid),
      ]).flat().filter(Boolean) || [];

      return vendorDriverIds.some((id) => driver.driverId === id);
    })();

    return matchesSearch && matchesStatus && matchesFillingPoint && matchesVendor;
  });

  const onlineCount = Object.values(drivers).filter((d) => d.isOnline).length;
  const offlineCount = Object.values(drivers).filter((d) => !d.isOnline).length;
  const activeDeliveries = Object.values(drivers).filter((d) => d.isOnline && d.activeDeliveryLat && d.activeDeliveryLng).length;

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#f0f2f5",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          background: "white",
          padding: "12px 24px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          border: "2px solid #1F5FA844",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0d47a1" }}>
              {t("WT_LIVE_DRIVER_TRACKING")}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#e8f5e9",
                color: "#2e7d32",

                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                border: "1px solid #c8e6c9",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isConnected ? "#4caf50" : "#f44336",
                  boxShadow: isConnected ? "0 0 8px #4caf50" : "none",
                }}
              />
              {/* {isConnected ? "CONNECTED" : "DISCONNECTED"} */}
            </div>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#666" }}>
            {t("REAL_TIME_TELEMETRY_AND_FLEET_COORDINATION")}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { label: t("TOTAL_FLEET"), value: Object.keys(drivers).length, color: "#0d47a1" },
            { label: t("ONLINE"), value: onlineCount, color: "#2e7d32" },
            { label: t("OFFLINE"), value: offlineCount, color: "#c62828" },
            { label: t("ACTIVE"), value: activeDeliveries, color: "#0d47a1" },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: "#f8f9fa",
                padding: "8px 16px",
                borderRadius: "8px",
                minWidth: "100px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #e0e0e0",
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#888", marginBottom: "4px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "16px",
          overflow: "hidden",
        }}
      >
        {/* Mobile Menu Button - simplified as we have a header now */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            style={{
              position: "absolute",
              top: "80px",
              left: "20px",
              zIndex: 2000,
              background: "#1F5FA8",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {showSidebar ? "Close" : "Menu"}
          </button>
        )}

        {/* Sidebar */}
        <div
          style={{
            width: isMobile ? (showSidebar ? "100%" : "0") : "360px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "transparent",
            position: isMobile ? "absolute" : "relative",
            top: 0,
            left: 0,
            zIndex: 1500,
            transition: "all 0.3s ease-in-out",
            ...(isMobile && !showSidebar && { width: "0", opacity: 0, pointerEvents: "none" }),
          }}
        >
          {showSidebar && (
            <React.Fragment>
              <div
                style={{
                  padding: "12px",
                  background: "white",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #e0e0e0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#888", letterSpacing: "1px" }}>
                    {t("WT_FILTER_FLEET")}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedFillingPoint(null);
                      setSelectedVendor(null);
                      setSearchTerm("");
                      setFilterOnline("all");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1F5FA8",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {t("WT_RESET_ALL")}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#888" }}>{t("WT_SELECT_FILLING_POINT")}</label>
                    <Dropdown
                      t={t}
                      option={fillingPointOptions}
                      optionKey="fillingPointName"
                      select={handleFillingPointSelect}
                      selected={selectedFillingPoint}
                      placeholder={t("WT_SELECT_FILLING_POINT")}
                      style={{ width: "100%", margin: 0 }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#888" }}>{t("WT_SELECT_VENDOR")}</label>
                    <Dropdown
                      t={t}
                      option={filteredVendorOptions}
                      optionKey="name"
                      select={setSelectedVendor}
                      selected={selectedVendor}
                      placeholder={t("WT_SELECT_VENDOR")}
                      style={{ width: "100%", margin: 0 }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "700", color: "#888" }}>{t("WT_SEARCH_DRIVER_BY_ID")}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#888" }}>🔍</span>
                      <input
                        type="text"
                        placeholder={t("WT_SEARCH_DRIVER_BY_ID")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 10px 10px 36px",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          fontSize: "12px",
                          outline: "none",
                          background: "#f8f9fa",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["all", "online", "offline"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setFilterOnline(filter)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "4px",
                          background: filterOnline === filter ? "#1F5FA8" : "transparent",
                          color: filterOnline === filter ? "white" : "#666",
                          border: filterOnline === filter ? "none" : "1px solid #e0e0e0",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "capitalize",
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="checkbox"
                      id="showRoutes"
                      checked={showRoutes}
                      onChange={(e) => setShowRoutes(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <label htmlFor="showRoutes" style={{ fontSize: "12px", color: "#666", cursor: "pointer" }}>Routes</label>
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "4px",
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {filteredDrivers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
                      <p>{t("WT_NO_DRIVERS_FOUND")}</p>
                    </div>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <DriverCard
                        key={driver.driverId}
                        driver={driver}
                        isSelected={selectedDriver?.driverId === driver.driverId}
                        vendorList={vendorOptions}
                        onClick={() => {
                          setSelectedDriver(driver);
                          if (isMobile) setShowSidebar(false);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </React.Fragment>
          )}
        </div>

        <div
          style={{
            flex: 1,
            height: "100%",
            minHeight: 0,
            position: "relative",
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: "1px solid #e0e0e0",
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            {/* <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            /> */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <MapController selectedDriver={selectedDriver} mapZoom={mapZoom} mapCenter={mapCenter} />

            {/* Fleet Markers */}
            {filteredDrivers
              .filter((d) => d.driverId !== selectedDriver?.driverId)
              .map((driver) => (
                <Marker
                  key={driver.driverId}
                  position={[Number(driver.lat), Number(driver.lng)]}
                  icon={driver.isOnline ? onlineIcon : offlineIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedDriver(driver);
                    },
                  }}
                />
              ))}

            {selectedDriver && selectedDriver.lat != null && selectedDriver.lng != null && (
              <Marker
                key={selectedDriver.driverId}
                position={[Number(selectedDriver.lat), Number(selectedDriver.lng)]}
                icon={selectedDriver.isOnline ? onlineIcon : offlineIcon}
              >
                <Popup>
                  <div style={{ minWidth: isMobile ? "200px" : "250px", padding: "8px" }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: isMobile ? "14px" : "16px",
                        color: "#1F5FA8",
                        marginBottom: "8px",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "4px",
                      }}
                    >
                      Driver #{selectedDriver.driverId.substring(0, 8)}... (Selected)
                    </div>

                    <div style={{ marginBottom: "8px" }}>
                      <StatusBadge isOnline={selectedDriver.isOnline} />
                    </div>

                    <div style={{ fontSize: isMobile ? "12px" : "13px" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Current Location</strong>
                        <div><Address lat={selectedDriver.lat} lng={selectedDriver.lng} /></div>
                      </div>

                      {selectedDriver.activeDeliveryLat && selectedDriver.activeDeliveryLng && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong>{t("DELIVERY_DESTINATION")}</strong>
                          <div><Address lat={selectedDriver.activeDeliveryLat} lng={selectedDriver.activeDeliveryLng} /></div>
                        </div>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          background: "#f5f5f5",
                          padding: "8px",
                          borderRadius: "4px",
                          marginTop: "8px",
                        }}
                      >
                        {selectedDriver.speed && (
                          <React.Fragment>
                            <span>{t("WT_SPEED")}:</span>
                            <span>{(selectedDriver.speed * 3.6).toFixed(1)} {t("WT_KM_PER_HOUR")}</span>
                          </React.Fragment>
                        )}
                        {selectedDriver.heading && (
                          <React.Fragment>
                            <span>{t("WT_HEADING")}:</span>
                            <span>{Math.round(selectedDriver.heading)}°</span>
                          </React.Fragment>
                        )}
                        {selectedDriver.accuracy && (
                          <React.Fragment>
                            <span>{t("WT_ACCURACY")}:</span>
                            <span>{Math.round(selectedDriver.accuracy)}m</span>
                          </React.Fragment>
                        )}
                      </div>

                      {selectedDriver.lastUpdate && (
                        <div style={{ marginTop: "8px", color: "#666", fontSize: "10px" }}>
                          {t("WT_LAST_UPDATE")}: {new Date(selectedDriver.lastUpdate).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {selectedDriver && selectedDriver.activeDeliveryLat != null && selectedDriver.activeDeliveryLng != null && (
              <Marker
                key={`dest-${selectedDriver.driverId}`}
                position={[Number(selectedDriver.activeDeliveryLat), Number(selectedDriver.activeDeliveryLng)]}
                icon={destinationIcon}
              />
            )}

            {showRoutes && selectedDriver && selectedDriver.lat && selectedDriver.lng && selectedDriver.activeDeliveryLat && selectedDriver.activeDeliveryLng && (
              <RouteLayer
                start={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
                end={{ lat: selectedDriver.activeDeliveryLat, lng: selectedDriver.activeDeliveryLng }}
                color="#2196f3"
                weight={6}
              />
            )}
          </MapContainer>

          {/* Map Controls - Mobile Responsive */}
          <div
            style={{
              position: "absolute",
              top: isMobile ? "60px" : "20px",
              right: "10px",
              zIndex: 1000,
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              padding: "4px",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "4px",
            }}
          >
            {selectedDriver && (
              <React.Fragment>
                <button
                  onClick={() => {
                    if (selectedDriver?.lat && selectedDriver?.lng) {
                      const center = [Number(selectedDriver.lat), Number(selectedDriver.lng)];
                      setMapCenter(center);
                      setMapZoom(15);
                    }
                  }}
                  style={{
                    padding: isMobile ? "10px 12px" : "8px 16px",
                    background: "#1F5FA8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: isMobile ? "12px" : "14px",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("WT_CENTER")}
                </button>
                <button
                  onClick={() => setSelectedDriver(null)}
                  style={{
                    padding: isMobile ? "10px 12px" : "8px 16px",
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: isMobile ? "12px" : "14px",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("WT_CLEAR")}
                </button>
              </React.Fragment>
            )}
            {!selectedDriver && (
              <div
                style={{
                  padding: isMobile ? "10px 12px" : "8px 16px",
                  background: "#f5f5f5",
                  color: "#666",
                  borderRadius: "4px",
                  fontSize: isMobile ? "12px" : "14px",
                }}
              >
                {isMobile ? "Select driver" : "Select a driver from the list"}
              </div>
            )}
          </div>

          {/* Selected driver info panel - Mobile Responsive */}
          {selectedDriver && (
            <div
              style={{
                position: "absolute",
                bottom: isMobile ? "10px" : "20px",
                left: isMobile ? "10px" : "20px",
                right: isMobile ? "10px" : "auto",
                zIndex: 1000,
                background: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                padding: isMobile ? "12px" : "16px",
                maxWidth: isMobile ? "calc(100% - 20px)" : "300px",
                border: "2px solid #2196f3",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, color: "#1F5FA8", fontSize: isMobile ? "14px" : "16px" }}>{t("WT_SELECTED_DRIVER")}</h4>
                <StatusBadge isOnline={selectedDriver.isOnline} />
              </div>
              <div style={{ fontSize: isMobile ? "12px" : "13px" }}>
                <div>
                  <strong>{t("WT_ID")}:</strong> {selectedDriver.driverId.substring(0, 6).toUpperCase()}...
                </div>
                <div>
                  <strong>{t("WT_LOCATION")}:</strong> <Address lat={selectedDriver.lat} lng={selectedDriver.lng} />
                </div>
                {selectedDriver.speed && (
                  <div>
                    <strong>{t("WT_SPEED")}:</strong> {Math.round(selectedDriver.speed * 3.6)} {t("km/h")}
                  </div>
                )}
                {selectedDriver.lastSeen && (
                  <div>
                    <strong>{t("WT_LAST_SEEN")}:</strong> {new Date(selectedDriver.lastSeen).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Logic Controls */}
          <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => setMapZoom((prev) => prev + 1)}
              style={{
                width: "32px",
                height: "32px",
                background: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "18px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              +
            </button>
            <button
              onClick={() => setMapZoom((prev) => prev - 1)}
              style={{
                width: "32px",
                height: "32px",
                background: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "18px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              −
            </button>
          </div>

          <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 1000, display: "flex", gap: "12px" }}>
            {/* <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                color: "#444",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              🗺️ Satellite View
            </button>
            <button
              onClick={() => {
                if (selectedDriver?.lat && selectedDriver?.lng) {
                  setMapCenter([selectedDriver.lat, selectedDriver.lng]);
                  setMapZoom(15);
                } else {
                  setMapCenter([28.6139, 77.209]);
                  setMapZoom(12);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                color: "#444",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              🎯 Recenter
            </button> */}
          </div>

          {/* <div
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              zIndex: 1000,
              background: "white",
              padding: "12px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid #e0e0e0",
              minWidth: "160px",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#888", marginBottom: "8px", textAlign: "center" }}>
              FLEET STATUS LEGEND
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { label: "Moving Online", color: "#2e7d32" },
                { label: "Stationary (Filling)", color: "#0d47a1" },
                { label: "Offline / No Signal", color: "#c62828" },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                  <span style={{ fontSize: "10px", fontWeight: "600", color: "#444" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
