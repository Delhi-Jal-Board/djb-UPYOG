import React, { useState, useEffect } from "react";
import {
  LabelFieldPair,
  TextInput,
  LinkButton,
  Toast,
  StatusTable,
  Row,
  Card,
  Label,
  Dropdown,
  CollapsibleCardPage,
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import { useLocation, Link, useHistory } from "react-router-dom";

const getAddress = (address, t, property) => {
  if (!address && !property) return "";
  const addrObj = typeof address === "object" && address !== null ? address : {};
  const propAddr = property?.address || {};
  const addDetails = property?.additionalDetails || property?.address?.additionalDetails || {};

  const parts = [];

  // 1. House No / Door No
  const houseNo =
    addrObj?.doorNo ||
    addrObj?.houseNo ||
    addrObj?.houseDoorNo ||
    propAddr?.doorNo ||
    propAddr?.houseNo ||
    propAddr?.houseDoorNo ||
    property?.doorNo ||
    property?.houseNo ||
    "";
  if (houseNo && String(houseNo).trim() && String(houseNo).trim() !== "NA") {
    parts.push(String(houseNo).trim());
  }

  // 2. Building / Colony Name
  const building =
    addrObj?.buildingName ||
    addrObj?.buildingColonyName ||
    propAddr?.buildingName ||
    propAddr?.buildingColonyName ||
    property?.buildingName ||
    "";
  if (building && String(building).trim() && String(building).trim() !== "NA") {
    parts.push(String(building).trim());
  }

  // 3. Street / Street Name / AddressLine1
  const street =
    addrObj?.street ||
    addrObj?.streetName ||
    addrObj?.addressLine1 ||
    propAddr?.street ||
    propAddr?.streetName ||
    propAddr?.addressLine1 ||
    property?.street ||
    property?.addressLine1 ||
    "";
  if (street && String(street).trim() && String(street).trim() !== "NA") {
    parts.push(String(street).trim());
  }

  // 4. AddressLine2
  const addressLine2 =
    addrObj?.addressLine2 ||
    propAddr?.addressLine2 ||
    property?.addressLine2 ||
    "";
  if (addressLine2 && String(addressLine2).trim() && String(addressLine2).trim() !== "NA") {
    parts.push(String(addressLine2).trim());
  }

  // 5. Landmark
  const landmark =
    addrObj?.landmark ||
    addrObj?.landmarkName ||
    propAddr?.landmark ||
    propAddr?.landmarkName ||
    property?.landmark ||
    "";
  if (landmark && String(landmark).trim() && String(landmark).trim() !== "NA") {
    parts.push(String(landmark).trim());
  }

  // 6. Locality
  const tenantId =
    addrObj?.tenantId ||
    propAddr?.tenantId ||
    property?.tenantId ||
    Digit.ULBService.getCurrentTenantId();
  const localityRaw = addrObj?.locality || propAddr?.locality || property?.locality;
  const localityCode = localityRaw?.code || (typeof localityRaw === "string" ? localityRaw : null);

  let localityText = "";
  if (localityCode && Digit.Utils?.pt?.getMohallaLocale) {
    const locLocale = Digit.Utils.pt.getMohallaLocale(localityCode, tenantId);
    localityText = t ? t(locLocale) : locLocale;
  }
  if (!localityText || localityText === localityCode) {
    localityText = localityRaw?.name || localityRaw?.code || "";
  }
  if (localityText && String(localityText).trim() && String(localityText).trim() !== "NA") {
    parts.push(String(localityText).trim());
  }

  // 7. Assembly
  const assemblyVal =
    addrObj?.assembly ||
    addrObj?.Assembly ||
    addrObj?.actualAssembly ||
    addrObj?.additionalDetails?.assembly ||
    propAddr?.assembly ||
    propAddr?.Assembly ||
    propAddr?.actualAssembly ||
    addDetails?.assembly ||
    property?.assembly ||
    "";
  const assemblyText = typeof assemblyVal === "object" ? assemblyVal?.name || assemblyVal?.code || "" : String(assemblyVal || "");
  if (assemblyText && assemblyText.trim() && assemblyText.trim() !== "NA") {
    parts.push(assemblyText.trim());
  }

  // 8. Zone
  const zoneVal =
    addrObj?.zone ||
    addrObj?.Zone ||
    addrObj?.actualZone ||
    addrObj?.additionalDetails?.zone ||
    propAddr?.zone ||
    propAddr?.Zone ||
    propAddr?.actualZone ||
    addDetails?.zone ||
    property?.zone ||
    "";
  const zoneText = typeof zoneVal === "object" ? zoneVal?.name || zoneVal?.code || "" : String(zoneVal || "");
  if (zoneText && zoneText.trim() && zoneText.trim() !== "NA") {
    parts.push(zoneText.trim());
  }

  // 9. Ward
  const wardVal =
    addrObj?.ward ||
    addrObj?.Ward ||
    addrObj?.block ||
    addrObj?.Block ||
    addrObj?.actualWard ||
    addrObj?.additionalDetails?.ward ||
    addrObj?.additionalDetails?.block ||
    propAddr?.ward ||
    propAddr?.Ward ||
    propAddr?.block ||
    propAddr?.Block ||
    propAddr?.actualWard ||
    addDetails?.ward ||
    property?.ward ||
    "";
  const wardText = typeof wardVal === "object" ? wardVal?.name || wardVal?.code || "" : String(wardVal || "");
  if (wardText && wardText.trim() && wardText.trim() !== "NA") {
    parts.push(wardText.trim());
  }

  // 10. City
  let cityText = "";
  if (tenantId && Digit.Utils?.pt?.getCityLocale) {
    const cityLocale = Digit.Utils.pt.getCityLocale(tenantId);
    cityText = t ? t(cityLocale) : cityLocale;
  }
  if (!cityText || cityText === tenantId) {
    cityText = addrObj?.city || propAddr?.city || tenantId || "";
  }
  if (cityText && String(cityText).trim() && String(cityText).trim() !== "NA") {
    parts.push(String(cityText).trim());
  }

  // 11. Pincode
  const pincode =
    addrObj?.pincode ||
    addrObj?.pinCode ||
    propAddr?.pincode ||
    propAddr?.pinCode ||
    property?.pincode ||
    "";
  if (pincode && String(pincode).trim() && String(pincode).trim() !== "NA") {
    parts.push(String(pincode).trim());
  }

  // Deduplicate parts case-insensitively while preserving order
  const uniqueParts = [];
  parts.forEach((p) => {
    if (p && !uniqueParts.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
      uniqueParts.push(p);
    }
  });

  return uniqueParts.join(", ");
};

const PropertySearchNSummary = ({ config, onSelect, userType, formData, setError, formState, clearErrors }) => {
  const { t } = useTranslation();
  const history = useHistory();
  let { pathname, state } = useLocation();
  state = state && (typeof state === "string" || state instanceof String) ? JSON.parse(state) : state;
  const isEditScreen = pathname.includes("/modify-application/");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const isEmpNewApplication = window.location.href.includes("/employee/tl/new-application");
  const isEmpRenewLicense =
    window.location.href.includes("/employee/tl/renew-application-details") || window.location.href.includes("/employee/tl/edit-application-details");
  const search = useLocation().search;
  const urlPropertyId = new URLSearchParams(search).get("propertyId");
  const [propertyId, setPropertyId] = useState(formData?.cptId?.id || (urlPropertyId !== "null" ? urlPropertyId : "") || "");
  const [searchPropertyId, setSearchPropertyId] = useState(urlPropertyId !== "null" ? urlPropertyId : "");
  const [mobileNumber, setMobileNumber] = useState("");
  const [searchMobileNumber, setSearchMobileNumber] = useState("");
  const [showToast, setShowToast] = useState(null);
  const isMobile = window.Digit.Utils.browser.isMobile();

  const userMobileNumber = Digit.UserService.getUser()?.info?.mobileNumber;
  const isCitizen = Digit.UserService.getUser()?.info?.type === "CITIZEN";
  const isWsApplication = window.location.href.includes("/ws/");

  const [selectedProperty, setSelectedProperty] = useState(formData?.cpt?.details || null);

  const searchFilters =
    searchPropertyId
      ? { propertyIds: searchPropertyId }
      : isCitizen && isWsApplication
      ? { mobileNumber: userMobileNumber }
      : searchMobileNumber
      ? { mobileNumber: searchMobileNumber }
      : {};

  const { isLoading, isError, error, data: propertyDetails } = Digit.Hooks.pt.usePropertySearch(
    { filters: searchFilters, tenantId: tenantId },
    {
      filters: searchFilters,
      tenantId: tenantId,
      enabled:
        searchPropertyId
          ? true
          : (isCitizen && isWsApplication && userMobileNumber) ||
            (!isCitizen && (searchPropertyId || searchMobileNumber)) ||
            (isCitizen && !isWsApplication && (searchPropertyId || searchMobileNumber))
          ? true
          : false,
      privacy: Digit.Utils.getPrivacyObject(),
    }
  );

  useEffect(() => {
    if (propertyId && (window.location.href.includes("/renew-application-details/") || window.location.href.includes("/edit-application-details/")))
      setSearchPropertyId(propertyId);
  }, [propertyId]);

  useEffect(() => {
    if (isLoading == false && error && error == true) {
      setShowToast({ error: true, label: "PT_ENTER_VALID_PROPERTY_ID" });
    }
  }, [error, propertyDetails]);

  useEffect(() => {
    const currentCptId = formData?.cpt?.details?.propertyId;
    if (propertyDetails?.Properties?.length > 0) {
      if (urlPropertyId && (!selectedProperty || selectedProperty.propertyId !== urlPropertyId)) {
        const matchingProp = propertyDetails.Properties.find(p => p.propertyId === urlPropertyId);
        if (matchingProp) {
          setSelectedProperty(matchingProp);
          if (currentCptId !== urlPropertyId) {
            onSelect("cpt", { details: matchingProp });
            sessionStorage.setItem("Digit_FSM_PT", JSON.stringify(matchingProp));
            localStorage.setItem("pgrProperty", JSON.stringify(matchingProp));
          }
          return;
        }
      }

      if (propertyDetails.Properties.length === 1 && !selectedProperty) {
        const fetchedId = propertyDetails.Properties[0].propertyId;
        setSelectedProperty(propertyDetails.Properties[0]);
        if (currentCptId !== fetchedId) {
          onSelect("cpt", { details: propertyDetails.Properties[0] });
          sessionStorage.setItem("Digit_FSM_PT", JSON.stringify(propertyDetails.Properties[0]));
          localStorage.setItem("pgrProperty", JSON.stringify(propertyDetails.Properties[0]));
        }
      }
    }
  }, [propertyDetails, pathname, isCitizen, isWsApplication, formData?.cpt?.details?.propertyId, urlPropertyId, selectedProperty]);

  const searchProperty = () => {
    if (!propertyId && !mobileNumber) {
      setShowToast({ error: true, label: "PT_ENTER_PROPERTY_ID_OR_MOBILE_NUMBER" });
      return;
    }
    setSearchPropertyId(propertyId);
    setSearchMobileNumber(mobileNumber);
    if (propertyId) {
      if (window.location.pathname.includes("/tl/new-application")) {
        history.push(`/digit-ui/employee/tl/new-application?propertyId=${propertyId}`);
        const scrollConst = 1600;
        setTimeout(() => window.scrollTo(0, scrollConst), 0);
      } else if (window.location.pathname.includes("/ws/new-application"))
        history.push(`/digit-ui/employee/ws/new-application?propertyId=${propertyId}`);
    }
  };

  const clearSearch = () => {
    setPropertyId("");
    setSearchPropertyId("");
    setMobileNumber("");
    setSearchMobileNumber("");
    setSelectedProperty(null);
    onSelect(config?.key, { id: "" });
    onSelect("cpt", null);
  };

  if (isEditScreen) {
    return <React.Fragment />;
  }

  const redirectBackUrl = window.location.pathname;

  let propertyAddress = "";

  const activeProperty = selectedProperty ? selectedProperty : propertyDetails?.Properties?.length === 1 ? propertyDetails?.Properties[0] : null;

  if (activeProperty) {
    propertyAddress = getAddress(activeProperty?.address, t, activeProperty);
  }

  const getInputStyles = () => {
    if (window.location.href.includes("/ws/")) {
      return { fontWeight: "700" };
    } else return {};
  };

  const getOwnerNames = (propertyData) => {
    const getActiveOwners = propertyData?.owners?.filter((owner) => owner?.active);
    const getOwnersList = getActiveOwners
      ?.sort((a, b) => a?.additionalDetails?.ownerSequence - b?.additionalDetails?.ownerSequence)
      ?.map((activeOwner) => activeOwner?.name)
      ?.join(",");
    return getOwnersList ? getOwnersList : t("NA");
  };

  let clns = "";
  if (window.location.href.includes("/ws/")) clns = ":";

  const onPropertySelect = (property) => {
    setSelectedProperty(property);
    onSelect("cpt", { details: property });
    sessionStorage.setItem("Digit_FSM_PT", JSON.stringify(property));
    localStorage.setItem("pgrProperty", JSON.stringify(property));
  };

  return (
    <React.Fragment>
      <CollapsibleCardPage title={t("PT_PROPERTY_SEARCH")} defaultOpen={true}>
        {(window.location.href.includes("/tl/")
          ? !(formData?.tradedetils?.[0]?.structureType?.code === "MOVABLE") && (isEmpNewApplication || isEmpRenewLicense)
          : true) && (
          <React.Fragment>
            {/* {isCitizen && isWsApplication ? (
              <React.Fragment>
                {!(propertyDetails?.Properties && propertyDetails?.Properties?.length > 0) && (
                  <div className="formcomposer-section-grid" style={isMobile ? {} : {}}>
                    <div style={{ marginBottom: "16px" }}>
                      <LabelFieldPair>
                        <Label style={getInputStyles()}>{`${t("PROPERTY_ID")}`}</Label>
                        <div style={{ display: "flex", gap: "12px", width: "100%", flexDirection: "column" }}>
                          {isLoading ? (
                            <div>{t("CS_COMMON_LOADING")}</div>
                          ) : (
                            <span
                              onClick={() =>
                                history.push(
                                  `/digit-ui/${userType}/${pathname.split("/")[3]}/create-application/create-property?redirectToUrl=${
                                    window.location.pathname
                                  }`,
                                  { ...state, ...formData }
                                )
                              }
                            >
                              <button className="submit-bar" type="button" style={{ color: "white" }}>
                                {t("CPT_CREATE_PROPERTY")}
                              </button>
                            </span>
                          )}
                        </div>
                      </LabelFieldPair>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px", width: "100%", alignItems: "flex-end", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <Label>{`${t("CORE_COMMON_MOBILE_NUMBER")}`}</Label>
                    <TextInput
                      value={mobileNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length <= 10) {
                          setMobileNumber(val);
                          if (val.length === 10) {
                            setSearchMobileNumber(val);
                          }
                        }
                      }}
                      style={{ width: "100%" }}
                      placeholder={`${t("PT_ENTER_MOBILE_NUMBER")}`}
                      maxLength={10}
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Label>{`${t("PROPERTY_ID")}`}</Label>
                    {isLoading ? (
                      <div>{t("CS_COMMON_LOADING")}</div>
                    ) : (
                      <Dropdown
                        option={propertyDetails?.Properties || []}
                        optionKey="propertyId"
                        id="propertyId"
                        selected={selectedProperty}
                        select={onPropertySelect}
                        t={t}
                        placeholder={t("PT_SELECT_PROPERTY")}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <button className="submit-bar" type="button" style={{ color: "white", width: "100%", margin: 0 }} onClick={clearSearch}>
                      {`${t("CLEAR")}`}
                    </button>
                  </div>

                  <div style={{ flex: 1 }}>
                    {searchMobileNumber && propertyDetails?.Properties?.length === 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ color: "#d60505", fontWeight: "bold", fontSize: "12px", lineHeight: "1" }}>No property created this number</span>
                        <span
                          onClick={() =>
                            history.push(
                              `/digit-ui/${userType}/${pathname.split("/")[3]}/create-application/create-property?redirectToUrl=${
                                window.location.pathname
                              }`,
                              { ...state, ...formData }
                            )
                          }
                        >
                          <button className="submit-bar" type="button" style={{ color: "white", width: "100%", margin: 0 }}>
                            {t("CPT_CREATE_PROPERTY")}
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )} */}

            {activeProperty ? (
              <React.Fragment>
                <Card className="card-with-background" style={{ boxShadow: "none" }}>
                  <StatusTable style={{ padding: "0", margin: "0" }}>
                    <div className="formcomposer-section-grid" style={isMobile ? {} : {}}>
                      {/* <Row
                        className="border-none"
                        labelStyle={isMobile ? { width: "40%" } : { width: "30%", color: "#505a5f", fontWeight: "600" }}
                        textStyle={{ color: "#000" }}
                        label={t(`PROPERTY_ID`)}
                        text={activeProperty?.propertyId}
                      /> */}
                      <Row
                        className="border-none"
                        labelStyle={isMobile ? { width: "40%" } : { width: "30%", color: "#505a5f", fontWeight: "600" }}
                        textStyle={{ color: "#000" }}
                        label={t(`OWNER_NAME`)}
                        text={getOwnerNames(activeProperty)}
                      />
                      <Row
                        className="border-none"
                        labelStyle={isMobile ? { width: "40%" } : { width: "30%", color: "#505a5f", fontWeight: "600" }}
                        textStyle={{ wordBreak: "break-word", color: "#000" }}
                        label={t(`PROPERTY_ADDRESS`)}
                        text={propertyAddress}
                        privacy={{
                          uuid: activeProperty?.owners?.[0]?.uuid,
                          fieldName: ["doorNo", "street", "landmark"],
                          model: "Property",
                          showValue: true,
                          loadData: {
                            serviceName: "/property-services/property/_search",
                            requestBody: {},
                            requestParam: {
                              tenantId: activeProperty?.tenantId,
                              propertyIds: activeProperty?.propertyId,
                            },
                            jsonPath: "Properties[0].address.street",
                            d: (res) => {
                              const prop = _.get(res, "Properties[0]");
                              return getAddress(prop?.address, t, prop);
                            },
                            isArray: false,
                          },
                        }}
                      />
                    </div>
                  </StatusTable>
                </Card>
              </React.Fragment>
            ) : null}
            {showToast && (
              <Toast
                isDleteBtn={true}
                labelstyle={{ width: "100%" }}
                error={showToast.error}
                warning={showToast.warning}
                label={t(showToast.label)}
                onClose={() => {
                  setShowToast(null);
                }}
              />
            )}
          </React.Fragment>
        )}
      </CollapsibleCardPage>
    </React.Fragment>
  );
};

export default PropertySearchNSummary;
