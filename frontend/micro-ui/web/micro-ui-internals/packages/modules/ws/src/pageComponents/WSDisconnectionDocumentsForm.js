import React, { useEffect, useState } from "react";
// import { pdfDocumentName, pdfDownloadLink, getDocumentsName,stringReplaceAll } from "../utils";
import DisconnectTimeline from "../components/DisconnectTimeline";
import {
  CardLabel,
  Dropdown,
  UploadFile,
  Toast,
  Loader,
  FormStep,
  CardHeader,
  SubmitBar,
  LabelFieldPair,
  TextInput
} from "@djb25/digit-ui-react-components";
import { useHistory, useRouteMatch } from "react-router-dom";

function WSDisconnectionDocumentsForm({ t, config, onSelect, userType, formData }) {
  const tenantId = Digit.ULBService.getStateId();
  const storedData = Digit.SessionStorage.get("WS_DISCONNECTION");

  const [documents, setDocuments] = useState(storedData.WSDisconnectionForm.documents ? storedData.WSDisconnectionForm.documents : []);
  const [error, setError] = useState(null);
  const [checkRequiredFields, setCheckRequiredFields] = useState(false);
  const history = useHistory();
  const match = useRouteMatch();

  const handleSubmit = () => {
    onSelect(config.key, { WSDisconnectionDocumentsForm: documents });
  };
  useEffect(() => {
    Digit.SessionStorage.set("WS_DISCONNECTION", { ...storedData, WSDisconnectionForm: { ...storedData.WSDisconnectionForm, documents: documents } });
  }, [documents]);

  const { isLoading: wsDocsLoading, data: wsDocs } = Digit.Hooks.ws.WSSearchMdmsTypes.useWSServicesMasters(tenantId, 'DisconnectionDocuments');

  if (wsDocsLoading) {
    return <Loader />;
  }

  return (
    <div className="employee-form-section-wrapper" style={{ marginTop: "19px" }}>
      {userType === "citizen" && (<DisconnectTimeline currentStep={2} />)}
      <FormStep
        t={t}
        config={config}
        onSelect={handleSubmit}
      // isDisabled={enableSubmit}
      >
        {/* <CardHeader>{t(`WS_DISCONNECTION_UPLOAD_DOCUMENTS`)}</CardHeader> */}
        {wsDocs?.DisconnectionDocuments?.map((document, index) => {
          return (
            <SelectDocument
              key={index}
              document={document}
              t={t}
              error={error}
              setError={setError}
              setDocuments={setDocuments}
              documents={documents}
              setCheckRequiredFields={setCheckRequiredFields}
            />
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", gridColumn: "1 / -1", marginTop: "1rem" }}>
          <SubmitBar
            label={t("CS_COMMON_NEXT")}
            onSubmit={() => {
              history.push(match.path.replace("documents-upload", "check"));
            }}
            disabled={documents.length < 2 ? true : false}
          />
        </div>
        {error && <Toast error={error?.key === "error" ? true : false} label={t(error?.message)} onClose={() => setError(null)} />}
      </FormStep>
    </div>
  );
}

function SelectDocument({
  t,
  key,
  document: doc,
  setDocuments,
  error,
  setError,
  documents,
  setCheckRequiredFields
}) {

  const filteredDocument = documents?.filter((item) => item?.documentType?.includes(doc?.code))[0];
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [selectedDocument, setSelectedDocument] = useState(
    filteredDocument
      ? { ...filteredDocument, active: true, code: filteredDocument?.documentType, i18nKey: filteredDocument?.documentType }
      : doc?.dropdownData?.length === 1
        ? doc?.dropdownData[0]
        : {}
  );
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(() => filteredDocument?.fileStoreId || null);
  const [documentNumber, setDocumentNumber] = useState(() => filteredDocument?.documentUid && filteredDocument?.documentUid !== filteredDocument?.fileStoreId ? filteredDocument?.documentUid : "");
  const [docNumberError, setDocNumberError] = useState(null);

  const validateDocumentNumber = (value, docTypeCode, isReq, hasFile) => {
    if (!isReq && !hasFile && (!value || !value.trim())) return null;
    if (!value || !value.trim()) return t("WS_DOCUMENT_NUMBER_REQUIRED") || "Document number is required";
    const trimmed = value.trim();
    const upperCode = (docTypeCode || "").toUpperCase();

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

  const handleSelectDocument = (value) => setSelectedDocument(value);

  function selectfile(e) {
    setFile(e.target.files[0]);
  }

  useEffect(() => {
    if (selectedDocument?.code) {
      setDocuments((prev) => {
        const filteredDocumentsByDocumentType = prev?.filter((item) => item?.documentType !== selectedDocument?.code);
        if (uploadedFile?.length === 0 || uploadedFile === null) return filteredDocumentsByDocumentType;
        const filteredDocumentsByFileStoreId = filteredDocumentsByDocumentType?.filter((item) => item?.fileStoreId !== uploadedFile);

        const err = validateDocumentNumber(documentNumber, selectedDocument?.code, true, !!uploadedFile);
        setDocNumberError(err);

        if (err) {
          return filteredDocumentsByFileStoreId;
        }

        return [
          ...filteredDocumentsByFileStoreId,
          {
            documentType: selectedDocument?.code,
            fileStoreId: uploadedFile,
            id: selectedDocument?.id,
            i18nKey: selectedDocument?.code,
            documentUid: documentNumber ? documentNumber : selectedDocument?.documentUid ? selectedDocument?.documentUid : uploadedFile,
            documentNumber: documentNumber ? documentNumber : selectedDocument?.documentNumber ? selectedDocument?.documentNumber : "",
            fileName: file?.name || "",
            status: "ACTIVE"
          },
        ];
      });
    }
  }, [uploadedFile, selectedDocument, documentNumber]);


  useEffect(() => {
    (async () => {
      setError(null);
      if (file) {
        if (file.size >= 5242880) {
          setError({ key: "error", message: "CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED" });
        } else {
          try {
            setUploadedFile(null);
            const response = await Digit.UploadServices.Filestorage("WS", file, tenantId?.split(".")[0]);
            if (response?.data?.files?.length > 0) {
              setUploadedFile(response?.data?.files[0]?.fileStoreId);
            } else {
              setError({ key: "error", message: "CS_FILE_UPLOAD_ERROR" });
            }
          } catch (err) {
            setError({ key: "error", message: "CS_FILE_UPLOAD_ERROR" });
          }
        }
      }
    })();
  }, [file]);

  return (
    <div style={{
      gridColumn: "span 2",
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "20px",
      width: "100%",
      marginBottom: "20px",
    }}>
      <div>
        <CardLabel className="card-label-smaller" style={{ marginBottom: "8px" }}>{t(doc?.i18nKey) + "*"}</CardLabel>
        <Dropdown
          t={t}
          isMandatory={false}
          option={doc?.dropdownData}
          selected={selectedDocument}
          optionKey="i18nKey"
          select={handleSelectDocument}
        />
      </div>
      <div>
        <CardLabel className="card-label-smaller" style={{ marginBottom: "8px" }}>{t(doc?.i18nKey) + " Document Number"}</CardLabel>
        <TextInput
          type="text"
          value={documentNumber}
          onChange={(e) => {
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
                        : 64;
            if (val.length > maxLen) {
              val = val.substring(0, maxLen);
            }
            setDocumentNumber(val);
            setDocNumberError(null);
          }}
          onBlur={() => {
            setDocNumberError(validateDocumentNumber(documentNumber, selectedDocument?.code, true, !!uploadedFile));
          }}
          placeholder={t("WS_DOCUMENT_NO_PLACEHOLDER") || "Enter Document Number"}
          style={
            docNumberError
              ? { border: "1px solid #d32f2f" }
              : {}
          }
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
                      : 64
          }
        />
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
      <div>
        <CardLabel className="card-label-smaller" style={{ marginBottom: "8px" }}>{`Upload ${t(doc?.i18nKey)} Document*`}</CardLabel>
        <UploadFile
          id={`noc-doc-${key}`}
          extraStyleName={"propertyCreate"}
          accept="image/*, .pdf, .png, .jpeg, .jpg"
          onUpload={selectfile}
          onDelete={() => {
            setUploadedFile(null);
            setFile(null);
            setDocumentNumber("");
            setSelectedDocument(doc?.dropdownData?.length === 1 ? doc?.dropdownData[0] : {});
            setCheckRequiredFields(true);
          }}
          message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`ES_NO_FILE_SELECTED_LABEL`)}
          error={error}
        />
      </div>
    </div>
  );

}

export default WSDisconnectionDocumentsForm;