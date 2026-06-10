import React from "react";
import { Controller } from "react-hook-form";
import { CardLabelError, TextInput, CustomTooltip, Label } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const SearchFormFieldsComponents = ({ searchFormState, controlSearchForm }) => {
  const { t } = useTranslation();
  const { errors } = searchFormState;

  return (
    <React.Fragment>
      {/* K NUMBER */}
      <span className="mobile-input">
        <Label className="flex-roww flex-gap-2">
          {t("EKYC_MOBILE_NUMBER") || "Mobile Number"}
          <CustomTooltip message={t("EKYC_MOBILE_NUMBER_MESSAGE")} />
        </Label>

        <Controller
          name="kNumber"
          control={controlSearchForm}
          defaultValue=""
          rules={{
            pattern: {
              value: /^[a-zA-Z0-9-_/]*$/,
              message: t("ERR_INVALID_APPLICATION_NO"),
            },
          }}
          render={({ onChange, value }) => <TextInput value={value || ""} onChange={(e) => onChange(e.target.value)} />}
        />

        {errors?.kNumber && <CardLabelError>{errors.kNumber.message}</CardLabelError>}
      </span>

      {/* K NAME */}
      {/* <span className="mobile-input">
        <Label className="flex-roww flex-gap-2">
          {t("EKYC_K_NAME") || "K Name"}
          <CustomTooltip message={t("EKYC_K_NAME_MESSAGE")} />
        </Label>

        <Controller
          name="kName"
          control={controlSearchForm}
          defaultValue=""
          render={({ onChange, value }) => <TextInput value={value || ""} onChange={(e) => onChange(e.target.value)} />}
        />

        {errors?.kName && <CardLabelError>{errors.kName.message}</CardLabelError>}
      </span> */}
    </React.Fragment>
  );
};

export default SearchFormFieldsComponents;
