import { RadioButtons, LabelFieldPair, CardLabel, CollapsibleCardPage, FormStep } from "@djb25/digit-ui-react-components";
import React, { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

const WSRainWaterHarvesting = ({ config, onSelect, userType, formData }) => {
  const { t } = useTranslation();

  const getInitialValue = () => {
    const configKey = config?.key || "rainWaterHarvesting";
    const rwh = formData?.[configKey];
    const add = formData?.additionalDetails;
    if (rwh?.hasCertificate !== undefined) {
      return String(rwh.hasCertificate) === "true" || rwh.hasCertificate === true;
    }
    if (rwh?.isRainwaterHarvesting !== undefined) {
      return String(rwh.isRainwaterHarvesting) === "true" || rwh.isRainwaterHarvesting === true;
    }
    if (add?.hasRainWaterHarvestingCertificate !== undefined) {
      return String(add.hasRainWaterHarvestingCertificate) === "true" || add.hasRainWaterHarvestingCertificate === true;
    }
    if (add?.isRainwaterHarvesting !== undefined) {
      return String(add.isRainwaterHarvesting) === "true" || add.isRainwaterHarvesting === true;
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
    onSelect(config?.key || "rainWaterHarvesting", {
      hasCertificate: !!formValue.hasCertificate,
      isRainwaterHarvesting: !!formValue.hasCertificate,
    });
  const onSkip = () => onSelect();

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const configKey = config?.key || "rainWaterHarvesting";
  const hasData = !!(formData?.[configKey] !== undefined || formData?.additionalDetails?.hasRainWaterHarvestingCertificate !== undefined);
  const isInitializedRef = useRef(hasData);

  useEffect(() => {
    if (!isInitializedRef.current && (formData?.[configKey] !== undefined || formData?.additionalDetails?.hasRainWaterHarvestingCertificate !== undefined)) {
      setValue("hasCertificate", getInitialValue());
      isInitializedRef.current = true;
    }
  }, [formData?.[configKey], formData?.additionalDetails]);

  useEffect(() => {
    const isEmployeeMode =
      userType === "employee" ||
      window.location.href.includes("edit-application") ||
      window.location.href.includes("modify-connection") ||
      window.location.href.includes("old-application");

    if (isEmployeeMode) {
      const currentVal = formData?.[configKey]?.hasCertificate;
      const newVal = !!formValue.hasCertificate;
      if (currentVal !== newVal) {
        onSelectRef.current(configKey, {
          hasCertificate: newVal,
          isRainwaterHarvesting: newVal,
        });
      }
    }
  }, [configKey, formValue.hasCertificate, userType, formData?.[configKey]?.hasCertificate]);

  const content = (
    <CollapsibleCardPage title={t("Rain Water Harvesting Certificate")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <CardLabel>{t("Rain Water Harvesting Certificate")}</CardLabel>
          <div className="field">
            <Controller
              control={control}
              name="hasCertificate"
              render={(props) => (
                <RadioButtons
                  className="form-field"
                  style={{ display: "flex", gap: "2rem", alignItems: "center" }}
                  name="hasRainWaterHarvestingCertificateRadio"
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

export default WSRainWaterHarvesting;
