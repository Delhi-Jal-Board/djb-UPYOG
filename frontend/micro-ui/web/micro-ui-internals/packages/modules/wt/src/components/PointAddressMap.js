import React, { useMemo, useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Dropdown, Loader } from "@djb25/digit-ui-react-components";

// Custom marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const fillingPointIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const fixedPointIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12.5, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const enlargedFixedPointIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [35, 57],
  iconAnchor: [17.5, 57],
  popupAnchor: [1, -45],
  shadowSize: [50, 50]
});

// Helper to check valid coordinate numbers
const isValidCoordinate = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  const nLat = parseFloat(lat);
  const nLng = parseFloat(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    isFinite(nLat) &&
    isFinite(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180
  );
};

// Error Boundary for Map component
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("PointAddressMap error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", background: "#f8f9fa", borderRadius: "12px", border: "1px solid #ddd", margin: "20px 0" }}>
          <h3 style={{ color: "#1D4E7F", marginBottom: "8px" }}>Map View Currently Unavailable</h3>
          <p style={{ color: "#666", fontSize: "14px" }}>Unable to load map points at this moment. Please verify point coordinates.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Component to handle map bounds and centering
const ChangeView = ({ bounds, center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    try {
      if (center && isValidCoordinate(center[0], center[1])) {
        map.setView(center, zoom || 15, { animate: true });
      } else if (bounds && Array.isArray(bounds) && bounds.length > 0) {
        map.fitBounds(bounds);
      }
    } catch (e) {
      console.error("ChangeView error:", e);
    }
  }, [bounds, center, zoom, map]);
  return null;
};

const PointAddressMap = ({ fillingPoints = [], fixedPoints = [], isLoading, t }) => {
  const history = useHistory();
  const [selectedFillingPoint, setSelectedFillingPoint] = useState(null);
  const [selectedFixedPoint, setSelectedFixedPoint] = useState(null);
  const [hoveredFixedPointId, setHoveredFixedPointId] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(11);
  const markerRefs = useRef({});

  const defaultCenter = [28.6139, 77.209]; // Default center (Delhi)

  const getFpId = (fp) => fp?.id || fp?.bookingId || fp?.fillingPointId || fp?.uuid || fp?.fillingpointmetadata?.fillingPointId;

  // Fetch related fixed points via API when a filling point is selected
  const { isLoading: isRelatedLoading, data: relatedFixedPointsData } = Digit.Hooks.wt.useFixedPointSearchAPI(
    {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      filters: { 
        fillingPointId: getFpId(selectedFillingPoint),
        limit: 1000 
      },
    },
    { enabled: !!selectedFillingPoint }
  );

  const relatedFixedPoints = useMemo(() => {
    if (!selectedFillingPoint) return [];
    return relatedFixedPointsData?.waterTankerBookingDetail || [];
  }, [selectedFillingPoint, relatedFixedPointsData]);

  // Points to show on map
  const displayFillingPoints = useMemo(() => {
    if (selectedFillingPoint) {
      return [selectedFillingPoint].filter((fp) => isValidCoordinate(fp?.address?.latitude, fp?.address?.longitude));
    }
    return (fillingPoints || []).filter((fp) => isValidCoordinate(fp?.address?.latitude, fp?.address?.longitude));
  }, [fillingPoints, selectedFillingPoint]);

  const displayFixedPoints = useMemo(() => {
    return (relatedFixedPoints || []).filter((fx) => isValidCoordinate(fx?.address?.latitude, fx?.address?.longitude));
  }, [relatedFixedPoints]);

  useEffect(() => {
    if (hoveredFixedPointId) {
      const marker = markerRefs.current[hoveredFixedPointId];
      if (marker) marker.openPopup();
    } else if (selectedFixedPoint) {
      const fxId = selectedFixedPoint.id || selectedFixedPoint.applicantDetail?.applicantId;
      const marker = markerRefs.current[fxId];
      if (marker) marker.openPopup();
    } else {
      Object.values(markerRefs.current).forEach((marker) => {
        if (marker && marker.isPopupOpen && marker.isPopupOpen()) marker.closePopup();
      });
    }
  }, [hoveredFixedPointId, selectedFixedPoint]);

  const bounds = useMemo(() => {
    const allPoints = [
      ...displayFillingPoints.map((p) => [parseFloat(p.address.latitude), parseFloat(p.address.longitude)]),
      ...displayFixedPoints.map((p) => [parseFloat(p.address.latitude), parseFloat(p.address.longitude)]),
    ].filter(([lat, lng]) => isValidCoordinate(lat, lng));
    if (allPoints.length === 0) return null;
    return allPoints;
  }, [displayFillingPoints, displayFixedPoints]);

  const handleFillingPointSelect = (val) => {
    setSelectedFillingPoint(val);
    setSelectedFixedPoint(null);
    setMapCenter(null); // Clear manual center to allow fitBounds to work
  };

  const handleFixedPointSelect = (val) => {
    const currentId = selectedFixedPoint?.applicantDetail?.fixedPointId || selectedFixedPoint?.id || selectedFixedPoint?.applicantDetail?.applicantId;
    const incomingId = val?.applicantDetail?.fixedPointId || val?.id || val?.applicantDetail?.applicantId;

    if (selectedFixedPoint && currentId === incomingId) {
      setSelectedFixedPoint(null);
      // Fallback for marker ref access which might use a different ID priority
      const markerId = val.id || val.applicantDetail?.applicantId;
      const marker = markerRefs.current[markerId];
      if (marker) {
        marker.closePopup();
      }
    } else {
      setSelectedFixedPoint(val);
      if (isValidCoordinate(val?.address?.latitude, val?.address?.longitude)) {
        setMapCenter([parseFloat(val.address.latitude), parseFloat(val.address.longitude)]);
        setMapZoom(16);
      }
    }
  };

  const fixedPointOptions = useMemo(() => {
    return relatedFixedPoints.map(fx => ({
      ...fx,
      displayName: fx?.applicantDetail?.name || fx?.name || "NA"
    }));
  }, [relatedFixedPoints]);

  const handleClear = () => {
    setSelectedFillingPoint(null);
    setSelectedFixedPoint(null);
    setMapCenter(null);
    setMapZoom(11);
  };

  if (isLoading || isRelatedLoading) return <Loader />;

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: window.innerWidth < 768 ? "column" : "row",
      height: "700px", 
      width: "100%", 
      borderRadius: "12px", 
      overflow: "hidden", 
      border: "1px solid #ddd", 
      marginTop: "20px", 
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      background: "#fff"
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: window.innerWidth < 768 ? "100%" : "320px", 
        padding: "24px", 
        borderRight: "1px solid #eee",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        background: "#f9f9f9",
        zIndex: 10,
        overflowY: "auto"
      }}>
        <h3 style={{ margin: "0 0 8px 0", color: "#1D4E7F", fontSize: "20px", fontWeight: "600" }}>
          {t("WT_MAP_FILTERS")}
        </h3>
        
        <div className="filter-item">
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#666" }}>
            {t("WT_FILLING_POINT")}
          </label>
          <Dropdown
            option={fillingPoints}
            optionKey="fillingPointName"
            selected={selectedFillingPoint}
            select={handleFillingPointSelect}
            t={t}
            placeholder={t("WT_SELECT_FILLING_POINT")}
          />
        </div>

        {selectedFillingPoint && (
          <div className="filter-item" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ display: "block", marginBottom: "12px", fontSize: "14px", fontWeight: "600", color: "#1D4E7F" }}>
              {t("WT_MAPPED_FIXED_POINTS")} ({relatedFixedPoints.length})
            </label>
            <div style={{ 
              maxHeight: "350px", 
              overflowY: "auto", 
              paddingRight: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              {relatedFixedPoints.length > 0 ? (
                relatedFixedPoints.map((fx, idx) => {
                  const currentFxId = fx?.applicantDetail?.fixedPointId || fx?.id || fx?.applicantDetail?.applicantId || idx;
                  const selectedFxId = selectedFixedPoint?.applicantDetail?.fixedPointId || selectedFixedPoint?.id || selectedFixedPoint?.applicantDetail?.applicantId;
                  const isSelected = selectedFixedPoint && currentFxId === selectedFxId;
                  
                  const hoverOrMarkerId = fx.id || fx.applicantDetail?.applicantId || idx;

                  return (
                    <div 
                      key={idx}
                      onClick={() => handleFixedPointSelect(fx)}
                      onMouseEnter={() => {
                        setHoveredFixedPointId(hoverOrMarkerId);
                        if (isValidCoordinate(fx?.address?.latitude, fx?.address?.longitude)) {
                          setMapCenter([parseFloat(fx.address.latitude), parseFloat(fx.address.longitude)]);
                          setMapZoom(16);
                        }
                      }}
                      onMouseLeave={() => setHoveredFixedPointId(null)}
                      style={{
                        padding: "12px",
                        background: isSelected ? "#E6EEF5" : "#fff",
                        border: isSelected ? "1.5px solid #1D4E7F" : "1px solid #e0e0e0",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: "13px",
                        color: isSelected ? "#1D4E7F" : "#333",
                        fontWeight: isSelected ? "600" : "400",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        boxShadow: isSelected ? "0 2px 8px rgba(29, 78, 127, 0.15)" : (hoveredFixedPointId === hoverOrMarkerId ? "0 4px 12px rgba(0,0,0,0.1)" : "none"),
                        transform: hoveredFixedPointId === hoverOrMarkerId ? "translateX(4px)" : "none"
                      }}
                    >
                      <div style={{ 
                        width: "10px", 
                        height: "10px", 
                        borderRadius: "50%", 
                        background: "#417505",
                        boxShadow: "0 0 4px rgba(65, 117, 5, 0.4)",
                        marginTop: "5px",
                        flexShrink: 0
                      }}></div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "700" }}>{fx?.applicantDetail?.fixedPointId || "NA"}</span>
                            <span style={{ fontSize: "11px", color: "#888", fontWeight: "400" }}>{fx?.applicantDetail?.name || fx?.name || "NA"}</span>
                          </div>
                          <div style={{ color: "#1D4E7F", fontSize: "10px", paddingTop: "4px" }}>
                            {isSelected ? "▲" : "▼"}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #eee", fontSize: "12px", color: "#555", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div><strong>{t("WT_MOBILE_NUMBER")}:</strong> {fx?.applicantDetail?.mobileNumber || "NA"}</div>
                            <div><strong>{t("WT_LOCALITY")}:</strong> {fx?.address?.locality || "NA"}</div>
                            <div><strong>Email:</strong> {fx?.applicantDetail?.emailId || "NA"}</div>
                            <div><strong>Alt Mobile:</strong> {fx?.applicantDetail?.alternateNumber || "NA"}</div>
                            <div><strong>Address:</strong> {[fx?.address?.houseNo, fx?.address?.streetName, fx?.address?.city, fx?.address?.pincode].filter(Boolean).join(", ") || "NA"}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const idToEdit = fx?.id || fx?.applicantDetail?.applicantId;
                                history.push(`/digit-ui/employee/wt/add-fix-point-address?id=${idToEdit}`);
                              }}
                              style={{
                                marginTop: "8px",
                                padding: "6px 12px",
                                background: "#F47738", // DIGIT primary orange
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                alignSelf: "flex-start",
                                transition: "background 0.2s"
                              }}
                              onMouseEnter={(e) => e.target.style.background = "#D6662E"}
                              onMouseLeave={(e) => e.target.style.background = "#F47738"}
                            >
                              Edit Fixed Point
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "13px", border: "1px dashed #ccc", borderRadius: "8px" }}>
                  {t("WT_NO_MAPPED_POINTS")}
                </div>
              )}
            </div>
          </div>
        )}

        <button 
          onClick={handleClear}
          style={{ 
            marginTop: "auto",
            padding: "12px",
            background: "#fff",
            border: "1px solid #1D4E7F",
            color: "#1D4E7F",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => { e.target.style.background = "#1D4E7F"; e.target.style.color = "#fff"; }}
          onMouseOut={(e) => { e.target.style.background = "#fff"; e.target.style.color = "#1D4E7F"; }}
        >
          {t("ES_COMMON_CLEAR_ALL")}
        </button>

        {selectedFillingPoint && (
          <div style={{ marginTop: "20px", padding: "16px", background: "#fff", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#333", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
              {t("WT_SUMMARY")}
            </h4>
            <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#777" }}>{t("WT_FIXED_POINTS")}:</span>
                <span style={{ fontWeight: "600" }}>{relatedFixedPoints.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#777" }}>{t("WT_LOCALITY")}:</span>
                <span style={{ fontWeight: "600" }}>{selectedFillingPoint.address?.locality || "NA"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer 
          center={defaultCenter} 
          zoom={11} 
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView bounds={bounds} center={mapCenter} zoom={mapZoom} />
          
          {/* Filling Point Markers */}
          {displayFillingPoints.map((fp, index) => (
            <React.Fragment key={`fp-group-${fp.id || index}`}>
              <Circle
                center={[parseFloat(fp.address.latitude), parseFloat(fp.address.longitude)]}
                radius={5000} // 5KM in meters
                pathOptions={{ 
                  color: "#0d2745ff", 
                  fillColor: "#041a34ff", 
                  fillOpacity: 0.1,
                  weight: 1,
                  dashArray: "5, 5" 
                }}
              />
              <Marker 
                key={`fp-${fp.id || index}`} 
                position={[parseFloat(fp.address.latitude), parseFloat(fp.address.longitude)]}
                icon={fillingPointIcon}
                eventHandlers={{
                  mouseover: (e) => e.target.openPopup(),
                  mouseout: (e) => e.target.closePopup()
                }}
              >
                <Popup>
                  <div style={{ padding: "8px", minWidth: "200px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#1F5FA8", fontSize: "16px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                      {fp.fillingPointName} (Filling Point)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>{t("WT_FILLING_POINT_CODE")}:</strong> {fp.fillingPointId}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>{t("WT_LOCALITY")}:</strong> {fp.address?.locality || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>{t("WT_AE_NAME")}:</strong> {fp?.aeName || "NA"} ({fp?.aeMobile || "NA"})</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>{t("WT_JE_NAME")}:</strong> {fp?.jeName || "NA"} ({fp?.jeMobile || "NA"})</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>{t("WT_EE_NAME")}:</strong> {fp?.eeName || "NA"} ({fp?.eeMobile || "NA"})</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>Latitude:</strong> {fp.address?.latitude || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>Longitude:</strong> {fp.address?.longitude || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#1F5FA8" }}><strong>Coverage:</strong> 5 KM Radius</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* Fixed Point Markers */}
          {displayFixedPoints.map((fx, index) => {
            const fxId = fx.id || fx.applicantDetail?.applicantId || index;
            const isHovered = hoveredFixedPointId === fxId;
            
            const currentFxId = fx?.applicantDetail?.fixedPointId || fx?.id || fx?.applicantDetail?.applicantId || index;
            const selectedFxId = selectedFixedPoint?.applicantDetail?.fixedPointId || selectedFixedPoint?.id || selectedFixedPoint?.applicantDetail?.applicantId;
            const isSelected = selectedFixedPoint && currentFxId === selectedFxId;

            return (
              <Marker 
                key={`fx-${fxId}`} 
                position={[parseFloat(fx.address.latitude), parseFloat(fx.address.longitude)]}
                icon={isHovered || isSelected ? enlargedFixedPointIcon : fixedPointIcon}
                zIndexOffset={isHovered || isSelected ? 1000 : 0}
                ref={(r) => markerRefs.current[fxId] = r}
                eventHandlers={{
                  mouseover: () => {
                    setHoveredFixedPointId(fxId);
                  },
                  mouseout: () => {
                    setHoveredFixedPointId(null);
                  }
                }}
              >
                <Popup>
                  <div style={{ padding: "8px", minWidth: "200px" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#417505", fontSize: "16px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                      {fx?.applicantDetail?.name || fx?.name || "NA"} (Fixed Point)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>{t("WT_FIXED_POINT_CODE")}:</strong> {fx?.applicantDetail?.fixedPointId || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>{t("WT_MOBILE_NUMBER")}:</strong> {fx?.applicantDetail?.mobileNumber || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>{t("WT_LOCALITY")}:</strong> {fx?.address?.locality || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>Email:</strong> {fx?.applicantDetail?.emailId || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>Alt Mobile:</strong> {fx?.applicantDetail?.alternateNumber || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>Address:</strong> {[fx?.address?.houseNo, fx?.address?.streetName, fx?.address?.city, fx?.address?.pincode].filter(Boolean).join(", ") || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>Latitude:</strong> {fx?.address?.latitude || "NA"}</p>
                      <p style={{ margin: 0, fontSize: "12px" }}><strong>Longitude:</strong> {fx?.address?.longitude || "NA"}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

const PointAddressMapWithErrorBoundary = (props) => (
  <MapErrorBoundary>
    <PointAddressMap {...props} />
  </MapErrorBoundary>
);

export default PointAddressMapWithErrorBoundary;
