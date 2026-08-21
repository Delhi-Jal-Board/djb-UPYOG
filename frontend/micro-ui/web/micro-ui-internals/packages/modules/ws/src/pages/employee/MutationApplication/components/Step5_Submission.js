import React, { useState } from "react";
import { Card, Toast } from "@djb25/digit-ui-react-components";
import { useHistory } from "react-router-dom";

const Step5_Submission = ({ applicationNumber, serviceType, t }) => {
  const history = useHistory();
  const [showToast, setShowToast] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { mutate: workflowMutation } = Digit.Hooks.ws.useWSApplicationActions(serviceType);

  const handleSimulation = async (actionCode) => {
    setIsSimulating(true);
    
    const reqDetails = serviceType === "WATER"
      ? { WaterConnection: { applicationNo: applicationNumber, processInstance: { action: actionCode } } }
      : { SewerageConnection: { applicationNo: applicationNumber, processInstance: { action: actionCode } } };

    try {
      if (workflowMutation) {
        await workflowMutation(reqDetails, {
          onSuccess: () => {
            setShowToast({ key: "success", message: `Successfully executed action: ${actionCode}` });
          },
          onError: (error) => {
            setShowToast({ key: "error", message: error?.response?.data?.Errors?.[0]?.message || "Workflow Simulation Failed" });
          }
        });
      }
    } catch (e) {
      setShowToast({ key: "error", message: "Error during simulation" });
    } finally {
      setIsSimulating(false);
    }
  };

  const goHome = () => {
    history.push("/digit-ui/employee");
  };

  return (
    <div style={{ padding: "16px 0" }}>
      
      {/* Success Banner */}
      <div style={{
        backgroundColor: "#fff",
        border: "1px solid #d4edda",
        borderTop: "4px solid #28a745",
        borderRadius: "8px",
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "20px"
      }}>
        <div>
          <h2 style={{ color: "#28a745", fontSize: "18px", fontWeight: "bold", margin: "0 0 4px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
            <span>✅</span> Your application has been submitted successfully to the respective Zonal Officer !
          </h2>
          <div style={{ color: "#666", marginTop: "4px", fontSize: "14px", wordBreak: "break-all" }}>
            Your SRN Reference No. is: <strong style={{ color: "#00497e" }}>{applicationNumber}</strong>
          </div>
        </div>
        <div>
          <span style={{ padding: "6px 12px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "16px", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" }}>
            Pending for Zonal Officer approval
          </span>
        </div>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <button 
          onClick={goHome}
          style={{ padding: "12px 28px", backgroundColor: "#00497e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", width: "100%", maxWidth: "280px" }}
        >
          Go to Home
        </button>
      </div>

      {showToast && (
        <Toast
          error={showToast.key === "error"}
          warning={showToast.key === "warning"}
          label={t(showToast.message)}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
};

export default Step5_Submission;
