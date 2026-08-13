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
    
    // Construct mock payload for simulation
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

  const bannerStyle = { backgroundColor: "#fff", border: "1px solid #d4edda", borderTop: "4px solid #28a745", borderRadius: "8px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
  const simulationPanelStyle = { backgroundColor: "#f0f8ff", border: "1px solid #b8daff", borderRadius: "8px", padding: "20px", marginBottom: "20px" };
  const statusPanelStyle = { backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "20px" };

  return (
    <div style={{ padding: "20px 0" }}>
      
      {/* Success Banner */}
      <div style={bannerStyle}>
        <div>
          <h2 style={{ color: "#28a745", fontSize: "20px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: "8px" }}>✅</span> Application Submitted Successfully!
          </h2>
          <div style={{ color: "#666", marginTop: "4px" }}>
            Application Reference No: <strong style={{ color: "#00497e" }}>{applicationNumber}</strong>
          </div>
        </div>
        <div>
          <span style={{ padding: "6px 12px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "16px", fontSize: "12px", fontWeight: "bold" }}>
            PENDING_APPROVAL_FOR_MUTATION
          </span>
        </div>
      </div>

      {/* Simulation Panel */}
      {/* <div style={simulationPanelStyle}>
        <h3 style={{ color: "#0056b3", fontSize: "16px", fontWeight: "bold", margin: "0 0 8px 0", display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "8px" }}>⚖️</span> Official Workflow Decision Simulation Panel (DJB Nodal Officer / Approver)
        </h3>
        <p style={{ color: "#555", fontSize: "14px", marginBottom: "16px" }}>Test the 3 official decision paths for this application:</p>
        
        <div style={{ display: "flex", gap: "16px" }}>
          <button 
            onClick={() => handleSimulation("VERIFY_AND_FORWARD")}
            disabled={isSimulating}
            style={{ padding: "10px 16px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: isSimulating ? "not-allowed" : "pointer", fontWeight: "bold" }}
          >
            1 Verify & Forward (Proceed to Payment)
          </button>
          
          <button 
            onClick={() => handleSimulation("REJECT")}
            disabled={isSimulating}
            style={{ padding: "10px 16px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: isSimulating ? "not-allowed" : "pointer", fontWeight: "bold" }}
          >
            2 Reject Application
          </button>
          
          <button 
            onClick={() => handleSimulation("SEND_BACK_TO_CITIZEN")}
            disabled={isSimulating}
            style={{ padding: "10px 16px", backgroundColor: "#fd7e14", color: "white", border: "none", borderRadius: "4px", cursor: isSimulating ? "not-allowed" : "pointer", fontWeight: "bold" }}
          >
            3 Send Back to Citizen (Request Correction)
          </button>
        </div>
      </div> */}

      {/* Status Panel */}
      <div style={statusPanelStyle}>
        <h3 style={{ color: "#00497e", fontSize: "16px", fontWeight: "bold", margin: "0 0 16px 0", display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "8px" }}>📌</span> Current Workflow Status
        </h3>
        <hr style={{ border: "0", borderTop: "1px solid #e0e0e0", margin: "0 0 16px 0" }} />
        <p style={{ color: "#333", fontSize: "14px", margin: 0 }}>
          Application has been routed to <strong>Water Supply Department Verification Officer</strong>.
        </p>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <button 
          onClick={goHome}
          style={{ padding: "10px 24px", backgroundColor: "#00497e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
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
