import { CheckBox, LabelFieldPair, CardLabel, CollapsibleCardPage, FormStep } from "@djb25/digit-ui-react-components";
import React, { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

const WSRainWaterHarvesting = ({ config, onSelect, userType, formData }) => {
  const { t } = useTranslation();
  const { control, watch } = useForm({
    defaultValues: {
      hasCertificate: !!(
        formData?.rainWaterHarvesting?.hasCertificate ||
        formData?.rainWaterHarvesting?.isRainwaterHarvesting ||
        formData?.additionalDetails?.hasRainWaterHarvestingCertificate ||
        formData?.additionalDetails?.isRainwaterHarvesting
      ),
    },
  });

  const formValue = watch();
  const onSelectRef = useRef(onSelect);
  const goNext = () =>
    onSelect(config.key, {
      hasCertificate: !!formValue.hasCertificate,
      isRainwaterHarvesting: !!formValue.hasCertificate,
    });
  const onSkip = () => onSelect();

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (userType === "employee") {
      const currentVal = formData?.[config.key]?.hasCertificate;
      const newVal = !!formValue.hasCertificate;
      if (currentVal !== newVal) {
        onSelectRef.current(config.key, {
          hasCertificate: newVal,
          isRainwaterHarvesting: newVal,
        });
      }
    }
  }, [config.key, formValue.hasCertificate, userType, formData?.[config.key]?.hasCertificate]);

  const content = (
    <CollapsibleCardPage title={t("Rain Water Harvesting Certificate")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <div className="field">
            <Controller
              control={control}
              name="hasCertificate"
              render={(props) => (
                <CheckBox label={t("Rain Water Harvesting Certificate")} checked={!!props.value} onChange={(e) => props.onChange(e.target.checked)} />
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
