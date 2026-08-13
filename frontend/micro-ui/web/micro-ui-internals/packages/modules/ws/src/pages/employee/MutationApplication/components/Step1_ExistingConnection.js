import React from "react";
import { Card, StatusTable, Row, CardHeader } from "@djb25/digit-ui-react-components";

const Step1_ExistingConnection = ({ t, applicationDetails, propertyId }) => {
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
  
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { data: propertyData } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId },
    { enabled: !!propertyId }
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

  // Data completeness check
  const isDataComplete = connectionNo !== "NA" && registeredName !== "NA";
  const missingFields = [];
  if (connectionNo === "NA") missingFields.push("Connection Number");
  if (registeredName === "NA") missingFields.push("Owner Name");
  if (formattedAddress === "NA") missingFields.push("Property Address");

  return (
    <Card style={{ marginBottom: "20px" }}>
      <div style={{ padding: "16px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "8px", border: "1px solid #ffeeba", marginBottom: "20px", display: "flex", alignItems: "center" }}>
        <span style={{ marginRight: "8px", fontSize: "20px" }}>ℹ️</span>
        <span style={{ fontWeight: "500" }}>Name Change / Mutation is limited to changing the name of the consumer/account holder on the existing water connection. It does not constitute or imply transfer of property ownership.</span>
      </div>

      {/* Data completeness warning */}
      {missingFields.length > 0 && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fdecea", color: "#611a15", borderRadius: "8px", border: "1px solid #f5c6cb", marginBottom: "16px", display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "8px", fontSize: "18px" }}>⚠️</span>
          <span style={{ fontWeight: "500", fontSize: "14px" }}>
            Please verify the connection data before proceeding.
          </span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "24px", marginRight: "8px" }}>🏢</span>
        <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>1. Existing Connection & Current Consumer Details.</h2>
      </div>
      <div style={{ padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "8px", borderLeft: "4px solid #00497e" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <div style={{ color: "#555", fontSize: "14px", marginBottom: "4px" }}>Connection Number</div>
            <div style={{ fontWeight: "bold" }}>{connectionNo}</div>
          </div>
          <div>
            <div style={{ color: "#555", fontSize: "14px", marginBottom: "4px" }}>Current Owner Name</div>
            <div style={{ fontWeight: "bold" }}>{registeredName}</div>
          </div>
          <div>
            <div style={{ color: "#555", fontSize: "14px", marginBottom: "4px" }}>Property Address</div>
            <div style={{ fontWeight: "bold" }}>{formattedAddress}</div>
          </div>
          <div>
            <div style={{ color: "#555", fontSize: "14px", marginBottom: "4px" }}>Connection Status</div>
            <div style={{ fontWeight: "bold", color: connectionStatus?.toLowerCase() === "active" ? "#28a745" : "#dc3545" }}>{connectionStatus}</div>
          </div>
          <div>
            <div style={{ color: "#555", fontSize: "14px", marginBottom: "4px" }}>Meter Number</div>
            <div style={{ fontWeight: "bold" }}>{meterId}</div>
          </div>
          <div>
            <div style={{ color: "#555", fontSize: "14px", marginBottom: "4px" }}>Mobile Number</div>
            <div style={{ fontWeight: "bold" }}>{registeredPhone}</div>
          </div>
        </div>
      </div>

    </Card>
  );
};

export default Step1_ExistingConnection;
