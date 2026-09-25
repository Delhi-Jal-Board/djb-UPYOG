import React, { useState, useEffect } from "react";
import { UploadFile, TextInput, Toast, ButtonSelector } from "@djb25/digit-ui-react-components";

const FitterSandbox = ({ t, action, applicationData, submitAction, closeModal }) => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [meterReading, setMeterReading] = useState("");
  const [gpsLocation, setGpsLocation] = useState("Fetching GPS...");
  const [timestamp, setTimestamp] = useState("");
  const [error, setError] = useState(null);

  const handleUpload = async (e, setFileId) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const response = await Digit.UploadServices.Filestorage("WS", file, Digit.ULBService.getCurrentTenantId());
      if (response?.data?.files?.length > 0) {
        setFileId(response.data.files[0].fileStoreId);
      }
    } catch (err) {
      setError("File upload failed.");
    }
  };


  useEffect(() => {
    // Fetch GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation(`<b>${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E</b>`);
        },
        (error) => {
          setGpsLocation("<b>Location access denied</b>");
        }
      );
    } else {
      setGpsLocation("<b>Geolocation not supported</b>");
    }
    
    // Set timestamp
    const now = new Date();
    setTimestamp(`<b>${now.toLocaleDateString('en-US')}, ${now.toLocaleTimeString('en-US')}</b>`);
  }, []);

  const handleSubmit = () => {
    if (!beforeImage || !afterImage || !meterReading) {
      setError("Please provide Before Photograph, Final Meter Index Reading, and After Photograph.");
      return;
    }

    const payload = { ...applicationData };
    
    // Create documents array
    const docArray = [
      {
        documentType: "BEFORE_PHOTOGRAPH",
        fileStoreId: beforeImage,
        id: null,
        documentUid: beforeImage,
        documentNumber: null,
        auditDetails: null,
        status: "ACTIVE",
        isVerified: false
      },
      {
        documentType: "AFTER_PHOTOGRAPH",
        fileStoreId: afterImage,
        id: null,
        documentUid: afterImage,
        documentNumber: null,
        auditDetails: null,
        status: "ACTIVE",
        isVerified: false
      }
    ];

    payload.connectionExecutionDate = Date.now();
    payload.disconnectionExecutionDate = Date.now();
    payload.wfDocuments = docArray;
    
    // Append to existing documents array
    payload.documents = [...(payload.documents || []), ...docArray];

    payload.additionalDetails = {
      ...payload.additionalDetails,
      finalMeterReading: meterReading,
      disconnectionGpsLocation: gpsLocation.replace(/<[^>]*>?/gm, ""), // strip HTML
      disconnectionTimestamp: timestamp.replace(/<[^>]*>?/gm, "")
    };
    
    payload.processInstance = {
      ...payload.processInstance,
      action: action?.action,
      comment: `Meter Reading: ${meterReading} m3`,
      documents: docArray
    };
    
    // Ensure we trigger disconnectRequest
    if (payload?.serviceType === "WATER") {
      submitAction({ WaterConnection: payload, disconnectRequest: true });
    } else {
      submitAction({ SewerageConnection: payload, disconnectRequest: true });
    }
  };

  return (
    <div style={{ backgroundColor: "#fff9f9", padding: "24px", borderRadius: "8px", border: "1px solid #ffebeb" }}>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ color: "#d4351c", marginTop: "4px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#3b1c1c", margin: 0, textTransform: "uppercase" }}>
              FITTER SANDBOX MOBILE TERMINAL (DIGITAL VERIFICATION)
            </h2>
            <p style={{ fontSize: "14px", color: "#6e5e5e", margin: "4px 0 0 0" }}>
              Simulate the physical field actions of Delhi Jal Board fitter {applicationData?.additionalDetails?.ownerName || "Amit Kumar"}.
            </p>
          </div>
        </div>
        <div style={{ backgroundColor: "#ffeded", color: "#d4351c", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "700" }}>
          FIELD SIMULATOR
        </div>
      </div>

      {/* Cards Row */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        {/* Before Photo */}
        <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #eaebec", textAlign: "center" }}>
          <div style={{ color: "#6a7b8c", marginBottom: "12px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>Before Photograph</h3>
          <p style={{ fontSize: "12px", color: "#8a96a3", margin: "0 0 16px 0" }}>Upload Pre-Disconnection site</p>
          <UploadFile
            id="before-photo"
            accept=".jpg,.png,.jpeg"
            onUpload={(e) => handleUpload(e, setBeforeImage)}
            onDelete={() => setBeforeImage(null)}
            message={beforeImage ? `1 File Uploaded` : `Upload`}
            showHintBelow={false}
          />
        </div>

        {/* Meter Reading */}
        <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #eaebec" }}>
          <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#8a96a3", margin: "0 0 8px 0", textTransform: "uppercase" }}>FINAL METER INDEX READING</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <TextInput
              style={{ margin: 0, flex: 1, fontSize: "18px", fontWeight: "600" }}
              value={meterReading}
              onChange={(e) => setMeterReading(e.target.value)}
              placeholder="e.g. 1402.5"
            />
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#6a7b8c" }}>m³</span>
          </div>
          <p style={{ fontSize: "12px", color: "#8a96a3", margin: 0 }}>Locks absolute consumption meter index.</p>
        </div>

        {/* After Photo */}
        <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #eaebec", textAlign: "center" }}>
          <div style={{ color: "#6a7b8c", marginBottom: "12px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0" }}>After Photograph</h3>
          <p style={{ fontSize: "12px", color: "#8a96a3", margin: "0 0 16px 0" }}>Upload Capped Line proof</p>
          <UploadFile
            id="after-photo"
            accept=".jpg,.png,.jpeg"
            onUpload={(e) => handleUpload(e, setAfterImage)}
            onDelete={() => setAfterImage(null)}
            message={afterImage ? `1 File Uploaded` : `Upload`}
            showHintBelow={false}
          />
        </div>
      </div>

      {/* GPS & Timestamp */}
      <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #eaebec", display: "flex", justifyContent: "space-between", marginBottom: "24px", fontFamily: "monospace", fontSize: "14px", color: "#6a7b8c" }}>
        <div>GPS Location: <span dangerouslySetInnerHTML={{ __html: gpsLocation }} /></div>
        <div>Timestamp: <span dangerouslySetInnerHTML={{ __html: timestamp }} /></div>
      </div>

      {/* Submit Button */}
      <ButtonSelector
        label={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span style={{ color: "#6a7b8c" }}>Submit</span>
          </div>
        }
        onSubmit={handleSubmit}
        style={{ width: "100%", backgroundColor: "#e9ecef", border: "none", borderRadius: "8px", fontWeight: "700" }}
        textStyles={{ width: "100%" }}
      />
      
      {error && <Toast error={true} label={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default FitterSandbox;
