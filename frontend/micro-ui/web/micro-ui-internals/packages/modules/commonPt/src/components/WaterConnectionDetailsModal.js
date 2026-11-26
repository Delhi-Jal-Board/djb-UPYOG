import React from "react";
import { Modal, CloseSvg } from "@djb25/digit-ui-react-components";

const WaterConnectionDetailsModal = ({ isOpen, onClose, details, t }) => {
  if (!isOpen || !details) return null;

  const safeT = (key, fallback) => {
    const val = t ? t(key) : null;
    return val && val !== key ? val : fallback;
  };

  const formatStatus = (val) => {
    if (!val) return "NA";
    return val.replace(/_/g, " ");
  };

  return (
    <Modal
      headerBarMain={
        <h1 className="heading-m" style={{ margin: "0", fontSize: "18px", fontWeight: "600", color: "#0b0c0c" }}>
          {safeT("WS_WATER_CONNECTION_DETAILS", "Water Connection Details")}
        </h1>
      }
      headerBarEnd={<CloseSvg onClick={onClose} style={{ cursor: "pointer", width: "20px", height: "20px" }} />}
      actionCancelLabel={safeT("CS_COMMON_CLOSE", "Close")}
      actionCancelOnSubmit={onClose}
      hideSubmit={true}
      width="560px"
      popupModuleActionBarStyles={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px" }}
    >
      <div style={{ padding: "8px 4px" }}>
        {details.message && (
          <div
            style={{
              backgroundColor: "#FFF4E5",
              border: "1px solid #FFE2B7",
              borderLeft: "4px solid #F47738",
              color: "#663C00",
              padding: "12px 16px",
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            <strong>{details.message}</strong>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 24px",
            backgroundColor: "#FAFAFA",
            padding: "16px",
            borderRadius: "4px",
            border: "1px solid #EAEAEA",
          }}
        >
          {details.status && (
            <div>
              <span style={{ color: "#505A5F", display: "block", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
                {safeT("WS_CONNECTION_STATUS", "Status")}
              </span>
              <strong style={{ color: "#0B0C0C", fontSize: "14px" }}>{formatStatus(details.status)}</strong>
            </div>
          )}

          {details.applicationNo && (
            <div>
              <span style={{ color: "#505A5F", display: "block", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
                {safeT("WS_APPLICATION_NO", "Application No.")}
              </span>
              <strong style={{ color: "#0B0C0C", fontSize: "14px" }}>{details.applicationNo}</strong>
            </div>
          )}

          {details.applicationStatus && (
            <div>
              <span style={{ color: "#505A5F", display: "block", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
                {safeT("WS_APPLICATION_STATUS", "Application Status")}
              </span>
              <strong style={{ color: "#0B0C0C", fontSize: "14px" }}>{formatStatus(details.applicationStatus)}</strong>
            </div>
          )}

          {details.connectionNo && (
            <div>
              <span style={{ color: "#505A5F", display: "block", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
                {safeT("WS_CONNECTION_NO", "Connection No.")}
              </span>
              <strong style={{ color: "#0B0C0C", fontSize: "14px" }}>{details.connectionNo}</strong>
            </div>
          )}

          {details.hasWaterConnection !== undefined && details.hasWaterConnection !== null && (
            <div>
              <span style={{ color: "#505A5F", display: "block", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
                {safeT("WS_HAS_WATER_CONNECTION", "Water Connection Exists")}
              </span>
              <strong style={{ color: "#0B0C0C", fontSize: "14px" }}>
                {details.hasWaterConnection ? safeT("CS_COMMON_YES", "Yes") : safeT("CS_COMMON_NO", "No")}
              </strong>
            </div>
          )}

          {details.hasExistingApplication !== undefined && details.hasExistingApplication !== null && (
            <div>
              <span style={{ color: "#505A5F", display: "block", fontSize: "12px", marginBottom: "4px", fontWeight: "500" }}>
                {safeT("WS_HAS_EXISTING_APPLICATION", "Existing Application")}
              </span>
              <strong style={{ color: "#0B0C0C", fontSize: "14px" }}>
                {details.hasExistingApplication ? safeT("CS_COMMON_YES", "Yes") : safeT("CS_COMMON_NO", "No")}
              </strong>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default WaterConnectionDetailsModal;
