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

  const getInitialAdequacyValue = () => {
    const configKey = config?.key || "sewerTreatmentPlant";
    const stp = formData?.[configKey] || formData?.sewageTreatmentPlant;
    const add = formData?.additionalDetails;
    if (stp?.hasAdequacyCertificate !== undefined) {
      return String(stp.hasAdequacyCertificate) === "true" || stp.hasAdequacyCertificate === true;
    }
    if (stp?.hasStpAdequacyCertificate !== undefined) {
      return String(stp.hasStpAdequacyCertificate) === "true" || stp.hasStpAdequacyCertificate === true;
    }
    if (stp?.hasSewerTreatmentPlantAdequacyCertificate !== undefined) {
      return String(stp.hasSewerTreatmentPlantAdequacyCertificate) === "true" || stp.hasSewerTreatmentPlantAdequacyCertificate === true;
    }
    if (stp?.applyForAdequacyCertificate !== undefined) {
      return String(stp.applyForAdequacyCertificate) === "true" || stp.applyForAdequacyCertificate === true;
    }
    if (stp?.applyForStpAdequacyCertificate !== undefined) {
      return String(stp.applyForStpAdequacyCertificate) === "true" || stp.applyForStpAdequacyCertificate === true;
    }
    if (add?.hasAdequacyCertificate !== undefined) {
      return String(add.hasAdequacyCertificate) === "true" || add.hasAdequacyCertificate === true;
    }
    if (add?.hasStpAdequacyCertificate !== undefined) {
      return String(add.hasStpAdequacyCertificate) === "true" || add.hasStpAdequacyCertificate === true;
    }
    if (add?.hasSewerTreatmentPlantAdequacyCertificate !== undefined) {
      return String(add.hasSewerTreatmentPlantAdequacyCertificate) === "true" || add.hasSewerTreatmentPlantAdequacyCertificate === true;
    }
    if (add?.applyForAdequacyCertificate !== undefined) {
      return String(add.applyForAdequacyCertificate) === "true" || add.applyForAdequacyCertificate === true;
    }
    if (add?.applyForStpAdequacyCertificate !== undefined) {
      return String(add.applyForStpAdequacyCertificate) === "true" || add.applyForStpAdequacyCertificate === true;
    }
    return false; // By default No
  };

  const { control, watch, setValue } = useForm({
    defaultValues: {
      hasCertificate: getInitialValue(),
      hasAdequacyCertificate: getInitialAdequacyValue(),
    },
  });

  const formValue = watch();
  const onSelectRef = useRef(onSelect);
  const goNext = () =>
    onSelect(config?.key || "sewerTreatmentPlant", {
      hasCertificate: !!formValue.hasCertificate,
      hasStp: !!formValue.hasCertificate,
      isSewerTreatmentPlant: !!formValue.hasCertificate,
      hasAdequacyCertificate: !!formValue.hasCertificate && !!formValue.hasAdequacyCertificate,
      hasStpAdequacyCertificate: !!formValue.hasCertificate && !!formValue.hasAdequacyCertificate,
      hasSewerTreatmentPlantAdequacyCertificate: !!formValue.hasCertificate && !!formValue.hasAdequacyCertificate,
      applyForAdequacyCertificate: !!formValue.hasCertificate && !!formValue.hasAdequacyCertificate,
      applyForStpAdequacyCertificate: !!formValue.hasCertificate && !!formValue.hasAdequacyCertificate,
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
      setValue("hasAdequacyCertificate", getInitialAdequacyValue());
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
      const currentAdequacyVal = formData?.[configKey]?.hasAdequacyCertificate ?? formData?.[configKey]?.hasStpAdequacyCertificate;
      const newVal = !!formValue.hasCertificate;
      const newAdequacyVal = newVal ? !!formValue.hasAdequacyCertificate : false;
      if (currentVal !== newVal || currentAdequacyVal !== newAdequacyVal) {
        onSelectRef.current(configKey, {
          hasCertificate: newVal,
          hasStp: newVal,
          isSewerTreatmentPlant: newVal,
          hasAdequacyCertificate: newAdequacyVal,
          hasStpAdequacyCertificate: newAdequacyVal,
          hasSewerTreatmentPlantAdequacyCertificate: newAdequacyVal,
          applyForAdequacyCertificate: newAdequacyVal,
          applyForStpAdequacyCertificate: newAdequacyVal,
        });
      }
    }
  }, [configKey, formValue.hasCertificate, formValue.hasAdequacyCertificate, userType, formData?.[configKey]?.hasCertificate, formData?.[configKey]?.hasStp, formData?.[configKey]?.hasAdequacyCertificate]);

  const content = (
    <CollapsibleCardPage
      title={
        t("WS_SEWER_TREATMENT_PLANT_INFORMATION") && t("WS_SEWER_TREATMENT_PLANT_INFORMATION") !== "WS_SEWER_TREATMENT_PLANT_INFORMATION"
          ? t("WS_SEWER_TREATMENT_PLANT_INFORMATION")
          : "Sewer Treatment Plant (STP) Information"
      }
      defaultOpen={true}
    >
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <FieldLabelWithTooltip
            label={t("Sewer Treatment Plant (STP)")}
            isMandatory={false}
            infoText={t("Sewer Treatment Plant (STP)")}
            style={{ margin: 0 }}
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
                  onSelect={(e) => {
                    props.onChange(e.code);
                    if (!e.code) {
                      setValue("hasAdequacyCertificate", false);
                    }
                  }}
                  t={t}
                />
              )}
            />
          </div>
        </LabelFieldPair>

        {formValue?.hasCertificate ? (
          <LabelFieldPair>
            <FieldLabelWithTooltip
              label={t("Having STP certificate issued by DPCC?")}
              isMandatory={false}
              infoText={t("Having STP certificate issued by DPCC?")}
              style={{ margin: 0 }}
            />
            <div className="field">
              <Controller
                control={control}
                name="hasAdequacyCertificate"
                render={(props) => (
                  <RadioButtons
                    className="form-field"
                    style={{ display: "flex", gap: "2rem", alignItems: "center" }}
                    name="havingSTPcertificateissuedbyDPCCRadio"
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
        ) : null}
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
