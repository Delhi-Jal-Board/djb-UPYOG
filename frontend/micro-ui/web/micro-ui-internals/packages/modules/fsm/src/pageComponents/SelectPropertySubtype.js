import React, { useState, useEffect } from "react";
import { Loader, Dropdown, FormStep, CardLabel, LabelFieldPair, RadioOrSelect } from "@djb25/digit-ui-react-components";
import Timeline from "../components/TLTimelineInFSM";
import { useLocation } from "react-router-dom";

const SelectPropertySubtype = ({ config, onSelect, t, userType, formData, isInline }) => {
  const { pathname: url } = useLocation();
  let property = null;
  try {
    const rawProperty = sessionStorage?.getItem("Digit_FSM_PT");
    property = rawProperty && rawProperty !== "undefined" ? JSON.parse(rawProperty) : null;
  } catch (e) {
    property = null;
  }
  const select = (items) => items.map((item) => ({ ...item, i18nKey: t(item.i18nKey) }));
  const stateId = Digit.ULBService.getStateId();
  const { isLoading: propertySubtypesDataLoading, data: propertySubtypesData } = Digit.Hooks.fsm.useMDMS(stateId, "FSM", "PropertySubtype", {
    select,
  });

  const [subtype, setSubtype] = useState();

  const [subtypeOptions, setSubtypeOptions] = useState([]);
  const rawPropertyType = property?.propertyDetails?.usageCategory || property?.usageCategory || formData?.propertyType;
  const propertyType = typeof rawPropertyType === "string" ? rawPropertyType.split(".")[0] : rawPropertyType;

  useEffect(() => {
    if (!propertySubtypesDataLoading && propertySubtypesData) {
      const preFillSubtype = propertySubtypesData?.filter((subType) => subType.code === (formData?.subtype?.code || formData?.subtype))[0];
      if (
        (typeof propertyType === "string" && preFillSubtype?.code.split(".")[0] === propertyType) ||
        preFillSubtype?.code.split(".")[0] === propertyType?.code
      ) {
        setSubtype(preFillSubtype);
      } else {
        setSubtype(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyType, formData?.subtype, propertySubtypesData]);

  useEffect(() => {
    console.log("propertyType2222", propertyType);
    if (!propertySubtypesDataLoading && propertyType) {
      const subTypes = propertySubtypesData.filter((item) => item.propertyType === (propertyType?.code || propertyType));
      setSubtypeOptions(subTypes);
    }
  }, [propertyType, propertySubtypesDataLoading, propertySubtypesData]);

  const selectedValue = (value) => {
    setSubtype(value);
  };

  const goNext = () => {
    sessionStorage.removeItem("Digit.total_amount");
    onSelect(config.key, subtype);
  };

  function selectedSubType(value) {
    setSubtype(value);
    onSelect(config.key, value.code);
  }

  if (propertySubtypesDataLoading) {
    return <Loader />;
  }

  // const subtypeOptions = useMemo(() => {
  //   return propertySubtypesData.filter((item) => item.propertyType === (propertyType?.code || propertyType));
  // }, [propertyType])

  if (userType === "employee") {
    const sortedSubtypes = [...(subtypeOptions || [])].sort((a, b) =>
      (a?.name || a?.i18nKey || a?.code || "").localeCompare(b?.name || b?.i18nKey || b?.code || "")
    );
    const dropdown = (
      <Dropdown
        option={sortedSubtypes}
        optionKey="i18nKey"
        id="propertySubType"
        selected={subtype}
        select={selectedSubType}
        t={t}
        disable={!(url.includes("/modify-application/") || url.includes("/new-application"))}
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
  } else {
    return (
      <React.Fragment>
        <Timeline currentStep={1} flow="APPLY" />
        <FormStep config={config} onSelect={goNext} isDisabled={!subtype} t={t}>
          <CardLabel>{`${t("CS_FILE_APPLICATION_PROPERTY_SUBTYPE_LABEL")} *`}</CardLabel>
          <RadioOrSelect
            options={subtypeOptions?.sort((a, b) => a.name.localeCompare(b.name))}
            selectedOption={subtype}
            optionKey="i18nKey"
            onSelect={selectedValue}
            t={t}
          />
        </FormStep>
      </React.Fragment>
    );
  }
};

export default SelectPropertySubtype;
