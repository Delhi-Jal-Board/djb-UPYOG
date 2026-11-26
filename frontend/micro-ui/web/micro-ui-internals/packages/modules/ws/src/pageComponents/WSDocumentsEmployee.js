import React, { useEffect, useRef, useState } from "react";
import _ from "lodash";
import {
  CardLabel,
  LabelFieldPair,
  Dropdown,
  UploadFile,
  Toast,
  Loader,
  TextInput,
  CollapsibleCardPage,
  Modal,
  ViewsIcon,
  FormStep,
  RemoveIcon,
  DatePicker,
  FieldLabelWithTooltip,
} from "@djb25/digit-ui-react-components";
import Timeline from "../components/Timeline";
import { useLocation } from "react-router-dom";
import UploadFileDigiLocker from "../../../pt/src/utils/UploadFile";

const DIGILOCKER_SUPPORTED_CODES = ["AADHAAR", "AADHAR", "DRIVING", "DRVLC", "PAN"];
const ENVIRONMENT_FILE_STORE_IDS = {
  uat: "261542df-8dae-41e7-aa17-00cd288faf3b",
  dev: "0d394691-45ed-4036-97e8-8de8b0f166b1",
};

const getEnvironmentFileStoreId = () => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.includes("uat") ? ENVIRONMENT_FILE_STORE_IDS.uat : ENVIRONMENT_FILE_STORE_IDS.dev;
};

const isDigiLockerEligible = (code = "") => {
  const upper = code.toUpperCase();
  return DIGILOCKER_SUPPORTED_CODES.some((keyword) => upper.includes(keyword));
};

const isOtherDocument = (code = "") => code.toUpperCase().includes("OTHER");

const maskDocNumber = (val) => {
  if (!val || (typeof val !== "string" && typeof val !== "number")) return "";
  const str = String(val).trim();
  if (!str || str === "NA") return str;
  if (str.length <= 4) return str;
  return "*".repeat(str.length - 4) + str.slice(-4);
};

const isRwhDocType = (doc) => {
  if (!doc) return false;
  const str = (
    (typeof doc === "string" ? doc : "") +
    " " +
    (doc?.documentType || "") +
    " " +
    (doc?.code || "") +
    " " +
    (doc?.i18nKey || "") +
    " " +
    (doc?.name || "") +
    " " +
    (doc?.documentName || "")
  ).toUpperCase();
  return str.includes("RAIN") || str.includes("HARVEST");
};

const isStpDocType = (doc) => {
  if (!doc) return false;
  const str = (
    (typeof doc === "string" ? doc : "") +
    " " +
    (doc?.documentType || "") +
    " " +
    (doc?.code || "") +
    " " +
    (doc?.i18nKey || "") +
    " " +
    (doc?.name || "") +
    " " +
    (doc?.documentName || "")
  ).toUpperCase();
  return str.includes("SEWER") || str.includes("SEWAGE") || str.includes("STP") || str.includes("TREATMENT");
};

const removeDuplicateOtherDocuments = (documentList = []) => {
  const documentTypes = new Set();
  return documentList.filter((document) => {
    if (!isOtherDocument(document?.documentType)) return true;
    if (documentTypes.has(document.documentType)) return false;
    documentTypes.add(document.documentType);
    return true;
  });
};

const getDocUploadSpecs = (doc, isApplicantPhoto) => {
  const code = (doc?.code || "").toUpperCase();
  if (isApplicantPhoto || code === "OWNER.APPLICANTPHOTO" || code.includes("PHOTO")) {
    return {
      type: "PHOTO",
      maxSize: 200 * 1024, // 200KB = 204800 bytes
      maxSizeText: "200KB",
      allowedExtensions: ["jpg", "jpeg"],
      allowedMimeTypes: ["image/jpeg", "image/jpg"],
      allowedFormatsText: "JPEG",
      accept: "image/jpeg, .jpg, .jpeg",
      uiMessage: "Allowed format: JPEG | Max file size: 200KB",
      formatErrorMessage: "Only JPEG format (.jpg, .jpeg) is allowed for Applicant Photo",
      sizeErrorMessage: "Applicant Photo size should not exceed 200KB",
    };
  }
  if (code === "OWNER.OWNERSHIPPROOF" || code.includes("OWNERSHIP")) {
    return {
      type: "OWNERSHIP",
      maxSize: 5 * 1024 * 1024, // 5MB = 5242880 bytes
      maxSizeText: "5MB",
      allowedExtensions: ["pdf"],
      allowedMimeTypes: ["application/pdf"],
      allowedFormatsText: "PDF",
      accept: ".pdf, application/pdf",
      uiMessage: "Allowed format: PDF | Max file size: 5MB",
      formatErrorMessage: "Only PDF format (.pdf) is allowed for Ownership Documents",
      sizeErrorMessage: "Ownership Document size should not exceed 5MB",
    };
  }
  // ID and Other documents (Identity Proof, Other Documents, Employee ID, etc.)
  return {
    type: "ID_OR_OTHER",
    maxSize: 1024 * 1024, // 1MB = 1048576 bytes
    maxSizeText: "1MB",
    allowedExtensions: ["pdf", "jpg", "jpeg"],
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/jpg"],
    allowedFormatsText: "PDF, JPEG",
    accept: ".pdf, application/pdf, image/jpeg, .jpg, .jpeg",
    uiMessage: "Allowed formats: PDF, JPEG | Max file size: 1MB",
    formatErrorMessage: "Only PDF and JPEG formats are allowed for this document",
    sizeErrorMessage: "File size should not exceed 1MB",
  };
};

const WSDocumentsEmployee = ({
  t,
  config,
  onSelect,
  userType,
  formData,
  setError: setFormError,
  clearErrors: clearFormErrors,
  formState,
  setValue: formSetValue,
}) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const checkIsTenant = (val) => {
    if (!val) return false;
    const code = typeof val === "object" ? val?.code || val?.name || val?.value : val;
    return String(code).toUpperCase() === "TENANT";
  };

  const isTenant =
    checkIsTenant(formData?.ConnectionDetails?.[0]?.applicantType) ||
    checkIsTenant(formData?.ConnectionDetails?.applicantType) ||
    checkIsTenant(formData?.applicationSelection?.applicantType) ||
    checkIsTenant(formData?.applicationSelection?.[0]?.applicantType) ||
    checkIsTenant(formData?.connectionHolders?.[0]?.applicantType) ||
    checkIsTenant(formData?.ConnectionHolderDetails?.[0]?.applicantType) ||
    checkIsTenant(formData?.additionalDetails?.applicantType);

  const isRwhYes = !!(
    formData?.rainWaterHarvesting?.hasCertificate === true ||
    String(formData?.rainWaterHarvesting?.hasCertificate) === "true" ||
    formData?.rainWaterHarvesting?.isRainwaterHarvesting === true ||
    String(formData?.rainWaterHarvesting?.isRainwaterHarvesting) === "true" ||
    formData?.additionalDetails?.hasRainWaterHarvestingCertificate === true ||
    formData?.additionalDetails?.isRainwaterHarvesting === true
  );

  const isRwhAdequacyYes = !!(
    formData?.rainWaterHarvesting?.hasAdequacyCertificate === true ||
    String(formData?.rainWaterHarvesting?.hasAdequacyCertificate) === "true" ||
    formData?.rainWaterHarvesting?.hasRainWaterHarvestingAdequacyCertificate === true ||
    String(formData?.rainWaterHarvesting?.hasRainWaterHarvestingAdequacyCertificate) === "true" ||
    formData?.rainWaterHarvesting?.applyForAdequacyCertificate === true ||
    String(formData?.rainWaterHarvesting?.applyForAdequacyCertificate) === "true" ||
    formData?.additionalDetails?.hasAdequacyCertificate === true ||
    String(formData?.additionalDetails?.hasAdequacyCertificate) === "true" ||
    formData?.additionalDetails?.hasRainWaterHarvestingAdequacyCertificate === true ||
    String(formData?.additionalDetails?.hasRainWaterHarvestingAdequacyCertificate) === "true" ||
    formData?.additionalDetails?.applyForAdequacyCertificate === true ||
    String(formData?.additionalDetails?.applyForAdequacyCertificate) === "true"
  );

  const isRwhMandatory = isRwhYes && isRwhAdequacyYes;

  const isStpYes = !!(
    formData?.sewerTreatmentPlant?.hasCertificate === true ||
    String(formData?.sewerTreatmentPlant?.hasCertificate) === "true" ||
    formData?.sewerTreatmentPlant?.hasStp === true ||
    String(formData?.sewerTreatmentPlant?.hasStp) === "true" ||
    formData?.sewerTreatmentPlant?.isSewerTreatmentPlant === true ||
    String(formData?.sewerTreatmentPlant?.isSewerTreatmentPlant) === "true" ||
    formData?.additionalDetails?.hasSewerTreatmentPlant === true ||
    formData?.additionalDetails?.hasStp === true ||
    formData?.additionalDetails?.isSewerTreatmentPlant === true
  );

  const isStpAdequacyYes = !!(
    formData?.sewerTreatmentPlant?.hasAdequacyCertificate === true ||
    String(formData?.sewerTreatmentPlant?.hasAdequacyCertificate) === "true" ||
    formData?.sewerTreatmentPlant?.hasStpAdequacyCertificate === true ||
    String(formData?.sewerTreatmentPlant?.hasStpAdequacyCertificate) === "true" ||
    formData?.sewerTreatmentPlant?.hasSewerTreatmentPlantAdequacyCertificate === true ||
    String(formData?.sewerTreatmentPlant?.hasSewerTreatmentPlantAdequacyCertificate) === "true" ||
    formData?.sewerTreatmentPlant?.applyForAdequacyCertificate === true ||
    String(formData?.sewerTreatmentPlant?.applyForAdequacyCertificate) === "true" ||
    formData?.sewerTreatmentPlant?.applyForStpAdequacyCertificate === true ||
    String(formData?.sewerTreatmentPlant?.applyForStpAdequacyCertificate) === "true" ||
    formData?.additionalDetails?.hasAdequacyCertificate === true ||
    String(formData?.additionalDetails?.hasAdequacyCertificate) === "true" ||
    formData?.additionalDetails?.hasStpAdequacyCertificate === true ||
    String(formData?.additionalDetails?.hasStpAdequacyCertificate) === "true" ||
    formData?.additionalDetails?.hasSewerTreatmentPlantAdequacyCertificate === true ||
    String(formData?.additionalDetails?.hasSewerTreatmentPlantAdequacyCertificate) === "true" ||
    formData?.additionalDetails?.applyForStpAdequacyCertificate === true ||
    String(formData?.additionalDetails?.applyForStpAdequacyCertificate) === "true"
  );

  const isStpMandatory = isStpYes && isStpAdequacyYes;

  const sessionDjb = Digit.SessionStorage.get("PT_CREATE_EMP_WS_NEW_FORM")?.djbEmployee;
  const djbData = formData?.djbEmployee || sessionDjb || formData?.additionalDetails;
  const isDjbEmployee = djbData?.isDjbEmployee === true || String(djbData?.isDjbEmployee) === "true";

  const [documents, setDocuments] = useState(() => {
    const initialDocs = removeDuplicateOtherDocuments(
      userType === "citizen" ? formData?.documents?.documents || formData?.documents || [] : formData?.DocumentsRequired?.documents || []
    );
    const hasDjbInDocs = initialDocs.some(
      (d) => (d?.documentType === "OWNER.DJB_EMPLOYEE_ID" || d?.documentType?.includes("DJB_EMPLOYEE_ID")) && d?.fileStoreId
    );
    const djbDocId = djbData?.document?.fileStoreId || (typeof djbData?.document === "string" ? djbData?.document : null);
    if (isDjbEmployee && !hasDjbInDocs && djbDocId) {
      initialDocs.push({
        documentType: "OWNER.DJB_EMPLOYEE_ID",
        fileStoreId: djbDocId,
        fileName: t("WS_UPLOAD_EMPLOYEE_ID_DOC") || "Employee_ID_Document",
        documentName: "WS_UPLOAD_EMPLOYEE_ID_DOC",
        documentUid: djbData?.employeeId || "",
        i18nKey: "WS_UPLOAD_EMPLOYEE_ID_DOC",
        status: "ACTIVE",
      });
    }
    return initialDocs;
  });

  const [enableSubmit, setEnableSubmit] = useState(true);
  const [error, setError] = useState(null);
  const hasRwhUploaded = documents?.some(
    (item) => isRwhDocType(item) && item?.fileStoreId && (item?.documentUid || item?.documentNumber) && String(item?.documentUid || item?.documentNumber).trim()
  );
  const hasStpUploaded = documents?.some((item) => isStpDocType(item) && item?.fileStoreId);
  const wsDocsData = window.location.href.includes("modify")
    ? "ModifyConnectionDocuments"
    : window.location.href.includes("disconnection")
    ? "DisconnectionDocuments"
    : "NewWSDocuments";
  let action = "create";

  const { pathname } = useLocation();
  const isEditScreen = pathname.includes("/modify-application/");
  const isMutation = pathname.includes("/property-mutate/");

  if (isEditScreen) action = "update";

  const { isLoading, data: wsDocs } = Digit.Hooks.ws.WSSearchMdmsTypes.useWSServicesNewMasters(tenantId, wsDocsData);

  const hasDjbEmployeeDoc = (documents || []).some(
    (d) => (d?.documentType === "OWNER.DJB_EMPLOYEE_ID" || d?.documentType?.includes("DJB_EMPLOYEE_ID")) && (d?.fileStoreId || d?.file)
  );

  const addEmployeeDocError = () => {
    let type = formState?.errors?.[config?.key]?.type;
    if (!Array.isArray(type)) type = [];
    if (!type.includes("OWNER.DJB_EMPLOYEE_ID")) {
      type.push("OWNER.DJB_EMPLOYEE_ID");
      setFormError && setFormError(config?.key, { type });
    }
  };

  const removeEmployeeDocError = () => {
    let type = formState?.errors?.[config?.key]?.type;
    if (Array.isArray(type)) {
      type = type.filter((e) => e != "OWNER.DJB_EMPLOYEE_ID");
      if (!type.length) {
        clearFormErrors && clearFormErrors(config?.key);
      } else {
        setFormError && setFormError(config?.key, { type });
      }
    } else {
      clearFormErrors && clearFormErrors(config?.key);
    }
  };

  useEffect(() => {
    if (onSelect && Array.isArray(documents) && documents.length > 0) {
      const docPayload = { documents: removeDuplicateOtherDocuments(documents) };
      onSelect(config.key, docPayload);
    }
  }, [documents]);

  useEffect(() => {
    if (isDjbEmployee) {
      if (!hasDjbEmployeeDoc) {
        addEmployeeDocError();
      } else {
        removeEmployeeDocError();
        if (formSetValue && formData?.djbEmployee) {
          const djbItem = (documents || []).find(
            (d) => (d?.documentType === "OWNER.DJB_EMPLOYEE_ID" || d?.documentType?.includes("DJB_EMPLOYEE_ID")) && (d?.fileStoreId || d?.file)
          );
          const fsId = djbItem?.fileStoreId || djbItem?.file;
          if (fsId && formData?.djbEmployee?.document !== fsId) {
            formSetValue("djbEmployee", {
              ...formData.djbEmployee,
              document: fsId,
            });
          }
        }
      }
    } else {
      removeEmployeeDocError();
      setDocuments((prevDocs) => {
        const filtered = (prevDocs || []).filter((d) => d?.documentType !== "OWNER.DJB_EMPLOYEE_ID" && !d?.documentType?.includes("DJB_EMPLOYEE_ID"));
        if (filtered.length !== (prevDocs || []).length) {
          return filtered;
        }
        return prevDocs;
      });
      if (formSetValue && formData?.djbEmployee?.document) {
        formSetValue("djbEmployee", {
          ...formData.djbEmployee,
          document: "",
        });
      }
    }
  }, [isDjbEmployee, hasDjbEmployeeDoc]);

  const goNext = () => {
    if (userType === "citizen") {
      let documentStep = { ...formData?.documents, documents: documents };
      onSelect(config.key, documentStep);
    } else {
      const docPayload = { documents: removeDuplicateOtherDocuments(documents) };
      if (!_.isEqual(formData?.[config.key], docPayload)) {
        onSelect(config.key, docPayload);
      }
    }
  };

  const downloadDocument = async () => {
    const downloaded = await Digit.UploadServices.DownloadFile(getEnvironmentFileStoreId(), "dl", "NOC for New Delhi Jal Board Connection.pdf");
    if (!downloaded) {
      setError(t("CS_FILE_DOWNLOAD_ERROR") || "PDF download failed");
    }
  };

  useEffect(() => {
    let count = 0;
    wsDocs?.[wsDocsData]
      ?.filter((doc) => doc?.code !== "OWNER.APPLICANTPHOTO" && !doc?.code?.includes("APPLICANTPHOTO") && !doc?.code?.includes("PHOTO"))
      ?.map((doc) => {
      const isDocRequired = isOtherDocument(doc?.code) ? false : doc.required;
      let isRequired = false;
      documents.map((data) => {
        if (isDocRequired && data?.documentType.includes(doc.code)) {
          const isIdOrOwn =
            doc.code === "OWNER.IDENTITYPROOF" ||
            doc.code === "OWNER.ADDRESSPROOF" ||
            doc.code === "OWNER.OWNERSHIPPROOF" ||
            doc.code?.includes("IDENTITY") ||
            doc.code?.includes("ADDRESS") ||
            doc.code?.includes("OWNERSHIP");
          if (isIdOrOwn) {
            if (data?.fileStoreId && data?.documentUid && String(data.documentUid).trim()) {
              isRequired = true;
            }
          } else if (data?.fileStoreId) {
            isRequired = true;
          }
        }
      });
      if (!isRequired && isDocRequired) count = count + 1;
    });
    const rwhPending = !isTenant && isRwhMandatory && !hasRwhUploaded;

    if (isDjbEmployee && !hasDjbEmployeeDoc) {
      count = count + 1;
    }

    if ((count == "0" || count == 0) && documents.length > 0 && !rwhPending) setEnableSubmit(false);
    else setEnableSubmit(true);

    if (userType !== "citizen") {
      goNext();
    }
  }, [documents, wsDocs, isRwhMandatory, hasRwhUploaded, isDjbEmployee, hasDjbEmployeeDoc]);

  if (isLoading) {
    return <Loader />;
  }

  const applicationDetailsData = JSON.parse(sessionStorage.getItem("WS_EDIT_APPLICATION_DETAILS"));

  if (window.location.href.includes("edit") && applicationDetailsData?.applicationData?.documents?.length > 0) {
    const documentsData = applicationDetailsData?.applicationData?.documents || [];
    documentsData?.map((documentData) => {
      wsDocs?.[wsDocsData]?.forEach((docData) => {
        const docType = docData?.code?.split(".")[1]
          ? docData?.code?.split(".")[0] + "." + docData?.code?.split(".")[1]
          : docData?.code?.split(".")[0];
        const dataDocType = documentData?.documentType?.split(".")[1]
          ? documentData?.documentType?.split(".")[0] + "." + documentData?.documentType?.split(".")[1]
          : documentData?.documentType?.split(".")[0];
        if (docType == dataDocType) {
          docData.auditDetails = documentData.auditDetails;
          docData.documentType = docData.documentType;
          docData.documentUid = documentData.documentUid;
          docData.documentNumber = documentData.documentNumber;
          docData.fileStoreId = documentData.fileStoreId;
          docData.id = documentData.id;
          docData.status = "ACTIVE";
        }
      });
    });
  }

  const innerContent = (
    <div className="formcomposer-section-grid ws-doc-upload">
      {wsDocs?.[wsDocsData]
        ?.filter((document) => document?.code !== "OWNER.APPLICANTPHOTO" && !document?.code?.includes("APPLICANTPHOTO") && !document?.code?.includes("PHOTO"))
        ?.map((document, index) => {
        let modifiedDocument = { ...document };
        const isOther = isOtherDocument(document?.code);
        if (isOtherDocument(modifiedDocument.code)) {
          modifiedDocument.required = false;
        }
        if (isOther && modifiedDocument.dropdownData) {
          // Exclude STP options from Other Documents dropdown
          modifiedDocument.dropdownData = modifiedDocument.dropdownData.filter((opt) => !isStpDocType(opt));
          if (isTenant) {
            modifiedDocument.dropdownData = modifiedDocument.dropdownData.filter((opt) => {
              const code = opt.code || "";
              const name = opt.name || "";
              return code.includes("NOC_FROM_OWNER") || code === "NOC from Owner" || name.includes("NOC from Owner");
            });
            if (modifiedDocument.dropdownData.length === 0) {
              modifiedDocument.dropdownData = [
                {
                  code: "OWNER.OTHERDOCUMENTS.NOC_FROM_OWNER",
                  i18nKey: "OWNER_OTHERDOCUMENTS_NOC_FROM_OWNER",
                  name: "NOC from Owner",
                  active: true,
                },
              ];
            }
          } else {
            modifiedDocument.dropdownData = modifiedDocument.dropdownData.filter((opt) => {
              const code = opt.code || "";
              const name = opt.name || "";
              return !(code.includes("NOC_FROM_OWNER") || code === "NOC from Owner" || name.includes("NOC from Owner"));
            });
          }
        }
        return (
          <SelectDocument
            key={index}
            document={modifiedDocument}
            action={action}
            t={t}
            id={`pt-document-${index}`}
            error={error}
            setError={setError}
            setDocuments={setDocuments}
            documents={documents}
            formData={formData}
            setFormError={setFormError}
            clearFormErrors={clearFormErrors}
            config={config}
            formState={formState}
            isOtherDocument={isOther}
            isRwhMandatory={isRwhMandatory}
            hasRwhUploaded={hasRwhUploaded}
            isStpMandatory={isStpMandatory}
            hasStpUploaded={hasStpUploaded}
            isTenant={isTenant}
          />
        );
      })}
      {isStpMandatory && (
        <SewerTreatmentPlantDocumentUpload
          t={t}
          documents={documents}
          setDocuments={setDocuments}
          formData={formData}
          formSetValue={formSetValue}
          tenantId={tenantId}
          isStpMandatory={isStpMandatory}
          hasStpUploaded={hasStpUploaded}
        />
      )}
      {isDjbEmployee && (
        <EmployeeIdDocumentUpload
          t={t}
          documents={documents}
          setDocuments={setDocuments}
          formData={formData}
          formSetValue={formSetValue}
          tenantId={tenantId}
        />
      )}
    </div>
  );

  const rwhAlertBanner =
    !isTenant && isRwhMandatory && !hasRwhUploaded ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
          padding: "10px 14px",
          backgroundColor: "#fff2f0",
          borderLeft: "4px solid #ff4d4f",
          borderRadius: "4px",
        }}
      >
        <span style={{ fontSize: "14px", color: "#d32f2f", fontWeight: "600" }}>
          ⚠️{" "}
          {t("WS_RWH_CERTIFICATE_MANDATORY_INSTRUCTION") && t("WS_RWH_CERTIFICATE_MANDATORY_INSTRUCTION") !== "WS_RWH_CERTIFICATE_MANDATORY_INSTRUCTION"
            ? t("WS_RWH_CERTIFICATE_MANDATORY_INSTRUCTION")
            : "Rainwater Harvesting (RWH) Certificate is mandatory."}
        </span>
      </div>
    ) : null;

  const stpAlertBanner =
    !isTenant && isStpMandatory && !hasStpUploaded ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
          padding: "10px 14px",
          backgroundColor: "#fff2f0",
          borderLeft: "4px solid #ff4d4f",
          borderRadius: "4px",
        }}
      >
        <span style={{ fontSize: "14px", color: "#d32f2f", fontWeight: "600" }}>
          ⚠️{" "}
          {t("WS_STP_CERTIFICATE_MANDATORY_INSTRUCTION") && t("WS_STP_CERTIFICATE_MANDATORY_INSTRUCTION") !== "WS_STP_CERTIFICATE_MANDATORY_INSTRUCTION"
            ? t("WS_STP_CERTIFICATE_MANDATORY_INSTRUCTION")
            : "Sewer Treatment Plant (STP) Certificate is mandatory to upload."}
        </span>
      </div>
    ) : null;

  const nocDownloadSection = isTenant ? (
    <div
      style={{
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#eaf3fa",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #00497e",
      }}
    >
      <div style={{ color: "#00497e", fontWeight: "bold" }}>{t("WS_NOC_DOCUMENT_DOWNLOAD_DESC")}</div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          downloadDocument();
        }}
        style={{
          cursor: "pointer",
          color: "#fff",
          fontWeight: "bold",
          padding: "6px 14px",
          border: "1px solid #00497e",
          borderRadius: "4px",
          backgroundColor: "#00497e",
          whiteSpace: "nowrap",
        }}
      >
        {t("WS_DOWNLOAD_DOCUMENT")}
      </button>
    </div>
  ) : null;

  if (userType === "citizen") {
    return (
      <div>
        <Timeline currentStep={3} />
        <FormStep t={t} config={config} onSelect={goNext} onSkip={() => onSelect()} isDisabled={enableSubmit}>
          {rwhAlertBanner}
          {stpAlertBanner}
          {nocDownloadSection}
          {innerContent}
          {error && <Toast label={error} onClose={() => setError(null)} error isDleteBtn={true} duration={3000} />}
        </FormStep>
      </div>
    );
  }

  return (
    <CollapsibleCardPage title={t("WS_DOCUMENTS")} defaultOpen={true}>
      {rwhAlertBanner}
      {stpAlertBanner}
      {nocDownloadSection}
      {innerContent}
      {error && <Toast label={error} onClose={() => setError(null)} error isDleteBtn={true} duration={3000} />}
    </CollapsibleCardPage>
  );
};

function SewerTreatmentPlantDocumentUpload({
  t,
  documents,
  setDocuments,
  formData,
  formSetValue,
  tenantId,
  isStpMandatory,
  hasStpUploaded,
}) {
  const existingStpDoc = documents?.find((d) => isStpDocType(d));
  const initialFileId = existingStpDoc?.fileStoreId || null;

  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(initialFileId);
  const [fileName, setFileName] = useState(existingStpDoc?.fileName || "");
  const [documentUid, setDocumentUid] = useState(existingStpDoc?.documentUid || existingStpDoc?.documentNumber || "");
  const [isFocused, setIsFocused] = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [validityDate, setValidityDate] = useState(
    existingStpDoc?.validityDate ||
    existingStpDoc?.validityUpTo ||
    existingStpDoc?.additionalDetails?.validityDate ||
    ""
  );
  const [errorUpload, setErrorUpload] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileType, setDocFileType] = useState("");

  const specs = {
    maxSize: 1024 * 1024,
    maxSizeText: "1MB",
    allowedExtensions: ["pdf", "jpg", "jpeg"],
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/jpg"],
    accept: ".pdf, application/pdf, image/jpeg, .jpg, .jpeg",
    uiMessage: "Allowed formats: PDF, JPEG | Max file size: 1MB",
    formatErrorMessage: "Only PDF and JPEG formats are allowed for Sewer Treatment Plant (STP) Certificate",
    sizeErrorMessage: "Sewer Treatment Plant (STP) Certificate size should not exceed 1MB",
  };

  useEffect(() => {
    const doc = documents?.find((d) => isStpDocType(d));
    if (doc?.fileStoreId && doc.fileStoreId !== uploadedFile) {
      setUploadedFile(doc.fileStoreId);
      if (doc.fileName) setFileName(doc.fileName);
      if (doc.documentUid) setDocumentUid(doc.documentUid);
      if (doc.validityDate) setValidityDate(doc.validityDate);
    }
  }, [documents]);

  useEffect(() => {
    (async () => {
      setErrorUpload(null);
      if (file) {
        const ext = (file.name || "").split(".").pop().toLowerCase();
        const isExtAllowed = specs.allowedExtensions.includes(ext);
        const isMimeAllowed = specs.allowedMimeTypes.includes(file.type);

        if (!isExtAllowed && !isMimeAllowed) {
          setErrorUpload(specs.formatErrorMessage);
          setFile(null);
          return;
        }

        if (file.size > specs.maxSize) {
          setErrorUpload(specs.sizeErrorMessage);
          setFile(null);
          return;
        }

        try {
          setUploadedFile(null);
          const stateOrTenantId = tenantId?.split(".")[0] || Digit.ULBService.getStateId();
          const response = await Digit.UploadServices.Filestorage("WS", file, stateOrTenantId);
          if (response?.data?.files?.length > 0) {
            const fileId = response?.data?.files[0]?.fileStoreId;
            const nameOfFile = file?.name || "STP_Certificate";
            setUploadedFile(fileId);
            setFileName(nameOfFile);

            setDocuments((prevDocs) => {
              const filtered = (prevDocs || []).filter((d) => !isStpDocType(d));
              return [
                ...filtered,
                {
                  documentType: "OWNER.OTHERDOCUMENTS.SEWER_TREATMENT_PLANT",
                  fileStoreId: fileId,
                  fileName: nameOfFile,
                  documentName: "Sewer Treatment Plant (STP) Certificate",
                  documentUid: documentUid,
                  documentNumber: documentUid,
                  validityDate: validityDate || undefined,
                  validityUpTo: validityDate || undefined,
                  date: validityDate || undefined,
                  stpValidityDate: validityDate || undefined,
                  additionalDetails: {
                    validityDate: validityDate || undefined,
                    validityUpTo: validityDate || undefined,
                    date: validityDate || undefined,
                    stpValidityDate: validityDate || undefined,
                  },
                  i18nKey: "OWNER_OTHERDOCUMENTS_SEWER_TREATMENT_PLANT",
                  status: "ACTIVE",
                },
              ];
            });
          } else {
            setErrorUpload(t("CS_FILE_UPLOAD_ERROR") || "File Upload Error");
          }
        } catch (err) {
          setErrorUpload(t("CS_FILE_UPLOAD_ERROR") || "File Upload Error");
        }
      }
    })();
  }, [file]);

  const updateStpDocFields = (newUid, newDate) => {
    if (uploadedFile) {
      setDocuments((prevDocs) => {
        return (prevDocs || []).map((d) => {
          if (isStpDocType(d)) {
            return {
              ...d,
              documentUid: newUid !== undefined ? newUid : d.documentUid,
              documentNumber: newUid !== undefined ? newUid : d.documentNumber,
              validityDate: newDate !== undefined ? newDate : d.validityDate,
              validityUpTo: newDate !== undefined ? newDate : d.validityUpTo,
              date: newDate !== undefined ? newDate : d.date,
              stpValidityDate: newDate !== undefined ? newDate : d.stpValidityDate,
              additionalDetails: {
                ...(d.additionalDetails || {}),
                validityDate: newDate !== undefined ? newDate : d.validityDate,
                validityUpTo: newDate !== undefined ? newDate : d.validityUpTo,
                date: newDate !== undefined ? newDate : d.date,
                stpValidityDate: newDate !== undefined ? newDate : d.stpValidityDate,
              },
            };
          }
          return d;
        });
      });
    }
  };

  const handleDelete = () => {
    setUploadedFile(null);
    setFile(null);
    setFileName("");
    setErrorUpload(null);
    const fileInput = document.getElementById("stp-doc-upload");
    if (fileInput) fileInput.value = "";
    setDocuments((prevDocs) => (prevDocs || []).filter((d) => !isStpDocType(d)));
  };

  const handleView = async (fileStoreId) => {
    try {
      const id = typeof fileStoreId === "object" ? fileStoreId?.fileStoreId : fileStoreId;
      if (!id) return;
      const stateOrTenantId = tenantId?.split(".")[0] || Digit.ULBService.getStateId();
      const res = await Digit.UploadServices.Filefetch([id], stateOrTenantId);
      const url = res?.data?.fileStoreIds?.[0]?.url;
      if (url) {
        setDocFileUrl(url);
        setDocFileType(url.includes(".pdf") ? "pdf" : "image");
        setShowDocModal(true);
      }
    } catch (e) {}
  };

  return (
    <React.Fragment>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_STP_CERTIFICATE_LABEL")}
          isMandatory={isStpMandatory}
          infoText={t("WS_STP_CERTIFICATE_INFO_MSG")}
        />
        <div className="field">
          <TextInput
            type="text"
            value={t("WS_STP_CERTIFICATE_OPTION")}
            disabled={true}
            style={{ backgroundColor: "#f7f7f7", cursor: "not-allowed", color: "#333", fontWeight: 500 }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_STP_DOCUMENT_NO")}
          isMandatory={false}
          infoText={t("WS_STP_DOC_NO_INFO_MSG")}
        />
        <div className="field" style={{ position: "relative" }}>
          <TextInput
            type="text"
            value={isFocused || showUnmasked ? documentUid : maskDocNumber(documentUid)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              setDocumentUid(e.target.value);
              updateStpDocFields(e.target.value, validityDate);
            }}
            placeholder={t("WS_ENTER_IDENTITY_NUMBER")}
            style={{ paddingRight: documentUid ? "36px" : "12px" }}
          />
          {documentUid && (
            <span
              onClick={() => setShowUnmasked((prev) => !prev)}
              title={showUnmasked ? "Hide" : "Show"}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#505A5F",
                userSelect: "none",
              }}
            >
              {showUnmasked ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("WS_UPLOAD_STP_DOCUMENT")}
          isMandatory={isStpMandatory}
          infoText={t("WS_UPLOAD_STP_DOC_INFO_MSG")}
        />
        <div style={{ fontSize: "12px", color: "#555", marginTop: "-2px", marginBottom: "4px" }}>
          {specs.uiMessage}
        </div>
        <div className="field" style={{ display: "flex", gap: "10px", alignItems: "flex-start", width: "100%" }}>
          <div style={{ flex: 1 }}>
            <UploadFile
              id="stp-doc-upload"
              onUpload={(e) => {
                const selected = e?.target?.files?.[0];
                setErrorUpload(null);
                if (selected) {
                  const ext = (selected.name || "").split(".").pop().toLowerCase();
                  if (!specs.allowedExtensions.includes(ext)) {
                    setErrorUpload(specs.formatErrorMessage);
                    if (e?.target) e.target.value = "";
                    return;
                  }
                  if (selected.size > specs.maxSize) {
                    setErrorUpload(specs.sizeErrorMessage);
                    if (e?.target) e.target.value = "";
                    return;
                  }
                  setFile(selected);
                }
              }}
              onDelete={handleDelete}
              message={uploadedFile ? `1 ${t("CS_ACTION_FILEUPLOADED")}` : t("CS_ACTION_NO_FILEUPLOADED")}
              accept={specs.accept}
            />
          </div>
        </div>
        {errorUpload && <div style={{ fontSize: "12px", color: "#d32f2f", marginTop: "4px" }}>{errorUpload}</div>}
        {uploadedFile && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
              padding: "4px 8px",
              background: "#f7f7f7",
              borderRadius: "4px",
            }}
          >
            <span style={{ fontSize: "14px", color: "#00497e", fontWeight: "bold" }}>
              {t("WS_STP_CERTIFICATE_OPTION")}
              {fileName ? ` - ${fileName}` : ""}
            </span>
            {documentUid && <span>{documentUid}</span>}
            {validityDate && (
              <span style={{ fontSize: "13px", color: "#333" }}>
                ({t("WS_VALIDITY_UP_TO")}: {validityDate})
              </span>
            )}
            <button
              type="button"
              onClick={() => handleView(uploadedFile)}
              title={t("WS_VIEW_DOCUMENT") || "View Document"}
              style={{ border: "none", background: "transparent", color: "#00497e", cursor: "pointer", padding: 0 }}
            >
              <ViewsIcon />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              title={t("CS_ACTION_DELETE") || "Delete"}
              style={{ border: "none", background: "transparent", color: "#d32f2f", cursor: "pointer", padding: 0 }}
            >
              <RemoveIcon />
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <FieldLabelWithTooltip
          style={{ margin: 0 }}
          label={t("Validity up to date")}
          isMandatory={isStpMandatory}
          infoText={t("Validity up to date")}
        />
        <div className="field" style={{ width: "100%" }}>
          <DatePicker
            date={validityDate}
            onChange={(date) => {
              setValidityDate(date);
              updateStpDocFields(documentUid, date);
            }}
            style={{ width: "100%" }}
          />
        </div>
        {uploadedFile && isStpMandatory && !validityDate && (
          <div style={{ fontSize: "12px", color: "#d32f2f", marginTop: "-4px" }}>
            * {t("CORE_COMMON_REQUIRED_ERRMSG") || "This field is required"}
          </div>
        )}
      </div>

      {showDocModal && (
        <Modal
          headerBarMain={<h3>{t("WS_VIEW_DOCUMENT")}</h3>}
          headerBarEnd={<span style={{ cursor: "pointer", fontWeight: "bold", fontSize: "16px" }} onClick={() => setShowDocModal(false)}>✕</span>}
          actionCancelLabel={null}
          actionSaveLabel={null}
          hideSubmit={true}
        >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px", padding: "10px" }}>
            {docFileType === "pdf" ? (
              <iframe src={docFileUrl} title="Document" width="100%" height="500px" style={{ border: "none" }} />
            ) : (
              <img src={docFileUrl} alt="Document" style={{ maxWidth: "100%", maxHeight: "500px" }} />
            )}
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
}

function EmployeeIdDocumentUpload({ t, documents, setDocuments, formData, formSetValue, tenantId }) {
  const existingEmployeeDoc = documents?.find((d) => d?.documentType === "OWNER.DJB_EMPLOYEE_ID" || d?.documentType?.includes("DJB_EMPLOYEE_ID"));
  const initialFileId =
    existingEmployeeDoc?.fileStoreId ||
    formData?.djbEmployee?.document?.fileStoreId ||
    (typeof formData?.djbEmployee?.document === "string" ? formData?.djbEmployee?.document : null);

  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(initialFileId || null);
  const [fileName, setFileName] = useState(existingEmployeeDoc?.fileName || "");
  const [errorUpload, setErrorUpload] = useState(null);

  const specs = {
    maxSize: 1024 * 1024, // 1MB = 1048576 bytes
    maxSizeText: "1MB",
    allowedExtensions: ["pdf", "jpg", "jpeg"],
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/jpg"],
    accept: ".pdf, application/pdf, image/jpeg, .jpg, .jpeg",
    uiMessage: "Allowed formats: PDF, JPEG | Max file size: 1MB",
    formatErrorMessage: "Only PDF and JPEG formats are allowed for Employee ID Document",
    sizeErrorMessage: "Employee ID Document size should not exceed 1MB",
  };

  useEffect(() => {
    const doc = documents?.find((d) => d?.documentType === "OWNER.DJB_EMPLOYEE_ID" || d?.documentType?.includes("DJB_EMPLOYEE_ID"));
    const currentId =
      doc?.fileStoreId ||
      formData?.djbEmployee?.document?.fileStoreId ||
      (typeof formData?.djbEmployee?.document === "string" ? formData?.djbEmployee?.document : null);
    if (currentId !== uploadedFile) {
      setUploadedFile(currentId || null);
      if (doc?.fileName) setFileName(doc.fileName);
    }
  }, [documents, formData?.djbEmployee?.document]);

  useEffect(() => {
    (async () => {
      setErrorUpload(null);
      if (file) {
        const ext = (file.name || "").split(".").pop().toLowerCase();
        const isExtAllowed = specs.allowedExtensions.includes(ext);
        const isMimeAllowed = specs.allowedMimeTypes.includes(file.type);

        if (!isExtAllowed && !isMimeAllowed) {
          setErrorUpload(t("WS_ONLY_PDF_JPEG_ALLOWED_EMP") || specs.formatErrorMessage);
          setFile(null);
          return;
        }

        if (file.size > specs.maxSize) {
          setErrorUpload(t("WS_EMP_ID_MAX_SIZE_EXCEEDED") || specs.sizeErrorMessage);
          setFile(null);
          return;
        }

        try {
          setUploadedFile(null);
          const stateOrTenantId = tenantId?.split(".")[0] || Digit.ULBService.getStateId();
          const response = await Digit.UploadServices.Filestorage("WS", file, stateOrTenantId);
          if (response?.data?.files?.length > 0) {
            const fileId = response?.data?.files[0]?.fileStoreId;
            const nameOfFile = file?.name || t("WS_UPLOAD_EMPLOYEE_ID_DOC") || "Employee_ID_Document";
            setUploadedFile(fileId);
            setFileName(nameOfFile);

            setDocuments((prevDocs) => {
              const filtered = (prevDocs || []).filter(
                (d) => d?.documentType !== "OWNER.DJB_EMPLOYEE_ID" && !d?.documentType?.includes("DJB_EMPLOYEE_ID")
              );
              return [
                ...filtered,
                {
                  documentType: "OWNER.DJB_EMPLOYEE_ID",
                  fileStoreId: fileId,
                  fileName: nameOfFile,
                  documentName: "WS_UPLOAD_EMPLOYEE_ID_DOC",
                  documentUid: formData?.djbEmployee?.employeeId || "",
                  i18nKey: "WS_UPLOAD_EMPLOYEE_ID_DOC",
                  status: "ACTIVE",
                },
              ];
            });

            if (formSetValue && formData?.djbEmployee) {
              formSetValue("djbEmployee", {
                ...formData.djbEmployee,
                document: fileId,
              });
            }
          } else {
            setErrorUpload(t("CS_FILE_UPLOAD_ERROR") || "File Upload Error");
          }
        } catch (err) {
          setErrorUpload(t("CS_FILE_UPLOAD_ERROR") || "File Upload Error");
        }
      }
    })();
  }, [file]);

  function selectfile(e) {
    const selected = e?.target?.files?.[0];
    setErrorUpload(null);
    if (selected) {
      const ext = (selected.name || "").split(".").pop().toLowerCase();
      const isExtAllowed = specs.allowedExtensions.includes(ext);
      const isMimeAllowed = specs.allowedMimeTypes.includes(selected.type);

      if (!isExtAllowed && !isMimeAllowed) {
        setErrorUpload(t("WS_ONLY_PDF_JPEG_ALLOWED_EMP") || specs.formatErrorMessage);
        if (e?.target) e.target.value = "";
        return;
      }

      if (selected.size > specs.maxSize) {
        setErrorUpload(t("WS_EMP_ID_MAX_SIZE_EXCEEDED") || specs.sizeErrorMessage);
        if (e?.target) e.target.value = "";
        return;
      }
      setFile(selected);
    }
  }

  const handleDelete = () => {
    setUploadedFile(null);
    setFile(null);
    setFileName("");
    setErrorUpload(null);
    const fileInput = document.getElementById("employee-doc-upload");
    if (fileInput) fileInput.value = "";

    setDocuments((prevDocs) =>
      (prevDocs || []).filter((d) => d?.documentType !== "OWNER.DJB_EMPLOYEE_ID" && !d?.documentType?.includes("DJB_EMPLOYEE_ID"))
    );

    if (formSetValue && formData?.djbEmployee) {
      formSetValue("djbEmployee", {
        ...formData.djbEmployee,
        document: "",
      });
    }
  };

  const handleView = async (fileStoreId) => {
    try {
      const id = typeof fileStoreId === "object" ? fileStoreId?.fileStoreId : fileStoreId;
      if (!id) return;
      const stateOrTenantId = tenantId?.split(".")[0] || Digit.ULBService.getStateId();
      const response = await Digit.UploadServices.Filefetch([id], stateOrTenantId);
      const url = response?.data?.fileStoreIds?.[0]?.url;
      if (url) {
        const differentFormats = url?.split(",") || [];
        let fileURL = "";
        differentFormats.forEach((link) => {
          if (!link.includes("large") && !link.includes("medium") && !link.includes("small")) {
            fileURL = link;
          }
        });
        window.open(fileURL || differentFormats[0], "_blank");
      }
    } catch (error) {
      console.error("Error fetching file URL:", error);
    }
  };

  return (
    <div
      style={{
        gridColumn: "span 2",
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "20px",
        width: "100%",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 1" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <FieldLabelWithTooltip
            style={{ margin: 0 }}
            label={t("WS_UPLOAD_EMPLOYEE_ID_DOC") || t("Upload Employee ID Document")}
            isMandatory={true}
            infoText={t("WS_EMPLOYEE_ID_DOC_INFO_MSG")}
          />
        </div>
        <div style={{ fontSize: "12px", color: "#555", marginTop: "-2px", marginBottom: "4px" }}>{specs.uiMessage}</div>
        <div className="field" style={{ display: "flex", gap: "10px", alignItems: "flex-start", width: "100%" }}>
          <div style={{ flex: 1 }}>
            <UploadFile
              id={"employee-doc-upload"}
              extraStyleName={"propertyCreate"}
              placeholder={t("WS_UPLOAD_EMPLOYEE_ID_DOC") || t("Upload Employee ID Document")}
              accept={specs.accept}
              onUpload={selectfile}
              onDelete={handleDelete}
              message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`ES_NO_FILE_SELECTED_LABEL`)}
              error={errorUpload}
              uploadedFiles={
                uploadedFile && !file
                  ? [[fileName || t("WS_UPLOAD_EMPLOYEE_ID_DOC") || t("Upload Employee ID Document"), { fileStoreId: uploadedFile }]]
                  : undefined
              }
            />
          </div>
        </div>
        {errorUpload && <div style={{ fontSize: "12px", color: "#d32f2f", marginTop: "4px" }}>{errorUpload}</div>}
        {uploadedFile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "4px",
              color: "#00497e",
            }}
          >
            <span style={{ fontWeight: "bold" }}>
              {t("WS_UPLOAD_EMPLOYEE_ID_DOC") || t("Upload Employee ID Document")}
              {fileName ? ` - ${fileName}` : ""}
            </span>
            <button
              type="button"
              onClick={() => handleView(uploadedFile)}
              title={t("WS_VIEW_DOCUMENT") || "View Document"}
              style={{ border: "none", background: "transparent", color: "#00497e", cursor: "pointer", padding: 0 }}
            >
              <ViewsIcon />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              title="Remove Document"
              style={{ border: "none", background: "transparent", color: "#d32f2f", cursor: "pointer", padding: 0, fontSize: "18px" }}
            >
              <RemoveIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectDocument({
  t,
  document: doc,
  setDocuments,
  error,
  setError,
  documents,
  action,
  formData,
  setFormError,
  clearFormErrors,
  config,
  formState,
  fromRawData,
  id,
  isOtherDocument: isOther = false,
  isRwhMandatory = false,
  hasRwhUploaded = false,
  isStpMandatory = false,
  hasStpUploaded = false,
  isTenant: isTenantProp,
}) {
  const fileRef = useRef();
  const pendingId = useRef(Date.now());
  const otherUploadedDocuments = isOther
    ? documents?.filter((item) => item?.documentType?.includes(doc?.code) && item?.tempId !== pendingId.current) || []
    : [];
  const filteredDocument = isOther ? null : documents?.filter((item) => item?.documentType?.includes(doc?.code))[0];
  const isApplicantPhoto = doc?.code === "OWNER.APPLICANTPHOTO";
  const specs = getDocUploadSpecs(doc, isApplicantPhoto);
  const [fileError, setFileError] = useState(null);
  const isIdentityProof = doc?.code === "OWNER.IDENTITYPROOF" || doc?.code?.includes("IDENTITYPROOF") || doc?.code?.includes("IDENTITY");
  const isOwnershipProof =
    doc?.code === "OWNER.ADDRESSPROOF" ||
    doc?.code === "OWNER.OWNERSHIPPROOF" ||
    doc?.code?.includes("ADDRESSPROOF") ||
    doc?.code?.includes("OWNERSHIP");
  const [isFocused, setIsFocused] = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(() => {
    if (filteredDocument && doc?.dropdownData) {
      const match = doc?.dropdownData?.find((d) => d.code === filteredDocument.documentType);
      if (match) return { ...filteredDocument, ...match };
    }
    if (isOther && isRwhMandatory && !hasRwhUploaded && doc?.dropdownData) {
      const rwhMatch = doc?.dropdownData?.find((d) => isRwhDocType(d));
      if (rwhMatch) return { ...rwhMatch, i18nKey: rwhMatch.code?.replaceAll(".", "_") };
    }
    if (isApplicantPhoto) {
      return filteredDocument
        ? { ...filteredDocument, code: filteredDocument?.documentType || doc?.code || "OWNER.APPLICANTPHOTO", i18nKey: "OWNER_APPLICANTPHOTO" }
        : { ...doc, code: doc?.code || "OWNER.APPLICANTPHOTO", i18nKey: "OWNER_APPLICANTPHOTO" };
    }
    return filteredDocument
      ? { ...filteredDocument, code: filteredDocument?.documentType, i18nKey: filteredDocument?.documentType?.replaceAll(".", "_") }
      : doc?.hasDropdown && Array.isArray(doc?.dropdownData) && doc?.dropdownData?.length > 0
      ? doc?.dropdownData?.length === 1
        ? doc?.dropdownData[0]
        : {}
      : doc;
  });
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(() => (isOther ? null : filteredDocument?.fileStoreId || null));
  const [validityDate, setValidityDate] = useState(() => {
    return filteredDocument?.validityDate || filteredDocument?.validityUpTo || filteredDocument?.additionalDetails?.validityDate || "";
  });
  const [documentUid, setDocumentUid] = useState(() => {
    if (isOther) return "";
    const num = filteredDocument?.documentNumber || "";
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (uuidRegex.test(num) || num === filteredDocument?.fileStoreId || num === filteredDocument?.id) {
      return "";
    }
    return num;
  });
  const [isDocumentUidLocked, setIsDocumentUidLocked] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraFile, setIsCameraFile] = useState(false);

  const [showDocModal, setShowDocModal] = useState(false);
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileType, setDocFileType] = useState("");

  const [digiLockerUpload, setDigilockerUpload] = useState(false);
  const [docNumberError, setDocNumberError] = useState(null);

  const isSelectedRwh = isRwhDocType(selectedDocument);
  const showValidityDate = isOther && (isRwhMandatory || isSelectedRwh);
  const isRwhDoc = isOther && (isRwhMandatory || isSelectedRwh);
  const isDocNumberMandatory = isIdentityProof || isOwnershipProof || (isRwhDoc && isRwhMandatory);

  const isOtherDocumentsRemark = Boolean(
    isOther &&
      selectedDocument &&
      (selectedDocument?.code === "OWNER.OTHERDOCUMENTS.OTHER_DOCUMENTS" ||
        selectedDocument?.code === "OWNER_OTHERDOCUMENTS_OTHER_DOCUMENTS" ||
        selectedDocument?.i18nKey === "OWNER_OTHERDOCUMENTS_OTHER_DOCUMENTS" ||
        selectedDocument?.code?.endsWith(".OTHER_DOCUMENTS") ||
        selectedDocument?.code?.includes("OTHER_DOCUMENTS") ||
        selectedDocument?.name?.toUpperCase()?.includes("OTHER DOCUMENT") ||
        selectedDocument?.i18nKey?.includes("OTHER_DOCUMENTS"))
  );

  const validateDocumentNumber = (value, docTypeCode, isReq, hasFile) => {
    const trimmed = (value || "").trim();
    if (isDocNumberMandatory || isReq) {
      if (!trimmed) return t("CORE_COMMON_REQUIRED_ERRMSG") || "This field is required";
    } else {
      if (!isReq && !hasFile && !trimmed) return null;
      if (!trimmed) return null;
    }
    const upperCode = (docTypeCode || "").toUpperCase();

    if (
      isOtherDocumentsRemark ||
      upperCode.includes("OTHER_DOCUMENTS") ||
      upperCode.includes("OTHERDOCUMENTS") ||
      upperCode.includes("OTHER_DOCUMENT")
    ) {
      return null;
    }

    if (upperCode.includes("AADHAAR") || upperCode.includes("AADHAR")) {
      if (!/^\d{12}$/.test(trimmed)) return t("WS_AADHAAR_VALIDATION_ERROR") || "Aadhaar number must be exactly 12 digits";
    } else if (upperCode.includes("PAN")) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmed.toUpperCase())) return t("WS_PAN_VALIDATION_ERROR") || "PAN must be in format ABCDE1234F";
    } else if (upperCode.includes("VOTER") || upperCode.includes("VOTERID")) {
      if (!/^[A-Z]{3}\d{7}$/.test(trimmed.toUpperCase())) return t("WS_VOTERID_VALIDATION_ERROR") || "Voter ID must be in format ABC1234567";
    } else if (upperCode.includes("DRIVING") || upperCode.includes("DRVLC")) {
      if (!/^[A-Z]{2}\d{13}$/.test(trimmed.toUpperCase()))
        return t("WS_DRIVING_LICENSE_VALIDATION_ERROR") || "Driving License must be 15 characters (e.g. MH1420110012345)";
    } else if (upperCode.includes("PASSPORT")) {
      if (!/^[A-Z]{1}\d{7}$/.test(trimmed.toUpperCase())) return t("WS_PASSPORT_VALIDATION_ERROR") || "Passport must be 8 characters (e.g. A1234567)";
    } else {
      if (trimmed.length < 3) return t("WS_DOC_NO_MIN_LENGTH") || "Document number must be at least 3 characters";
    }
    return null;
  };

  useEffect(() => {
    const eligible = isDigiLockerEligible(selectedDocument?.code || "");
    setDigilockerUpload(eligible);
  }, [selectedDocument]);

  const handleCapture = (capturedFile) => {
    setFileError(null);
    if (capturedFile.size > specs.maxSize) {
      const msg = t("WS_PHOTO_MAX_SIZE_EXCEEDED") || specs.sizeErrorMessage;
      setError(msg);
      setFileError(msg);
      setShowCamera(false);
      return;
    }
    setFile(capturedFile);
    setIsCameraFile(true);
    setShowCamera(false);
  };

  const handleSelectDocument = (value) => setSelectedDocument(value);

  const removeUploadedDocument = (fileStoreId) => {
    setDocuments((previousDocuments) => previousDocuments.filter((item) => item?.fileStoreId !== fileStoreId));
    setFileError(null);
    if (fileStoreId === uploadedFile) {
      setUploadedFile(null);
      setFile(null);
      setDocumentUid("");
      setValidityDate("");
      if (isOther && doc?.hasDropdown) {
        setSelectedDocument({});
      }
    }
  };

  const viewDocument = async (fileStoreId = uploadedFile) => {
    if (fileStoreId) {
      try {
        const res = await Digit.UploadServices.FileFetchbyid(fileStoreId, Digit.ULBService.getStateId());
        if (res?.data) {
          const contentType = res.headers?.["content-type"] || res.headers?.["Content-Type"] || "";
          // Determine type by content-type or fall back to checking blob type
          const isPdf =
            contentType.toLowerCase().includes("pdf") || (res.data instanceof Blob && res.data.type && res.data.type.toLowerCase().includes("pdf"));
          const mimeType = isPdf ? "application/pdf" : contentType || "image/jpeg";
          const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: mimeType });
          const fileURL = URL.createObjectURL(blob);
          setDocFileUrl(fileURL);
          setDocFileType(isPdf ? "pdf" : "image");
          setShowDocModal(true);
        }
      } catch (err) {
        console.error("Failed to fetch file URL via FileFetchbyid", err);
      }
    }
  };

  useEffect(() => {
    if (filteredDocument) {
      let match = null;
      if (doc?.dropdownData) {
        match = doc?.dropdownData?.find((d) => d.code === filteredDocument.documentType);
      }
      setSelectedDocument(
        match
          ? { ...filteredDocument, ...match }
          : filteredDocument
          ? { ...filteredDocument, code: filteredDocument?.documentType, i18nKey: filteredDocument?.documentType?.replaceAll(".", "_") }
          : isApplicantPhoto
          ? { ...doc, code: doc?.code || "OWNER.APPLICANTPHOTO", i18nKey: "OWNER_APPLICANTPHOTO" }
          : doc?.hasDropdown && Array.isArray(doc?.dropdownData) && doc?.dropdownData?.length > 0
          ? doc?.dropdownData?.length === 1
            ? doc?.dropdownData[0]
            : {}
          : doc
      );
    }
  }, []);

  function selectfile(e, newFile) {
    const selectedFile = newFile || e?.target?.files?.[0];
    setFileError(null);
    if (selectedFile) {
      const ext = (selectedFile.name || "").split(".").pop().toLowerCase();
      const isExtAllowed = specs.allowedExtensions.includes(ext);
      const isMimeAllowed = specs.allowedMimeTypes.includes(selectedFile.type);

      if (!isExtAllowed && !isMimeAllowed) {
        const msg = t(specs.formatErrorMessageKey) || specs.formatErrorMessage;
        setError(msg);
        setFileError(msg);
        if (e?.target) e.target.value = "";
        return;
      }

      if (selectedFile.size > specs.maxSize) {
        const msg = t(specs.sizeErrorMessageKey) || specs.sizeErrorMessage;
        setError(msg);
        setFileError(msg);
        if (e?.target) e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
    setIsCameraFile(false);
  }
  const { dropdownData } = doc;
  const { dropdownFilter, enabledActions, filterCondition } = doc?.additionalDetails || {};
  var dropDownData = Array.isArray(dropdownData) ? dropdownData : [];

  const checkIsTenant = (val) => {
    if (!val) return false;
    const code = typeof val === "object" ? val?.code || val?.name || val?.value : val;
    return String(code).toUpperCase() === "TENANT";
  };

  const isTenant =
    isTenantProp !== undefined
      ? isTenantProp
      : checkIsTenant(formData?.ConnectionDetails?.[0]?.applicantType) ||
        checkIsTenant(formData?.ConnectionDetails?.applicantType) ||
        checkIsTenant(formData?.applicationSelection?.applicantType) ||
        checkIsTenant(formData?.applicationSelection?.[0]?.applicantType) ||
        checkIsTenant(formData?.connectionHolders?.[0]?.applicantType) ||
        checkIsTenant(formData?.ConnectionHolderDetails?.[0]?.applicantType) ||
        checkIsTenant(formData?.additionalDetails?.applicantType);

  if (isOther) {
    if (isTenant) {
      // When Tenant is selected, ONLY show "NOC from Owner" in Other Documents
      dropDownData = dropDownData?.filter((d) => {
        const code = d.code || "";
        const name = d.name || "";
        return code.includes("NOC_FROM_OWNER") || code === "NOC from Owner" || name.includes("NOC from Owner");
      });
      if (dropDownData && dropDownData.length === 0) {
        dropDownData = [
          {
            code: "OWNER.OTHERDOCUMENTS.NOC_FROM_OWNER",
            i18nKey: "OWNER_OTHERDOCUMENTS_NOC_FROM_OWNER",
            name: "NOC from Owner",
            active: true,
          },
        ];
      }
    } else {
      // When NOT Tenant, remove "NOC from Owner"
      dropDownData = dropDownData?.filter((d) => {
        const code = d.code || "";
        const name = d.name || "";
        return !(code.includes("NOC_FROM_OWNER") || code === "NOC from Owner" || name.includes("NOC from Owner"));
      });
      // Add Rain Water Harvesting Certificate for non-tenants if not present
      if (dropDownData && !dropDownData.some((d) => isRwhDocType(d))) {
        dropDownData = [
          ...dropDownData,
          {
            code: "OWNER.OTHERDOCUMENTS.RAINWATER_HARVESTING",
            i18nKey: "OWNER_OTHERDOCUMENTS_RAINWATER_HARVESTING",
            name: "Rain Water Harvesting Certificate",
            active: true,
          },
        ];
      }
    }
  }

  useEffect(() => {
    if (isOther) {
      if (isTenant) {
        const nocOwner = dropDownData?.find((d) => {
          const code = d.code || "";
          const name = d.name || "";
          return code.includes("NOC_FROM_OWNER") || code === "NOC from Owner" || name.includes("NOC from Owner");
        });
        if (nocOwner && selectedDocument?.code !== nocOwner.code) {
          setSelectedDocument({ ...nocOwner, i18nKey: nocOwner.code?.replaceAll(".", "_") || "NOC from Owner" });
        }
      } else {
        if (selectedDocument?.code && (selectedDocument.code.includes("NOC_FROM_OWNER") || selectedDocument.code === "NOC from Owner")) {
          setSelectedDocument({});
          setUploadedFile(null);
          setFile(null);
        } else if (isRwhMandatory && !hasRwhUploaded) {
          const isCurrentRwh = selectedDocument?.code && isRwhDocType(selectedDocument);
          if (!isCurrentRwh && dropDownData?.length > 0) {
            const rwhMatch = dropDownData.find((d) => isRwhDocType(d));
            if (rwhMatch && (!uploadedFile || !selectedDocument?.code)) {
              setSelectedDocument({ ...rwhMatch, i18nKey: rwhMatch.code?.replaceAll(".", "_") });
            }
          }
        }
      }
    }
  }, [isTenant, isOther, isRwhMandatory, hasRwhUploaded, isStpMandatory, hasStpUploaded, dropDownData]);

  const [isHidden, setHidden] = useState(false);
  const documentDisplayName = selectedDocument?.i18nKey || selectedDocument?.name || selectedDocument?.code || doc?.i18nKey || doc?.name || doc?.code;

  const addError = () => {
    let type = formState?.errors?.[config.key]?.type;
    if (!Array.isArray(type)) type = [];
    if (!type.includes(doc.code)) {
      type.push(doc.code);
      setFormError && setFormError(config.key, { type });
    }
  };

  const removeError = () => {
    let type = formState?.errors?.[config.key]?.type;
    if (!Array.isArray(type)) type = [];
    if (type.includes(doc?.code)) {
      type = type.filter((e) => e != doc?.code);
      if (!type.length) {
        clearFormErrors && clearFormErrors(config.key);
      } else {
        setFormError && setFormError(config.key, { type });
      }
    }
  };

  const hasOtherUploaded = isOther && documents?.some((item) => item?.documentType?.includes(doc?.code));
  const hasInput = !!uploadedFile || !!(documentUid && documentUid.trim());
  const isCompletelyEmpty = !doc?.required ? !hasInput : !uploadedFile && (!documentUid || !documentUid.trim()) && !selectedDocument?.code;

  const isPartiallyFilled = !doc?.required
    ? hasInput && !(uploadedFile && (doc?.hasDropdown ? selectedDocument?.code : true))
    : !isCompletelyEmpty && !(uploadedFile && selectedDocument?.code);

  const effectiveRequired = (doc?.required && !hasOtherUploaded) || isPartiallyFilled;

  useEffect(() => {
    if (selectedDocument?.code) {
      setDocuments((prev) => {
        let filteredDocumentsByDocumentType = prev || [];
        if (!isOther) {
          filteredDocumentsByDocumentType = filteredDocumentsByDocumentType.filter((item) => item?.documentType !== selectedDocument?.code);
        } else {
          filteredDocumentsByDocumentType = filteredDocumentsByDocumentType.filter((item) => item?.tempId !== pendingId.current);
        }

        if (uploadedFile?.length === 0 || uploadedFile === null) {
          return filteredDocumentsByDocumentType;
        }

        const filteredDocumentsByFileStoreId = filteredDocumentsByDocumentType?.filter((item) => item?.fileStoreId !== uploadedFile);
        const data = [
          ...filteredDocumentsByFileStoreId,
          {
            documentType: selectedDocument?.code,
            fileStoreId: uploadedFile,
            fileName: file?.name || filteredDocument?.fileName || "",
            documentName: selectedDocument?.i18nKey || selectedDocument?.code || "",
            documentUid: documentUid,
            documentNumber: documentUid,
            validityDate: validityDate || undefined,
            validityUpTo: validityDate || undefined,
            date: validityDate || undefined,
            remarks: isOtherDocumentsRemark ? documentUid : undefined,
            additionalDetails: {
              ...(isOtherDocumentsRemark ? { remark: documentUid } : {}),
              ...(validityDate ? { validityDate, validityUpTo: validityDate, date: validityDate } : {}),
            },
            i18nKey: selectedDocument?.code,
            id: selectedDocument?.id,
            status: "ACTIVE",
            tempId: isOther ? pendingId.current : undefined,
          },
        ];
        sessionStorage.setItem("DISCONNECTION_EDIT_DOCS", JSON.stringify(data));
        return data;
      });
    }

    const isRwhRequired = isOther && isRwhMandatory;
    const isRwhSatisfied = hasRwhUploaded || (uploadedFile && isRwhDocType(selectedDocument) && documentUid && documentUid.trim());
    const rwhMissing = isRwhRequired && !isRwhSatisfied;

    const isStpRequired = false;
    const isStpSatisfied = true;
    const stpMissing = false;

    const hasOtherUploaded = isOther && documents?.some((item) => item?.documentType?.includes(doc?.code));
    const isCompletelyEmpty = isApplicantPhoto ? !uploadedFile : !uploadedFile && (!documentUid || !documentUid.trim()) && !selectedDocument?.code;
    const isDocNumberMissing = isDocNumberMandatory && (!documentUid || !documentUid.trim());
    const isDocMissing = doc?.required && !hasOtherUploaded && (!uploadedFile || !selectedDocument?.code);
    const isPartiallyFilled = isApplicantPhoto
      ? false
      : isDocNumberMandatory
      ? !uploadedFile || !selectedDocument?.code || isDocNumberMissing
      : !isCompletelyEmpty && !(uploadedFile && selectedDocument?.code);

    const effectiveRequired =
      (doc?.required && !hasOtherUploaded) ||
      isPartiallyFilled ||
      (isOther && isRwhMandatory && !hasRwhUploaded) ||
      isDocNumberMandatory;
    const err = validateDocumentNumber(documentUid, selectedDocument?.code, isDocNumberMandatory || effectiveRequired, !!uploadedFile);

    const validityMissing = showValidityDate && isRwhMandatory && uploadedFile && !validityDate;

    if (!isHidden) {
      if (err) {
        addError();
      } else if (isDocNumberMissing) {
        addError();
      } else if (isDocMissing) {
        addError();
      } else if (rwhMissing) {
        addError();
      } else if (stpMissing) {
        addError();
      } else if (validityMissing) {
        addError();
      } else {
        removeError();
      }
    } else if (isHidden) {
      removeError();
    }
  }, [
    uploadedFile,
    selectedDocument,
    documentUid,
    validityDate,
    isHidden,
    effectiveRequired,
    isPartiallyFilled,
    hasOtherUploaded,
    formData?.ConnectionDetails?.[0],
    isRwhMandatory,
    hasRwhUploaded,
    isStpMandatory,
    hasStpUploaded,
  ]);

  useEffect(() => {
    (async () => {
      setError(null);
      if (file) {
        setFileError(null);
        const isDuplicateDocument = isOther && documents.some((item) => item?.documentType === selectedDocument?.code);

        if (isDuplicateDocument) {
          const documentNameKey = selectedDocument?.i18nKey || selectedDocument?.code || "This";
          const translatedDocumentName = t(documentNameKey);
          const documentName = translatedDocumentName === documentNameKey ? documentNameKey.replaceAll("_", " ") : translatedDocumentName;
          const msg = `Document "${documentName}" has already been uploaded.`;
          setError(msg);
          setFileError(msg);
          setFile(null);
          return;
        }

        const ext = (file.name || "").split(".").pop().toLowerCase();
        const isExtAllowed = specs.allowedExtensions.includes(ext);
        const isMimeAllowed = specs.allowedMimeTypes.includes(file.type);

        if (!isExtAllowed && !isMimeAllowed) {
          const msg = t(specs.formatErrorMessageKey) || specs.formatErrorMessage;
          setError(msg);
          setFileError(msg);
          setFile(null);
          return;
        }

        if (file.size > specs.maxSize) {
          const msg = t(specs.sizeErrorMessageKey) || specs.sizeErrorMessage;
          setError(msg);
          setFileError(msg);
          setFile(null);
          return;
        }

        try {
          setUploadedFile(null);
          setIsUploading(true);
          const response = await Digit.UploadServices.Filestorage("WS", file, Digit.ULBService.getStateId());
          if (response?.data?.files?.length > 0) {
            setUploadedFile(response?.data?.files[0]?.fileStoreId);
          } else {
            const msg = t("CS_FILE_UPLOAD_ERROR") || "File upload failed";
            setError(msg);
            setFileError(msg);
          }
        } catch (err) {
          const msg = t("CS_FILE_UPLOAD_ERROR") || "File upload failed";
          setError(msg);
          setFileError(msg);
        } finally {
          setIsUploading(false);
        }
      }
    })();
  }, [file]);

  useEffect(() => {
    if (isHidden) setUploadedFile(null);
  }, [isHidden]);

  return (
    <div
      style={{
        gridColumn: "span 2",
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "20px",
        width: "100%",
        marginBottom: "20px",
      }}
    >
      {doc?.hasDropdown && !isApplicantPhoto && Array.isArray(dropDownData) && dropDownData.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <FieldLabelWithTooltip
            style={{ margin: 0 }}
            label={t(doc?.i18nKey)}
            isMandatory={doc?.required || (!isTenant && isOther && isRwhMandatory)}
            infoText={t(`${doc?.i18nKey?.replaceAll(".", "_")}_INFO_MSG`, `Select ${t(doc?.i18nKey)}`)}
          />
          <Dropdown
            id={`doc-${doc?.code}`}
            key={`doc-${doc?.code}`}
            className="form-field"
            selected={selectedDocument ? selectedDocument : filteredDocument ? filteredDocument : selectedDocument}
            option={dropDownData.map((e) => ({ ...e, i18nKey: e.code?.replaceAll(".", "_") }))}
            select={handleSelectDocument}
            optionKey="i18nKey"
            t={t}
            placeholder={t("PT_MUTATION_SELECT_DOC_LABEL")}
          />
          {!isTenant && isOther && isRwhMandatory && !hasRwhUploaded && !(uploadedFile && isRwhDocType(selectedDocument)) && (
            <div style={{ fontSize: "12px", color: "#d32f2f", marginTop: "4px" }}>
              * {t("WS_RWH_CERTIFICATE_MANDATORY_MSG") && t("WS_RWH_CERTIFICATE_MANDATORY_MSG") !== "WS_RWH_CERTIFICATE_MANDATORY_MSG"
                ? t("WS_RWH_CERTIFICATE_MANDATORY_MSG")
                : "Please upload the Rainwater Harvesting Certificate to proceed."}
            </div>
          )}
        </div>
      ) : null}

      {showValidityDate && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <FieldLabelWithTooltip
            style={{ margin: 0 }}
            label={t("Validity up to date")}
            isMandatory={doc?.required || isRwhMandatory || isStpMandatory}
            infoText={t("Validity up to date")}
          />
          <div className="field" style={{ width: "100%" }}>
            <DatePicker date={validityDate} onChange={(date) => setValidityDate(date)} style={{ width: "100%" }} />
          </div>
          {uploadedFile && (isRwhMandatory || isStpMandatory) && !validityDate && (
            <div style={{ fontSize: "12px", color: "#d32f2f", marginTop: "-4px" }}>
              * {t("CORE_COMMON_REQUIRED_ERRMSG") || "This field is required"}
            </div>
          )}
        </div>
      )}

      {doc?.code !== "OWNER.APPLICANTPHOTO" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <FieldLabelWithTooltip
            style={{ margin: 0 }}
            label={
              isOtherDocumentsRemark
                ? !t("WS_OTHER_DOCUMENT_REMARK") || t("WS_OTHER_DOCUMENT_REMARK") === "WS_OTHER_DOCUMENT_REMARK"
                  ? "Other Document Remark"
                  : t("WS_OTHER_DOCUMENT_REMARK")
                : t(`${doc?.i18nKey?.replaceAll(".", "_")}_DOCUMENT_NO`)
            }
            isMandatory={isDocNumberMandatory}
            infoText={
              isOtherDocumentsRemark
                ? t("WS_OTHER_DOC_REMARK_INFO_MSG")
                : t(`${doc?.i18nKey?.replaceAll(".", "_")}_DOC_NO_INFO_MSG`, `Enter ${t(`${doc?.i18nKey?.replaceAll(".", "_")}_DOCUMENT_NO`)}`)
            }
          />
          <div className="field" style={{ position: "relative" }}>
            <TextInput
              type="text"
              value={isFocused || showUnmasked ? documentUid : maskDocNumber(documentUid)}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                if (!isDocumentUidLocked) {
                  let val = e.target.value;
                  const upperCode = selectedDocument?.code?.toUpperCase() || "";
                  const maxLen =
                    upperCode.includes("AADHAAR") || upperCode.includes("AADHAR")
                      ? 12
                      : upperCode.includes("PAN")
                      ? 10
                      : upperCode.includes("VOTER") || upperCode.includes("VOTERID")
                      ? 10
                      : upperCode.includes("DRIVING") || upperCode.includes("DRVLC")
                      ? 15
                      : upperCode.includes("PASSPORT")
                      ? 8
                      : isOtherDocumentsRemark
                      ? 256
                      : 64;
                  if (val.length > maxLen) {
                    val = val.substring(0, maxLen);
                  }
                  setDocumentUid(val);
                  if (isDocNumberMandatory && !val.trim()) {
                    setDocNumberError(t("CORE_COMMON_REQUIRED_ERRMSG") || "This field is required");
                  } else {
                    setDocNumberError(validateDocumentNumber(val, selectedDocument?.code, isDocNumberMandatory || doc?.required, !!uploadedFile));
                  }
                }
              }}
              onBlur={() => {
                setIsFocused(false);
                setDocNumberError(validateDocumentNumber(documentUid, selectedDocument?.code, isDocNumberMandatory || doc?.required, !!uploadedFile));
              }}
              placeholder={
                isOtherDocumentsRemark
                  ? !t("WS_ENTER_OTHER_DOCUMENT_REMARK") || t("WS_ENTER_OTHER_DOCUMENT_REMARK") === "WS_ENTER_OTHER_DOCUMENT_REMARK"
                    ? "Enter Other Document Remark"
                    : t("WS_ENTER_OTHER_DOCUMENT_REMARK")
                  : t("WS_IDENTITY_NO_PLACEHOLDER")
              }
              disabled={isDocumentUidLocked}
              style={{
                ...(isDocumentUidLocked
                  ? { backgroundColor: "#f0f0f0", cursor: "not-allowed", color: "#555" }
                  : docNumberError
                  ? { border: "1px solid #d32f2f" }
                  : {}),
                paddingRight: documentUid && !isDocumentUidLocked ? "36px" : "12px",
              }}
              maxLength={
                selectedDocument?.code?.toUpperCase().includes("AADHAAR") || selectedDocument?.code?.toUpperCase().includes("AADHAR")
                  ? 12
                  : selectedDocument?.code?.toUpperCase().includes("PAN")
                  ? 10
                  : selectedDocument?.code?.toUpperCase().includes("VOTER") || selectedDocument?.code?.toUpperCase().includes("VOTERID")
                  ? 10
                  : selectedDocument?.code?.toUpperCase().includes("DRIVING") || selectedDocument?.code?.toUpperCase().includes("DRVLC")
                  ? 15
                  : selectedDocument?.code?.toUpperCase().includes("PASSPORT")
                  ? 8
                  : isOtherDocumentsRemark
                  ? 256
                  : 64
              }
            />
            {documentUid && !isDocumentUidLocked && (
              <span
                onClick={() => setShowUnmasked((prev) => !prev)}
                title={showUnmasked ? "Hide" : "Show"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: "#505A5F",
                  userSelect: "none",
                }}
              >
                {showUnmasked ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </span>
            )}
            {docNumberError && <div style={{ fontSize: "12px", color: "#d32f2f", marginTop: "4px" }}>{docNumberError}</div>}

            {(selectedDocument?.code?.toUpperCase().includes("AADHAAR") || selectedDocument?.code?.toUpperCase().includes("AADHAR")) &&
              !docNumberError && (
                <div style={{ fontSize: "11px", color: "#000000", marginTop: "4px" }}>
                  {t("WS_AADHAAR_VALIDATION_ERROR") || "Format: 12-digit numeric (e.g. 123456789012)"}
                </div>
              )}
            {selectedDocument?.code?.toUpperCase().includes("PAN") && !docNumberError && (
              <div style={{ fontSize: "11px", color: "#000000", marginTop: "4px" }}>{t("WS_PAN_VALIDATION_ERROR") || "Format: ABCDE1234F"}</div>
            )}
            {(selectedDocument?.code?.toUpperCase().includes("VOTER") || selectedDocument?.code?.toUpperCase().includes("VOTERID")) &&
              !docNumberError && (
                <div style={{ fontSize: "11px", color: "#000000", marginTop: "4px" }}>{t("WS_VOTERID_VALIDATION_ERROR") || "Format: ABC1234567"}</div>
              )}
            {(selectedDocument?.code?.toUpperCase().includes("DRIVING") || selectedDocument?.code?.toUpperCase().includes("DRVLC")) &&
              !docNumberError && (
                <div style={{ fontSize: "11px", color: "#000000", marginTop: "4px" }}>
                  {t("WS_DRIVING_LICENSE_VALIDATION_ERROR") || "Format: MH1420110012345"}
                </div>
              )}
            {selectedDocument?.code?.toUpperCase().includes("PASSPORT") && !docNumberError && (
              <div style={{ fontSize: "11px", color: "#000000", marginTop: "4px" }}>{t("WS_PASSPORT_VALIDATION_ERROR") || "Format: A1234567"}</div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 1" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <FieldLabelWithTooltip
            style={{ margin: 0 }}
            label={
              doc?.code === "OWNER.APPLICANTPHOTO"
                ? !t("WS_UPLOAD_APPLICANT_PHOTO") || t("WS_UPLOAD_APPLICANT_PHOTO") === "WS_UPLOAD_APPLICANT_PHOTO"
                  ? doc?.description || "Upload Applicant Photo"
                  : t("WS_UPLOAD_APPLICANT_PHOTO")
                : t(`${doc?.i18nKey?.replaceAll(".", "_")}_UPLOAD_DOCUMENT`)
            }
            isMandatory={doc?.required || (!isTenant && isOther && isRwhMandatory)}
            infoText={
              doc?.code === "OWNER.APPLICANTPHOTO"
                ? t("WS_UPLOAD_APPLICANT_PHOTO_INFO_MSG")
                : t(`${doc?.i18nKey?.replaceAll(".", "_")}_UPLOAD_INFO_MSG`, `Upload ${t(`${doc?.i18nKey?.replaceAll(".", "_")}_UPLOAD_DOCUMENT`)}`)
            }
          />
        </div>
        <div style={{ fontSize: "12px", color: "#555", marginTop: "-2px", marginBottom: "4px" }}>{specs.uiMessage}</div>
        <div className="field" style={{ display: "flex", gap: "10px", alignItems: "flex-start", width: "100%" }}>
          <div style={{ flex: 1 }}>
            {digiLockerUpload ? (
              <UploadFileDigiLocker
                onUpload={selectfile}
                onDelete={() => {
                  setUploadedFile(null);
                  setFile(null);
                  setFileError(null);
                  setIsCameraFile(false);
                  setIsDocumentUidLocked(false);
                  setDocumentUid("");
                  setValidityDate("");
                  if (isOther && doc?.hasDropdown) {
                    setSelectedDocument({});
                  }
                }}
                id={id}
                message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)}
                textStyles={{ width: "100%" }}
                buttonType="button"
                error={effectiveRequired && !uploadedFile}
                accept={specs.accept}
                maxSize={specs.maxSize}
                maxSizeText={specs.maxSizeText}
                allowedExtensions={specs.allowedExtensions}
                allowedTypes={specs.allowedMimeTypes}
                allowedFormatsText={specs.allowedFormatsText}
                sizeErrorMessage={specs.sizeErrorMessage}
                formatErrorMessage={specs.formatErrorMessage}
                uploadedFiles={
                  uploadedFile && !file
                    ? [[filteredDocument?.fileName || file?.name || t(documentDisplayName || "CS_COMMON_DOCUMENT"), { fileStoreId: uploadedFile }]]
                    : undefined
                }
                removeTargetedFile={() => {
                  setFileError(null);
                  if (isOther && uploadedFile) {
                    removeUploadedDocument(uploadedFile);
                  } else {
                    setUploadedFile(null);
                    setFile(null);
                    setIsCameraFile(false);
                    setIsDocumentUidLocked(false);
                    setDocumentUid("");
                    setValidityDate("");
                    if (isOther && doc?.hasDropdown) {
                      setSelectedDocument({});
                    }
                  }
                }}
                documentType={selectedDocument?.code}
                onDocumentNumber={(num) => {
                  setDocumentUid(num);
                  setIsDocumentUidLocked(true);
                }}
              />
            ) : (
              <UploadFile
                onUpload={selectfile}
                onDelete={() => {
                  setUploadedFile(null);
                  setFile(null);
                  setFileError(null);
                  setIsCameraFile(false);
                  setIsDocumentUidLocked(false);
                  setDocumentUid("");
                  setValidityDate("");
                  if (isOther && doc?.hasDropdown) {
                    setSelectedDocument({});
                  }
                }}
                id={id}
                message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)}
                textStyles={{ width: "100%" }}
                buttonType="button"
                error={effectiveRequired && !uploadedFile}
                accept={specs.accept}
                uploadedFiles={
                  uploadedFile && !file
                    ? [[filteredDocument?.fileName || file?.name || t(documentDisplayName || "CS_COMMON_DOCUMENT"), { fileStoreId: uploadedFile }]]
                    : undefined
                }
                removeTargetedFile={() => {
                  setFileError(null);
                  if (isOther && uploadedFile) {
                    removeUploadedDocument(uploadedFile);
                  } else {
                    setUploadedFile(null);
                    setFile(null);
                    setIsCameraFile(false);
                    setIsDocumentUidLocked(false);
                    setDocumentUid("");
                    setValidityDate("");
                    if (isOther && doc?.hasDropdown) {
                      setSelectedDocument({});
                    }
                  }
                }}
              />
            )}
          </div>
          {isOther && (
            <button
              type="button"
              onClick={() => {
                if (!uploadedFile) {
                  setError(t("WS_PLEASE_UPLOAD_FILE_FIRST") || "Please upload a file first.");
                  return;
                }
                if (doc?.hasDropdown && !selectedDocument?.code) {
                  setError(t("WS_PLEASE_SELECT_DOCUMENT_TYPE") || "Please select a document type.");
                  return;
                }
                if (docNumberError) {
                  setError(docNumberError);
                  return;
                }
                if (showValidityDate && isRwhMandatory && !validityDate) {
                  setError(t("WS_PLEASE_SELECT_VALIDITY_DATE") || "Please select validity up to date.");
                  return;
                }

                pendingId.current = Date.now();

                setUploadedFile(null);
                setFile(null);
                setFileError(null);
                setSelectedDocument(doc?.hasDropdown ? {} : doc);
                setDocumentUid("");
                setValidityDate("");
                setDocNumberError(null);
                setIsDocumentUidLocked(false);
              }}
              style={{
                border: "1px solid #00497e",
                background: "#fff",
                color: "#00497e",
                borderRadius: "4px",
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: "bold",
                marginTop: "2px",
              }}
            >
              + {t("NEW_DOCUMENT_TEXT") || "Add Document"}
            </button>
          )}
        </div>
        {fileError && <div style={{ fontSize: "12px", color: "#d32f2f", marginTop: "4px" }}>{fileError}</div>}
        {(isOther
          ? otherUploadedDocuments
          : uploadedFile
          ? [
              {
                fileStoreId: uploadedFile,
                fileName: file?.name || filteredDocument?.fileName,
                documentNumber: documentUid,
                validityDate: validityDate,
              },
            ]
          : []
        ).map((uploadedDocument, index) => (
          <div
            key={uploadedDocument.fileStoreId || index}
            style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", color: "#00497e" }}
          >
            <span style={{ fontWeight: "bold" }}>
              {uploadedDocument.documentName || uploadedDocument.i18nKey || uploadedDocument.documentType || documentDisplayName
                ? t(
                    (uploadedDocument.documentName || uploadedDocument.i18nKey || uploadedDocument.documentType || documentDisplayName).replaceAll(
                      ".",
                      "_"
                    )
                  )
                : t("CS_COMMON_DOCUMENT")}
              {uploadedDocument.fileName ? ` - ${uploadedDocument.fileName}` : ""}
            </span>
            {uploadedDocument.documentNumber && <span>{maskDocNumber(uploadedDocument.documentNumber)}</span>}
            {(uploadedDocument.validityDate || uploadedDocument.validityUpTo) && (
              <span style={{ fontSize: "13px", color: "#333" }}>
                ({t("WS_VALIDITY_UP_TO") || "Validity up to"}: {uploadedDocument.validityDate || uploadedDocument.validityUpTo})
              </span>
            )}
            <button
              type="button"
              onClick={() => viewDocument(uploadedDocument.fileStoreId)}
              title={t("WS_VIEW_DOCUMENT") || "View Document"}
              style={{ border: "none", background: "transparent", color: "#00497e", cursor: "pointer", padding: 0 }}
            >
              <ViewsIcon />
            </button>
            <button
              type="button"
              onClick={() => removeUploadedDocument(uploadedDocument.fileStoreId)}
              title="Remove Document"
              style={{ border: "none", background: "transparent", color: "#d32f2f", cursor: "pointer", padding: 0, fontSize: "18px" }}
            >
              <RemoveIcon />
            </button>
          </div>
        ))}
      </div>

      {doc?.code === "OWNER.APPLICANTPHOTO" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 1" }}>
          <FieldLabelWithTooltip
            style={{ margin: 0 }}
            label={
              !t("WS_CLICK_APPLICANT_PHOTO") || t("WS_CLICK_APPLICANT_PHOTO") === "WS_CLICK_APPLICANT_PHOTO"
                ? "Click Applicant Photo"
                : t("WS_CLICK_APPLICANT_PHOTO")
            }
            isMandatory={false}
            infoText={t("WS_CLICK_APPLICANT_PHOTO_INFO_MSG")}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "20px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "6px 16px",
                  background: "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "2px",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  width: "fit-content",
                  opacity: isUploading ? 0.5 : 1,
                }}
                onClick={() => !isUploading && setShowCamera(true)}
                disabled={isUploading}
              >
                <span>📸</span> {t("WS_CLICK_PHOTO") || "Click Photo"}
              </button>
              {isUploading && (
                <span style={{ color: "#00497e", fontWeight: "bold", fontSize: "14px" }}>{t("CS_COMMON_UPLOADING") || "Uploading..."}</span>
              )}
              {uploadedFile && !isUploading && <span style={{ color: "green", fontWeight: "bold", fontSize: "14px" }}>✔ Uploaded</span>}
            </div>
          </div>
        </div>
      )}
      {showCamera && <CameraCaptureModal onCapture={handleCapture} onClose={() => setShowCamera(false)} t={t} />}
      {showDocModal && (
        <Modal
          open={showDocModal}
          headerBarMain={t("WS_VIEW_DOCUMENT") || "View Document"}
          headerBarEnd={
            <div className="icon-bg-secondary" onClick={() => setShowDocModal(false)} style={{ cursor: "pointer", padding: "5px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </div>
          }
          center
          actionCancelOnSubmit={() => setShowDocModal(false)}
          actionCancelLabel={t("CS_COMMON_CLOSE") || "Close"}
          hideSubmit={true}
          popupStyles={{ width: "80%", maxWidth: "800px" }}
        >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", minHeight: "300px" }}>
            {docFileType === "pdf" ? (
              <iframe src={docFileUrl} title="Document Preview" width="100%" height="500px" style={{ border: "none" }} />
            ) : (
              <img
                src={docFileUrl}
                alt="Document Preview"
                style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "4px" }}
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default WSDocumentsEmployee;

const CameraCaptureModal = ({ onCapture, onClose, t }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        setError(t("WS_CAMERA_ACCESS_ERROR") || "Camera Access Error");
        console.error("Error accessing camera: ", err);
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      // Mirror the canvas context horizontally so the captured photo matches the preview
      context.translate(canvasRef.current.width, 0);
      context.scale(-1, 1);

      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.toBlob(
        (blob) => {
          const file = new File([blob], "applicant_photo.jpg", { type: "image/jpeg" });
          onCapture(file);
        },
        "image/jpeg",
        0.7
      );
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.8)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {error ? (
        <div style={{ color: "white", marginBottom: "20px" }}>{error}</div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ maxWidth: "100%", maxHeight: "80%", backgroundColor: "black", transform: "scaleX(-1)" }}
        />
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ marginTop: "20px", display: "flex", gap: "20px" }}>
        {!error && (
          <button
            type="button"
            onClick={capturePhoto}
            style={{
              padding: "10px 20px",
              background: "#00497e",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {t("WS_CAPTURE_PHOTO") || "Capture"}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "10px 20px",
            background: "white",
            color: "#00497e",
            border: "1px solid #00497e",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {t("CS_COMMON_CANCEL") || "Cancel"}
        </button>
      </div>
    </div>
  );
};
