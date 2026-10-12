import React, { useEffect, useState } from "react";
import { CardLabel, CardLabelError, LabelFieldPair, UploadFile } from "@djb25/digit-ui-react-components";

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
  const initialDoc =
    formData?.supportingDocuments?.[0] ||
    formData?.supportingDocuments?.documents?.[0] ||
    (formData?.supportingDocuments?.fileStoreId ? formData?.supportingDocuments : null);
  const [documents, setDocuments] = useState(initialDoc?.fileStoreId ? [initialDoc] : []);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(initialDoc?.fileStoreId || null);
  const [file, setFile] = useState(null);

  function selectfile(e) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }

  useEffect(() => {
    const doc =
      formData?.supportingDocuments?.[0] ||
      formData?.supportingDocuments?.documents?.[0] ||
      (formData?.supportingDocuments?.fileStoreId ? formData?.supportingDocuments : null);
    if (doc?.fileStoreId && !uploadedFile) {
      setUploadedFile(doc.fileStoreId);
      setDocuments([doc]);
    }
  }, [formData?.supportingDocuments]);

  useEffect(() => {
    if (uploadedFile) {
      if (clearFormErrors && config?.key) {
        clearFormErrors(config.key);
      }
    } else {
      if (setFormError && config?.key) {
        setFormError(config.key, { type: "required", message: t("CORE_COMMON_REQUIRED_ERRMSG") || t("REQUIRED_FIELD") || "Required" });
      }
    }
  }, [uploadedFile, setFormError, clearFormErrors, config?.key]);

  useEffect(() => {
    (async () => {
      setError(null);
      if (file) {
        const allowedFileTypesRegex = /(.*?)(jpg|jpeg|png|image|pdf)$/i;
        if (file.size >= 5242880) {
          setError(t("CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED"));
        } else if (file?.type && !allowedFileTypesRegex.test(file?.type)) {
          setError(t(`NOT_SUPPORTED_FILE_TYPE`));
        } else {
          try {
            const response = await Digit.UploadServices.Filestorage("WS", file, tenantIdCode);
            if (response?.data?.files?.length > 0) {
              const fsId = response?.data?.files[0]?.fileStoreId;
              setUploadedFile(fsId);
              setDocuments([{ fileStoreId: fsId, documentUid: fsId }]);
              if (onSelect && config?.key) {
                onSelect(config.key, [{ fileStoreId: fsId, documentUid: fsId }]);
              }
              if (clearFormErrors && config?.key) {
                clearFormErrors(config.key);
              }
            } else {
              setError(t("CS_FILE_UPLOAD_ERROR"));
            }
          } catch (err) {
            setError(t("CS_FILE_UPLOAD_ERROR"));
          }
        }
      }
    })();
  }, [file]);

  const handleDelete = () => {
    setUploadedFile(null);
    setDocuments([]);
    setFile(null);
    setError(null);
    if (onSelect && config?.key) {
      onSelect(config.key, null);
    }
    if (setFormError && config?.key) {
      setFormError(config.key, { type: "required", message: t("CORE_COMMON_REQUIRED_ERRMSG") || t("REQUIRED_FIELD") || "Required" });
    }
  };

  const hasValidationError = !uploadedFile && (formState?.errors?.[config?.key] || formErrors?.[config?.key]);
  const errorStyle = { width: "100%", marginLeft: "0px", fontSize: "12px", marginTop: "4px" };

  return (
    <div>
      <LabelFieldPair>
        <CardLabel>
          {t(`WF_APPROVAL_UPLOAD_HEAD`)}
          <span className="check-page-link-button"> *</span>:
        </CardLabel>
        <div className="field">
          <UploadFile
            id={"activation-supporting-documents"}
            onUpload={(e) => {
              selectfile(e);
            }}
            onDelete={handleDelete}
            message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)}
            textStyles={{ width: "100%" }}
            inputStyles={{ width: "280px" }}
            buttonType="button"
            accept="image/*, .pdf, .png, .jpeg, .jpg"
            iserror={error || (hasValidationError && (formState?.isSubmitted || formState?.submitCount > 0) ? (formState?.errors?.[config?.key]?.message || formErrors?.[config?.key]?.message || t("CORE_COMMON_REQUIRED_ERRMSG")) : null)}
            isMandatory={true}
          />
          {error ? <CardLabelError style={errorStyle}>{error}</CardLabelError> : null}
          {!error && hasValidationError && (formState?.isSubmitted || formState?.submitCount > 0) ? (
            <CardLabelError style={errorStyle}>
              {formState?.errors?.[config?.key]?.message || formErrors?.[config?.key]?.message || t("CORE_COMMON_REQUIRED_ERRMSG")}
            </CardLabelError>
          ) : null}
        </div>
      </LabelFieldPair>
    </div>
  );
};

export default WSActivationSupportingDocuments;
