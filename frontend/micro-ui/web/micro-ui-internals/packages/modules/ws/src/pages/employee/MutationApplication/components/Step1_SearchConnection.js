import React, { useState } from "react";
import { Card, CardText, TextInput, Toast } from "@djb25/digit-ui-react-components";

const Step1_SearchConnection = ({ t, defaultKNumber, onNext }) => {
  const [kNumber, setKNumber] = useState(defaultKNumber || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const handleSendOtp = async () => {
    if (!kNumber) {
      setShowToast({ key: "warning", message: "Please enter K Number / Connection ID" });
      return;
    }
    setIsLoading(true);
    try {
      const tenantId = Digit.ULBService.getCurrentTenantId() || "dl";
      const params = { connectionNumber: kNumber, isConnectionSearch: true };
      
      let detectedServiceType = "WATER";
      const wsResponse = await Digit.WSService.search({ tenantId, filters: params, businessService: "WS" }).catch(() => null);
      let connection = wsResponse?.WaterConnection?.[0];

      if (!connection) {
        const swResponse = await Digit.WSService.search({ tenantId, filters: params, businessService: "SW" }).catch(() => null);
        connection = swResponse?.SewerageConnections?.[0];
        if (connection) detectedServiceType = "SEWERAGE";
      }

      if (!connection) {
        setIsLoading(false);
        setShowToast({ key: "error", message: "Connection not found for the given K Number" });
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
      setIsLoading(false);
      onNext({ kNumber, mobileNumber: fetchedMobileNumber, serviceType: detectedServiceType });
    } catch (err) {
      setIsLoading(false);
      setShowToast({ key: "error", message: err?.response?.data?.Errors?.[0]?.message || "Failed to send OTP" });
    }
  };

  const isMobileView = window.innerWidth < 768;

  return (
    <Card style={{ marginBottom: "20px", padding: isMobileView ? "12px" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: isMobileView ? "20px" : "24px" }}>🔍</span>
        <h2 style={{ fontSize: isMobileView ? "16px" : "18px", fontWeight: "700", margin: 0 }}>1. Connection Authentication</h2>
      </div>
      <CardText style={{ fontSize: isMobileView ? "13px" : undefined }}>Please enter your K Number to proceed with the mutation application. An OTP will be sent to the registered mobile number.</CardText>
      
      <div style={{ marginBottom: "24px", marginTop: "16px", padding: isMobileView ? "12px" : "16px", backgroundColor: "#f9f9f9", borderRadius: "8px", borderLeft: "4px solid #00497e" }}>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: isMobileView ? "14px" : undefined }}>K Number / Connection ID *</div>
          <TextInput
            value={kNumber}
            onChange={(e) => setKNumber(e.target.value)}
            placeholder="Enter K Number"
            style={{ width: "100%" }}
          />
        </div>
        
        <div style={{ display: "flex", justifyContent: isMobileView ? "center" : "flex-end" }}>
          <button
            onClick={handleSendOtp}
            disabled={isLoading}
            style={{ padding: isMobileView ? "12px 16px" : "10px 20px", backgroundColor: "#00497e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", opacity: isLoading ? 0.7 : 1, width: isMobileView ? "100%" : "auto", maxWidth: isMobileView ? "100%" : "200px", fontSize: isMobileView ? "14px" : undefined }}
          >
            {isLoading ? "Sending OTP..." : "Send OTP →"}
          </button>
        </div>
      </div>
      
      {showToast && <Toast error={showToast.key === "error"} warning={showToast.key === "warning"} label={showToast.message} onClose={() => setShowToast(null)} isDleteBtn={true} />}
    </Card>
  );
};

export default Step1_SearchConnection;
