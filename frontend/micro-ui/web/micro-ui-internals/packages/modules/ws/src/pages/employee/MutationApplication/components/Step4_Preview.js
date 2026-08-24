import React, { useState, useEffect } from "react";
import { Card, CardHeader, CheckBox, ActionBar, SubmitBar } from "@djb25/digit-ui-react-components";

const Step4_Preview = ({ t, formData, applicationDetails, resolvedServiceType, onBack, onSubmit, isLoading }) => {
  const [agreed, setAgreed] = useState(false);
  const [fee, setFee] = useState(0);
  const [taxHeads, setTaxHeads] = useState([]);
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

  const tenantId = appData?.tenantId || Digit.ULBService.getCurrentTenantId();
  const { data: propertyData } = Digit.Hooks.pt.usePropertySearch(
    { filters: { propertyIds: propertyId }, tenantId },
    { filters: { propertyIds: propertyId }, tenantId, enabled: !!propertyId && propertyId !== "NA" }
  );

  const propertyAddress = propertyData?.Properties?.[0]?.address || appData?.property?.address || {};
  const oldAddress = [
    propertyAddress?.houseNo || propertyAddress?.doorNo,
    propertyAddress?.buildingName,
    propertyAddress?.street,
    propertyAddress?.locality?.name,
    propertyAddress?.city,
    propertyAddress?.pincode
  ].filter(Boolean).join(", ") || "NA";

  const { proposedNewConsumerName, newOwnerMobileNumber, relationshipWithExistingConsumer, reasonForNameChange, identityProofType, documentNumber, identityProofDocumentId, saleDeedDocumentId } = formData;

  const getRelationshipName = (code) => {
    if (code?.code) return code.i18nKey;
    const map = { "BLOOD_RELATION": "Blood Relation", "LEGAL_HEIR": "Legal Heir", "OTHER": "Other" };
    return map[code] || code || "NA";
  };

  const getReasonName = (code) => {
    if (code?.code) return code.i18nKey;
    const map = { "SALE_PURCHASE": "Sale / Purchase of Property", "DEVOLUTION_INHERITANCE": "Inheritance / Succession", "OTHER": "Other" };
    return map[code] || code;
  };

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
    const calculateStaticFee = () => {
      const relationCode = formData?.relationshipWithExistingConsumer?.code || formData?.relationshipWithExistingConsumer;

      if (relationCode === "BLOOD_RELATION") {
        setFee(100);
        setTaxHeads([]);
        setSlab("Blood relation slab");
      } else {
        setFee(1350);
        setTaxHeads([
          { taxHeadCode: "WS_MUTATION_TRADE_SECURITY", estimateAmount: 250.00 },
          { taxHeadCode: "WS_MUTATION_FEE", estimateAmount: 100.00 },
          { taxHeadCode: "WS_WATER_ADVANCE", estimateAmount: 1000.00 }
        ]);
        setSlab("Other Slab");
      }
    };

    calculateStaticFee();
  }, [formData]);

  const isMobileView = window.innerWidth < 768;
  const sectionStyle = { border: "1px solid #e0e0e0", borderRadius: "8px", padding: isMobileView ? "12px" : "16px", marginBottom: "16px" };
  const labelStyle = { color: "#666", fontSize: isMobileView ? "11px" : "13px", marginBottom: "4px" };
  const valueStyle = { fontWeight: "bold", fontSize: isMobileView ? "13px" : "15px", wordBreak: "break-word" };
  const uploadDocStatusStyle = { fontSize: isMobileView ? "12px" : "14px", fontWeight: "bold" };

  // Responsive info item
  const infoItem = (label, value) => (
    <div style={{ minWidth: 0 }}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );

  return (
    <Card style={{ marginBottom: "20px", padding: isMobileView ? "12px" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: isMobileView ? "20px" : "22px" }}>📋</span>
        <h2 style={{ fontSize: isMobileView ? "15px" : "18px", fontWeight: "700", margin: 0 }}>4. Application Preview & Final Declaration</h2>
      </div>

      {/* Property & Connection Summary */}
      <div style={{ ...sectionStyle, borderLeft: "4px solid #00497e" }}>
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#00497e", marginBottom: "12px" }}>Property & Connection Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobileView ? "1fr 1fr" : "repeat(auto-fill, minmax(150px, 1fr))", gap: isMobileView ? "12px" : "16px" }}>
          {infoItem("Connection No", connectionNo)}
          {infoItem("Meter Number", meterId)}
          {infoItem("Property ID", propertyId)}
        </div>
      </div>

      {/* Existing Owner */}
      <div style={{ ...sectionStyle, borderLeft: "4px solid #f29c1f" }}>
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#f29c1f", marginBottom: "12px" }}>🔒 Existing / Previous Owner Details (Masked)</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobileView ? "1fr" : "repeat(auto-fill, minmax(150px, 1fr))", gap: isMobileView ? "12px" : "16px", marginBottom: "12px" }}>
          {infoItem("Registered Name:", oldName)}
          {infoItem("Registered Phone:", oldPhone)}
        </div>
        {infoItem("Registered Address:", oldAddress)}
      </div>

      {/* New Owner */}
      <div style={{ ...sectionStyle, borderLeft: "4px solid #00497e" }}>
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#00497e", marginBottom: "12px" }}>👤 Transferee (New Owner) Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobileView ? "1fr 1fr" : "repeat(auto-fill, minmax(150px, 1fr))", gap: isMobileView ? "12px" : "16px" }}>
          {infoItem("New Owner Name", proposedNewConsumerName)}
          {infoItem("Mobile Number", newOwnerMobileNumber)}
          {infoItem("Relation Type", getRelationshipName(relationshipWithExistingConsumer))}
          {infoItem("Transfer Reason", getReasonName(reasonForNameChange))}
        </div>
      </div>

      {/* Documents */}
      <div style={{ ...sectionStyle, borderLeft: "4px solid #17a2b8" }}>
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#17a2b8", marginBottom: "12px" }}>Uploaded Documents</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobileView ? "1fr" : "repeat(auto-fill, minmax(150px, 1fr))", gap: isMobileView ? "12px" : "16px" }}>
          <div>
            <div style={labelStyle}>Address / Identity Proof</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={uploadDocStatusStyle}>✓ {identityProofType?.i18nKey || "Document"}</span>
              {identityProofDocumentId && (
                <button type="button" onClick={() => viewDocument(identityProofDocumentId)} style={{ color: "#00497e", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: isMobileView ? "12px" : "14px", fontWeight: "bold", padding: 0 }}>View</button>
              )}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Document Number</div>
            <div style={valueStyle}>{documentNumber || "NA"}</div>
          </div>
          <div>
            <div style={labelStyle}>Reason-Based Proof</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={uploadDocStatusStyle}>✓ Uploaded</span>
              {saleDeedDocumentId && (
                <button type="button" onClick={() => viewDocument(saleDeedDocumentId)} style={{ color: "#00497e", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: isMobileView ? "12px" : "14px", fontWeight: "bold", padding: 0 }}>View</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fee */}
      <div style={{ ...sectionStyle, backgroundColor: "#f2fff5", border: "1px solid #c3e6cb", borderLeft: "4px solid #28a745" }}>
        <h3 style={{ fontSize: isMobileView ? "13px" : "15px", fontWeight: "bold", color: "#28a745", marginBottom: "12px" }}>💵 Mutation Fee Details</h3>

        {taxHeads && taxHeads.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            {taxHeads.map((tax, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", maxWidth: isMobileView ? "100%" : "400px" }}>
                <div style={labelStyle}>{t(tax.taxHeadCode)}:</div>
                <div style={valueStyle}>₹ {tax.estimateAmount}.00</div>
              </div>
            ))}
            <hr style={{ borderTop: "1px solid #c3e6cb", margin: "12px 0", maxWidth: isMobileView ? "100%" : "400px" }} />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", maxWidth: isMobileView ? "100%" : "400px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={labelStyle}>Total Amount Payable:</div>
            <div style={{ ...valueStyle, color: "#28a745", fontSize: isMobileView ? "18px" : "20px" }}>₹ {fee}.00</div>
          </div>
          <div>
            <div style={labelStyle}>Fee Status:</div>
            <span style={{ padding: "4px 8px", backgroundColor: "#d1ecf1", color: "#0c5460", borderRadius: "16px", fontSize: isMobileView ? "10px" : "12px", fontWeight: "bold", display: "inline-block", marginTop: "4px" }}>PAYABLE POST VERIFICATION</span>
          </div>
        </div>
      </div>

      {/* Declaration */}
      <div style={{ padding: isMobileView ? "12px" : "16px", backgroundColor: "#fffbeb", border: "1px solid #ffeeba", borderRadius: "8px", marginBottom: "24px" }}>
        <CheckBox
          label="I want to go ahead with submitting this application. I confirm that the details and information provided by me are true and correct to the best of my knowledge."
          onChange={(e) => setAgreed(e.target.checked)}
          checked={agreed}
          style={isMobileView ? { fontSize: "12px" } : undefined}
        />
      </div>

      {/* Action Bar - responsive stacked on mobile */}
      {isMobileView ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!agreed || isLoading}
            style={{
              padding: "14px 20px",
              backgroundColor: (!agreed || isLoading) ? "#ccc" : "#00497e",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: (!agreed || isLoading) ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "15px",
              width: "100%",
              opacity: (!agreed || isLoading) ? 0.6 : 1
            }}
          >
            {isLoading ? "Submitting..." : "Submit Mutation Application"}
          </button>
          <button
            type="button"
            onClick={onBack}
            style={{ padding: "12px 20px", backgroundColor: "#e0e0e0", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", width: "100%", fontSize: "14px" }}
          >
            ← Edit Information
          </button>
        </div>
      ) : (
        <ActionBar>
          <button
            type="button"
            onClick={onBack}
            style={{ padding: "10px 20px", backgroundColor: "#e0e0e0", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginRight: "12px" }}
          >
            ← Edit Information
          </button>
          <SubmitBar
            label={isLoading ? "Submitting..." : "Submit Mutation Application"}
            onSubmit={onSubmit}
            disabled={!agreed || isLoading}
          />
        </ActionBar>
      )}

    </Card>
  );
};

export default Step4_Preview;
