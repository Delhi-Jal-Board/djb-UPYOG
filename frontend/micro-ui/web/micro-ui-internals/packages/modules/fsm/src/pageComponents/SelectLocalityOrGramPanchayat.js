import { CardLabel, Dropdown, FormStep, LabelFieldPair, TextInput } from "@djb25/digit-ui-react-components";
import _ from "lodash";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import Timeline from "../components/TLTimelineInFSM";

const SelectLocalityOrGramPanchayat = ({ t, config, onSelect, userType, formData, formState }) => {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const allCities = Digit.Hooks.fsm.useTenants();
  let tenantId = Digit.ULBService.getCurrentTenantId();
  if (userType !== "employee") {
    tenantId = Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code;
  }
  const { data: urcConfig } = Digit.Hooks.fsm.useMDMS(tenantId, "FSM", "UrcConfig");
  const isUrcEnable = urcConfig && urcConfig.length > 0 && urcConfig[0].URCEnable;
  const { pincode, city, propertyLocation } = formData?.address || "";
  const localityNew = window.sessionStorage.getItem("Digit_OBPS_PT");
  let localitySelected = null;
  try {
    localitySelected = localityNew ? JSON.parse(localityNew) : null;
  } catch (err) {
    localitySelected = null;
  }
  const cities =
    userType === "employee"
      ? allCities.filter((city) => city?.code === tenantId)
      : pincode
      ? allCities.filter((city) => city?.pincode?.some((pin) => pin == pincode))
      : allCities;
  const [selectedLocality, setSelectedLocality] = useState(formData?.cpt?.details?.address?.locality||localitySelected?.address?.locality || "");
  const [localities, setLocalities] = useState();
  const [gramPanchayats, setGramPanchayats] = useState();
  const [selectedGp, setSelectedGp] = useState(() =>
    formData?.address?.gramPanchayat ? formData?.address?.gramPanchayat : {}
  );
  const [villages, setVillages] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState(() =>
    formData?.address?.village ? formData?.address?.village : {}
  );
  const [newVillage, setNewVillage] = useState();
  const [newGp, setNewGp] = useState();
  const [newLocality, setNewLocality] = useState();
  const [selectedCity, setSelectedCity] = useState(() => formData?.address?.city || Digit.SessionStorage.get("fsm.file.address.city") || null);
  useEffect(() => {
    if (!isMounted.current) return;
    if (cities) {
      if (cities.length === 1) {
        setSelectedCity(cities[0]);
      }
    }
  }, [cities]);
  var { data: fetchedGramPanchayats } = Digit.Hooks.useBoundaryLocalities(
    selectedCity?.code,
    "gramPanchayats",
    {
      enabled: !!selectedCity,
    },
    t
  );
  var { data: fetchedLocalities } = Digit.Hooks.useBoundaryLocalities(
    selectedCity?.code,
    "revenue",
    {
      enabled: !!selectedCity,
    },
    t
  );
  useEffect(()=>{
    if (!isMounted.current) return;
    if(formData?.cpt?.details?.address?.locality && userType === "employee"){
      setSelectedLocality(formData?.cpt?.details?.address?.locality)
      onSelect(config.key, { ...formData[config.key], locality: formData?.cpt?.details?.address?.locality });
    }
  },[formData?.cpt?.details?.address?.locality])

  useEffect(() => {
    if (!isMounted.current) return;
    if (selectedCity && fetchedLocalities) {
      let __localityList = fetchedLocalities;
      let filteredLocalityList = [];

      if (formData?.address?.locality && formData?.address?.additionalDetails?.boundaryType === "Locality") {
        if (isMounted.current) {
          setSelectedLocality(formData.address.locality);
          setNewLocality(formData?.address?.additionalDetails?.newLocality);
        }
      }

      if (formData?.address?.pincode) {
        filteredLocalityList = __localityList.filter((obj) => obj.pincode?.find((item) => item == formData.address.pincode));
        if (!formData?.address?.locality && isMounted.current) setSelectedLocality();
      }
      if (isMounted.current) {
        setLocalities(() => (filteredLocalityList.length > 0 ? filteredLocalityList : __localityList));

        if (filteredLocalityList.length === 1) {
          setSelectedLocality(filteredLocalityList[0]);
          if (userType === "employee") {
            onSelect(config.key, {
              ...formData[config.key],
              locality: filteredLocalityList[0],
            });
          }
        }
      }
    }
  }, [selectedCity, fetchedLocalities]);

  useEffect(()=>{
    if (!isMounted.current) return;
    if(formData?.address?.gramPanchayat)
    {
      selectGramPanchayat(formData?.address?.gramPanchayat)
    }
  },[fetchedGramPanchayats])

  useEffect(() => {
    if (!isMounted.current) return;
    if (fetchedGramPanchayats) {
      if (fetchedGramPanchayats && fetchedGramPanchayats.length > 0 && isMounted.current) {
        setGramPanchayats(fetchedGramPanchayats);
      }
      if (formData?.address?.additionalDetails?.gramPanchayat?.code) {
        const filteredGramPanchayat = fetchedGramPanchayats.filter(
          (obj) => obj?.code === formData?.address?.additionalDetails?.gramPanchayat?.code
        )[0];
        if (isMounted.current) {
          setSelectedGp(filteredGramPanchayat);
          setNewGp(formData?.address?.additionalDetails?.newGp);
        }
        var villageUnderGp = filteredGramPanchayat?.children?.filter((obj) => obj?.code === formData?.address?.additionalDetails?.village?.code);
        if (villageUnderGp && villageUnderGp.length > 0) {
          villageUnderGp[0].i18nkey = tenantId.replace(".", "_").toUpperCase() + "_REVENUE_" + villageUnderGp[0]?.code;
          if (isMounted.current) {
            setSelectedVillage(villageUnderGp[0]);
            setVillages(villageUnderGp);
          }
        } else {
          if (isMounted.current) {
            setNewVillage(typeof formData?.address?.additionalDetails?.village === "string" ? formData?.address?.additionalDetails?.village : "");
          }
        }
      }
    }
  }, [fetchedGramPanchayats, formData?.address?.additionalDetails?.gramPanchayat?.code]);
  if (userType !== "employee" && propertyLocation?.code === "FROM_GRAM_PANCHAYAT") {
    config.texts.cardText = "CS_FILE_APPLICATION_PROPERTY_LOCATION_GRAM_PANCHAYAT_TEXT";
  }

  function selectLocality(locality) {
    if (isMounted.current) setSelectedLocality(locality);
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], locality: locality });
    }
  }

  function selectGramPanchayat(value) {
    if (isMounted.current) setSelectedGp(value);
    const filteredVillages = fetchedGramPanchayats?.filter((items) => items?.code === value?.code)?.[0]?.children;
    const localitiesWithLocalizationKeys = filteredVillages?.map((obj) => ({
      ...obj,
      i18nkey: tenantId.replace(".", "_").toUpperCase() + "_REVENUE_" + obj?.code,
    }));
    if (localitiesWithLocalizationKeys?.length > 0 && isMounted.current) {
      setVillages(localitiesWithLocalizationKeys);
    }
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], gramPanchayat: value });
    }
    Digit.SessionStorage.del("locationType");
  }

  function selectVillage(value) {
    if (isMounted.current) setSelectedVillage(value);
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], village: value });
    }
  }

  const onChangeVillage = (value) => {
    if (isMounted.current) setNewVillage(value);
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], newVillage: value });
    }
  };
  const onNewGpChange = (value) => {
    if (isMounted.current) setNewGp(value);
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], newGp: value });
    }
  };
  const onNewLocality = (value) => {
    if (isMounted.current) setNewLocality(value);
    if (userType === "employee") {
      onSelect(config.key, { ...formData[config.key], newLocality: value });
    }
  };
  function onSubmit() {
    if (propertyLocation?.code === "FROM_GRAM_PANCHAYAT") {
      onSelect(config.key, {
        gramPanchayat: selectedGp,
        village: selectedVillage,
        newGramPanchayat: newGp,
        newVillage: newVillage,
      });
    } else {
      onSelect(config.key, {
        locality: selectedLocality,
        newLocality: newLocality,
      });
    }
  }
  if (userType === "employee") {
    if (propertyLocation?.code !== "FROM_GRAM_PANCHAYAT" && !isUrcEnable) {
      return null;
    }

    const Wrapper = config?.colSpan === "contents" ? React.Fragment : "div";

    return (
      <Wrapper>
        {propertyLocation?.code === "FROM_GRAM_PANCHAYAT" ? (
          <Wrapper>
            <LabelFieldPair>
              <CardLabel className="card-label-smaller">
                {t("CS_GRAM_PANCHAYAT")}
                {config.isMandatory ? <span className="check-page-link-button"> * </span> : null}
              </CardLabel>
              <Dropdown
                className="form-field"
                isMandatory
                selected={selectedGp}
                option={gramPanchayats?.sort((a, b) => a.name.localeCompare(b.name))}
                select={selectGramPanchayat}
                optionKey="name"
                t={t}
              />
            </LabelFieldPair>
            {selectedGp?.name === "Other" && (
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{`${t("ES_INBOX_PLEASE_SPECIFY_GRAM_PANCHAYAT")}`} <span className="check-page-link-button"> * </span></CardLabel>
                <div className="field">
                  <TextInput id="newGp" key="newGp" value={newGp} onChange={(e) => onNewGpChange(e.target.value)} />
                </div>
              </LabelFieldPair>
            )}
            {villages.length > 0 && (
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("CS_VILLAGE_NAME")}</CardLabel>
                <Dropdown
                  className="form-field"
                  isMandatory
                  selected={selectedVillage}
                  option={villages?.sort((a, b) => a.name.localeCompare(b.name))}
                  select={selectVillage}
                  optionKey="i18nkey"
                  t={t}
                />
              </LabelFieldPair>
            )}
            {villages.length === 0 && (
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("CS_VILLAGE_NAME")}</CardLabel>
                <div className="field">
                  <TextInput id="village" key="village" value={newVillage} onChange={(e) => onChangeVillage(e.target.value)} />
                </div>
              </LabelFieldPair>
            )}
          </Wrapper>
        ) : (
          isUrcEnable && (
            <Wrapper>
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">
                  {t("CS_CREATECOMPLAINT_MOHALLA")}
                  {config.isMandatory ? <span className="check-page-link-button"> * </span> : null}
                </CardLabel>
                <Dropdown
                  className="form-field"
                  isMandatory
                  selected={selectedLocality}
                  option={fetchedLocalities?.sort((a, b) => a.name.localeCompare(b.name))}
                  select={selectLocality}
                  optionKey="name"
                  t={t}
                />
              </LabelFieldPair>
              {formData?.address?.locality?.name === "Other" && (
                <LabelFieldPair>
                  <CardLabel className="card-label-smaller">
                    {t("ES_INBOX_PLEASE_SPECIFY_LOCALITY")}
                    <span className="check-page-link-button"> * </span>
                  </CardLabel>
                  <div className="field">
                    <TextInput id="newLocality" key="newLocality" value={newLocality} onChange={(e) => onNewLocality(e.target.value)} />
                  </div>
                </LabelFieldPair>
              )}
            </Wrapper>
          )
        )}
      </Wrapper>
    );
  }
  return (
    <React.Fragment>
      <Timeline currentStep={1} flow="APPLY" />
      <FormStep
        config={config}
        onSelect={onSubmit}
        isDisabled={
          propertyLocation?.code === "WITHIN_ULB_LIMITS"
            ? selectedLocality && selectedLocality?.name === "Other" && !newLocality
            : selectedGp && selectedGp?.name === "Other" && !newGp
        }
        t={t}
      >
        {propertyLocation?.code === "WITHIN_ULB_LIMITS" ? (
          <div>
            <LabelFieldPair>
              <CardLabel className="card-label-smaller">
                {`${t("CS_CREATECOMPLAINT_MOHALLA")} *`}
                {/* {config.isMandatory ? " * " : null} */}
              </CardLabel>
              <Dropdown
                className="form-field"
                isMandatory
                selected={selectedLocality}
                option={fetchedLocalities?.sort((a, b) => a.name.localeCompare(b.name))}
                select={selectLocality}
                optionKey="name"
                t={t}
              />
            </LabelFieldPair>
            {selectedLocality?.name === "Other" && (
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{`${t("ES_INBOX_PLEASE_SPECIFY_LOCALITY")} *`}</CardLabel>
                <TextInput
                  style={{ width: "86%" }}
                  type="text"
                  id="newLocality"
                  key="newLocality"
                  value={newLocality}
                  onChange={(e) => onNewLocality(e.target.value)}
                />
              </LabelFieldPair>
            )}
          </div>
        ) : (
          <div>
            <LabelFieldPair>
              <CardLabel className="card-label-smaller">
                {`${t("CS_GRAM_PANCHAYAT")} *`}
                {/* {config.isMandatory ? " * " : null} */}
              </CardLabel>
              <Dropdown
                className="form-field"
                isMandatory
                selected={selectedGp}
                option={gramPanchayats?.sort((a, b) => a.name.localeCompare(b.name))}
                select={selectGramPanchayat}
                optionKey="i18nkey"
                t={t}
              />
            </LabelFieldPair>
            {selectedGp?.name === "Other" && (
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{`${t("ES_INBOX_PLEASE_SPECIFY_GRAM_PANCHAYAT")} *`}</CardLabel>
                <TextInput
                  style={{ width: "86%" }}
                  type="text"
                  id="newGp"
                  key="newGp"
                  value={newGp}
                  onChange={(e) => onNewGpChange(e.target.value)}
                />
              </LabelFieldPair>
            )}
            {villages.length > 0 && (
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("CS_VILLAGE_NAME")}</CardLabel>
                <Dropdown
                  className="form-field"
                  isMandatory
                  selected={selectedVillage}
                  option={villages?.sort((a, b) => a.name.localeCompare(b.name))}
                  select={selectVillage}
                  optionKey="i18nkey"
                  t={t}
                />
              </LabelFieldPair>
            )}
            {villages.length === 0 && (
              <LabelFieldPair>
                <CardLabel className="card-label-smaller">{t("CS_VILLAGE_NAME")}</CardLabel>
                <TextInput
                  style={{ width: "86%" }}
                  type="text"
                  id="village"
                  key="village"
                  value={newVillage}
                  onChange={(e) => onChangeVillage(e.target.value)}
                />
              </LabelFieldPair>
            )}
          </div>
        )}
      </FormStep>
    </React.Fragment>
  );
};

export default SelectLocalityOrGramPanchayat;
