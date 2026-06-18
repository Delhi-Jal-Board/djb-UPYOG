import {
  CardLabel,
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
  const [signatureFileStoreId, setSignatureFileStoreId] = useState(formData?.declarationData?.signatureFileStoreId || null);
  const [signatureFile, setSignatureFile] = useState(formData?.declarationData?.signatureFile || null);

  const { control, formState: localFormState, watch, trigger, getValues, setValue } = useForm({
    defaultValues: {
      agree: formData?.declarationData?.agree || false,
      submittedBy: formData?.declarationData?.submittedBy || { code: "SELF", i18nKey: "WS_SUBMITTED_BY_SELF" },
      signatureFile: formData?.declarationData?.signatureFile || null,
      signatureFileStoreId: formData?.declarationData?.signatureFileStoreId || null,
      signatureFileName: formData?.declarationData?.signatureFileName || "",
      declarations: formData?.declarationData?.declarations || Array(9).fill(formData?.declarationData?.agree || false),
    },
  });
  const formValue = watch();
  const { errors } = localFormState;

  const { isWSServicesMastersLoading, data: wsServicesMastersData } = Digit.Hooks.ws.useMDMS("dl.djb", "ws-services-masters", ["Declaration"]);

  const [declarationPoints, setDeclarationPoints] = useState([]);

  useEffect(() => {
    if (wsServicesMastersData?.["ws-services-masters"]?.Declaration) {
      setDeclarationPoints(wsServicesMastersData["ws-services-masters"].Declaration);
    }
  }, [wsServicesMastersData]);

  const submittedByOptions = [{ code: "SELF", i18nKey: "WS_SUBMITTED_BY_SELF" }];

  useEffect(() => {
    const fsId = formData?.declarationData?.signatureFileStoreId || null;
    const currentFsId = signatureFileStoreId || null;
    if (fsId !== currentFsId) {
      setSignatureFileStoreId(fsId);
      setValue("signatureFileStoreId", fsId);
    }
  }, [formData?.declarationData?.signatureFileStoreId]);

  const lastSentValue = React.useRef(formData?.declarationData || null);
  useEffect(() => {
    const currentValues = {
      ...formValue,
      signatureFileStoreId,
      signatureFile,
    };
    if (!_.isEqual(lastSentValue.current, currentValues)) {
      const timer = setTimeout(() => {
        lastSentValue.current = currentValues;
        onSelect(config?.key, currentValues);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [formValue, signatureFileStoreId, signatureFile, config?.key, onSelect]);

  const onUploadSignature = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size >= 5242880) {
        // Handle error if needed
      } else {
        try {
          const response = await Digit.UploadServices.Filestorage("WS", file, Digit.ULBService.getStateId());
          if (response?.data?.files?.length > 0) {
            const fsId = response?.data?.files[0]?.fileStoreId;
            setSignatureFileStoreId(fsId);
            setSignatureFile(file);
            setValue("signatureFileStoreId", fsId);
            setValue("signatureFile", file);
            setValue("signatureFileName", file.name);
          }
        } catch (err) {
          console.error("Signature upload failed", err);
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
                  setValue("declarations", Array(9).fill(val));
                  props.onChange(val);
                }}
              />
            )}
          />
        </div>

        <div className="formcomposer-section-grid">
          <div>
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
          </div>

          <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_UPLOAD_SIGNATURE_FILE")}</CardLabel>
              <div className="field" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <UploadFile
                    onUpload={onUploadSignature}
                    onDelete={() => {
                      setSignatureFile(null);
                      setSignatureFileStoreId(null);
                      setValue("signatureFile", null);
                      setValue("signatureFileStoreId", null);
                    }}
                    id={"ws-declaration-signature"}
                    message={signatureFileStoreId ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)}
                    textStyles={{ width: "100%" }}
                    buttonType="button"
                    accept="image/*, .pdf, .png, .jpeg, .jpg"
                    uploadedFiles={
                      signatureFileStoreId && !signatureFile ? [[formValue?.signatureFileName || "Document", { fileStoreId: signatureFileStoreId }]] : undefined
                    }
                    removeTargetedFile={() => {
                      setSignatureFile(null);
                      setSignatureFileStoreId(null);
                      setValue("signatureFile", null);
                      setValue("signatureFileStoreId", null);
                      setValue("signatureFileName", "");
                    }}
                  />
                </div>
                {signatureFileStoreId && (
                  <div onClick={viewDocument} style={{ cursor: "pointer" }}>
                    <ViewsIcon />
                  </div>
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
