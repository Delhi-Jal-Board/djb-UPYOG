import {
  CardLabel,
  CardLabelError,
  Dropdown,
  LabelFieldPair,
  CheckBox,
  UploadFile,
  TextInput,
  CollapsibleCardPage,
  Modal,
  ViewsIcon,
} from "@djb25/digit-ui-react-components";
import _ from "lodash";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

const WSDeclaration = ({ config, onSelect, userType, formData, setError, formState, clearErrors, tenantId }) => {
  const { t } = useTranslation();
  const initialFsId =
    formData?.declarationData?.signatureFileStoreId ||
    formData?.declaration?.signatureFileStoreId ||
    formData?.declarationData?.signatureFile?.fileStoreId ||
    formData?.declaration?.signatureFile?.fileStoreId ||
    (typeof formData?.declarationData?.signatureFile === "string" ? formData?.declarationData?.signatureFile : null) ||
    (typeof formData?.declaration?.signatureFile === "string" ? formData?.declaration?.signatureFile : null) ||
    formData?.additionalDetails?.signatureFileStoreId ||
    null;

  const initialFileName =
    formData?.declarationData?.signatureFileName ||
    formData?.declaration?.signatureFileName ||
    formData?.declarationData?.signatureFile?.fileName ||
    formData?.declaration?.signatureFile?.fileName ||
    formData?.declarationData?.signatureFile?.name ||
    formData?.declaration?.signatureFile?.name ||
    formData?.additionalDetails?.signatureFileName ||
    (initialFsId ? "signature.png" : "");

  const [signatureFileStoreId, setSignatureFileStoreId] = useState(initialFsId);
  const [localFile, setLocalFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(
    formData?.declarationData?.signatureFile ||
    formData?.declaration?.signatureFile ||
    (initialFsId ? { fileStoreId: initialFsId, fileName: initialFileName } : null)
  );

  const { control, formState: localFormState, watch, trigger, getValues, setValue } = useForm({
    defaultValues: {
      agree: formData?.declarationData?.agree || formData?.declaration?.agree || false,
      submittedBy: formData?.declarationData?.submittedBy || formData?.declaration?.submittedBy || { code: "SELF", i18nKey: "WS_SUBMITTED_BY_SELF" },
      signatureFile: formData?.declarationData?.signatureFile || formData?.declaration?.signatureFile || (initialFsId ? { fileStoreId: initialFsId, fileName: initialFileName } : null),
      signatureFileStoreId: initialFsId,
      signatureFileName: initialFileName,
      declarations: formData?.declarationData?.declarations || formData?.declaration?.declarations || Array(10).fill(formData?.declarationData?.agree || formData?.declaration?.agree || false),
    },
  });
  const formValue = watch();
  const { errors } = localFormState;

  const { isWSServicesMastersLoading, data: wsServicesMastersData } = Digit.Hooks.ws.useMDMS("dl.djb", "ws-services-masters", ["Declaration"]);

  const [declarationPoints, setDeclarationPoints] = useState([]);

  useEffect(() => {
    if (wsServicesMastersData?.["ws-services-masters"]?.Declaration) {
      const points = [...wsServicesMastersData["ws-services-masters"].Declaration];
      points.push({
        code: "WS_SEWERAGE_DISPOSAL_DECLARATION",
        description: "I declare that sewerage disposal facility is available at the premises and undertake to comply with all applicable DJB rules.",
      });
      setDeclarationPoints(points);
    }
  }, [wsServicesMastersData]);

  const submittedByOptions = [{ code: "SELF", i18nKey: "WS_SUBMITTED_BY_SELF" }];

  useEffect(() => {
    const fsId =
      formData?.declarationData?.signatureFileStoreId ||
      formData?.declaration?.signatureFileStoreId ||
      formData?.declarationData?.signatureFile?.fileStoreId ||
      formData?.declaration?.signatureFile?.fileStoreId ||
      (typeof formData?.declarationData?.signatureFile === "string" ? formData?.declarationData?.signatureFile : null) ||
      (typeof formData?.declaration?.signatureFile === "string" ? formData?.declaration?.signatureFile : null) ||
      formData?.additionalDetails?.signatureFileStoreId ||
      null;
    const currentFsId = signatureFileStoreId || null;
    if (fsId && fsId !== currentFsId) {
      const fileName =
        formData?.declarationData?.signatureFileName ||
        formData?.declaration?.signatureFileName ||
        formData?.declarationData?.signatureFile?.fileName ||
        formData?.declaration?.signatureFile?.name ||
        "signature.png";
      setSignatureFileStoreId(fsId);
      setValue("signatureFileStoreId", fsId);
      setValue("signatureFileName", fileName);
      setValue("signatureFile", { fileStoreId: fsId, fileName: fileName });
    }
  }, [formData?.declarationData?.signatureFileStoreId, formData?.declaration?.signatureFileStoreId]);

  const lastSentValue = React.useRef(formData?.declarationData || formData?.declaration || null);
  useEffect(() => {
    const fileName = formValue?.signatureFileName || (typeof signatureFile === "object" ? (signatureFile?.name || signatureFile?.fileName) : null) || "signature.png";
    const currentValues = {
      ...formValue,
      signatureFileStoreId,
      signatureFileName: signatureFileStoreId ? fileName : "",
      signature: signatureFileStoreId,
      signatureFile: signatureFileStoreId
        ? { fileStoreId: signatureFileStoreId, fileName: fileName }
        : null,
    };
    if (!_.isEqual(lastSentValue.current, currentValues)) {
      lastSentValue.current = currentValues;
      onSelect(config?.key, currentValues);
    }
  }, [formValue, signatureFileStoreId, signatureFile, config?.key, onSelect]);

  const onUploadSignature = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size >= 5242880) {
        // Handle error if needed
      } else {
        setLocalFile(file);
        try {
          const response = await Digit.UploadServices.Filestorage("WS", file, Digit.ULBService.getStateId());
          if (response?.data?.files?.length > 0) {
            const fsId = response?.data?.files[0]?.fileStoreId;
            const sigObj = { fileStoreId: fsId, fileName: file.name };
            setSignatureFileStoreId(fsId);
            setSignatureFile(sigObj);
            setValue("signatureFileStoreId", fsId, { shouldDirty: true, shouldValidate: true });
            setValue("signatureFile", sigObj, { shouldDirty: true, shouldValidate: true });
            setValue("signatureFileName", file.name, { shouldDirty: true, shouldValidate: true });
          }
        } catch (err) {
          console.error("Signature upload failed", err);
          setLocalFile(null);
        }
      }
    }
  };

  const [showDocModal, setShowDocModal] = useState(false);
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docFileType, setDocFileType] = useState("");

  const viewDocument = async () => {
    if (signatureFileStoreId) {
      try {
        const res = await Digit.UploadServices.FileFetchbyid(signatureFileStoreId, Digit.ULBService.getStateId());
        if (res?.data) {
          const blob =
            res.data instanceof Blob
              ? res.data
              : new Blob([res.data], { type: res.headers["content-type"] || res.headers["Content-Type"] || "image/jpeg" });
          const fileURL = URL.createObjectURL(blob);
          setDocFileUrl(fileURL);
          const contentType = res.headers["content-type"] || res.headers["Content-Type"] || "";
          if (contentType.toLowerCase().includes("pdf")) {
            setDocFileType("pdf");
          } else {
            setDocFileType("image");
          }
          setShowDocModal(true);
        }
      } catch (err) {
        console.error("Failed to fetch file URL via FileFetchbyid", err);
      }
    }
  };

  return (
    <React.Fragment>
      <CollapsibleCardPage title={t("WS_DECLARATION")} defaultOpen={true}>
        <div>
          {declarationPoints.map((point, index) => (
            <div key={index} style={{ display: "flex", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ fontSize: "14px", lineHeight: "1.5", marginRight: "8px", fontWeight: "bold" }}>{index + 1}.</span>
              <span style={{ fontSize: "14px", lineHeight: "1.5", flex: 1 }}>{t(point.code) !== point.code ? t(point.code) : point.description}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "10px" }}>
          <Controller
            control={control}
            name="agree"
            render={(props) => (
              <CheckBox
                label={t("WS_I_AGREE_TO_ALL_DECLARATIONS") || "I agree to all the above declarations"}
                checked={props.value}
                onChange={(e) => {
                  const val = e.target.checked;
                  setValue("declarations", Array(10).fill(val));
                  props.onChange(val);
                }}
              />
            )}
          />
        </div>

        <div className="formcomposer-section-grid">
          {/* <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_SUBMITTED_BY")}</CardLabel>
              <div className="field">
                <Controller
                  control={control}
                  name="submittedBy"
                  render={(props) => (
                    <Dropdown option={submittedByOptions} optionKey="i18nKey" selected={props.value} select={props.onChange} t={t} />
                  )}
                />
              </div>
            </LabelFieldPair>
          </div> */}

          <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_UPLOAD_SIGNATURE_FILE")} <span style={{ color: "red" }}>*</span></CardLabel>
              <div className="field" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "100%" }}>
                  <div style={{ flex: 1 }}>
                    <UploadFile
                      onUpload={onUploadSignature}
                      onDelete={() => {
                        setLocalFile(null);
                        setSignatureFile(null);
                        setSignatureFileStoreId(null);
                        setValue("signatureFile", null, { shouldDirty: true, shouldValidate: true });
                        setValue("signatureFileStoreId", null, { shouldDirty: true, shouldValidate: true });
                        setValue("signatureFileName", "", { shouldDirty: true, shouldValidate: true });
                      }}
                      id={"ws-declaration-signature"}
                      message={signatureFileStoreId ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)}
                      textStyles={{ width: "100%" }}
                      buttonType="button"
                      accept="image/*, .pdf, .png, .jpeg, .jpg"
                      uploadedFiles={
                        signatureFileStoreId && !localFile
                          ? [[formValue?.signatureFileName || signatureFile?.fileName || signatureFile?.name || "signature.png", { fileStoreId: signatureFileStoreId }]]
                          : undefined
                      }
                      removeTargetedFile={() => {
                        setLocalFile(null);
                        setSignatureFile(null);
                        setSignatureFileStoreId(null);
                        setValue("signatureFile", null, { shouldDirty: true, shouldValidate: true });
                        setValue("signatureFileStoreId", null, { shouldDirty: true, shouldValidate: true });
                        setValue("signatureFileName", "", { shouldDirty: true, shouldValidate: true });
                      }}
                    />
                  </div>
                  {signatureFileStoreId && (
                    <div onClick={viewDocument} style={{ cursor: "pointer" }}>
                      <ViewsIcon />
                    </div>
                  )}
                </div>
                {!signatureFileStoreId && formValue?.agree && (
                  <CardLabelError style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                    {t("WS_SIGNATURE_MANDATORY_ERROR") || "Signature is mandatory to submit application"}
                  </CardLabelError>
                )}
              </div>
            </LabelFieldPair>
          </div>
        </div>
      </CollapsibleCardPage>
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
              <img
                src={docFileUrl}
                alt="Document Preview"
                style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "4px" }}
              />
            )}
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default WSDeclaration;
