import { RadioButtons, LabelFieldPair, CardLabel, CollapsibleCardPage, FormStep, FieldLabelWithTooltip } from "@djb25/digit-ui-react-components";
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

  const getInitialAdequacyValue = () => {
    const configKey = config?.key || "rainWaterHarvesting";
    const rwh = formData?.[configKey];
    const add = formData?.additionalDetails;
    if (rwh?.hasAdequacyCertificate !== undefined) {
      return String(rwh.hasAdequacyCertificate) === "true" || rwh.hasAdequacyCertificate === true;
    }
    if (rwh?.hasRainWaterHarvestingAdequacyCertificate !== undefined) {
      return String(rwh.hasRainWaterHarvestingAdequacyCertificate) === "true" || rwh.hasRainWaterHarvestingAdequacyCertificate === true;
    }
    if (rwh?.applyForAdequacyCertificate !== undefined) {
      return String(rwh.applyForAdequacyCertificate) === "true" || rwh.applyForAdequacyCertificate === true;
    }
    if (add?.hasAdequacyCertificate !== undefined) {
      return String(add.hasAdequacyCertificate) === "true" || add.hasAdequacyCertificate === true;
    }
    if (add?.hasRainWaterHarvestingAdequacyCertificate !== undefined) {
      return String(add.hasRainWaterHarvestingAdequacyCertificate) === "true" || add.hasRainWaterHarvestingAdequacyCertificate === true;
    }
    if (add?.applyForAdequacyCertificate !== undefined) {
      return String(add.applyForAdequacyCertificate) === "true" || add.applyForAdequacyCertificate === true;
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
    onSelect(config?.key || "rainWaterHarvesting", {
      hasCertificate: !!formValue.hasCertificate,
      isRainwaterHarvesting: !!formValue.hasCertificate,
      hasAdequacyCertificate: !!formValue.hasCertificate && !!formValue.hasAdequacyCertificate,
      hasRainWaterHarvestingAdequacyCertificate: !!formValue.hasCertificate && !!formValue.hasAdequacyCertificate,
      applyForAdequacyCertificate: !!formValue.hasCertificate && !!formValue.hasAdequacyCertificate,
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
      setValue("hasAdequacyCertificate", getInitialAdequacyValue());
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
      const currentAdequacyVal = formData?.[configKey]?.hasAdequacyCertificate;
      const newVal = !!formValue.hasCertificate;
      const newAdequacyVal = newVal ? !!formValue.hasAdequacyCertificate : false;
      if (currentVal !== newVal || currentAdequacyVal !== newAdequacyVal) {
        onSelectRef.current(configKey, {
          hasCertificate: newVal,
          isRainwaterHarvesting: newVal,
          hasAdequacyCertificate: newAdequacyVal,
          hasRainWaterHarvestingAdequacyCertificate: newAdequacyVal,
          applyForAdequacyCertificate: newAdequacyVal,
        });
      }
    }
  }, [configKey, formValue.hasCertificate, formValue.hasAdequacyCertificate, userType, formData?.[configKey]?.hasCertificate, formData?.[configKey]?.hasAdequacyCertificate]);

  const content = (
    <CollapsibleCardPage
      title={
        t("WS_RAIN_WATER_HARVESTING_INFORMATION") && t("WS_RAIN_WATER_HARVESTING_INFORMATION") !== "WS_RAIN_WATER_HARVESTING_INFORMATION"
          ? t("WS_RAIN_WATER_HARVESTING_INFORMATION")
          : "Rain Water Harvesting Information"
      }
      defaultOpen={true}
    >
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <FieldLabelWithTooltip
            label={t("Rain Water Harvesting Certificate")}
            isMandatory={false}
            infoText={t("Rain Water Harvesting Certificate")}
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
                  name="hasRainWaterHarvestingCertificateRadio"
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
              label={t("Having Rain water harvesting Adequacy certificate?")}
              isMandatory={false}
              infoText={t("Having Rain water harvesting Adequacy certificate?")}
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
                    name="hasRainWaterHarvestingAdequacyCertificateRadio"
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

export default WSRainWaterHarvesting;