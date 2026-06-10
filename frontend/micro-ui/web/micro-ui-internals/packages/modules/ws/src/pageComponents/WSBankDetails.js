import { CardLabel, LabelFieldPair, TextInput, CardLabelError, CollapsibleCardPage } from "@djb25/digit-ui-react-components";
import _ from "lodash";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

const WSBankDetails = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const { control, formState: localFormState, watch, trigger, getValues, setValue } = useForm({
    defaultValues: formData?.bankDetails || {
      bankName: "",
      bankBranchName: "",
      ifscCode: "",
      accountNumber: "",
      confirmAccountNumber: "",
      accountHolderName: "",
    },
  });
  const formValue = watch();
  const { errors } = localFormState;

  useEffect(() => {
    const isDifferent = !_.isEqual(formData?.bankDetails, formValue);
    if (isDifferent) {
      const timer = setTimeout(() => {
        onSelect(config?.key, { ...formValue });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [formValue]);

  useEffect(() => {
    if (Object.keys(errors).length && !_.isEqual(formState.errors[config.key]?.type || {}, errors)) {
      setError(config.key, { type: errors });
    } else if (!Object.keys(errors).length && formState.errors[config.key]) {
      clearErrors(config.key);
    }
  }, [errors]);

  useEffect(() => {
    const ifsc = formValue?.ifscCode;
    if (ifsc && ifsc.length === 11) {
      fetch(`https://ifsc.razorpay.com/${ifsc}`)
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error("Invalid IFSC");
        })
        .then((data) => {
          if (data) {
            setValue("bankName", data.BANK);
            setValue("bankBranchName", data.BRANCH);
          }
        })
        .catch((err) => {
          console.error("IFSC lookup failed", err);
        });
    }
  }, [formValue?.ifscCode]);

  const errorStyle = { width: "70%", marginLeft: "30%", fontSize: "12px", marginTop: "-21px" };

  return (
    <React.Fragment>
      <CollapsibleCardPage title={t("WS_BANK_DETAILS")} defaultOpen={true}>
        <div className="formcomposer-section-grid">
          {/* Row 1: Bank Name and Branch Name */}
          <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_NAME_OF_BANK") + " *"}</CardLabel>
              <div className="field">
                <Controller
                  control={control}
                  name={"bankName"}
                  rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
                  render={(props) => (
                    <TextInput
                      value={props.value}
                      placeholder={t("WS_NAME_OF_BANK_PLACEHOLDER")}
                      onChange={(e) => props.onChange(e.target.value)}
                      onBlur={props.onBlur}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            {localFormState.touched?.bankName ? <CardLabelError style={errorStyle}> {errors?.bankName?.message}</CardLabelError> : null}
          </div>

          <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_NAME_OF_BRANCH") + " *"}</CardLabel>
              <div className="field">
                <Controller
                  control={control}
                  name={"bankBranchName"}
                  rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
                  render={(props) => (
                    <TextInput
                      value={props.value}
                      placeholder={t("WS_NAME_OF_BRANCH_PLACEHOLDER")}
                      onChange={(e) => props.onChange(e.target.value)}
                      onBlur={props.onBlur}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            {localFormState.touched?.bankBranchName ? <CardLabelError style={errorStyle}> {errors?.bankBranchName?.message}</CardLabelError> : null}
          </div>

          {/* Row 2: IFSC Code and Account Number */}
          <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_IFSC_CODE") + " *"}</CardLabel>
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
                      onChange={(e) => props.onChange(e.target.value.toUpperCase())}
                      onBlur={props.onBlur}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            {localFormState.touched?.ifscCode ? <CardLabelError style={errorStyle}> {errors?.ifscCode?.message}</CardLabelError> : null}
          </div>

          <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_BANK_ACCOUNT_NO") + " *"}</CardLabel>
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
                      }}
                      onBlur={props.onBlur}
                      maxLength={18}
                    />
                  )}
                />
              </div>
            </LabelFieldPair>
            {localFormState.touched?.accountNumber ? <CardLabelError style={errorStyle}> {errors?.accountNumber?.message}</CardLabelError> : null}
          </div>

          {/* Keeping these for data consistency but can be hidden if not needed in UI */}
          <div style={{ display: "none" }}>
            <Controller control={control} name={"confirmAccountNumber"} render={(props) => <TextInput value={props.value} />} />
            <Controller control={control} name={"accountHolderName"} render={(props) => <TextInput value={props.value} />} />
          </div>
        </div>
      </CollapsibleCardPage>
    </React.Fragment>
  );
};

export default WSBankDetails;
