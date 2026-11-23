import React, { useEffect, useState } from "react";
import { CardLabel, CardLabelError, LabelFieldPair, UploadFile, FieldLabelWithTooltip } from "@djb25/digit-ui-react-components";

const DECLARATION_TEMPLATE_FILESTORE_ID = "ba8d1691-8f87-4e72-b398-968f4f999788";

const WSActivationSupportingDocuments = ({
  t,
  config,
  userType,
  formData,
  onSelect,
  setError: setFormError,
  clearErrors: clearFormErrors,
  formState,
  errors: formErrors,
}) => {
  const tenantIdCode = Digit.ULBService.getCurrentTenantId();

  const getTrans = (key, defaultVal) => {
    const val = t(key);
    return val && val !== key ? val : defaultVal;
  };

  // Determine whether Self or DJB
  const plumberPref =
    formData?.plumberDetails?.[0]?.detailsProvidedBy?.code ||
    formData?.plumberDetails?.[0]?.detailsProvidedBy?.name ||
    formData?.plumberDetails?.[0]?.detailsProvidedBy ||
    formData?.additionalDetails?.detailsProvidedBy ||
    "";
  const isDJB =
    plumberPref === "DJB" ||
    plumberPref === "ULB" ||
    plumberPref === "Delhi Jal Board" ||
    (typeof plumberPref === "string" && plumberPref.toLowerCase().includes("djb"));
  const isSelf = !isDJB;

  // Existing documents if any
  const existingDocs = formData?.supportingDocuments?.documents || (Array.isArray(formData?.supportingDocuments) ? formData.supportingDocuments : []);
  const initialPhoto =
    formData?.supportingDocuments?.meterPhoto ||
    existingDocs.find((d) => d?.documentType === "METER_PHOTO") ||
    (existingDocs[0]?.fileStoreId ? existingDocs[0] : null);

  const initialWarranty =
    formData?.supportingDocuments?.meterWarranty ||
    existingDocs.find((d) => d?.documentType === "METER_WARRANTY_CARD_TESTING_REPORT_INVOICE");

  const initialDeclaration =
    formData?.supportingDocuments?.plumberDeclaration ||
    existingDocs.find((d) => d?.documentType === "DECLARATION_OF_LICENSED_PLUMBER");

  const [meterPhoto, setMeterPhoto] = useState(initialPhoto || null);
  const [meterWarranty, setMeterWarranty] = useState(initialWarranty || null);
  const [plumberDeclaration, setPlumberDeclaration] = useState(initialDeclaration || null);

  const [errors, setErrors] = useState({
    meterPhoto: null,
    meterWarranty: null,
    plumberDeclaration: null,
  });

  const [uploading, setUploading] = useState({
    meterPhoto: false,
    meterWarranty: false,
    plumberDeclaration: false,
  });

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // Keep parent form in sync with documents
  useEffect(() => {
    const docs = [];
    if (meterPhoto?.fileStoreId) {
      docs.push({
        documentType: "METER_PHOTO",
        fileStoreId: meterPhoto.fileStoreId,
        fileName: meterPhoto.fileName,
      });
    }
    if (meterWarranty?.fileStoreId) {
      docs.push({
        documentType: "METER_WARRANTY_CARD_TESTING_REPORT_INVOICE",
        fileStoreId: meterWarranty.fileStoreId,
        fileName: meterWarranty.fileName,
      });
    }
    if (plumberDeclaration?.fileStoreId) {
      docs.push({
        documentType: "DECLARATION_OF_LICENSED_PLUMBER",
        fileStoreId: plumberDeclaration.fileStoreId,
        fileName: plumberDeclaration.fileName,
      });
    }

    const payloadData = {
      documents: docs,
      meterPhoto: meterPhoto || null,
      meterWarranty: meterWarranty || null,
      plumberDeclaration: plumberDeclaration || null,
      fileStoreId: meterPhoto?.fileStoreId || docs[0]?.fileStoreId || null,
    };

    if (onSelect && config?.key) {
      onSelect(config.key, payloadData);
    }

    // Form errors update:
    // If Self: photo, warranty, declaration are all mandatory.
    // If DJB: only photo is mandatory; warranty and declaration are optional / not mandatory.
    const isPhotoValid = !!meterPhoto?.fileStoreId;
    const isWarrantyValid = isDJB ? true : !!meterWarranty?.fileStoreId;
    // Plumber declaration commented out as per requirement
    // const isDeclarationValid = isDJB ? true : !!plumberDeclaration?.fileStoreId;
    const isDeclarationValid = true;

    if (isPhotoValid && isWarrantyValid && isDeclarationValid) {
      if (clearFormErrors && config?.key) {
        clearFormErrors(config.key);
      }
    } else {
      if (setFormError && config?.key) {
        setFormError(config.key, {
          type: "required",
          message: getTrans("CORE_COMMON_REQUIRED_ERRMSG", "Required"),
        });
      }
    }
  }, [meterPhoto, meterWarranty, plumberDeclaration, isDJB, isSelf]);

  const uploadFileToServer = async (file, fieldKey, maxSizeInBytes, allowedTypesRegex, errorMsgSize, errorMsgType) => {
    setErrors((prev) => ({ ...prev, [fieldKey]: null }));

    if (!file) return;

    if (file.size > maxSizeInBytes) {
      setErrors((prev) => ({ ...prev, [fieldKey]: errorMsgSize }));
      return;
    }

    if (file?.type && !allowedTypesRegex.test(file?.type) && !allowedTypesRegex.test(file?.name)) {
      setErrors((prev) => ({ ...prev, [fieldKey]: errorMsgType }));
      return;
    }

    try {
      setUploading((prev) => ({ ...prev, [fieldKey]: true }));
      const response = await Digit.UploadServices.Filestorage("WS", file, tenantIdCode);
      setUploading((prev) => ({ ...prev, [fieldKey]: false }));

      if (response?.data?.files?.length > 0) {
        const fsId = response?.data?.files[0]?.fileStoreId;
        const fileObj = {
          fileStoreId: fsId,
          documentUid: fsId,
          fileName: file.name,
        };

        if (fieldKey === "meterPhoto") setMeterPhoto(fileObj);
        else if (fieldKey === "meterWarranty") setMeterWarranty(fileObj);
        else if (fieldKey === "plumberDeclaration") setPlumberDeclaration(fileObj);
      } else {
        setErrors((prev) => ({ ...prev, [fieldKey]: getTrans("CS_FILE_UPLOAD_ERROR", "File upload failed") }));
      }
    } catch (err) {
      setUploading((prev) => ({ ...prev, [fieldKey]: false }));
      setErrors((prev) => ({ ...prev, [fieldKey]: getTrans("CS_FILE_UPLOAD_ERROR", "File upload failed") }));
    }
  };

  const handleDownloadDeclarationFormat = async () => {
    setIsDownloadingTemplate(true);
    try {
      const stateOrTenantId = Digit.ULBService.getStateId() || "dl";
      const response = await Digit.UploadServices.Filefetch([DECLARATION_TEMPLATE_FILESTORE_ID], stateOrTenantId);
      let rawUrl = response?.data?.fileStoreIds?.[0]?.url || response?.data?.[DECLARATION_TEMPLATE_FILESTORE_ID] || "";
      let fileURL = "";
      if (rawUrl && typeof rawUrl === "string") {
        const linkList = rawUrl.split(",");
        fileURL = linkList.find((l) => l && !l.includes("large") && !l.includes("medium") && !l.includes("small")) || linkList[0];
        fileURL = fileURL ? fileURL.trim() : "";
      }
      if (fileURL) {
        const a = document.createElement("a");
        a.href = fileURL;
        a.download = "Declaration_of_Licensed_Plumber.pdf";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsDownloadingTemplate(false);
        return;
      }
    } catch (err) {
      console.warn("Filefetch failed, trying direct filestore endpoint", err);
    }

    try {
      const directUrl = `/filestore/v1/files/id?fileStoreId=${DECLARATION_TEMPLATE_FILESTORE_ID}&tenantId=dl`;
      window.open(directUrl, "_blank");
    } catch (e) {
      if (Digit?.Utils?.pdf?.generatePlumberDeclarationPDF) {
        Digit.Utils.pdf.generatePlumberDeclarationPDF({
          appNo: formData?.connectionDetails?.[0]?.formDetails?.applicationData?.applicationNo || "-",
          plumberName: formData?.plumberDetails?.[0]?.plumberName || "",
          plumberLicenseNo: formData?.plumberDetails?.[0]?.plumberLicenseNo || "",
          plumberMobileNo: formData?.plumberDetails?.[0]?.plumberMobileNo || "",
          tenantId: tenantIdCode,
        });
      }
    }
    setIsDownloadingTemplate(false);
  };

  const errorStyle = { width: "100%", marginLeft: "0px", fontSize: "12px", marginTop: "4px" };

  return (
    <React.Fragment>
      {/* 1. Meter Photo (JPEG/PDF size up to 500KB) - Mandatory for both Self and DJB */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={getTrans("WS_METER_PHOTO_UPLOAD_LABEL", "Meter Photo(JPEG/PDF size up to 500KB)")}
          isMandatory={true}
          infoText={t("WS_METER_PHOTO_INFO_MSG", "Upload photo of installed water meter")}
        />
        <div className="field">
          <UploadFile
            id="activation-meter-photo"
            onUpload={(e) => {
              const f = e.target.files?.[0];
              uploadFileToServer(
                f,
                "meterPhoto",
                500 * 1024,
                /(.*?)(jpg|jpeg|png|image|pdf)$/i,
                "File size exceeds maximum limit of 500 KB",
                "Only JPEG/PNG images or PDF files are allowed"
              );
            }}
            onDelete={() => {
              setMeterPhoto(null);
              setErrors((prev) => ({ ...prev, meterPhoto: null }));
            }}
            message={
              uploading.meterPhoto
                ? "Uploading..."
                : meterPhoto
                ? meterPhoto.fileName || `1 ${getTrans("CS_ACTION_FILEUPLOADED", "File Uploaded")}`
                : getTrans("CS_ACTION_NO_FILEUPLOADED", "No File Uploaded")
            }
            textStyles={{ width: "100%" }}
            inputStyles={{ width: "280px" }}
            buttonType="button"
            accept="image/*, .pdf, .png, .jpeg, .jpg"
            iserror={errors.meterPhoto}
            isMandatory={true}
          />
          {errors.meterPhoto ? <CardLabelError style={errorStyle}>{errors.meterPhoto}</CardLabelError> : null}
        </div>
      </LabelFieldPair>

      {/* 2. Download Declaration PDF Button - Commented out as per requirement */}
      {/* <LabelFieldPair>
        <CardLabel>
          {getTrans("WS_DOWNLOAD_DECLARATION_LABEL", "Download the declaration of License Plumber PDF format")}:
        </CardLabel>
        <div className="field" style={{ display: "flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleDownloadDeclarationFormat}
            disabled={isDownloadingTemplate}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#fff",
              border: "1.5px solid #a82227",
              borderRadius: "4px",
              padding: "10px 18px",
              cursor: isDownloadingTemplate ? "wait" : "pointer",
              color: "#a82227",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            {isDownloadingTemplate
              ? "Downloading..."
              : getTrans("WS_DOWNLOAD_DECLARATION_BUTTON", "Download Plumber Declaration PDF")}
          </button>
        </div>
      </LabelFieldPair> */}

      {/* 3. Upload signed and duly filled declaration PDF format - Commented out as per requirement */}
      {/* <LabelFieldPair>
        <CardLabel>
          {getTrans("WS_UPLOAD_DECLARATION_LABEL", "Upload the signed and duly filled declaration PDF format")}
          {isSelf ? (
            <span className="check-page-link-button"> *</span>
          ) : (
            <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}> (not mandatory)</span>
          )}:
        </CardLabel>
        <div className="field">
          <UploadFile
            id="activation-plumber-declaration"
            onUpload={(e) => {
              const f = e.target.files?.[0];
              uploadFileToServer(
                f,
                "plumberDeclaration",
                1024 * 1024,
                /(.*?)(pdf)$/i,
                "File size exceeds maximum limit of 1 MB",
                "Only PDF format is allowed"
              );
            }}
            onDelete={() => {
              setPlumberDeclaration(null);
              setErrors((prev) => ({ ...prev, plumberDeclaration: null }));
            }}
            message={
              uploading.plumberDeclaration
                ? "Uploading..."
                : plumberDeclaration
                ? plumberDeclaration.fileName || `1 ${getTrans("CS_ACTION_FILEUPLOADED", "File Uploaded")}`
                : getTrans("CS_ACTION_NO_FILEUPLOADED", "No File Uploaded")
            }
            textStyles={{ width: "100%" }}
            inputStyles={{ width: "280px" }}
            buttonType="button"
            accept=".pdf"
            iserror={errors.plumberDeclaration}
            isMandatory={isSelf}
          />
          {errors.plumberDeclaration ? (
            <CardLabelError style={errorStyle}>{errors.plumberDeclaration}</CardLabelError>
          ) : null}
        </div>
      </LabelFieldPair> */}

      {/* 4. Meter warranty card, Meter testing report, Invoice of meter JPEG/PDF up to size 1 MB - Mandatory for Self, Not mandatory for DJB */}
      <LabelFieldPair>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={getTrans("WS_METER_WARRANTY_REPORT_INVOICE_LABEL", "Meter warranty card, Meter testing report, Invoice of meter JPEG/PDF up to size 1 MB")}
          isMandatory={isSelf}
          infoText={t("WS_METER_WARRANTY_INFO_MSG", "Upload meter warranty card, testing report or invoice")}
        />
        <div className="field">
          <UploadFile
            id="activation-meter-warranty"
            onUpload={(e) => {
              const f = e.target.files?.[0];
              uploadFileToServer(
                f,
                "meterWarranty",
                1024 * 1024,
                /(.*?)(jpg|jpeg|png|image|pdf)$/i,
                "File size exceeds maximum limit of 1 MB",
                "Only JPEG/PNG images or PDF files are allowed"
              );
            }}
            onDelete={() => {
              setMeterWarranty(null);
              setErrors((prev) => ({ ...prev, meterWarranty: null }));
            }}
            message={
              uploading.meterWarranty
                ? "Uploading..."
                : meterWarranty
                ? meterWarranty.fileName || `1 ${getTrans("CS_ACTION_FILEUPLOADED", "File Uploaded")}`
                : getTrans("CS_ACTION_NO_FILEUPLOADED", "No File Uploaded")
            }
            textStyles={{ width: "100%" }}
            inputStyles={{ width: "280px" }}
            buttonType="button"
            accept="image/*, .pdf, .png, .jpeg, .jpg"
            iserror={errors.meterWarranty}
            isMandatory={isSelf}
          />
          {errors.meterWarranty ? <CardLabelError style={errorStyle}>{errors.meterWarranty}</CardLabelError> : null}
        </div>
      </LabelFieldPair>
    </React.Fragment>
  );
};

export default WSActivationSupportingDocuments;
