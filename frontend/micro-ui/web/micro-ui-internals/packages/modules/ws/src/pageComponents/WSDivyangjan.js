import { RadioButtons, LabelFieldPair, CardLabel, CollapsibleCardPage, FormStep } from "@djb25/digit-ui-react-components";
import React, { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

const WSDivyangjan = ({ config, onSelect, userType, formData }) => {
  const { t } = useTranslation();
  const { control, watch } = useForm({
    defaultValues: {
      isDivyangjan: !!(formData?.disability?.isDivyangjan || formData?.additionalDetails?.isDivyangjan),
    },
  });

  const formValue = watch();
  const onSelectRef = useRef(onSelect);
  const goNext = () => onSelect(config.key, { isDivyangjan: !!formValue.isDivyangjan });
  const onSkip = () => onSelect();

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (userType === "employee") {
      onSelectRef.current(config.key, { isDivyangjan: !!formValue.isDivyangjan });
    }
  }, [config.key, formValue.isDivyangjan, userType]);
  const content = (
    <CollapsibleCardPage title={t("Are you a Divyangjan/Person with Disability?")} defaultOpen={true}>
      <div className="formcomposer-section-grid">
        <LabelFieldPair>
          <CardLabel>{t("Are you a Divyangjan/Person with Disability?")}</CardLabel>
          <div className="field">
            <Controller
              control={control}
              name="isDivyangjan"
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

export default WSDivyangjan;
