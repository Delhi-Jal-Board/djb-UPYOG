import React, { useState } from "react";
import { LabelFieldPair, CardLabel, TextInput, CardLabelError, Tooltip } from "@djb25/digit-ui-react-components";

const SelectEmployeePhoneNumber = ({ t, config, onSelect, formData = {}, userType, register, errors }) => {
  const [iserror, setError] = useState(false);
  let isMobile = window.Digit.Utils.browser.isMobile();
  const inputs = [
    {
      label: t("HR_MOB_NO_LABEL"),
      isMandatory: true,
      type: "text",
      name: "mobileNumber",
      populators: {
        validation: {
          required: true,
          pattern: /^[6-9]\d{9}$/,
        },
        componentInFront: <div className="employee-card-input employee-card-input--front">+91</div>,
        error: t("CORE_COMMON_MOBILE_ERROR"),
      },
    },
  ];

  function setValue(value, input) {
    onSelect(config.key, { ...formData[config.key], [input]: value });
  }
  function validate(value, input) {
    setError(!input.populators.validation.pattern.test(value));
  }

  return (
    <div>
      {inputs?.map((input, index) => (
        <React.Fragment key={index}>
          <LabelFieldPair>
            <CardLabel className="card-label-smaller" style={{ display: "flex", alignItems: "center" }}>
              <Tooltip
                message={t("HR_MOBILE_NO_CHECK")}
                label={t(input.label)}
                isMandatory={input.isMandatory}
              />
            </CardLabel>
            <div className="field-container" style={{ width: isMobile ? "100%" : "", display: "block" }}>
              <div>
                <div className="phone-input-wrapper">
                  <div className="employee-card-input employee-card-input--front phone-country-code" style={{ borderRadius: "6px 0 0 6px" }}>
                    +91
                  </div>
                  <TextInput
                    className="field desktop-w-full"
                    key={input.name}
                    value={(formData && formData[config.key] && formData[config.key][input.name]) || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setValue(value, input.name);
                      validate(value, input);
                    }}
                    disable={false}
                    defaultValue={""}
                    maxlength={10}
                    onBlur={(e) => validate(e.target.value, input)}
                    {...input.validation}
                    style={{ borderRadius: "0 6px 6px 0", marginBottom: "10px" }}
                  />
                </div>
                <div>
                  {iserror && (
                    <CardLabelError style={{ width: "100%" }}>{t(input.populators.error)}</CardLabelError>
                  )}
                </div>
              </div>
            </div>
          </LabelFieldPair>
        </React.Fragment>
      ))}
    </div>
  );
};

export default SelectEmployeePhoneNumber;
