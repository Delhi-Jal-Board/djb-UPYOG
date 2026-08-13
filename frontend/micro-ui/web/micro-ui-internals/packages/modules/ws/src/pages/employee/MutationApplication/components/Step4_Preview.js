import React, { useState, useEffect } from "react";
import { Card, CardHeader, CheckBox, ActionBar, SubmitBar } from "@djb25/digit-ui-react-components";

const Step4_Preview = ({ t, formData, applicationDetails, onBack, onSubmit, isLoading }) => {
  const [agreed, setAgreed] = useState(false);
  const [fee, setFee] = useState(0);
  const [slab, setSlab] = useState("Calculating...");

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
  const propertyId = appData?.propertyId || "NA";
  const connectionCategory = appData?.connectionCategory || "NA";
  
  const oldHolder = appData?.connectionHolders?.[0] || {};
  const oldName = getMaskedName(oldHolder?.name);
  const oldPhone = getMaskedPhone(oldHolder?.mobileNumber);
  
  const address = appData?.property?.address || {};
  const oldAddress = [
    address?.doorNo,
    address?.buildingName,
    address?.street,
    address?.locality?.name,
    address?.city
  ].filter(Boolean).join(", ") || "NA";

  const { proposedNewConsumerName, newOwnerMobileNumber, relationshipWithExistingConsumer, reasonForNameChange, identityProofType, documentNumber, identityProofDocumentId, saleDeedDocumentId } = formData;

  const getRelationshipName = (code) => {
    if (code?.code) return code.i18nKey;
    const map = { "BLOOD_RELATION": "Blood Relation", "LEGAL_HEIR": "Legal Heir", "OTHER": "Other" };
    return map[code] || code;
  };

  const getReasonName = (code) => {
    if (code?.code) return code.i18nKey;
    const map = { "SALE_PURCHASE": "Sale / Purchase of Property", "DEVOLUTION_INHERITANCE": "Inheritance / Succession", "OTHER": "Other" };
    return map[code] || code;
  };

  const tenantId = Digit.ULBService.getCurrentTenantId();

  const viewDocument = async (fileStoreId) => {
    if (!fileStoreId) return;
    try {
      const stateId = Digit.ULBService.getStateId();
      const res = await window.Digit.UploadServices.Filefetch([fileStoreId], stateId);
      if (res?.data?.[fileStoreId]) {
        const fileUrl = res.data[fileStoreId].split(",")[0];
        window.open(fileUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to fetch document", err);
    }
  };

  useEffect(() => {
    const relationCode = relationshipWithExistingConsumer?.code || relationshipWithExistingConsumer;
    if (relationCode && relationCode !== "OTHER") {
      setFee(100);
      setSlab("Blood relation slab");
    } else {
      setFee(1350);
      setSlab("Other Slab");
    }
  }, [relationshipWithExistingConsumer]);

  const sectionStyle = { border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px", marginBottom: "16px" };
  const labelStyle = { color: "#666", fontSize: "14px", marginBottom: "4px" };
  const valueStyle = { fontWeight: "bold", fontSize: "16px" };
  const uploadDocStatusStyle = { fontSize: "14px", fontWeight: "bold" };

  return (
    <Card style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "24px", marginRight: "8px" }}>📋</span>
        <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>4. Application Preview & Final Declaration</h2>
      </div>

      <div style={{ ...sectionStyle, borderLeft: "4px solid #00497e" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#00497e", marginBottom: "12px" }}>Property & Connection Summary</h3>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div><div style={labelStyle}>Connection No</div><div style={valueStyle}>{connectionNo}</div></div>
          <div><div style={labelStyle}>Meter Number</div><div style={valueStyle}>{meterId}</div></div>
          <div><div style={labelStyle}>Property ID</div><div style={valueStyle}>{propertyId}</div></div>
          {/* <div><div style={labelStyle}>Category</div><div style={valueStyle}>{connectionCategory}</div></div> */}
        </div>
      </div>

      <div style={{ ...sectionStyle, borderLeft: "4px solid #f29c1f" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#f29c1f", marginBottom: "12px" }}>🔒 Existing / Previous Owner Details (Masked Information)</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <div><div style={labelStyle}>Registered Name:</div><div style={valueStyle}>{oldName}</div></div>
          <div><div style={labelStyle}>Meter Number:</div><div style={valueStyle}>{meterId}</div></div>
          <div><div style={labelStyle}>Registered Phone:</div><div style={valueStyle}>{oldPhone}</div></div>
        </div>
        <div><div style={labelStyle}>Registered Address:</div><div style={valueStyle}>{oldAddress}</div></div>
      </div>

      <div style={{ ...sectionStyle, borderLeft: "4px solid #00497e" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#00497e", marginBottom: "12px" }}>👤 Transferee (New Owner) Summary</h3>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div><div style={labelStyle}>New Owner Name</div><div style={valueStyle}>{proposedNewConsumerName}</div></div>
          <div><div style={labelStyle}>Mobile Number</div><div style={valueStyle}>{newOwnerMobileNumber}</div></div>
          <div><div style={labelStyle}>Relation Type</div><div style={valueStyle}>{getRelationshipName(relationshipWithExistingConsumer)}</div></div>
          <div><div style={labelStyle}>Transfer Reason</div><div style={valueStyle}>{getReasonName(reasonForNameChange)}</div></div>
        </div>
      </div>

      <div style={{ ...sectionStyle, borderLeft: "4px solid #17a2b8" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#17a2b8", marginBottom: "12px" }}>Uploaded Documents</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <div style={labelStyle}>Address / Identity Proof</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={uploadDocStatusStyle}>✓ {identityProofType?.i18nKey || "Document"}</span>
              {identityProofDocumentId && (
                <button type="button" onClick={() => viewDocument(identityProofDocumentId)} style={{ color: "#00497e", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>View</button>
              )}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Document Number</div>
            <div style={valueStyle}>{documentNumber || "NA"}</div>
          </div>
          <div>
            <div style={labelStyle}>Reason-Based Proof</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={uploadDocStatusStyle}>✓ Uploaded</span>
              {saleDeedDocumentId && (
                <button type="button" onClick={() => viewDocument(saleDeedDocumentId)} style={{ color: "#00497e", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>View</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...sectionStyle, backgroundColor: "#f2fff5", border: "1px solid #c3e6cb", borderLeft: "4px solid #28a745" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#28a745", marginBottom: "12px" }}>💵 Mutation Fee Details (Money to Pay in Mutation)</h3>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div><div style={labelStyle}>Mutation Money to Pay:</div><div style={{ ...valueStyle, color: "#28a745", fontSize: "20px" }}>₹ {fee}.00</div></div>
          <div><div style={labelStyle}>Fee Status:</div><span style={{ padding: "4px 8px", backgroundColor: "#d1ecf1", color: "#0c5460", borderRadius: "16px", fontSize: "12px", fontWeight: "bold" }}>PAYABLE POST VERIFICATION</span></div>
          <div><div style={labelStyle}>Applicable Slab:</div><div style={valueStyle}>{slab}</div></div>
        </div>
      </div>

      <div style={{ padding: "16px", backgroundColor: "#fffbeb", border: "1px solid #ffeeba", borderRadius: "8px", marginBottom: "24px" }}>
        <CheckBox
          label="I want to go ahead with submitting this application. I confirm that the details and information provided by me are true and correct to the best of my knowledge."
          onChange={(e) => setAgreed(e.target.checked)}
          checked={agreed}
        />
      </div>

      <ActionBar>
        <button 
          type="button" 
          onClick={onBack} 
          style={{ padding: "8px 24px", backgroundColor: "#e0e0e0", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginRight: "16px" }}
        >
          &#8592; Edit Information
        </button>
        <SubmitBar 
          label={isLoading ? "Submitting..." : "Submit Mutation Application"} 
          onSubmit={onSubmit} 
          disabled={!agreed || isLoading} 
        />
      </ActionBar>

    </Card>
  );
};

export default Step4_Preview;
