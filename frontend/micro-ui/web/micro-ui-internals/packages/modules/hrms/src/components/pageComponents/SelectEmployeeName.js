import React from "react";
import { LabelFieldPair, CardLabel, TextInput, CardLabelError, Tooltip } from "@djb25/digit-ui-react-components";
// import { useLocation } from "react-router-dom";

const SelectEmployeeName = ({ t, config, onSelect, formData = {}, userType, register, errors }) => {
  // const { pathname: url } = useLocation();
  const inputs = [
    {
      label: "HR_EMP_NAME_LABEL",
      type: "text",
      name: "employeeName",
      validation: {
        isRequired: true,
        pattern: Digit.Utils.getPattern("Name").source,
        title: t("CORE_COMMON_APPLICANT_NAME_INVALID"),
      },
      isMandatory: true,
    },
  ];

  function setValue(value, input) {
    onSelect(config.key, { ...formData[config.key], [input]: value });
  }

  return (
    <div>
      {inputs?.map((input, index) => {
        let currentValue = formData && formData[config.key] && formData[config.key][input.name] || '';
        return (<React.Fragment key={index}>
          {errors[input.name] && <CardLabelError>{t(input.error)}</CardLabelError>}
          <LabelFieldPair>
            <CardLabel className="card-label-smaller">
              <Tooltip
                label={t(input.label)}
                isMandatory={input.isMandatory}
              />
            </CardLabel>
            <div className="field">
              <TextInput
                key={input.name}
                value={(formData && formData[config.key] && formData[config.key][input.name]) || ""}
                onChange={(e) => setValue(e.target.value, input.name)}
                disable={false}
                defaultValue={""}
                {...input.validation}
              />
              {currentValue && currentValue.length > 0 && !currentValue.match(Digit.Utils.getPattern('Name')) && <CardLabelError style={{ width: "100%", fontSize: '16px' }}>{t("CORE_COMMON_APPLICANT_NAME_INVALID")}</CardLabelError>}
            </div>
          </LabelFieldPair>
        </React.Fragment>
        )
      })}
    </div>
  );
};

export default SelectEmployeeName;
