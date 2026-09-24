import React, { useState } from "react";
import { Card, CardText, TextInput, Toast } from "@djb25/digit-ui-react-components";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";

const WSDisconnectionKNumber = ({ userType }) => {
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();
  const stored = Digit.SessionStorage.get("WS_DISCONNECTION");
  const queryParams = new URLSearchParams(location.search);
  const isFromConnectionDetails = queryParams.get("from") === "connection-details";
  const connectionNumberFromQuery = queryParams.get("connectionNumber") || "";

  const [kNumber, setKNumber] = useState(() => {
    return isFromConnectionDetails ? connectionNumberFromQuery || stored?.applicationData?.connectionNo || stored?.connectionNo || "" : "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const isMobileView = window.innerWidth < 768;

  const handleProceed = async () => {
    const connectionNumber = kNumber || connectionNumberFromQuery || stored?.applicationData?.connectionNo || stored?.connectionNo || "";
    const trimmed = connectionNumber.trim();
    if (!trimmed) {
      setShowToast({ key: "warning", message: "Please enter K Number / Connection ID" });
      return;
    }

    setIsLoading(true);
    try {
      const tenantId = Digit.ULBService.getCurrentTenantId() || "dl";
      const params = { connectionNumber: trimmed, searchType: "CONNECTION", isConnectionSearch: true };

      let detectedServiceType = "WATER";
      const wsResponse = await Digit.WSService.search({ tenantId, filters: params, businessService: "WS" }).catch(() => null);
      const waterResponse = wsResponse?.data || wsResponse;
      let connection = waterResponse?.WaterConnection?.find(c => c.applicationStatus === "CONNECTION_ACTIVATED");

      if (!connection) {
        const swResponse = await Digit.WSService.search({ tenantId, filters: params, businessService: "SW" }).catch(() => null);
        const sewerageResponse = swResponse?.data || swResponse;
        connection = sewerageResponse?.SewerageConnections?.find(c => c.applicationStatus === "CONNECTION_ACTIVATED");
        if (connection) detectedServiceType = "SEWERAGE";
      }

      if (!connection) {
        setIsLoading(false);
        setShowToast({ key: "error", message: "Active connection not found for the given K Number" });
        return;
      }

      const fetchedMobileNumber = connection?.connectionHolders?.[0]?.mobileNumber || connection?.mobileNumber;

      if (!fetchedMobileNumber || fetchedMobileNumber.length !== 10) {
        setIsLoading(false);
        setShowToast({ key: "error", message: "No valid registered mobile number found for this connection" });
        return;
      }

      const userType = Digit.UserService.getType().toUpperCase();
      const payload = {
        otp: {
          mobileNumber: fetchedMobileNumber,
          tenantId: "dl",
          type: "register",
          userType: userType
        }
      };
      
      await Digit.UserService.sendOtp(payload, "dl");

      // Persist connection data for the next step
      const existingData = Digit.SessionStorage.get("WS_DISCONNECTION") || {};
      connection.serviceType = detectedServiceType;
      Digit.SessionStorage.set("WS_DISCONNECTION", {
        ...existingData,
        kNumber: trimmed,
        serviceType: detectedServiceType,
        applicationData: connection,
        connectionNo: connection?.connectionNo,
      });

      setIsLoading(false);
      // Navigate to consumer-details
      history.push(match.path.replace("k-number", "consumer-details"), { connection });
    } catch (err) {
      setIsLoading(false);
      setShowToast({ key: "error", message: err?.response?.data?.Errors?.[0]?.message || "Failed to search connection" });
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: "20px", padding: isMobileView ? "12px" : "24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "8px", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: "#00497e", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: "16px", flexShrink: 0
          }}>
            1
          </div>
          <h2 style={{ fontSize: isMobileView ? "16px" : "20px", fontWeight: "700", margin: 0, color: "#0B0C0C" }}>
            Connection Authentication
          </h2>
        </div>

        <CardText style={{ fontSize: isMobileView ? "13px" : "14px", marginBottom: "20px", color: "#6C6C6C" }}>
          Please enter your K Number to verify and proceed with the disconnection application.
        </CardText>

        {/* Input Panel */}
        <div style={{
          padding: isMobileView ? "14px" : "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          borderLeft: "4px solid #00497e",
          marginBottom: "8px"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontWeight: "600", marginBottom: "8px", fontSize: isMobileView ? "13px" : "14px", color: "#0B0C0C" }}>
              K Number / Connection ID <span style={{ color: "#d4351c" }}>*</span>
            </div>
            <TextInput
              value={kNumber}
              disabled={isFromConnectionDetails}
              onChange={e => setKNumber(e.target.value)}
              placeholder="Enter K Number (e.g. WS/105/2020/0001)"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: isMobileView ? "stretch" : "flex-end" }}>
            <button
              onClick={handleProceed}
              disabled={isLoading}
              style={{
                padding: isMobileView ? "12px 16px" : "10px 28px",
                backgroundColor: isLoading ? "#6C6C6C" : "#00497e",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontWeight: "bold",
                fontSize: isMobileView ? "14px" : "15px",
                width: isMobileView ? "100%" : "auto",
                transition: "background-color 0.2s",
              }}
            >
              {isLoading ? "Searching..." : "Proceed \u2192"}
            </button>
          </div>
        </div>
      </Card>

      {showToast && (
        <Toast
          error={showToast.key === "error"}
          warning={showToast.key === "warning"}
          label={showToast.message}
          onClose={() => setShowToast(null)}
          isDleteBtn={true}
        />
      )}
    </div>
  );
};

export default WSDisconnectionKNumber;
