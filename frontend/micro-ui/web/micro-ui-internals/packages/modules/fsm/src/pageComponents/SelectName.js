import React, { useEffect, useState } from "react";
import { LabelFieldPair, CardLabel, TextInput, CardLabelError, Dropdown } from "@djb25/digit-ui-react-components";
import { useLocation } from "react-router-dom";

const SelectName = ({ t, config, onSelect, formData = {}, userType, register, errors }) => {
    const stateId = Digit.ULBService.getStateId();
  const { data: GenderData, isLoading } = Digit.Hooks.fsm.useMDMS(stateId, "common-masters", "FSMGenderType");
  const { pathname: url } = useLocation();
  const editScreen = url.includes("/modify-application/");
  const [genderTypes, setGenderTypes] = useState([]);

  const defaultGenderOptions = [
    { code: "MALE", name: "Male", i18nKey: "COMMON_GENDER_MALE" },
    { code: "FEMALE", name: "Female", i18nKey: "COMMON_GENDER_FEMALE" },
    { code: "TRANSGENDER", name: "Transgender", i18nKey: "COMMON_GENDER_TRANSGENDER" },
  ];

  useEffect(() => {
    if (!isLoading && GenderData && GenderData.length > 0) {
      setGenderTypes(GenderData);
    } else {
      setGenderTypes(defaultGenderOptions);
    }
  }, [GenderData, isLoading]);

  const inputs = [
        {
      label: "ES_NEW_APPLICATION_APPLICANT_NAME",
      type: "text",
      name: "applicantName",
      validation: {
        isRequired: true,
        pattern: "^[a-zA-Z]+( [a-zA-Z]+)*$",
        title: t("CORE_COMMON_APPLICANT_NAME_INVALID"),
      },
      isMandatory: true,
    },
    {
      label: "ES_NEW_APPLICATION_APPLICANT_MOBILE_NO",
      type: "text",
      name: "mobileNumber",
      validation: {
        isRequired: true,
        pattern: "[6-9]{1}[0-9]{9}",
        type: "tel",
        title: t("CORE_COMMON_APPLICANT_MOBILE_NUMBER_INVALID"),
      },
      componentInFront: <div className="employee-card-input employee-card-input--front">+91</div>,
      isMandatory: true,
    },
    {
      label: "ES_NEW_APPLICATION_GENDER",
      type: "dropdown",
      name: "applicantGender",
      options: genderTypes.length > 0 ? genderTypes : defaultGenderOptions,
      isMandatory: false,
    },
  ];

  const setValue = (value, input) => {
    onSelect(config.key, { ...formData[config.key], [input]: value });
  };

  const selectDropdown = (value) => {
    onSelect(config.key, { ...formData[config.key], applicantGender: value.code });
  };

  const visibleInputs = config?.fields?.length
    ? inputs.filter((input) => config.fields.includes(input.name))
    : inputs;

  const renderInput = (input, index) => (
    <div key={index} style={{ width: "100%" }}>
      {input.type === "text" && (
        <React.Fragment>
          {errors[input.name] && <CardLabelError>{t(input.error)}</CardLabelError>}
          <LabelFieldPair>
            <CardLabel className="card-label-smaller">
              {t(input.label)}
              {input.isMandatory ? <span className="check-page-link-button"> * </span> : null}
            </CardLabel>
            <div className="field" style={{ display: "flex", width: "100%" }}>
              {input.componentInFront ? input.componentInFront : null}
              <TextInput
                key={input.name}
                value={formData && formData[config.key] ? formData[config.key][input.name] : null}
                onChange={(e) => setValue(e.target.value, input.name)}
                disable={editScreen}
                {...input.validation}
              />
            </div>
          </LabelFieldPair>
        </React.Fragment>
      )}
      {input.type === "dropdown" && (
        <LabelFieldPair>
          <CardLabel className="card-label-smaller">
            {t(input.label)}
            {input.isMandatory ? <span className="check-page-link-button"> * </span> : null}
          </CardLabel>
          <div className="field" style={{ width: "100%" }}>
            <Dropdown
              option={[...(input.options || [])].sort((a, b) => (a?.code || "").localeCompare(b?.code || ""))}
              optionKey="i18nKey"
              id="dropdown"
              selected={formData && formData[config.key] ? input.options.find((data) => data.code === formData[config.key][input.name]) : null}
              select={selectDropdown}
              t={t}
              disable={editScreen}
            />
          </div>
        </LabelFieldPair>
      )}
    </div>
  );

  if (config?.fields?.length === 1) {
    return renderInput(visibleInputs[0], 0);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", width: "100%" }}>
      {visibleInputs?.map((input, index) => renderInput(input, index))}
    </div>
  );
};

export default SelectName;
