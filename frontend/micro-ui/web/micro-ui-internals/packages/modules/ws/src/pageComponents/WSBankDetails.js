import { CardLabel, LabelFieldPair, TextInput, CardLabelError, CollapsibleCardPage, FormStep, FieldLabelWithTooltip } from "@djb25/digit-ui-react-components";
import _ from "lodash";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Timeline from "../components/Timeline";

const WSBankDetails = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();

  const getInitialBankDetails = () => {
    const src =
      formData?.bankDetails?.bankDetails ||
      formData?.bankDetails ||
      formData?.additionalDetails?.bankDetails ||
      formData?.additionalDetails ||
      formData?.applicationData?.additionalDetails ||
      formData?.WaterConnectionResult?.WaterConnection?.[0]?.additionalDetails ||
      formData?.SewerageConnectionResult?.SewerageConnections?.[0]?.additionalDetails ||
      {};
    return {
      bankName: src?.bankName || "",
      bankBranchName: src?.bankBranchName || src?.branchName || "",
      ifscCode: src?.ifscCode || "",
      accountNumber: src?.accountNumber || src?.bankAccountNumber || "",
      confirmAccountNumber: src?.confirmAccountNumber || src?.accountNumber || src?.bankAccountNumber || "",
      accountHolderName: src?.accountHolderName || "",
    };
  };

  const initialVals = getInitialBankDetails();
  const hasInitialData = Boolean(initialVals.bankName || initialVals.bankBranchName || initialVals.ifscCode || initialVals.accountNumber);
  const isInitializedRef = React.useRef(hasInitialData);
  const currentAppId =
    formData?.applicationNo ||
    formData?.applicationNumber ||
    formData?.WaterConnectionResult?.WaterConnection?.[0]?.applicationNo ||
    formData?.propertyId ||
    "";
  const appIdRef = React.useRef(currentAppId);

  const { control, formState: localFormState, watch, trigger, getValues, setValue, reset } = useForm({
    defaultValues: initialVals,
    mode: "all",
  });
  const formValue = watch();
  const { errors } = localFormState;

  const onSelectRef = React.useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const getValidationErrors = (values) => {
    const errs = {};
    const bankName = String(values?.bankName || "").trim();
    const bankBranchName = String(values?.bankBranchName || values?.branchName || "").trim();
    const ifscCode = String(values?.ifscCode || "")
      .trim()
      .toUpperCase();
    const accountNumber = String(values?.accountNumber || values?.bankAccountNumber || "").trim();

    if (!bankName) {
      errs.bankName = t("CORE_COMMON_REQUIRED_ERRMSG");
    }
    if (!bankBranchName) {
      errs.bankBranchName = t("CORE_COMMON_REQUIRED_ERRMSG");
    }
    if (!ifscCode) {
      errs.ifscCode = t("CORE_COMMON_REQUIRED_ERRMSG");
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      errs.ifscCode = t("ERR_INVALID_IFSC_CODE");
    }
    if (!accountNumber) {
      errs.accountNumber = t("CORE_COMMON_REQUIRED_ERRMSG");
    } else if (!/^[0-9]{1,18}$/.test(accountNumber)) {
      errs.accountNumber = t("ERR_INVALID_BA_ACCOUNT_NUMBER");
    }
    return errs;
  };

  const bankErrors = getValidationErrors(formValue);
  const hasBankErrors = Object.keys(bankErrors).length > 0;

  useEffect(() => {
    const latestAppId =
      formData?.applicationNo ||
      formData?.applicationNumber ||
      formData?.WaterConnectionResult?.WaterConnection?.[0]?.applicationNo ||
      formData?.propertyId ||
      "";

    const isDifferentApp = Boolean(latestAppId && appIdRef.current && latestAppId !== appIdRef.current);
    if (isDifferentApp) {
      appIdRef.current = latestAppId;
      const initial = getInitialBankDetails();
      reset(initial);
      isInitializedRef.current = true;
      return;
    }

    if (!isInitializedRef.current) {
      const initial = getInitialBankDetails();
      if (initial.bankName || initial.bankBranchName || initial.ifscCode || initial.accountNumber) {
        setValue("bankName", initial.bankName);
        setValue("bankBranchName", initial.bankBranchName);
        setValue("ifscCode", initial.ifscCode);
        setValue("accountNumber", initial.accountNumber);
        setValue("confirmAccountNumber", initial.confirmAccountNumber);
        setValue("accountHolderName", initial.accountHolderName);
        isInitializedRef.current = true;
      }
    }
  }, [
    formData?.bankDetails,
    formData?.additionalDetails,
    formData?.applicationNo,
    formData?.applicationNumber,
    formData?.WaterConnectionResult?.WaterConnection?.[0]?.additionalDetails,
  ]);

  useEffect(() => {
    const currentBank = formData?.bankDetails?.bankDetails || formData?.bankDetails || {};
    const isDifferent =
      (currentBank?.bankName || "") !== (formValue?.bankName || "") ||
      (currentBank?.bankBranchName || currentBank?.branchName || "") !== (formValue?.bankBranchName || "") ||
      (currentBank?.ifscCode || "") !== (formValue?.ifscCode || "") ||
      (currentBank?.accountNumber || currentBank?.bankAccountNumber || "") !== (formValue?.accountNumber || "");

    if (isDifferent && onSelectRef.current) {
      const timer = setTimeout(() => {
        const normalized = {
          bankName: formValue?.bankName || "",
          branchName: formValue?.bankBranchName || formValue?.branchName || "",
          bankBranchName: formValue?.bankBranchName || formValue?.branchName || "",
          ifscCode: formValue?.ifscCode || "",
          accountNumber: formValue?.accountNumber || formValue?.bankAccountNumber || "",
          bankAccountNumber: formValue?.accountNumber || formValue?.bankAccountNumber || "",
          confirmAccountNumber: formValue?.confirmAccountNumber || formValue?.accountNumber || "",
          accountHolderName: formValue?.accountHolderName || "",
        };
        onSelectRef.current(config?.key || "bankDetails", normalized);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [formValue?.bankName, formValue?.bankBranchName, formValue?.ifscCode, formValue?.accountNumber, formData?.bankDetails, config?.key]);

  useEffect(() => {
    const configKey = config?.key || "bankDetails";
    if (hasBankErrors) {
      if (setError) setError(configKey, { type: "required", message: "CORE_COMMON_REQUIRED_ERRMSG" });
    } else {
      if (clearErrors) clearErrors(configKey);
    }
  }, [hasBankErrors, config?.key]);

  const lastFetchedIfscRef = React.useRef(initialVals?.ifscCode || "");
  useEffect(() => {
    const ifsc = formValue?.ifscCode;
    if (ifsc && ifsc.length === 11 && ifsc !== lastFetchedIfscRef.current) {
      lastFetchedIfscRef.current = ifsc;
      fetch(`https://ifsc.razorpay.com/${ifsc}`)
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error("Invalid IFSC");
        })
        .then((data) => {
          if (data) {
            if (data.BANK) setValue("bankName", data.BANK, { shouldValidate: true, shouldDirty: true });
            if (data.BRANCH) setValue("bankBranchName", data.BRANCH, { shouldValidate: true, shouldDirty: true });
          }
        })
        .catch((err) => {
          console.error("IFSC lookup failed", err);
        });
    }
  }, [formValue?.ifscCode]);

  const errorStyle = { width: "70%", marginLeft: "30%", fontSize: "12px", marginTop: "-21px" };

  const triggerParentSync = () => {
    if (onSelectRef.current) {
      const current = getValues();
      const normalized = {
        bankName: current?.bankName || "",
        branchName: current?.bankBranchName || current?.branchName || "",
        bankBranchName: current?.bankBranchName || current?.branchName || "",
        ifscCode: current?.ifscCode || "",
        accountNumber: current?.accountNumber || current?.bankAccountNumber || "",
        bankAccountNumber: current?.accountNumber || current?.bankAccountNumber || "",
        confirmAccountNumber: current?.confirmAccountNumber || current?.accountNumber || "",
        accountHolderName: current?.accountHolderName || "",
      };
      onSelectRef.current(config?.key || "bankDetails", normalized);
    }
  };

  const goNext = () => {
    const errs = getValidationErrors(formValue);
    if (Object.keys(errs).length > 0) {
      trigger(["bankName", "bankBranchName", "ifscCode", "accountNumber"]);
      return;
    }
    const normalized = {
      ...formValue,
      branchName: formValue?.branchName || formValue?.bankBranchName || "",
      bankBranchName: formValue?.bankBranchName || formValue?.branchName || "",
      bankAccountNumber: formValue?.bankAccountNumber || formValue?.accountNumber || "",
      accountNumber: formValue?.accountNumber || formValue?.bankAccountNumber || "",
    };
    onSelect(config.key, normalized);
  };

  const onSkip = () => onSelect();

  const FormContent = (
    <CollapsibleCardPage title={t("WS_BANK_DETAILS")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        {/* Row 1: Bank Name and Branch Name */}
        <div>
          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("WS_IFSC_CODE")}
              isMandatory={true}
              infoText={t("WS_IFSC_CODE_INFO_MSG", "Enter 11-character IFSC code")}
            />
            <div className="field">
              <Controller
                control={control}
                name={"ifscCode"}
                rules={{
                  required: t("CORE_COMMON_REQUIRED_ERRMSG"),
                  pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: t("ERR_INVALID_IFSC_CODE") },
                }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    placeholder={t("WS_IFSC_CODE_PLACEHOLDER")}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase();
                      if (val.length > 11) val = val.slice(0, 11);
                      props.onChange(val);
                      trigger("ifscCode");
                    }}
                    onBlur={(e) => {
                      props.onBlur(e);
                      trigger("ifscCode");
                      triggerParentSync();
                    }}
                    maxLength={11}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {(localFormState.touched?.ifscCode || localFormState.isSubmitted) && (errors?.ifscCode?.message || bankErrors?.ifscCode) ? (
            <CardLabelError style={errorStyle}> {errors?.ifscCode?.message || bankErrors?.ifscCode}</CardLabelError>
          ) : null}
        </div>
        <div>
          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("WS_NAME_OF_BANK")}
              isMandatory={true}
              infoText={t("WS_NAME_OF_BANK_INFO_MSG", "Bank Name fetched automatically from IFSC code")}
            />
            <div className="field">
              <Controller
                control={control}
                name={"bankName"}
                rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    placeholder={t("WS_NAME_OF_BANK_PLACEHOLDER")}
                    onChange={(e) => {
                      props.onChange(e.target.value);
                      trigger("bankName");
                    }}
                    onBlur={(e) => {
                      props.onBlur(e);
                      trigger("bankName");
                      triggerParentSync();
                    }}
                    disabled={true}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {(localFormState.touched?.bankName || localFormState.isSubmitted) && (errors?.bankName?.message || bankErrors?.bankName) ? (
            <CardLabelError style={errorStyle}> {errors?.bankName?.message || bankErrors?.bankName}</CardLabelError>
          ) : null}
        </div>

        <div>
          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("WS_NAME_OF_BRANCH")}
              isMandatory={true}
              infoText={t("WS_NAME_OF_BRANCH_INFO_MSG", "Branch Name fetched automatically from IFSC code")}
            />
            <div className="field">
              <Controller
                control={control}
                name={"bankBranchName"}
                rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    placeholder={t("WS_NAME_OF_BRANCH_PLACEHOLDER")}
                    onChange={(e) => {
                      props.onChange(e.target.value);
                      trigger("bankBranchName");
                    }}
                    onBlur={(e) => {
                      props.onBlur(e);
                      trigger("bankBranchName");
                      triggerParentSync();
                    }}
                    disabled={true}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {(localFormState.touched?.bankBranchName || localFormState.isSubmitted) &&
          (errors?.bankBranchName?.message || bankErrors?.bankBranchName) ? (
            <CardLabelError style={errorStyle}> {errors?.bankBranchName?.message || bankErrors?.bankBranchName}</CardLabelError>
          ) : null}
        </div>

        {/* Row 2: IFSC Code and Account Number */}

        <div>
          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("WS_BANK_ACCOUNT_NO")}
              isMandatory={true}
              infoText={t("WS_BANK_ACCOUNT_NO_INFO_MSG", "Enter Bank Account Number")}
            />
            <div className="field">
              <Controller
                control={control}
                name={"accountNumber"}
                rules={{
                  required: t("CORE_COMMON_REQUIRED_ERRMSG"),
                  pattern: { value: /^[0-9]{1,18}$/, message: t("ERR_INVALID_BA_ACCOUNT_NUMBER") },
                }}
                render={(props) => (
                  <TextInput
                    value={props.value}
                    placeholder={t("WS_BANK_ACCOUNT_NO_PLACEHOLDER")}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 18) {
                        value = value.slice(0, 18);
                      }
                      props.onChange(value);
                      setValue("confirmAccountNumber", value);
                      trigger("accountNumber");
                    }}
                    onBlur={(e) => {
                      props.onBlur(e);
                      trigger("accountNumber");
                      triggerParentSync();
                    }}
                    maxLength={18}
                  />
                )}
              />
            </div>
          </LabelFieldPair>
          {(localFormState.touched?.accountNumber || localFormState.isSubmitted) && (errors?.accountNumber?.message || bankErrors?.accountNumber) ? (
            <CardLabelError style={errorStyle}> {errors?.accountNumber?.message || bankErrors?.accountNumber}</CardLabelError>
          ) : null}
        </div>

        {/* Keeping these for data consistency but can be hidden if not needed in UI */}
        <div style={{ display: "none" }}>
          <Controller control={control} name={"confirmAccountNumber"} render={(props) => <TextInput value={props.value} />} />
          <Controller control={control} name={"accountHolderName"} render={(props) => <TextInput value={props.value} />} />
        </div>
      </div>
    </CollapsibleCardPage>
  );

  if (userType === "citizen") {
    return (
      <div>
        <Timeline currentStep={2} />
        <FormStep t={t} config={config} onSelect={goNext} isDisabled={hasBankErrors || Object.keys(errors).length > 0}>
          <div style={{ marginTop: "-30px", marginBottom: "-30px" }}>{FormContent}</div>
        </FormStep>
      </div>
    );
  }

  return <React.Fragment>{FormContent}</React.Fragment>;
};

export default WSBankDetails;
