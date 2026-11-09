import { Loader, PDFSvg, CheckBox } from "@djb25/digit-ui-react-components";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { pdfDocumentName, pdfDownloadLink } from "../utils";

const getDocumentDisplayName = (docItem, code, t) => {
  const rawType = docItem?.documentType || code || "";
  const rawName = docItem?.documentName || docItem?.name || "";
  const rawKey = docItem?.i18nKey || "";

  // 1. Try direct localization keys
  const candidates = [
    rawName,
    rawKey,
    rawType,
    rawType.replaceAll(".", "_"),
    rawType.split(".").pop(),
    code,
    code?.replaceAll(".", "_"),
  ].filter(Boolean);

  for (const cand of candidates) {
    const translated = t(cand);
    if (
      translated &&
      translated !== cand &&
      !translated.includes("OWNER_") &&
      !translated.includes("WS_") &&
      !translated.includes("COMMON_")
    ) {
      return translated;
    }
  }

  // 2. Known document code patterns
  const fullStr = `${rawType} ${rawName} ${rawKey} ${code || ""}`.toUpperCase();
  if (fullStr.includes("VOTER")) return t("WS_DOCUMENT_VOTER_ID") && t("WS_DOCUMENT_VOTER_ID") !== "WS_DOCUMENT_VOTER_ID" ? t("WS_DOCUMENT_VOTER_ID") : "Voter ID Card";
  if (fullStr.includes("AADHAAR") || fullStr.includes("AADHAR")) return t("WS_DOCUMENT_AADHAAR") && t("WS_DOCUMENT_AADHAAR") !== "WS_DOCUMENT_AADHAAR" ? t("WS_DOCUMENT_AADHAAR") : "Aadhaar Card";
  if (fullStr.includes("PAN")) return t("WS_DOCUMENT_PAN") && t("WS_DOCUMENT_PAN") !== "WS_DOCUMENT_PAN" ? t("WS_DOCUMENT_PAN") : "PAN Card";
  if (fullStr.includes("PASSPORT")) return t("WS_DOCUMENT_PASSPORT") && t("WS_DOCUMENT_PASSPORT") !== "WS_DOCUMENT_PASSPORT" ? t("WS_DOCUMENT_PASSPORT") : "Passport";
  if (fullStr.includes("DRIVING")) return t("WS_DOCUMENT_DRIVING_LICENSE") && t("WS_DOCUMENT_DRIVING_LICENSE") !== "WS_DOCUMENT_DRIVING_LICENSE" ? t("WS_DOCUMENT_DRIVING_LICENSE") : "Driving License";
  if (fullStr.includes("ELECTRICITY")) return t("WS_DOCUMENT_ELECTRICITY_BILL") && t("WS_DOCUMENT_ELECTRICITY_BILL") !== "WS_DOCUMENT_ELECTRICITY_BILL" ? t("WS_DOCUMENT_ELECTRICITY_BILL") : "Electricity Bill";
  if (fullStr.includes("WATER_BILL") || fullStr.includes("WATERBILL")) return t("WS_DOCUMENT_WATER_BILL") && t("WS_DOCUMENT_WATER_BILL") !== "WS_DOCUMENT_WATER_BILL" ? t("WS_DOCUMENT_WATER_BILL") : "Water Bill";
  if (fullStr.includes("SALE_DEED") || fullStr.includes("SALEDEED") || fullStr.includes("REGISTRATION_DEED")) return t("WS_DOCUMENT_SALE_DEED") && t("WS_DOCUMENT_SALE_DEED") !== "WS_DOCUMENT_SALE_DEED" ? t("WS_DOCUMENT_SALE_DEED") : "Registered Sale Deed";
  if (fullStr.includes("NOC_FROM_OWNER") || fullStr.includes("NOC FROM OWNER")) return t("WS_DOCUMENT_NOC_OWNER") && t("WS_DOCUMENT_NOC_OWNER") !== "WS_DOCUMENT_NOC_OWNER" ? t("WS_DOCUMENT_NOC_OWNER") : "NOC from Owner";
  if (fullStr.includes("NOC_FROM_MCD") || fullStr.includes("NOC FROM MCD")) return t("WS_DOCUMENT_NOC_MCD") && t("WS_DOCUMENT_NOC_MCD") !== "WS_DOCUMENT_NOC_MCD" ? t("WS_DOCUMENT_NOC_MCD") : "NOC from MCD";
  if (fullStr.includes("NOC_FROM_DPCC") || fullStr.includes("NOC FROM DPCC")) return t("WS_DOCUMENT_NOC_DPCC") && t("WS_DOCUMENT_NOC_DPCC") !== "WS_DOCUMENT_NOC_DPCC" ? t("WS_DOCUMENT_NOC_DPCC") : "NOC from DPCC";
  if (fullStr.includes("RAIN") || fullStr.includes("HARVEST")) return t("WS_RAIN_WATER_HARVESTING_CERTIFICATE") && t("WS_RAIN_WATER_HARVESTING_CERTIFICATE") !== "WS_RAIN_WATER_HARVESTING_CERTIFICATE" ? t("WS_RAIN_WATER_HARVESTING_CERTIFICATE") : "Rain Water Harvesting Certificate";
  if (fullStr.includes("APPLICANTPHOTO") || fullStr.includes("PHOTO")) return t("WS_DOCUMENT_APPLICANT_PHOTO") && t("WS_DOCUMENT_APPLICANT_PHOTO") !== "WS_DOCUMENT_APPLICANT_PHOTO" ? t("WS_DOCUMENT_APPLICANT_PHOTO") : "Applicant Photo";
  if (fullStr.includes("SIGNATURE")) return t("WS_DOCUMENT_SIGNATURE") && t("WS_DOCUMENT_SIGNATURE") !== "WS_DOCUMENT_SIGNATURE" ? t("WS_DOCUMENT_SIGNATURE") : "Signature";
  if (fullStr.includes("DJB_EMPLOYEE")) return t("WS_DOCUMENT_DJB_EMPLOYEE") && t("WS_DOCUMENT_DJB_EMPLOYEE") !== "WS_DOCUMENT_DJB_EMPLOYEE" ? t("WS_DOCUMENT_DJB_EMPLOYEE") : "DJB Employee ID";
  if (fullStr.includes("GOVERNMENT_EMPLOYEE")) return t("WS_DOCUMENT_GOVERNMENT_EMPLOYEE") && t("WS_DOCUMENT_GOVERNMENT_EMPLOYEE") !== "WS_DOCUMENT_GOVERNMENT_EMPLOYEE" ? t("WS_DOCUMENT_GOVERNMENT_EMPLOYEE") : "Government Employee ID";
  if (fullStr.includes("ORGANIZATION")) return t("WS_DOCUMENT_ORGANIZATION") && t("WS_DOCUMENT_ORGANIZATION") !== "WS_DOCUMENT_ORGANIZATION" ? t("WS_DOCUMENT_ORGANIZATION") : "Organization Document";
  if (fullStr.includes("OTHER_DOCUMENTS") || fullStr.includes("OTHERDOCUMENTS")) return t("WS_DOCUMENT_OTHER") && t("WS_DOCUMENT_OTHER") !== "WS_DOCUMENT_OTHER" ? t("WS_DOCUMENT_OTHER") : "Other Documents";

  // 3. Clean fallback from raw type
  const lastPart = (rawType || rawName || code || "").split(".").pop().split("_").join(" ");
  if (lastPart) {
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).toLowerCase();
  }
  return t("CS_COMMON_DOCUMENT") || "Document";
};

const isPhotoDoc = (doc, code) => {
  const str = (
    (doc?.documentType || "") + " " +
    (doc?.documentName || "") + " " +
    (code || "")
  ).toUpperCase();
  return str.includes("APPLICANTPHOTO") || str.includes("PHOTO");
};

const isPhotoOrSignatureDoc = (doc, code) => {
  const str = (
    (doc?.documentType || "") + " " +
    (doc?.documentName || "") + " " +
    (code || "")
  ).toUpperCase();
  return (
    str.includes("APPLICANTPHOTO") ||
    str.includes("PHOTO") ||
    str.includes("SIGNATURE") ||
    str.includes("SIGN")
  );
};

const isInvalidDocNum = (val, doc) => {
  if (!val || typeof val !== "string") return true;
  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed.toUpperCase() === "NA" ||
    trimmed.toUpperCase() === "NULL" ||
    trimmed.toUpperCase() === "UNDEFINED" ||
    trimmed.toUpperCase() === "NONE" ||
    trimmed === "-"
  ) {
    return true;
  }
  // Standard UUID format: 8-4-4-4-12 hex chars
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(trimmed)) return true;
  if (/^[0-9a-fA-F]{32}$/.test(trimmed)) return true;
  if (doc?.fileStoreId && trimmed === String(doc.fileStoreId).trim()) return true;
  if (doc?.id && trimmed === String(doc.id).trim()) return true;
  if (doc?.documentId && trimmed === String(doc.documentId).trim()) return true;
  return false;
};

const getDocNumber = (document, isPhotoOrSig, t) => {
  if (isPhotoOrSig) return "";
  const candidates = [document?.documentNumber, document?.documentUid];
  for (const c of candidates) {
    if (c && !isInvalidDocNum(c, document)) {
      return String(c).trim();
    }
  }
  return t ? t("NA") : "NA";
};

function WSDocument({ value = {}, Code, index, showFileName = false, appStatus }) {
  const { t } = useTranslation();
  const [localUrls, setLocalUrls] = useState({});

  const { isLoading, isError, error, data } = Digit.Hooks.ws.useWSDocumentSearch(
    {
      value,
    },
    { value },
    Code,
    index
  );

  const rawDocs = Array.isArray(value)
    ? value
    : Array.isArray(value?.documents?.documents)
    ? value.documents.documents
    : Array.isArray(value?.documents)
    ? value.documents
    : [];

  const documents = rawDocs.filter((doc) => {
    if (!Code) return true;
    return (
      doc?.documentType === Code ||
      doc?.documentType?.startsWith(Code + ".") ||
      Code.startsWith(doc?.documentType + ".")
    );
  });

  useEffect(() => {
    const missingIds = documents
      ?.map((d) => d?.fileStoreId)
      ?.filter((id) => id && !pdfDownloadLink(data?.pdfFiles, id) && !localUrls[id]);
    if (missingIds && missingIds.length > 0) {
      Digit.UploadServices.Filefetch(missingIds, Digit.ULBService.getStateId())
        .then((res) => {
          if (res?.data) {
            setLocalUrls((prev) => ({ ...prev, ...res.data }));
          }
        })
        .catch((err) => console.error("Error fetching doc urls in WSDocument", err));
    }
  }, [documents, data?.pdfFiles]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div style={{ marginTop: "19px" }}>
      <React.Fragment>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {documents?.map((document, idx) => {
            const fileId = document?.fileStoreId;
            const linkFromData = pdfDownloadLink(data?.pdfFiles, fileId);
            const localLink = localUrls[fileId] ? pdfDownloadLink(localUrls, fileId) : "";
            const finalUrl = linkFromData || localLink || (typeof fileId === "string" && fileId.startsWith("http") ? fileId : "");

            const displayName = getDocumentDisplayName(document, Code, t);
            const isPhoto = isPhotoDoc(document, Code);
            const isPhotoOrSig = isPhotoOrSignatureDoc(document, Code);
            const docNum = getDocNumber(document, isPhotoOrSig, t);

            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "160px",
                  marginRight: "24px",
                  marginBottom: "16px",
                }}
                key={idx}
              >
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={finalUrl || "#"}
                  onClick={(e) => {
                    if (!finalUrl) e.preventDefault();
                  }}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {isPhoto ? (
                    <div
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #d6d5d4",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        backgroundColor: "#f4f5f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: finalUrl ? "pointer" : "default",
                      }}
                    >
                      {finalUrl ? (
                        <img
                          src={finalUrl}
                          alt={displayName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "13px", color: "#666" }}>{t("WS_PHOTO_PREVIEW") || "Photo"}</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ cursor: finalUrl ? "pointer" : "default" }}>
                      <PDFSvg />
                    </div>
                  )}
                  <p
                    style={{
                      marginTop: "8px",
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#0B0C0C",
                      wordBreak: "break-word",
                      maxWidth: "200px",
                      lineHeight: "1.3",
                    }}
                  >
                    {displayName}
                  </p>
                  {!isPhotoOrSig && (
                    <p
                      style={{
                        marginTop: "4px",
                        fontSize: "13px",
                        color: "#505A5F",
                        wordBreak: "break-all",
                        maxWidth: "200px",
                      }}
                    >
                      {docNum || t("NA")}
                    </p>
                  )}
                </a>
                {appStatus === "PENDING_FOR_CONNECTION_ACTIVATION" && (
                  <div style={{ marginTop: "10px" }}>
                    <CheckBox
                      checked={true}
                      disabled={true}
                      style={{ cursor: "not-allowed" }}
                      label={t("WS_VERIFIED")}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </React.Fragment>
    </div>
  );
}

export default WSDocument;
