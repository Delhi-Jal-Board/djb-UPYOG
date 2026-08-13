import React, { useEffect, useRef, useState } from "react";
import { CardLabel, LabelFieldPair, Dropdown, UploadFile, Toast, Loader, TextInput, CollapsibleCardPage, Modal, ViewsIcon, FormStep } from "@djb25/digit-ui-react-components";
import Timeline from "../components/Timeline";
import { useLocation } from "react-router-dom";
import UploadFileDigiLocker from "../../../pt/src/utils/UploadFile";

const DIGILOCKER_SUPPORTED_CODES = ["AADHAAR", "AADHAR", "DRIVING", "DRVLC", "PAN"];

const isDigiLockerEligible = (code = "") => {
  const upper = code.toUpperCase();
  return DIGILOCKER_SUPPORTED_CODES.some((keyword) => upper.includes(keyword));
};

const WSDocumentsEmployee = ({ t, config, onSelect, userType, formData, setError: setFormError, clearErrors: clearFormErrors, formState }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [documents, setDocuments] = useState(userType === "citizen" ? formData?.documents?.documents || formData?.documents || [] : formData?.DocumentsRequired?.documents || []);
  const [enableSubmit, setEnableSubmit] = useState(true);
  const [error, setError] = useState(null);
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

  const goNext = () => {
    if (userType === "citizen") {
      let documentStep = { ...formData?.documents, documents: documents };
      onSelect(config.key, documentStep);
    } else {
      onSelect(config.key, { documents });
    }
  };

  useEffect(() => {
    let count = 0;
    wsDocs?.[wsDocsData]?.map((doc) => {
      let isRequired = false;
      documents.map((data) => {
        if (doc.required && data?.documentType.includes(doc.code)) isRequired = true;
      });
      if (!isRequired && doc.required) count = count + 1;
    });
    if ((count == "0" || count == 0) && documents.length > 0) setEnableSubmit(false);
    else setEnableSubmit(true);

    if (userType !== "citizen") {
      goNext();
    }
  }, [documents, wsDocs]);

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
          docData.fileStoreId = documentData.fileStoreId;
          docData.id = documentData.id;
          docData.status = "ACTIVE";
        }
      });
    });
  }

  const innerContent = (
    <div className="formcomposer-section-grid ws-doc-upload">
      {wsDocs?.[wsDocsData]?.map((document, index) => {
        return (
          <SelectDocument
            key={index}
            document={document}
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
          />
        );
      })}
    </div>
  );

  if (userType === "citizen") {
    return (
      <div>
        <Timeline currentStep={3} />
        <FormStep t={t} config={config} onSelect={goNext} onSkip={() => onSelect()} isDisabled={enableSubmit}>
          {innerContent}
          {error && <Toast label={error} onClose={() => setError(null)} error />}
        </FormStep>
      </div>
    );
  }

  return (
    <CollapsibleCardPage title={t("WS_DOCUMENTS")} defaultOpen={true}>
      {innerContent}
      {error && <Toast label={error} onClose={() => setError(null)} error />}
    </CollapsibleCardPage>
  );
};

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
}) {
  const fileRef = useRef();
  const filteredDocument = documents?.filter((item) => item?.documentType?.includes(doc?.code))[0];
  const [selectedDocument, setSelectedDocument] = useState(() => {
    if (filteredDocument && doc?.dropdownData) {
      const match = doc?.dropdownData?.find((d) => d.code === filteredDocument.documentType);
      if (match) return { ...filteredDocument, ...match };
    }
    return filteredDocument
      ? { ...filteredDocument, code: filteredDocument?.documentType, i18nKey: filteredDocument?.documentType?.replaceAll(".", "_") }
      : doc?.hasDropdown
        ? doc?.dropdownData?.length === 1
          ? doc?.dropdownData[0]
          : {}
        : doc;
  });
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(() => filteredDocument?.fileStoreId || null);
  const [documentUid, setDocumentUid] = useState(() => filteredDocument?.documentUid || filteredDocument?.documentNumber || "");
  const [isDocumentUidLocked, setIsDocumentUidLocked] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraFile, setIsCameraFile] = useState(false);

  const [showDocModal, setShowDocModal] = useState(false);
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileType, setDocFileType] = useState("");

  const [digiLockerUpload, setDigilockerUpload] = useState(false);

  useEffect(() => {
    const eligible = isDigiLockerEligible(selectedDocument?.code || "");
    setDigilockerUpload(eligible);
  }, [selectedDocument]);

  const handleCapture = (capturedFile) => {
    setFile(capturedFile);
    setIsCameraFile(true);
    setShowCamera(false);
  };

  const handleSelectDocument = (value) => setSelectedDocument(value);

  const viewDocument = async () => {
    if (uploadedFile) {
      try {
        const res = await Digit.UploadServices.FileFetchbyid(uploadedFile, Digit.ULBService.getStateId());
        if (res?.data) {
          const contentType = res.headers?.["content-type"] || res.headers?.["Content-Type"] || "";
          // Determine type by content-type or fall back to checking blob type
          const isPdf =
            contentType.toLowerCase().includes("pdf") ||
            (res.data instanceof Blob && res.data.type && res.data.type.toLowerCase().includes("pdf"));
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
        match ? { ...filteredDocument, ...match } :
          filteredDocument
            ? { ...filteredDocument, code: filteredDocument?.documentType, i18nKey: filteredDocument?.documentType?.replaceAll(".", "_") }
            : doc?.hasDropdown
              ? doc?.dropdownData?.length === 1
                ? doc?.dropdownData[0]
                : {}
              : doc
      );
    }
  }, []);

  function selectfile(e, newFile) {
    if (newFile) {
      setFile(newFile);
    } else {
      setFile(e.target.files[0]);
    }
    setIsCameraFile(false);
  }
  const { dropdownData } = doc;
  const { dropdownFilter, enabledActions, filterCondition } = doc?.additionalDetails || {};
  var dropDownData = dropdownData;
  const [isHidden, setHidden] = useState(false);

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

  useEffect(() => {
    if (selectedDocument?.code) {
      setDocuments((prev) => {
        const filteredDocumentsByDocumentType = prev?.filter((item) => item?.documentType !== selectedDocument?.code);

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
            documentUid: documentUid,
            i18nKey: selectedDocument?.code,
            id: selectedDocument?.id,
            status: "ACTIVE",
          },
        ];
        sessionStorage.setItem("DISCONNECTION_EDIT_DOCS", JSON.stringify(data));
        return data;
      });
    }
    if (!isHidden) {
      if ((!uploadedFile || !selectedDocument?.code) && doc?.required) {
        addError();
      } else if (uploadedFile && selectedDocument?.code) {
        removeError();
      }
    } else if (isHidden) {
      removeError();
    }
  }, [uploadedFile, selectedDocument, documentUid, isHidden, formData?.ConnectionDetails?.[0]]);

  useEffect(() => {
    (async () => {
      setError(null);
      if (file) {
        if (file.size >= 5242880) {
          setError(t("CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED"));
        } else if (doc?.code === "OWNER.APPLICANTPHOTO" && !file.type.match(/image\/(jpeg|png)/i) && !file.name.match(/\.(jpg|jpeg|png)$/i)) {
          setError(t("WS_ONLY_JPG_PNG_ALLOWED") || "Only JPG and PNG files are allowed for Applicant Photo");
          setFile(null);
        } else {
          try {
            setUploadedFile(null);
            setIsUploading(true);
            const response = await Digit.UploadServices.Filestorage("WS", file, Digit.ULBService.getStateId());
            if (response?.data?.files?.length > 0) {
              setUploadedFile(response?.data?.files[0]?.fileStoreId);
            } else {
              setError(t("CS_FILE_UPLOAD_ERROR"));
            }
          } catch (err) {
            setError(t("CS_FILE_UPLOAD_ERROR"));
          } finally {
            setIsUploading(false);
          }
        }
      }
    })();
  }, [file]);

  useEffect(() => {
    if (isHidden) setUploadedFile(null);
  }, [isHidden]);

  return (
    <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "20px", width: "100%", marginBottom: "20px" }}>
      {doc?.hasDropdown ? (
        <LabelFieldPair>
          <CardLabel>{doc?.required ? `${t(doc?.i18nKey)}*` : `${t(doc?.i18nKey)}`}</CardLabel>
          <Dropdown
            id={`doc-${doc?.code}`}
            key={`doc-${doc?.code}`}
            className="form-field"
            selected={selectedDocument ? selectedDocument : filteredDocument ? filteredDocument : selectedDocument}
            option={dropDownData.map((e) => ({ ...e, i18nKey: e.code?.replaceAll(".", "_") }))}
            select={handleSelectDocument}
            optionKey="i18nKey"
            t={t}
          />
        </LabelFieldPair>
      ) : null}

      {doc?.code !== "OWNER.APPLICANTPHOTO" && (
        <LabelFieldPair>
          <CardLabel>{t(`${doc?.i18nKey?.replaceAll(".", "_")}_DOCUMENT_NO`)}</CardLabel>
          <div className="field">
            <TextInput
              type="text"
              value={documentUid}
              onChange={(e) => {
                if (!isDocumentUidLocked) setDocumentUid(e.target.value);
              }}
              placeholder={t("WS_IDENTITY_NO_PLACEHOLDER")}
              disabled={isDocumentUidLocked}
              style={isDocumentUidLocked ? { backgroundColor: "#f0f0f0", cursor: "not-allowed", color: "#555" } : {}}
            />
          </div>
        </LabelFieldPair>
      )}

      <LabelFieldPair>
        <CardLabel>
          {doc?.required
            ? `${t(`${doc?.i18nKey?.replaceAll(".", "_")}_UPLOAD_DOCUMENT`)}*`
            : `${t(`${doc?.i18nKey?.replaceAll(".", "_")}_UPLOAD_DOCUMENT`)}`}
        </CardLabel>
        <div className="field" style={{ display: "flex", gap: "20px", alignItems: "center", width: "100%" }}>
          <div style={{ flex: 1 }}>
            {digiLockerUpload ? (
              <UploadFileDigiLocker
                onUpload={selectfile}
                onDelete={() => {
                  setUploadedFile(null);
                  setFile(null);
                  setIsCameraFile(false);
                  setIsDocumentUidLocked(false);
                }}
                id={id}
                message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)}
                textStyles={{ width: "100%" }}
                buttonType="button"
                error={!uploadedFile}
                accept={doc?.code === "OWNER.APPLICANTPHOTO" ? "image/jpeg, image/png, .jpg, .jpeg, .png" : "image/*, .pdf, .png, .jpeg, .jpg"}
                uploadedFiles={
                  uploadedFile && !file ? [[filteredDocument?.fileName || file?.name || t("CS_COMMON_DOCUMENT"), { fileStoreId: uploadedFile }]] : undefined
                }
                removeTargetedFile={() => {
                  setUploadedFile(null);
                  setFile(null);
                  setIsCameraFile(false);
                  setIsDocumentUidLocked(false);
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
                  setIsCameraFile(false);
                }}
                id={id}
                message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)}
                textStyles={{ width: "100%" }}
                buttonType="button"
                error={!uploadedFile}
                accept={doc?.code === "OWNER.APPLICANTPHOTO" ? "image/jpeg, image/png, .jpg, .jpeg, .png" : "image/*, .pdf, .png, .jpeg, .jpg"}
                uploadedFiles={
                  uploadedFile && !file ? [[filteredDocument?.fileName || file?.name || t("CS_COMMON_DOCUMENT"), { fileStoreId: uploadedFile }]] : undefined
                }
                removeTargetedFile={() => {
                  setUploadedFile(null);
                  setFile(null);
                  setIsCameraFile(false);
                }}
              />
            )}
          </div>
          {uploadedFile && (
            <div onClick={viewDocument} style={{ cursor: "pointer" }}>
              <ViewsIcon />
            </div>
          )}
          {doc?.code === "OWNER.APPLICANTPHOTO" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: "-20px" }}>
              <CardLabel>{t("WS_CLICK_APPLICANT_PHOTO") || "Click Applicant Photo"}</CardLabel>
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
          )}
        </div>
      </LabelFieldPair>
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
          popupStyles={{ width: "80%", maxWidth: "800px" }}
        >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", minHeight: "300px" }}>
            {docFileType === "pdf" ? (
              <iframe src={docFileUrl} title="Document Preview" width="100%" height="500px" style={{ border: "none" }} />
            ) : (
              <img src={docFileUrl} alt="Document Preview" style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "4px" }} />
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
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], "applicant_photo.jpg", { type: "image/jpeg" });
        onCapture(file);
      }, "image/jpeg");
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
