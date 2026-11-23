import React, { useState } from "react";
import { Card, Toast } from "@djb25/digit-ui-react-components";

const Step1_ExistingConnection = ({ t, applicationDetails, propertyId, mobileNumber, onVerify }) => {
  const [showToast, setShowToast] = useState(null);

  const getMaskedName = (name) => {
    if (!name) return "NA";
    return name.split("").map((char, index) => (index % 2 === 1 && char !== " " ? "*" : char)).join("");
  };

  const getMaskedPhone = (phone) => {
    if (!phone || phone.length < 10) return "NA";
    return `******${phone.slice(-4)}`;
  };

  const getMaskedMeter = (meter) => {
    if (!meter || meter === "NA") return "NA";
    const str = String(meter).trim();
    if (str.length <= 4) return "*".repeat(str.length);
    return `******${str.slice(-4)}`;
  };

  const appData = applicationDetails?.applicationData || {};
  const connectionNo = appData?.connectionNo || "NA";
  const meterId = appData?.meterId || "NA";
  const registeredMeter = getMaskedMeter(meterId);
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

  const isMobileView = window.innerWidth < 768;

  const infoItemStyle = {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  };

  return (
    <Card style={{ marginBottom: "20px", padding: isMobileView ? "12px" : undefined }}>
      {/* Notice Banner */}
      <div style={{ padding: isMobileView ? "10px 12px" : "12px 16px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "8px", border: "1px solid #ffeeba", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <span style={{ fontSize: isMobileView ? "16px" : "18px", flexShrink: 0 }}>ℹ️</span>
        <span style={{ fontWeight: "500", fontSize: isMobileView ? "12px" : "14px", lineHeight: "1.4" }}>Name Change / Mutation is limited to changing the name of the consumer/account holder on the existing water connection. It does not constitute or imply transfer of property ownership.</span>
      </div>

      {missingFields.length > 0 && (
        <div style={{ padding: isMobileView ? "10px 12px" : "12px 16px", backgroundColor: "#fdecea", color: "#611a15", borderRadius: "8px", border: "1px solid #f5c6cb", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
          <span style={{ fontWeight: "500", fontSize: isMobileView ? "12px" : "14px" }}>
            Note: Some connection details are missing ({missingFields.join(", ")}). You may need to update them during the mutation process.
          </span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: isMobileView ? "20px" : "22px" }}></span>
        <h2 style={{ fontSize: isMobileView ? "16px" : "18px", fontWeight: "700", margin: 0 }}>2. Existing Consumer Details</h2>
      </div>

      <div style={{ padding: isMobileView ? "12px" : "16px", backgroundColor: "#f9f9f9", borderRadius: "8px", borderLeft: "4px solid #00497e" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobileView ? "1fr 1fr" : "repeat(auto-fill, minmax(150px, 1fr))",
          gap: isMobileView ? "12px" : "16px"
        }}>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" }}>Connection Number</div>
            <div style={{ fontWeight: "bold", wordBreak: "break-all", fontSize: isMobileView ? "13px" : undefined }}>{connectionNo}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" }}>Current Owner Name</div>
            <div style={{ fontWeight: "bold", wordBreak: "break-word", fontSize: isMobileView ? "13px" : undefined }}>{registeredName}</div>
          </div>
          <div style={{ ...infoItemStyle, gridColumn: isMobileView ? "1 / -1" : undefined }}>
            <div style={{ color: "#555", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" }}>Property Address</div>
            <div style={{ fontWeight: "bold", wordBreak: "break-word", fontSize: isMobileView ? "13px" : undefined }}>{formattedAddress}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" }}>Connection Status</div>
            <div style={{ fontWeight: "bold", color: connectionStatus?.toLowerCase() === "active" ? "#28a745" : "#dc3545", fontSize: isMobileView ? "13px" : undefined }}>{connectionStatus}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" }}>Meter Number</div>
            <div style={{ fontWeight: "bold", wordBreak: "break-all", fontSize: isMobileView ? "13px" : undefined }}>{registeredMeter}</div>
          </div>
          <div style={infoItemStyle}>
            <div style={{ color: "#555", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" }}>Mobile Number</div>
            <div style={{ fontWeight: "bold", fontSize: isMobileView ? "13px" : undefined }}>{registeredPhone}</div>
          </div>
        </div>
      </div>

      {/* Action / Navigation Section */}
      <div style={{ marginTop: isMobileView ? "16px" : "24px", borderTop: "1px solid #e0e0e0", paddingTop: "16px", display: "flex", justifyContent: isMobileView ? "center" : "flex-end" }}>
        <button
          type="button"
          onClick={onVerify}
          style={{
            padding: isMobileView ? "12px 16px" : "10px 20px",
            backgroundColor: "#00497e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            width: isMobileView ? "100%" : "auto",
            maxWidth: isMobileView ? "100%" : "200px",
            fontSize: isMobileView ? "14px" : undefined
          }}
        >
          Proceed →
        </button>
      </div>

      {showToast && <Toast error={showToast?.key === "error"} warning={showToast?.key === "warning"} label={showToast?.message} onClose={() => setShowToast(null)} isDleteBtn={true} />}
    </Card>
  );
};

export default Step1_ExistingConnection;
