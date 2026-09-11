import { CheckBox, CollapsibleCardPage, FormStep } from "@djb25/digit-ui-react-components";
import React, { useEffect } from "react";
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
  const goNext = () => onSelect(config.key, { isDivyangjan: !!formValue.isDivyangjan });
  const onSkip = () => onSelect();

  useEffect(() => {
    if (userType === "employee") {
      onSelect(config.key, { isDivyangjan: !!formValue.isDivyangjan });
    }
  }, [config.key, formValue.isDivyangjan, onSelect, userType]);
  const content = (
    <CollapsibleCardPage title="Divyangjan/Person with Disability?" defaultOpen={true}>
      <div style={{ width: "max-content" }}>
        <Controller
          control={control}
          name="isDivyangjan"
          render={(props) => (
            <CheckBox
              label="Divyangjan/Person with Disability?"
              checked={!!props.value}
              onChange={(event) => props.onChange(event.target.checked)}
            />
          )}
        />
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
