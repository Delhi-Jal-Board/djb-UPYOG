import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CardSubHeader, PDFSvg, StatusTable, Row, ViewsIcon, Modal } from "@djb25/digit-ui-react-components";

function PropertyDocuments({ documents, svgStyles = {}, isSendBackFlow = false }) {
  const { t } = useTranslation();
  const [filesArray, setFilesArray] = useState(() => []);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [pdfFiles, setPdfFiles] = useState({});
  const [modalFile, setModalFile] = useState(null);

  useEffect(() => {
    let acc = [];
    documents?.forEach((element) => {
      acc = [...acc, ...(element.values ? element.values : [])];
    });
    setFilesArray(acc?.map((value) => value?.fileStoreId));
  }, [documents]);

  useEffect(() => {
    if (filesArray?.length && documents?.[0]?.BS === "BillAmend") {
      Digit.UploadServices.Filefetch(filesArray, Digit.ULBService.getCurrentTenantId()).then((res) => {
        setPdfFiles(res?.data);
      });
    } else if (filesArray?.length) {
      Digit.UploadServices.Filefetch(filesArray, Digit.ULBService.getStateId()).then((res) => {
        setPdfFiles(res?.data);
      });
    }
  }, [filesArray]);

  const checkLocation =
    window.location.href.includes("employee/tl") || window.location.href.includes("/obps") || window.location.href.includes("employee/ws");
  const isWSLocation = window.location.href.includes("employee/ws");
  const isStakeholderApplication = window.location.href.includes("stakeholder");

  const getDocSubType = (documentType) => {
    if (!documentType) return "";
    const parts = documentType.split(".");
    const last = parts[parts.length - 1] || "";
    return last.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  /** Render the image/document preview modal */
  const renderModal = () => {
    if (!modalFile) return null;
    const isPdf = modalFile.toLowerCase().includes(".pdf") || modalFile.toLowerCase().includes("pdf");
    return (
      <Modal
        headerBarMain={<h1 className="heading-m">Document Preview</h1>}
        headerBarEnd={
          <div onClick={() => setModalFile(null)} style={{ cursor: "pointer", padding: "5px", marginTop: "-5px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000" width="24px" height="24px">
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </div>
        }
        hideSubmit={true}
        popupStyles={{ maxWidth: "80vw", width: "100%" }}
        popupModuleMianStyles={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "0", overflowY: "hidden" }}
      >
        {isPdf ? (
          <iframe src={modalFile} title="Document Preview" style={{ width: "100%", height: "80vh", border: "none", display: "block" }} />
        ) : (
          <img src={modalFile} alt="Document Preview" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
        )}
      </Modal>
    );
  };

  /** Render a single document row in the structured format */
  const renderDocumentRow = (value, index) => {
    const fileUrl = pdfFiles[value.fileStoreId]?.split(",")[0];
    const docSubType = getDocSubType(value?.documentType);
    const docUid = value?.documentUid || "";
    const isPhoto = value?.isPhoto;

    let typeLabel = "";
    let numLabel = "";
    let uploadLabel = "";

    if (value.title === "WS_IDENTITY_PROOF") {
      typeLabel = "Identity Proof*";
      numLabel = "Identity Proof Document Number";
      uploadLabel = "Upload Identity Proof Document*";
    } else if (value.title === "WS_OWNERSHIP_PROOF") {
      typeLabel = "Ownership Proof*";
      numLabel = "Ownership Proof Document Number";
      uploadLabel = "Upload Ownership Proof*";
    } else if (value.title === "WS_OTHER_DOCUMENTS") {
      typeLabel = "Other Documents*";
      numLabel = "Other Document Number";
      uploadLabel = "Upload Other Documents*";
    } else if (value.title === "WS_APPLICANT_PHOTO") {
      uploadLabel = "Upload Applicant Photo*";
    } else {
      typeLabel = (value?.categoryLabel || "Document") + "*";
      numLabel = "Document Number";
      uploadLabel = "Upload Document*";
    }

    return (
      <div key={index} style={{ marginBottom: "24px" }}>
        <StatusTable>
          {!isPhoto && (
            <React.Fragment>
              <Row label={typeLabel} text={docSubType || t("NA")} />
              <Row label={numLabel} text={docUid || t("NA")} />
            </React.Fragment>
          )}
          <Row
            label={uploadLabel}
            text={
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {isPhoto ? (
                  fileUrl ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={fileUrl}
                        alt="Applicant Photo"
                        style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ccc" }}
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize: "14px", color: "#505A5F" }}>{t("NA")}</div>
                  )
                ) : (
                  <div
                    onClick={() => {
                      if (fileUrl) setModalFile(fileUrl);
                    }}
                    disabled={!fileUrl}
                    style={{ cursor: "pointer" }}
                  >
                    <ViewsIcon />
                  </div>
                )}
                {!isPhoto && (
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#0B0C0C", margin: 0 }}>
                    <input 
                      key={`chk-${value?.originalDoc?.id}-${value?.originalDoc?.isVerified}`}
                      type="checkbox" 
                      style={{ width: "18px", height: "18px", accentColor: "#F47738" }} 
                      defaultChecked={value?.originalDoc?.isVerified}
                      onChange={(e) => {
                        if (value?.originalDoc) {
                          value.originalDoc.isVerified = e.target.checked;
                        }
                      }}
                    />
                    Check Verified
                  </label>
                )}
              </div>
            }
          />
        </StatusTable>
      </div>
    );
  };

  return (
    <div style={{ marginTop: "19px" }}>
      {renderModal()}
      {!isStakeholderApplication &&
        documents?.map((document, index) => (
          <React.Fragment key={index}>
            {document?.title ? (
              <CardSubHeader
                style={
                  checkLocation
                    ? { marginTop: "32px", marginBottom: "18px", color: "#0B0C0C", fontSize: "24px", lineHeight: "30px" }
                    : { marginTop: "32px", marginBottom: "8px", color: "#505A5F", fontSize: "24px" }
                }
              >
                {t(document?.title)}
              </CardSubHeader>
            ) : null}

            {isWSLocation ? (
              <div style={{ marginTop: "8px" }}>
                {document?.values && document?.values.length > 0
                  ? document.values.map((value, idx) => renderDocumentRow(value, idx))
                  : !window.location.href.includes("citizen") && (
                      <div>
                        <p>{t("BPA_NO_DOCUMENTS_UPLOADED_LABEL")}</p>
                      </div>
                    )}
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start" }}>
                {document?.values && document?.values.length > 0
                  ? document?.values?.map((value, index) => (
                      <a
                        target="_"
                        href={pdfFiles[value.fileStoreId]?.split(",")[0]}
                        style={{ minWidth: "80px", marginRight: "10px", maxWidth: "100px", height: "auto" }}
                        key={index}
                      >
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <PDFSvg />
                        </div>
                        <p
                          style={
                            checkLocation
                              ? { marginTop: "8px", fontWeight: "bold", fontSize: "16px", lineHeight: "19px", color: "#505A5F", textAlign: "center" }
                              : { marginTop: "8px", fontWeight: "bold" }
                          }
                        >
                          {t(value?.title)}
                        </p>
                        {isSendBackFlow ? (
                          value?.documentType?.includes("NOC") ? (
                            <p style={{ textAlign: "center" }}>{t(value?.documentType.split(".")[1])}</p>
                          ) : (
                            <p style={{ textAlign: "center" }}>{t(value?.documentType)}</p>
                          )
                        ) : (
                          ""
                        )}
                      </a>
                    ))
                  : !window.location.href.includes("citizen") && (
                      <div>
                        <p>{t("BPA_NO_DOCUMENTS_UPLOADED_LABEL")}</p>
                      </div>
                    )}
              </div>
            )}
          </React.Fragment>
        ))}
      {isStakeholderApplication &&
        documents?.map((document, index) => (
          <React.Fragment key={index}>
            {document?.title ? (
              <CardSubHeader style={{ marginTop: "32px", marginBottom: "8px", color: "#505A5F", fontSize: "24px" }}>
                {t(document?.title)}
              </CardSubHeader>
            ) : null}
            <div>
              {document?.values && document?.values.length > 0
                ? document?.values?.map((value, index) => (
                    <a
                      target="_"
                      href={pdfFiles[value.fileStoreId]?.split(",")[0]}
                      style={{ minWidth: svgStyles?.minWidth ? svgStyles?.minWidth : "160px", marginRight: "20px" }}
                      key={index}
                    >
                      <div style={{ maxWidth: "940px", padding: "8px", borderRadius: "4px", border: "1px solid #D6D5D4", background: "#FAFAFA" }}>
                        <p style={{ marginTop: "8px", fontWeight: "bold", marginBottom: "10px" }}>{t(value?.title)}</p>
                        {value?.docInfo ? (
                          <div style={{ fontSize: "12px", color: "#505A5F", fontWeight: 400, lineHeight: "15px", marginBottom: "10px" }}>{`${t(
                            value?.docInfo
                          )}`}</div>
                        ) : null}
                        <PDFSvg />
                        <p style={{ marginTop: "8px", fontSize: "16px", lineHeight: "19px", color: "#505A5F", fontWeight: "400" }}>{`${t(
                          value?.title
                        )}`}</p>
                      </div>
                    </a>
                  ))
                : !window.location.href.includes("citizen") && (
                    <div>
                      <p>{t("BPA_NO_DOCUMENTS_UPLOADED_LABEL")}</p>
                    </div>
                  )}
            </div>
          </React.Fragment>
        ))}
    </div>
  );
}

export default PropertyDocuments;
