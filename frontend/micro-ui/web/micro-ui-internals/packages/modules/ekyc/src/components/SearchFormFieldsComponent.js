import React from "react";
import { Controller } from "react-hook-form";
import { CardLabelError, TextInput, CustomTooltip, Label } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const SearchFormFieldsComponents = ({ searchFormState, controlSearchForm }) => {
  const { t } = useTranslation();
  const { errors } = searchFormState;

  return (
    <React.Fragment>
      {/* MOBILE NUMBER */}
      <span className="mobile-input">
        <Label className="flex-roww flex-gap-2">
          {t("EKYC_K.NUMBER") || "K Number"}
          <CustomTooltip message={t("EKYC_MOBILE_NUMBER_MESSAGE")} />
        </Label>

        <Controller
          name="kNumber"
          control={controlSearchForm}
          defaultValue=""
          rules={{
            pattern: {
              value: /^[0-9]{10}$/,
              message: t("ERR_INVALID_KNO"),
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
