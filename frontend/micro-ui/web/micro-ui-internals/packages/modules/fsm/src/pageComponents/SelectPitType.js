import React, { useState, useEffect } from "react";
import { FormStep, Dropdown, Loader, CardLabel, LabelFieldPair, RadioButtons, RadioOrSelect } from "@djb25/digit-ui-react-components";
import Timeline from "../components/TLTimelineInFSM";

const SelectPitType = ({ t, formData, config, onSelect, userType, isInline }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateId = Digit.ULBService.getStateId();

  const [pitType, setPitType] = useState(formData?.pitType);
  const { data: sanitationMenu, isLoading } = Digit.Hooks.fsm.useMDMS(stateId, "FSM", "PitType");

  const selectPitType = (value) => {
    setPitType(value);
    if (userType === "employee") {
      onSelect(config.key, value);
      onSelect("pitDetail", null);
    }
  };

  const onSkip = () => {
    onSelect();
  };

  const onSubmit = () => {
    onSelect(config.key, pitType);
  };

  if (isLoading) {
    return <Loader />;
  }
  if (userType === "employee") {
    const dropdown = (
      <Dropdown
        isMandatory={true}
        option={sanitationMenu?.sort((a, b) => a.name.localeCompare(b.name))}
        optionKey="i18nKey"
        select={selectPitType}
        selected={pitType}
        t={t}
      />
    );
    if (!isInline && config?.label) {
      return (
        <LabelFieldPair>
          <CardLabel className="card-label-smaller">
            {t(config.label)}
            {config.isMandatory ? <span className="check-page-link-button"> * </span> : null}
          </CardLabel>
          <div className="field">{dropdown}</div>
        </LabelFieldPair>
      );
    }
    return dropdown;
  }
  return (
    <React.Fragment>
      <Timeline currentStep={1} flow="APPLY" />
      <FormStep config={config} onSelect={onSubmit} onSkip={onSkip} isDisabled={!pitType} t={t}>
        <CardLabel>{t("CS_FILE_APPLICATION_PIT_TYPE_LABEL")}</CardLabel>
        <RadioOrSelect
          isMandatory={config.isMandatory}
          options={sanitationMenu?.sort((a, b) => a.name.localeCompare(b.name))}
          selectedOption={pitType}
          optionKey="i18nKey"
          onSelect={selectPitType}
          t={t}
        />
      </FormStep>
    </React.Fragment>
  );
};

export default SelectPitType;
