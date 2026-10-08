import {
  CardLabel,
  LabelFieldPair,
  TextInput,
  CheckBox,
  Dropdown,
  DatePicker,
  CollapsibleCardPage,
  FormStep,
  UploadFile,
  ViewsIcon,
  RemoveIcon,
  RadioButtons
} from "@djb25/digit-ui-react-components";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Timeline from "../components/Timeline";

const WSDjbEmployee = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const { control, watch, setValue, formState: localFormState, trigger, clearErrors: localClearErrors } = useForm({
    defaultValues: {
      isDjbEmployee:
        String(formData?.djbEmployee?.isDjbEmployee) === "true" ||
        formData?.djbEmployee?.isDjbEmployee === true ||
        String(formData?.additionalDetails?.isDjbEmployee) === "true" ||
        formData?.additionalDetails?.isDjbEmployee === true ||
        false,
      employeeId: formData?.djbEmployee?.employeeId || formData?.additionalDetails?.employeeId || "",
      dor: formData?.djbEmployee?.dor || formData?.additionalDetails?.dor || "",
      designation: formData?.djbEmployee?.designation || formData?.additionalDetails?.designation || "",
      document: formData?.djbEmployee?.document || formData?.additionalDetails?.document || "",
    },
  });

  const formValue = watch();
  const isDjbEmployee = watch("isDjbEmployee");

  useEffect(() => {
    if (!isDjbEmployee) {
      localClearErrors();
      setValue("employeeId", "");
      setValue("dor", "");
      setValue("designation", "");
      setValue("document", "");
      setUploadedFile(null);
      setFile(null);
      if (clearErrors) clearErrors(config?.key);
    } else {
      trigger(["employeeId", "designation", "document"]);
    }
  }, [isDjbEmployee]);

  useEffect(() => {
    const isEmp =
      String(formData?.djbEmployee?.isDjbEmployee) === "true" ||
      formData?.djbEmployee?.isDjbEmployee === true ||
      String(formData?.additionalDetails?.isDjbEmployee) === "true" ||
      formData?.additionalDetails?.isDjbEmployee === true;
    if (formData?.djbEmployee !== undefined || formData?.additionalDetails?.isDjbEmployee !== undefined) {
      setValue("isDjbEmployee", !!isEmp);
      setValue("employeeId", formData?.djbEmployee?.employeeId || formData?.additionalDetails?.employeeId || "");
      setValue("dor", formData?.djbEmployee?.dor || formData?.additionalDetails?.dor || "");
      setValue("designation", formData?.djbEmployee?.designation || formData?.additionalDetails?.designation || "");
      setValue("document", formData?.djbEmployee?.document || formData?.additionalDetails?.document || "");
    }
  }, [formData?.djbEmployee, formData?.additionalDetails, setValue]);

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(() => formData?.djbEmployee?.document || formData?.additionalDetails?.document || null);
  const [errorUpload, setErrorUpload] = useState(null);

  const handleView = async (fileStoreId, tenantId) => {
    try {
      const response = await Digit.UploadServices.Filefetch([fileStoreId], tenantId);
      const url = response?.data?.fileStoreIds?.[0]?.url;
      if (url) {
        const differentFormats = url?.split(",") || [];
        let fileURL = "";
        differentFormats.map((link) => {
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

  useEffect(() => {
    (async () => {
      setErrorUpload(null);
      if (file) {
        if (file.size >= 5242880) {
          setErrorUpload({ key: "error", message: "CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED" });
        } else {
          try {
            setUploadedFile(null);
            const response = await Digit.UploadServices.Filestorage("WS", file, tenantId?.split(".")[0]);
            if (response?.data?.files?.length > 0) {
              setUploadedFile(response?.data?.files[0]?.fileStoreId);
              setValue("document", response?.data?.files[0]?.fileStoreId, { shouldValidate: true });
            } else {
              setErrorUpload({ key: "error", message: "CS_FILE_UPLOAD_ERROR" });
            }
          } catch (err) {
            setErrorUpload({ key: "error", message: "CS_FILE_UPLOAD_ERROR" });
          }
        }
      }
    })();
  }, [file]);

  function selectfile(e) {
    setFile(e.target.files[0]);
  }

  useEffect(() => {
    if (userType === "employee") {
      const isDifferent = !_.isEqual(formData?.djbEmployee, formValue);
      if (isDifferent) {
        const timer = setTimeout(() => {
          onSelect(config?.key, { ...formValue });
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [formValue, userType]);

  useEffect(() => {
    if (isDjbEmployee) {
      if (Object.keys(localFormState.errors).length && !_.isEqual(formState?.errors?.[config?.key]?.type || {}, localFormState.errors)) {
        if (setError) setError(config?.key, { type: localFormState.errors });
      } else if (!Object.keys(localFormState.errors).length && formState?.errors?.[config?.key]) {
        if (clearErrors) clearErrors(config?.key);
      }
    } else {
      if (formState?.errors?.[config?.key] && clearErrors) {
        clearErrors(config?.key);
      }
    }
  }, [localFormState.errors, isDjbEmployee]);

  const goNext = () => {
    onSelect(config.key, formValue);
  };

  const onSkip = () => onSelect();

  const FormContent = (
    <CollapsibleCardPage title={t("Are you a DJB Employee?")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <CardLabel>{t("Are you a DJB Employee?")}</CardLabel>
          <div className="field">
            <Controller
              control={control}
              name="isDjbEmployee"
              render={(props) => (
                <RadioButtons
                  className="form-field"
                  style={{ display: "flex", gap: "2rem", alignItems: "center" }}
                  options={[
                    { i18nKey: "CORE_COMMON_YES", code: true },
                    { i18nKey: "CORE_COMMON_NO", code: false },
                  ]}
                  optionsKey="i18nKey"
                  selectedOption={props.value ? { i18nKey: "CORE_COMMON_YES", code: true } : { i18nKey: "CORE_COMMON_NO", code: false }}
                  onSelect={(e) => props.onChange(e.code)}
                  t={t}
                />
              )}
            />
          </div>
        </LabelFieldPair>
      </div>

      {isDjbEmployee && (
        <div className="formcomposer-section-grid">
        <div>
          <LabelFieldPair>
            <CardLabel>
              {t("Employee ID")}
              {isDjbEmployee && <span className="check-page-link-button"> *</span>}
            </CardLabel>
            <Controller
              control={control}
              name="employeeId"
              rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
              render={(props) => (
                <TextInput
                  value={props.value}
                  onChange={(e) => props.onChange(e.target.value)}
                  onBlur={props.onBlur}
                  placeholder={t("Employee ID")}
                />
              )}
            />
          </LabelFieldPair>
        </div>

        {/* <div>
          <LabelFieldPair>
            <CardLabel>
              {t("Date of Retirement")}
              {isDjbEmployee && <span className="check-page-link-button"> *</span>}
            </CardLabel>
            <div className="field">
              <Controller
                control={control}
                name="dor"
                rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                render={(props) => <DatePicker date={props.value} onChange={(date) => props.onChange(date)} />}
              />
            </div>
          </LabelFieldPair>
        </div> */}

        <div>
          <LabelFieldPair>
            <CardLabel>
              {t("Employee Designation")}
              {isDjbEmployee && <span className="check-page-link-button"> *</span>}
            </CardLabel>
            <div className="field">
              <Controller
                control={control}
                name="designation"
                rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    onChange={(e) => props.onChange(e.target.value)}
                    onBlur={props.onBlur}
                    placeholder={t("Employee Designation")}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
        </div>

        <div>
          <LabelFieldPair>
            <CardLabel>
              {t("Upload Employee ID Document")}
              {isDjbEmployee && <span className="check-page-link-button"> *</span>}
            </CardLabel>
            <div className="field">
              <Controller
                control={control}
                name="document"
                rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                render={(props) => (
                  <UploadFile
                    id={"employee-doc"}
                    extraStyleName={"propertyCreate"}
                    placeholder={t("Upload Employee ID Document")}
                    accept="image/*, .pdf, .png, .jpeg, .jpg"
                    onUpload={(e) => {
                      selectfile(e);
                    }}
                    onDelete={() => {
                      setUploadedFile(null);
                      setFile(null);
                      props.onChange("");
                      setValue("document", "", { shouldValidate: true });
                    }}
                    message={uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`ES_NO_FILE_SELECTED_LABEL`)}
                    error={errorUpload}
                    uploadedFiles={
                      uploadedFile && !file ? [[file?.name || t("Upload Employee ID Document"), { fileStoreId: uploadedFile }]] : undefined
                    }
                  />
                )}
              />
              {uploadedFile && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    background: "#F3F4F6",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    width: "fit-content",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#374151", fontWeight: "600" }}>{file?.name || t("Upload Employee ID Document")}</span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => handleView(uploadedFile, tenantId)}
                      title={t("View Document") || "View Document"}
                      style={{ border: "none", background: "transparent", color: "#00497e", cursor: "pointer", padding: 0 }}
                    >
                      <ViewsIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setFile(null);
                        setValue("document", "", { shouldValidate: true });
                      }}
                      title="Remove Document"
                      style={{ border: "none", background: "transparent", color: "#d32f2f", cursor: "pointer", padding: 0, fontSize: "18px" }}
                    >
                      <RemoveIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </LabelFieldPair>
        </div>
      </div>
      )}
    </CollapsibleCardPage>
  );

  const DueVerificationContent =
    formData?.dueVerification?.length > 0 ? (
      <CollapsibleCardPage title={t("Due Verification Details")} defaultOpen={true}>
        <div style={{ overflowX: "auto", marginTop: "10px", marginBottom: "30px", width: "100%" }}>
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", border: "1px solid #e0e0e0" }}>
            <thead>
              <tr style={{ backgroundColor: "#f4f7fb", borderBottom: "2px solid #e0e0e0" }}>
                <th style={{ padding: "12px 8px", borderBottom: "1px solid #e0e0e0" }}>{t("K No.")}</th>
                <th style={{ padding: "12px 8px", borderBottom: "1px solid #e0e0e0" }}>{t("Full Name")}</th>
                <th style={{ padding: "12px 8px", borderBottom: "1px solid #e0e0e0" }}>{t("Full Address")}</th>
                <th style={{ padding: "12px 8px", borderBottom: "1px solid #e0e0e0" }}>{t("Due Amount")}</th>
                <th style={{ padding: "12px 8px", borderBottom: "1px solid #e0e0e0" }}>{t("Total Amount")}</th>
                <th style={{ padding: "12px 8px", borderBottom: "1px solid #e0e0e0" }}>{t("Remarks")}</th>
                <th style={{ padding: "12px 8px", borderBottom: "1px solid #e0e0e0" }}>{t("ABG_COMMON_TABLE_COL_ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {formData.dueVerification.map((dueItem, index) => (
                <tr key={`due-${index}`} style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={{ padding: "12px 8px" }}>{dueItem?.kno || t("CS_NA")}</td>
                  <td style={{ padding: "12px 8px" }}>{dueItem?.fullName || t("CS_NA")}</td>
                  <td style={{ padding: "12px 8px" }}>{dueItem?.fullAddress || t("CS_NA")}</td>
                  <td style={{ padding: "12px 8px" }}>{dueItem?.dueAmount || t("CS_NA")}</td>
                  <td style={{ padding: "12px 8px" }}>{dueItem?.totalAmount || t("CS_NA")}</td>
                  <td style={{ padding: "12px 8px" }}>{dueItem?.remarks || t("CS_NA")}</td>
                  <td style={{ padding: "12px 8px" }}>
                    {Number(dueItem?.dueAmount) > 0 || Number(dueItem?.totalAmount) > 0 ? (
                      <span className="link">
                        <Link
                          to={{
                            pathname:
                              Digit.UserService.getUser()?.info?.type === "CITIZEN"
                                ? `/digit-ui/citizen/payment/my-bills/${formData?.serviceName?.code === "WATER" || formData?.applicationType?.includes("WATER") ? "WS" : "SW"
                                }/${dueItem?.kno?.replaceAll("/", "+")}`
                                : `/digit-ui/employee/payment/collect/${formData?.serviceName?.code === "WATER" || formData?.applicationType?.includes("WATER") ? "WS" : "SW"
                                }/${encodeURIComponent(dueItem?.kno || "")}/${tenantId}`,

                            search:
                              Digit.UserService.getUser()?.info?.type === "CITIZEN"
                                ? `?workflow=WNS&tenantId=${encodeURIComponent(tenantId || "")}&ConsumerName=${encodeURIComponent(
                                  dueItem?.fullName || ""
                                )}&consumerCode=${encodeURIComponent(dueItem?.kno || "")}`
                                : `?tenantId=${encodeURIComponent(tenantId || "")}&ISWSCON=true`,

                            state: {
                              fromApplicationDetails: true,
                            },
                          }}
                        >
                          {t("MAKE_PAYMENT")}
                        </Link>
                      </span>
                    ) : (
                      <span style={{ color: "green", fontWeight: "bold" }}>{t("BILL_ALREADY_PAID")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleCardPage>
    ) : null;

  if (userType === "citizen") {
    return (
      <div>
        <Timeline currentStep={2} />
        <FormStep t={t} config={config} onSelect={goNext} onSkip={onSkip} isDisabled={Object.keys(localFormState.errors).length > 0}>
          <div style={{ marginTop: "-30px", marginBottom: "-30px" }}>
            {FormContent}
            {DueVerificationContent ? <div style={{ marginTop: "24px" }}>{DueVerificationContent}</div> : null}
          </div>
        </FormStep>
      </div>
    );
  }

  return (
    <React.Fragment>
      {FormContent}
      {DueVerificationContent ? <div style={{ marginTop: "24px" }}>{DueVerificationContent}</div> : null}
    </React.Fragment>
  );
};

export default WSDjbEmployee;