import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CardSubHeader, PDFSvg, StatusTable, Row, ViewsIcon, Modal } from "@djb25/digit-ui-react-components";

function PropertyDocuments({ documents, svgStyles = {}, isSendBackFlow = false, applicationStatus }) {
  const { t } = useTranslation();
  const [filesArray, setFilesArray] = useState(() => []);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [pdfFiles, setPdfFiles] = useState({});
  const [modalFile, setModalFile] = useState(null);
  const [checkedMap, setCheckedMap] = useState({});

  useEffect(() => {
    let requiredDocsCount = 0;
    let checkedCount = 0;

    documents?.forEach(document => {
      document?.values?.forEach(value => {
        if (!value.isPhoto) {
          requiredDocsCount++;
          const isChecked = checkedMap[value?.fileStoreId] ?? value?.originalDoc?.isVerified ?? false;
          if (isChecked) {
             checkedCount++;
          }
        }
      });
    });

    const allChecked = requiredDocsCount === 0 || checkedCount === requiredDocsCount;
    const isDocVerifState = !applicationStatus || applicationStatus === "PENDING_FOR_DOCUMENT_VERIFICATION";
    const finalVerified = isDocVerifState ? allChecked : true;
    
    window.isDocumentsVerified = finalVerified;
    window.dispatchEvent(new CustomEvent("DOCUMENTS_VERIFIED", { detail: finalVerified }));
  }, [checkedMap, documents, applicationStatus]);

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

  const forceDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || blob.type;
      
      const blobUrl = window.URL.createObjectURL(blob);
      const baseFileName = fileName.replace(/\.[^/.]+$/, "");

      let extension = "pdf";
      if (contentType) {
        if (contentType.includes("image/jpeg")) extension = "jpg";
        else if (contentType.includes("image/png")) extension = "png";
        else if (contentType.includes("image/webp")) extension = "webp";
        else if (contentType.includes("application/pdf")) extension = "pdf";
        else if (contentType.includes("text/plain")) extension = "txt";
      }

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `${baseFileName}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error("Error downloading file", err);
      window.open(url, "_blank"); // Fallback
    }
  };

  /** Render the image/document preview modal */
  const renderModal = () => {
    if (!modalFile) return null;
    const isPdf = modalFile.toLowerCase().includes(".pdf") || modalFile.toLowerCase().includes("pdf");
    return (
      <Modal
        headerBarMain={<h1 className="heading-m">Document Preview</h1>}
        headerBarEnd={
          <div style={{ display: "flex", gap: "15px", alignItems: "center", paddingRight: "10px" }}>
            <div 
              onClick={() => {
                forceDownload(modalFile, "Document.pdf");
              }} 
              style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
              title="Download Document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
            <div onClick={() => setModalFile(null)} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000" width="24px" height="24px">
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </div>
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
                {!isPhoto && (() => {
                  const isChecked = checkedMap[value?.originalDoc?.id] ?? value?.originalDoc?.isVerified ?? false;
                  return (
                    <React.Fragment>
                      <div 
                        onClick={() => {
                          if (fileUrl) {
                            forceDownload(fileUrl, `${docSubType || "Document"}.pdf`);
                          }
                        }}
                        title="Download Document"
                        style={{ 
                          cursor: "pointer", 
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      </div>
                      {applicationStatus !== "PENDING_FOR_PAYMENT" && applicationStatus !== "WF_PENDING_FOR_PAYMENT" && (
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#0B0C0C", margin: 0 }}>
                          <input 
                            key={`chk-${value?.fileStoreId}-${value?.originalDoc?.isVerified}`}
                            type="checkbox" 
                            className="verify-doc-checkbox"
                            style={{ width: "18px", height: "18px", accentColor: "#F47738", cursor: (applicationStatus && applicationStatus !== "PENDING_FOR_DOCUMENT_VERIFICATION") ? "not-allowed" : "pointer" }} 
                            disabled={applicationStatus && applicationStatus !== "PENDING_FOR_DOCUMENT_VERIFICATION"}
                            defaultChecked={value?.originalDoc?.isVerified}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (value?.originalDoc) {
                                value.originalDoc.isVerified = checked;
                              }
                              if (value?.fileStoreId) {
                                setCheckedMap(prev => ({ ...prev, [value.fileStoreId]: checked }));
                              }
                            }}
                          />
                          {t("Check Verified")}
                        </label>
                      )}
                    </React.Fragment>
                  );
                })()}
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
