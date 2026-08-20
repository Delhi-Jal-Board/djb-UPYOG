import React, { useState } from "react";
import { Card, StatusTable, Row, CardHeader, TextInput, Toast } from "@djb25/digit-ui-react-components";

const Step1_ExistingConnection = ({ t, applicationDetails, propertyId, mobileNumber, onVerify }) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const getMaskedName = (name) => {
    if (!name) return "NA";
    return name.split("").map((char, index) => (index % 2 === 1 && char !== " " ? "*" : char)).join("");
  };

  const getMaskedPhone = (phone) => {
    if (!phone || phone.length < 10) return "NA";
    return `******${phone.slice(-4)}`;
  };

  const appData = applicationDetails?.applicationData || {};
  const connectionNo = appData?.connectionNo || "NA";
  const meterId = appData?.meterId || "NA";
  const connectionStatus = appData?.status || "NA";
  
  const holderDetails = appData?.connectionHolders?.[0] || {};
  const registeredName = getMaskedName(holderDetails?.name);
  const registeredPhone = getMaskedPhone(holderDetails?.mobileNumber);
  
  const tenantId = appData?.tenantId || Digit.ULBService.getCurrentTenantId();
  const { data: propertyData } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId },
    { filters: { propertyIds: propertyId }, tenantId, enabled: !!propertyId }
  );

  const propertyAddress = propertyData?.Properties?.[0]?.address || appData?.property?.address || {};
  const formattedAddress = [
    propertyAddress?.houseNo || propertyAddress?.doorNo,
    propertyAddress?.buildingName,
    propertyAddress?.street,
    propertyAddress?.locality?.name,
    propertyAddress?.city,
    propertyAddress?.pincode
  ].filter(Boolean).join(", ") || "NA";

  const isDataComplete = connectionNo !== "NA" && registeredName !== "NA";
  const missingFields = [];
  if (connectionNo === "NA") missingFields.push("Connection Number");
  if (registeredName === "NA") missingFields.push("Owner Name");
  if (formattedAddress === "NA") missingFields.push("Property Address");

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setShowToast({ key: "warning", message: "Please enter a valid 6-digit OTP" });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        otp: {
          otp: otp,
          identity: mobileNumber,
          tenantId: "dl"
        }
      };

      await Digit.UserService.validateOtp(payload);
      
      setIsLoading(false);
      onVerify(); 
    } catch (err) {
      setIsLoading(false);
      setShowToast({ key: "error", message: err?.response?.data?.Errors?.[0]?.message || err.message || "Failed to verify OTP" });
    }
  };

  const infoItemStyle = {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  };

  return (
    <Card style={{ marginBottom: "20px" }}>
      {/* Notice Banner */}
      <div style={{ padding: "12px 16px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "8px", border: "1px solid #ffeeba", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <span style={{ fontSize: "18px", flexShrink: 0 }}>ℹ️</span>
        <span style={{ fontWeight: "500", fontSize: "14px" }}>Name Change / Mutation is limited to changing the name of the consumer/account holder on the existing water connection. It does not constitute or imply transfer of property ownership.</span>
      </div>

      {missingFields.length > 0 && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fdecea", color: "#611a15", borderRadius: "8px", border: "1px solid #f5c6cb", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
          <span style={{ fontWeight: "500", fontSize: "14px" }}>
            Note: Some connection details are missing ({missingFields.join(", ")}). You may need to update them during the mutation process.
          </span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "22px" }}>🏢</span>
        <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>2. Existing Consumer Details</h2>
      </div>

      <div style={{ padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "8px", borderLeft: "4px solid #00497e" }}>
        {/* Responsive grid: 1 col on mobile, 2 col on tablet, 3 on desktop */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "16px"
        }}>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: "13px", marginBottom: "4px" }}>Connection Number</div>
            <div style={{ fontWeight: "bold", wordBreak: "break-all" }}>{connectionNo}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: "13px", marginBottom: "4px" }}>Current Owner Name</div>
            <div style={{ fontWeight: "bold", wordBreak: "break-word" }}>{registeredName}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: "13px", marginBottom: "4px" }}>Property Address</div>
            <div style={{ fontWeight: "bold", wordBreak: "break-word" }}>{formattedAddress}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: "13px", marginBottom: "4px" }}>Connection Status</div>
            <div style={{ fontWeight: "bold", color: connectionStatus?.toLowerCase() === "active" ? "#28a745" : "#dc3545" }}>{connectionStatus}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: "13px", marginBottom: "4px" }}>Meter Number</div>
            <div style={{ fontWeight: "bold", wordBreak: "break-all" }}>{meterId}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: "13px", marginBottom: "4px" }}>Mobile Number</div>
            <div style={{ fontWeight: "bold" }}>{registeredPhone}</div>
          </div>
        </div>
      </div>

      {/* OTP Section */}
      <div style={{ marginTop: "24px", borderTop: "1px solid #e0e0e0", paddingTop: "16px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>Verify OTP</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "400px", marginBottom: "16px" }}>
          <label style={{ fontWeight: "500", fontSize: "14px" }}>Enter OTP sent to +91 {getMaskedPhone(mobileNumber)} *</label>
          <TextInput 
            value={otp} 
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.length < 6}
            style={{
              padding: "10px 20px",
              backgroundColor: "#00497e",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: (isLoading || otp.length < 6) ? "not-allowed" : "pointer",
              fontWeight: "bold",
              opacity: (isLoading || otp.length < 6) ? 0.5 : 1,
              width: "100%",
              maxWidth: "200px"
            }}
          >
            {isLoading ? "Verifying..." : "Verify & Proceed →"}
          </button>
        </div>
      </div>

      {showToast && <Toast error={showToast?.key === "error"} warning={showToast?.key === "warning"} label={showToast?.message} onClose={() => setShowToast(null)} isDleteBtn={true} />}
    </Card>
  );
};

export default Step1_ExistingConnection;
