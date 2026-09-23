import React, { useState } from "react";
import { Card, TextInput, Toast } from "@djb25/digit-ui-react-components";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";

const WSDisconnectionConsumerDetails = ({ userType }) => {
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();
  const [otp, setOtp] = useState("");
  const [showToast, setShowToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const applicationData = Digit.SessionStorage.get("WS_DISCONNECTION") || {};
  const connection = location.state?.connection || applicationData?.applicationData || {};

  const isMobileView = window.innerWidth < 768;

  // ---- Masking helpers ----
  const getMaskedName = (name) => {
    if (!name) return "NA";
    return name.split("").map((char, i) => (i % 2 === 1 && char !== " " ? "*" : char)).join("");
  };

  const getMaskedPhone = (phone) => {
    if (!phone || phone.length < 4) return "NA";
    return `******${phone.slice(-4)}`;
  };

  // ---- Derive display values ----
  const connectionNo = connection?.connectionNo || "NA";
  const meterId = connection?.meterId || connection?.additionalDetails?.meterId || "NA";
  const connectionStatus = connection?.applicationStatus || "NA";

  const holder = connection?.connectionHolders?.[0] || {};
  const registeredName = getMaskedName(holder?.name);
  const mobileNumber = holder?.mobileNumber || connection?.mobileNumber || "";
  const registeredPhone = getMaskedPhone(mobileNumber);

  // Address from connection property
  const propertyAddress = connection?.property?.address || connection?.address || {};
  const formattedAddress = [
    propertyAddress?.houseNo || propertyAddress?.doorNo,
    propertyAddress?.buildingName,
    propertyAddress?.street,
    propertyAddress?.locality?.name,
    propertyAddress?.city,
    propertyAddress?.pincode,
  ].filter(Boolean).join(", ") || "NA";

  const handleResendOtp = async () => {
    try {
      const userType = Digit.UserService.getType().toUpperCase();
      const payload = {
        otp: {
          mobileNumber: mobileNumber,
          tenantId: "dl",
          type: "register",
          userType: userType
        }
      };
      await Digit.UserService.sendOtp(payload, "dl");
      setShowToast({ key: "warning", message: "OTP resent to registered mobile number" });
    } catch (err) {
      setShowToast({ key: "error", message: err?.response?.data?.Errors?.[0]?.message || "Failed to resend OTP" });
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      setShowToast({ key: "warning", message: "Please enter a valid 6-digit OTP" });
      return;
    }
    setIsLoading(true);
    try {
      const userType = Digit.UserService.getType().toUpperCase();
      const payload = {
        otp: {
          otp: otp,
          mobileNumber: mobileNumber,
          tenantId: "dl",
          userType: userType
        }
      };
      
      await Digit.UserService.validateOtp(payload);
      Digit.SessionStorage.set("WS_DISCONNECTION", {
        ...applicationData,
        applicationData: connection,
        connectionNo: connection?.connectionNo,
        serviceType: connection?.additionalDetails?.serviceType?.code || applicationData?.serviceType,
      });
      setIsLoading(false);
      // Proceed to the application form
      history.push(match.path.replace("consumer-details", "application-form"), { connection });
    } catch (err) {
      setIsLoading(false);
      setShowToast({ key: "error", message: err?.response?.data?.Errors?.[0]?.message || err.message || "Failed to verify OTP" });
    }
  };

  // Info grid item style
  const infoItem = { display: "flex", flexDirection: "column", minWidth: 0 };
  const infoLabel = { color: "#6C6C6C", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" };
  const infoValue = { fontWeight: "bold", wordBreak: "break-word", fontSize: isMobileView ? "13px" : "14px", color: "#0B0C0C" };

  const statusColor = connectionStatus?.toLowerCase() === "connection_activated" ? "#28a745" : "#dc3545";

  return (
    <div>
      <Card style={{ marginBottom: "20px", padding: isMobileView ? "12px" : "24px" }}>

        {/* Disclaimer Banner */}
        <div style={{
          padding: isMobileView ? "10px 12px" : "12px 16px",
          backgroundColor: "#fff3cd",
          color: "#856404",
          borderRadius: "8px",
          border: "1px solid #ffeeba",
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px"
        }}>
          <span style={{ fontSize: "18px", flexShrink: 0 }}>ℹ️</span>
          <span style={{ fontWeight: "500", fontSize: isMobileView ? "12px" : "13px", lineHeight: "1.5" }}>
            Please verify the connection details below. The OTP has been sent to the registered mobile number on this connection.
          </span>
        </div>

        {/* Step Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: "#00497e", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: "16px", flexShrink: 0
          }}>
            2
          </div>
          <h2 style={{ fontSize: isMobileView ? "16px" : "20px", fontWeight: "700", margin: 0, color: "#0B0C0C" }}>
            Connection Details
          </h2>
        </div>

        {/* Connection Details Panel */}
        <div style={{
          padding: isMobileView ? "12px" : "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          borderLeft: "4px solid #00497e",
          marginBottom: "24px"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobileView ? "1fr 1fr" : "repeat(auto-fill, minmax(180px, 1fr))",
            gap: isMobileView ? "14px" : "20px"
          }}>
            <div style={infoItem}>
              <div style={infoLabel}>Connection Number</div>
              <div style={infoValue}>{connectionNo}</div>
            </div>

            <div style={infoItem}>
              <div style={infoLabel}>Current Owner Name</div>
              <div style={infoValue}>{registeredName}</div>
            </div>

            <div style={{ ...infoItem, gridColumn: isMobileView ? "1 / -1" : undefined }}>
              <div style={infoLabel}>Property Address</div>
              <div style={infoValue}>{formattedAddress}</div>
            </div>

            <div style={infoItem}>
              <div style={infoLabel}>Connection Status</div>
              <div style={{ ...infoValue, color: statusColor }}>
                {connectionStatus?.replace(/_/g, " ")}
              </div>
            </div>

            <div style={infoItem}>
              <div style={infoLabel}>Meter Number</div>
              <div style={infoValue}>{meterId}</div>
            </div>

            <div style={infoItem}>
              <div style={infoLabel}>Registered Mobile</div>
              <div style={infoValue}>{registeredPhone}</div>
            </div>
          </div>
        </div>

        {/* OTP Section */}
        <div style={{
          borderTop: "1px solid #e0e0e0",
          paddingTop: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "#00497e", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold", fontSize: "16px", flexShrink: 0
            }}>
              3
            </div>
            <h3 style={{ fontSize: isMobileView ? "14px" : "16px", fontWeight: "700", margin: 0, color: "#0B0C0C" }}>
              OTP Verification
            </h3>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block", fontWeight: "500",
              fontSize: isMobileView ? "13px" : "14px",
              marginBottom: "8px", color: "#0B0C0C"
            }}>
              Enter OTP sent to +91 {getMaskedPhone(mobileNumber)} <span style={{ color: "#d4351c" }}>*</span>
            </label>
            <TextInput
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: "12px", color: "#6C6C6C", marginTop: "6px" }}>
              Didn&apos;t receive OTP?{" "}
              <span
                style={{ color: "#00497e", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
                onClick={handleResendOtp}
              >
                Resend OTP
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: isMobileView ? "stretch" : "flex-end" }}>
            <button
              onClick={handleVerify}
              disabled={isLoading || otp.length < 6}
              style={{
                padding: isMobileView ? "12px 16px" : "10px 28px",
                backgroundColor: (isLoading || otp.length < 6) ? "#6c757d" : "#00497e",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: (isLoading || otp.length < 6) ? "not-allowed" : "pointer",
                fontWeight: "bold",
                fontSize: isMobileView ? "14px" : "15px",
                width: isMobileView ? "100%" : "auto",
                transition: "background-color 0.2s",
                opacity: (isLoading || otp.length < 6) ? 0.5 : 1,
              }}
            >
              {isLoading ? "Verifying..." : "Verify & Proceed \u2192"}
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

export default WSDisconnectionConsumerDetails;
