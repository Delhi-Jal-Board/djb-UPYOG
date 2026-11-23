import { RadioButtons, LabelFieldPair, CardLabel, CollapsibleCardPage, FormStep, FieldLabelWithTooltip } from "@djb25/digit-ui-react-components";
import React, { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

const WSSewerTreatmentPlant = ({ config, onSelect, userType, formData }) => {
  const { t } = useTranslation();

  const getInitialValue = () => {
    const configKey = config?.key || "sewerTreatmentPlant";
    const stp = formData?.[configKey] || formData?.sewageTreatmentPlant;
    const add = formData?.additionalDetails;
    if (stp?.hasCertificate !== undefined) {
      return String(stp.hasCertificate) === "true" || stp.hasCertificate === true;
    }
    if (stp?.hasStp !== undefined) {
      return String(stp.hasStp) === "true" || stp.hasStp === true;
    }
    if (stp?.isSewerTreatmentPlant !== undefined) {
      return String(stp.isSewerTreatmentPlant) === "true" || stp.isSewerTreatmentPlant === true;
    }
    if (add?.hasSewerTreatmentPlant !== undefined) {
      return String(add.hasSewerTreatmentPlant) === "true" || add.hasSewerTreatmentPlant === true;
    }
    if (add?.hasSewageTreatmentPlant !== undefined) {
      return String(add.hasSewageTreatmentPlant) === "true" || add.hasSewageTreatmentPlant === true;
    }
    if (add?.hasStp !== undefined) {
      return String(add.hasStp) === "true" || add.hasStp === true;
    }
    if (add?.isSewerTreatmentPlant !== undefined) {
      return String(add.isSewerTreatmentPlant) === "true" || add.isSewerTreatmentPlant === true;
    }
    return false; // By default No
  };

  const { control, watch, setValue } = useForm({
    defaultValues: {
      hasCertificate: getInitialValue(),
    },
  });

  const formValue = watch();
  const onSelectRef = useRef(onSelect);
  const goNext = () =>
    onSelect(config?.key || "sewerTreatmentPlant", {
      hasCertificate: !!formValue.hasCertificate,
      hasStp: !!formValue.hasCertificate,
      isSewerTreatmentPlant: !!formValue.hasCertificate,
    });
  const onSkip = () => onSelect();

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const configKey = config?.key || "sewerTreatmentPlant";
  const hasData = !!(
    formData?.[configKey] !== undefined ||
    formData?.sewageTreatmentPlant !== undefined ||
    formData?.additionalDetails?.hasSewerTreatmentPlant !== undefined ||
    formData?.additionalDetails?.hasStp !== undefined
  );
  const isInitializedRef = useRef(hasData);

  useEffect(() => {
    if (
      !isInitializedRef.current &&
      (formData?.[configKey] !== undefined ||
        formData?.sewageTreatmentPlant !== undefined ||
        formData?.additionalDetails?.hasSewerTreatmentPlant !== undefined ||
        formData?.additionalDetails?.hasStp !== undefined)
    ) {
      setValue("hasCertificate", getInitialValue());
      isInitializedRef.current = true;
    }
  }, [formData?.[configKey], formData?.sewageTreatmentPlant, formData?.additionalDetails]);

  useEffect(() => {
    const isEmployeeMode =
      userType === "employee" ||
      window.location.href.includes("edit-application") ||
      window.location.href.includes("modify-connection") ||
      window.location.href.includes("old-application");

    if (isEmployeeMode) {
      const currentVal = formData?.[configKey]?.hasCertificate ?? formData?.[configKey]?.hasStp;
      const newVal = !!formValue.hasCertificate;
      if (currentVal !== newVal) {
        onSelectRef.current(configKey, {
          hasCertificate: newVal,
          hasStp: newVal,
          isSewerTreatmentPlant: newVal,
        });
      }
    }
  }, [configKey, formValue.hasCertificate, userType, formData?.[configKey]?.hasCertificate, formData?.[configKey]?.hasStp]);

  const content = (
    <CollapsibleCardPage title={t("Sewer Treatment Plant (STP)")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <FieldLabelWithTooltip
            label={t("Sewer Treatment Plant (STP)")}
            isMandatory={false}
            infoText={t("WS_STP_INFO_MSG", "Select Yes if Sewer Treatment Plant is available")}
          />
          <div className="field">
            <Controller
              control={control}
              name="hasCertificate"
              render={(props) => (
                <RadioButtons
                  className="form-field"
                  style={{ display: "flex", gap: "2rem", alignItems: "center" }}
                  name="hasSewerTreatmentPlantRadio"
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
    </CollapsibleCardPage>
  );

  return userType === "citizen" ? (
    <FormStep t={t} config={config} onSelect={goNext} onSkip={onSkip}>
      {content}
    </FormStep>
  ) : (
    content
  );
};

export default WSSewerTreatmentPlant;
