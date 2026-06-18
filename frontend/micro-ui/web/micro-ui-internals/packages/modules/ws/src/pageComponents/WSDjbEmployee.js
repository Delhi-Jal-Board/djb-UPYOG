import { CardLabel, LabelFieldPair, TextInput, CheckBox, Dropdown, DatePicker, CollapsibleCardPage, FormStep } from "@djb25/digit-ui-react-components";
import _ from "lodash";
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Timeline from "../components/Timeline";

const WSDjbEmployee = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const { control, watch, setValue, formState: localFormState } = useForm({
    defaultValues: {
      isDjbEmployee: String(formData?.djbEmployee?.isDjbEmployee) === "true" || String(formData?.additionalDetails?.isDjbEmployee) === "true" || false,
      employeeId: formData?.djbEmployee?.employeeId || formData?.additionalDetails?.employeeId || "",
      dor: formData?.djbEmployee?.dor || formData?.additionalDetails?.dor || "",
      designation: formData?.djbEmployee?.designation || formData?.additionalDetails?.designation || "",
    },
  });

  const formValue = watch();
  const isDjbEmployee = watch("isDjbEmployee");

  useEffect(() => {
    const isEmp = String(formData?.djbEmployee?.isDjbEmployee) === "true" || String(formData?.additionalDetails?.isDjbEmployee) === "true";
    if (isEmp !== undefined && isEmp !== null) {
      setValue("isDjbEmployee", isEmp);
      setValue("employeeId", formData?.djbEmployee?.employeeId || formData?.additionalDetails?.employeeId || "");
      setValue("dor", formData?.djbEmployee?.dor || formData?.additionalDetails?.dor || "");
      setValue("designation", formData?.djbEmployee?.designation || formData?.additionalDetails?.designation || "");
    }
  }, [formData?.djbEmployee, formData?.additionalDetails, setValue]);

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
    if (Object.keys(localFormState.errors).length && !_.isEqual(formState?.errors?.[config.key]?.type || {}, localFormState.errors)) {
      if (setError) setError(config.key, { type: localFormState.errors });
    } else if (!Object.keys(localFormState.errors).length && formState?.errors?.[config.key]) {
      if (clearErrors) clearErrors(config.key);
    }
  }, [localFormState.errors]);

  const goNext = () => {
    onSelect(config.key, formValue);
  };

  const onSkip = () => onSelect();

  const FormContent = (
    <CollapsibleCardPage title={t("WS_DJB_EMPLOYEE")} defaultOpen={true}>
      <div style={{ marginBottom: "24px" }}>
        <Controller
          control={control}
          name="isDjbEmployee"
          render={(props) => <CheckBox label={t("WS_DJB_EMPLOYEE")} checked={props.value} onChange={(e) => props.onChange(e.target.checked)} />}
        />
      </div>

      {isDjbEmployee && (
        <div className="formcomposer-section-grid">
          <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_EMPLOYEE_ID") + " *"}</CardLabel>
              <Controller
                control={control}
                name="employeeId"
                rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                render={(props) => <TextInput value={props.value} onChange={(e) => props.onChange(e.target.value)} onBlur={props.onBlur} />}
              />
            </LabelFieldPair>
          </div>

          <div>
            <LabelFieldPair>
              <CardLabel>{t("WS_DATE_OF_RETIREMENT") + " *"}</CardLabel>
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
              <CardLabel>{t("WS_EMPLOYEE_DESIGNATION") + " *"}</CardLabel>
              <div className="field">
                <Controller
                  control={control}
                  name="designation"
                  rules={{ required: isDjbEmployee ? t("CORE_COMMON_REQUIRED_ERRMSG") : false }}
                  render={(props) => <TextInput value={props.value} onChange={(e) => props.onChange(e.target.value)} onBlur={props.onBlur} />}
                />
              </div>
            </LabelFieldPair>
          </div>
        </div>
      )}
    </CollapsibleCardPage>
  );

  if (userType === "citizen") {
    return (
      <div>
        <Timeline currentStep={2} />
        <FormStep t={t} config={config} onSelect={goNext} onSkip={onSkip} isDisabled={Object.keys(localFormState.errors).length > 0}>
          <div style={{ marginTop: "-30px", marginBottom: "-30px" }}>
            {FormContent}
          </div>
        </FormStep>
      </div>
    );
  }

  return <React.Fragment>{FormContent}</React.Fragment>;
};

export default WSDjbEmployee;
