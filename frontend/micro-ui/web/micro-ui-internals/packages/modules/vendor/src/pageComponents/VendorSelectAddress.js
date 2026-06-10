import React, { useEffect, useState } from "react";
import { FormStep, CardLabel, Dropdown, LabelFieldPair, RadioOrSelect } from "@djb25/digit-ui-react-components";
// import Timeline from "../components/TLTimelineInFSM";

const VendorSelectAddress = ({ t, config, onSelect, userType, formData }) => {
  const allCities = Digit.Hooks.vendor.useTenants();
  let tenantId = Digit.ULBService.getCurrentTenantId();

  const { pincode, city } = formData?.address || "";
  const cities =
    userType === "employee"
      ? allCities.filter((city) => city.code === tenantId)
      : pincode
      ? allCities.filter((city) => city?.pincode?.some((pin) => pin == pincode))
      : allCities;
  let property = sessionStorage?.getItem("Digit_FSM_PT");
  if (property !== "undefined") {
    property = JSON.parse(sessionStorage?.getItem("Digit_FSM_PT"));
  }
  let cityDetail = {};
  if (property) {
    cityDetail = cities.filter((city) => {
      return city.code == property?.propertyDetails?.address?.tenantId;
    });
  }
  const [selectedCity, setSelectedCity] = useState(() => formData?.address?.city || cityDetail?.[0] || null);
  const { data: fetchedLocalities } = Digit.Hooks.useBoundaryLocalities(
    selectedCity?.code,
    "revenue",
    {
      enabled: !!selectedCity,
    },
    t
  );

  const { data: fetchedWards } = Digit.Hooks.useBoundaryLocalities(
    selectedCity?.code,
    "admin",
    {
      enabled: !!selectedCity,
    },
    t
  );

  const [localities, setLocalities] = useState();
  const [selectedLocality, setSelectedLocality] = useState(
    () => property?.propertyDetails?.address?.locality || formData?.cpt?.details?.address?.locality || formData?.address?.locality
  );

  const [wards, setWards] = useState();
  const [selectedWard, setSelectedWard] = useState(() => formData?.address?.ward);

  useEffect(() => {
    if (cities) {
      if (cities.length === 1) {
        setSelectedCity(cities[0]);
      }
    }
  }, [cities]);

  useEffect(() => {
    if (selectedCity && fetchedLocalities) {
      let __localityList = fetchedLocalities;
      let filteredLocalityList = [];
      if (formData?.address?.locality) {
        setSelectedLocality(formData.address.locality);
      } else if (formData?.cpt?.details?.address?.locality) {
        setSelectedLocality(formData.cpt.details.address.locality);
      } else if (property?.propertyDetails?.address?.locality) {
        setSelectedLocality(property?.propertyDetails?.address?.locality);
      }

      if (formData?.address?.pincode) {
        filteredLocalityList = __localityList.filter((obj) => obj.pincode?.find((item) => item == formData.address.pincode));
        if (!formData?.address?.locality) setSelectedLocality();
      }

      if (userType === "employee") {
        onSelect(config.key, { ...formData[config.key], city: selectedCity });
      }
      setLocalities(() => (filteredLocalityList.length > 0 ? filteredLocalityList : __localityList));
      if (filteredLocalityList.length === 1) {
        setSelectedLocality(filteredLocalityList[0]);
        if (userType === "employee") {
          onSelect(config.key, { ...formData[config.key], locality: filteredLocalityList[0] });
        }
      }
    }
  }, [selectedCity, formData?.cpt?.details?.address, fetchedLocalities]);

  useEffect(() => {
    if (selectedCity && fetchedWards) {
      if (formData?.address?.ward) {
        setSelectedWard(formData.address.ward);
      }
      setWards(fetchedWards);
    }
  }, [selectedCity, fetchedWards]);

  function selectCity(city) {
    setSelectedLocality(null);
    setLocalities(null);
    setSelectedWard(null);
    setWards(null);
    Digit.SessionStorage.set("fsm.file.address.city", city);
    setSelectedCity(city);
  }

  function selectLocality(selectedLocality) {
    setSelectedLocality(selectedLocality);
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], locality: selectedLocality, ward: selectedWard });
    }
  }

  function selectWard(ward) {
    setSelectedWard(ward);
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], ward: ward, locality: selectedLocality });
    }
  }

  function onSubmit() {
    onSelect(config.key, { city: selectedCity, locality: selectedLocality, ward: selectedWard });
  }

  if (userType === "employee") {
    return (
      <React.Fragment>
        <LabelFieldPair>
          <CardLabel>
            {t("MYCITY_CODE_LABEL")}
            {config.isMandatory ? " * " : null}
          </CardLabel>
          <Dropdown
            className=""
            isMandatory
            selected={cities?.length === 1 ? cities[0] : selectedCity}
            disable={cities?.length === 1}
            option={cities}
            select={selectCity}
            optionKey="code"
            t={t}
          />
        </LabelFieldPair>
        <LabelFieldPair>
          <CardLabel>
            {t("ES_NEW_APPLICATION_LOCATION_WARD")}
            {config.isMandatory ? " * " : null}
          </CardLabel>
          <Dropdown className="" isMandatory selected={selectedWard} option={wards} select={selectWard} optionKey="name" t={t} />
        </LabelFieldPair>
        <LabelFieldPair>
          <CardLabel>
            {t("ES_NEW_APPLICATION_LOCATION_MOHALLA")}
            {config.isMandatory ? " * " : null}
          </CardLabel>
          <Dropdown className="" isMandatory selected={selectedLocality} option={localities} select={selectLocality} optionKey="name" t={t} />
        </LabelFieldPair>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {/* <Timeline currentStep={1} flow="APPLY" /> */}
      <FormStep config={config} onSelect={onSubmit} t={t} isDisabled={selectedLocality && selectedWard ? false : true}>
        <CardLabel>{`${t("MYCITY_CODE_LABEL")} *`}</CardLabel>
        <RadioOrSelect options={cities} selectedOption={selectedCity} optionKey="i18nKey" onSelect={selectCity} t={t} />
        {selectedCity && wards && <CardLabel>{`${t("ES_NEW_APPLICATION_LOCATION_WARD")} *`}</CardLabel>}
        {selectedCity && wards && (
          <RadioOrSelect
            isMandatory={config.isMandatory}
            options={wards}
            selectedOption={selectedWard}
            optionKey="name"
            onSelect={selectWard}
            t={t}
          />
        )}
        {selectedCity && localities && <CardLabel>{`${t("CS_CREATECOMPLAINT_MOHALLA")} *`}</CardLabel>}
        {selectedCity && localities && (
          <RadioOrSelect
            isMandatory={config.isMandatory}
            options={localities}
            selectedOption={selectedLocality}
            optionKey="name"
            onSelect={selectLocality}
            t={t}
          />
        )}
      </FormStep>
    </React.Fragment>
  );
};

export default VendorSelectAddress;
