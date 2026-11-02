import {
  CardLabel,
  LabelFieldPair,
  TextInput,
  CollapsibleCardPage,
  FormStep,
  RadioButtons,
  CardLabelError,
  DatePicker,
} from "@djb25/digit-ui-react-components";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Timeline from "../components/Timeline";

const WSDjbEmployee = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();

  const getInitialValues = () => {
    const djb = formData?.djbEmployee;
    const add = formData?.additionalDetails;

    const isEmp =
      djb?.isDjbEmployee !== undefined
        ? String(djb?.isDjbEmployee) === "true" || djb?.isDjbEmployee === true
        : add?.isDjbEmployee !== undefined
        ? String(add?.isDjbEmployee) === "true" || add?.isDjbEmployee === true
        : false;

    const empId =
      djb?.employeeId !== undefined
        ? djb?.employeeId
        : add?.employeeId !== undefined
        ? add?.employeeId
        : "";

    const dorVal =
      djb?.dor !== undefined
        ? djb?.dor
        : add?.dor !== undefined
        ? add?.dor
        : "";

    const desig =
      djb?.designation !== undefined
        ? djb?.designation
        : add?.designation !== undefined
        ? add?.designation
        : "";

    const doc =
      djb?.document !== undefined
        ? (djb?.document?.fileStoreId || djb?.document || "")
        : add?.document !== undefined
        ? (add?.document?.fileStoreId || add?.document || "")
        : "";

    return {
      isDjbEmployee: !!isEmp,
      employeeId: empId || "",
      dor: dorVal || "",
      designation: desig || "",
      document: doc || "",
    };
  };

  const initialVals = getInitialValues();

  const { control, watch, setValue, formState: localFormState, trigger, clearErrors: localClearErrors } = useForm({
    defaultValues: initialVals,
    mode: "all",
  });

  const formValue = watch();
  const isDjbEmployee = formValue?.isDjbEmployee === true || String(formValue?.isDjbEmployee) === "true";

  const hasData = !!(formData?.djbEmployee !== undefined || formData?.additionalDetails?.isDjbEmployee !== undefined);
  const isInitializedRef = React.useRef(hasData);

  const getValidationErrors = (values) => {
    const errs = {};
    const isEmp = values?.isDjbEmployee === true || String(values?.isDjbEmployee) === "true";
    if (isEmp) {
      if (!values?.employeeId || !String(values?.employeeId).trim()) {
        errs.employeeId = t("CORE_COMMON_REQUIRED_ERRMSG");
      }
      if (!values?.designation || !String(values?.designation).trim()) {
        errs.designation = t("CORE_COMMON_REQUIRED_ERRMSG");
      }
    }
    return errs;
  };

  useEffect(() => {
    if (!isInitializedRef.current && (formData?.djbEmployee !== undefined || formData?.additionalDetails?.isDjbEmployee !== undefined)) {
      const vals = getInitialValues();
      setValue("isDjbEmployee", vals.isDjbEmployee);
      setValue("employeeId", vals.employeeId);
      setValue("dor", vals.dor);
      setValue("designation", vals.designation);
      setValue("document", vals.document);
      isInitializedRef.current = true;
    }
  }, [formData?.djbEmployee, formData?.additionalDetails]);

  const djbErrors = getValidationErrors(formValue);
  const hasDjbErrors = Object.keys(djbErrors).length > 0;

  useEffect(() => {
    const configKey = config?.key || "djbEmployee";
    if (!isDjbEmployee) {
      localClearErrors();
      setValue("employeeId", "");
      setValue("dor", "");
      setValue("designation", "");
      setValue("document", "");
      if (clearErrors) clearErrors(configKey);
    } else {
      setTimeout(() => {
        trigger(["employeeId", "designation"]);
      }, 50);
      const errs = getValidationErrors(formValue);
      if (Object.keys(errs).length > 0 && setError) {
        setError(configKey, { type: "required", message: "CORE_COMMON_REQUIRED_ERRMSG" });
      }
    }
  }, [isDjbEmployee]);

  useEffect(() => {
    const isEmployeeMode =
      userType === "employee" ||
      window.location.href.includes("edit-application") ||
      window.location.href.includes("modify-connection") ||
      window.location.href.includes("old-application");

    if (isEmployeeMode) {
      const isDifferent = !_.isEqual(formData?.djbEmployee, formValue);
      if (isDifferent) {
        const isImmediate = formData?.djbEmployee?.isDjbEmployee !== formValue?.isDjbEmployee;
        const delay = isImmediate ? 0 : 100;
        const timer = setTimeout(() => {
          onSelect(config?.key || "djbEmployee", { ...formValue });
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [formValue, userType]);

  useEffect(() => {
    const configKey = config?.key || "djbEmployee";
    if (hasDjbErrors) {
      if (setError) setError(configKey, { type: "required", message: "CORE_COMMON_REQUIRED_ERRMSG" });
    } else {
      if (formState?.errors?.[configKey] && clearErrors) {
        clearErrors(configKey);
      }
    }
  }, [
    hasDjbErrors,
    formValue?.isDjbEmployee,
    formValue?.employeeId,
    formValue?.designation,
    config?.key,
  ]);

  const goNext = () => {
    onSelect(config.key, formValue);
  };

  const onSkip = () => onSelect();

  const errorStyle = { width: "100%", marginLeft: "0px", fontSize: "12px", marginTop: "4px" };

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
                  name="isDjbEmployeeRadio"
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
            <div className="field" style={{ width: "100%" }}>
              <Controller
                control={control}
                name="employeeId"
                rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    onChange={(e) => {
                      props.onChange(e.target.value);
                      trigger("employeeId");
                    }}
                    onBlur={(e) => {
                      props.onBlur(e);
                      trigger("employeeId");
                    }}
                    placeholder={t("Employee ID")}
                  />
                )}
              />
              {localFormState?.touched?.employeeId && !formValue?.employeeId?.trim?.() && (
                <CardLabelError style={errorStyle}>{t("CORE_COMMON_REQUIRED_ERRMSG")}</CardLabelError>
              )}
            </div>
          </LabelFieldPair>
        </div>

        <div>
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
        </div>

        <div>
          <LabelFieldPair>
            <CardLabel>
              {t("Employee Designation")}
              {isDjbEmployee && <span className="check-page-link-button"> *</span>}
            </CardLabel>
            <div className="field" style={{ width: "100%" }}>
              <Controller
                control={control}
                name="designation"
                rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    onChange={(e) => {
                      props.onChange(e.target.value);
                      trigger("designation");
                    }}
                    onBlur={(e) => {
                      props.onBlur(e);
                      trigger("designation");
                    }}
                    placeholder={t("Employee Designation")}
                  />
                )}
              />
              {localFormState?.touched?.designation && !formValue?.designation?.trim?.() && (
                <CardLabelError style={errorStyle}>{t("CORE_COMMON_REQUIRED_ERRMSG")}</CardLabelError>
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
        <FormStep t={t} config={config} onSelect={goNext} onSkip={onSkip} isDisabled={hasDjbErrors}>
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