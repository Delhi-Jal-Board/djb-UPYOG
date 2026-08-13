import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardLabel, Dropdown, UploadFile, Toast, TextInput } from "@djb25/digit-ui-react-components";

const Step3_UploadDocuments = ({ t, onNext, onBack, defaultValues }) => {
  const [identityProofType, setIdentityProofType] = useState(defaultValues?.identityProofType || null);
  const [documentNumber, setDocumentNumber] = useState(defaultValues?.documentNumber || "");
  
  const [identityProofFile, setIdentityProofFile] = useState(defaultValues?.identityProofDocumentId || null);
  const [mutationDocFile, setMutationDocFile] = useState(defaultValues?.saleDeedDocumentId || null);
  
  const [rawFiles, setRawFiles] = useState({ identity: null, mutation: null });
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const identityOptions = [
    { code: "AADHAAR", i18nKey: "Aadhaar Card" },
    { code: "VOTER_ID", i18nKey: "Voter ID" },
    { code: "PAN", i18nKey: "PAN Card" },
    { code: "OTHER", i18nKey: "Any other document configured by DJB" }
  ];

  const getReasonDocLabel = (reasonCode) => {
    switch(reasonCode) {
      case "SALE_PURCHASE": return "Upload Purchase of Property";
      case "DEVOLUTION_INHERITANCE": return "Upload Devolution/ Inheritance";
      case "OTHER": return "Upload Other (Gift Deed, Will registration, etc.)";
      default: return "Upload Supporting Document";
    }
  };

  const reasonCode = defaultValues?.reasonForNameChange?.code || defaultValues?.reasonForNameChange;
  const reasonDocLabel = getReasonDocLabel(reasonCode);

  // Document number format validation
  const validateDocumentNumber = (value, docType) => {
    if (!value || !value.trim()) return "Document number is required";
    const trimmed = value.trim();
    if (docType?.code === "AADHAAR") {
      if (!/^\d{12}$/.test(trimmed)) return "Aadhaar number must be exactly 12 digits";
    } else if (docType?.code === "PAN") {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmed.toUpperCase())) return "PAN must be in format ABCDE1234F";
    } else if (docType?.code === "VOTER_ID") {
      if (!/^[A-Z]{3}\d{7}$/.test(trimmed.toUpperCase())) return "Voter ID must be in format ABC1234567";
    } else {
      if (trimmed.length < 3) return "Document number must be at least 3 characters";
    }
    return null;
  };

  // File size validation (5MB max)
  const validateFileSize = (file) => {
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`;
    }
    return null;
  };

  // File type validation
  const validateFileType = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return "Only PDF, PNG, JPEG files are allowed.";
    }
    return null;
  };

  const handleFileUpload = async (file, type) => {
    // Validate file before uploading
    const sizeError = validateFileSize(file);
    if (sizeError) {
      setShowToast({ key: "error", message: sizeError });
      return;
    }
    const typeError = validateFileType(file);
    if (typeError) {
      setShowToast({ key: "error", message: typeError });
      return;
    }

    try {
      setIsUploading(true);
      const response = await window.Digit.UploadServices.Filestorage("WS", file, window.Digit.ULBService.getStateId());
      if (response?.data?.files?.length > 0) {
        const fileStoreId = response.data.files[0].fileStoreId;
        if (type === "identity") {
          setIdentityProofFile(fileStoreId);
          setFieldErrors(prev => ({ ...prev, identityFile: null }));
        }
        if (type === "mutation") {
          setMutationDocFile(fileStoreId);
          setFieldErrors(prev => ({ ...prev, mutationFile: null }));
        }
        setShowToast({ key: "success", message: "Document uploaded successfully!" });
      }
    } catch (err) {
      console.error("File upload error", err);
      setShowToast({ key: "error", message: "File upload failed. Please try again." });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (rawFiles.identity) handleFileUpload(rawFiles.identity, "identity");
  }, [rawFiles.identity]);

  useEffect(() => {
    if (rawFiles.mutation) handleFileUpload(rawFiles.mutation, "mutation");
  }, [rawFiles.mutation]);

  // Re-validate on every change if user has already attempted submit
  useEffect(() => {
    if (hasAttemptedSubmit) {
      const newErrors = {};
      if (!identityProofType) newErrors.identityType = "Please select a document type";
      if (!identityProofFile) newErrors.identityFile = "Please upload your identity proof document";
      if (!mutationDocFile) newErrors.mutationFile = "Please upload the reason-based supporting document";
      const docError = validateDocumentNumber(documentNumber, identityProofType);
      if (docError) newErrors.documentNumber = docError;
      setFieldErrors(newErrors);
    }
  }, [identityProofType, documentNumber, identityProofFile, mutationDocFile, hasAttemptedSubmit]);

  const onProceed = () => {
    setHasAttemptedSubmit(true);
    const newErrors = {};

    if (!identityProofType) newErrors.identityType = "Please select a document type";
    const docError = validateDocumentNumber(documentNumber, identityProofType);
    if (docError) newErrors.documentNumber = docError;
    if (!identityProofFile) newErrors.identityFile = "Please upload your identity proof document";
    if (!mutationDocFile) newErrors.mutationFile = "Please upload the reason-based supporting document";

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length;
      setShowToast({ key: "warning", message: `Please fix ${errorCount} issue${errorCount > 1 ? "s" : ""} before proceeding.` });
      return;
    }
    
    onNext({
      identityProofType,
      documentNumber: documentNumber.trim(),
      identityProofDocumentId: identityProofFile,
      saleDeedDocumentId: mutationDocFile
    });
  };

  const uploadBoxStyle = (hasError, hasFile) => ({
    border: hasError ? "2px dashed #d32f2f" : hasFile ? "2px dashed #28a745" : "1px dashed #ccc",
    padding: "20px",
    borderRadius: "8px",
    backgroundColor: hasError ? "#fef2f2" : hasFile ? "#f0fff4" : "#f4f9fc",
    textAlign: "center",
    marginTop: "8px",
    transition: "all 0.2s ease"
  });

  const errorTextStyle = { fontSize: "12px", color: "#d32f2f", marginTop: "4px" };
  const successTextStyle = { fontSize: "12px", color: "#28a745", marginTop: "4px", fontWeight: "500" };
  const mandatoryIndicator = <span style={{ color: "#d32f2f", marginLeft: "2px" }}>*</span>;

  const errorCount = Object.keys(fieldErrors).length;

  return (
    <Card style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "24px", marginRight: "8px" }}>📄</span>
        <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>3. Upload Verification Documents</h2>
      </div>
      <p style={{ color: "#666", marginBottom: "20px" }}>Please upload legible scanned copies or photos (PDF, PNG, JPEG - Max 5MB).</p>

      {/* Validation summary */}
      {hasAttemptedSubmit && errorCount > 0 && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fdecea", color: "#611a15", borderRadius: "8px", border: "1px solid #f5c6cb", marginBottom: "16px", display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "8px", fontSize: "18px" }}>⚠️</span>
          <span style={{ fontWeight: "500", fontSize: "14px" }}>
            {errorCount} required item{errorCount > 1 ? "s" : ""} still need{errorCount === 1 ? "s" : ""} your attention before proceeding.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Address / Identity Proof */}
        <div>
          <CardLabel style={{ fontWeight: "bold" }}>1. Address / Identity Proof {mandatoryIndicator}</CardLabel>
          <Dropdown
            selected={identityProofType}
            option={identityOptions}
            select={(val) => { setIdentityProofType(val); setFieldErrors(prev => ({ ...prev, identityType: null })); }}
            optionKey="i18nKey"
            t={t}
            placeholder="Select Document Type"
            style={{ marginBottom: "12px" }}
          />
          {fieldErrors.identityType && <div style={errorTextStyle}>{fieldErrors.identityType}</div>}

          <CardLabel style={{ fontWeight: "bold", marginTop: "8px" }}>Document Number {mandatoryIndicator}</CardLabel>
          <TextInput 
            value={documentNumber} 
            onChange={(e) => { setDocumentNumber(e.target.value); setFieldErrors(prev => ({ ...prev, documentNumber: null })); }}
            onBlur={() => {
              if (hasAttemptedSubmit) {
                const err = validateDocumentNumber(documentNumber, identityProofType);
                if (err) setFieldErrors(prev => ({ ...prev, documentNumber: err }));
              }
            }}
            placeholder={identityProofType?.code === "AADHAAR" ? "Enter 12-digit Aadhaar number" : identityProofType?.code === "PAN" ? "Enter PAN (e.g. ABCDE1234F)" : "Enter Document Number"} 
            style={{ marginBottom: "4px", ...(fieldErrors.documentNumber ? { border: "1px solid #d32f2f" } : {}) }}
          />
          {fieldErrors.documentNumber && <div style={errorTextStyle}>{fieldErrors.documentNumber}</div>}
          {identityProofType?.code === "AADHAAR" && !fieldErrors.documentNumber && (
            <span style={{ fontSize: "11px", color: "#999" }}>Format: 12-digit numeric (e.g. 123456789012)</span>
          )}
          {identityProofType?.code === "PAN" && !fieldErrors.documentNumber && (
            <span style={{ fontSize: "11px", color: "#999" }}>Format: ABCDE1234F</span>
          )}

          <div style={uploadBoxStyle(!!fieldErrors.identityFile, !!identityProofFile)}>
            <UploadFile
              id="identity-upload"
              onUpload={(e) => setRawFiles(prev => ({ ...prev, identity: e.target.files[0] }))}
              onDelete={() => { setIdentityProofFile(null); setRawFiles(prev => ({ ...prev, identity: null })); }}
              message={identityProofFile ? `Uploaded` : `Click to Choose File`}
              accept="image/*, .pdf, .png, .jpeg, .jpg"
              uploadedFiles={identityProofFile && !rawFiles.identity ? [["Document", { fileStoreId: identityProofFile }]] : undefined}
              removeTargetedFile={() => { setIdentityProofFile(null); setRawFiles(prev => ({ ...prev, identity: null })); }}
            />
          </div>
          {fieldErrors.identityFile && <div style={errorTextStyle}>{fieldErrors.identityFile}</div>}
          {identityProofFile && <div style={successTextStyle}>✓ Document uploaded successfully</div>}
        </div>

        {/* Reason-Based Document */}
        <div>
          <CardLabel style={{ fontWeight: "bold" }}>2. Reason-Based Supporting Document {mandatoryIndicator}</CardLabel>
          <div style={{ padding: "10px", backgroundColor: "#e9ecef", borderRadius: "4px", marginBottom: "12px", color: "#495057", fontSize: "14px", minHeight: "42px", display: "flex", alignItems: "center" }}>
            {reasonDocLabel}
          </div>
          <div style={uploadBoxStyle(!!fieldErrors.mutationFile, !!mutationDocFile)}>
            <UploadFile
              id="mutation-upload"
              onUpload={(e) => setRawFiles(prev => ({ ...prev, mutation: e.target.files[0] }))}
              onDelete={() => { setMutationDocFile(null); setRawFiles(prev => ({ ...prev, mutation: null })); }}
              message={mutationDocFile ? `Uploaded` : `Click to Upload`}
              accept="image/*, .pdf, .png, .jpeg, .jpg"
              uploadedFiles={mutationDocFile && !rawFiles.mutation ? [["Document", { fileStoreId: mutationDocFile }]] : undefined}
              removeTargetedFile={() => { setMutationDocFile(null); setRawFiles(prev => ({ ...prev, mutation: null })); }}
            />
          </div>
          {fieldErrors.mutationFile && <div style={errorTextStyle}>{fieldErrors.mutationFile}</div>}
          {mutationDocFile && <div style={successTextStyle}>✓ Document uploaded successfully</div>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" }}>
        <button 
          type="button" 
          onClick={onBack} 
          style={{ padding: "8px 24px", backgroundColor: "#e0e0e0", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          &#8592; Back
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#999" }}>All documents are mandatory</span>
          <button 
            type="button" 
            onClick={onProceed}
            disabled={isUploading}
            style={{ padding: "10px 24px", backgroundColor: isUploading ? "#ccc" : "#00497e", color: "white", border: "none", borderRadius: "4px", cursor: isUploading ? "not-allowed" : "pointer", fontWeight: "bold" }}
          >
            {isUploading ? "Uploading..." : "Proceed to Application Preview →"}
          </button>
        </div>
      </div>

      {showToast && (
        <Toast
          error={showToast.key === "error"}
          warning={showToast.key === "warning"}
          success={showToast.key === "success"}
          label={t(showToast.message)}
          onClose={() => setShowToast(null)}
          isDleteBtn={true}
        />
      )}
    </Card>
  );
};

export default Step3_UploadDocuments;
