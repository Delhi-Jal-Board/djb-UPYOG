import React, { useEffect, useState } from "react";
import { CitizenInfoLabel, Loader, Dropdown, FormStep, CardLabel, LabelFieldPair, RadioOrSelect } from "@djb25/digit-ui-react-components";
import Timeline from "../components/TLTimelineInFSM";
import { useLocation } from "react-router-dom";

const SelectPropertyType = ({ config, onSelect, t, userType, formData, isInline }) => {
  const { pathname: url } = useLocation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateId = Digit.ULBService.getStateId();
  const select = (items) => items.map((item) => ({ ...item, i18nKey: t(item.i18nKey) }));

  const propertyTypesData = Digit.Hooks.fsm.useMDMS(stateId, "FSM", "PropertyType", { select });

  //const usageType=formData?.cpt!=="undefined"? (formData?.cpt?.details?.usageCategory==="RESIDENTIAL" ? formData?.cpt?.details?.usageCategory: formData?.cpt?.details?.usageCategory.split('.')[1]):""
  //const property = JSON.parse(sessionStorage?.getItem("Digit_FSM_PT")|| "{}")
  let property = null;
  try {
    const rawProperty = sessionStorage?.getItem("Digit_FSM_PT");
    property = rawProperty && rawProperty !== "undefined" ? JSON.parse(rawProperty) : null;
  } catch (e) {
    property = null;
  }
  const rawUsageType = property?.propertyDetails?.usageCategory || property?.usageCategory;
  const usageType = typeof rawUsageType === "string" ? rawUsageType.split(".")[0] : rawUsageType;
  const [propertyType, setPropertyType] = useState(formData?.propertyType || "");
useEffect(()=>{
 if(userType === "employee" && property && propertyTypesData.data)
    {
      
      let propertyType = []
      
      propertyType = propertyTypesData?.data.filter((city) => {
          return city.code == formData?.propertyType
        })
        console.log("SSSSSS",propertyType,propertyTypesData)
        if(propertyType.length >0)
        {
          onSelect(config.key, propertyType[0].code)
          setPropertyType(propertyType[0])
        }
     
    }
    if(property){
      console.log("property",property,propertyTypesData)
      if(property?.propertyDetails?.usageCategory == "COMMERCIAL" || property?.propertyDetails?.usageCategory == 
      "RESIDENTIAL" ||property?.propertyDetails?.usageCategory == "INSTITUTIONAL")
      {
        setPropertyType(usageType)
      }
     
    }
},[propertyTypesData.isLoading])
  useEffect(() => {
    if (!propertyTypesData.isLoading && propertyTypesData.data) {
      const targetCode = usageType || formData?.propertyType?.code || formData?.propertyType;
      if (targetCode) {
        const preFilledPropertyType = propertyTypesData.data.find((pt) => pt.code === targetCode);
        if (preFilledPropertyType !== undefined) {
          setPropertyType(preFilledPropertyType);
        }
      }
    }
  }, [property, usageType, formData?.propertyType, propertyTypesData.data, propertyTypesData.isLoading]);

  const goNext = () => {
    sessionStorage.removeItem("Digit.total_amount");
    onSelect(config.key, propertyType);
  };
  function selectedValue(value) {
    setPropertyType(value);
  }
  function selectedType(value) {
    setPropertyType(value);
    onSelect(config.key, value.code);
  }

  const getInfoContent = () => {
    let content = t("CS_DEFAULT_INFO_TEXT");
    if (formData && formData.selectPaymentPreference && formData.selectPaymentPreference.code === "PRE_PAY") {
      content = t("CS_CHECK_INFO_PAY_NOW");
    } else {
      content = t("CS_CHECK_INFO_PAY_LATER");
    }
    return content;
  };
console.log("propertyType",propertyType)
  if (propertyTypesData.isLoading) {
    return <Loader />;
  }
  if (userType === "employee") {
    const sortedOptions = [...(propertyTypesData.data || [])].sort((a, b) =>
      (a?.name || a?.i18nKey || a?.code || "").localeCompare(b?.name || b?.i18nKey || b?.code || "")
    );
    const dropdown = (
      <Dropdown
        option={sortedOptions}
        optionKey="i18nKey"
        id="propertyType"
        selected={propertyType}
        select={selectedType}
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
        <FormStep config={config} onSelect={goNext} isDisabled={!propertyType} t={t}>
          <CardLabel>{`${t("CS_FILE_APPLICATION_PROPERTY_LABEL")} *`}</CardLabel>
          <RadioOrSelect
            options={propertyTypesData.data?.sort((a, b) => a.name.localeCompare(b.name))}
            selectedOption={propertyType}
            optionKey="i18nKey"
            onSelect={selectedValue}
            t={t}
          />
        </FormStep>
        {propertyType && (
          <CitizenInfoLabel
            info={t("CS_FILE_APPLICATION_INFO_LABEL")}
            text={t("CS_FILE_APPLICATION_INFO_TEXT", { content: t("CS_DEFAULT_INFO_TEXT"), ...propertyType })}
          />
        )}
      </React.Fragment>
    );
  }
};

export default SelectPropertyType;
